/**
 * Geospatial utilities for the Our Forever Journey application.
 * All calculations use the Haversine formula for great-circle distances.
 */

const EARTH_RADIUS_METERS = 6_371_000

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calculate the great-circle distance between two coordinates in metres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeofenceCheckOptions {
  userLat: number
  userLon: number
  targetLat: number
  targetLon: number
  geofenceRadius: number
  /** GPS accuracy reported by the browser (metres). Default: 0 (ignored). */
  gpsAccuracy?: number
}

export interface GeofenceCheckResult {
  distance: number      // Metres from user to target
  isInside: boolean
  /** True when GPS accuracy is poor enough that the result is uncertain */
  isUncertain: boolean
}

/**
 * Check whether the user is inside a geofence.
 * Uses a conservative approach: if GPS accuracy is poor and the user is
 * within (radius + accuracy), we consider them "possibly inside" but mark it uncertain.
 */
export function checkGeofence(opts: GeofenceCheckOptions): GeofenceCheckResult {
  const { userLat, userLon, targetLat, targetLon, geofenceRadius, gpsAccuracy = 0 } = opts
  const distance = haversineDistance(userLat, userLon, targetLat, targetLon)
  const accuracy = Math.max(0, gpsAccuracy)

  const isInside = distance <= geofenceRadius
  const mightBeInside = distance <= geofenceRadius + accuracy
  const isUncertain = !isInside && mightBeInside

  return { distance, isInside, isUncertain }
}

/**
 * Format a distance in metres to a human-readable string.
 */
export function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${Math.round(metres)} m`
  }
  return `${(metres / 1000).toFixed(1)} km`
}

/**
 * Validate coordinate ranges.
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && lat >= -90 && lat <= 90
}

export function isValidLongitude(lon: number): boolean {
  return typeof lon === 'number' && lon >= -180 && lon <= 180
}

export function isValidCoordinates(lat: number, lon: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lon)
}

/**
 * Estimate walking time for a distance.
 * Average walking speed: 5 km/h = 83 m/min
 */
export function estimateWalkingMinutes(distanceMetres: number): number {
  return Math.ceil(distanceMetres / 83)
}

/**
 * Estimate driving time for a distance.
 * Rough urban average: 30 km/h = 500 m/min
 */
export function estimateDrivingMinutes(distanceMetres: number): number {
  return Math.ceil(distanceMetres / 500)
}
