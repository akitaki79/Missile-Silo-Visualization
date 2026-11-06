/** Shared types. Mirrors the data convention documented in /data/README.md. */
import type { SimParams } from '@/sim/types'

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
  /** Optional; falls back to a per-country default (config/defaults.ts). */
  warheadsPerSilo?: number
  silos: Silo[]
}

/** What GET /api/bases returns for each file. */
export type BaseSummary = Omit<Base, 'silos'> & { siloCount: number }

/** Numeric parameters, entered as text so the user can type freely (e.g. "0."). */
export type NumericField =
  | 'cepM'
  | 'lethalRadiusM'
  | 'missilesPerVolley'
  | 'volleys'
  | 'deliveryReliability'
  | 'warheadReliability'
  | 'seed'
  | 'warheadsPerSilo'
  | 'trials'

export type NumericInputs = Record<NumericField, string>
export type FieldErrors = Partial<Record<NumericField, string>>

export type SimFlag = 'attackerKnowsKills' | 'reprogram'

/**
 * Fully parsed and validated parameters. The engine reads the SimParams part;
 * warheadsPerSilo only scales reported results and trials only sizes batch runs,
 * so changing either never invalidates a run in progress.
 */
export interface SimulatorParams extends SimParams {
  baseId: string
  warheadsPerSilo: number
  trials: number
}

export type BasemapId = 'light' | 'satellite'

export interface MapOptions {
  basemap: BasemapId
  showLabels: boolean
  showRings: boolean
  showImpacts: boolean
  greyscale: boolean
}

export interface MissilePreset {
  id: string
  label: string
  yieldKt: number
  cepM: number
  lethalRadiusM: number
  deliveryReliability: number
  warheadReliability: number
  /** Citation shown in the preset's tooltip. */
  source: string
}

export interface BasemapDef {
  label: string
  tiles: string[]
  tileSize: number
  maxzoom: number
  attribution: string
}
