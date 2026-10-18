import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/connect'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { getAdminSessionFromReq } from '@/lib/auth/session'
import { checkSignupRateLimit } from '@/lib/rate-limit'
import { signupSchema } from '@/lib/validation/schemas'

/**
 * Public sign-up. Creates an account (each account only ever sees its own
 * journeys) and signs it in straight away.
 */
export async function POST(req: NextRequest) {
  const rateCheck = await checkSignupRateLimit(req)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-ups from this network. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 3600) } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Please check your details.' },
      { status: 400 }
    )
  }

  const { name, email, password } = parsed.data

  try {
    await connectDB()

    const existing = await AdminUser.findOne({ email }).select('_id').lean()
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try signing in instead.' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await AdminUser.create({ name, email, passwordHash, role: 'admin' })

    const res = NextResponse.json({ success: true, email: user.email }, { status: 201 })
    const session = await getAdminSessionFromReq(req, res)
    session.adminId = user._id.toString()
    session.email = user.email
    session.name = user.name
    session.role = 'admin'
    session.isLoggedIn = true
    await session.save()

    return res
  } catch (err) {
    // Two sign-ups racing with the same email
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try signing in instead.' },
        { status: 409 }
      )
    }
    console.error('[auth/signup]', err)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
