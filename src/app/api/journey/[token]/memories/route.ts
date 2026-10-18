import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/connect'
import { Journey } from '@/lib/db/models/Journey'
import { JourneySession } from '@/lib/db/models/JourneySession'
import { JourneyEvent } from '@/lib/db/models/JourneyEvent'
import { Memory } from '@/lib/db/models/Memory'
import { hashToken } from '@/lib/tokens'
import { getRecipientSessionFromReq } from '@/lib/auth/session'
import { checkMemoryRateLimit } from '@/lib/rate-limit'
import { uploadImage } from '@/lib/cloudinary'
import { MAX_PHOTOS_PER_JOURNEY, MAX_MESSAGES_PER_JOURNEY } from '@/lib/limits'
import { photoExpiryFrom, photoExpiryOf, isPhotoExpired } from '@/lib/memories'
import { env } from '@/lib/env'

type Params = { params: Promise<{ token: string }> }

type ObjectIdLike = { toString(): string }
type LeanJourney = { _id: ObjectIdLike }
type LeanSession = { _id: ObjectIdLike; finalDestinationUnlockedAt: Date | null }
type LeanMemory = {
  _id: ObjectIdLike
  imageUrl: string | null
  imageExpiresAt?: Date | null
  width: number | null
  height: number | null
  message: string
  createdAt: Date
}

// Vercel rejects request bodies over 4.5 MB; the client downsizes photos well below this
const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_MESSAGE_LENGTH = 1000

/** Identify JPEG / PNG / WebP by magic bytes rather than trusting the declared type */
function isAllowedImage(bytes: Uint8Array): boolean {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  return jpeg || png || webp
}

/** Resolve the recipient's session; only allowed once the final destination is reached */
async function resolveSession(req: NextRequest, token: string) {
  const res = NextResponse.json({})
  const recipientSession = await getRecipientSessionFromReq(req, res)
  if (!recipientSession.sessionId) return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) }

  await connectDB()
  const journey = (await Journey.findOne({ invitationTokenHash: hashToken(token) }).lean()) as LeanJourney | null
  if (!journey) return { error: NextResponse.json({ error: 'Journey not found.' }, { status: 404 }) }

  const session = (await JourneySession.findOne({
    _id: recipientSession.sessionId,
    journeyId: journey._id,
  }).lean()) as LeanSession | null
  if (!session) return { error: NextResponse.json({ error: 'Session not found.' }, { status: 404 }) }

  if (!session.finalDestinationUnlockedAt) {
    return { error: NextResponse.json({ error: 'Final destination not yet reached.' }, { status: 422 }) }
  }

  return { journey, session }
}

function toClient(m: LeanMemory) {
  // Hide photos past their expiry even if the daily cleanup hasn't run yet
  const expired = isPhotoExpired(m)
  return {
    _id: m._id.toString(),
    imageUrl: expired ? null : m.imageUrl,
    imageExpiresAt: m.imageUrl && !expired ? photoExpiryOf(m) : null,
    width: m.width,
    height: m.height,
    message: m.message,
    createdAt: m.createdAt,
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const resolved = await resolveSession(req, token)
    if ('error' in resolved) return resolved.error

    const memories = (await Memory.find({ sessionId: resolved.session._id }).sort({ createdAt: -1 }).lean()) as LeanMemory[]
    const photosShared = await Memory.countDocuments({ journeyId: resolved.journey._id, imagePublicId: { $ne: null } })
    return NextResponse.json({
      memories: memories.map(toClient).filter((m) => m.imageUrl || m.message),
      photoLimit: MAX_PHOTOS_PER_JOURNEY,
      photosRemaining: Math.max(0, MAX_PHOTOS_PER_JOURNEY - photosShared),
      retentionDays: env.MEMORY_RETENTION_DAYS,
    })
  } catch (err) {
    console.error('[GET memories]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params
    const resolved = await resolveSession(req, token)
    if ('error' in resolved) return resolved.error
    const { journey, session } = resolved

    const rateCheck = await checkMemoryRateLimit(session._id.toString())
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 })
    }

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 })
    }

    const message = String(form.get('message') ?? '').trim()
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 })
    }

    const photo = form.get('photo')
    const file = photo instanceof File && photo.size > 0 ? photo : null
    if (!file && !message) {
      return NextResponse.json({ error: 'Add a photo or a message.' }, { status: 400 })
    }

    if (file) {
      const photosShared = await Memory.countDocuments({ journeyId: journey._id, imagePublicId: { $ne: null } })
      if (photosShared >= MAX_PHOTOS_PER_JOURNEY) {
        return NextResponse.json({ error: `You can share up to ${MAX_PHOTOS_PER_JOURNEY} photos.` }, { status: 422 })
      }
    } else {
      const messagesShared = await Memory.countDocuments({ journeyId: journey._id, imagePublicId: null })
      if (messagesShared >= MAX_MESSAGES_PER_JOURNEY) {
        return NextResponse.json({ error: `You can share up to ${MAX_MESSAGES_PER_JOURNEY} messages.` }, { status: 422 })
      }
    }

    let image: { url: string; publicId: string; width: number; height: number } | null = null
    if (file) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'That photo is too large.' }, { status: 413 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!isAllowedImage(buffer.subarray(0, 12))) {
        return NextResponse.json({ error: 'Please upload a JPEG, PNG or WebP photo.' }, { status: 415 })
      }
      const uploaded = await uploadImage(buffer, `our-forever-journey/memories/${journey._id.toString()}`)
      image = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: uploaded.width,
        height: uploaded.height,
      }
    }

    const memory = await Memory.create({
      journeyId: journey._id,
      sessionId: session._id,
      imageUrl: image?.url ?? null,
      imagePublicId: image?.publicId ?? null,
      imageExpiresAt: image ? photoExpiryFrom() : null,
      width: image?.width ?? null,
      height: image?.height ?? null,
      message,
    })

    await JourneyEvent.create({
      journeyId: journey._id,
      sessionId: session._id,
      eventType: 'memory_shared',
      metadata: { hasPhoto: Boolean(image), hasMessage: Boolean(message) },
    })

    const photosNow = await Memory.countDocuments({ journeyId: journey._id, imagePublicId: { $ne: null } })
    return NextResponse.json(
      { memory: toClient(memory), photosRemaining: Math.max(0, MAX_PHOTOS_PER_JOURNEY - photosNow) },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST memories]', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
