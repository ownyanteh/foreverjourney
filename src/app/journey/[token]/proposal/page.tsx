'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Heart, Music, VolumeX, Sparkle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProposalContent {
  title: string
  mainMessage: string
  finalQuestion: string
  yesLabel: string
  noLabel: string
  backgroundImageUrl?: string | null
  couplePhotoUrl?: string | null
  musicUrl?: string | null
}

type Stage = 'loading' | 'message1' | 'message2' | 'question' | 'responded'

// Decorative falling petals (hearts + sparkles in brand tones)
const PETAL_VARIANTS = [
  { Icon: Heart, className: 'h-4 w-4 text-blush-300 fill-blush-300 opacity-[0.55]' },
  { Icon: Sparkle, className: 'h-3 w-3 text-gold fill-gold opacity-60' },
  { Icon: Heart, className: 'h-5 w-5 text-burgundy-300 fill-burgundy-300 opacity-[0.45]' },
  { Icon: Heart, className: 'h-3.5 w-3.5 text-blush fill-blush opacity-40' },
  { Icon: Sparkle, className: 'h-2.5 w-2.5 text-gold fill-gold opacity-[0.55]' },
]

export default function ProposalPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const prefersReducedMotion = useReducedMotion()

  const [content, setContent] = useState<ProposalContent | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; variant: number }[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check if already responded (page refresh)
  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/journey/${token}/completion`)
      if (res.ok) {
        const json = await res.json()
        if (json.responseStatus === 'yes') { router.replace(`/journey/${token}/yes`); return }
        if (json.responseStatus === 'no') { router.replace(`/journey/${token}/no`); return }
      }

      // Load proposal content
      const stateRes = await fetch(`/api/journey/${token}/final-destination/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: 0, longitude: 0, accuracy: 9999 }),
      })
      const stateJson = await stateRes.json()
      if (stateJson.proposalContent) {
        setContent(stateJson.proposalContent)
      }

      // Begin cinematic sequence
      setTimeout(() => setStage('message1'), 500)
      setTimeout(() => setStage('message2'), 2500)
      setTimeout(() => setStage('question'), 5000)
    }
    init()
  }, [token, router])

  // Petals on question reveal
  useEffect(() => {
    if (stage !== 'question') return
    if (prefersReducedMotion) return
    const newPetals = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      variant: i % PETAL_VARIANTS.length,
    }))
    setPetals(newPetals)
  }, [stage, prefersReducedMotion])

  function toggleMusic() {
    if (!audioRef.current) return
    if (musicPlaying) { audioRef.current.pause(); setMusicPlaying(false) }
    else { audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {}) }
  }

  async function handleResponse(response: 'yes' | 'no') {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/journey/${token}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      if (res.ok) {
        router.push(`/journey/${token}/${response}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const bgStyle = content?.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(36,33,38,0.5) 0%, rgba(74,19,34,0.8) 100%), url(${content.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'radial-gradient(110% 70% at 50% 30%, #62192D 0%, #320C17 60%, #1A060C 100%)',
      }

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: 'easeOut' }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-7 py-16 font-sans text-white" style={bgStyle}>
      {/* Music */}
      {content?.musicUrl && (
        <audio ref={audioRef} src={content.musicUrl} loop preload="none" />
      )}
      {content?.musicUrl && (
        <button
          onClick={toggleMusic}
          className="absolute top-5 right-5 h-11 w-11 flex items-center justify-center rounded-full bg-white/[0.12] backdrop-blur-sm border border-white/25 text-white/90 hover:bg-white/20 transition-colors z-20"
          aria-label={musicPlaying ? 'Pause music' : 'Play music'}
        >
          {musicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </button>
      )}

      {/* Petals */}
      {petals.map((p) => {
        const { Icon, className } = PETAL_VARIANTS[p.variant]
        return (
          <span
            key={p.id}
            className="fixed pointer-events-none select-none petal"
            style={{
              left: `${p.left}%`,
              top: '-40px',
              animationDuration: `${4 + p.delay}s`,
              animationDelay: `${p.delay}s`,
            }}
            aria-hidden="true"
          >
            <Icon className={className} />
          </span>
        )
      })}

      <div className="relative z-10 max-w-sm w-full text-center flex flex-col items-center">
        {/* Loading */}
        {stage === 'loading' && (
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Heart className="h-12 w-12 text-white mx-auto fill-white" />
          </motion.div>
        )}

        {/* Message 1 */}
        <AnimatePresence>
          {(stage === 'message1' || stage === 'message2' || stage === 'question') && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitionConfig}
              className="font-serif text-[22px] font-medium text-white/[0.88] mb-[26px]"
            >
              {content?.title ?? 'You made it, my love.'}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Couple photo */}
        <AnimatePresence>
          {(stage === 'message2' || stage === 'question') && content?.couplePhotoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={transitionConfig}
              className="mb-[26px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.couplePhotoUrl}
                alt="Us"
                className="w-[124px] h-[124px] rounded-full object-cover mx-auto border-4 border-white/85 shadow-[0_0_0_10px_rgba(255,255,255,0.08)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message 2 */}
        <AnimatePresence>
          {(stage === 'message2' || stage === 'question') && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitionConfig, delay: prefersReducedMotion ? 0 : 0.3 }}
              className="font-serif text-[17px] text-white/80 leading-[1.65] italic mb-[34px]"
            >
              {content?.mainMessage ?? ''}
            </motion.p>
          )}
        </AnimatePresence>

        {/* THE QUESTION */}
        <AnimatePresence>
          {stage === 'question' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...transitionConfig, delay: prefersReducedMotion ? 0 : 0.4 }}
              className="w-full flex flex-col items-center"
            >
              <h1 className="font-serif text-[42px] font-bold text-white leading-[1.1] mb-9">
                {content?.finalQuestion ?? 'Will you marry me?'}
              </h1>

              {/* Response buttons */}
              <div className="w-full flex flex-col items-center gap-4" role="group" aria-label="Proposal response">
                <Button
                  variant="yes-button"
                  size="xl"
                  className="w-full h-16 py-0 px-6 rounded-[20px] border-0 bg-[linear-gradient(180deg,#E4C589_0%,#D8B46A_100%)] text-burgundy-800 text-xl font-bold shadow-[0_0_0_6px_rgba(216,180,106,0.18),0_20px_44px_rgba(216,180,106,0.35)] hover:shadow-[0_0_0_8px_rgba(216,180,106,0.22),0_24px_50px_rgba(216,180,106,0.45)] hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-offset-burgundy-800"
                  onClick={() => handleResponse('yes')}
                  disabled={submitting}
                  aria-label="Yes, I will marry you"
                >
                  {content?.yesLabel ?? 'YES! ❤️'}
                </Button>
                <Button
                  variant="no-button"
                  size="lg"
                  className="h-11 px-6 bg-transparent backdrop-blur-none border-0 rounded-xl text-white/60 text-[15px] font-medium hover:bg-white/5 hover:text-white/80 focus-visible:ring-offset-burgundy-800"
                  onClick={() => handleResponse('no')}
                  disabled={submitting}
                  aria-label="No"
                >
                  {content?.noLabel ?? 'No'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
