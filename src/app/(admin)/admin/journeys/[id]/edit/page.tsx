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

type FormData = z.infer<typeof updateJourneySchema>

export default function EditJourneyPage() {
  const params = useParams()
  const journeyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
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

  const themeFields = [
    { name: 'theme.primaryColor' as const, id: 'theme-primary', label: 'Primary', placeholder: '#7A2038' },
    { name: 'theme.accentColor' as const, id: 'theme-accent', label: 'Accent', placeholder: '#D8B46A' },
    { name: 'theme.backgroundColor' as const, id: 'theme-background', label: 'Background', placeholder: '#FFF8F0' },
  ]

  if (loading) return <div className="h-64 max-w-[680px] mx-auto bg-blush-100 animate-pulse rounded-[18px]" />

  return (
    <div className="flex flex-col gap-6 max-w-[680px] mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div>
          <h1 className={adminPageTitle}>Edit Journey</h1>
          <p className={adminPageSubtitle}>Update the title and welcome message.</p>
        </div>
      </div>

      {saveStatus === 'saved' && <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">Saved successfully.</div>}
      {saveStatus === 'error' && <div className={adminAlertError}>Failed to save.</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Journey Details</CardTitle></CardHeader>
          <CardContent className={adminCardBody}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className={adminLabel}>Journey title *</Label>
              <Input id="title" className={adminInput} error={errors.title?.message} {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Welcome Message</CardTitle></CardHeader>
          <CardContent className={`${adminCardBody} flex flex-col gap-4`}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="greeting" className={adminLabel}>Greeting</Label>
              <Input id="greeting" className={adminInput} {...register('welcomeContent.greeting')} placeholder="Hey, my love." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="introduction" className={adminLabel}>Introduction</Label>
              <Textarea id="introduction" rows={4} className={adminTextarea} {...register('welcomeContent.introduction')} />
            </div>
          </CardContent>
        </Card>

        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Theme Colors</CardTitle></CardHeader>
          <CardContent className={adminCardBody}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
              {themeFields.map((f) => {
                const value = (watch(f.name) as string | undefined) || f.placeholder
                return (
                  <div key={f.name} className="flex flex-col gap-1.5">
                    <Label htmlFor={f.id} className={adminLabel}>{f.label}</Label>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-[22px] w-[22px] rounded-[7px] border border-black/[0.08] pointer-events-none"
                        style={{ background: value }}
                      />
                      <Input id={f.id} className={`${adminInput} pl-[42px]`} {...register(f.name)} placeholder={f.placeholder} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex">
          <Button type="submit" loading={saveStatus === 'saving'} className={adminBtnPrimary}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
