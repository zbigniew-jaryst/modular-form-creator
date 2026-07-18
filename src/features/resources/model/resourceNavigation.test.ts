import { describe, expect, it } from 'vitest'
import {
  formatChangedModuleLabels,
  getPendingModuleBadgeLabel,
  getResourceModuleLabel,
} from './resourceNavigation'

describe('resource module labels', () => {
  it('formats module labels consistently', () => {
    expect(getResourceModuleLabel('basic-info')).toBe('Basic Info')
    expect(getResourceModuleLabel('project-details')).toBe('Project Details')
    expect(formatChangedModuleLabels(['basic-info', 'project-details'])).toBe(
      'Basic Info, Project Details',
    )
    expect(getPendingModuleBadgeLabel('basic-info')).toBe('Basic Info pending')
    expect(getPendingModuleBadgeLabel('project-details')).toBe(
      'Project Details pending',
    )
  })
})
