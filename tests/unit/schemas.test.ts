import {
  loginSchema,
  createJourneySchema,
  createCheckpointSchema,
  proposalResponseSchema,
  completeCheckpointSchema,
} from '../../src/lib/validation/schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'Admin@Example.com', password: 'securepassword' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('admin@example.com') // lowercased
  })

  it('rejects short passwords', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid emails', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'password123' })
    expect(result.success).toBe(false)
  })
})

describe('createJourneySchema', () => {
  it('accepts a valid journey', () => {
    const result = createJourneySchema.safeParse({ title: 'Our Journey' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = createJourneySchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a title over 120 chars', () => {
    const result = createJourneySchema.safeParse({ title: 'a'.repeat(121) })
    expect(result.success).toBe(false)
  })
})

describe('createCheckpointSchema', () => {
  const valid = {
    title: 'Test Stop',
    coordinates: { latitude: 40.712, longitude: -74.006 },
  }

  it('accepts valid checkpoint data', () => {
    const result = createCheckpointSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects invalid latitude', () => {
    const result = createCheckpointSchema.safeParse({
      ...valid,
      coordinates: { latitude: 100, longitude: -74.006 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid longitude', () => {
    const result = createCheckpointSchema.safeParse({
      ...valid,
      coordinates: { latitude: 40.712, longitude: 200 },
    })
    expect(result.success).toBe(false)
  })
})

describe('proposalResponseSchema', () => {
  it('accepts "yes"', () => {
    expect(proposalResponseSchema.safeParse({ response: 'yes' }).success).toBe(true)
  })
  it('accepts "no"', () => {
    expect(proposalResponseSchema.safeParse({ response: 'no' }).success).toBe(true)
  })
  it('rejects other values', () => {
    expect(proposalResponseSchema.safeParse({ response: 'maybe' }).success).toBe(false)
  })
})

describe('completeCheckpointSchema', () => {
  it('accepts valid coordinates with accuracy', () => {
    const result = completeCheckpointSchema.safeParse({ latitude: 40.712, longitude: -74.006, accuracy: 15 })
    expect(result.success).toBe(true)
  })

  it('accepts coordinates without accuracy (optional)', () => {
    const result = completeCheckpointSchema.safeParse({ latitude: 40.712, longitude: -74.006 })
    expect(result.success).toBe(true)
  })
})
