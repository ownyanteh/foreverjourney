'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_STYLE_URL } from '@/lib/map/style'

interface CheckpointSummary {
  _id: string
  title: string
  sequence: number
  coordinates: { latitude: number; longitude: number }
  geofenceRadius: number
}

interface Props {
  checkpoints: CheckpointSummary[]
  onMapClick?: (lat: number, lng: number) => void
  center?: { lat: number; lng: number } | null
  finalDestination?: { latitude: number; longitude: number } | null
}

export default function CheckpointMapEditor({
  checkpoints,
  onMapClick,
  center,
  finalDestination,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      zoom: 12,
      center: [0, 0],
    })

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.lngLat.lat, e.lngLat.lng)
      })
      map.getCanvas().style.cursor = 'crosshair'
    }

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when checkpoints change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new maplibregl.LngLatBounds()
    let hasBounds = false

    checkpoints.forEach((cp, i) => {
      const el = document.createElement('div')
      el.style.cssText = `
        width:28px;height:28px;border-radius:50%;
        background:#7A2038;border:2px solid white;
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:11px;font-weight:bold;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;
      `
      el.textContent = String(i + 1)

      const popup = new maplibregl.Popup({ offset: 25 }).setText(cp.title)
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([cp.coordinates.longitude, cp.coordinates.latitude])
        .setPopup(popup)
        .addTo(map)
      markersRef.current.push(marker)
      bounds.extend([cp.coordinates.longitude, cp.coordinates.latitude])
      hasBounds = true
    })

    if (finalDestination) {
      const el = document.createElement('div')
      el.style.cssText = `
        width:32px;height:32px;border-radius:50%;
        background:linear-gradient(135deg,#D8B46A,#c49a40);border:2px solid white;
        display:flex;align-items:center;justify-content:center;font-size:16px;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      `
      el.textContent = '★'
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([finalDestination.longitude, finalDestination.latitude])
        .addTo(map)
      markersRef.current.push(marker)
      bounds.extend([finalDestination.longitude, finalDestination.latitude])
      hasBounds = true
    }

    if (hasBounds) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 })
    }
  }, [checkpoints, finalDestination])

  // Center map on selected checkpoint
  useEffect(() => {
    if (!mapRef.current || !center) return
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: 15, duration: 800 })
  }, [center])

  return <div ref={containerRef} className="w-full h-full" aria-label="Checkpoint map" />
}
