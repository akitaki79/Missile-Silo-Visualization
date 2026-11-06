import { describe, expect, it } from 'vitest'
import { allocateEvenly } from '@/sim/allocation'
import { evenSplitSurvivors, sskp, tkp } from '@/sim/analytic'
import { runBatch } from '@/sim/batch'
import { cookieCutter } from '@/sim/damageFunction'
import { initSim, runCampaign, runVolley } from '@/sim/engine'
import { applyDetonation, SiloGrid } from '@/sim/killRule'
import { gaussianMiss } from '@/sim/missDistribution'
import { toLatLon } from '@/sim/projection'
import { Rng } from '@/sim/rng'
import type { SimParams, SimSilo, SimSiloInput } from '@/sim/types'

const ORIGIN = { lat: 40, lon: 96 }

/** `n` silos on a square grid `spacingM` apart (far enough that cross-kills can't happen). */
function gridSilos(n: number, spacingM = 10_000): SimSiloInput[] {
  const side = Math.ceil(Math.sqrt(n))
  return Array.from({ length: n }, (_, i) => ({
    id: `S${i}`,
    ...toLatLon((i % side) * spacingM, Math.floor(i / side) * spacingM, ORIGIN),
  }))
}

const PARAMS: SimParams = {
  cepM: 90,
  lethalRadiusM: 179,
  missilesPerVolley: 150,
  volleys: 1,
  deliveryReliability: 0.95,
  warheadReliability: 0.95,
  seed: 12345,
  attackerKnowsKills: true,
  reprogram: false,
}

describe('miss distribution', () => {
  it('puts ≈50% of impacts within the CEP', () => {
    const rng = new Rng(7)
    const miss = gaussianMiss(90)
    const n = 40_000
    let inside = 0
    for (let i = 0; i < n; i++) {
      const { dx, dy } = miss.sample(rng)
      if (Math.hypot(dx, dy) <= 90) inside++
    }
    expect(inside / n).toBeGreaterThan(0.49)
    expect(inside / n).toBeLessThan(0.51)
  })
})

describe('allocation', () => {
  const sum = (m: Map<number, number>) => [...m.values()].reduce((a, b) => a + b, 0)

  it('sums to N and is as even as possible', () => {
    const targets = Array.from({ length: 119 }, (_, i) => i)
    for (const n of [119, 240, 250, 1000]) {
      const a = allocateEvenly(targets, n, new Rng(n))
      expect(sum(a)).toBe(n)
      const counts = targets.map((t) => a.get(t) ?? 0)
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
    }
  })

  it('gives one each to N random targets when N < S', () => {
    const targets = Array.from({ length: 100 }, (_, i) => i)
    const a = allocateEvenly(targets, 30, new Rng(1))
    expect(a.size).toBe(30)
    expect([...a.values()].every((n) => n === 1)).toBe(true)
  })
})

describe('kill rule (cookie cutter)', () => {
  const silos: SimSilo[] = [
    { id: 'A', lat: 0, lon: 0, x: 0, y: 0 },
    { id: 'B', lat: 0, lon: 0, x: 300, y: 0 },
  ]
  const damage = cookieCutter(179)
  const grid = new SiloGrid(silos, damage.maxRangeM)

  it('kills at exactly LR, not beyond', () => {
    const lone = new SiloGrid([silos[0]!], damage.maxRangeM)
    expect(applyDetonation(lone, [true], 179, 0, damage, new Rng(1))).toEqual([0])
    expect(applyDetonation(lone, [true], 0, -179, damage, new Rng(1))).toEqual([0])
    expect(applyDetonation(lone, [true], 179.001, 0, damage, new Rng(1))).toEqual([])
  })

  it('kills a neighbour the warhead was not aimed at', () => {
    // Aimed at A, landed 150 m east: 150 from A and 150 from B, both within LR.
    expect(applyDetonation(grid, [true, true], 150, 0, damage, new Rng(1)).sort()).toEqual([0, 1])
  })

  it('ignores silos that are already destroyed', () => {
    expect(applyDetonation(grid, [false, true], 0, 0, damage, new Rng(1))).toEqual([])
  })

  it('duds (R_wh = 0) never kill', () => {
    const s = runVolley(initSim(gridSilos(20), { ...PARAMS, warheadReliability: 0 }))
    const v = s.volleys[0]!
    expect(v.destroyedThisVolley).toBe(0)
    expect(v.detonations).toBe(0)
    expect(v.impacts!.every((i) => i.dud)).toBe(true)
  })
})

