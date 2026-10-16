import { z } from 'zod'

// ── Common field validators ────────────────────────────────────────────────────

export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90')

export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180')

export const coordinatesSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
})

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Must be a valid hex color (e.g. #7A2038)')

// ── Auth schemas ───────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254).toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

// ── Journey schemas ────────────────────────────────────────────────────────────

export const welcomeContentSchema = z.object({
  greeting: z.string().max(200).default('Hey, my love.'),
  introduction: z.string().max(2000).default("I've planned a little adventure for you."),
  backgroundImageUrl: z.string().url().nullable().optional(),
  musicUrl: z.string().url().nullable().optional(),
})

export const themeSchema = z.object({
  primaryColor: hexColorSchema.default('#7A2038'),
  accentColor: hexColorSchema.default('#D8B46A'),
  backgroundColor: hexColorSchema.default('#FFF8F0'),
})

export const proposalContentSchema = z.object({
  title: z.string().max(200).default('You made it, my love.'),
  mainMessage: z.string().max(2000).default(''),
  finalQuestion: z.string().max(200).default('Will you marry me?'),
  yesLabel: z.string().max(50).default('YES! ❤️'),
  noLabel: z.string().max(50).default('No'),
  yesMessage: z.string().max(2000).default(''),
  noMessage: z.string().max(2000).default(''),
  backgroundImageUrl: z.string().url().nullable().optional(),
  couplePhotoUrl: z.string().url().nullable().optional(),
  musicUrl: z.string().url().nullable().optional(),
})

export const finalDestinationSchema = z.object({
  name: z.string().max(120).default('The Final Destination'),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  geofenceRadius: z.number().min(10).max(500).default(50),
  approachingRadius: z.number().min(50).max(2000).default(200),
  approachingMessage: z.string().max(500).default("You're almost there..."),
  finalClue: z.string().max(1000).nullable().optional(),
  manualFallbackEnabled: z.boolean().default(false),
})

export const createJourneySchema = z.object({
  title: z.string().min(1, 'Title is required').max(120).trim(),
  welcomeContent: welcomeContentSchema.optional(),
  theme: themeSchema.optional(),
})

export const updateJourneySchema = z.object({
  title: z.string().min(1).max(120).trim().optional(),
  welcomeContent: welcomeContentSchema.optional(),
  theme: themeSchema.optional(),
  proposalContent: proposalContentSchema.optional(),
  finalDestination: finalDestinationSchema.optional(),
})

// ── Checkpoint schemas ─────────────────────────────────────────────────────────

export const checkpointContentSchema = z.object({
  instructionText: z.string().max(1000).default(''),
  romanticMessage: z.string().max(2000).default(''),
  imageUrl: z.string().url().nullable().optional(),
  audioUrl: z.string().url().nullable().optional(),
  clue: z.string().max(1000).nullable().optional(),
  unlockAnimation: z.string().max(50).nullable().optional(),
})

export const createCheckpointSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120).trim(),
  coordinates: coordinatesSchema,
  geofenceRadius: z.number().min(10).max(500).default(50),
  required: z.boolean().default(true),
  skippable: z.boolean().default(false),
  content: checkpointContentSchema.optional(),
  isActive: z.boolean().default(true),
})

export const updateCheckpointSchema = createCheckpointSchema.partial()

export const reorderCheckpointsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
})

// ── Recipient API schemas ──────────────────────────────────────────────────────

export const completeCheckpointSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accuracy: z.number().min(0).max(10000).optional(),
})

export const verifyFinalDestinationSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  accuracy: z.number().min(0).max(10000).optional(),
})

export const proposalResponseSchema = z.object({
  response: z.enum(['yes', 'no']),
})
