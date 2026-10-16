'use client'

import { useState, useEffect, useCallback } from 'react'
import type { JourneyState } from '@/types'

export function useJourneyState(token: string) {
  const [state, setState] = useState<JourneyState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey/${token}/state`)
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Failed to load journey state.')
        return
      }
      const json = await res.json()
      setState(json)
      setError(null)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { state, loading, error, refresh }
}
