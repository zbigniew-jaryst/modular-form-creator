import { describe, expect, it } from 'vitest'
import { getPendingModuleBadgeLabel } from './pendingModuleBadgeLabel'

describe('getPendingModuleBadgeLabel', () => {
  it('labels pending modules for the details page', () => {
    expect(getPendingModuleBadgeLabel('basic-info')).toBe('Basic Info pending')
    expect(getPendingModuleBadgeLabel('project-details')).toBe(
      'Project Details pending',
    )
  })
})
