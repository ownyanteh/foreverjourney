'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Plus, GripVertical, Trash2, Edit2, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import Link from 'next/link'
import GoogleMapsPasteInput from '@/components/admin/GoogleMapsPasteInput'
import { cn } from '@/lib/utils'
import {
  adminCard,
  adminInput,
  adminTextarea,
  adminLabel,
  adminBtnPrimary,
  adminBtnOutline,
  adminBackBtn,
  adminPageTitle,
  adminPageSubtitle,
  adminAlertError,
} from '@/components/admin/adminStyles'

const CheckpointMapEditor = dynamic(
  () => import('@/components/admin/CheckpointMapEditor'),
  { ssr: false, loading: () => <div className="h-full w-full bg-blush-100 animate-pulse" /> }
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

  const hintCls = 'text-charcoal/45 font-normal'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon-sm" className={adminBackBtn}>
            <Link href={`/admin/journeys/${journeyId}`} aria-label="Back to journey"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className={adminPageTitle}>Checkpoints</h1>
            <p className={adminPageSubtitle}>{checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" className={adminBtnPrimary}>
          <Plus className="h-4 w-4" strokeWidth={2.2} /> Add Checkpoint
        </Button>
      </div>

      {/* Map preview */}
      <div className="relative h-[260px] sm:h-[300px] rounded-[20px] overflow-hidden border border-blush-200 bg-[#F3ECE4]">
        <CheckpointMapEditor
          checkpoints={checkpoints}
          onMapClick={mapCenter ? undefined : handleMapClick}
          center={mapCenter}
        />
      </div>

      {/* Checkpoint list */}
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2].map((i) => <div key={i} className="h-[66px] bg-blush-100 animate-pulse rounded-[18px]" />)}
        </div>
      ) : checkpoints.length === 0 ? (
        <Card className={adminCard}>
          <CardContent className="py-12 px-6 text-center">
            <MapPin className="h-10 w-10 text-blush-300 mx-auto mb-4" />
            <p className="text-sm text-charcoal/60 mb-5 max-w-md mx-auto">No checkpoints yet. They&apos;re optional: with none, the journey goes straight to the final destination.</p>
            <Button onClick={openAdd} size="sm" className={adminBtnPrimary}><Plus className="h-4 w-4" strokeWidth={2.2} /> Add Checkpoint</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {checkpoints.map((cp, i) => (
            <Card key={cp._id} className={cn(adminCard, 'group')}>
              <CardContent className="px-4 py-3.5 flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-blush-300 flex-shrink-0 cursor-grab" />
                <div className="w-[30px] h-[30px] rounded-full bg-burgundy flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-charcoal truncate">{cp.title}</p>
                  <p className="text-[13px] text-charcoal/55 mt-0.5 truncate">
                    {cp.coordinates.latitude.toFixed(5)}, {cp.coordinates.longitude.toFixed(5)} · {cp.geofenceRadius}m radius
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    onClick={() => { setMapCenter({ lat: cp.coordinates.latitude, lng: cp.coordinates.longitude }); openEdit(cp) }}
                    variant="ghost" size="icon-sm"
                    className="h-9 w-9 rounded-[10px] text-charcoal/60 hover:bg-blush-100 hover:text-charcoal"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button onClick={() => handleDelete(cp._id)} variant="ghost" size="icon-sm" className="h-9 w-9 rounded-[10px] text-red-400 hover:bg-red-50 hover:text-red-500">
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
        <DialogContent className="w-[calc(100%-32px)] max-w-[560px] max-h-[90dvh] overflow-y-auto bg-white rounded-[24px] border-blush-200 shadow-[0_30px_70px_rgba(36,33,38,0.18)] p-6 sm:p-7 text-charcoal">
          <DialogHeader className="text-left mb-0 gap-1 pr-8">
            <DialogTitle className="font-serif text-2xl font-semibold text-charcoal">{editingId ? 'Edit Checkpoint' : 'Add Checkpoint'}</DialogTitle>
            <DialogDescription className="text-sm text-charcoal/60">Configure this stop on the journey.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-[18px] mt-[18px]">
            {error && <div className={adminAlertError} role="alert">{error}</div>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-title" className={adminLabel}>Name *</Label>
              <Input id="cp-title" className={adminInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="The Coffee Shop Where We Met" />
            </div>

            <GoogleMapsPasteInput onCoordinates={handleMapClick} />

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cp-lat" className={adminLabel}>Latitude *</Label>
                  <Input id="cp-lat" className={adminInput} value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="40.712776" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cp-lng" className={adminLabel}>Longitude *</Label>
                  <Input id="cp-lng" className={adminInput} value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="-74.005974" />
                </div>
              </div>

              <p className="text-xs text-charcoal/50">Or click the map above, or type them in.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-radius" className={adminLabel}>Geofence radius (metres)</Label>
              <Input id="cp-radius" className={adminInput} value={form.geofenceRadius} onChange={(e) => setForm((f) => ({ ...f, geofenceRadius: e.target.value }))} type="number" min={10} max={500} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-instruction" className={adminLabel}>Instruction text <span className={hintCls}>(shown during navigation)</span></Label>
              <Input id="cp-instruction" className={adminInput} value={form.instructionText} onChange={(e) => setForm((f) => ({ ...f, instructionText: e.target.value }))} placeholder="Head to the corner table by the window…" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-message" className={adminLabel}>Romantic message <span className={hintCls}>(revealed on arrival)</span></Label>
              <Textarea id="cp-message" className={adminTextarea} rows={3} value={form.romanticMessage} onChange={(e) => setForm((f) => ({ ...f, romanticMessage: e.target.value }))} placeholder="This is where I first knew you were special…" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cp-clue" className={adminLabel}>Clue to next stop <span className={hintCls}>(optional)</span></Label>
              <Input id="cp-clue" className={adminInput} value={form.clue} onChange={(e) => setForm((f) => ({ ...f, clue: e.target.value }))} placeholder="Now head somewhere with a beautiful view…" />
            </div>

            <div className="flex gap-3 pt-1">
              <Button onClick={handleSave} loading={saving} className={cn(adminBtnPrimary, 'flex-1 h-[46px] text-[15px]')}>
                {editingId ? 'Save Changes' : 'Add Checkpoint'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className={cn(adminBtnOutline, 'h-[46px] px-5 text-[15px]')}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
