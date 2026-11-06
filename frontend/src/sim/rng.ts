/**
 * Seeded randomness for Monte Carlo sampling. Not from either paper; standard methods:
 *   - mulberry32: 32-bit PRNG, uniform on [0, 1).
 *   - Box–Muller: two uniforms → two independent N(0, 1) draws, used for the
 *     per-axis miss components of the circular Gaussian in Davis & Schilling (1973)
 *     and Lawrence (2026).
 *
 * The state is a single uint32, so a run can be stored in SimState and resumed exactly.
 */

export class Rng {
  private s: number

  constructor(state: number) {
    this.s = state >>> 0
  }

  /** Current state; pass to `new Rng(state)` to resume the sequence. */
  get state(): number {
    return this.s
  }

  /** Uniform on [0, 1). */
  uniform(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Two independent standard normal draws (Box–Muller). */
  normalPair(): [number, number] {
    const u1 = 1 - this.uniform() // (0, 1], so log() is finite
    const u2 = this.uniform()
    const r = Math.sqrt(-2 * Math.log(u1))
    const theta = 2 * Math.PI * u2
    return [r * Math.cos(theta), r * Math.sin(theta)]
  }

  /** True with probability p. */
  bernoulli(p: number): boolean {
    return this.uniform() < p
  }
}

/** Independent, reproducible seed for Monte Carlo trial `index` of a batch. */
export function deriveSeed(seed: number, index: number): number {
  const rng = new Rng((seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0)
  rng.uniform()
  return rng.state
}
