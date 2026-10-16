'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ImagePlus, Send, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Memory {
  _id: string
  imageUrl: string | null
  width: number | null
  height: number | null
  message: string
  createdAt: string
}

interface Pending {
  file: File
  previewUrl: string
}

const MAX_DIMENSION = 2048
const MAX_MESSAGE_LENGTH = 1000

/**
 * Downscale a photo to JPEG in the browser. Keeps uploads small enough for
 * serverless limits and drops EXIF metadata (including GPS) from the file.
 */
async function prepareImage(file: File): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unreadable image')) }
      img.src = url
    })
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  canvas.getContext('2d')!.drawImage(source, 0, 0, canvas.width, canvas.height)
  if ('close' in source) source.close()

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.85)
  )
}

export default function MemoryCapture({ token }: { token: string }) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [justShared, setJustShared] = useState(false)
  const selfieRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/journey/${token}/memories`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.memories && setMemories(json.memories))
      .catch(() => {})
  }, [token])

  // Release preview object URLs that are no longer shown, and all of them on unmount
  const shownUrls = useRef<string[]>([])
  useEffect(() => {
    const current = pending.map((p) => p.previewUrl)
    shownUrls.current.filter((u) => !current.includes(u)).forEach((u) => URL.revokeObjectURL(u))
    shownUrls.current = current
  }, [pending])
  useEffect(() => () => shownUrls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  function addFiles(list: FileList | null) {
    if (!list) return
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || f.type === '')
    setPending((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ].slice(0, 10))
    setError('')
    setJustShared(false)
  }

  function removePending(index: number) {
    setPending((prev) => prev.filter((_, i) => i !== index))
  }

  async function share() {
    if (uploading) return
    if (pending.length === 0 && !message.trim()) {
      setError('Take a photo or write a message first.')
      return
    }
    setUploading(true)
    setError('')

    const items: (Pending | null)[] = pending.length > 0 ? pending : [null]
    const shared: Memory[] = []
    try {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        setProgress(items.length > 1 ? `Sharing ${i + 1} of ${items.length}…` : 'Sharing…')
        const form = new FormData()
        // The message goes with the first photo only
        if (i === 0 && message.trim()) form.append('message', message.trim())
        if (item) form.append('photo', await prepareImage(item.file), 'memory.jpg')

        const res = await fetch(`/api/journey/${token}/memories`, { method: 'POST', body: form })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Upload failed. Please try again.')
        shared.push(json.memory)
      }
      setMemories((prev) => [...shared.reverse(), ...prev])
      setPending([])
      setMessage('')
      setJustShared(true)
    } catch (err) {
      // Keep whatever succeeded, leave the rest pending for a retry
      setMemories((prev) => [...shared.reverse(), ...prev])
      setPending((prev) => prev.slice(shared.length))
      if (shared.length > 0) setMessage('')
      setError((err as Error).message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <div className="w-full text-left">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-5 space-y-4">
        <div className="text-center">
          <h2 className="font-serif text-xl font-semibold text-white">Capture this moment</h2>
          <p className="text-white/70 text-sm mt-1">Take a selfie, snap some photos, or leave a message.</p>
        </div>

        {/* Hidden pickers: front camera for selfies, camera or library for photos */}
        <input
          ref={selfieRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
        <input
          ref={photosRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => selfieRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-white text-burgundy font-semibold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            <Camera className="h-7 w-7" />
            Take a selfie
          </button>
          <button
            type="button"
            onClick={() => photosRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-white/15 border border-white/30 text-white font-semibold active:scale-95 transition-transform disabled:opacity-60"
          >
            <ImagePlus className="h-7 w-7" />
            Add photos
          </button>
        </div>

        {/* Pending previews */}
        {pending.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pending.map((p, i) => (
              <div key={p.previewUrl} className="relative aspect-square rounded-xl overflow-hidden bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={`Photo ${i + 1} ready to share`} className="w-full h-full object-cover" />
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="memory-message" className="sr-only">Your message</label>
          <textarea
            id="memory-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            rows={3}
            disabled={uploading}
            placeholder="Write something to remember this moment… (optional)"
            className="w-full rounded-2xl bg-white/90 text-charcoal placeholder:text-charcoal/40 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-white/60 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-white bg-red-900/40 rounded-xl px-3 py-2" role="alert">{error}</p>
        )}

        <Button
          onClick={share}
          loading={uploading}
          disabled={pending.length === 0 && !message.trim()}
          size="lg"
          className="w-full bg-white text-burgundy hover:bg-cream font-semibold rounded-2xl border-0"
        >
          {!uploading && <Send className="h-4 w-4" />}
          {uploading ? progress : pending.length > 1 ? `Share ${pending.length} photos` : 'Share'}
        </Button>

        <AnimatePresence>
          {justShared && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-1.5 text-sm text-white/90"
              role="status"
            >
              <Check className="h-4 w-4" /> Shared. Add as many as you like.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Shared memories */}
      {memories.length > 0 && (
        <div className="mt-6">
          <p className="text-white/70 text-xs font-medium tracking-widest uppercase text-center mb-3">
            Your memories ({memories.length})
          </p>
          <div className="grid grid-cols-2 gap-3">
            {memories.map((m) => (
              <div key={m._id} className="rounded-2xl overflow-hidden bg-white/10 border border-white/15">
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageUrl.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto,f_auto/')}
                    alt={m.message || 'A shared memory'}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                )}
                {m.message && (
                  <p className="text-sm text-white/90 font-serif italic px-3 py-2 line-clamp-4">{m.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
