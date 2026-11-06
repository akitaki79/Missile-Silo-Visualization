/**
 * Lethal radius from yield and hardness: Davis & Schilling (1973).
 *   LR[nm] = (2.45 · Y^(1/3) / H^(1/3)) · ( √(1 + 2.79/H + 1.67/H^(1/2)) )^(2/3)
 * with Y in megatons and H in psi; 1 nm = 1852 m.
 *
 * Gives ≈169 m for 100 kt against 2,000 psi, whereas Lawrence (2026) uses 179 m for the
 * W76. Sources differ, so the UI keeps LR as a direct input and offers this as a helper.
 */

export const METERS_PER_NM = 1852

export function lethalRadiusNm(yieldMt: number, hardnessPsi: number): number {
  const h = hardnessPsi
  const base = (2.45 * Math.cbrt(yieldMt)) / Math.cbrt(h)
  const correction = Math.sqrt(1 + 2.79 / h + 1.67 / Math.sqrt(h)) ** (2 / 3)
  return base * correction
}

export function lethalRadiusM(yieldKt: number, hardnessPsi: number): number {
  return lethalRadiusNm(yieldKt / 1000, hardnessPsi) * METERS_PER_NM
}
