import { journeyLimitFor, DEFAULT_JOURNEY_LIMIT, MAX_PHOTOS_PER_JOURNEY } from '../../src/lib/limits'
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from '../../src/lib/validation/schemas'

describe('journeyLimitFor', () => {
  it('defaults to 2 journeys', () => {
    expect(DEFAULT_JOURNEY_LIMIT).toBe(2)
    expect(journeyLimitFor(null)).toBe(2)
    expect(journeyLimitFor({})).toBe(2)
    expect(journeyLimitFor({ journeyLimit: null })).toBe(2)
  })

  it('uses a per-account limit when set', () => {
    expect(journeyLimitFor({ journeyLimit: 5 })).toBe(5)
    expect(journeyLimitFor({ journeyLimit: 0 })).toBe(0)
  })

  it('ignores invalid limits', () => {
    expect(journeyLimitFor({ journeyLimit: -1 })).toBe(2)
  })
})

describe('photo limit', () => {
  it('allows 2 photos per journey', () => {
    expect(MAX_PHOTOS_PER_JOURNEY).toBe(2)
  })
})

describe('account schemas', () => {
  it('normalises sign-up email and requires a name', () => {
    const ok = signupSchema.safeParse({ name: ' Kwame ', email: ' Kwame@Example.COM ', password: 'longenough' })
    expect(ok.success && ok.data.email).toBe('kwame@example.com')
    expect(ok.success && ok.data.name).toBe('Kwame')
    expect(signupSchema.safeParse({ name: '', email: 'a@b.co', password: 'longenough' }).success).toBe(false)
    expect(signupSchema.safeParse({ name: 'A', email: 'a@b.co', password: 'short' }).success).toBe(false)
  })

  it('validates password reset input', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false)
    expect(resetPasswordSchema.safeParse({ token: 'x'.repeat(43), password: 'newpassword' }).success).toBe(true)
    expect(resetPasswordSchema.safeParse({ token: 'short', password: 'newpassword' }).success).toBe(false)
  })
})
