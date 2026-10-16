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

    const journey = await Journey.findOneAndUpdate(
      { _id: id, adminId: session.adminId },
      { status: 'deactivated' },
      { new: true }
    )
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    return NextResponse.json({ success: true, status: journey.status })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
