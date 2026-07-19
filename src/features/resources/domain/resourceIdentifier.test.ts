import { describe, expect, it } from 'vitest'
import {
  isValidResourceIdentifier,
  parseResourceIdentifier,
} from './resourceIdentifier'

describe('resourceIdentifier', () => {
  it('accepts positive numeric identifiers', () => {
    expect(isValidResourceIdentifier('1')).toBe(true)
    expect(isValidResourceIdentifier('42')).toBe(true)
    expect(parseResourceIdentifier('42')).toBe('42')
  })

  it('accepts valid Mongo ObjectIds', () => {
    const objectId = '507f1f77bcf86cd799439011'
    expect(isValidResourceIdentifier(objectId)).toBe(true)
    expect(parseResourceIdentifier(objectId)).toBe(objectId)
  })

  it('rejects malformed identifiers', () => {
    expect(isValidResourceIdentifier('0')).toBe(false)
    expect(isValidResourceIdentifier('-1')).toBe(false)
    expect(isValidResourceIdentifier('1.5')).toBe(false)
    expect(isValidResourceIdentifier('abc')).toBe(false)
    expect(isValidResourceIdentifier('507f1f77bcf86cd79943901')).toBe(false)
    expect(parseResourceIdentifier('not-valid')).toBeUndefined()
  })
})
