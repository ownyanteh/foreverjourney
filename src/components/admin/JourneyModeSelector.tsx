'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Map, MessageCircleHeart, Check } from 'lucide-react'

interface Props {
  journeyId: string
  mode: 'route' | 'questions'
  locked: boolean
}

const OPTIONS = [
  {
    value: 'route' as const,
    icon: Map,
    title: 'Route & destination',
    description: 'She follows GPS checkpoints to a final location, then the proposal appears.',
  },
  {
    value: 'questions' as const,
    icon: MessageCircleHeart,
    title: 'Memory questions',
    description: 'She answers 3–5 questions about your moments together, then the proposal appears. No travel needed.',
  },
]

export default function JourneyModeSelector({ journeyId, mode, locked }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function choose(value: 'route' | 'questions') {
    if (value === mode || locked) return
    setSaving(value)
    setError('')
    try {
      const res = await fetch(`/api/admin/journeys/${journeyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: value }),
      })
      if (!res.ok) {
        setError('Could not change the journey type.')
        return
      }
      router.refresh()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-charcoal">Journey type</p>
      <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Journey type">
        {OPTIONS.map((o) => {
          const selected = o.value === mode
          const Icon = o.icon
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(o.value)}
              disabled={locked || saving !== null}
              className={`text-left rounded-2xl border p-4 transition-colors flex gap-3 ${
                selected ? 'border-burgundy bg-burgundy/5' : 'border-blush-200 bg-white hover:bg-cream'
              } ${locked && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${selected ? 'text-burgundy' : 'text-charcoal/50'}`} />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
                  {o.title}
                  {selected && <Check className="h-4 w-4 text-burgundy" />}
                  {saving === o.value && <span className="text-xs font-normal text-charcoal/50">Saving…</span>}
                </span>
                <span className="block text-xs text-charcoal/60 mt-1">{o.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      {locked && (
        <p className="text-xs text-charcoal/50">Deactivate or reset the journey to change its type.</p>
      )}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}
