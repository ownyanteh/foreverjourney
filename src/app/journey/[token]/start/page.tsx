'use client'

import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Shield, Navigation, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEffect } from 'react'

export default function StartJourneyPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const { status, startWatching } = useGeolocation()

  // Auto-advance once location is granted
  useEffect(() => {
    if (status === 'granted') {
      router.push(`/journey/${token}/navigate`)
    }
  }, [status, router, token])

  function handleRequestLocation() {
    startWatching()
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-burgundy/10 flex items-center justify-center mx-auto mb-8">
            <MapPin className="h-10 w-10 text-burgundy" />
          </div>

          <h1 className="font-serif text-2xl font-semibold text-charcoal mb-4">
            One last thing before we begin
          </h1>

          <p className="text-charcoal/70 mb-8 leading-relaxed">
            This journey uses your device&apos;s location to guide you along the route and unlock
            surprises as you arrive at each special place.
          </p>

          {/* Privacy assurance */}
          <div className="bg-white/70 rounded-2xl border border-blush-200 p-4 mb-8 text-left space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-burgundy mt-0.5 flex-shrink-0" />
              <p className="text-sm text-charcoal/70">
                Your location is only used to guide you — it&apos;s never stored as a detailed trail.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-4 w-4 text-burgundy mt-0.5 flex-shrink-0" />
              <p className="text-sm text-charcoal/70">
                Location updates may pause if your phone is locked or the browser is backgrounded.
              </p>
            </div>
          </div>

          {/* Status messages */}
          {status === 'denied' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">Location access denied</p>
                  <p className="text-sm text-red-700 mb-3">
                    To enable it: go to your browser settings → Site Settings → Location → Allow.
                  </p>
                  <a
                    href={`https://maps.google.com/maps?q=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Maps instead
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'unsupported' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6" role="alert">
              <p className="text-sm text-amber-800">
                Your browser doesn&apos;t support location services. Please use Chrome or Safari on
                a modern device.
              </p>
            </div>
          )}

          {status === 'timeout' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6" role="alert">
              <p className="text-sm text-amber-800">
                Location timed out. Please ensure you&apos;re outside or move to an area with better
                GPS signal and try again.
              </p>
            </div>
          )}

          {/* CTA */}
          {status !== 'denied' && status !== 'unsupported' && (
            <Button
              onClick={handleRequestLocation}
              size="lg"
              loading={status === 'requesting'}
              className="w-full"
            >
              <MapPin className="h-4 w-4" />
              {status === 'requesting' ? 'Getting your location…' : 'Allow Location Access'}
            </Button>
          )}

          {status === 'denied' && (
            <Button
              onClick={() => router.push(`/journey/${token}/navigate?manual=1`)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Continue without GPS
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
