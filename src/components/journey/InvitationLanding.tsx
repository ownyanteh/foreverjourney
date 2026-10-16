'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Music, VolumeX, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  token: string
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

export default function InvitationLanding({ token, title, welcomeContent, theme }: Props) {
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
      router.push(`/journey/${token}/start`)
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
    : { background: `linear-gradient(135deg, ${theme.primaryColor} 0%, #4a1322 50%, ${theme.backgroundColor} 100%)` }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden"
      style={bgStyle}
    >
      {/* Optional background music */}
      {welcomeContent.musicUrl && (
        <audio ref={audioRef} src={welcomeContent.musicUrl} loop preload="none" />
      )}

      {/* Music control */}
      {welcomeContent.musicUrl && (
        <button
          onClick={toggleMusic}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 transition-colors z-10"
          aria-label={musicPlaying ? 'Pause music' : 'Play music'}
        >
          {musicPlaying ? <VolumeX className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        </button>
      )}

      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {['💕', '❤️', '✨', '🌸', '💫'].map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-30"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 max-w-sm w-full mx-4 text-center px-2"
      >
        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-8"
        >
          <Heart className="h-10 w-10 text-white fill-white" />
        </motion.div>

        {/* Greeting */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/70 text-sm font-medium tracking-widest uppercase mb-3"
        >
          A message for you
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="font-serif text-3xl sm:text-4xl font-semibold text-white mb-6 leading-tight"
        >
          {title}
        </motion.h1>

        {/* Greeting text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-white/80 text-lg font-serif italic mb-3"
        >
          {welcomeContent.greeting}
        </motion.p>

        {/* Introduction */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-white/70 text-base leading-relaxed mb-10"
        >
          {welcomeContent.introduction}
        </motion.p>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-300 text-sm mb-4 bg-red-900/30 rounded-xl px-4 py-3"
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
        >
          <Button
            onClick={handleStart}
            loading={starting}
            size="xl"
            className="bg-white text-burgundy hover:bg-cream font-semibold shadow-2xl hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all duration-300 px-10 rounded-2xl border-0 w-full sm:w-auto"
          >
            {!starting && <Heart className="h-5 w-5 fill-burgundy text-burgundy" />}
            Begin Our Journey
            {!starting && <ChevronRight className="h-5 w-5" />}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
