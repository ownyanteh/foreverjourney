import { FEELINGS } from '@/lib/validation/schemas'

export type Feeling = (typeof FEELINGS)[number]

/** Display metadata for the feelings she can pick when answering a memory question */
export const FEELING_OPTIONS: { value: Feeling; emoji: string; label: string }[] = [
  { value: 'loved', emoji: '🥰', label: 'Loved' },
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'laughed', emoji: '😂', label: 'Laughed' },
  { value: 'touched', emoji: '🥹', label: 'Touched' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
]

export function feelingDisplay(value: string | null | undefined): string | null {
  const option = FEELING_OPTIONS.find((f) => f.value === value)
  return option ? `${option.emoji} ${option.label}` : null
}
