import { describe, expect, it } from 'vitest'
import {
  getCompletedModuleCount,
  getResourceProgress,
  isBasicInfoComplete,
  isProjectDetailsComplete,
} from './resourceProgress'
import type { BasicInfo, ProjectDetails, Resource } from './resource.types'

const emptyBasicInfo: BasicInfo = {
  resourceName: '',
  owner: '',
  email: '',
  description: '',
  priority: '',
}

const completeBasicInfo: BasicInfo = {
  resourceName: 'Alpha',
  owner: 'Ada Lovelace',
  email: 'ada@example.com',
  description: 'A complete basic info module',
  priority: 'high',
}

const emptyProjectDetails: ProjectDetails = {
  projectName: '',
  budget: '',
  category: '',
  options: [],
}

const completeProjectDetails: ProjectDetails = {
  projectName: 'Apollo',
  budget: '1000',
  category: 'internal',
  options: ['FE devs'],
}

function createResource(
  basicInfo: BasicInfo,
  projectDetails: ProjectDetails,
): Resource {
  return {
    resourceId: 1,
    name: 'Alpha',
    status: 'draft',
    basicInfo,
    projectDetails,
  }
}

describe('resourceProgress', () => {
  it('produces 0/2 progress for empty module data', () => {
    const resource = createResource(emptyBasicInfo, emptyProjectDetails)
    const progress = getResourceProgress(resource)

    expect(progress.completed).toBe(0)
    expect(progress.total).toBe(2)
    expect(getCompletedModuleCount(resource)).toBe(0)
  })

  it('produces 1/2 progress when only Basic Info is complete', () => {
    const resource = createResource(completeBasicInfo, emptyProjectDetails)
    const progress = getResourceProgress(resource)

    expect(progress.completed).toBe(1)
    expect(progress.basicInfoComplete).toBe(true)
    expect(progress.projectDetailsComplete).toBe(false)
  })

  it('produces 2/2 progress when both modules are complete', () => {
    const resource = createResource(completeBasicInfo, completeProjectDetails)
    const progress = getResourceProgress(resource)

    expect(progress.completed).toBe(2)
    expect(progress.percentage).toBe(100)
  })

  it('treats Project Details without options as incomplete', () => {
    expect(
      isProjectDetailsComplete({
        ...completeProjectDetails,
        options: [],
      }),
    ).toBe(false)
  })

  it('does not count whitespace-only fields as complete', () => {
    expect(
      isBasicInfoComplete({
        resourceName: 'Alpha',
        owner: '   ',
        email: 'ada@example.com',
        description: 'desc',
        priority: 'high',
      }),
    ).toBe(false)
  })
})
