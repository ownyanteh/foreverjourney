'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import MemoryCapture from '@/components/journey/MemoryCapture'

interface CompletionData {
  responseStatus: string
  yesMessage: string
}

export default function YesPage() {
  const params = useParams()
  const token = params.token as string
  const prefersReducedMotion = useReducedMotion()
  const [data, setData] = useState<CompletionData | null>(null)
  const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; size: number }[]>([])
  const hasAnimated = useRef(false)

  useEffect(() => {
    fetch(`/api/journey/${token}/completion`)
      .then((r) => r.json())
      .then((json) => {
        if (json.responseStatus !== 'yes') {
          // Shouldn't be here — but handle gracefully
          return
        }
        setData(json)
      })
  }, [token])

  useEffect(() => {
    if (prefersReducedMotion || hasAnimated.current) return
    hasAnimated.current = true
    setHearts(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        size: 1 + Math.random() * 1.5,
      }))
    )
  }, [prefersReducedMotion])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden py-12 bg-gradient-to-br from-burgundy via-[#a03050] to-[#7A2038]">
      {/* Floating hearts */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="fixed pointer-events-none select-none petal"
          style={{
            left: `${h.left}%`,
            top: '-40px',
            fontSize: `${h.size}rem`,
            animationDuration: `${5 + h.delay}s`,
            animationDelay: `${h.delay}s`,
          }}
          aria-hidden="true"
        >
          ❤️
        </span>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, type: 'spring' }}
        className="relative z-10 max-w-sm w-full mx-4 text-center px-2"
      >
        {/* Animated heart */}
        <motion.div
          animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-8"
        >
          <Heart className="h-14 w-14 text-white fill-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
          className="font-serif text-4xl font-bold text-white mb-4"
          aria-live="polite"
        >
          YOU SAID YES!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 1 }}
          className="font-serif text-lg text-white/80 leading-relaxed italic"
        >
          {data?.yesMessage ?? 'Today, our next adventure begins. I can\'t wait to build a lifetime of beautiful memories with you.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 1.5 }}
          className="mt-10 text-4xl"
          aria-hidden="true"
        >
          💍
        </motion.div>

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 2.2 }}
            className="mt-10"
          >
            <MemoryCapture token={token} />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
