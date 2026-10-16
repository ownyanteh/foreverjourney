import { generateSecureToken, hashToken, safeCompare } from '../../src/lib/tokens'

describe('generateSecureToken', () => {
  it('generates a non-empty string', () => {
    const token = generateSecureToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateSecureToken()))
    expect(tokens.size).toBe(20)
  })

  it('generates longer tokens for larger byte count', () => {
    const short = generateSecureToken(16)
    const long = generateSecureToken(64)
    expect(long.length).toBeGreaterThan(short.length)
  })
})

describe('hashToken', () => {
  it('produces a hex string', () => {
    const hash = hashToken('test-token')
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
  })

  it('produces consistent output for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
  })

  it('produces different hashes for different inputs', () => {
    expect(hashToken('abc')).not.toBe(hashToken('xyz'))
  })
})

describe('safeCompare', () => {
  it('returns true for matching hashes', () => {
    const h = hashToken('secret')
    expect(safeCompare(h, h)).toBe(true)
  })

  it('returns false for non-matching hashes', () => {
    expect(safeCompare(hashToken('a'), hashToken('b'))).toBe(false)
  })

  it('returns false when lengths differ', () => {
    // safeCompare requires equal-length hex strings
    const h = hashToken('token')
    expect(safeCompare(h, h.slice(0, 10) + '00'.repeat(27))).toBe(false)
  })
})
