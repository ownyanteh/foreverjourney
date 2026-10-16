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

type FormData = z.infer<typeof createJourneySchema>

export default function NewJourneyPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(createJourneySchema),
    defaultValues: {
      title: '',
      welcomeContent: {
        greeting: 'Hey, my love.',
        introduction: "I've planned a little adventure for you. Follow the clues, enjoy the journey, and trust that every step has a reason. Are you ready?",
      },
    },
  })

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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/admin/journeys"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">New Journey</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">Set up the basics to get started.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">{error}</div>}

        <Card>
          <CardHeader><CardTitle>Journey Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Journey title *</Label>
              <Input id="title" placeholder="Our Forever Journey" error={errors.title?.message} {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Welcome Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="greeting">Greeting</Label>
              <Input id="greeting" placeholder="Hey, my love." {...register('welcomeContent.greeting')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="introduction">Introduction</Label>
              <Textarea
                id="introduction"
                rows={4}
                placeholder="I've planned a little adventure for you…"
                {...register('welcomeContent.introduction')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline"><Link href="/admin/journeys">Cancel</Link></Button>
          <Button type="submit" loading={isSubmitting}>Create Journey</Button>
        </div>
      </form>
    </div>
  )
}
