import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Return a safe API error message without leaking internals */
export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

/** Sleep for ms milliseconds */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
