
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
  Activity, CheckCircle2, Pencil, MessageCircleHeart
} from 'lucide-react'
import JourneyStatusControls from '@/components/admin/JourneyStatusControls'
import JourneyModeSelector from '@/components/admin/JourneyModeSelector'
import SetupChecklist from '@/components/admin/SetupChecklist'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  adminCard,
  adminCardHeader,
  adminCardTitle,
  adminBadge,
  adminBackBtn,
  adminPageTitle,
  statusBadgeClass,
  yesBadgeClass,
  noBadgeClass,
} from '@/components/admin/adminStyles'

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

  const isQuestions = journey.mode === 'questions'
  const questionCount = (journey.memoryQuestions ?? []).length

  const navItems = [
    { href: `/admin/journeys/${journeyId}/edit`, icon: <Pencil className="h-[18px] w-[18px]" />, label: 'Edit Welcome' },
    isQuestions
      ? { href: `/admin/journeys/${journeyId}/questions`, icon: <MessageCircleHeart className="h-[18px] w-[18px]" />, label: 'Questions' }
      : { href: `/admin/journeys/${journeyId}/checkpoints`, icon: <Map className="h-[18px] w-[18px]" />, label: 'Checkpoints' },
    { href: `/admin/journeys/${journeyId}/proposal`, icon: <Heart className="h-[18px] w-[18px]" />, label: 'Proposal' },
    { href: `/admin/journeys/${journeyId}/invitation`, icon: <LinkIcon className="h-[18px] w-[18px]" />, label: 'Invitation' },
    { href: `/admin/journeys/${journeyId}/progress`, icon: <Activity className="h-[18px] w-[18px]" />, label: 'Progress' },
  ]

  const eventLabels: Record<string, string> = {
    journey_started: '🚀 Journey started',
    checkpoint_unlocked: '📍 Checkpoint unlocked',
    checkpoint_skipped: '⏭️ Checkpoint skipped',
    final_destination_unlocked: '✨ Final destination reached',
    questions_completed: '💬 Memory questions answered',
    memory_shared: '📸 Memory shared',
    proposal_response_submitted: '💍 Response submitted',
    journey_completed: '🎉 Journey completed',
    journey_reset: '🔄 Journey reset',
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href="/admin/journeys" aria-label="Back to journeys"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className={adminPageTitle}>{journey.title}</h1>
            <Badge variant={statusVariant} className={cn(adminBadge, 'h-6', statusBadgeClass[statusVariant])}>{journey.status}</Badge>
            {response && (
              <Badge
                variant={response.response === 'yes' ? 'success' : 'secondary'}
                className={cn(adminBadge, 'h-6', response.response === 'yes' ? yesBadgeClass : noBadgeClass)}
              >
                {response.response === 'yes' ? '💍 She said YES!' : 'Response: No'}
              </Badge>
            )}
          </div>
          <p className="text-[13px] text-charcoal/50">
            Created {formatDistanceToNow(new Date(journey.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <JourneyStatusControls
        journeyId={journeyId}
        status={journey.status}
        hasInvitation={!!journey.invitationTokenHash}
      />

      <JourneyModeSelector
        journeyId={journeyId}
        mode={isQuestions ? 'questions' : 'route'}
        locked={journey.status === 'active'}
      />

      <SetupChecklist
        journey={{
          _id: journeyId,
          mode: isQuestions ? 'questions' : 'route',
          status: journey.status,
          welcomeIntroduction: journey.welcomeContent?.introduction ?? '',
          questionCount: questionCount,
          hasFinalDestination: Boolean(journey.finalDestination?.latitude),
          checkpointCount: checkpoints.length,
          proposalMessage: journey.proposalContent?.mainMessage ?? '',
          hasInvitation: Boolean(journey.invitationTokenHash),
        }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-2 px-2 py-[18px] rounded-2xl bg-white border border-blush-200 text-burgundy text-[13px] font-medium transition-colors hover:bg-blush-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
          >
            {item.icon}
            <span className="text-charcoal">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className={adminCard}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3.5">
              <CheckCircle2 className="h-6 w-6 text-burgundy flex-shrink-0" />
              <div>
                <p className="text-[22px] leading-tight font-semibold text-charcoal">{isQuestions ? questionCount : checkpoints.length}</p>
                <p className="text-xs text-charcoal/60">{isQuestions ? 'Memory questions' : 'Active checkpoints'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={adminCard}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3.5">
              <Activity className="h-6 w-6 text-burgundy flex-shrink-0" />
              <div>
                <p className="text-[22px] leading-tight font-semibold text-charcoal">{events.length}</p>
                <p className="text-xs text-charcoal/60">Journey events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Recent Events</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {events.map((event: any) => (
                <li key={event._id.toString()} className="flex items-center justify-between gap-3 px-6 py-3">
                  <span className="text-sm text-charcoal">
                    {eventLabels[event.eventType] ?? event.eventType}
                  </span>
                  <span className="text-xs text-charcoal/45 flex-shrink-0">
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
