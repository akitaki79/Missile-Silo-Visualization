/**
 * Miss distribution: circular Gaussian, as assumed by both Davis & Schilling (1973)
 * and Lawrence (2026). CEP is the radius containing 50% of impacts, so the per-axis
 * standard deviation is
 *   σ = CEP / √(2 ln 2) ≈ CEP / 1.1774
 * and each impact is aim + (dx, dy) with dx, dy ~ N(0, σ) independently.
 */
import type { Rng } from '@/sim/rng'

/** Swappable miss model: returns the impact offset (metres) from the aim point. */
export interface MissDistribution {
  sample(rng: Rng): { dx: number; dy: number }
}

export const CEP_TO_SIGMA = Math.sqrt(2 * Math.LN2)

export function gaussianMiss(cepM: number): MissDistribution {
  const sigma = cepM / CEP_TO_SIGMA
  return {
    sample(rng) {
      const [a, b] = rng.normalPair()
      return { dx: a * sigma, dy: b * sigma }
    },
  }
}

// TODO(extension): non-Gaussian miss distributions, e.g. a fat-tailed mixture or a
// bias term. Lawrence's fat-tail model is in the paper's supplementary material and
// is not implemented here. Add an implementation of MissDistribution and select it
// in engine.ts → missFor().
