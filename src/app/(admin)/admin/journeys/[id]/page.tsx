
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft, Map, Heart, Link as LinkIcon,
  Activity, CheckCircle2, Pencil
} from 'lucide-react'
import JourneyStatusControls from '@/components/admin/JourneyStatusControls'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = { title: 'Journey Overview' }

type Params = { params: Promise<{ id: string }> }

export default async function JourneyOverviewPage({ params }: Params) {
  const session = await getAdminSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const { id } = await params
  await connectDB()

  const journey = (await Journey.findOne({ _id: id, adminId: session.adminId }).lean()) as any
  if (!journey) notFound()

  const checkpoints = (await Checkpoint.find({ journeyId: id, isActive: true }).sort({ sequence: 1 }).lean()) as any[]
  const response = (await ProposalResponse.findOne({ journeyId: id }).lean()) as any
  const events = (await JourneyEvent.find({ journeyId: id }).sort({ timestamp: -1 }).limit(10).lean()) as any[]

  const journeyId = journey._id.toString()
  const statusVariant = journey.status as 'draft' | 'active' | 'completed' | 'deactivated'

  const navItems = [
    { href: `/admin/journeys/${journeyId}/edit`, icon: <Pencil className="h-4 w-4" />, label: 'Edit Welcome' },
    { href: `/admin/journeys/${journeyId}/checkpoints`, icon: <Map className="h-4 w-4" />, label: 'Checkpoints' },
    { href: `/admin/journeys/${journeyId}/proposal`, icon: <Heart className="h-4 w-4" />, label: 'Proposal' },
    { href: `/admin/journeys/${journeyId}/invitation`, icon: <LinkIcon className="h-4 w-4" />, label: 'Invitation' },
    { href: `/admin/journeys/${journeyId}/progress`, icon: <Activity className="h-4 w-4" />, label: 'Progress' },
  ]

  const eventLabels: Record<string, string> = {
    journey_started: '🚀 Journey started',
    checkpoint_unlocked: '📍 Checkpoint unlocked',
    checkpoint_skipped: '⏭️ Checkpoint skipped',
    final_destination_unlocked: '✨ Final destination reached',
    proposal_response_submitted: '💍 Response submitted',
    journey_completed: '🎉 Journey completed',
    journey_reset: '🔄 Journey reset',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/admin/journeys"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-serif text-2xl font-semibold text-charcoal">{journey.title}</h1>
            <Badge variant={statusVariant}>{journey.status}</Badge>
            {response && (
              <Badge variant={response.response === 'yes' ? 'success' : 'secondary'}>
                {response.response === 'yes' ? '💍 She said YES!' : 'Response: No'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-charcoal/50">
            Created {formatDistanceToNow(new Date(journey.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <JourneyStatusControls
        journeyId={journeyId}
        status={journey.status}
        hasInvitation={!!journey.invitationTokenHash}
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {navItems.map((item) => (
          <Button key={item.href} asChild variant="secondary" className="h-auto flex-col gap-2 py-4">
            <Link href={item.href}>
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-burgundy" />
              <div>
                <p className="text-xl font-semibold text-charcoal">{checkpoints.length}</p>
                <p className="text-xs text-charcoal/60">Active checkpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-burgundy" />
              <div>
                <p className="text-xl font-semibold text-charcoal">{events.length}</p>
                <p className="text-xs text-charcoal/60">Journey events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {events.map((event: any) => (
                <li key={event._id.toString()} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-charcoal">
                    {eventLabels[event.eventType] ?? event.eventType}
                  </span>
                  <span className="text-xs text-charcoal/40">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
