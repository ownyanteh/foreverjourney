
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
import { ArrowLeft, Heart, CheckCircle2, Clock, Camera, Download } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

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

  // Map checkpoint IDs to names for display
  const checkpointMap = Object.fromEntries(checkpoints.map((c) => [c._id.toString(), c.title]))

  const eventLabels: Record<string, string> = {
    journey_started: '🚀 Journey started',
    checkpoint_unlocked: '📍 Checkpoint unlocked',
    checkpoint_skipped: '⏭️ Checkpoint skipped',
    final_destination_unlocked: '✨ Final destination reached',
    proposal_response_submitted: '💍 Response submitted',
    journey_completed: '🎉 Journey completed',
    memory_shared: '📸 Memory shared',
    journey_reset: '🔄 Journey reset',
  }

  const journeyId = journey._id.toString()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/admin/journeys/${journeyId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Progress & Response</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">{journey.title}</p>
        </div>
      </div>

      {/* Response card */}
      {response ? (
        <Card className={response.response === 'yes' ? 'border-gold/50 bg-gold/5' : ''}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${response.response === 'yes' ? 'bg-gold/20' : 'bg-blush-200'}`}>
              <Heart className={`h-6 w-6 ${response.response === 'yes' ? 'text-gold-500 fill-gold-500' : 'text-charcoal/40'}`} />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-charcoal">
                {response.response === 'yes' ? '💍 She said YES!' : 'Response recorded: No'}
              </p>
              <p className="text-sm text-charcoal/50">
                Submitted {format(new Date(response.submittedAt), 'PPP p')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 flex items-center gap-3 text-charcoal/50">
            <Clock className="h-5 w-5" />
            <p className="text-sm">Waiting for the proposal response…</p>
          </CardContent>
        </Card>
      )}

      {/* Memories shared at the final destination */}
      {memories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-burgundy" />
              Memories ({memories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {memories.map((m) => (
                <figure key={m._id.toString()} className="rounded-xl overflow-hidden border border-blush-200 bg-cream">
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.imageUrl.replace('/upload/', '/upload/c_fill,w_500,h_500,q_auto,f_auto/')}
                        alt={m.message || 'Shared memory'}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Open full size</span>
                      </span>
                    </a>
                  )}
                  <figcaption className="px-3 py-2 space-y-1">
                    {m.message && <p className="text-sm text-charcoal font-serif italic whitespace-pre-wrap">{m.message}</p>}
                    <p className="text-xs text-charcoal/40">{format(new Date(m.createdAt), 'PPP p')}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions overview */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sessions ({sessions.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {sessions.map((s) => (
                <li key={s._id.toString()} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <Badge variant={s.status === 'completed' ? 'success' : s.status === 'active' ? 'active' : 'secondary'}>
                      {s.status}
                    </Badge>
                    <span className="ml-3 text-sm text-charcoal/60">
                      {s.completedCheckpointIds.length}/{checkpoints.length} checkpoints
                    </span>
                  </div>
                  <span className="text-xs text-charcoal/40">
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
        <Card>
          <CardHeader><CardTitle>Checkpoints</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {checkpoints.map((cp, i) => {
                const unlocked = events.some(
                  (e) => e.eventType === 'checkpoint_unlocked' && e.checkpointId?.toString() === cp._id.toString()
                )
                return (
                  <li key={cp._id.toString()} className="flex items-center gap-3 px-6 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${unlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-blush-200 text-charcoal/40'}`}>
                      {unlocked ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="text-sm text-charcoal">{cp.title}</span>
                    {unlocked && <span className="ml-auto text-xs text-emerald-600 font-medium">Unlocked</span>}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Event timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Event Timeline</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-blush-100">
              {events.map((event) => (
                <li key={event._id.toString()} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm text-charcoal">
                      {eventLabels[event.eventType] ?? event.eventType}
                    </p>
                    {event.checkpointId && checkpointMap[event.checkpointId.toString()] && (
                      <p className="text-xs text-charcoal/50 mt-0.5">
                        {checkpointMap[event.checkpointId.toString()]}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-charcoal/40 flex-shrink-0">
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
