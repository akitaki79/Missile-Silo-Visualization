import type {
  BasemapDef,
  BasemapId,
  MapOptions,
  MissilePreset,
  NumericField,
  NumericInputs,
} from '@/types'

/**
 * Default parameter values. These are PLACEHOLDERS for UI development,
 * not vetted estimates of any real weapon system.
 */
export const DEFAULT_INPUTS: NumericInputs = {
  cepM: '90',
  lethalRadiusM: '179',
  missilesPerVolley: '240',
  volleys: '2',
  reliability: '1.0',
  seed: '42',
}

export const DEFAULT_ATTACKER_KNOWS_KILLS = true

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  basemap: 'light',
  showLabels: false,
  showRings: false,
  greyscale: false,
}

/** Validation limits. `integer` fields reject decimals. */
export const LIMITS: Record<NumericField, { min: number; max: number; integer: boolean }> = {
  cepM: { min: 1, max: 10_000, integer: false },
  lethalRadiusM: { min: 1, max: 10_000, integer: false },
  missilesPerVolley: { min: 1, max: 10_000, integer: true },
  volleys: { min: 1, max: 20, integer: true },
  reliability: { min: 0, max: 1, integer: false },
  seed: { min: 0, max: 2 ** 32 - 1, integer: true },
}

/**
 * ILLUSTRATIVE presets only: round numbers chosen to span a range of
 * accuracy/effect, not tied to any specific missile.
 */
export const MISSILE_PRESETS: MissilePreset[] = [
  { id: 'high-accuracy', label: 'High accuracy', cepM: 90, lethalRadiusM: 179 },
  { id: 'moderate-accuracy', label: 'Moderate accuracy', cepM: 200, lethalRadiusM: 179 },
  {
    id: 'low-accuracy-high-yield',
    label: 'Low accuracy, high yield',
    cepM: 400,
    lethalRadiusM: 300,
  },
]

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
