import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'
import { checkCheckpointRateLimit } from '@/lib/rate-limit'
import { completeCheckpointSchema } from '@/lib/validation/schemas'
import { checkGeofence } from '@/lib/geo/distance'

type Params = { params: Promise<{ token: string; id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token, id: checkpointId } = await params
    const tokenHash = hashToken(token)

    const body = await req.json()
    const parsed = completeCheckpointSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
    }

    await connectDB()

    const res = NextResponse.json({})
    const recipientSession = await getRecipientSessionFromReq(req, res)
    if (!recipientSession.sessionId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    // Rate limit per session
    const rateCheck = await checkCheckpointRateLimit(recipientSession.sessionId)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const journey = await Journey.findOne({ invitationTokenHash: tokenHash })
    if (!journey || journey.status !== 'active') {
      return NextResponse.json({ error: 'Journey not available.' }, { status: 404 })
    }

    const session = await JourneySession.findOne({
      _id: recipientSession.sessionId,
      journeyId: journey._id,
      status: 'active',
    })
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

    // Prevent duplicate completion
    if (session.completedCheckpointIds.some((id) => id.toString() === checkpointId)) {
      // Already completed — return content again (idempotent)
      const checkpoint = await Checkpoint.findById(checkpointId).lean()
      return NextResponse.json({ success: true, alreadyCompleted: true, content: checkpoint?.content })
    }

    // Server-side geofence validation
    const checkpoint = await Checkpoint.findOne({ _id: checkpointId, journeyId: journey._id, isActive: true })
    if (!checkpoint) return NextResponse.json({ error: 'Checkpoint not found.' }, { status: 404 })

    const { latitude, longitude, accuracy = 50 } = parsed.data
    const geofenceResult = checkGeofence({
      userLat: latitude,
      userLon: longitude,
      targetLat: checkpoint.coordinates.latitude,
      targetLon: checkpoint.coordinates.longitude,
      geofenceRadius: checkpoint.geofenceRadius,
      gpsAccuracy: accuracy,
    })

    // Reject if clearly outside even with accuracy considered
    if (!geofenceResult.isInside && !geofenceResult.isUncertain) {
      return NextResponse.json(
        { error: 'You are not close enough to this checkpoint.', distance: Math.round(geofenceResult.distance) },
        { status: 422 }
      )
    }

    // Mark complete
    session.completedCheckpointIds.push(checkpoint._id)
    session.currentCheckpointIndex += 1
    session.lastActivityAt = new Date()
    await session.save()

    await JourneyEvent.create({
      journeyId: journey._id,
      sessionId: session._id,
      eventType: 'checkpoint_unlocked',
      checkpointId: checkpoint._id,
      metadata: { sequence: checkpoint.sequence },
    })

    return NextResponse.json({
      success: true,
      content: checkpoint.content,
      checkpointId: checkpoint._id.toString(),
    })
  } catch (err) {
    console.error('[POST checkpoint/complete]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
