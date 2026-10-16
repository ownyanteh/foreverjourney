import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'
import { verifyFinalDestinationSchema } from '@/lib/validation/schemas'
import { checkGeofence } from '@/lib/geo/distance'

type Params = { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const tokenHash = hashToken(token)

    const body = await req.json()
    const parsed = verifyFinalDestinationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
    }

    await connectDB()

    const res = NextResponse.json({})
    const recipientSession = await getRecipientSessionFromReq(req, res)
    if (!recipientSession.sessionId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

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

    // Ensure all required checkpoints are completed before unlocking final destination
    const requiredCheckpoints = await Checkpoint.find({
      journeyId: journey._id,
      required: true,
      isActive: true,
    }).lean()
    const completedIds = session.completedCheckpointIds.map((id) => id.toString())
    const allRequiredDone = requiredCheckpoints.every((cp) =>
      completedIds.includes(cp._id.toString())
    )
    if (!allRequiredDone) {
      return NextResponse.json({ error: 'Complete all required checkpoints first.' }, { status: 422 })
    }

    if (!journey.finalDestination) {
      return NextResponse.json({ error: 'No final destination configured.' }, { status: 422 })
    }

    const { latitude, longitude, accuracy = 50 } = parsed.data
    const dest = journey.finalDestination

    // Check approaching radius for suspense message
    const approachResult = checkGeofence({
      userLat: latitude,
      userLon: longitude,
      targetLat: dest.latitude,
      targetLon: dest.longitude,
      geofenceRadius: dest.approachingRadius,
      gpsAccuracy: accuracy,
    })

    // Check arrival radius
    const arrivalResult = checkGeofence({
      userLat: latitude,
      userLon: longitude,
      targetLat: dest.latitude,
      targetLon: dest.longitude,
      geofenceRadius: dest.geofenceRadius,
      gpsAccuracy: accuracy,
    })

    const isApproaching = approachResult.isInside || approachResult.isUncertain
    const isArrived = arrivalResult.isInside

    // If manual fallback enabled and GPS is very inaccurate, allow arrival
    const gpsUncertain = (accuracy ?? 0) > dest.geofenceRadius * 2
    const allowedByFallback = dest.manualFallbackEnabled && gpsUncertain

    if (!isArrived && !allowedByFallback) {
      return NextResponse.json({
        isApproaching,
        isArrived: false,
        approachingMessage: isApproaching ? dest.approachingMessage : null,
        distance: Math.round(arrivalResult.distance),
        gpsUncertain,
        manualFallbackEnabled: dest.manualFallbackEnabled,
      })
    }

    // Arrived! Unlock the proposal
    if (!session.finalDestinationUnlockedAt) {
      session.finalDestinationUnlockedAt = new Date()
      session.lastActivityAt = new Date()
      await session.save()

      await JourneyEvent.create({
        journeyId: journey._id,
        sessionId: session._id,
        eventType: 'final_destination_unlocked',
        metadata: {},
      })
    }

    // Return proposal content — ONLY now that arrival is confirmed server-side
    return NextResponse.json({
      isApproaching: true,
      isArrived: true,
      proposalContent: journey.proposalContent,
      finalDestinationName: dest.name,
    })
  } catch (err) {
    console.error('[POST final-destination/verify]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
