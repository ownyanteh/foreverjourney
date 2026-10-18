import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'
import { createJourneySchema } from '@/lib/validation/schemas'

export async function GET() {
  try {
    const session = await requireAdminSession()
    await connectDB()

    const journeys = await Journey.find({ adminId: session.adminId })
      .sort({ updatedAt: -1 })
      .lean()

    const withCounts = await Promise.all(
      journeys.map(async (j) => ({
        ...j,
        _id: j._id.toString(),
        adminId: j.adminId.toString(),
        checkpointCount: await Checkpoint.countDocuments({ journeyId: j._id, isActive: true }),
      }))
    )

    return NextResponse.json({ journeys: withCounts })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[GET /api/admin/journeys]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = await req.json()
    const parsed = createJourneySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.', details: parsed.error.flatten() }, { status: 400 })
    }

    await connectDB()

    const journey = await Journey.create({
      adminId: session.adminId,
      title: parsed.data.title,
      mode: parsed.data.mode ?? 'route',
      welcomeContent: parsed.data.welcomeContent ?? {},
      theme: parsed.data.theme ?? {},
      status: 'draft',
    })

    return NextResponse.json({ journey: { ...journey.toJSON(), _id: journey._id.toString() } }, { status: 201 })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[POST /api/admin/journeys]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
