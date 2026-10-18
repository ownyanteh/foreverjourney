'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function NoPage() {
  const params = useParams()
  const token = params.token as string
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch(`/api/journey/${token}/completion`)
      .then((r) => r.json())
      .then((json) => {
        if (json.responseStatus !== 'no') return
        setMessage(json.noMessage ?? "Thank you for being honest with me. Whatever your answer, I appreciate you and respect your decision.")
      })
  }, [token])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-cream px-[34px] font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center"
      >
        <div className="w-[88px] h-[88px] rounded-full bg-blush-200 flex items-center justify-center mx-auto mb-[34px]">
          <Heart className="h-10 w-10 text-burgundy/[0.55]" strokeWidth={1.8} />
        </div>

        <h1 className="font-serif text-[27px] leading-[1.25] font-semibold text-charcoal mb-5" aria-live="polite">
          Thank you for your honesty.
        </h1>

        <p className="font-serif text-lg text-charcoal/70 leading-[1.7] italic">
          {message || "Thank you for being honest with me. Whatever your answer, I appreciate you and respect your decision."}
        </p>
      </motion.div>
    </div>
  )
}
