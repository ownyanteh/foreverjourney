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
    if (!recipientSession.sessionId) {
      return NextResponse.json({ error: 'No active session.' }, { status: 401 })
    }

    const journey = await Journey.findOne({ invitationTokenHash: tokenHash }).lean()
    if (!journey) return NextResponse.json({ error: 'Journey not found.' }, { status: 404 })

    const session = await JourneySession.findOne({
      _id: recipientSession.sessionId,
      journeyId: journey._id,
    }).lean()
    if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

    const totalCheckpoints = await Checkpoint.countDocuments({ journeyId: journey._id, isActive: true })

    return NextResponse.json({
      journeyId: journey._id.toString(),
      status: journey.status,
      title: journey.title,
      welcomeContent: journey.welcomeContent,
      theme: journey.theme,
      sessionStatus: session.status,
      currentCheckpointIndex: session.currentCheckpointIndex,
      totalCheckpoints,
      completedCheckpointIds: session.completedCheckpointIds.map((id) => id.toString()),
      finalDestinationUnlocked: !!session.finalDestinationUnlockedAt,
      responseStatus: session.responseStatus,
    })
  } catch (err) {
    console.error('[GET /api/journey/state]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
