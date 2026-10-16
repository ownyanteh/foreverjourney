import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'
import { updateCheckpointSchema } from '@/lib/validation/schemas'

type Params = { params: Promise<{ id: string }> }

async function verifyOwnership(checkpointId: string, adminId: string) {
  const cp = (await Checkpoint.findById(checkpointId).lean()) as { journeyId: unknown } | null
  if (!cp) return null
  const journey = await Journey.findOne({ _id: cp.journeyId, adminId }).lean()
  if (!journey) return null
  return cp
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    const body = await req.json()
    const parsed = updateCheckpointSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.', details: parsed.error.flatten() }, { status: 400 })
    }

    await connectDB()

    const existing = await verifyOwnership(id, session.adminId!)
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const checkpoint = (await Checkpoint.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean()) as { _id: { toString(): string } } | null
    return NextResponse.json({ checkpoint: { ...checkpoint, _id: checkpoint!._id.toString() } })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const existing = await verifyOwnership(id, session.adminId!)
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    await Checkpoint.findByIdAndDelete(id)

    // Re-sequence remaining checkpoints
    const remaining = await Checkpoint.find({ journeyId: existing.journeyId }).sort({ sequence: 1 })
    await Promise.all(remaining.map((cp, i) => {
      cp.sequence = i
      return cp.save()
    }))

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