describe('engine', () => {
  const silos = gridSilos(100)

  it('is reproducible from the seed', () => {
    const p = { ...PARAMS, volleys: 3, missilesPerVolley: 120 }
    const a = runCampaign(initSim(silos, p))
    const b = runCampaign(initSim(silos, p))
    const c = runCampaign(initSim(silos, { ...p, seed: 999 }))
    const summary = (s: typeof a) =>
      s.volleys.map((v) => [v.surviving, v.deliveryFailures, v.warheadFailures])
    expect(summary(a)).toEqual(summary(b))
    expect(a.volleys[0]!.impacts).toEqual(b.volleys[0]!.impacts)
    expect(summary(c)).not.toEqual(summary(a))
  })

  it('without reprogramming: delivery failures leave no impact point', () => {
    const s = runVolley(initSim(silos, { ...PARAMS, deliveryReliability: 0.5 }))
    const v = s.volleys[0]!
    expect(v.warheadsAllocated).toBe(150)
    expect(v.impacts!.length).toBe(150 - v.deliveryFailures)
    expect(v.deliveryFailures).toBeGreaterThan(0)
  })

  it('with reprogramming: only the A = N − failures survivors are allocated', () => {
    const s = runVolley(initSim(silos, { ...PARAMS, deliveryReliability: 0.5, reprogram: true }))
    const v = s.volleys[0]!
    expect(v.warheadsAllocated + v.deliveryFailures).toBe(150)
    expect(v.impacts!.length).toBe(v.warheadsAllocated)
  })

  it('perfect damage assessment re-targets only survivors; without it every silo is targeted', () => {
    const p = { ...PARAMS, volleys: 2, missilesPerVolley: 100 }
    const known = runCampaign(initSim(silos, p))
    const v2 = known.volleys[1]!
    for (const i of v2.allocation.keys()) expect(known.volleys[0]!.aliveAfter[i]).toBe(true)

    const blind = runCampaign(initSim(silos, { ...p, attackerKnowsKills: false }))
    expect(blind.volleys[1]!.allocation.size).toBe(100)
  })

  it('conditional x̄ matches the analytic formula for the actual allocation', () => {
    const s = runVolley(initSim(silos, PARAMS))
    const t = tkp(sskp(179, 90), PARAMS)
    expect(s.volleys[0]!.expectedSurvivors).toBeCloseTo(evenSplitSurvivors(150, 100, t), 9)
  })
})

describe('Monte Carlo vs analytic', () => {
  it('mean one-volley survivors over 2,000 trials is within 3 SE of the analytic x̄', () => {
    const silos = gridSilos(100)
    const r = runBatch(silos, PARAMS, 2000)
    const stats = r.survivorsByVolley[0]!
    const analytic = evenSplitSurvivors(150, 100, tkp(sskp(179, 90), PARAMS))
    expect(Math.abs(stats.mean - analytic)).toBeLessThan(3 * stats.se)
  })

  it('single-shot kill rate matches SSKP', () => {
    const one = gridSilos(1)
    const p = { ...PARAMS, missilesPerVolley: 1, deliveryReliability: 1, warheadReliability: 1 }
    const trials = 20_000
    const r = runBatch(one, p, trials)
    const killRate = 1 - r.survivorsByVolley[0]!.mean
    const se = Math.sqrt((sskp(179, 90) * (1 - sskp(179, 90))) / trials)
    expect(Math.abs(killRate - sskp(179, 90))).toBeLessThan(4 * se)
  })
})
