import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    if (journey.status === 'active') {
      return NextResponse.json({ error: 'Journey is already active.' }, { status: 400 })
    }

    // Validate: must have at least one active checkpoint or a final destination
    const checkpointCount = await Checkpoint.countDocuments({ journeyId: id, isActive: true })
    if (!journey.finalDestination?.latitude) {
      return NextResponse.json(
        { error: 'Please configure the final destination before activating.' },
        { status: 400 }
      )
    }
    if (checkpointCount === 0) {
      return NextResponse.json(
        { error: 'Please add at least one checkpoint before activating.' },
        { status: 400 }
      )
    }

    journey.status = 'active'
    journey.activatedAt = new Date()
    await journey.save()

    return NextResponse.json({ success: true, status: journey.status })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST activate]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
