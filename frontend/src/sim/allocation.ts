/**
 * Even allocation of warheads to targets: Davis & Schilling (1973) and Lawrence (2026)
 * both spread A warheads as evenly as possible over S targets:
 *   k = ⌊A / S⌋ warheads on every target, and one extra on r = A mod S targets.
 * If A < S, A targets get one warhead each and S − A go untargeted.
 *
 * The simulation picks which targets get the extra warhead at random; the analytic
 * model only needs the counts (`evenSplit`).
 */
import type { Rng } from '@/sim/rng'

/** Counts only: (S − r) targets get k, r targets get k + 1. */
export function evenSplit(warheads: number, targets: number): { k: number; r: number } {
  if (targets <= 0) return { k: 0, r: 0 }
  return { k: Math.floor(warheads / targets), r: warheads % targets }
}

/**
 * Assign `warheads` to `targets` (silo indices). Returns warheads per target index;
 * targets that get none are omitted.
 */
export function allocateEvenly(targets: number[], warheads: number, rng: Rng): Map<number, number> {
  const out = new Map<number, number>()
  if (targets.length === 0 || warheads <= 0) return out
  const { k, r } = evenSplit(warheads, targets.length)
  const extra = new Set(sampleWithoutReplacement(targets.length, r, rng))
  targets.forEach((t, i) => {
    const n = k + (extra.has(i) ? 1 : 0)
    if (n > 0) out.set(t, n)
  })
  return out
}

/** `m` distinct indices from [0, n), via a partial Fisher–Yates shuffle. */
function sampleWithoutReplacement(n: number, m: number, rng: Rng): number[] {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = 0; i < m; i++) {
    const j = i + Math.floor(rng.uniform() * (n - i))
    const tmp = idx[i] as number
    idx[i] = idx[j] as number
    idx[j] = tmp
  }
  return idx.slice(0, m)
}
