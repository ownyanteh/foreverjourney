/** Platform limits, kept in one place so they're easy to change later. */

/** Journeys an account can create unless its own `journeyLimit` says otherwise */
export const DEFAULT_JOURNEY_LIMIT = 2

/** Photos the recipient can share per journey after saying yes */
export const MAX_PHOTOS_PER_JOURNEY = 2

/** Text-only messages the recipient can share per journey */
export const MAX_MESSAGES_PER_JOURNEY = 10

export function journeyLimitFor(user: { journeyLimit?: number | null } | null | undefined): number {
  const limit = user?.journeyLimit
  return typeof limit === 'number' && limit >= 0 ? limit : DEFAULT_JOURNEY_LIMIT
}
