/**
 * Batch Monte Carlo: Lawrence (2026) reports outcomes as means ± standard deviations over
 * many trials. Each trial runs the full multi-volley campaign (engine.ts) with an
 * independent seed derived from the base seed, and we summarise silos surviving after
 * each volley:
 *   mean = Σx / T,   SD = √(Σ(x − mean)² / (T − 1)),   SE = SD / √T
 */
import { initSim, restartSim, runVolley } from '@/sim/engine'
import { deriveSeed } from '@/sim/rng'
import type { SimParams, SimSiloInput } from '@/sim/types'

export interface SummaryStats {
  mean: number
  sd: number
  se: number
  min: number
  max: number
}

export interface BatchResult {
  trials: number
  /** Index v − 1 → stats for silos surviving after volley v. */
  survivorsByVolley: SummaryStats[]
  /** Survivors after the final volley → number of trials. Sorted by survivors. */
  finalHistogram: { survivors: number; count: number }[]
  /** Mean delivery / warhead failures per volley across all trials. */
  meanDeliveryFailures: number
  meanWarheadFailures: number
}

export function runBatch(
  silos: SimSiloInput[],
  params: SimParams,
  trials: number,
  onProgress?: (done: number) => void,
): BatchResult {
  const base = initSim(silos, params)
  const survivors: number[][] = Array.from({ length: params.volleys }, () => [])
  let deliveryFailures = 0
  let warheadFailures = 0

  for (let t = 0; t < trials; t++) {
    let s = restartSim(base, deriveSeed(params.seed, t))
    for (const bucket of survivors) {
      s = runVolley(s, { recordImpacts: false })
      const r = s.volleys[s.volleys.length - 1]
      if (!r) break
      bucket.push(r.surviving)
      deliveryFailures += r.deliveryFailures
      warheadFailures += r.warheadFailures
    }
    if (onProgress && (t + 1) % 50 === 0) onProgress(t + 1)
  }

  const final = survivors[params.volleys - 1] ?? []
  const counts = new Map<number, number>()
  for (const x of final) counts.set(x, (counts.get(x) ?? 0) + 1)
  const volleysFired = trials * params.volleys || 1

  return {
    trials,
    survivorsByVolley: survivors.map(summarize),
    finalHistogram: [...counts.entries()]
      .map(([survivors, count]) => ({ survivors, count }))
      .sort((a, b) => a.survivors - b.survivors),
    meanDeliveryFailures: deliveryFailures / volleysFired,
    meanWarheadFailures: warheadFailures / volleysFired,
  }
}

export function summarize(xs: number[]): SummaryStats {
  const n = xs.length
  if (n === 0) return { mean: 0, sd: 0, se: 0, min: 0, max: 0 }
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const variance = n > 1 ? xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1) : 0
  const sd = Math.sqrt(variance)
  return { mean, sd, se: sd / Math.sqrt(n), min: Math.min(...xs), max: Math.max(...xs) }
}
