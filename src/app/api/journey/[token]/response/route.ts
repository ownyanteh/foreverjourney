import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { ProposalResponse } from '@/lib/db/models/ProposalResponse'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'
import { checkResponseRateLimit } from '@/lib/rate-limit'
import { proposalResponseSchema } from '@/lib/validation/schemas'

type Params = { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const tokenHash = hashToken(token)

    const body = await req.json()
    const parsed = proposalResponseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid response.' }, { status: 400 })
    }

    await connectDB()

    const res = NextResponse.json({})
    const recipientSession = await getRecipientSessionFromReq(req, res)
    if (!recipientSession.sessionId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const rateCheck = await checkResponseRateLimit(recipientSession.sessionId)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const journey = await Journey.findOne({ invitationTokenHash: tokenHash })
    if (!journey) return NextResponse.json({ error: 'Journey not found.' }, { status: 404 })

    const session = await JourneySession.findOne({
      _id: recipientSession.sessionId,
      journeyId: journey._id,
    })
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

    // Ensure final destination was unlocked server-side before accepting response
    if (!session.finalDestinationUnlockedAt) {
      return NextResponse.json({ error: 'Final destination not yet reached.' }, { status: 422 })
    }

    // Idempotency: if already responded, return current response
    if (session.responseStatus && session.responseStatus !== 'pending') {
      return NextResponse.json({
        success: true,
        alreadyResponded: true,
        response: session.responseStatus,
      })
    }

    const { response } = parsed.data

    // Save proposal response (unique constraint enforced by index)
    await ProposalResponse.create({
      journeyId: journey._id,
      sessionId: session._id,
      response,
    })

    session.responseStatus = response
    session.responseSubmittedAt = new Date()
    session.status = 'completed'
    session.lastActivityAt = new Date()
    await session.save()

    journey.status = 'completed'
    journey.completedAt = new Date()
    await journey.save()

    await JourneyEvent.create({
      journeyId: journey._id,
      sessionId: session._id,
      eventType: 'proposal_response_submitted',
      metadata: { response },
    })
    await JourneyEvent.create({
      journeyId: journey._id,
      sessionId: session._id,
      eventType: 'journey_completed',
      metadata: {},
    })

    return NextResponse.json({ success: true, response })
  } catch (err: unknown) {
    // MongoDB duplicate key = already responded
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Response already recorded.' }, { status: 409 })
    }
    console.error('[POST response]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
