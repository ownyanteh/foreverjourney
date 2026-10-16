import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'
import { reorderCheckpointsSchema } from '@/lib/validation/schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    const body = await req.json()
    const parsed = reorderCheckpointsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 })
    }

    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    // Update each checkpoint's sequence atomically
    const updates = parsed.data.orderedIds.map((checkpointId, index) =>
      Checkpoint.findOneAndUpdate(
        { _id: checkpointId, journeyId: id },
        { sequence: index },
        { new: true }
      )
    )
    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
