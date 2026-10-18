import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { checkPasswordResetRateLimit } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/validation/schemas'
import { generateSecureToken, hashToken } from '@/lib/tokens'
import { env } from '@/lib/env'
import { sendEmail, emailLayout, escapeHtml } from '@/lib/email'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Email a password reset link. Always answers the same way, whether or not the
 * email has an account, so this can't be used to discover who has signed up.
 */
export async function POST(req: NextRequest) {
  const rateCheck = await checkPasswordResetRateLimit(req)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid email address.' }, { status: 400 })
  }

  const generic = NextResponse.json({
    success: true,
    message: 'If an account exists for that email, a reset link is on its way.',
  })

  try {
    await connectDB()
    const user = await AdminUser.findOne({ email: parsed.data.email })
    if (!user) return generic

    const token = generateSecureToken(32)
    user.resetTokenHash = hashToken(token)
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await user.save()

    const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`
    const greeting = user.name ? `Hi ${escapeHtml(user.name)},` : 'Hi,'
    const sent = await sendEmail({
      to: user.email,
      subject: 'Reset your Our Forever Journey password',
      text: `${user.name ? `Hi ${user.name},` : 'Hi,'}\n\nUse this link to choose a new password. It expires in 1 hour:\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: emailLayout(
        'Reset your password',
        `<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 20px">Use the button below to choose a new password. The link expires in 1 hour.</p>
<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#7A2038;color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px">Choose a new password</a></p>
<p style="margin:0;color:#6b6570;font-size:13px">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`
      ),
    })

    if (!sent && env.NODE_ENV !== 'production') {
      // Local development without email: make the link usable from the server log
      console.info('[forgot-password] Email not sent. Reset link (dev only):', link)
    }

    return generic
  } catch (err) {
    console.error('[auth/forgot-password]', err)
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 })
  }
}
