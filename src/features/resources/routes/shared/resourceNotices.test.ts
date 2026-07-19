import { describe, expect, it } from 'vitest'
import {
  createLocalApplyNotice,
  createModuleSaveNotice,
  formatChangedModuleLabels,
  getResourceModuleLabel,
  readLocalApplyNotice,
  readModuleSaveNotice,
} from './resourceNotices'

describe('resource module labels', () => {
  it('formats module labels consistently', () => {
    expect(getResourceModuleLabel('basic-info')).toBe('Basic Info')
    expect(getResourceModuleLabel('project-details')).toBe('Project Details')
    expect(formatChangedModuleLabels(['basic-info', 'project-details'])).toBe(
      'Basic Info, Project Details',
    )
  })

  it('builds navigation notice state shapes', () => {
    expect(createModuleSaveNotice('basic-info')).toEqual({
      moduleSave: { module: 'basic-info' },
    })
    expect(createLocalApplyNotice('project-details')).toEqual({
      localApply: { module: 'project-details' },
    })
  })

  it('reads typed notices from location state', () => {
    expect(readModuleSaveNotice(createModuleSaveNotice('basic-info'))).toEqual({
      module: 'basic-info',
    })
    expect(readLocalApplyNotice(createLocalApplyNotice('project-details'))).toEqual({
      module: 'project-details',
    })
    expect(readModuleSaveNotice(null)).toBeUndefined()
    expect(readLocalApplyNotice({ localApply: { module: 'unknown' } })).toBeUndefined()
    expect(readModuleSaveNotice({ moduleSave: { module: 1 } })).toBeUndefined()
  })
})
