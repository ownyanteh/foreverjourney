'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Save, MessageCircleHeart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { MIN_MEMORY_QUESTIONS, MAX_MEMORY_QUESTIONS } from '@/lib/validation/schemas'
import {
  adminCard,
  adminInput,
  adminTextarea,
  adminLabel,
  adminBtnPrimary,
  adminBackBtn,
  adminPageTitle,
  adminAlertError,
} from '@/components/admin/adminStyles'

interface QuestionDraft {
  prompt: string
  hint: string
}

const EXAMPLES = [
  { prompt: 'The night we first met', hint: 'Do you remember what you thought of me?' },
  { prompt: 'Our first trip together', hint: 'That weekend when everything went wrong and it was still perfect.' },
  { prompt: 'The day I met your family', hint: 'I was so nervous. Were you?' },
  { prompt: 'Our first "I love you"', hint: '' },
  { prompt: 'A random Tuesday that turned into a favourite memory', hint: '' },
]

const empty = (): QuestionDraft => ({ prompt: '', hint: '' })

export default function MemoryQuestionsEditorPage() {
  const params = useParams()
  const journeyId = params.id as string

  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [mode, setMode] = useState<'route' | 'questions'>('route')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/journeys/${journeyId}`)
      .then((r) => r.json())
      .then((json) => {
        const existing: QuestionDraft[] = (json.journey?.memoryQuestions ?? []).map((q: QuestionDraft) => ({
          prompt: q.prompt ?? '',
          hint: q.hint ?? '',
        }))
        setQuestions(existing.length > 0 ? existing : Array.from({ length: MIN_MEMORY_QUESTIONS }, empty))
        setMode(json.journey?.mode === 'questions' ? 'questions' : 'route')
      })
      .finally(() => setLoading(false))
  }, [journeyId])

  function update(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)))
    setSaveStatus('idle')
  }

  function move(index: number, delta: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setSaveStatus('idle')
  }

  async function save() {
    const filled = questions
      .map((q) => ({ prompt: q.prompt.trim(), hint: q.hint.trim() }))
      .filter((q) => q.prompt)
    setError('')
    setSaveStatus('saving')
    const res = await fetch(`/api/admin/journeys/${journeyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryQuestions: filled }),
    })
    if (!res.ok) {
      setSaveStatus('error')
      setError('Could not save. Please check your questions and try again.')
      return
    }
    setQuestions(filled.length > 0 ? filled : [empty()])
    setSaveStatus('saved')
  }

  const filledCount = questions.filter((q) => q.prompt.trim()).length

  if (loading) {
    return <div className="h-64 max-w-[720px] mx-auto bg-blush-100 animate-pulse rounded-[18px]" />
  }

  return (
    <div className="flex flex-col gap-5 max-w-[720px] mx-auto">
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div>
          <h1 className={adminPageTitle}>Memory Questions</h1>
          <p className="text-sm leading-normal text-charcoal/60 mt-1">
            {MIN_MEMORY_QUESTIONS}–{MAX_MEMORY_QUESTIONS} moments you&apos;ve shared. She&apos;ll answer each with how it
            made her feel, then the proposal appears.
          </p>
        </div>
      </div>

      {mode !== 'questions' && (
        <div className="text-sm leading-normal text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
          This journey is set to <strong>Route &amp; destination</strong>. To use these questions, choose{' '}
          <strong>Memory questions</strong> as the journey type on the{' '}
          <Link href={`/admin/journeys/${journeyId}`} className="underline font-medium text-amber-900 hover:text-amber-950">journey overview</Link>.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {questions.map((q, i) => (
          <Card key={i} className={adminCard}>
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-burgundy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-charcoal flex-1">Moment {i + 1}</span>
                <Button type="button" variant="ghost" size="icon-sm" className="h-[34px] w-[34px] rounded-[10px] text-charcoal/60 hover:bg-blush-100 hover:text-charcoal disabled:opacity-[0.35]" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" className="h-[34px] w-[34px] rounded-[10px] text-charcoal/60 hover:bg-blush-100 hover:text-charcoal disabled:opacity-[0.35]" onClick={() => move(i, 1)} disabled={i === questions.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-[34px] w-[34px] rounded-[10px] text-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-[0.35]"
                  onClick={() => { setQuestions((prev) => prev.filter((_, j) => j !== i)); setSaveStatus('idle') }}
                  disabled={questions.length <= 1}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`prompt-${i}`} className={adminLabel}>The moment *</Label>
                <Input
                  id={`prompt-${i}`}
                  className={adminInput}
                  value={q.prompt}
                  maxLength={300}
                  onChange={(e) => update(i, { prompt: e.target.value })}
                  placeholder={EXAMPLES[i % EXAMPLES.length].prompt}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`hint-${i}`} className={adminLabel}>
                  A little note <span className="text-charcoal/45 font-normal">(optional, shown under the moment)</span>
                </Label>
                <Textarea
                  id={`hint-${i}`}
                  className={adminTextarea}
                  rows={2}
                  value={q.hint}
                  maxLength={300}
                  onChange={(e) => update(i, { hint: e.target.value })}
                  placeholder={EXAMPLES[i % EXAMPLES.length].hint || 'Add a detail only the two of you would know…'}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length < MAX_MEMORY_QUESTIONS && (
        <Button type="button" variant="outline" onClick={() => { setQuestions((prev) => [...prev, empty()]); setSaveStatus('idle') }} className="self-start h-10 px-4 gap-1.5 rounded-xl border border-dashed border-burgundy-300 bg-white/60 text-burgundy text-sm font-medium hover:bg-blush-100 hover:text-burgundy">
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Add a moment
        </Button>
      )}

      <div className="flex items-center gap-2 text-sm">
        <MessageCircleHeart className={`h-4 w-4 ${filledCount >= MIN_MEMORY_QUESTIONS ? 'text-emerald-600' : 'text-charcoal/45'}`} />
        <span className={filledCount >= MIN_MEMORY_QUESTIONS ? 'text-emerald-700' : 'text-charcoal/60'}>
          {filledCount} of {MIN_MEMORY_QUESTIONS}–{MAX_MEMORY_QUESTIONS} moments written
          {filledCount < MIN_MEMORY_QUESTIONS && ` (add ${MIN_MEMORY_QUESTIONS - filledCount} more before activating)`}
        </span>
      </div>

      {error && (
        <div className={adminAlertError} role="alert">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saveStatus === 'saving'} className={adminBtnPrimary}>
          {saveStatus !== 'saving' && <Save className="h-4 w-4" />}
          Save Questions
        </Button>
        {saveStatus === 'saved' && <span className="text-sm text-emerald-700">Saved</span>}
      </div>
    </div>
  )
}
