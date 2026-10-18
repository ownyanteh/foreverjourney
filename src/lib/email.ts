import { Resend } from 'resend'
import { env } from '@/lib/env'

let client: Resend | null = null

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY)
}

/**
 * Send an email through Resend. Returns false (and logs) instead of throwing,
 * so callers can decide how to handle a delivery failure.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY is not set; email not sent:', opts.subject)
    return false
  }
  client ??= new Resend(env.RESEND_API_KEY)
  try {
    const { error } = await client.emails.send({ from: env.EMAIL_FROM, ...opts })
    if (error) {
      console.error('[email] Resend rejected the email:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('[email] Failed to send:', err)
    return false
  }
}

/** Escape user-provided text before putting it in an email body */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Simple branded wrapper for transactional emails */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FFF8F0;font-family:Inter,Arial,sans-serif;color:#242126">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:18px;font-weight:600;color:#7A2038">&#10084; Our Forever Journey</p>
<div style="background:#FFFFFF;border:1px solid #F4DDE3;border-radius:18px;padding:28px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#242126">${title}</h1>
${bodyHtml}
</div></div></body></html>`
}
