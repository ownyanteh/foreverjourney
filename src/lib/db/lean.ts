/**
 * Typed lean() helpers.
 * Mongoose's lean() has complex union types that cause TypeScript false positives.
 * These helpers cast the result to the expected type safely.
 */

import type { Model, Document } from 'mongoose'

export async function leanOne<T extends Document>(
  query: ReturnType<Model<T>['findOne']> | ReturnType<Model<T>['findById']>
): Promise<T | null> {
  return (await query.lean()) as unknown as T | null
}

export async function leanMany<T extends Document>(
  query: ReturnType<Model<T>['find']>
): Promise<T[]> {
  return (await query.lean()) as unknown as T[]
}
