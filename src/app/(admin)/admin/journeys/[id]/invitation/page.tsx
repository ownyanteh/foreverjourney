'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Link2, Copy, Check, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  adminCard,
  adminCardHeader,
  adminCardTitle,
  adminCardBody,
  adminBtnPrimary,
  adminBackBtn,
  adminPageTitle,
  adminPageSubtitle,
  adminAlertError,
} from '@/components/admin/adminStyles'

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

  const smallOutline =
    'h-[38px] px-3.5 gap-1.5 rounded-[10px] border border-blush-300 bg-white text-charcoal text-[13px] font-medium hover:bg-blush-100 hover:text-charcoal'
  const stepNum =
    'w-[26px] h-[26px] rounded-full bg-blush-100 text-burgundy text-xs font-bold flex items-center justify-center flex-shrink-0'

  return (
    <div className="flex flex-col gap-6 max-w-[720px] mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div>
          <h1 className={adminPageTitle}>Invitation Link</h1>
          <p className={adminPageSubtitle}>Generate a private link to send to your partner.</p>
        </div>
      </div>

      {error && <div className={adminAlertError} role="alert">{error}</div>}

      {!isActive && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Journey is not active</p>
            <p className="text-sm text-amber-700">Activate the journey before generating an invitation link.</p>
          </div>
        </div>
      )}

      <Card className={adminCard}>
        <CardHeader className={adminCardHeader}>
          <CardTitle className={cn(adminCardTitle, 'flex items-center gap-2')}>
            <Link2 className="h-[18px] w-[18px] text-burgundy" />
            Invitation URL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {invitationUrl ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3.5">
              <p className="text-sm font-medium text-charcoal">Your invitation link</p>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 min-h-[46px] flex items-center bg-cream border border-blush-300 rounded-xl px-3.5 py-2.5 text-[13px] text-charcoal font-mono break-all">
                  {invitationUrl}
                </div>
                <Button onClick={copyUrl} variant="outline" size="icon" aria-label="Copy link" className={cn(adminBtnPrimary, 'h-[46px] w-auto px-4 gap-1.5 flex-shrink-0 border-0')}>
                  {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
              <p className="text-xs text-charcoal/45">
                ⚠️ This link was shown to you only once. If you lose it, generate a new one (the old link will be invalidated).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={generate} loading={generating} variant="outline" size="sm" className={smallOutline}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button onClick={revoke} loading={revoking} variant="destructive" size="sm" className={cn(smallOutline, 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700')}>
                  <X className="h-3.5 w-3.5" />
                  Revoke
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-6">
              <Link2 className="h-10 w-10 text-blush-300 mx-auto mb-4" />
              <p className="text-charcoal/60 mb-6 text-sm">No invitation link generated yet.</p>
              <Button onClick={generate} loading={generating} disabled={!isActive} className={adminBtnPrimary}>
                Generate Invitation Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={adminCard}>
        <CardHeader className={adminCardHeader}>
          <CardTitle className={adminCardTitle}>How it works</CardTitle>
        </CardHeader>
        <CardContent className={adminCardBody}>
          <ol className="flex flex-col gap-3.5 text-sm leading-[1.55] text-charcoal/75">
            <li className="flex items-start gap-3.5"><span className={stepNum} aria-hidden="true">1</span><span>Generate a unique, private invitation link.</span></li>
            <li className="flex items-start gap-3.5"><span className={stepNum} aria-hidden="true">2</span><span>Copy and send the link to your partner via text or email.</span></li>
            <li className="flex items-start gap-3.5"><span className={stepNum} aria-hidden="true">3</span><span>She opens the link on her phone to begin the journey.</span></li>
            <li className="flex items-start gap-3.5 rounded-xl bg-amber-50 px-3 py-2.5 text-amber-800">
              <AlertTriangle className="h-[18px] w-[18px] flex-shrink-0 mt-px" aria-hidden="true" />
              <span>Revoking the link immediately invalidates it — she won&apos;t be able to open the journey again.</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
