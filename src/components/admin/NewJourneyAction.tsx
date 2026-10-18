'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { adminBtnPrimary, adminBtnOutline, adminTextarea, adminLabel } from '@/components/admin/adminStyles'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  used: number
  limit: number
  alreadyRequested: boolean
}

/**
 * "New Journey" button while the account has journeys left; once the limit is
 * reached, a "Request more journeys" button that notifies the site owner.
 */
export default function NewJourneyAction({ used, limit, alreadyRequested }: Props) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [requested, setRequested] = useState(alreadyRequested)
  const [error, setError] = useState('')

  const atLimit = used >= limit

  async function sendRequest() {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/journey-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Could not send your request. Please try again.')
        return
      }
      setRequested(true)
      setOpen(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col items-start sm:items-end gap-1.5">
      {!atLimit ? (
        <Button asChild className={adminBtnPrimary}>
          <Link href="/admin/journeys/new">
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            New Journey
          </Link>
        </Button>
      ) : requested ? (
        <span className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-medium text-emerald-800">
          <Check className="h-4 w-4" /> Request sent
        </span>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className={adminBtnPrimary}>
          <Send className="h-4 w-4" />
          Request more journeys
        </Button>
      )}
      <p className="text-xs text-charcoal/50">
        {used} of {limit} journey{limit === 1 ? '' : 's'} used
        {atLimit && requested && ". We'll be in touch."}
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Request more journeys</DialogTitle>
            <DialogDescription>
              Each account can create {limit} journey{limit === 1 ? '' : 's'} for now. Let us know you&apos;d like more and we&apos;ll get in touch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 mt-2">
            <label htmlFor="request-note" className={adminLabel}>
              Anything you&apos;d like to add? <span className="font-normal text-charcoal/45">(optional)</span>
            </label>
            <Textarea
              id="request-note"
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I'm planning an anniversary surprise too."
              className={adminTextarea}
            />
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">{error}</p>
          )}
          <div className="flex gap-3 mt-2">
            <Button type="button" onClick={sendRequest} loading={sending} className={cn(adminBtnPrimary, 'flex-1')}>
              Send request
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className={adminBtnOutline}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
