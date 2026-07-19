import { describe, expect, it } from 'vitest'
import { normalizeResourceName, validateResourceName } from './resourceNameValidation'

describe('validateResourceName', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(validateResourceName('')).toBe('Resource name is required')
    expect(validateResourceName('   ')).toBe('Resource name is required')
  })

  it('accepts the maximum length boundary', () => {
    expect(validateResourceName('a'.repeat(255))).toBeUndefined()
  })

  it('rejects one character over the limit', () => {
    expect(validateResourceName('a'.repeat(256))).toBe(
      'Resource name must be at most 255 characters',
    )
  })

  it('rejects invalid characters', () => {
    expect(validateResourceName('Bad_Name!')).toBe(
      'Resource name can contain only letters, numbers, spaces, and hyphens',
    )
  })

  it('accepts letters, numbers, spaces, and hyphens', () => {
    expect(validateResourceName('Resource 12-A')).toBeUndefined()
  })
})

describe('normalizeResourceName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeResourceName('  Alpha Resource  ')).toBe('Alpha Resource')
  })
})
