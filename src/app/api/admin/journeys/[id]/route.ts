import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { Checkpoint } from '@/lib/db/models/Checkpoint'
import { requireAdminSession } from '@/lib/auth/session'
import { updateJourneySchema } from '@/lib/validation/schemas'
import { deleteMemories } from '@/lib/memories'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId }).lean()
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const checkpoints = await Checkpoint.find({ journeyId: id }).sort({ sequence: 1 }).lean()

    return NextResponse.json({
      journey: { ...journey, _id: journey._id.toString(), adminId: journey.adminId.toString() },
      checkpoints: checkpoints.map((c) => ({ ...c, _id: c._id.toString(), journeyId: c.journeyId.toString() })),
    })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[GET /api/admin/journeys/:id]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    const body = await req.json()
    const parsed = updateJourneySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.', details: parsed.error.flatten() }, { status: 400 })
    }

    await connectDB()

    // Build nested update safely
    const updateFields: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) updateFields.title = parsed.data.title
    if (parsed.data.welcomeContent !== undefined) {
      Object.entries(parsed.data.welcomeContent).forEach(([k, v]) => {
        updateFields[`welcomeContent.${k}`] = v
      })
    }
    if (parsed.data.theme !== undefined) {
      Object.entries(parsed.data.theme).forEach(([k, v]) => {
        updateFields[`theme.${k}`] = v
      })
    }
    if (parsed.data.proposalContent !== undefined) {
      Object.entries(parsed.data.proposalContent).forEach(([k, v]) => {
        updateFields[`proposalContent.${k}`] = v
      })
    }
    if (parsed.data.finalDestination !== undefined) {
      Object.entries(parsed.data.finalDestination).forEach(([k, v]) => {
        updateFields[`finalDestination.${k}`] = v
      })
    }

    if (parsed.data.mode !== undefined) {
      // Switching type mid-journey would strand the recipient
      const current = (await Journey.findOne({ _id: id, adminId: session.adminId }).select('status').lean()) as { status: string } | null
      if (current?.status === 'active') {
        return NextResponse.json({ error: 'Deactivate the journey before changing its type.' }, { status: 400 })
      }
      updateFields.mode = parsed.data.mode
    }
    if (parsed.data.memoryQuestions !== undefined) updateFields.memoryQuestions = parsed.data.memoryQuestions

    const journey = await Journey.findOneAndUpdate(
      { _id: id, adminId: session.adminId },
      { $set: updateFields },
      { new: true }
    ).lean()

    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    return NextResponse.json({ journey: { ...journey, _id: journey._id.toString() } })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[PATCH /api/admin/journeys/:id]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOneAndDelete({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    // Cascade delete checkpoints
    await Checkpoint.deleteMany({ journeyId: id })

    // Cascade delete shared memories and their photos
    await deleteMemories({ journeyId: id })

    return NextResponse.json({ success: true })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[DELETE /api/admin/journeys/:id]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
