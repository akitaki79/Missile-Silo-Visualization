import { describe, expect, it } from 'vitest'
import {
  availableWarheads,
  evenSplitSurvivors,
  overallReliability,
  pKill,
  reductionistPrediction,
  sskp,
  tkp,
} from '@/sim/analytic'
import { lethalRadiusM, lethalRadiusNm } from '@/sim/lethalRadius'

describe('SSKP / TKP: Lawrence (2026) Table 3', () => {
  it('W76: SSKP(179 m, 90 m) = 0.9356, TKP = 0.8443 at R_del = R_wh = 0.95', () => {
    const s = sskp(179, 90)
    expect(s).toBeCloseTo(0.9356, 4)
    expect(
      tkp(s, { deliveryReliability: 0.95, warheadReliability: 0.95, reprogram: false }),
    ).toBeCloseTo(0.8443, 3)
  })

  it('W88: SSKP(296 m, 90 m) = 0.9994', () => {
    expect(sskp(296, 90)).toBeCloseTo(0.9994, 4)
  })
})

describe('Davis & Schilling (1973) worked examples', () => {
  // RR (reprogrammable / delivery) 0.857 × NRR (nonreprogrammable / warhead) 0.902 = OAR 0.773
  const rel = { deliveryReliability: 0.857, warheadReliability: 0.902 }
  const S = 1000
  const N = 1500
  const SSKP = 0.94

  it('SSKP(LR 0.626 nm, CEP 0.25 nm) = 0.987', () => {
    expect(sskp(0.626, 0.25)).toBeCloseTo(0.987, 3)
  })

  it('OAR = RR · NRR = 0.773', () => {
    expect(overallReliability(rel.deliveryReliability, rel.warheadReliability)).toBeCloseTo(
      0.773,
      3,
    )
  })

  // The paper prints 827 and 884: it rounds each term (463 + 364; 278 + 606) and uses
  // 1,285 available warheads (1,500 × 0.857 truncated). Unrounded, the totals are 826 and 885.
  it('no reprogramming: 1,500 RVs on 1,000 targets → TKP 0.727, Pkill(2) 0.925, ≈826 destroyed', () => {
    const p = { ...rel, reprogram: false }
    const t = tkp(SSKP, p)
    expect(t).toBeCloseTo(0.727, 3)
    expect(pKill(t, 2)).toBeCloseTo(0.925, 3)
    expect(availableWarheads(N, p)).toBe(1500)
    expect(Math.round(S - evenSplitSurvivors(N, S, t))).toBe(826)
  })

  it('with reprogramming: 1,286 available RVs, TKP 0.848, ≈885 destroyed', () => {
    const p = { ...rel, reprogram: true }
    const a = availableWarheads(N, p)
    const t = tkp(SSKP, p)
    expect(a).toBe(1286)
    expect(t).toBeCloseTo(0.848, 3)
    expect(Math.round(S - evenSplitSurvivors(a, S, t))).toBe(885)
  })
})

describe('Davis & Schilling (1973): reconstruction of Wohlstetter, 1,000 silos at 300 psi', () => {
  // D&S p. 224 compute these with SSKP = 1 − .5^(6·Y^⅔ / (H^⅔·CEP²)), i.e. the truncated LR
  // formula with coefficient √6 ≈ 2.4495. CEP 0.25 nm.
  const truncatedLrNm = (yieldMt: number, psi: number) =>
    (Math.sqrt(6) * Math.cbrt(yieldMt)) / Math.cbrt(psi)
  const S = 1000
  const destroyed = (n: number, p: Parameters<typeof tkp>[1], yieldMt: number) => {
    const s = sskp(truncatedLrNm(yieldMt, 300), 0.25)
    const a = availableWarheads(n, p)
    return { s, a, killed: Math.round(S - evenSplitSurvivors(a, S, tkp(s, p))) }
  }
  // OAR 0.75 with no reprogramming; RR 0.834 × NRR 0.9 with reprogramming.
  const noRep = { deliveryReliability: 1, warheadReliability: 0.75, reprogram: false }
  const rep = { deliveryReliability: 0.834, warheadReliability: 0.9, reprogram: true }

  it('case 1: 1,500 × 5 MT, SSKP 0.987 → 836 destroyed', () => {
    const r = destroyed(1500, noRep, 5)
    expect(r.s).toBeCloseTo(0.987, 3)
    expect(r.killed).toBe(836)
  })
  it('case 2: 3,000 × 1 MT, SSKP 0.773 → 926 destroyed', () => {
    const r = destroyed(3000, noRep, 1)
    expect(r.s).toBeCloseTo(0.773, 3)
    expect(r.killed).toBe(926)
  })
  it('case 3 (reprogramming): 1,251 available → 913 destroyed', () => {
    const r = destroyed(1500, rep, 5)
    expect(r.a).toBe(1251)
    expect(r.killed).toBe(913)
  })
  it('case 4 (reprogramming): 2,502 available → 940 destroyed', () => {
    const r = destroyed(3000, rep, 1)
    expect(r.a).toBe(2502)
    expect(r.killed).toBe(940)
  })
  it('Rathjens: 2,000 RVs, SSKP 0.685, OAR 0.75 → 764 destroyed', () => {
    const t = tkp(0.685, noRep)
    expect(Math.round(S - evenSplitSurvivors(2000, S, t))).toBe(764)
  })
})

