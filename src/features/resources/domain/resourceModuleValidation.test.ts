import { describe, expect, it } from 'vitest'
import {
  normalizeEditableBasicInfo,
  normalizeProjectDetailsPayload,
  validateBudget,
  validateCategory,
  validateDescription,
  validateEmail,
  validateOwner,
  validatePriority,
  validateProjectName,
  validateTeamMemberOptions,
} from './resourceModuleValidation'

describe('resourceModuleValidation', () => {
  it('rejects whitespace-only required fields', () => {
    expect(validateOwner('   ')).toBe('Owner is required')
    expect(validateEmail('   ')).toBe('Email is required')
    expect(validateDescription('   ')).toBe('Description is required')
    expect(validateProjectName('   ')).toBe('Project name is required')
    expect(validateBudget('   ')).toBe('Budget is required')
  })

  it('enforces owner and description length boundaries', () => {
    expect(validateOwner('a'.repeat(255))).toBeUndefined()
    expect(validateOwner('a'.repeat(256))).toBe(
      'Owner must be at most 255 characters',
    )
    expect(validateDescription('a'.repeat(1000))).toBeUndefined()
    expect(validateDescription('a'.repeat(1001))).toBe(
      'Description must be at most 1000 characters',
    )
    expect(validateProjectName('a'.repeat(255))).toBeUndefined()
    expect(validateProjectName('a'.repeat(256))).toBe(
      'Project name must be at most 255 characters',
    )
  })

  it('rejects invalid email and owner characters', () => {
    expect(validateEmail('not-an-email')).toBe(
      'Email must be a valid email format',
    )
    expect(validateOwner('Owner123')).toBe(
      'Owner can contain only letters and spaces',
    )
  })

  it('requires budget digits only', () => {
    expect(validateBudget('12.5')).toBe('Budget must contain digits only')
    expect(validateBudget('1000')).toBeUndefined()
  })

  it('rejects invalid enums', () => {
    expect(validatePriority('urgent')).toBe(
      'Priority must be one of: low, medium, high',
    )
    expect(validateCategory('other')).toBe(
      'Category must be one of: internal, external, vendor',
    )
  })

  it('validates team options: empty and unknown; duplicates allowed like backend', () => {
    expect(validateTeamMemberOptions([])).toBe(
      'At least one team member is required',
    )
    expect(validateTeamMemberOptions(['FE devs', 'FE devs'])).toBeUndefined()
    expect(validateTeamMemberOptions(['Unknown'])).toBe(
      'Unsupported team member option: Unknown',
    )
  })

  it('normalizes trimmed form values and canonicalizes options order', () => {
    expect(
      normalizeEditableBasicInfo({
        owner: '  Ada Lovelace  ',
        email: '  ada@example.com ',
        description: '  Desc  ',
        priority: 'high',
      }),
    ).toEqual({
      owner: 'Ada Lovelace',
      email: 'ada@example.com',
      description: 'Desc',
      priority: 'high',
    })

    expect(
      normalizeProjectDetailsPayload({
        projectName: '  Portal  ',
        budget: ' 42 ',
        category: 'vendor',
        options: ['Product Owner', 'FE devs'],
      }),
    ).toEqual({
      projectName: 'Portal',
      budget: '42',
      category: 'vendor',
      options: ['FE devs', 'Product Owner'],
    })
  })
})
