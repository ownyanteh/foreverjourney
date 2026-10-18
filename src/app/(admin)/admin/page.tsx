
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/session'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Map, Plus, CheckCircle2, Clock, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  adminCard,
  adminBadge,
  adminBtnPrimary,
  adminBtnOutlineSm,
  adminPageTitleLg,
  statusBadgeClass,
  yesBadgeClass,
  noBadgeClass,
} from '@/components/admin/adminStyles'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const session = await getAdminSession()
  if (!session.isLoggedIn) redirect('/admin/login')

  await connectDB()

  const account = (await AdminUser.findById(session.adminId).select('name').lean()) as { name?: string } | null
  const firstName = account?.name?.trim().split(/\s+/)[0] ?? ''

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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={adminPageTitleLg}>Dashboard</h1>
          <p className="text-[15px] text-charcoal/60 mt-1.5">
            {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'} Here&apos;s what&apos;s happening.
          </p>
        </div>
        <Button asChild className={adminBtnPrimary}>
          <Link href="/admin/journeys/new">
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            New Journey
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Card className={adminCard}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-burgundy/10 flex items-center justify-center flex-shrink-0">
              <Map className="h-5 w-5 text-burgundy" />
            </div>
            <div>
              <p className="text-[28px] leading-tight font-semibold text-charcoal">{totalJourneys}</p>
              <p className="text-sm text-charcoal/60">Total Journeys</p>
            </div>
          </CardContent>
        </Card>
        <Card className={adminCard}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Activity className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-[28px] leading-tight font-semibold text-charcoal">{activeJourneys}</p>
              <p className="text-sm text-charcoal/60">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className={adminCard}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-gold/[0.22] flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <p className="text-[28px] leading-tight font-semibold text-charcoal">{completedJourneys}</p>
              <p className="text-sm text-charcoal/60">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent journeys */}
      <div>
        <h2 className="font-serif text-[22px] font-semibold text-charcoal mb-4">Recent Journeys</h2>
        {journeys.length === 0 ? (
          <Card className={adminCard}>
            <CardContent className="py-16 px-6 text-center">
              <Heart className="h-12 w-12 text-blush-300 mx-auto mb-4" />
              <p className="font-serif text-lg text-charcoal/60 mb-2">No journeys yet</p>
              <p className="text-sm text-charcoal/45 mb-6">
                Create your first journey to begin planning the perfect proposal.
              </p>
              <Button asChild className={adminBtnPrimary}>
                <Link href="/admin/journeys/new">
                  <Plus className="h-4 w-4" strokeWidth={2.2} /> Create Journey
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
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
              const isQuestionsMode = journey.mode === 'questions'
              const questionCount = Array.isArray(journey.memoryQuestions) ? journey.memoryQuestions.length : 0

              return (
                <Card key={journey._id.toString()} className={cn(adminCard, 'hover:shadow-md transition-shadow')}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="text-base font-semibold text-charcoal truncate">{journey.title}</h3>
                          <Badge
                            variant={statusVariant as 'active' | 'completed' | 'deactivated' | 'draft'}
                            className={cn(adminBadge, statusBadgeClass[statusVariant])}
                          >
                            {journey.status}
                          </Badge>
                          {stats.response && (
                            <Badge
                              variant={stats.response.response === 'yes' ? 'success' : 'secondary'}
                              className={cn(adminBadge, stats.response.response === 'yes' ? yesBadgeClass : noBadgeClass)}
                            >
                              {stats.response.response === 'yes' ? '💍 YES!' : 'No'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[13px] text-charcoal/55">
                          <span className="inline-flex items-center gap-[5px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isQuestionsMode
                              ? `${questionCount} questions`
                              : `${stats.checkpointCount} checkpoints`}
                          </span>
                          {stats.lastEvent && (
                            <span className="inline-flex items-center gap-[5px]">
                              <Clock className="h-3.5 w-3.5" />
                              {stats.lastEvent?.timestamp && formatDistanceToNow(new Date(stats.lastEvent.timestamp as Date), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className={adminBtnOutlineSm}>
                        <Link href={`/admin/journeys/${journey._id}`}>Manage</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {totalJourneys > 5 && (
              <div className="text-center pt-2">
                <Button asChild variant="ghost" size="sm" className="h-9 px-3.5 rounded-[10px] text-[13px] text-burgundy hover:bg-blush-100 hover:text-burgundy-700">
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
