
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Heart, CheckCircle2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DeleteJourneyButton from '@/components/admin/DeleteJourneyButton'

export const metadata: Metadata = { title: 'Journeys' }

export default async function JourneysPage() {
  const session = await getAdminSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  await connectDB()
  const journeys = (await Journey.find({ adminId: session.adminId }).sort({ updatedAt: -1 }).lean()) as any[]

  const journeysWithStats = await Promise.all(
    journeys.map(async (j) => {
      const checkpointCount = await Checkpoint.countDocuments({ journeyId: j._id, isActive: true })
      const response = (await ProposalResponse.findOne({ journeyId: j._id }).lean()) as { response?: string } | null
      return {
        _id: j._id.toString(),
        title: j.title,
        status: j.status,
        hasInvitation: !!j.invitationTokenHash,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        checkpointCount,
        response: response?.response ?? null,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">Journeys</h1>
          <p className="text-charcoal/60 mt-1">{journeys.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/journeys/new">
            <Plus className="h-4 w-4" /> New Journey
          </Link>
        </Button>
      </div>

      {journeysWithStats.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="h-12 w-12 text-blush-300 mx-auto mb-4" />
            <p className="font-serif text-lg text-charcoal/60 mb-6">No journeys yet. Create your first one.</p>
            <Button asChild>
              <Link href="/admin/journeys/new"><Plus className="h-4 w-4" /> Create Journey</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {journeysWithStats.map((j) => (
            <Card key={j._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h2 className="font-medium text-charcoal">{j.title}</h2>
                      <Badge variant={j.status as 'draft' | 'active' | 'completed' | 'deactivated'}>{j.status}</Badge>
                      {j.response && (
                        <Badge variant={j.response === 'yes' ? 'success' : 'secondary'}>
                          {j.response === 'yes' ? '💍 YES!' : 'No'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-charcoal/50 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {j.checkpointCount} checkpoints
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(j.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/journeys/${j._id}`}>Manage</Link>
                    </Button>
                    <DeleteJourneyButton journeyId={j._id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
