'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Map, MessageCircleHeart, Check } from 'lucide-react'

export type JourneyMode = 'route' | 'questions'

interface Props {
  journeyId: string
  mode: JourneyMode
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

/** The two journey type cards, as a radio group. Used on the overview and the New Journey form. */
export function JourneyTypeCards({
  value,
  onChange,
  disabled = false,
  savingValue = null,
}: {
  value: JourneyMode
  onChange: (value: JourneyMode) => void
  disabled?: boolean
  savingValue?: JourneyMode | null
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3" role="radiogroup" aria-label="Journey type">
      {OPTIONS.map((o) => {
        const selected = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            disabled={disabled}
            className={`text-left rounded-2xl p-4 transition-colors flex gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 ${
              selected ? 'border-[1.5px] border-burgundy bg-burgundy/5' : 'border border-blush-200 bg-white hover:bg-blush-100'
            } ${disabled && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${selected ? 'text-burgundy' : 'text-charcoal/50'}`} />
            <span className="flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-charcoal">
                {o.title}
                {selected && <Check className="h-4 w-4 text-burgundy" strokeWidth={2.5} />}
                {savingValue === o.value && <span className="text-xs font-normal text-charcoal/50">Saving…</span>}
              </span>
              <span className="block text-[13px] leading-normal text-charcoal/60 mt-1">{o.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function JourneyModeSelector({ journeyId, mode, locked }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<JourneyMode | null>(null)
  const [error, setError] = useState('')

  async function choose(value: JourneyMode) {
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
    <div className="flex flex-col gap-2.5">
      <p className="text-sm font-medium text-charcoal">Journey type</p>
      <JourneyTypeCards value={mode} onChange={choose} disabled={locked || saving !== null} savingValue={saving} />
      {locked && (
        <p className="text-xs text-charcoal/45">Deactivate or reset the journey to change its type.</p>
      )}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}
