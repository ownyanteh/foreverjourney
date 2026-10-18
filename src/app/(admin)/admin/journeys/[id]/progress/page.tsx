
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { Memory } from '@/lib/db/models/Memory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Heart, CheckCircle2, Clock, MessageCircleHeart } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { feelingDisplay } from '@/lib/feelings'
import { cn } from '@/lib/utils'
import MemoriesGallery from '@/components/admin/MemoriesGallery'
import { isPhotoExpired, photoExpiryOf } from '@/lib/memories'
import { env } from '@/lib/env'
import {
  adminCard,
  adminCardHeader,
  adminCardTitle,
  adminBadge,
  adminBackBtn,
  adminPageTitle,
  adminPageSubtitle,
} from '@/components/admin/adminStyles'

export const metadata: Metadata = { title: 'Journey Progress' }

type Props = { params: Promise<{ id: string }> }

export default async function JourneyProgressPage({ params }: Props) {
  const session = await getAdminSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  const { id } = await params
  await connectDB()

  const journey = (await Journey.findOne({ _id: id, adminId: session.adminId }).lean()) as any
  if (!journey) notFound()

  const events = (await JourneyEvent.find({ journeyId: id }).sort({ timestamp: -1 }).limit(50).lean()) as any[]
  const sessions = (await JourneySession.find({ journeyId: id }).sort({ startedAt: -1 }).lean()) as any[]
  const response = (await ProposalResponse.findOne({ journeyId: id }).lean()) as any
  const checkpoints = (await Checkpoint.find({ journeyId: id, isActive: true }).sort({ sequence: 1 }).lean()) as any[]
  const memories = (await Memory.find({ journeyId: id }).sort({ createdAt: -1 }).lean()) as any[]

  // Most recent session in which she answered memory questions
  const answeredSession = sessions.find((s) => (s.questionAnswers ?? []).length > 0)
  const answers = (answeredSession?.questionAnswers ?? []) as {
    questionIndex: number
    prompt: string
    feeling: string | null
    answer: string
    answeredAt: Date
  }[]

  // Map checkpoint IDs to names for display
  const checkpointMap = Object.fromEntries(checkpoints.map((c) => [c._id.toString(), c.title]))

  const eventLabels: Record<string, string> = {
    journey_started: '🚀 Journey started',
    checkpoint_unlocked: '📍 Checkpoint unlocked',
    checkpoint_skipped: '⏭️ Checkpoint skipped',
    final_destination_unlocked: '✨ Final destination reached',
    questions_completed: '💬 Memory questions answered',
    proposal_response_submitted: '💍 Response submitted',
    journey_completed: '🎉 Journey completed',
    memory_shared: '📸 Memory shared',
    journey_reset: '🔄 Journey reset',
  }

  const journeyId = journey._id.toString()

  const rowTime = 'text-xs text-charcoal/45 flex-shrink-0'
  const quote = 'font-serif italic text-charcoal/80 leading-[1.55] whitespace-pre-wrap'

  return (
    <div className="flex flex-col gap-6 max-w-[900px] mx-auto">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
          <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className={adminPageTitle}>Progress & Response</h1>
          <p className={adminPageSubtitle}>{journey.title}</p>
        </div>
      </div>

      {/* Response card */}
      {response ? (
        <Card
          className={cn(
            adminCard,
            'rounded-[20px]',
            response.response === 'yes' &&
              'border-gold/55 bg-transparent bg-[linear-gradient(135deg,rgba(216,180,106,0.12)_0%,rgba(255,255,255,0.9)_70%)]'
          )}
        >
          <CardContent className="p-6 flex items-center gap-[18px]">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${response.response === 'yes' ? 'bg-gold/25' : 'bg-blush-100'}`}>
              <Heart
                className={`h-7 w-7 ${response.response === 'yes' ? 'text-gold-500 fill-gold-500' : 'text-charcoal/40'}`}
                strokeWidth={1.5}
              />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[22px] sm:text-2xl font-semibold text-charcoal leading-tight">
                {response.response === 'yes' ? '💍 She said YES!' : 'Response recorded: No'}
              </p>
              <p className="text-sm text-charcoal/55 mt-0.5">
                Submitted {format(new Date(response.submittedAt), 'PPP p')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={adminCard}>
          <CardContent className="p-5 flex items-center gap-3 text-charcoal/50">
            <Clock className="h-5 w-5" />
            <p className="text-sm">Waiting for the proposal response…</p>
          </CardContent>
        </Card>
      )}

      {/* Her answers to the memory questions */}
      {answers.length > 0 && (
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}>
            <CardTitle className={cn(adminCardTitle, 'flex items-center gap-2')}>
              <MessageCircleHeart className="h-[18px] w-[18px] text-burgundy" />
              Her answers ({answers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ol className="divide-y divide-blush-100">
              {answers.map((a) => (
                <li key={a.questionIndex} className="px-6 py-4 flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-charcoal/50">Moment {a.questionIndex + 1}</p>
                  <p className="font-serif text-[17px] font-semibold text-charcoal">{a.prompt}</p>
                  {feelingDisplay(a.feeling) && (
                    <span className="self-start text-[13px] bg-blush-100 text-charcoal rounded-full px-3 py-[3px]">
                      {feelingDisplay(a.feeling)}
                    </span>
                  )}
                  {a.answer && (
                    <p className={cn(quote, 'text-[15px]')}>&ldquo;{a.answer}&rdquo;</p>
                  )}
                  <p className={rowTime}>{format(new Date(a.answeredAt), 'PPP p')}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Memories shared at the final destination */}
      <MemoriesGallery
        journeyId={journeyId}
        retentionDays={env.MEMORY_RETENTION_DAYS}
        memories={memories
          .map((m) => {
            // Photos past expiry are hidden even before the daily cleanup removes them
            const showPhoto = Boolean(m.imageUrl) && !isPhotoExpired(m)
            return {
              _id: m._id.toString(),
              imageUrl: showPhoto ? m.imageUrl : null,
              imageExpiresAt: showPhoto ? photoExpiryOf(m).toISOString() : null,
              message: m.message ?? '',
              createdAt: new Date(m.createdAt).toISOString(),
            }
          })
          .filter((m) => m.imageUrl || m.message)}
      />

      {/* Sessions overview */}
      {sessions.length > 0 && (
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Sessions ({sessions.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {sessions.map((s) => (
                <li key={s._id.toString()} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={s.status === 'completed' ? 'success' : s.status === 'active' ? 'active' : 'secondary'}
                      className={cn(
                        adminBadge,
                        s.status === 'completed' || s.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#EEECEF] text-charcoal/70'
                      )}
                    >
                      {s.status}
                    </Badge>
                    <span className="text-sm text-charcoal/60">
                      {journey.mode === 'questions'
                        ? `${(s.questionAnswers ?? []).length}/${(journey.memoryQuestions ?? []).length} questions answered`
                        : `${s.completedCheckpointIds.length}/${checkpoints.length} checkpoints`}
                    </span>
                  </div>
                  <span className={rowTime}>
                    Started {formatDistanceToNow(new Date(s.startedAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Checkpoint status */}
      {checkpoints.length > 0 && (
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Checkpoints</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {checkpoints.map((cp, i) => {
                const unlocked = events.some(
                  (e) => e.eventType === 'checkpoint_unlocked' && e.checkpointId?.toString() === cp._id.toString()
                )
                return (
                  <li key={cp._id.toString()} className="flex items-center gap-3 px-6 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-blush-100 text-burgundy'}`}>
                      {unlocked ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="text-sm text-charcoal min-w-0">{cp.title}</span>
                    {unlocked && <span className="ml-auto text-xs text-emerald-700 font-medium flex-shrink-0">Unlocked</span>}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Event timeline */}
      {events.length > 0 && (
        <Card className={adminCard}>
          <CardHeader className={adminCardHeader}><CardTitle className={adminCardTitle}>Event Timeline</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {events.map((event) => (
                <li key={event._id.toString()} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-charcoal">
                      {eventLabels[event.eventType] ?? event.eventType}
                    </p>
                    {event.checkpointId && checkpointMap[event.checkpointId.toString()] && (
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        {checkpointMap[event.checkpointId.toString()]}
                      </p>
                    )}
                  </div>
                  <span className={rowTime}>
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