describe('lethal radius from yield & hardness (Davis & Schilling p. 213)', () => {
  it('5 MT vs 300 psi: truncated first term = 0.626 nm (3,806 ft)', () => {
    expect((2.45 * Math.cbrt(5)) / Math.cbrt(300)).toBeCloseTo(0.626, 3)
  })

  it("inverts Brode's overpressure: ΔP at the returned LR equals the hardness", () => {
    // ΔP = 3300·Y/R³ + 192·√Y/R^(3/2), Y in MT, R in kilofeet (D&S note 9); 1 nm = 6,080 ft.
    const brodePsi = (yieldMt: number, rNm: number) => {
      const r = rNm * 6.08
      return (3300 * yieldMt) / r ** 3 + (192 * Math.sqrt(yieldMt)) / r ** 1.5
    }
    for (const [y, h] of [
      [0.1, 2000],
      [5, 300],
      [1, 50],
    ] as const) {
      // 0.5% tolerance: the paper rounds its coefficients to three figures.
      expect(brodePsi(y, lethalRadiusNm(y, h)) / h).toBeCloseTo(1, 2)
    }
  })

  it('100 kt vs 2,000 psi ≈ 171 m', () => {
    expect(lethalRadiusM(100, 2000)).toBeCloseTo(171.4, 0)
    expect(lethalRadiusNm(0.1, 2000) * 1852).toBeCloseTo(lethalRadiusM(100, 2000), 9)
  })

  it("Lawrence's 179 m (W76) and 296 m (W88) match D&S's GE formula for H > 1,000 psi", () => {
    const geNm = (yieldMt: number, psi: number) => (2.62 * Math.cbrt(yieldMt)) / Math.cbrt(psi)
    expect(geNm(0.1, 2000) * 1852).toBeCloseTo(179, 0)
    expect(geNm(0.455, 2000) * 1852).toBeCloseTo(296, 0)
  })
})

describe('evenSplitSurvivors', () => {
  it('leaves untargeted silos alive when warheads < targets', () => {
    expect(evenSplitSurvivors(3, 10, 1)).toBe(7)
  })
  it('equals the explicit allocation sum', () => {
    // 25 on 10: 5 targets get 3, 5 get 2
    const t = 0.6
    expect(evenSplitSurvivors(25, 10, t)).toBeCloseTo(5 * 0.4 ** 3 + 5 * 0.4 ** 2, 12)
  })
})

describe('reductionistPrediction', () => {
  it('starts at S and applies an even split to the expected survivors each volley', () => {
    const p = {
      cepM: 90,
      lethalRadiusM: 179,
      missilesPerVolley: 240,
      volleys: 2,
      deliveryReliability: 0.95,
      warheadReliability: 0.95,
      reprogram: false,
    }
    const t = tkp(sskp(179, 90), p)
    const pred = reductionistPrediction(p, 120)
    expect(pred).toHaveLength(3)
    expect(pred[0]).toBe(120)
    expect(pred[1]).toBeCloseTo(evenSplitSurvivors(240, 120, t), 12)
    expect(pred[2]).toBeCloseTo(evenSplitSurvivors(240, Math.round(pred[1]!), t), 12)
  })
})
