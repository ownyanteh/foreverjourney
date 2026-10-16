import { NextRequest, NextResponse } from 'next/server'
import { getRoute } from '@/lib/map/routing'
import { env } from '@/lib/env'
import { latitudeSchema, longitudeSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

const querySchema = z.object({
  fromLat: z.string().transform(Number).pipe(latitudeSchema),
  fromLon: z.string().transform(Number).pipe(longitudeSchema),
  toLat: z.string().transform(Number).pipe(latitudeSchema),
  toLon: z.string().transform(Number).pipe(longitudeSchema),
  profile: z.enum(['driving', 'walking']).optional().default('driving'),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
  }

  const { fromLat, fromLon, toLat, toLon, profile } = parsed.data

  const route = await getRoute(fromLat, fromLon, toLat, toLon, profile, env.ORS_API_KEY)

  if (!route) {
    return NextResponse.json(
      { route: null, fallback: true, message: 'Routing unavailable. Using straight-line estimate.' },
      { status: 200 }
    )
  }

  return NextResponse.json({ route })
}
