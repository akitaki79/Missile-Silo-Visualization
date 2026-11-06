import circle from '@turf/circle'
import type { FeatureCollection, Point, Polygon } from 'geojson'
import type { Silo } from '@/types'

export type LngLat = [lon: number, lat: number]
export type Bounds = [sw: LngLat, ne: LngLat]

/**
 * Arithmetic mean of silo coordinates. Fine for a single field spanning a few
 * tens of km; would need care for fields straddling the antimeridian.
 */
export function centroid(silos: Silo[]): LngLat {
  const n = silos.length || 1
  const lat = silos.reduce((s, x) => s + x.lat, 0) / n
  const lon = silos.reduce((s, x) => s + x.lon, 0) / n
  return [lon, lat]
}

export function bounds(silos: Silo[]): Bounds {
  let [minLon, minLat, maxLon, maxLat] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const { lat, lon } of silos) {
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ]
}

export interface SiloProps {
  id: string
  lat: number
  lon: number
  /** Display state from the simulation; 'intact' before any volley. */
  state: string
}

export function silosToGeoJSON(
  silos: Silo[],
  states?: readonly string[] | null,
): FeatureCollection<Point, SiloProps> {
  return {
    type: 'FeatureCollection',
    features: silos.map((s, i) => ({
      type: 'Feature',
      id: s.id,
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: { id: s.id, lat: s.lat, lon: s.lon, state: states?.[i] ?? 'intact' },
    })),
  }
}

export interface ImpactProps {
  key: string
  /** Colour slot: 1..slots for early volleys, 0 = folded "later volleys" colour. */
  slot: number
  dud: boolean
}

export function impactsToGeoJSON(
  impacts: readonly { key: string; lat: number; lon: number; volley: number; dud: boolean }[],
  colorSlots: number,
): FeatureCollection<Point, ImpactProps> {
  return {
    type: 'FeatureCollection',
    features: impacts.map((m) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.lon, m.lat] },
      properties: { key: m.key, slot: m.volley <= colorSlots ? m.volley : 0, dud: m.dud },
    })),
  }
}

/** Ground distance in metres (equirectangular; accurate at silo-field scale). */
export function distanceM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6_371_008.8
  const rad = Math.PI / 180
  const x = (b.lon - a.lon) * rad * Math.cos(((a.lat + b.lat) / 2) * rad)
  const y = (b.lat - a.lat) * rad
  return R * Math.hypot(x, y)
}

/** True geodesic circles of `radiusM` around each silo, correct at any zoom. */
export function lethalRings(silos: Silo[], radiusM: number): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: silos.map((s) =>
      circle([s.lon, s.lat], radiusM / 1000, { steps: 64, units: 'kilometers' }),
    ),
  }
}
