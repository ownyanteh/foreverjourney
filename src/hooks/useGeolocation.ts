'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GeolocationState } from '@/types'

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
}

export function useGeolocation(options: PositionOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    status: 'idle',
    accuracy: null,
  })

  const watchIdRef = useRef<number | null>(null)

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, status: 'unsupported', error: null }))
      return
    }

    setState((s) => ({ ...s, status: 'requesting' }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          position: position.coords,
          error: null,
          status: 'granted',
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        let status: GeolocationState['status'] = 'unavailable'
        if (error.code === error.PERMISSION_DENIED) status = 'denied'
        else if (error.code === error.TIMEOUT) status = 'timeout'
        setState((s) => ({ ...s, error, status }))
      },
      options
    )
  }, [options])

  useEffect(() => {
    return () => stopWatching()
  }, [stopWatching])

  return { ...state, startWatching, stopWatching }
}
