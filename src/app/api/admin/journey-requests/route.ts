import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db/connect'
import { AdminUser } from '@/lib/db/models/AdminUser'
import { JourneyRequest } from '@/lib/db/models/JourneyRequest'
import { Journey } from '@/lib/db/models/Journey'
import { requireAdminSession } from '@/lib/auth/session'
import { journeyLimitFor } from '@/lib/limits'
import { env } from '@/lib/env'
import { sendEmail, emailLayout, escapeHtml } from '@/lib/email'

const bodySchema = z.object({ message: z.string().trim().max(500).default('') })

/**
 * Ask the site owner for more journeys. Saved to the database (so nothing is
 * lost if email isn't set up) and emailed to ADMIN_NOTIFICATION_EMAIL.
 * One open request per account at a time.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Message must be under 500 characters.' }, { status: 400 })
    }

    await connectDB()
    const user = (await AdminUser.findById(session.adminId).select('email name journeyLimit').lean()) as
      | { email: string; name?: string; journeyLimit?: number }
      | null
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })

    const existing = await JourneyRequest.findOne({ adminId: session.adminId, status: 'pending' }).select('_id').lean()
    if (existing) {
      return NextResponse.json({ success: true, alreadyRequested: true })
    }

    const limit = journeyLimitFor(user)
    const journeyCount = await Journey.countDocuments({ adminId: session.adminId })
    await JourneyRequest.create({
      adminId: session.adminId,
      email: user.email,
      name: user.name ?? '',
      message: parsed.data.message,
      journeyLimitAtRequest: limit,
    })

    if (env.ADMIN_NOTIFICATION_EMAIL) {
      const who = user.name ? `${user.name} (${user.email})` : user.email
      const note = parsed.data.message
        ? `<p style="margin:0 0 12px">Their note:</p><blockquote style="margin:0 0 16px;padding:12px 16px;background:#FCF0F3;border-radius:12px">${escapeHtml(parsed.data.message)}</blockquote>`
        : ''
      await sendEmail({
        to: env.ADMIN_NOTIFICATION_EMAIL,
        subject: `Journey request from ${user.name || user.email}`,
        text: `${who} has asked for more journeys. They have ${journeyCount} of ${limit}.${parsed.data.message ? `\n\nTheir note: ${parsed.data.message}` : ''}\n\nTo grant more, raise journeyLimit on their account in the adminusers collection.`,
        html: emailLayout(
          'Someone wants more journeys',
          `<p style="margin:0 0 12px"><strong>${escapeHtml(who)}</strong> has asked for more journeys. They're using ${journeyCount} of ${limit}.</p>${note}<p style="margin:0;color:#6b6570;font-size:13px">To grant more, raise <code>journeyLimit</code> on their account in the <code>adminusers</code> collection.</p>`
        ),
      })
    }

    return NextResponse.json({ success: true, alreadyRequested: false }, { status: 201 })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[POST journey-requests]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
