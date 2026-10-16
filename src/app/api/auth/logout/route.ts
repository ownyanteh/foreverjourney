import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionFromReq } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  const session = await getAdminSessionFromReq(req, res)
  session.destroy()
  return res
}
