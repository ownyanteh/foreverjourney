import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
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

    // Get all active checkpoints in order
    const checkpoints = await Checkpoint.find({ journeyId: journey._id, isActive: true })
      .sort({ sequence: 1 })
      .lean()

    // Find the first incomplete checkpoint
    const completedIds = session.completedCheckpointIds.map((id) => id.toString())
    const activeCheckpoint = checkpoints.find((cp) => !completedIds.includes(cp._id.toString()))

    if (!activeCheckpoint) {
      // All checkpoints done — navigate to final destination
      return NextResponse.json({
        checkpoint: null,
        isLastCheckpoint: false,
        nextIsFinalDestination: true,
        finalDestination: {
          // Only return navigation-necessary data — NOT the name or proposal content
          latitude: journey.finalDestination?.latitude,
          longitude: journey.finalDestination?.longitude,
          geofenceRadius: journey.finalDestination?.geofenceRadius,
          approachingRadius: journey.finalDestination?.approachingRadius,
        },
      })
    }

    const remainingAfter = checkpoints.filter(
      (cp) =>
        cp.sequence > activeCheckpoint.sequence &&
        !completedIds.includes(cp._id.toString())
    )

    return NextResponse.json({
      checkpoint: {
        _id: activeCheckpoint._id.toString(),
        title: activeCheckpoint.title,
        sequence: activeCheckpoint.sequence,
        coordinates: activeCheckpoint.coordinates,
        geofenceRadius: activeCheckpoint.geofenceRadius,
        required: activeCheckpoint.required,
        skippable: activeCheckpoint.skippable,
        isActive: activeCheckpoint.isActive,
        // Instruction text only — romantic content revealed on unlock
        instructionText: activeCheckpoint.content.instructionText,
      },
      isLastCheckpoint: remainingAfter.length === 0,
      nextIsFinalDestination: false,
    })
  } catch (err) {
    console.error('[GET active-checkpoint]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
