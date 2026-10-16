import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import { NextRequest } from 'next/server'

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Login: 5 attempts per 15 minutes per IP */
const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15,
})

/** Invitation token resolution: 20 per minute per IP */
const invitationLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
  blockDuration: 60 * 5,
})

/** Checkpoint completion: 10 per minute per session */
const checkpointLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  blockDuration: 60,
})

/** Proposal response: 3 attempts per session */
const responseLimiter = new RateLimiterMemory({
  points: 3,
  duration: 60 * 60,
  blockDuration: 60 * 60,
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

async function checkLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<RateLimitResult> {
  try {
    await limiter.consume(key)
    return { allowed: true }
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(err.msBeforeNext / 1000),
      }
    }
    throw err
  }
}

export async function checkLoginRateLimit(req: NextRequest): Promise<RateLimitResult> {
  return checkLimit(loginLimiter, `login:${getClientIP(req)}`)
}

export async function checkInvitationRateLimit(req: NextRequest): Promise<RateLimitResult> {
  return checkLimit(invitationLimiter, `invite:${getClientIP(req)}`)
}

export async function checkCheckpointRateLimit(sessionId: string): Promise<RateLimitResult> {
  return checkLimit(checkpointLimiter, `checkpoint:${sessionId}`)
}

export async function checkResponseRateLimit(sessionId: string): Promise<RateLimitResult> {
  return checkLimit(responseLimiter, `response:${sessionId}`)
}
