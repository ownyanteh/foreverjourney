
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Map, Plus, CheckCircle2, Clock, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const session = await getAdminSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  await connectDB()

  const journeys = (await Journey.find({ adminId: session.adminId })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean()) as any[]

  // Gather stats per journey
  const journeyStats = await Promise.all(
    journeys.map(async (j) => {
      const checkpointCount = await Checkpoint.countDocuments({ journeyId: j._id, isActive: true })
      const response = (await ProposalResponse.findOne({ journeyId: j._id }).lean()) as { response?: string } | null
      const lastEvent = (await JourneyEvent.findOne({ journeyId: j._id })
        .sort({ timestamp: -1 })
        .lean()) as { timestamp?: Date } | null
      return { checkpointCount, response, lastEvent }
    })
  )

  const totalJourneys = await Journey.countDocuments({ adminId: session.adminId })
  const activeJourneys = await Journey.countDocuments({ adminId: session.adminId, status: 'active' })
  const completedJourneys = await Journey.countDocuments({ adminId: session.adminId, status: 'completed' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">Dashboard</h1>
          <p className="text-charcoal/60 mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>
        <Button asChild>
          <Link href="/admin/journeys/new">
            <Plus className="h-4 w-4" />
            New Journey
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-burgundy/10 flex items-center justify-center flex-shrink-0">
              <Map className="h-5 w-5 text-burgundy" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal">{totalJourneys}</p>
              <p className="text-sm text-charcoal/60">Total Journeys</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal">{activeJourneys}</p>
              <p className="text-sm text-charcoal/60">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-charcoal">{completedJourneys}</p>
              <p className="text-sm text-charcoal/60">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent journeys */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-charcoal mb-4">Recent Journeys</h2>
        {journeys.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-12 w-12 text-blush-300 mx-auto mb-4" />
              <p className="font-serif text-lg text-charcoal/60 mb-2">No journeys yet</p>
              <p className="text-sm text-charcoal/40 mb-6">
                Create your first journey to begin planning the perfect proposal.
              </p>
              <Button asChild>
                <Link href="/admin/journeys/new">
                  <Plus className="h-4 w-4" /> Create Journey
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {journeys.map((journey, i) => {
              const stats = journeyStats[i]
              const statusVariant =
                journey.status === 'active'
                  ? 'active'
                  : journey.status === 'completed'
                  ? 'completed'
                  : journey.status === 'deactivated'
                  ? 'deactivated'
                  : 'draft'

              return (
                <Card key={journey._id.toString()} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-medium text-charcoal truncate">{journey.title}</h3>
                          <Badge variant={statusVariant as 'active' | 'completed' | 'deactivated' | 'draft'}>
                            {journey.status}
                          </Badge>
                          {stats.response && (
                            <Badge variant={stats.response.response === 'yes' ? 'success' : 'secondary'}>
                              {stats.response.response === 'yes' ? '💍 YES!' : 'No'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-charcoal/50">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {stats.checkpointCount} checkpoints
                          </span>
                          {stats.lastEvent && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {stats.lastEvent?.timestamp && formatDistanceToNow(new Date(stats.lastEvent.timestamp as Date), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/journeys/${journey._id}`}>Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {totalJourneys > 5 && (
              <div className="text-center pt-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/journeys">View all journeys →</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
