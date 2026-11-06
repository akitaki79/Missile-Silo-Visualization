/** Shared types. Mirrors the data convention documented in /data/README.md. */

export type DataStatus = 'placeholder' | 'verified'

export interface Silo {
  id: string
  lat: number
  lon: number
}

/** One file in /data/bases. */
export interface Base {
  id: string
  name: string
  country: string
  dataStatus: DataStatus
  source: string
  silos: Silo[]
}

/** What GET /api/bases returns for each file. */
export type BaseSummary = Omit<Base, 'silos'> & { siloCount: number }

/** Numeric parameters, entered as text so the user can type freely (e.g. "0."). */
export type NumericField =
  'cepM' | 'lethalRadiusM' | 'missilesPerVolley' | 'volleys' | 'reliability' | 'seed'

export type NumericInputs = Record<NumericField, string>
export type FieldErrors = Partial<Record<NumericField, string>>

/** Fully parsed and validated parameters. This is what the Phase 2 engine consumes. */
export interface SimulatorParams {
  baseId: string
  cepM: number
  lethalRadiusM: number
  missilesPerVolley: number
  volleys: number
  /** Probability a warhead functions, 0–1. */
  reliability: number
  seed: number
  /** Perfect damage assessment: re-target only silos not yet destroyed. */
  attackerKnowsKills: boolean
}

export type BasemapId = 'light' | 'satellite'

export interface MapOptions {
  basemap: BasemapId
  showLabels: boolean
  showRings: boolean
  greyscale: boolean
}

export interface MissilePreset {
  id: string
  label: string
  cepM: number
  lethalRadiusM: number
}

export interface BasemapDef {
  label: string
  tiles: string[]
  tileSize: number
  maxzoom: number
  attribution: string
}
