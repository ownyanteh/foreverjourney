'use client'

import { useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isGoogleMapsShortLink, parseGoogleMapsCoordinates } from '@/lib/geo/google-maps'

interface Props {
  onCoordinates: (lat: number, lng: number) => void
}

/**
 * Paste a Google Maps link or copied "lat, lng" pair to fill in coordinates.
 */
export default function GoogleMapsPasteInput({ onCoordinates }: Props) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'loading' | 'ok' | 'error'; message?: string }>({ kind: 'idle' })
  // Paste, blur and Enter can all fire for the same text; resolve it once
  const lastResolved = useRef('')

  async function resolve(text: string) {
    const trimmed = text.trim()
    if (trimmed === lastResolved.current) return
    lastResolved.current = trimmed
    if (!trimmed) {
      setStatus({ kind: 'idle' })
      return
    }

    const direct = parseGoogleMapsCoordinates(trimmed)
    if (direct) {
      onCoordinates(direct.lat, direct.lng)
      setStatus({ kind: 'ok', message: `Set to ${direct.lat.toFixed(6)}, ${direct.lng.toFixed(6)}` })
      return
    }

    if (isGoogleMapsShortLink(trimmed)) {
      setStatus({ kind: 'loading', message: 'Reading link…' })
      try {
        const res = await fetch('/api/admin/resolve-maps-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })
        const json = await res.json()
        if (res.ok && typeof json.lat === 'number' && typeof json.lng === 'number') {
          onCoordinates(json.lat, json.lng)
          setStatus({ kind: 'ok', message: `Set to ${json.lat.toFixed(6)}, ${json.lng.toFixed(6)}` })
        } else {
          setStatus({ kind: 'error', message: json.error || "Couldn't read that link." })
        }
      } catch {
        setStatus({ kind: 'error', message: 'Network error. Please try again.' })
      }
      return
    }

    setStatus({
      kind: 'error',
      message:
        "No coordinates found. In Google Maps, right-click the spot and click the coordinates to copy them, or paste the place's share link.",
    })
  }

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-charcoal/50" />
        Paste from Google Maps
      </Label>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text')
          // Let the paste land in the field, then resolve it
          setTimeout(() => resolve(text), 0)
        }}
        onBlur={() => resolve(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            resolve(value)
          }
        }}
        placeholder="Google Maps link or 5.6037, -0.1870"
      />
      {status.kind !== 'idle' && (
        <p
          className={
            status.kind === 'error'
              ? 'text-xs text-red-600'
              : status.kind === 'ok'
                ? 'text-xs text-green-700'
                : 'text-xs text-charcoal/50'
          }
          role={status.kind === 'error' ? 'alert' : 'status'}
        >
          {status.message}
        </p>
      )}
    </div>
  )
}
