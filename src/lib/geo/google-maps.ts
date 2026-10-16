/**
 * Extract coordinates from text copied out of Google Maps.
 *
 * Supported inputs:
 *   - Plain pairs from Google Maps' right-click menu: "5.6037, -0.1870"
 *   - Full links: /maps/place/...!3d5.6!4d-0.18, /maps/@5.6,-0.18,15z,
 *     ?q=5.6,-0.18, ?ll=..., ?query=..., ?destination=...
 *
 * Short links (maps.app.goo.gl/…) carry no coordinates; resolve them
 * server-side first (see /api/admin/resolve-maps-link).
 */

export interface LatLng {
  lat: number
  lng: number
}

const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)'

function valid(lat: number, lng: number): LatLng | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

function pair(text: string): LatLng | null {
  const m = text.match(new RegExp(`^\\s*${NUM}\\s*,\\s*${NUM}\\s*$`))
  return m ? valid(parseFloat(m[1]), parseFloat(m[2])) : null
}

export function parseGoogleMapsCoordinates(input: string): LatLng | null {
  const text = input.trim()
  if (!text) return null

  const plain = pair(text)
  if (plain) return plain

  let decoded = text
  try {
    decoded = decodeURIComponent(text)
  } catch {
    // keep raw text
  }

  // Exact pin of a place: "!3d<lat>!4d<lng>" — more precise than the viewport "@"
  const pin = [...decoded.matchAll(new RegExp(`!3d${NUM}!4d${NUM}`, 'g'))].pop()
  if (pin) {
    const r = valid(parseFloat(pin[1]), parseFloat(pin[2]))
    if (r) return r
  }

  // Query parameters holding a "lat,lng" pair
  try {
    const url = new URL(decoded)
    for (const key of ['q', 'query', 'll', 'destination', 'center', 'daddr']) {
      const value = url.searchParams.get(key)
      const r = value ? pair(value) : null
      if (r) return r
    }
    // /maps/place/5.6037,-0.1870 or /maps/search/5.6037,+-0.1870
    const seg = url.pathname.match(new RegExp(`/(?:place|search|dir)/${NUM},\\s*\\+?${NUM}`))
    if (seg) {
      const r = valid(parseFloat(seg[1]), parseFloat(seg[2]))
      if (r) return r
    }
  } catch {
    // not a URL
  }

  // Map viewport centre: "@<lat>,<lng>,<zoom>z"
  const at = decoded.match(new RegExp(`@${NUM},${NUM}`))
  if (at) return valid(parseFloat(at[1]), parseFloat(at[2]))

  return null
}

const SHORT_LINK_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl'])

export function isGoogleMapsShortLink(input: string): boolean {
  try {
    const url = new URL(input.trim())
    return url.protocol === 'https:' && SHORT_LINK_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}
