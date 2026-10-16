import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { requireAdminSession } from '@/lib/auth/session'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    // Reset journey status — do NOT delete events or responses (audit trail preserved)
    // Mark current sessions as abandoned
    await JourneySession.updateMany(
      { journeyId: id, status: 'active' },
      { status: 'abandoned' }
    )

    // Record a reset event (append-only log)
    await JourneyEvent.create({
      journeyId: id,
      sessionId: new (await import('mongoose')).default.Types.ObjectId(),
      eventType: 'journey_reset',
      metadata: { resetBy: session.adminId, resetAt: new Date().toISOString() },
    })

    journey.status = 'draft'
    journey.completedAt = undefined as unknown as null
    await journey.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST reset]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
