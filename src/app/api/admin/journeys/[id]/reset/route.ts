import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { requireAdminSession } from '@/lib/auth/session'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    // Wipe all journey history: sessions (progress), event timeline and the
    // proposal response. Shared memories (photos/messages) are kept on purpose.
    // The recipient's old cookie points at a deleted session, so their next
    // visit starts a fresh session automatically.
    await Promise.all([
      JourneySession.deleteMany({ journeyId: id }),
      JourneyEvent.deleteMany({ journeyId: id }),
      ProposalResponse.deleteMany({ journeyId: id }),
    ])

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
