/**
 * Local planar coordinates. Not from either paper: both papers measure CEP and lethal
 * radius as ground distances in a plane, so we convert lat/lon to east/north metres
 * with an equirectangular projection around the field centroid:
 *   x = R · Δλ · cos φ₀,   y = R · Δφ
 * Error is negligible over a single silo field (tens of km).
 */

const EARTH_RADIUS_M = 6_371_008.8

export interface Origin {
  lat: number
  lon: number
}

const RAD = Math.PI / 180

export function centroidOf(points: { lat: number; lon: number }[]): Origin {
  const n = points.length || 1
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / n,
    lon: points.reduce((s, p) => s + p.lon, 0) / n,
  }
}

export function toLocal(lat: number, lon: number, o: Origin): { x: number; y: number } {
  return {
    x: EARTH_RADIUS_M * (lon - o.lon) * RAD * Math.cos(o.lat * RAD),
    y: EARTH_RADIUS_M * (lat - o.lat) * RAD,
  }
}

export function toLatLon(x: number, y: number, o: Origin): { lat: number; lon: number } {
  return {
    lat: o.lat + y / EARTH_RADIUS_M / RAD,
    lon: o.lon + x / (EARTH_RADIUS_M * Math.cos(o.lat * RAD)) / RAD,
  }
}
