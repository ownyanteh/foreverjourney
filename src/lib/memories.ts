import { Memory } from '@/lib/db/models/Memory'
import { deleteImages } from '@/lib/cloudinary'
import { env } from '@/lib/env'

const DAY_MS = 24 * 60 * 60 * 1000

/** When a photo uploaded at `from` should be deleted */
export function photoExpiryFrom(from: Date = new Date()): Date {
  return new Date(from.getTime() + env.MEMORY_RETENTION_DAYS * DAY_MS)
}

/** Expiry for a stored memory; photos saved before expiry existed count from their upload date */
export function photoExpiryOf(m: { imageExpiresAt?: Date | string | null; createdAt: Date | string }): Date {
  return m.imageExpiresAt ? new Date(m.imageExpiresAt) : photoExpiryFrom(new Date(m.createdAt))
}

export function isPhotoExpired(m: { imageUrl?: string | null; imageExpiresAt?: Date | string | null; createdAt: Date | string }): boolean {
  return Boolean(m.imageUrl) && photoExpiryOf(m).getTime() <= Date.now()
}

/**
 * Permanently delete shared memories matching `filter`, including their photo
 * files in Cloudinary. Returns how many memories were deleted.
 * A Cloudinary failure is logged but does not block removing the records.
 */
export async function deleteMemories(filter: Record<string, unknown>): Promise<number> {
  const memories = (await Memory.find(filter).select('imagePublicId').lean()) as { imagePublicId: string | null }[]
  if (memories.length === 0) return 0

  const publicIds = memories.map((m) => m.imagePublicId).filter((p): p is string => Boolean(p))
  await deleteImages(publicIds).catch((err) => console.error('[deleteMemories] Cloudinary cleanup failed', err))

  const result = await Memory.deleteMany(filter)
  return result.deletedCount ?? 0
}

/**
 * Delete photo files whose retention period has passed. A memory that also has
 * a message keeps the message; a photo-only memory is removed entirely.
 * Returns how many photos were removed.
 */
export async function expireOldPhotos(): Promise<number> {
  const now = new Date()
  const legacyCutoff = new Date(now.getTime() - env.MEMORY_RETENTION_DAYS * DAY_MS)
  const expired = (await Memory.find({
    imagePublicId: { $ne: null },
    $or: [
      { imageExpiresAt: { $lte: now } },
      { imageExpiresAt: null, createdAt: { $lte: legacyCutoff } },
    ],
  })
    .select('_id imagePublicId message')
    .limit(500)
    .lean()) as { _id: unknown; imagePublicId: string; message?: string }[]

  if (expired.length === 0) return 0

  // Cloudinary must succeed before records are touched, so a failed run is retried next time
  await deleteImages(expired.map((m) => m.imagePublicId))

  const withMessage = expired.filter((m) => m.message?.trim()).map((m) => m._id)
  const photoOnly = expired.filter((m) => !m.message?.trim()).map((m) => m._id)
  await Promise.all([
    withMessage.length
      ? Memory.updateMany(
          { _id: { $in: withMessage } },
          { $set: { imageUrl: null, imagePublicId: null, imageExpiresAt: null, width: null, height: null } }
        )
      : null,
    photoOnly.length ? Memory.deleteMany({ _id: { $in: photoOnly } }) : null,
  ])
  return expired.length
}
