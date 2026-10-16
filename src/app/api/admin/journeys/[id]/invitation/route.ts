import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { requireAdminSession } from '@/lib/auth/session'
import { generateSecureToken, hashToken } from '@/lib/tokens'
import { env } from '@/lib/env'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    if (journey.status === 'deactivated') {
      return NextResponse.json({ error: 'Cannot generate an invitation for a deactivated journey.' }, { status: 400 })
    }

    const token = generateSecureToken(32)
    const tokenHash = hashToken(token)

    journey.invitationTokenHash = tokenHash
    journey.invitationRevokedAt = null
    await journey.save()

    const invitationUrl = `${env.APP_URL}/journey/${token}`

    // Return the plaintext token exactly once — it is not stored
    return NextResponse.json({ invitationUrl, token })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST invitation]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
