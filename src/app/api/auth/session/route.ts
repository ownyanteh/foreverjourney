import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionFromReq } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getAdminSessionFromReq(req, res)
  if (!session.isLoggedIn) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 })
  }
  return NextResponse.json({
    isLoggedIn: true,
    email: session.email,
    adminId: session.adminId,
  })
}
