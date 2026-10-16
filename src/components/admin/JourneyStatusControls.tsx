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

  async function callAction(action: 'activate' | 'deactivate' | 'reset') {
    setLoading(action)
    setError('')
    try {
      const res = await fetch(`/api/admin/journeys/${journeyId}/${action}`, { method: 'POST' })
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
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {(status === 'draft' || status === 'deactivated') && (
          <Button
            onClick={() => callAction('activate')}
            loading={loading === 'activate'}
            size="sm"
            className="gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            Activate Journey
          </Button>
        )}
        {status === 'active' && (
          <Button
            onClick={() => callAction('deactivate')}
            loading={loading === 'deactivate'}
            variant="secondary"
            size="sm"
            className="gap-1.5"
          >
            <Pause className="h-3.5 w-3.5" />
            Deactivate
          </Button>
        )}
        {status !== 'draft' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset this journey?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will set the journey back to Draft status and abandon active sessions.
                  Historical events and responses are preserved for your records.
                </AlertDialogDescription>
              </AlertDialogHeader>
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
