'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Camera, Download, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { adminCard, adminCardHeader, adminCardTitle, adminBtnOutlineSm } from '@/components/admin/adminStyles'

export interface GalleryMemory {
  _id: string
  imageUrl: string | null
  imageExpiresAt: string | null
  message: string
  createdAt: string
}

const rowTime = 'text-xs text-charcoal/45 flex-shrink-0'
const quote = 'font-serif italic text-charcoal/80 leading-[1.55] whitespace-pre-wrap'

/** Memories shared at the final destination, with delete (one or all) for the admin. */
export default function MemoriesGallery({
  journeyId,
  memories,
  retentionDays,
}: {
  journeyId: string
  memories: GalleryMemory[]
  retentionDays: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function remove(url: string, key: string) {
    setBusy(key)
    setError('')
    try {
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || 'Could not delete. Please try again.')
        return
      }
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  if (memories.length === 0) return null

  return (
    <Card className={adminCard}>
      <CardHeader className={cn(adminCardHeader, 'flex-row flex-wrap items-center justify-between gap-3 space-y-0')}>
        <CardTitle className={cn(adminCardTitle, 'flex items-center gap-2')}>
          <Camera className="h-[18px] w-[18px] text-burgundy" />
          Memories ({memories.length})
        </CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={busy !== null}
              className={cn(adminBtnOutlineSm, 'gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700')}
            >
              <Trash2 className="h-[13px] w-[13px]" />
              Delete all
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all memories?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes all {memories.length} shared photos and messages for this journey,
                including the photo files. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => remove(`/api/admin/journeys/${journeyId}/memories`, 'all')}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="px-6 py-5 flex flex-col gap-3">
        {memories.some((m) => m.imageUrl) && (
          <p className="text-[13px] text-charcoal/60 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
            Photos are deleted {retentionDays} days after they&apos;re shared. Download any you want to keep.
          </p>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5" role="alert">{error}</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-3.5">
          {memories.map((m) => (
            <figure
              key={m._id}
              className={cn(
                'relative rounded-[14px] overflow-hidden border border-blush-200 flex flex-col transition-opacity',
                m.imageUrl ? 'bg-cream' : 'bg-white justify-between',
                busy === m._id && 'opacity-50'
              )}
            >
              {m.imageUrl && (
                <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageUrl.replace('/upload/', '/upload/c_fill,w_500,h_500,q_auto,f_auto/')}
                    alt={m.message || 'Shared memory'}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center bg-black/55 text-white rounded-full transition-colors group-hover:bg-black/70">
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only">Open full size</span>
                  </span>
                </a>
              )}
              <figcaption className={cn('flex items-end gap-2', m.imageUrl ? 'px-3 py-2.5' : 'p-4')}>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {m.message && (
                    <p className={cn(quote, m.imageUrl ? 'text-sm' : 'text-[15px]')}>{m.message}</p>
                  )}
                  <p className={rowTime}>{format(new Date(m.createdAt), 'PPP p')}</p>
                  {m.imageUrl && m.imageExpiresAt && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a
                        href={m.imageUrl.replace('/upload/', '/upload/fl_attachment/')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-burgundy hover:text-burgundy-600"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                      <span className="text-xs text-amber-700">Expires {format(new Date(m.imageExpiresAt), 'MMM d')}</span>
                    </div>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={busy !== null}
                      aria-label={m.imageUrl ? 'Delete this photo' : 'Delete this message'}
                      className="flex-shrink-0 w-9 h-9 -mr-1.5 -mb-1.5 rounded-[10px] flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{m.imageUrl ? 'Delete this photo?' : 'Delete this message?'}</AlertDialogTitle>
                      <AlertDialogDescription>
                        It will be permanently removed{m.imageUrl ? ', including the photo file' : ''}. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(`/api/admin/journeys/${journeyId}/memories/${m._id}`, m._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </figcaption>
            </figure>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
