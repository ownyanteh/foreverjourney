'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createJourneySchema } from '@/lib/validation/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DEFAULT_ROUTE_INTRO, DEFAULT_QUESTIONS_INTRO } from '@/lib/journey-defaults'
import { JourneyTypeCards, type JourneyMode } from '@/components/admin/JourneyModeSelector'
import {
  adminCard,
  adminCardHeader,
  adminCardTitle,
  adminCardBody,
  adminInput,
  adminTextarea,
  adminLabel,
  adminBtnPrimary,
  adminBtnOutline,
  adminBackBtn,
  adminPageTitle,
  adminPageSubtitle,
  adminAlertError,
} from '@/components/admin/adminStyles'

type FormData = z.infer<typeof createJourneySchema>

const ROUTE_INTRO = DEFAULT_ROUTE_INTRO
const QUESTIONS_INTRO = DEFAULT_QUESTIONS_INTRO

export default function NewJourneyPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, getValues, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createJourneySchema),
    defaultValues: {
      title: '',
      mode: 'route',
      welcomeContent: {
        greeting: 'Hey, my love.',
        introduction: ROUTE_INTRO,
      },
    },
  })

  const mode = (watch('mode') ?? 'route') as JourneyMode

  function chooseMode(next: JourneyMode) {
    setValue('mode', next)
    // Swap the default introduction to match the type, but never overwrite custom text
    const intro = getValues('welcomeContent.introduction')
    if (intro === ROUTE_INTRO || intro === QUESTIONS_INTRO) {
      setValue('welcomeContent.introduction', next === 'questions' ? QUESTIONS_INTRO : ROUTE_INTRO)
    }
  }

  async function onSubmit(data: FormData) {
    setError('')
    const res = await fetch('/api/admin/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Failed to create journey.'); return }
    router.push(`/admin/journeys/${json.journey._id}`)
  }

  return (
    <div className="flex flex-col gap-6 max-w-[680px] mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href="/admin/journeys" aria-label="Back to journeys"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div>
          <h1 className={adminPageTitle}>New Journey</h1>
          <p className={adminPageSubtitle}>Set up the basics to get started.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {error && <div className={adminAlertError} role="alert">{error}</div>}

        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Journey Details</CardTitle></CardHeader>
          <CardContent className={adminCardBody}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className={adminLabel}>Journey title *</Label>
              <Input id="title" placeholder="Our Forever Journey" className={adminInput} error={errors.title?.message} {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Journey type</CardTitle></CardHeader>
          <CardContent className={adminCardBody}>
            <JourneyTypeCards value={mode} onChange={chooseMode} />
          </CardContent>
        </Card>

        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Welcome Message</CardTitle></CardHeader>
          <CardContent className={`${adminCardBody} flex flex-col gap-4`}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="greeting" className={adminLabel}>Greeting</Label>
              <Input id="greeting" placeholder="Hey, my love." className={adminInput} {...register('welcomeContent.greeting')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="introduction" className={adminLabel}>Introduction</Label>
              <Textarea
                id="introduction"
                rows={4}
                placeholder="I've planned a little adventure for you…"
                className={adminTextarea}
                {...register('welcomeContent.introduction')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild variant="outline" className={adminBtnOutline}><Link href="/admin/journeys">Cancel</Link></Button>
          <Button type="submit" loading={isSubmitting} className={adminBtnPrimary}>Create Journey</Button>
        </div>
      </form>
    </div>
  )
}
