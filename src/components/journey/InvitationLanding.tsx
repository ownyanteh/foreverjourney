'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Music, VolumeX, ChevronRight, Sparkle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
  mode: 'route' | 'questions'
  title: string
  welcomeContent: {
    greeting: string
    introduction: string
    backgroundImageUrl?: string | null
    musicUrl?: string | null
  }
  theme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
  }
}

export default function InvitationLanding({ token, mode, title, welcomeContent, theme }: Props) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function toggleMusic() {
    if (!audioRef.current) return
    if (musicPlaying) {
      audioRef.current.pause()
      setMusicPlaying(false)
    } else {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }

  async function handleStart() {
    setStarting(true)
    setError('')
    try {
      const res = await fetch(`/api/journey/${token}/session`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unable to start journey. Please try again.')
        setStarting(false)
        return
      }
      // Route journeys ask for location first; question journeys go straight to the questions
      router.push(`/journey/${token}/${mode === 'questions' ? 'questions' : 'start'}`)
    } catch {
      setError('Network error. Please check your connection.')
      setStarting(false)
    }
  }

  const bgStyle = welcomeContent.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(122,32,56,0.4) 0%, rgba(36,33,38,0.7) 100%), url(${welcomeContent.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `radial-gradient(120% 80% at 50% 0%, #9A2E4B 0%, ${theme.primaryColor} 38%, #4A1322 72%, #242126 100%)`,
      }

  const floatingDecor = [
    { Icon: Heart, pos: 'left-[11%] top-[18%]', icon: 'h-[22px] w-[22px] text-blush fill-blush', base: 0.22 },
    { Icon: Sparkle, pos: 'right-[14%] top-[25%]', icon: 'h-3.5 w-3.5 text-gold fill-gold', base: 0.35 },
    { Icon: Heart, pos: 'right-[10%] top-[66%]', icon: 'h-[18px] w-[18px] text-blush fill-blush', base: 0.2 },
    { Icon: Sparkle, pos: 'left-[18%] top-[77%]', icon: 'h-3 w-3 text-white fill-white', base: 0.25 },
  ]

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-7 py-16 font-sans text-white"
      style={bgStyle}
    >
      {/* Soft glow overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_40%_at_80%_18%,rgba(216,180,106,0.18)_0%,rgba(216,180,106,0)_70%),radial-gradient(50%_35%_at_10%_85%,rgba(244,221,227,0.12)_0%,rgba(244,221,227,0)_70%)]"
      />

      {/* Optional background music */}
      {welcomeContent.musicUrl && (
        <audio ref={audioRef} src={welcomeContent.musicUrl} loop preload="none" />
      )}

      {/* Music control */}
      {welcomeContent.musicUrl && (
        <button
          onClick={toggleMusic}
          className="absolute top-5 right-5 h-11 w-11 flex items-center justify-center rounded-full bg-white/[0.12] backdrop-blur-sm border border-white/25 text-white/90 hover:bg-white/20 transition-colors z-10"
          aria-label={musicPlaying ? 'Pause music' : 'Play music'}
        >
          {musicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </button>
      )}

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {floatingDecor.map(({ Icon, pos, icon, base }, i) => (
          <motion.span
            key={i}
            className={`absolute ${pos}`}
            style={{ opacity: base }}
            animate={{ y: [0, -15, 0], opacity: [base, base + 0.15, base] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            <Icon className={icon} />
          </motion.span>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 max-w-sm w-full text-center flex flex-col items-center"
      >
        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-[84px] h-[84px] rounded-full bg-white/[0.14] backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-9 shadow-[0_0_0_10px_rgba(255,255,255,0.04),0_20px_50px_rgba(0,0,0,0.25)]"
        >
          <Heart className="h-10 w-10 text-white fill-white" strokeWidth={1.5} />
        </motion.div>

        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/[0.72] text-xs font-semibold tracking-[0.22em] uppercase mb-3.5"
        >
          A message for you
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="font-serif text-[38px] font-semibold text-white mb-[22px] leading-[1.12]"
        >
          {title}
        </motion.h1>

        {/* Greeting text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/[0.88] text-xl font-serif italic mb-3"
        >
          {welcomeContent.greeting}
        </motion.p>

        {/* Introduction */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/[0.74] text-base leading-[1.65] mb-11 max-w-[310px] mx-auto"
        >
          {welcomeContent.introduction}
        </motion.p>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full text-red-100 text-sm mb-4 bg-red-950/40 border border-red-300/30 rounded-2xl px-4 py-3"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="w-full"
        >
          <Button
            onClick={handleStart}
            loading={starting}
            size="xl"
            className="w-full h-[60px] gap-2.5 px-6 rounded-[18px] border-0 bg-white text-burgundy text-[17px] font-semibold shadow-[0_18px_40px_rgba(26,6,12,0.35)] hover:bg-cream hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus-visible:ring-offset-burgundy"
          >
            {!starting && <Heart className="h-5 w-5 fill-burgundy text-burgundy" strokeWidth={1.5} />}
            Begin Our Journey
            {!starting && <ChevronRight className="h-5 w-5" />}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
