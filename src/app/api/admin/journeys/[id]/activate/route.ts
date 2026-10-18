import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { requireAdminSession } from '@/lib/auth/session'
import { MIN_MEMORY_QUESTIONS, MAX_MEMORY_QUESTIONS } from '@/lib/validation/schemas'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    const { id } = await params
    await connectDB()

    const journey = await Journey.findOne({ _id: id, adminId: session.adminId })
    if (!journey) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    if (journey.status === 'active') {
      return NextResponse.json({ error: 'Journey is already active.' }, { status: 400 })
    }

    if (journey.mode === 'questions') {
      // Memory questions mode: needs 3–5 questions; no route or destination
      const count = (journey.memoryQuestions ?? []).filter((q: { prompt: string }) => q.prompt?.trim()).length
      if (count < MIN_MEMORY_QUESTIONS || count > MAX_MEMORY_QUESTIONS) {
        return NextResponse.json(
          { error: `Please add ${MIN_MEMORY_QUESTIONS} to ${MAX_MEMORY_QUESTIONS} memory questions before activating.` },
          { status: 400 }
        )
      }
    } else if (!journey.finalDestination?.latitude) {
      // Route mode: a final destination is required; checkpoints are optional
      // (with none, the recipient is guided straight to the final destination)
      return NextResponse.json(
        { error: 'Please configure the final destination before activating.' },
        { status: 400 }
      )
    }

    journey.status = 'active'
    journey.activatedAt = new Date()
    await journey.save()

    return NextResponse.json({ success: true, status: journey.status })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST activate]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
