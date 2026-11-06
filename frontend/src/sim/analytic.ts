/**
 * Analytic model: Lawrence (2026) "standard reductionist analysis", with the
 * reprogramming variant of Davis & Schilling (1973).
 *
 *   SSKP      = 1 − 0.5^((LR / CEP)²)                     (both papers)
 *   OAR       = R_del · R_wh                               (Lawrence Table 1; D&S)
 *   TKP       = R_del · R_wh · SSKP                        (no reprogramming)
 *   TKP       = R_wh · SSKP                                (reprogramming: D&S
 *                                                           "nonreprogrammable reliability")
 *   A         = N                                          (no reprogramming)
 *   A         = N · R_del  (expected available warheads)   (reprogramming, D&S)
 *   Pkill(n)  = 1 − (1 − TKP)^n
 *   x̄         = Σ_targets (1 − Pkill(n_i)) + untargeted silos
 */
import { evenSplit } from '@/sim/allocation'

export function sskp(lethalRadiusM: number, cepM: number): number {
  return 1 - 0.5 ** ((lethalRadiusM / cepM) ** 2)
}

export function overallReliability(
  deliveryReliability: number,
  warheadReliability: number,
): number {
  return deliveryReliability * warheadReliability
}

export interface ReliabilityParams {
  deliveryReliability: number
  warheadReliability: number
  reprogram: boolean
}

/** Terminal kill probability per allocated warhead. */
export function tkp(sskpValue: number, p: ReliabilityParams): number {
  return p.reprogram
    ? sskpValue * p.warheadReliability
    : sskpValue * p.deliveryReliability * p.warheadReliability
}

export function pKill(tkpValue: number, n: number): number {
  return 1 - (1 - tkpValue) ** n
}

/**
 * Expected warheads available for allocation. With reprogramming, boost failures are
 * replaced from reserves, so A = N · R_del (rounded to whole warheads, as in D&S's
 * 1,500 · 0.857 → 1,286 example).
 */
export function availableWarheads(n: number, p: ReliabilityParams): number {
  return p.reprogram ? Math.round(n * p.deliveryReliability) : n
}

/** x̄ for an explicit allocation: Σ (1 − TKP)^nᵢ over targets, plus untargeted silos. */
export function expectedSurvivors(
  warheadsPerTarget: Iterable<number>,
  tkpValue: number,
  untargeted = 0,
): number {
  let x = untargeted
  for (const n of warheadsPerTarget) x += 1 - pKill(tkpValue, n)
  return x
}

/** x̄ when `warheads` are split evenly over `targets` (Lawrence's reductionist allocation). */
export function evenSplitSurvivors(warheads: number, targets: number, tkpValue: number): number {
  if (targets <= 0) return 0
  if (warheads < targets) return warheads * (1 - tkpValue) + (targets - warheads)
  const { k, r } = evenSplit(warheads, targets)
  return (targets - r) * (1 - tkpValue) ** k + r * (1 - tkpValue) ** (k + 1)
}

export interface CampaignParams extends ReliabilityParams {
  cepM: number
  lethalRadiusM: number
  missilesPerVolley: number
  volleys: number
}

/**
 * Up-front "reductionist prediction" for the whole campaign, computed before any firing
 * (Lawrence 2026). Assumes perfect damage assessment and an even split each volley: volley v
 * targets the expected survivors of volley v − 1 (rounded to whole silos for the split).
 * Returns [S, x̄₁, x̄₂, …], expected silos surviving after each volley.
 */
export function reductionistPrediction(p: CampaignParams, siloCount: number): number[] {
  const t = tkp(sskp(p.lethalRadiusM, p.cepM), p)
  const a = availableWarheads(p.missilesPerVolley, p)
  const out = [siloCount]
  let remaining = siloCount
  for (let v = 0; v < p.volleys; v++) {
    const targets = Math.round(remaining)
    remaining = evenSplitSurvivors(a, targets, t)
    out.push(remaining)
  }
  return out
}
