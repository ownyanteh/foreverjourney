'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { JourneyStatusType } from '@/types'

interface Props {
  journeyId: string
  status: JourneyStatusType
  hasInvitation: boolean
}

export default function JourneyStatusControls({ journeyId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [resetDeletesMemories, setResetDeletesMemories] = useState(false)

  async function callAction(action: 'activate' | 'deactivate' | 'reset') {
    setLoading(action)
    setError('')
    try {
      const res = await fetch(`/api/admin/journeys/${journeyId}/${action}`, {
        method: 'POST',
        ...(action === 'reset'
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deleteMemories: resetDeletesMemories }) }
          : {}),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || `Failed to ${action}.`); return }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {(status === 'draft' || status === 'deactivated') && (
          <Button
            onClick={() => callAction('activate')}
            loading={loading === 'activate'}
            size="sm"
            className="h-9 px-3.5 gap-1.5 rounded-[10px] bg-burgundy text-white text-[13px] font-semibold shadow-none hover:bg-burgundy-600 active:scale-100"
          >
            <Play className="h-[13px] w-[13px] fill-current" />
            Activate Journey
          </Button>
        )}
        {status === 'active' && (
          <Button
            onClick={() => callAction('deactivate')}
            loading={loading === 'deactivate'}
            variant="secondary"
            size="sm"
            className="h-9 px-3.5 gap-1.5 rounded-[10px] border-0 bg-blush-100 text-charcoal text-[13px] font-medium hover:bg-blush-200"
          >
            <Pause className="h-[13px] w-[13px]" />
            Deactivate
          </Button>
        )}
        {status !== 'draft' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 gap-1.5 rounded-[10px] border border-blush-300 bg-white text-charcoal text-[13px] font-medium hover:bg-blush-100 hover:text-charcoal"
              >
                <RotateCcw className="h-[13px] w-[13px]" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset this journey?</AlertDialogTitle>
                <AlertDialogDescription>
                  This sets the journey back to Draft and permanently deletes all of its history:
                  progress, checkpoint unlocks, the event timeline and the yes/no response.
                  {resetDeletesMemories
                    ? ' Shared photos and messages will also be deleted.'
                    : ' Shared photos and messages are kept.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <label className="flex items-start gap-3 rounded-xl border border-blush-200 bg-blush-100/50 px-3.5 py-3 text-sm text-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetDeletesMemories}
                  onChange={(e) => setResetDeletesMemories(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-burgundy"
                />
                <span>
                  Also delete shared photos and messages
                  <span className="block text-xs text-charcoal/55 mt-0.5">Removes them permanently, including the photo files. This can&apos;t be undone.</span>
                </span>
              </label>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => callAction('reset')}
                  disabled={loading === 'reset'}
                >
                  Reset Journey
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
