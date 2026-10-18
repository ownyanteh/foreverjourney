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
      <div className="flex-1 flex flex-col items-center justify-center px-7 py-12 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          {/* Icon */}
          <div className="w-[84px] h-[84px] rounded-full bg-burgundy/[0.08] flex items-center justify-center mx-auto mb-7 shadow-[0_0_0_10px_rgba(122,32,56,0.04)]">
            <MapPin className="h-[38px] w-[38px] text-burgundy" strokeWidth={1.8} />
          </div>

          <h1 className="font-serif text-[27px] leading-[1.22] font-semibold text-charcoal mb-3.5">
            One last thing before we begin
          </h1>

          <p className="text-charcoal/70 text-[15px] mb-7 leading-[1.65]">
            This journey uses your device&apos;s location to guide you along the route and unlock
            surprises as you arrive at each special place.
          </p>

          {/* Privacy assurance */}
          <div className="bg-white/75 rounded-[20px] border border-blush-200 p-[18px] mb-7 text-left flex flex-col gap-3.5">
            <div className="flex items-start gap-3">
              <Shield className="h-[18px] w-[18px] text-burgundy mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-[1.55] text-charcoal/[0.72]">
                Your location is only used to guide you — it&apos;s never stored as a detailed trail.
              </p>
            </div>
            <div className="h-px bg-blush-200" aria-hidden="true" />
            <div className="flex items-start gap-3">
              <Navigation className="h-[18px] w-[18px] text-burgundy mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-[1.55] text-charcoal/[0.72]">
                Location updates may pause if your phone is locked or the browser is backgrounded.
              </p>
            </div>
          </div>

          {/* Status messages */}
          {status === 'denied' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-[18px] px-4 py-3.5 mb-2.5 text-left"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Location access denied</p>
                  <p className="text-[13px] leading-[1.5] text-red-700 mb-2.5">
                    To enable it: go to your browser settings → Site Settings → Location → Allow.
                  </p>
                  <a
                    href={`https://maps.google.com/maps?q=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[44px] -my-3 text-[13px] font-medium text-burgundy underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Maps instead
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'unsupported' && (
            <div className="bg-amber-50 border border-amber-200 rounded-[18px] px-4 py-3.5 mb-6 text-left" role="alert">
              <p className="text-[13px] leading-[1.5] text-amber-800">
                Your browser doesn&apos;t support location services. Please use Chrome or Safari on
                a modern device.
              </p>
            </div>
          )}

          {status === 'timeout' && (
            <div className="bg-amber-50 border border-amber-200 rounded-[18px] px-4 py-3.5 mb-6 text-left" role="alert">
              <p className="text-[13px] leading-[1.5] text-amber-800">
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
              className="w-full h-14 gap-2.5 rounded-2xl text-base font-semibold shadow-[0_14px_30px_rgba(122,32,56,0.28)]"
            >
              <MapPin className="h-[18px] w-[18px]" />
              {status === 'requesting' ? 'Getting your location…' : 'Allow Location Access'}
            </Button>
          )}

          {status === 'denied' && (
            <Button
              onClick={() => router.push(`/journey/${token}/navigate?manual=1`)}
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-[14px] border-blush-300 text-charcoal/75 text-[15px] font-medium hover:bg-blush-100"
            >
              Continue without GPS
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
