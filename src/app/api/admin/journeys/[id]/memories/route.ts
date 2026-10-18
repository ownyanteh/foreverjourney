import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { requireAdminSession } from '@/lib/auth/session'
import { deleteMemories } from '@/lib/memories'

type Params = { params: Promise<{ id: string }> }

/** Delete every shared memory (photos and messages) for this journey. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId }).select('_id').lean()
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const deleted = await deleteMemories({ journeyId: id })
    return NextResponse.json({ success: true, deleted })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[DELETE memories]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
