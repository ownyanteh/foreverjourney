'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation2, ChevronDown, ExternalLink,
  CheckCircle2, AlertCircle, Compass
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useGeofence } from '@/hooks/useGeofence'
import { useJourneyState } from '@/hooks/useJourneyState'
import { formatDistance } from '@/lib/geo/distance'
import dynamic from 'next/dynamic'
import type { RouteSegment } from '@/types'

// Lazy-load the map — avoids SSR issues with maplibre-gl
const NavigationMap = dynamic(() => import('@/components/journey/NavigationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-blush-100 animate-pulse" />,
})

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export default function NavigatePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const { position, status, accuracy, startWatching, stopWatching } = useGeolocation()
  const { state: journeyState, refresh: refreshState } = useJourneyState(token)

  const [activeCheckpoint, setActiveCheckpoint] = useState<{
    _id: string
    title: string
    sequence: number
    coordinates: { latitude: number; longitude: number }
    geofenceRadius: number
    skippable: boolean
    instructionText: string
  } | null>(null)

  const [nextIsFinalDestination, setNextIsFinalDestination] = useState(false)
  const [finalDestCoords, setFinalDestCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [finalDestGeofence, setFinalDestGeofence] = useState(50)

  const [route, setRoute] = useState<RouteSegment | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockedContent, setUnlockedContent] = useState<{
    romanticMessage: string
    imageUrl?: string | null
    audioUrl?: string | null
    clue?: string | null
    checkpointTitle: string
  } | null>(null)

  const [showInstruction, setShowInstruction] = useState(false)
  const routeFetchedForRef = useRef<string | null>(null)

  // Start GPS on mount
  useEffect(() => {
    startWatching()
    return () => stopWatching()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load active checkpoint
  const loadCheckpoint = useCallback(async () => {
    const res = await fetch(`/api/journey/${token}/active-checkpoint`)
    if (!res.ok) return
    const json = await res.json()
    if (json.checkpoint) {
      setActiveCheckpoint(json.checkpoint)
      setNextIsFinalDestination(false)
    } else if (json.nextIsFinalDestination) {
      setActiveCheckpoint(null)
      setNextIsFinalDestination(true)
      if (json.finalDestination) {
        setFinalDestCoords({
          latitude: json.finalDestination.latitude,
          longitude: json.finalDestination.longitude,
        })
        setFinalDestGeofence(json.finalDestination.geofenceRadius ?? 50)
      }
    }
  }, [token])

  useEffect(() => {
    loadCheckpoint()
  }, [loadCheckpoint])

  // Fetch route when position + target are available (debounced)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchRoute = useCallback(
    debounce(async (userLat: number, userLon: number, targetLat: number, targetLon: number) => {
      const key = `${userLat.toFixed(4)},${userLon.toFixed(4)}->${targetLat.toFixed(4)},${targetLon.toFixed(4)}`
      if (routeFetchedForRef.current === key) return
      routeFetchedForRef.current = key

      try {
        const url = new URL('/api/journey/route', window.location.origin)
        url.searchParams.set('fromLat', String(userLat))
        url.searchParams.set('fromLon', String(userLon))
        url.searchParams.set('toLat', String(targetLat))
        url.searchParams.set('toLon', String(targetLon))
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          setRoute(json.route)
        }
      } catch {
        // Route failed — map will show straight line fallback visually
      }
    }, 5000),
    []
  )

  useEffect(() => {
    if (!position) return
    const target = activeCheckpoint?.coordinates ?? finalDestCoords
    if (!target) return
    fetchRoute(position.latitude, position.longitude, target.latitude, target.longitude)
  }, [position, activeCheckpoint, finalDestCoords, fetchRoute])

  // Geofence detection for active checkpoint
  const targetLat = activeCheckpoint?.coordinates.latitude ?? null
  const targetLon = activeCheckpoint?.coordinates.longitude ?? null
  const geofenceRadius = activeCheckpoint?.geofenceRadius ?? 50

  const handleCheckpointEnter = useCallback(async () => {
    if (!activeCheckpoint || unlocking) return
    setUnlocking(true)
    try {
      const res = await fetch(`/api/journey/${token}/checkpoints/${activeCheckpoint._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position?.latitude,
          longitude: position?.longitude,
          accuracy: accuracy ?? 50,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setUnlockedContent({
          romanticMessage: json.content?.romanticMessage ?? '',
          imageUrl: json.content?.imageUrl,
          audioUrl: json.content?.audioUrl,
          clue: json.content?.clue,
          checkpointTitle: activeCheckpoint.title,
        })
        refreshState()
      }
    } finally {
      setUnlocking(false)
    }
  }, [activeCheckpoint, unlocking, token, position, accuracy, refreshState])

  useGeofence({
    targetLat,
    targetLon,
    geofenceRadius,
    userLat: position?.latitude ?? null,
    userLon: position?.longitude ?? null,
    gpsAccuracy: accuracy,
    stableCount: 2,
    onEnter: handleCheckpointEnter,
  })

  // Final destination geofence
  const handleFinalEnter = useCallback(async () => {
    if (!nextIsFinalDestination) return
    const res = await fetch(`/api/journey/${token}/final-destination/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: position?.latitude,
        longitude: position?.longitude,
        accuracy: accuracy ?? 50,
      }),
    })
    const json = await res.json()
    if (res.ok && json.isArrived) {
      router.push(`/journey/${token}/proposal`)
    }
  }, [nextIsFinalDestination, token, position, accuracy, router])

  useGeofence({
    targetLat: finalDestCoords?.latitude ?? null,
    targetLon: finalDestCoords?.longitude ?? null,
    geofenceRadius: finalDestGeofence,
    userLat: position?.latitude ?? null,
    userLon: position?.longitude ?? null,
    gpsAccuracy: accuracy,
    stableCount: 2,
    onEnter: handleFinalEnter,
  })

  const currentTarget = activeCheckpoint?.coordinates ?? finalDestCoords
  const distanceText =
    route
      ? formatDistance(route.distance)
      : position && currentTarget
      ? formatDistance(
          Math.sqrt(
            Math.pow((position.latitude - currentTarget.latitude) * 111000, 2) +
              Math.pow((position.longitude - currentTarget.longitude) * 111000 * Math.cos((position.latitude * Math.PI) / 180), 2)
          )
        )
      : null

  const progressPct = journeyState
    ? Math.round((journeyState.completedCheckpointIds.length / Math.max(journeyState.totalCheckpoints, 1)) * 100)
    : 0

  return (
    <div className="min-h-dvh flex flex-col bg-charcoal">
      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '60dvh' }}>
        <NavigationMap
          userLat={position?.latitude ?? null}
          userLon={position?.longitude ?? null}
          targetLat={currentTarget?.latitude ?? null}
          targetLon={currentTarget?.longitude ?? null}
          route={route}
        />

        {/* GPS status overlay */}
        {status !== 'granted' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg text-sm">
            {status === 'requesting' ? (
              <>
                <Compass className="h-4 w-4 text-burgundy animate-spin" />
                Getting your location…
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-charcoal/80">GPS unavailable</span>
              </>
            )}
          </div>
        )}

        {/* Progress bar */}
        {journeyState && journeyState.totalCheckpoints > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Bottom navigation panel */}
      <div className="bg-white rounded-t-3xl shadow-xl px-5 pt-4 pb-6 space-y-4">
        {/* Handle */}
        <div className="w-10 h-1 bg-blush-300 rounded-full mx-auto" />

        {/* Checkpoint info */}
        {activeCheckpoint ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-burgundy flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {activeCheckpoint.sequence + 1}
              </div>
              <h2 className="font-serif font-semibold text-charcoal truncate">{activeCheckpoint.title}</h2>
            </div>
            {activeCheckpoint.instructionText && (
              <p className="text-sm text-charcoal/60 ml-8">{activeCheckpoint.instructionText}</p>
            )}
          </div>
        ) : nextIsFinalDestination ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-white text-xs flex-shrink-0">
              ★
            </div>
            <h2 className="font-serif font-semibold text-charcoal">Head to the final destination</h2>
          </div>
        ) : (
          <div className="text-center text-charcoal/50 text-sm py-2">Loading checkpoint…</div>
        )}

        {/* Distance */}
        {distanceText && (
          <div className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
            <Navigation2 className="h-5 w-5 text-burgundy flex-shrink-0" />
            <div>
              <p className="text-lg font-semibold text-charcoal">{distanceText}</p>
              {route?.steps[0] && (
                <p className="text-xs text-charcoal/60">{route.steps[0].instruction}</p>
              )}
            </div>
          </div>
        )}

        {/* GPS accuracy warning */}
        {accuracy && accuracy > 100 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            GPS accuracy is low ({Math.round(accuracy)}m). Checkpoint detection may be delayed.
          </div>
        )}

        {/* Progress */}
        {journeyState && (
          <div className="flex items-center gap-2 text-xs text-charcoal/50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {journeyState.completedCheckpointIds.length} of {journeyState.totalCheckpoints} checkpoints complete
          </div>
        )}

        {/* External navigation + instruction */}
        <div className="flex gap-2">
          {currentTarget && (
            <a
              href={`https://maps.google.com/maps?daddr=${currentTarget.latitude},${currentTarget.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-blush-300 text-sm text-charcoal/70 hover:bg-cream transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Maps
            </a>
          )}
          {activeCheckpoint?.instructionText && (
            <button
              onClick={() => setShowInstruction(!showInstruction)}
              className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-blush-300 text-sm text-charcoal/70 hover:bg-cream transition-colors"
              aria-label="Show clue"
            >
              <MapPin className="h-4 w-4" />
              Clue
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showInstruction ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Checkpoint unlock modal */}
      <AnimatePresence>
        {unlockedContent && (
          <CheckpointReveal
            content={unlockedContent}
            onContinue={async () => {
              setUnlockedContent(null)
              routeFetchedForRef.current = null
              await loadCheckpoint()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckpointReveal({
  content,
  onContinue,
}: {
  content: {
    romanticMessage: string
    imageUrl?: string | null
    audioUrl?: string | null
    clue?: string | null
    checkpointTitle: string
  }
  onContinue: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-title"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-cream rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Gold header */}
        <div className="bg-gradient-to-r from-burgundy to-burgundy-600 px-6 py-5 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-4xl mb-2"
            aria-hidden="true"
          >
            ✨
          </motion.div>
          <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">You found it!</p>
          <h2 id="checkpoint-title" className="font-serif text-xl font-semibold text-white">
            {content.checkpointTitle}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Image */}
          {content.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.imageUrl}
              alt="A memory"
              className="w-full rounded-2xl object-cover max-h-48"
            />
          )}

          {/* Message */}
          <p className="font-serif text-charcoal leading-relaxed italic">{content.romanticMessage}</p>

          {/* Audio */}
          {content.audioUrl && (
            <div>
              <audio ref={audioRef} src={content.audioUrl} preload="none" />
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 text-sm text-burgundy font-medium hover:opacity-80"
              >
                <span className="w-8 h-8 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy">
                  {playing ? '⏸' : '▶'}
                </span>
                {playing ? 'Pause voice message' : 'Play voice message'}
              </button>
            </div>
          )}

          {/* Clue */}
          {content.clue && (
            <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-gold-500 mb-1">Your next clue</p>
              <p className="text-sm text-charcoal">{content.clue}</p>
            </div>
          )}

          <Button onClick={onContinue} className="w-full" size="lg">
            Continue Journey
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
