import {
  haversineDistance,
  checkGeofence,
  formatDistance,
  isValidCoordinates,
} from '../../src/lib/geo/distance'

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(40.712, -74.006, 40.712, -74.006)).toBe(0)
  })

  it('calculates known distance accurately (NYC to London ≈ 5570 km)', () => {
    const dist = haversineDistance(40.7128, -74.006, 51.5074, -0.1278)
    expect(dist).toBeGreaterThan(5_560_000)
    expect(dist).toBeLessThan(5_600_000)
  })

  it('returns approximate distance for nearby points', () => {
    // ~111m per 0.001 degree latitude
    const dist = haversineDistance(40.712, -74.006, 40.713, -74.006)
    expect(dist).toBeGreaterThan(100)
    expect(dist).toBeLessThan(120)
  })
})

describe('checkGeofence', () => {
  const opts = {
    userLat: 40.712,
    userLon: -74.006,
    targetLat: 40.712,
    targetLon: -74.006,
    geofenceRadius: 50,
  }

  it('returns isInside=true when user is at target', () => {
    const result = checkGeofence(opts)
    expect(result.isInside).toBe(true)
    expect(result.isUncertain).toBe(false)
  })

  it('returns isInside=false when user is far away', () => {
    const result = checkGeofence({ ...opts, userLat: 40.800, userLon: -74.006 })
    expect(result.isInside).toBe(false)
  })

  it('returns isUncertain when user is just outside radius but within GPS accuracy', () => {
    // User is 60m away (outside 50m radius) but GPS accuracy is 30m
    const result = checkGeofence({
      ...opts,
      userLat: 40.7125,  // ~55m away
      gpsAccuracy: 30,
    })
    expect(result.isInside).toBe(false)
    expect(result.isUncertain).toBe(true)
  })

  it('exposes the distance in the result', () => {
    const result = checkGeofence(opts)
    expect(result.distance).toBe(0)
  })
})

describe('formatDistance', () => {
  it('formats metres for distances under 1000m', () => {
    expect(formatDistance(500)).toBe('500 m')
    expect(formatDistance(1)).toBe('1 m')
  })

  it('formats kilometres for distances over 1000m', () => {
    expect(formatDistance(1500)).toBe('1.5 km')
    expect(formatDistance(10000)).toBe('10.0 km')
  })
})

describe('isValidCoordinates', () => {
  it('accepts valid coordinates', () => {
    expect(isValidCoordinates(40.712, -74.006)).toBe(true)
    expect(isValidCoordinates(0, 0)).toBe(true)
    expect(isValidCoordinates(90, 180)).toBe(true)
    expect(isValidCoordinates(-90, -180)).toBe(true)
  })

  it('rejects invalid coordinates', () => {
    expect(isValidCoordinates(91, 0)).toBe(false)
    expect(isValidCoordinates(0, 181)).toBe(false)
    expect(isValidCoordinates(NaN, 0)).toBe(false)
  })
})
