import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // ── Security headers ────────────────────────────────────────────────────────
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()')
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // MapLibre GL JS requires blob: and data: for workers/tiles
      "script-src 'self' 'unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://tiles.openfreemap.org",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://tiles.openfreemap.org https://res.cloudinary.com",
      "worker-src blob:",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
}
