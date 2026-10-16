'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateJourneySchema } from '@/lib/validation/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

type FormData = z.infer<typeof updateJourneySchema>

export default function EditJourneyPage() {
  const params = useParams()
  const journeyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(updateJourneySchema),
  })

  useEffect(() => {
    fetch(`/api/admin/journeys/${journeyId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.journey) {
          reset({
            title: json.journey.title,
            welcomeContent: json.journey.welcomeContent,
            theme: json.journey.theme,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [journeyId, reset])

  async function onSubmit(data: FormData) {
    setSaveStatus('saving')
    const res = await fetch(`/api/admin/journeys/${journeyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Edit Journey</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Update the title and welcome message.</p>
        </div>
      </div>

      {saveStatus === 'saved' && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">Saved successfully.</div>}
      {saveStatus === 'error' && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">Failed to save.</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Journey Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Journey title *</Label>
              <Input id="title" error={errors.title?.message} {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Welcome Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Greeting</Label>
              <Input {...register('welcomeContent.greeting')} placeholder="Hey, my love." />
            </div>
            <div className="space-y-1.5">
              <Label>Introduction</Label>
              <Textarea rows={4} {...register('welcomeContent.introduction')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Theme Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Primary</Label>
                <Input {...register('theme.primaryColor')} placeholder="#7A2038" />
              </div>
              <div className="space-y-1.5">
                <Label>Accent</Label>
                <Input {...register('theme.accentColor')} placeholder="#D8B46A" />
              </div>
              <div className="space-y-1.5">
                <Label>Background</Label>
                <Input {...register('theme.backgroundColor')} placeholder="#FFF8F0" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saveStatus === 'saving'}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
