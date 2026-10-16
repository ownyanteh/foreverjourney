/**
 * Validated environment variables.
 * Throws at startup if any required variable is missing.
 * Import this in server code; never expose server-only vars to the browser.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
        `Please add it to your .env.local file. See .env.example for reference.`
    )
  }
  return value.trim()
}

function optionalEnv(key: string, fallback = ''): string {
  return (process.env[key] || fallback).trim()
}

// ── Server-only variables ─────────────────────────────────────────────────────
export const env = {
  // MongoDB
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // Session encryption (32+ char random string)
  AUTH_SECRET: requireEnv('AUTH_SECRET'),

  // Application base URL (no trailing slash)
  APP_URL: requireEnv('APP_URL'),

  // OpenRouteService — server-side API key for Directions calls (keep secret)
  ORS_API_KEY: requireEnv('ORS_API_KEY'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),

  // Optional: Resend email
  RESEND_API_KEY: optionalEnv('RESEND_API_KEY'),
  ADMIN_NOTIFICATION_EMAIL: optionalEnv('ADMIN_NOTIFICATION_EMAIL'),

  // Node environment
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
} as const

// ── Browser-safe public variables ─────────────────────────────────────────────
// These are fine to embed in client bundles (NEXT_PUBLIC_ prefix).
export const publicEnv = {
  NEXT_PUBLIC_APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', ''),
} as const
