import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { requireAdminSession } from '@/lib/auth/session'
import { deleteMemories } from '@/lib/memories'

type Params = { params: Promise<{ id: string; memoryId: string }> }

/** Delete one shared memory (and its photo) from this journey. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id, memoryId } = await params
    if (!mongoose.isValidObjectId(memoryId)) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId }).select('_id').lean()
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const deleted = await deleteMemories({ _id: memoryId, journeyId: id })
    if (deleted === 0) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[DELETE memory]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
