/**
 * Single-shot kill probability under a circular Gaussian miss distribution and
 * a cookie-cutter kill rule: SSKP = 1 − 0.5^((LR / CEP)²).
 * The only simulation math in Phase 1; the Phase 2 engine should reuse it.
 */
export function sskp(lethalRadiusM: number, cepM: number): number {
  return 1 - 0.5 ** ((lethalRadiusM / cepM) ** 2)
}
