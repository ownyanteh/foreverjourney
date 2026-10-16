import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token (URL-safe base64).
 * Default 32 bytes = 256 bits of entropy.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/**
 * Hash a token with SHA-256 for safe storage.
 * The plaintext token is returned to the caller once; only the hash is persisted.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Timing-safe comparison of two hashed values.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}
