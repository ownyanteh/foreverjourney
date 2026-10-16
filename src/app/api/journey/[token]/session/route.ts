import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { checkInvitationRateLimit } from '@/lib/rate-limit'
import { generateSecureToken, hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'

type Params = { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  // Rate limit invitation resolution
  const rateCheck = await checkInvitationRateLimit(req)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { token } = await params
    if (!token || typeof token !== 'string') {
      // Generic error — do not reveal whether token was valid
      return NextResponse.json({ error: 'This link is unavailable.' }, { status: 404 })
    }

    const tokenHash = hashToken(token)
    await connectDB()

    const journey = await Journey.findOne({
      invitationTokenHash: tokenHash,
      invitationRevokedAt: null,
    })

    if (!journey || journey.status !== 'active') {
      // Same generic error for revoked, not-found, or inactive
      return NextResponse.json({ error: 'This link is unavailable.' }, { status: 404 })
    }

    // Check for existing session in cookie
    const res = NextResponse.json({})
    const existingSession = await getRecipientSessionFromReq(req, res)

    if (existingSession.journeyId === journey._id.toString() && existingSession.sessionId) {
      const existing = await JourneySession.findById(existingSession.sessionId)
      if (existing && existing.status !== 'abandoned') {
        return NextResponse.json({
          success: true,
          resumed: true,
          journeyId: journey._id.toString(),
          sessionId: existing._id.toString(),
        })
      }
    }

    // Create new session
    const sessionToken = generateSecureToken(32)
    const sessionTokenHash = hashToken(sessionToken)

    const session = await JourneySession.create({
      journeyId: journey._id,
      sessionTokenHash,
      status: 'active',
    })

    await JourneyEvent.create({
      journeyId: journey._id,
      sessionId: session._id,
      eventType: 'journey_started',
      metadata: {},
    })

    // Set recipient session cookie
    const finalRes = NextResponse.json({
      success: true,
      resumed: false,
      journeyId: journey._id.toString(),
      sessionId: session._id.toString(),
    })
    const recipientSession = await getRecipientSessionFromReq(req, finalRes)
    recipientSession.sessionId = session._id.toString()
    recipientSession.journeyId = journey._id.toString()
    recipientSession.sessionToken = sessionToken
    recipientSession.isStarted = true
    await recipientSession.save()

    return finalRes
  } catch (err) {
    console.error('[POST /api/journey/session]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
