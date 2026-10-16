'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RouteSegment } from '@/types'
import { MAP_STYLE_URL } from '@/lib/map/style'

interface Props {
  userLat: number | null
  userLon: number | null
  targetLat: number | null
  targetLon: number | null
  route: RouteSegment | null
  onMapLoad?: () => void
}

export default function NavigationMap({
  userLat,
  userLon,
  targetLat,
  targetLon,
  route,
  onMapLoad,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const targetMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      zoom: 14,
      center: userLon && userLat ? [userLon, userLat] : [0, 0],
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      setMapReady(true)
      onMapLoad?.()

      // Route layer placeholder
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#7A2038',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update user position marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || userLat === null || userLon === null) return

    if (!userMarkerRef.current) {
      // Custom user marker
      const el = document.createElement('div')
      el.className = 'user-marker'
      el.innerHTML = `
        <div style="
          width: 20px; height: 20px; border-radius: 50%;
          background: #7A2038; border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute; inset: -6px; border-radius: 50%;
            background: rgba(122,32,56,0.2);
            animation: pulse 2s infinite;
          "></div>
        </div>
      `
      const style = document.createElement('style')
      style.textContent = `@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.5);opacity:0.1} }`
      document.head.appendChild(style)
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([userLon, userLat])
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat([userLon, userLat])
    }
  }, [userLat, userLon, mapReady])

  // Update target marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || targetLat === null || targetLon === null) return

    if (!targetMarkerRef.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #D8B46A, #c49a40);
          border: 3px solid white; box-shadow: 0 3px 12px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        ">📍</div>
      `
      targetMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([targetLon, targetLat])
        .addTo(map)
    } else {
      targetMarkerRef.current.setLngLat([targetLon, targetLat])
    }
  }, [targetLat, targetLon, mapReady])

  // Draw route
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !route) return

    const source = map.getSource('route') as maplibregl.GeoJSONSource | undefined
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: route.geometry,
      })
    }

    // Fit map to route bounds
    const coords = route.geometry.coordinates as [number, number][]
    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      )
      map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1000 })
    }
  }, [route, mapReady])

  const recenter = useCallback(() => {
    if (!mapRef.current || userLat === null || userLon === null) return
    mapRef.current.flyTo({ center: [userLon, userLat], zoom: 15, duration: 1000 })
  }, [userLat, userLon])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" aria-label="Navigation map" />

      {/* Recenter button */}
      <button
        onClick={recenter}
        className="absolute bottom-16 right-3 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center border border-blush-200 hover:bg-cream transition-colors"
        aria-label="Re-center map to my location"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-burgundy" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </div>
  )
}
