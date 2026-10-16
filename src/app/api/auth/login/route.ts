import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/connect'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { getAdminSessionFromReq } from '@/lib/auth/session'
import { checkLoginRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  // Rate limit
  const rateCheck = await checkLoginRateLimit(req)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfterSeconds ?? 900) },
      }
    )
  }

  // Validate input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid email or password format.' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  try {
    await connectDB()
    // Always fetch and compare to prevent timing attacks that reveal valid emails
    const user = await AdminUser.findOne({ email }).select('+passwordHash')
    
    const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000'
    const hashToCompare = user?.passwordHash ?? dummyHash
    const passwordMatches = await bcrypt.compare(password, hashToCompare)

    if (!user || !passwordMatches) {
      // Generic message — do not reveal whether the email exists
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Create session
    const res = NextResponse.json({ success: true, email: user.email })
    const session = await getAdminSessionFromReq(req, res)
    session.adminId = user._id.toString()
    session.email = user.email
    session.role = 'admin'
    session.isLoggedIn = true
    await session.save()

    // Update last login (fire and forget)
    AdminUser.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => null)

    return res
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
