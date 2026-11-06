/**
 * Damage function: "cookie-cutter", as in Lawrence (2026)'s standard reductionist
 * analysis and the SSKP formula of Davis & Schilling (1973). A detonation destroys a
 * hardened silo with probability 1 if it lands within the lethal radius LR, else 0:
 *   P(kill | d) = 1 if d ≤ LR, otherwise 0
 * Integrating this over the circular Gaussian gives SSKP = 1 − 0.5^((LR/CEP)²).
 */
import type { Rng } from '@/sim/rng'

/** Swappable damage model. */
export interface DamageFunction {
  /** Beyond this distance (metres) kill probability is zero; sizes the spatial index. */
  maxRangeM: number
  /** Probability that a detonation at distance `d` metres destroys the silo. */
  killProbability(d: number): number
}

export function cookieCutter(lethalRadiusM: number): DamageFunction {
  return {
    maxRangeM: lethalRadiusM,
    killProbability: (d) => (d <= lethalRadiusM ? 1 : 0),
  }
}

/** Resolve a kill, drawing randomness only for fractional probabilities. */
export function rollKill(p: number, rng: Rng): boolean {
  if (p >= 1) return true
  if (p <= 0) return false
  return rng.bernoulli(p)
}

// TODO(extension): a graded damage function such as the "Sigma-20" function Davis &
// Schilling mention as an alternative to cookie-cutter. Implement DamageFunction with
// a smooth killProbability(d) and a finite maxRangeM, then select it in engine.ts.
