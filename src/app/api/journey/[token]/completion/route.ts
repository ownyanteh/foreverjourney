import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'

type Params = { params: Promise<{ token: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const tokenHash = hashToken(token)
    await connectDB()

    const res = NextResponse.json({})
    const recipientSession = await getRecipientSessionFromReq(req, res)
    if (!recipientSession.sessionId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const journey = await Journey.findOne({ invitationTokenHash: tokenHash }).lean()
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const session = await JourneySession.findOne({
      _id: recipientSession.sessionId,
      journeyId: journey._id,
    }).lean()
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

    return NextResponse.json({
      status: session.status,
      responseStatus: session.responseStatus,
      responseSubmittedAt: session.responseSubmittedAt,
      yesMessage: journey.proposalContent.yesMessage,
      noMessage: journey.proposalContent.noMessage,
    })
  } catch (err) {
    console.error('[GET completion]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
