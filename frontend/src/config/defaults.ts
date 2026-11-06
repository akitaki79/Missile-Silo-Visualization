import type {
  BasemapDef,
  BasemapId,
  MapOptions,
  MissilePreset,
  NumericField,
  NumericInputs,
  SimFlag,
} from '@/types'

/**
 * Default parameter values. CEP, LR and reliabilities follow Lawrence (2026), Tables 1 & 3
 * (Trident II D5 / W76). Missiles per volley and volleys are illustrative placeholders.
 */
export const DEFAULT_INPUTS: NumericInputs = {
  cepM: '90',
  lethalRadiusM: '179',
  missilesPerVolley: '240',
  volleys: '2',
  deliveryReliability: '0.95',
  warheadReliability: '0.95',
  seed: '42',
  warheadsPerSilo: '1',
  trials: '1000',
}

export const DEFAULT_FLAGS: Record<SimFlag, boolean> = {
  attackerKnowsKills: true,
  reprogram: false,
}

/**
 * Warheads per silo when a base file doesn't set `warheadsPerSilo`.
 * China: 3, per Lawrence (2026) Table 2 / the DoD estimate.
 */
export const WARHEADS_PER_SILO_BY_COUNTRY: Record<string, number> = { China: 3 }
export const DEFAULT_WARHEADS_PER_SILO = 1

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  basemap: 'light',
  showLabels: false,
  showRings: false,
  showImpacts: true,
  greyscale: false,
}

/** Validation limits. `integer` fields reject decimals. */
export const LIMITS: Record<NumericField, { min: number; max: number; integer: boolean }> = {
  cepM: { min: 1, max: 10_000, integer: false },
  lethalRadiusM: { min: 1, max: 10_000, integer: false },
  missilesPerVolley: { min: 1, max: 10_000, integer: true },
  volleys: { min: 1, max: 20, integer: true },
  deliveryReliability: { min: 0, max: 1, integer: false },
  warheadReliability: { min: 0, max: 1, integer: false },
  seed: { min: 0, max: 2 ** 32 - 1, integer: true },
  warheadsPerSilo: { min: 1, max: 20, integer: true },
  trials: { min: 10, max: 20_000, integer: true },
}

const LAWRENCE_T13 = 'Lawrence (2026), Tables 1 & 3'

/** Missile presets from Lawrence (2026). Each fills CEP, LR and both reliabilities. */
export const MISSILE_PRESETS: MissilePreset[] = [
  {
    id: 'd5-w76',
    label: 'Trident II D5 / W76',
    yieldKt: 100,
    cepM: 90,
    lethalRadiusM: 179,
    deliveryReliability: 0.95,
    warheadReliability: 0.95,
    source: `${LAWRENCE_T13}: 100 kt, CEP 90 m, LR 179 m, R_del 0.95, R_wh 0.95`,
  },
  {
    id: 'd5-w88',
    label: 'Trident II D5 / W88',
    yieldKt: 455,
    cepM: 90,
    lethalRadiusM: 296,
    deliveryReliability: 0.95,
    warheadReliability: 0.95,
    source: `${LAWRENCE_T13}: 455 kt, CEP 90 m, LR 296 m, R_del 0.95, R_wh 0.95`,
  },
  {
    id: 'degraded',
    label: 'Degraded accuracy (W76)',
    yieldKt: 100,
    cepM: 120,
    lethalRadiusM: 179,
    deliveryReliability: 0.95,
    warheadReliability: 0.95,
    source: 'Lawrence (2026), Table 5: CEP 120 m; other values as the W76',
  },
]

/** Defaults for the "compute LR from yield & hardness" helper (Davis & Schilling 1973). */
export const LR_HELPER_DEFAULTS = { yieldKt: '100', hardnessPsi: '2000' }

/** Single-run impact animation length. Skipped when the OS asks for reduced motion. */
export const IMPACT_ANIMATION_MS = 1200

/**
 * Volley colours (map impacts + legend) are CSS variables --viz-1..3 in index.css.
 * Validated all-pairs for CVD; volleys beyond this fold into one neutral colour
 * rather than cycling hues.
 */
export const VOLLEY_COLOR_SLOTS = 3

export const BASEMAPS: Record<BasemapId, BasemapDef> = {
  // CARTO Positron was the original choice, but CARTO now serves an "API KEY
  // REQUIRED" placeholder for all keyless raster tiles. Esri's light gray canvas
  // is the closest keyless equivalent.
  light: {
    label: 'Light',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    maxzoom: 16,
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
  },
  satellite: {
    label: 'Satellite',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  },
}

/**
 * Glyph server for silo id labels. Raster basemaps ship no fonts, so text
 * layers need one. This is MapLibre's free demo server (no key, no SLA).
 */
export const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
export const LABEL_FONT = ['Open Sans Semibold']

/** Padding (px) when auto-fitting the map to a base. */
export const FIT_PADDING = 80
