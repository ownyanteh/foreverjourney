'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { proposalContentSchema, finalDestinationSchema } from '@/lib/validation/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Heart, MapPin, Save } from 'lucide-react'
import Link from 'next/link'
import GoogleMapsPasteInput from '@/components/admin/GoogleMapsPasteInput'
import { cn } from '@/lib/utils'
import {
  adminCard,
  adminCardHeader,
  adminCardTitle,
  adminCardBody,
  adminInput,
  adminTextarea,
  adminLabel,
  adminBtnPrimary,
  adminBackBtn,
  adminPageTitle,
  adminPageSubtitle,
  adminAlertError,
} from '@/components/admin/adminStyles'

type ProposalFormData = z.infer<typeof proposalContentSchema>
type FinalDestFormData = z.infer<typeof finalDestinationSchema>

export default function ProposalCustomizationPage() {
  const params = useParams()
  const journeyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isQuestionsMode, setIsQuestionsMode] = useState(false)

  const proposalForm = useForm<ProposalFormData>({
    resolver: zodResolver(proposalContentSchema),
    defaultValues: {
      title: 'You made it, my love.',
      mainMessage: '',
      finalQuestion: 'Will you marry me?',
      yesLabel: 'YES! ❤️',
      noLabel: 'No',
      yesMessage: '',
      noMessage: '',
    },
  })

  const destForm = useForm<FinalDestFormData>({
    resolver: zodResolver(finalDestinationSchema),
    defaultValues: {
      name: 'The Final Destination',
      latitude: 0,
      longitude: 0,
      geofenceRadius: 50,
      approachingRadius: 200,
      approachingMessage: "You're almost there. Take a deep breath. Something special is waiting for you.",
      manualFallbackEnabled: false,
    },
  })

  useEffect(() => {
    fetch(`/api/admin/journeys/${journeyId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.journey?.proposalContent) proposalForm.reset(json.journey.proposalContent)
        if (json.journey?.finalDestination) destForm.reset(json.journey.finalDestination)
        setIsQuestionsMode(json.journey?.mode === 'questions')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId])

  async function saveProposal(data: ProposalFormData) {
    setSaveStatus('saving')
    const res = await fetch(`/api/admin/journeys/${journeyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalContent: data }),
    })
    setSaveStatus(res.ok ? 'saved' : 'error')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  async function saveDestination(data: FinalDestFormData) {
    setSaveStatus('saving')
    const res = await fetch(`/api/admin/journeys/${journeyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalDestination: data }),
    })
    setSaveStatus(res.ok ? 'saved' : 'error')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const field = 'flex flex-col gap-1.5'
  const grid2 = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3'
  const hint = 'text-charcoal/45 text-xs font-normal'
  const saveBtn = cn(adminBtnPrimary, 'self-start h-[38px] px-4 rounded-[10px] text-[13px] gap-1.5')

  if (loading) return <div className="h-64 max-w-[760px] mx-auto bg-blush-100 animate-pulse rounded-[18px]" />

  return (
    <div className="flex flex-col gap-6 max-w-[760px] mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div>
          <h1 className={adminPageTitle}>Proposal Customization</h1>
          <p className={adminPageSubtitle}>Design the moment she reaches the final destination.</p>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">Saved successfully.</div>
      )}
      {saveStatus === 'error' && (
        <div className={adminAlertError}>Failed to save. Please try again.</div>
      )}

      {/* Final Destination (route journeys only; question journeys have no location) */}
      {!isQuestionsMode && (
      <Card className={adminCard}>
        <CardHeader className={adminCardHeader}>
          <CardTitle className={cn(adminCardTitle, 'flex items-center gap-2')}>
            <MapPin className="h-[18px] w-[18px] text-gold-500" />
            Final Destination
          </CardTitle>
        </CardHeader>
        <CardContent className={adminCardBody}>
          <form onSubmit={destForm.handleSubmit(saveDestination)} className="flex flex-col gap-4">
            <div className={field}>
              <Label htmlFor="dest-name" className={adminLabel}>Location name <span className={hint}>(shown only after reveal)</span></Label>
              <Input id="dest-name" className={adminInput} {...destForm.register('name')} placeholder="The Rooftop Garden" />
            </div>
            <GoogleMapsPasteInput
              onCoordinates={(lat, lng) => {
                destForm.setValue('latitude', Number(lat.toFixed(7)), { shouldDirty: true, shouldValidate: true })
                destForm.setValue('longitude', Number(lng.toFixed(7)), { shouldDirty: true, shouldValidate: true })
              }}
            />
            <div className={grid2}>
              <div className={field}>
                <Label htmlFor="dest-lat" className={adminLabel}>Latitude *</Label>
                <Input id="dest-lat" className={adminInput} {...destForm.register('latitude', { valueAsNumber: true })} type="number" step="any" placeholder="40.712776" />
              </div>
              <div className={field}>
                <Label htmlFor="dest-lng" className={adminLabel}>Longitude *</Label>
                <Input id="dest-lng" className={adminInput} {...destForm.register('longitude', { valueAsNumber: true })} type="number" step="any" placeholder="-74.005974" />
              </div>
            </div>
            <div className={grid2}>
              <div className={field}>
                <Label htmlFor="dest-radius" className={adminLabel}>Arrival radius (m)</Label>
                <Input id="dest-radius" className={adminInput} {...destForm.register('geofenceRadius', { valueAsNumber: true })} type="number" min={10} max={500} />
              </div>
              <div className={field}>
                <Label htmlFor="dest-approach-radius" className={adminLabel}>Suspense radius (m)</Label>
                <Input id="dest-approach-radius" className={adminInput} {...destForm.register('approachingRadius', { valueAsNumber: true })} type="number" min={50} max={2000} />
              </div>
            </div>
            <div className={field}>
              <Label htmlFor="dest-approach-msg" className={adminLabel}>Approaching message</Label>
              <Textarea id="dest-approach-msg" className={adminTextarea} rows={2} {...destForm.register('approachingMessage')} placeholder="You're almost there…" />
            </div>
            <Button type="submit" loading={saveStatus === 'saving'} size="sm" className={saveBtn}>
              <Save className="h-3.5 w-3.5" /> Save Destination
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Proposal Screen */}
      <Card className={adminCard}>
        <CardHeader className={adminCardHeader}>
          <CardTitle className={cn(adminCardTitle, 'flex items-center gap-2')}>
            <Heart className="h-[18px] w-[18px] text-burgundy fill-burgundy/30" />
            Proposal Screen
          </CardTitle>
        </CardHeader>
        <CardContent className={adminCardBody}>
          <form onSubmit={proposalForm.handleSubmit(saveProposal)} className="flex flex-col gap-4">
            <div className={field}>
              <Label htmlFor="prop-title" className={adminLabel}>Screen title</Label>
              <Input id="prop-title" className={adminInput} {...proposalForm.register('title')} placeholder="You made it, my love." />
            </div>
            <div className={field}>
              <Label htmlFor="prop-message" className={adminLabel}>Main romantic message</Label>
              <Textarea id="prop-message" className={adminTextarea} rows={4} {...proposalForm.register('mainMessage')} placeholder="You are the person I want to spend every adventure with…" />
            </div>
            <div className={field}>
              <Label htmlFor="prop-question" className={adminLabel}>The question</Label>
              <Input id="prop-question" className={cn(adminInput, 'font-serif text-[17px]')} {...proposalForm.register('finalQuestion')} placeholder="Will you marry me?" />
            </div>
            <div className={grid2}>
              <div className={field}>
                <Label htmlFor="prop-yes-label" className={adminLabel}>YES button label</Label>
                <Input id="prop-yes-label" className={adminInput} {...proposalForm.register('yesLabel')} placeholder="YES! ❤️" />
              </div>
              <div className={field}>
                <Label htmlFor="prop-no-label" className={adminLabel}>NO button label</Label>
                <Input id="prop-no-label" className={adminInput} {...proposalForm.register('noLabel')} placeholder="No" />
              </div>
            </div>
            <div className={grid2}>
              <div className={field}>
                <Label htmlFor="prop-yes-msg" className={adminLabel}>YES confirmation message</Label>
                <Textarea id="prop-yes-msg" className={adminTextarea} rows={3} {...proposalForm.register('yesMessage')} placeholder="Today, our next adventure begins…" />
              </div>
              <div className={field}>
                <Label htmlFor="prop-no-msg" className={adminLabel}>NO confirmation message</Label>
                <Textarea id="prop-no-msg" className={adminTextarea} rows={3} {...proposalForm.register('noMessage')} placeholder="Thank you for being honest with me…" />
              </div>
            </div>
            <Button type="submit" loading={saveStatus === 'saving'} size="sm" className={saveBtn}>
              <Save className="h-3.5 w-3.5" /> Save Proposal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
