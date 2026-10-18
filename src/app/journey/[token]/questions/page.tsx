'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FEELING_OPTIONS, type Feeling } from '@/lib/feelings'

interface Question {
  prompt: string
  hint: string
}

interface Draft {
  feeling: Feeling | null
  answer: string
}

type Stage = 'loading' | 'intro' | 'asking' | 'finishing' | 'unavailable'

export default function MemoryQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const prefersReducedMotion = useReducedMotion()

  const [stage, setStage] = useState<Stage>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/journey/${token}/questions`)
      if (!res.ok) {
        setStage('unavailable')
        return
      }
      const json = await res.json()
      if (json.completed) {
        router.replace(`/journey/${token}/proposal`)
        return
      }
      const qs: Question[] = json.questions
      const ds: Draft[] = qs.map(() => ({ feeling: null, answer: '' }))
      for (const a of json.answers as { index: number; feeling: Feeling | null; answer: string }[]) {
        if (ds[a.index]) ds[a.index] = { feeling: a.feeling, answer: a.answer }
      }
      setQuestions(qs)
      setDrafts(ds)
      // Resume at the first unanswered question
      const firstOpen = ds.findIndex((d) => !d.feeling && !d.answer)
      setCurrent(firstOpen === -1 ? qs.length - 1 : firstOpen)
      setStage(firstOpen > 0 ? 'asking' : 'intro')
    }
    load().catch(() => setStage('unavailable'))
  }, [token, router])

  function updateDraft(patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, i) => (i === current ? { ...d, ...patch } : d)))
    setError('')
  }

  async function submitCurrent() {
    const draft = drafts[current]
    if (!draft.feeling && !draft.answer.trim()) {
      setError('Pick a feeling or write a few words.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/journey/${token}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: current, feeling: draft.feeling, answer: draft.answer.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        return
      }
      if (json.completed) {
        setStage('finishing')
        setTimeout(() => router.push(`/journey/${token}/proposal`), prefersReducedMotion ? 800 : 3200)
        return
      }
      // Move to the next unanswered question (normally just the next one)
      const next = drafts.findIndex((d, i) => i > current && !d.feeling && !d.answer)
      setCurrent(next === -1 ? Math.min(current + 1, questions.length - 1) : next)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const draft = drafts[current]
  const question = questions[current]
  const isLast = current === questions.length - 1

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-gradient-to-br from-burgundy via-[#5e1a2d] to-charcoal">
      <AnimatePresence mode="wait">
        {stage === 'loading' && (
          <motion.div key="loading" exit={{ opacity: 0 }} className="text-white/60 text-sm">
            <Heart className="h-8 w-8 text-white/60 animate-pulse mx-auto" />
          </motion.div>
        )}

        {stage === 'unavailable' && (
          <motion.div key="unavailable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
            <p className="font-serif text-xl text-white mb-2">This page isn&apos;t available</p>
            <p className="text-white/60 text-sm">Please open your invitation link again.</p>
          </motion.div>
        )}

        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-sm w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-8">
              <Heart className="h-10 w-10 text-white fill-white" />
            </div>
            <h1 className="font-serif text-3xl font-semibold text-white mb-4 leading-tight">
              A few of our moments
            </h1>
            <p className="text-white/75 leading-relaxed mb-10">
              I want to remember some moments we&apos;ve shared, through your eyes.
              There are {questions.length} of them. Tell me how each one made you feel.
            </p>
            <Button
              onClick={() => setStage('asking')}
              size="xl"
              className="bg-white text-burgundy hover:bg-cream font-semibold rounded-2xl border-0 w-full sm:w-auto px-10"
            >
              Let&apos;s begin
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {stage === 'asking' && question && draft && (
          <motion.div
            key={`q-${current}`}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
            transition={{ duration: 0.35 }}
            className="max-w-md w-full"
          >
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
              {questions.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? 'w-8 bg-white' : i < current || drafts[i]?.feeling || drafts[i]?.answer ? 'w-3 bg-white/70' : 'w-3 bg-white/25'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase text-center mb-3">
              Moment {current + 1} of {questions.length}
            </p>

            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white text-center leading-snug mb-3">
              {question.prompt}
            </h2>
            {question.hint && (
              <p className="text-white/65 text-center italic mb-6">{question.hint}</p>
            )}

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-5 mt-6 space-y-4">
              <fieldset>
                <legend className="text-white/80 text-sm font-medium mb-3">How did it make you feel?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {FEELING_OPTIONS.map((f) => {
                    const selected = draft.feeling === f.value
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => updateDraft({ feeling: selected ? null : f.value })}
                        aria-pressed={selected}
                        className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-sm font-medium transition-all active:scale-95 ${
                          selected
                            ? 'bg-white text-burgundy shadow-lg'
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <span className="text-2xl" aria-hidden="true">{f.emoji}</span>
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="answer" className="text-white/80 text-sm font-medium block mb-2">
                  Tell me more <span className="text-white/50 font-normal">(optional)</span>
                </label>
                <textarea
                  id="answer"
                  rows={4}
                  value={draft.answer}
                  onChange={(e) => updateDraft({ answer: e.target.value.slice(0, 2000) })}
                  placeholder="What do you remember most about it…"
                  className="w-full rounded-2xl bg-white/90 text-charcoal placeholder:text-charcoal/40 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-white bg-red-900/40 rounded-xl px-3 py-2" role="alert">{error}</p>
              )}

              <div className="flex gap-3">
                {current > 0 && (
                  <Button
                    type="button"
                    onClick={() => { setCurrent(current - 1); setError('') }}
                    variant="outline"
                    size="lg"
                    disabled={saving}
                    className="bg-transparent text-white border-white/40 hover:bg-white/10 rounded-2xl"
                    aria-label="Previous moment"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={submitCurrent}
                  loading={saving}
                  size="lg"
                  className="flex-1 bg-white text-burgundy hover:bg-cream font-semibold rounded-2xl border-0"
                >
                  {isLast ? 'Finish' : 'Next'}
                  {!saving && <ChevronRight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'finishing' && (
          <motion.div
            key="finishing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-sm text-center"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-8"
            >
              <Heart className="h-10 w-10 text-white fill-white" />
            </motion.div>
            <p className="font-serif text-2xl text-white mb-3">Thank you, my love.</p>
            <p className="text-white/70">Every one of those moments led here. There&apos;s just one more question…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
