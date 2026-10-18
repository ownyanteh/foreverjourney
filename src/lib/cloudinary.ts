import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { env } from '@/lib/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
})

export function uploadImage(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Cap stored size; strips location/EXIF metadata from the stored copy
        transformation: [{ width: 2400, height: 2400, crop: 'limit', quality: 'auto' }],
      },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload failed'))
        else resolve(result)
      }
    )
    stream.end(buffer)
  })
}

export async function deleteImages(publicIds: string[]): Promise<void> {
  // Cloudinary accepts at most 100 public IDs per call
  for (let i = 0; i < publicIds.length; i += 100) {
    await cloudinary.api.delete_resources(publicIds.slice(i, i + 100), { resource_type: 'image' })
  }
}
