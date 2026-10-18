import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'
import { checkCheckpointRateLimit } from '@/lib/rate-limit'
import { answerQuestionSchema } from '@/lib/validation/schemas'

type Params = { params: Promise<{ token: string }> }

type Question = { prompt: string; hint?: string }
type Answer = { questionIndex: number; prompt: string; feeling: string | null; answer: string; answeredAt: Date }

/** Resolve the active journey (in questions mode) and the recipient's session document */
async function resolve(req: NextRequest, token: string) {
  const res = NextResponse.json({})
  const recipientSession = await getRecipientSessionFromReq(req, res)
  if (!recipientSession.sessionId) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

  await connectDB()
  const journey = await Journey.findOne({ invitationTokenHash: hashToken(token) })
  if (!journey || journey.mode !== 'questions') {
    return { error: NextResponse.json({ error: 'Journey not found.' }, { status: 404 }) }
  }

  const session = await JourneySession.findOne({ _id: recipientSession.sessionId, journeyId: journey._id })
  if (!session) return { error: NextResponse.json({ error: 'Session not found.' }, { status: 404 }) }

  return { journey, session }
}

function answersForClient(answers: Answer[]) {
  return answers.map((a) => ({ index: a.questionIndex, feeling: a.feeling, answer: a.answer }))
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const resolved = await resolve(req, token)
    if ('error' in resolved) return resolved.error
    const { journey, session } = resolved

    const questions = (journey.memoryQuestions as Question[]).map((q) => ({ prompt: q.prompt, hint: q.hint ?? '' }))
    return NextResponse.json({
      questions,
      answers: answersForClient(session.questionAnswers as Answer[]),
      completed: Boolean(session.finalDestinationUnlockedAt),
    })
  } catch (err) {
    console.error('[GET questions]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }
    const parsed = answerQuestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid answer.' }, { status: 400 })
    }

    const resolved = await resolve(req, token)
    if ('error' in resolved) return resolved.error
    const { journey, session } = resolved

    if (journey.status !== 'active' || session.status !== 'active') {
      return NextResponse.json({ error: 'This journey is not active.' }, { status: 422 })
    }

    const rateCheck = await checkCheckpointRateLimit(session._id.toString())
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const questions = journey.memoryQuestions as Question[]
    const { index, feeling, answer } = parsed.data
    if (index >= questions.length) {
      return NextResponse.json({ error: 'Unknown question.' }, { status: 400 })
    }

    // Save (or replace) the answer for this question
    const answers = (session.questionAnswers as Answer[]).filter((a) => a.questionIndex !== index)
    answers.push({
      questionIndex: index,
      prompt: questions[index].prompt,
      feeling: feeling ?? null,
      answer,
      answeredAt: new Date(),
    })
    answers.sort((a, b) => a.questionIndex - b.questionIndex)
    session.questionAnswers = answers
    session.lastActivityAt = new Date()

    // All questions answered: unlock the proposal
    const answeredAll = questions.every((_, i) => answers.some((a) => a.questionIndex === i))
    const justCompleted = answeredAll && !session.finalDestinationUnlockedAt
    if (justCompleted) session.finalDestinationUnlockedAt = new Date()
    await session.save()

    if (justCompleted) {
      await JourneyEvent.create({
        journeyId: journey._id,
        sessionId: session._id,
        eventType: 'questions_completed',
        metadata: { questionCount: questions.length },
      })
    }

    return NextResponse.json({ success: true, completed: Boolean(session.finalDestinationUnlockedAt) })
  } catch (err) {
    console.error('[POST questions]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
