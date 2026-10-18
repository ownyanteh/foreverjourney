
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
import { Plus, Heart } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DeleteJourneyButton from '@/components/admin/DeleteJourneyButton'
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
        mode: (j.mode === 'questions' ? 'questions' : 'route') as 'route' | 'questions',
        questionCount: Array.isArray(j.memoryQuestions) ? j.memoryQuestions.length : 0,
        response: response?.response ?? null,
      }
    })
  )

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className={adminPageTitleLg}>Journeys</h1>
          <p className="text-[15px] text-charcoal/60 mt-1.5">{journeys.length} total</p>
        </div>
        <Button asChild className={adminBtnPrimary}>
          <Link href="/admin/journeys/new">
            <Plus className="h-4 w-4" strokeWidth={2.2} /> New Journey
          </Link>
        </Button>
      </div>

      {journeysWithStats.length === 0 ? (
        <Card className={adminCard}>
          <CardContent className="py-16 px-6 text-center">
            <Heart className="h-12 w-12 text-blush-300 mx-auto mb-4" />
            <p className="font-serif text-lg text-charcoal/60 mb-6">No journeys yet. Create your first one.</p>
            <Button asChild className={adminBtnPrimary}>
              <Link href="/admin/journeys/new"><Plus className="h-4 w-4" strokeWidth={2.2} /> Create Journey</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {journeysWithStats.map((j) => (
            <Card key={j._id} className={cn(adminCard, 'hover:shadow-md transition-shadow')}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h2 className="text-base font-semibold text-charcoal">{j.title}</h2>
                      <Badge
                        variant={j.status as 'draft' | 'active' | 'completed' | 'deactivated'}
                        className={cn(adminBadge, statusBadgeClass[j.status] ?? statusBadgeClass.draft)}
                      >
                        {j.status}
                      </Badge>
                      {j.response && (
                        <Badge
                          variant={j.response === 'yes' ? 'success' : 'secondary'}
                          className={cn(adminBadge, j.response === 'yes' ? yesBadgeClass : noBadgeClass)}
                        >
                          {j.response === 'yes' ? '💍 YES!' : 'No'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-charcoal/55">
                      {j.mode === 'questions' ? 'Memory questions' : 'Route & destination'}
                      {' · '}
                      {j.mode === 'questions' ? `${j.questionCount} questions` : `${j.checkpointCount} checkpoints`}
                      {' · '}
                      {formatDistanceToNow(new Date(j.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button asChild variant="outline" size="sm" className={adminBtnOutlineSm}>
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
