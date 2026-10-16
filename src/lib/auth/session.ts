import { getIronSession, IronSession, IronSessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// ── Session data shapes ───────────────────────────────────────────────────────

export interface AdminSessionData {
  adminId?: string
  email?: string
  role?: 'admin'
  isLoggedIn?: boolean
}

export interface RecipientSessionData {
  sessionId?: string
  journeyId?: string
  sessionToken?: string  // plaintext token for cookie; hash stored in DB
  isStarted?: boolean
}

// ── Iron-session option factories ─────────────────────────────────────────────

function getAdminSessionOptions(): IronSessionOptions {
  return {
    cookieName: 'ofj_admin_session',
    password: process.env.AUTH_SECRET as string,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    },
  }
}

function getRecipientSessionOptions(): IronSessionOptions {
  return {
    cookieName: 'ofj_recipient_session',
    password: process.env.AUTH_SECRET as string,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    },
  }
}

// ── Admin session helpers (Server Components / Route Handlers) ─────────────────

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies()
  return getIronSession<AdminSessionData>(cookieStore, getAdminSessionOptions())
}

export async function requireAdminSession(): Promise<AdminSessionData> {
  const session = await getAdminSession()
  if (!session.isLoggedIn || !session.adminId) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}

// ── Recipient session helpers ─────────────────────────────────────────────────

export async function getRecipientSession(): Promise<IronSession<RecipientSessionData>> {
  const cookieStore = await cookies()
  return getIronSession<RecipientSessionData>(cookieStore, getRecipientSessionOptions())
}

// ── Route handler helpers (for use in API routes that take req/res) ────────────

export async function getAdminSessionFromReq(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(req, res, getAdminSessionOptions())
}

export async function getRecipientSessionFromReq(
  req: NextRequest,
  res: NextResponse
): Promise<IronSession<RecipientSessionData>> {
  return getIronSession<RecipientSessionData>(req, res, getRecipientSessionOptions())
}
