/**
 * Simulation data types.
 *
 * Reliability is split as in both Davis & Schilling (1973) and Lawrence (2026, Table 1):
 *   R_del: delivery (boost-phase) reliability; a failure means no RV arrives.
 *   R_wh:  warhead (post-boost / detonation) reliability; a failure lands but doesn't detonate.
 *   OAR = R_del · R_wh.
 */

/** Simulation inputs. Pure numbers/flags; nothing UI-specific. */
export interface SimParams {
  cepM: number
  lethalRadiusM: number
  missilesPerVolley: number
  volleys: number
  /** R_del, 0–1. */
  deliveryReliability: number
  /** R_wh, 0–1. */
  warheadReliability: number
  seed: number
  /** Between volleys: perfect damage assessment (re-target only surviving silos). */
  attackerKnowsKills: boolean
  /** Within a volley: replace detected boost failures from reserves (Davis & Schilling). */
  reprogram: boolean
}

export interface SimSiloInput {
  id: string
  lat: number
  lon: number
}

/** A silo in local metres (x = east, y = north) around the base centroid. */
export interface SimSilo extends SimSiloInput {
  x: number
  y: number
}

/** One RV that arrived (delivery failures have no impact point and aren't listed). */
export interface Impact {
  /** Index into SimState.silos of the silo this RV was aimed at. */
  aimIndex: number
  x: number
  y: number
  lat: number
  lon: number
  /** Warhead failure: landed but didn't detonate. */
  dud: boolean
  /** Indices of silos this detonation destroyed (empty for duds or misses). */
  killed: number[]
}

export interface VolleyResult {
  /** 1-based. */
  volley: number
  /** Warheads fired at each targeted silo index (after reprogramming, if on). */
  allocation: Map<number, number>
  /** Warheads that were allocated to targets (= N, or N − delivery failures when reprogramming). */
  warheadsAllocated: number
  deliveryFailures: number
  warheadFailures: number
  detonations: number
  /** Present unless the run was made with recordImpacts: false (batch mode). */
  impacts: Impact[] | null
  /** alive[i] after this volley. */
  aliveAfter: boolean[]
  aliveBefore: number
  destroyedThisVolley: number
  cumulativeDestroyed: number
  surviving: number
  pctDestroyed: number
  pctSurviving: number
  /** Analytic x̄ for this volley, conditional on its actual allocation and the silos alive going in. */
  expectedSurvivors: number
}

export interface SimState {
  params: SimParams
  silos: SimSilo[]
  /** Projection origin (base centroid). */
  origin: { lat: number; lon: number }
  alive: boolean[]
  /** mulberry32 state, carried so every run is reproducible from the seed. */
  rngState: number
  volleys: VolleyResult[]
}
