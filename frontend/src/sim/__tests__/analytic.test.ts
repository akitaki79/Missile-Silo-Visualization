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

describe('lethal radius from yield & hardness (Davis & Schilling)', () => {
  it('100 kt vs 2,000 psi ≈ 169 m', () => {
    expect(lethalRadiusM(100, 2000)).toBeCloseTo(169, 0)
    expect(lethalRadiusNm(0.1, 2000) * 1852).toBeCloseTo(lethalRadiusM(100, 2000), 9)
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
