/**
 * Kill rule, Lawrence (2026) / Davis & Schilling (1973) cookie-cutter damage applied
 * to EVERY silo, not just the aim point: a silo is destroyed if any detonation lands
 * within the damage function's range of it, e.g. a warhead aimed at a neighbour.
 *   destroyed(silo) ⇔ ∃ detonation j : rollKill(P(kill | ‖impact_j − silo‖))
 *
 * Silos are bucketed into a uniform grid with cell size = damage range, so each
 * detonation checks only its own and the 8 neighbouring cells.
 */
import { rollKill, type DamageFunction } from '@/sim/damageFunction'
import type { Rng } from '@/sim/rng'
import type { SimSilo } from '@/sim/types'

export class SiloGrid {
  private readonly silos: SimSilo[]
  private readonly cell: number
  private readonly buckets = new Map<string, number[]>()

  constructor(silos: SimSilo[], cellSizeM: number) {
    this.silos = silos
    this.cell = Math.max(cellSizeM, 1)
    silos.forEach((s, i) => {
      const key = this.key(Math.floor(s.x / this.cell), Math.floor(s.y / this.cell))
      const bucket = this.buckets.get(key)
      if (bucket) bucket.push(i)
      else this.buckets.set(key, [i])
    })
  }

  /** Indices of silos that may be within `cell` metres of (x, y). */
  *near(x: number, y: number): Generator<number> {
    const cx = Math.floor(x / this.cell)
    const cy = Math.floor(y / this.cell)
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) yield* this.buckets.get(this.key(cx + dx, cy + dy)) ?? []
  }

  distance(i: number, x: number, y: number): number {
    const s = this.silos[i]
    return s ? Math.hypot(s.x - x, s.y - y) : Infinity
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`
  }
}

/**
 * Apply one detonation at (x, y). Mutates `alive` and returns the indices it killed.
 * Callers own `alive` (a per-volley working copy), so the engine stays pure overall.
 */
export function applyDetonation(
  grid: SiloGrid,
  alive: boolean[],
  x: number,
  y: number,
  damage: DamageFunction,
  rng: Rng,
): number[] {
  const killed: number[] = []
  for (const i of grid.near(x, y)) {
    if (!alive[i]) continue
    const d = grid.distance(i, x, y)
    if (d > damage.maxRangeM) continue
    if (rollKill(damage.killProbability(d), rng)) {
      alive[i] = false
      killed.push(i)
    }
  }
  return killed
}

// TODO(extension): fratricide. Detonations here are independent and instantaneous. A
// fratricide model would let earlier detonations destroy or deflect later-arriving RVs
// (Lawrence's model is in the supplementary material, not attempted here). It would hook
// in where the engine iterates impacts in arrival order.
