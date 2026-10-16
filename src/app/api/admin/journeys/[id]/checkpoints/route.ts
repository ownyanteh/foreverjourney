import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'
import { createCheckpointSchema } from '@/lib/validation/schemas'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    // Verify ownership
    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const checkpoints = (await Checkpoint.find({ journeyId: id }).sort({ sequence: 1 }).lean()) as Array<{ _id: { toString(): string }; journeyId: { toString(): string } }>
    return NextResponse.json({
      checkpoints: checkpoints.map((c) => ({ ...c, _id: c._id.toString(), journeyId: c.journeyId.toString() })),
    })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    const body = await req.json()
    const parsed = createCheckpointSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.', details: parsed.error.flatten() }, { status: 400 })
    }

    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    // Auto-assign sequence if not provided
    const maxSeq = (await Checkpoint.findOne({ journeyId: id }).sort({ sequence: -1 }).lean()) as { sequence?: number } | null
    const sequence = (maxSeq?.sequence ?? -1) + 1

    const checkpoint = await Checkpoint.create({
      journeyId: id,
      sequence,
      ...parsed.data,
    })

    return NextResponse.json(
      { checkpoint: { ...checkpoint.toJSON(), _id: checkpoint._id.toString(), journeyId: id } },
      { status: 201 }
    )
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST checkpoints]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
