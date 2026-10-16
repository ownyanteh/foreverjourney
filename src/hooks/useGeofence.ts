'use client'

import { useEffect, useRef, useState } from 'react'
import { checkGeofence } from '@/lib/geo/distance'

interface UseGeofenceOptions {
  targetLat: number | null
  targetLon: number | null
  geofenceRadius: number
  userLat: number | null
  userLon: number | null
  gpsAccuracy: number | null
  /** Require N consecutive inside readings before triggering — reduces GPS drift false positives */
  stableCount?: number
  onEnter?: () => void
}

export function useGeofence({
  targetLat,
  targetLon,
  geofenceRadius,
  userLat,
  userLon,
  gpsAccuracy,
  stableCount = 2,
  onEnter,
}: UseGeofenceOptions) {
  const [isInside, setIsInside] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const consecutiveCount = useRef(0)
  const hasFiredRef = useRef(false)

  useEffect(() => {
    if (
      userLat === null ||
      userLon === null ||
      targetLat === null ||
      targetLon === null
    ) {
      return
    }

    const result = checkGeofence({
      userLat,
      userLon,
      targetLat,
      targetLon,
      geofenceRadius,
      gpsAccuracy: gpsAccuracy ?? 0,
    })

    setDistance(result.distance)

    if (result.isInside) {
      consecutiveCount.current += 1
    } else {
      consecutiveCount.current = 0
    }

    const stable = consecutiveCount.current >= stableCount
    setIsInside(stable)

    if (stable && !hasFiredRef.current) {
      hasFiredRef.current = true
      onEnter?.()
    }

    // Reset if user moves back outside
    if (!result.isInside && !result.isUncertain) {
      hasFiredRef.current = false
    }
  }, [userLat, userLon, targetLat, targetLon, geofenceRadius, gpsAccuracy, stableCount, onEnter])

  return { isInside, distance }
}
