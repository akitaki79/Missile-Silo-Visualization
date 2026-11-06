import { describe, expect, it } from 'vitest'
import { centroidOf, toLocal } from '@/sim/projection'

/** Every base file: silo ids unique, and silos ≥ 1 km apart (no duplicated coordinates). */
const files = import.meta.glob<{ id: string; silos: { id: string; lat: number; lon: number }[] }>(
  '../../../../data/bases/*.json',
  { eager: true, import: 'default' },
)

const MIN_SPACING_M = 1000

describe.each(Object.entries(files))('%s', (_path, base) => {
  it('has unique silo ids', () => {
    const ids = base.silos.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it(`has silos at least ${MIN_SPACING_M} m apart`, () => {
    const o = centroidOf(base.silos)
    const pts = base.silos.map((s) => ({ id: s.id, ...toLocal(s.lat, s.lon, o) }))
    const tooClose: string[] = []
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]!
        const b = pts[j]!
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < MIN_SPACING_M) tooClose.push(`${a.id}–${b.id} (${d.toFixed(0)} m)`)
      }
    expect(tooClose).toEqual([])
  })
})
