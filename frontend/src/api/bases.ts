/**
 * The ONLY module that knows where base data comes from.
 *
 * - VITE_API_URL set   → fetch from the FastAPI backend.
 * - VITE_API_URL unset → read /data/bases/*.json at build time via import.meta.glob,
 *                        so the app works as a pure static site.
 *
 * Either way, invalid files are skipped with a console warning (matching the backend).
 */
import type { Base, BaseSummary, DataStatus, Silo } from '@/types'

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)

export async function listBases(): Promise<BaseSummary[]> {
  if (API_URL) return getJson<BaseSummary[]>(`${API_URL}/api/bases`)
  return [...localBases().values()].map(toSummary)
}

export async function getBase(id: string): Promise<Base> {
  if (API_URL) {
    const base = parseBase(await getJson<unknown>(`${API_URL}/api/bases/${encodeURIComponent(id)}`))
    if (!base) throw new Error(`Base "${id}" from the API is malformed`)
    return base
  }
  const base = localBases().get(id)
  if (!base) throw new Error(`Base "${id}" not found in data/bases`)
  return base
}

// --- Static (no-backend) mode ------------------------------------------------

// Vite inlines every matching file into the bundle. Adding a file requires a
// dev-server reload or rebuild, but no code change.
const files = import.meta.glob<unknown>('../../../data/bases/*.json', {
  eager: true,
  import: 'default',
})

let cache: Map<string, Base> | undefined
function localBases(): Map<string, Base> {
  if (cache) return cache
  cache = new Map()
  for (const [path, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const stem =
      path
        .split('/')
        .pop()
        ?.replace(/\.json$/, '') ?? ''
    const base = parseBase(raw)
    if (!base) console.warn(`[data] Skipping ${path}: does not match the base schema`)
    else if (base.id !== stem) console.warn(`[data] Skipping ${path}: id "${base.id}" ≠ filename`)
    else cache.set(base.id, base)
  }
  return cache
}

// --- Helpers -----------------------------------------------------------------

function toSummary({ silos, ...rest }: Base): BaseSummary {
  return { ...rest, siloCount: silos.length }
}

/** Runtime shape check: JSON from disk or network is untrusted. */
function parseBase(raw: unknown): Base | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !Array.isArray(raw.silos)) return null
  const silos: Silo[] = []
  for (const s of raw.silos) {
    if (!isRecord(s) || typeof s.id !== 'string') return null
    const { lat, lon } = s
    if (typeof lat !== 'number' || typeof lon !== 'number') return null
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
    silos.push({ id: s.id, lat, lon })
  }
  if (silos.length === 0) return null
  const dataStatus: DataStatus = raw.dataStatus === 'verified' ? 'verified' : 'placeholder'
  return {
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : raw.id,
    country: typeof raw.country === 'string' ? raw.country : '',
    dataStatus,
    source: typeof raw.source === 'string' ? raw.source : '',
    silos,
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return (await res.json()) as T
}

/** Accepts "https://x.onrender.com/", "x.onrender.com", or "" (→ static mode). */
function normalizeApiUrl(raw: string | undefined): string | null {
  const v = raw?.trim().replace(/\/+$/, '')
  if (!v) return null
  return /^https?:\/\//.test(v) ? v : `https://${v}`
}

export const dataMode: 'api' | 'static' = API_URL ? 'api' : 'static'
