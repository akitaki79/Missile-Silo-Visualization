/**
 * Volley-by-volley Monte Carlo of a counterforce strike: the stochastic counterpart of
 * Lawrence (2026)'s standard reductionist analysis, with Davis & Schilling (1973)'s
 * reliability split and within-volley reprogramming.
 *
 * Per volley:
 *   1. Targets: silos believed alive. With perfect damage assessment
 *      (attackerKnowsKills), only surviving silos; otherwise every silo, every volley.
 *   2. Reliability:
 *      - no reprogramming: allocate all N evenly; each RV then fails delivery with
 *        probability 1 − R_del (no impact point) and, if delivered, fails to detonate
 *        with probability 1 − R_wh (lands as a dud). Effective TKP = SSKP · R_del · R_wh.
 *      - reprogramming (D&S): sample the N delivery failures FIRST, then evenly allocate
 *        only the A = N − failures survivors (E[A] = N · R_del). They fail only by
 *        R_wh, so TKP = SSKP · R_wh, D&S's "nonreprogrammable reliability".
 *   3. Impact = aim + circular Gaussian miss, σ = CEP / √(2 ln 2) (missDistribution.ts).
 *   4. Kill: cookie-cutter LR against EVERY silo, not just the aim point (killRule.ts).
 *   5. Analytic x̄ for comparison, conditional on this volley's actual allocation and the
 *      silos alive going in: x̄ = Σ (1 − TKP)^nᵢ + untargeted live silos (analytic.ts).
 *
 * Pure: every function returns a new SimState. Randomness comes from the seeded
 * mulberry32 state carried in SimState, so a seed always reproduces the same run.
 */
import { allocateEvenly } from '@/sim/allocation'
import { expectedSurvivors, sskp, tkp } from '@/sim/analytic'
import { cookieCutter, type DamageFunction } from '@/sim/damageFunction'
import { applyDetonation, SiloGrid } from '@/sim/killRule'
import { gaussianMiss, type MissDistribution } from '@/sim/missDistribution'
import { centroidOf, toLatLon, toLocal } from '@/sim/projection'
import { Rng } from '@/sim/rng'
import type { Impact, SimParams, SimSiloInput, SimState, VolleyResult } from '@/sim/types'

export interface RunOptions {
  /** Keep per-RV impacts (for the map). Batch runs turn this off for speed. */
  recordImpacts?: boolean
}

export function initSim(silos: SimSiloInput[], params: SimParams): SimState {
  const origin = centroidOf(silos)
  return {
    params,
    origin,
    silos: silos.map((s) => ({
      id: s.id,
      lat: s.lat,
      lon: s.lon,
      ...toLocal(s.lat, s.lon, origin),
    })),
    alive: silos.map(() => true),
    rngState: params.seed >>> 0,
    volleys: [],
  }
}

/** Same silos and params, fresh campaign from `seed` (batch trials reuse the projection). */
export function restartSim(state: SimState, seed: number): SimState {
  return { ...state, alive: state.silos.map(() => true), rngState: seed >>> 0, volleys: [] }
}

export function isComplete(state: SimState): boolean {
  return state.volleys.length >= state.params.volleys
}

export function runVolley(state: SimState, { recordImpacts = true }: RunOptions = {}): SimState {
  const p = state.params
  if (isComplete(state)) throw new Error('All volleys have been fired')

  const rng = new Rng(state.rngState)
  const miss = missFor(p)
  const damage = damageFor(p)
  const grid = gridFor(state, damage.maxRangeM)
  const alive = [...state.alive]
  const aliveBefore = countTrue(alive)

  const all = state.silos.map((_, i) => i)
  const targets = p.attackerKnowsKills ? all.filter((i) => alive[i]) : all

  let deliveryFailures = 0
  let warheadFailures = 0
  let detonations = 0
  let allocation: Map<number, number>

  if (p.reprogram) {
    // D&S: boost failures are detected and replaced from reserves before allocation.
    for (let i = 0; i < p.missilesPerVolley; i++) {
      if (!rng.bernoulli(p.deliveryReliability)) deliveryFailures++
    }
    allocation = allocateEvenly(targets, p.missilesPerVolley - deliveryFailures, rng)
  } else {
    allocation = allocateEvenly(targets, p.missilesPerVolley, rng)
  }

  const impacts: Impact[] | null = recordImpacts ? [] : null
  // TODO(extension): burst timing / second-shot window. RVs are processed as if they
  // arrive in allocation order with no timing; a timing model would order arrivals and
  // feed fratricide (see killRule.ts).
  for (const [aim, n] of allocation) {
    const target = state.silos[aim]
    if (!target) continue
    for (let j = 0; j < n; j++) {
      if (!p.reprogram && !rng.bernoulli(p.deliveryReliability)) {
        deliveryFailures++ // no RV arrives; nothing to draw
        continue
      }
      const { dx, dy } = miss.sample(rng)
      const x = target.x + dx
      const y = target.y + dy
      const dud = !rng.bernoulli(p.warheadReliability)
      let killed: number[] = []
      if (dud) warheadFailures++
      else {
        detonations++
        killed = applyDetonation(grid, alive, x, y, damage, rng)
      }
      impacts?.push({ aimIndex: aim, x, y, ...toLatLon(x, y, state.origin), dud, killed })
    }
  }

  // Analytic comparison, conditional on this volley's allocation and live silos.
  const t = tkp(sskp(p.lethalRadiusM, p.cepM), p)
  const liveTargetCounts: number[] = []
  let untargetedLive = 0
  state.alive.forEach((wasAlive, i) => {
    if (!wasAlive) return
    const n = allocation.get(i)
    if (n) liveTargetCounts.push(n)
    else untargetedLive++
  })

  const total = state.silos.length
  const surviving = countTrue(alive)
  let warheadsAllocated = 0
  for (const n of allocation.values()) warheadsAllocated += n

  const result: VolleyResult = {
    volley: state.volleys.length + 1,
    allocation,
    warheadsAllocated,
    deliveryFailures,
    warheadFailures,
    detonations,
    impacts,
    aliveAfter: alive,
    aliveBefore,
    destroyedThisVolley: aliveBefore - surviving,
    cumulativeDestroyed: total - surviving,
    surviving,
    pctDestroyed: total ? (100 * (total - surviving)) / total : 0,
    pctSurviving: total ? (100 * surviving) / total : 0,
    expectedSurvivors: expectedSurvivors(liveTargetCounts, t, untargetedLive),
  }

  return { ...state, alive, rngState: rng.state, volleys: [...state.volleys, result] }
}

/** Fire every remaining volley. */
export function runCampaign(state: SimState, opts?: RunOptions): SimState {
  let s = state
  while (!isComplete(s)) s = runVolley(s, opts)
  return s
}

function missFor(p: SimParams): MissDistribution {
  return gaussianMiss(p.cepM)
}

function damageFor(p: SimParams): DamageFunction {
  return cookieCutter(p.lethalRadiusM)
}

// Silo positions never change within a campaign, so the spatial index is built once.
const grids = new WeakMap<SimState['silos'], { cell: number; grid: SiloGrid }>()
function gridFor(state: SimState, cell: number): SiloGrid {
  const cached = grids.get(state.silos)
  if (cached && cached.cell === cell) return cached.grid
  const grid = new SiloGrid(state.silos, cell)
  grids.set(state.silos, { cell, grid })
  return grid
}

function countTrue(xs: boolean[]): number {
  let n = 0
  for (const x of xs) if (x) n++
  return n
}
