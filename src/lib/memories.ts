import { Memory } from '@/lib/db/models/Memory'
import { deleteImages } from '@/lib/cloudinary'

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
