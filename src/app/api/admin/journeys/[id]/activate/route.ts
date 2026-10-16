import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
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

    // Validate: a final destination is required; checkpoints are optional
    // (with none, the recipient is guided straight to the final destination)
    if (!journey.finalDestination?.latitude) {
      return NextResponse.json(
        { error: 'Please configure the final destination before activating.' },
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
