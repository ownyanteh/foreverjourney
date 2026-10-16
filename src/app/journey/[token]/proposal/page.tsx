'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Heart, Music, VolumeX } from 'lucide-react'
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

export default function ProposalPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const prefersReducedMotion = useReducedMotion()

  const [content, setContent] = useState<ProposalContent | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [petals, setPetals] = useState<{ id: number; left: number; delay: number; emoji: string }[]>([])
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
    const emojis = ['🌸', '❤️', '✨', '💕', '🌹']
    const newPetals = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      emoji: emojis[i % emojis.length],
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
        background: 'linear-gradient(135deg, #242126 0%, #4a1322 40%, #7A2038 100%)',
      }

  const transitionConfig = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: 'easeOut' }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden" style={bgStyle}>
      {/* Music */}
      {content?.musicUrl && (
        <audio ref={audioRef} src={content.musicUrl} loop preload="none" />
      )}
      {content?.musicUrl && (
        <button
          onClick={toggleMusic}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:bg-white/20 transition-colors z-20"
          aria-label={musicPlaying ? 'Pause music' : 'Play music'}
        >
          {musicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </button>
      )}

      {/* Petals */}
      {petals.map((p) => (
        <span
          key={p.id}
          className="fixed text-2xl pointer-events-none select-none petal"
          style={{
            left: `${p.left}%`,
            top: '-40px',
            animationDuration: `${4 + p.delay}s`,
            animationDelay: `${p.delay}s`,
          }}
          aria-hidden="true"
        >
          {p.emoji}
        </span>
      ))}

      <div className="relative z-10 max-w-sm w-full mx-4 text-center px-2 space-y-8">
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
              className="text-white/70 text-sm font-medium tracking-widest uppercase"
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
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.couplePhotoUrl}
                alt="Us"
                className="w-48 h-48 rounded-full object-cover mx-auto border-4 border-gold/50 shadow-2xl"
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
              className="font-serif text-xl text-white leading-relaxed italic"
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
              className="space-y-8"
            >
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                {content?.finalQuestion ?? 'Will you marry me?'}
              </h1>

              {/* Response buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Proposal response">
                <Button
                  variant="yes-button"
                  size="xl"
                  onClick={() => handleResponse('yes')}
                  disabled={submitting}
                  aria-label="Yes, I will marry you"
                >
                  {content?.yesLabel ?? 'YES! ❤️'}
                </Button>
                <Button
                  variant="no-button"
                  size="lg"
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
