import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/connect'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { checkPasswordResetRateLimit } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/validation/schemas'
import { hashToken } from '@/lib/tokens'

/** Set a new password using a valid, unexpired reset token. The token works once. */
export async function POST(req: NextRequest) {
  const rateCheck = await checkPasswordResetRateLimit(req)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })
  }

  try {
    await connectDB()
    const user = await AdminUser.findOne({
      resetTokenHash: hashToken(parsed.data.token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpiresAt')

    if (!user) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    user.passwordHash = await bcrypt.hash(parsed.data.password, 12)
    user.resetTokenHash = null
    user.resetTokenExpiresAt = null
    await user.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[auth/reset-password]', err)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
