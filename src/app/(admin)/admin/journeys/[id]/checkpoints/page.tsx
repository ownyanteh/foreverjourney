'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Plus, GripVertical, Trash2, Edit2, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import Link from 'next/link'
import GoogleMapsPasteInput from '@/components/admin/GoogleMapsPasteInput'

const CheckpointMapEditor = dynamic(
  () => import('@/components/admin/CheckpointMapEditor'),
  { ssr: false, loading: () => <div className="h-64 bg-blush-100 animate-pulse rounded-2xl" /> }
)

interface Checkpoint {
  _id: string
  title: string
  sequence: number
  coordinates: { latitude: number; longitude: number }
  geofenceRadius: number
  required: boolean
  skippable: boolean
  content: {
    instructionText: string
    romanticMessage: string
    imageUrl?: string | null
    audioUrl?: string | null
    clue?: string | null
  }
}

interface CheckpointFormData {
  title: string
  latitude: string
  longitude: string
  geofenceRadius: string
  required: boolean
  skippable: boolean
  instructionText: string
  romanticMessage: string
  clue: string
}

const defaultForm: CheckpointFormData = {
  title: '',
  latitude: '',
  longitude: '',
  geofenceRadius: '50',
  required: true,
  skippable: false,
  instructionText: '',
  romanticMessage: '',
  clue: '',
}

export default function CheckpointsPage() {
  const params = useParams()
  const journeyId = params.id as string

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CheckpointFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)

  const loadCheckpoints = useCallback(async () => {
    const res = await fetch(`/api/admin/journeys/${journeyId}/checkpoints`)
    if (res.ok) {
      const json = await res.json()
      setCheckpoints(json.checkpoints)
    }
    setLoading(false)
  }, [journeyId])

  useEffect(() => { loadCheckpoints() }, [loadCheckpoints])

  function openAdd() {
    setForm(defaultForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(cp: Checkpoint) {
    setForm({
      title: cp.title,
      latitude: String(cp.coordinates.latitude),
      longitude: String(cp.coordinates.longitude),
      geofenceRadius: String(cp.geofenceRadius),
      required: cp.required,
      skippable: cp.skippable,
      instructionText: cp.content.instructionText ?? '',
      romanticMessage: cp.content.romanticMessage ?? '',
      clue: cp.content.clue ?? '',
    })
    setEditingId(cp._id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this checkpoint?')) return
    await fetch(`/api/admin/checkpoints/${id}`, { method: 'DELETE' })
    loadCheckpoints()
  }

  function handleMapClick(lat: number, lng: number) {
    setForm((f) => ({ ...f, latitude: String(lat.toFixed(7)), longitude: String(lng.toFixed(7)) }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        coordinates: { latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) },
        geofenceRadius: parseInt(form.geofenceRadius) || 50,
        required: form.required,
        skippable: form.skippable,
        content: {
          instructionText: form.instructionText,
          romanticMessage: form.romanticMessage,
          clue: form.clue || null,
        },
      }

      const url = editingId
        ? `/api/admin/checkpoints/${editingId}`
        : `/api/admin/journeys/${journeyId}/checkpoints`
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Failed to save.'); return }
      setShowForm(false)
      loadCheckpoints()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/admin/journeys/${journeyId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-charcoal">Checkpoints</h1>
          <p className="text-charcoal/60 text-sm mt-0.5">{checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4" /> Add Checkpoint
        </Button>
      </div>

      {/* Map preview */}
      <div className="h-64 rounded-2xl overflow-hidden border border-blush-200">
        <CheckpointMapEditor
          checkpoints={checkpoints}
          onMapClick={mapCenter ? undefined : handleMapClick}
          center={mapCenter}
        />
      </div>

      {/* Checkpoint list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-blush-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : checkpoints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 text-blush-300 mx-auto mb-4" />
            <p className="text-charcoal/60 mb-4">No checkpoints yet. Add your first stop!</p>
            <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4" /> Add Checkpoint</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkpoints.map((cp, i) => (
            <Card key={cp._id} className="group">
              <CardContent className="p-4 flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-blush-300 flex-shrink-0 cursor-grab" />
                <div className="w-7 h-7 rounded-full bg-burgundy/10 flex items-center justify-center text-xs font-bold text-burgundy flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal truncate">{cp.title}</p>
                  <p className="text-xs text-charcoal/50">
                    {cp.coordinates.latitude.toFixed(5)}, {cp.coordinates.longitude.toFixed(5)} · {cp.geofenceRadius}m radius
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => { setMapCenter({ lat: cp.coordinates.latitude, lng: cp.coordinates.longitude }); openEdit(cp) }}
                    variant="ghost" size="icon-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button onClick={() => handleDelete(cp._id)} variant="ghost" size="icon-sm" className="text-red-400 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false) }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Checkpoint' : 'Add Checkpoint'}</DialogTitle>
            <DialogDescription>Configure this stop on the journey.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2" role="alert">{error}</div>}

            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="The Coffee Shop Where We Met" />
            </div>

            <GoogleMapsPasteInput onCoordinates={handleMapClick} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Latitude *</Label>
                <Input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="40.712776" />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude *</Label>
                <Input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="-74.005974" />
              </div>
            </div>

            <p className="text-xs text-charcoal/50">Or click the map above, or type them in.</p>

            <div className="space-y-1.5">
              <Label>Geofence radius (metres)</Label>
              <Input value={form.geofenceRadius} onChange={(e) => setForm((f) => ({ ...f, geofenceRadius: e.target.value }))} type="number" min={10} max={500} />
            </div>

            <div className="space-y-1.5">
              <Label>Instruction text <span className="text-charcoal/40 font-normal">(shown during navigation)</span></Label>
              <Input value={form.instructionText} onChange={(e) => setForm((f) => ({ ...f, instructionText: e.target.value }))} placeholder="Head to the corner table by the window…" />
            </div>

            <div className="space-y-1.5">
              <Label>Romantic message <span className="text-charcoal/40 font-normal">(revealed on arrival)</span></Label>
              <Textarea rows={3} value={form.romanticMessage} onChange={(e) => setForm((f) => ({ ...f, romanticMessage: e.target.value }))} placeholder="This is where I first knew you were special…" />
            </div>

            <div className="space-y-1.5">
              <Label>Clue to next stop <span className="text-charcoal/40 font-normal">(optional)</span></Label>
              <Input value={form.clue} onChange={(e) => setForm((f) => ({ ...f, clue: e.target.value }))} placeholder="Now head somewhere with a beautiful view…" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} loading={saving} className="flex-1">
                {editingId ? 'Save Changes' : 'Add Checkpoint'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
