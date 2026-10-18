import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { env } from '@/lib/env'
import { expireOldPhotos } from '@/lib/memories'

/**
 * Daily job (see vercel.json) that deletes shared photos past their expiry.
 * Vercel Cron calls this with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const removed = await expireOldPhotos()
    return NextResponse.json({ success: true, removed })
  } catch (err) {
    console.error('[cron cleanup-memories]', err)
    return NextResponse.json({ error: 'Cleanup failed.' }, { status: 500 })
  }
}
