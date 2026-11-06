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
}

export function silosToGeoJSON(silos: Silo[]): FeatureCollection<Point, SiloProps> {
  return {
    type: 'FeatureCollection',
    features: silos.map((s) => ({
      type: 'Feature',
      id: s.id,
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: { id: s.id, lat: s.lat, lon: s.lon },
    })),
  }
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
