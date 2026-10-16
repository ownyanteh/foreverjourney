'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Link2, Copy, Check, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function InvitationPage() {
  const params = useParams()
  const journeyId = params.id as string

  const [invitationUrl, setInvitationUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [journeyStatus, setJourneyStatus] = useState('')

  useEffect(() => {
    fetch(`/api/admin/journeys/${journeyId}`)
      .then((r) => r.json())
      .then((json) => {
        setJourneyStatus(json.journey?.status ?? '')
      })
  }, [journeyId])

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/journeys/${journeyId}/invitation`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to generate invitation.'); return }
      setInvitationUrl(json.invitationUrl)
    } finally {
      setGenerating(false)
    }
  }

  async function revoke() {
    setRevoking(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/journeys/${journeyId}/invitation/revoke`, { method: 'POST' })
      if (!res.ok) { setError('Failed to revoke invitation.'); return }
      setInvitationUrl('')
    } finally {
      setRevoking(false)
    }
  }

  async function copyUrl() {
    if (!invitationUrl) return
    await navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isActive = journeyStatus === 'active'

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/admin/journeys/${journeyId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Invitation Link</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Generate a private link to send to your partner.</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">{error}</div>}

      {!isActive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Journey is not active</p>
            <p className="text-sm text-amber-700">Activate the journey before generating an invitation link.</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-burgundy" />
            Invitation URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitationUrl ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-xs text-charcoal/50 uppercase tracking-wide font-medium">Your invitation link</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-cream border border-blush-200 rounded-xl px-4 py-3 text-sm text-charcoal font-mono break-all">
                  {invitationUrl}
                </div>
                <Button onClick={copyUrl} variant="outline" size="icon" aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-charcoal/40">
                ⚠️ This link was shown to you only once. If you lose it, generate a new one (the old link will be invalidated).
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={generate} loading={generating} variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button onClick={revoke} loading={revoking} variant="destructive" size="sm" className="gap-1.5">
                  <X className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <Link2 className="h-10 w-10 text-blush-300 mx-auto mb-4" />
              <p className="text-charcoal/60 mb-6 text-sm">No invitation link generated yet.</p>
              <Button onClick={generate} loading={generating} disabled={!isActive}>
                Generate Invitation Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-medium text-charcoal mb-2">How it works</h3>
          <ol className="text-sm text-charcoal/60 space-y-1.5 list-decimal list-inside">
            <li>Generate a unique, private invitation link.</li>
            <li>Copy and send the link to your partner via text or email.</li>
            <li>She opens the link on her phone to begin the journey.</li>
            <li>Revoking the link immediately invalidates it — she won&apos;t be able to open the journey again.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
