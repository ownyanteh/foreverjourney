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

  if (loading) return <div className="h-64 bg-blush-100 animate-pulse rounded-2xl" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/admin/journeys/${journeyId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Proposal Customization</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Design the moment she reaches the final destination.</p>
        </div>
      </div>

      {saveStatus === 'saved' && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">Saved successfully.</div>
      )}
      {saveStatus === 'error' && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">Failed to save. Please try again.</div>
      )}

      {/* Final Destination (route journeys only; question journeys have no location) */}
      {!isQuestionsMode && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gold-400" />
            Final Destination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={destForm.handleSubmit(saveDestination)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Location name <span className="text-charcoal/40 text-xs">(shown only after reveal)</span></Label>
              <Input {...destForm.register('name')} placeholder="The Rooftop Garden" />
            </div>
            <GoogleMapsPasteInput
              onCoordinates={(lat, lng) => {
                destForm.setValue('latitude', Number(lat.toFixed(7)), { shouldDirty: true, shouldValidate: true })
                destForm.setValue('longitude', Number(lng.toFixed(7)), { shouldDirty: true, shouldValidate: true })
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Latitude *</Label>
                <Input {...destForm.register('latitude', { valueAsNumber: true })} type="number" step="any" placeholder="40.712776" />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude *</Label>
                <Input {...destForm.register('longitude', { valueAsNumber: true })} type="number" step="any" placeholder="-74.005974" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Arrival radius (m)</Label>
                <Input {...destForm.register('geofenceRadius', { valueAsNumber: true })} type="number" min={10} max={500} />
              </div>
              <div className="space-y-1.5">
                <Label>Suspense radius (m)</Label>
                <Input {...destForm.register('approachingRadius', { valueAsNumber: true })} type="number" min={50} max={2000} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Approaching message</Label>
              <Textarea rows={2} {...destForm.register('approachingMessage')} placeholder="You're almost there…" />
            </div>
            <Button type="submit" loading={saveStatus === 'saving'} size="sm">
              <Save className="h-3.5 w-3.5" /> Save Destination
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Proposal Screen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-burgundy fill-burgundy/30" />
            Proposal Screen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={proposalForm.handleSubmit(saveProposal)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Screen title</Label>
              <Input {...proposalForm.register('title')} placeholder="You made it, my love." />
            </div>
            <div className="space-y-1.5">
              <Label>Main romantic message</Label>
              <Textarea rows={4} {...proposalForm.register('mainMessage')} placeholder="You are the person I want to spend every adventure with…" />
            </div>
            <div className="space-y-1.5">
              <Label>The question</Label>
              <Input {...proposalForm.register('finalQuestion')} placeholder="Will you marry me?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>YES button label</Label>
                <Input {...proposalForm.register('yesLabel')} placeholder="YES! ❤️" />
              </div>
              <div className="space-y-1.5">
                <Label>NO button label</Label>
                <Input {...proposalForm.register('noLabel')} placeholder="No" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>YES confirmation message</Label>
              <Textarea rows={3} {...proposalForm.register('yesMessage')} placeholder="Today, our next adventure begins…" />
            </div>
            <div className="space-y-1.5">
              <Label>NO confirmation message</Label>
              <Textarea rows={3} {...proposalForm.register('noMessage')} placeholder="Thank you for being honest with me…" />
            </div>
            <Button type="submit" loading={saveStatus === 'saving'} size="sm">
              <Save className="h-3.5 w-3.5" /> Save Proposal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
