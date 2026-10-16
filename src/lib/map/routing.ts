/**
 * Routing service abstraction (OpenRouteService).
 * Use this module for all directions calls (server-side — uses the secret API key).
 * Client-side map rendering uses maplibre-gl directly.
 */

import type { RouteSegment } from '@/types'

const ORS_API_BASE = 'https://api.openrouteservice.org'

const ORS_PROFILES = {
  driving: 'driving-car',
  walking: 'foot-walking',
} as const

// ORS instruction type codes → Mapbox-style maneuver type/modifier
// https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/instruction-types
const ORS_MANEUVERS: Record<number, { type: string; modifier?: string }> = {
  0: { type: 'turn', modifier: 'left' },
  1: { type: 'turn', modifier: 'right' },
  2: { type: 'turn', modifier: 'sharp left' },
  3: { type: 'turn', modifier: 'sharp right' },
  4: { type: 'turn', modifier: 'slight left' },
  5: { type: 'turn', modifier: 'slight right' },
  6: { type: 'continue', modifier: 'straight' },
  7: { type: 'roundabout' },
  8: { type: 'exit roundabout' },
  9: { type: 'turn', modifier: 'uturn' },
  10: { type: 'arrive' },
  11: { type: 'depart' },
  12: { type: 'fork', modifier: 'left' },
  13: { type: 'fork', modifier: 'right' },
}

interface DirectionsResponse {
  features: Array<{
    geometry: GeoJSON.LineString
    properties: {
      summary: { distance?: number; duration?: number }
      segments: Array<{
        steps: Array<{
          instruction: string
          type: number
          distance: number
          duration: number
        }>
      }>
    }
  }>
}

/**
 * Fetch a driving/walking route between two points using the OpenRouteService Directions API.
 * Call this server-side only (uses the secret API key).
 */
export async function getRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  profile: 'driving' | 'walking' = 'driving',
  apiKey: string
): Promise<RouteSegment | null> {
  const url = new URL(`/v2/directions/${ORS_PROFILES[profile]}/geojson`, ORS_API_BASE)

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/geo+json',
      },
      body: JSON.stringify({
        coordinates: [
          [fromLon, fromLat],
          [toLon, toLat],
        ],
        instructions: true,
      }),
      next: { revalidate: 300 }, // Cache route for 5 minutes
    })

    if (!res.ok) {
      console.error('[routing] Directions API error:', res.status)
      return null
    }

    const data: DirectionsResponse = await res.json()
    const route = data.features?.[0]
    if (!route) return null

    return {
      geometry: route.geometry,
      // ORS omits distance/duration when they are zero (start === end)
      distance: route.properties.summary.distance ?? 0,
      duration: route.properties.summary.duration ?? 0,
      steps:
        route.properties.segments[0]?.steps.map((s) => ({
          instruction: s.instruction,
          distance: s.distance,
          duration: s.duration,
          maneuver: ORS_MANEUVERS[s.type],
        })) ?? [],
    }
  } catch (err) {
    console.error('[routing] Failed to fetch route:', err)
    return null
  }
}
