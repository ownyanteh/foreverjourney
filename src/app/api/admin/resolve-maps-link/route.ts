import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth/session'
import { isGoogleMapsShortLink, parseGoogleMapsCoordinates } from '@/lib/geo/google-maps'

const MAX_HOPS = 5

/**
 * Resolve a Google Maps short link (maps.app.goo.gl/…) to coordinates.
 * Only goo.gl short-link hosts are ever fetched; redirect targets are
 * parsed from the Location header, never requested.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let url: string
  try {
    const body = await req.json()
    url = String(body?.url ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!isGoogleMapsShortLink(url)) {
    return NextResponse.json({ error: 'Not a Google Maps short link.' }, { status: 400 })
  }

  try {
    let current = url
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const res = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      })
      const location = res.headers.get('location')
      if (!location) break

      const next = new URL(location, current).toString()
      const coords = parseGoogleMapsCoordinates(next)
      if (coords) return NextResponse.json(coords)

      if (!isGoogleMapsShortLink(next)) break
      current = next
    }
  } catch (err) {
    console.error('[resolve-maps-link]', err)
  }

  return NextResponse.json(
    {
      error:
        "Couldn't read coordinates from that link. In Google Maps, right-click the spot and click the coordinates to copy them, then paste here.",
    },
    { status: 422 }
  )
}
