import type { BasicInfo, ProjectDetails, Resource } from './resource.types'

const TOTAL_MODULES = 2

function hasMeaningfulValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/** Completeness for list progress only — backend remains authoritative. */
export function isBasicInfoComplete(basicInfo: BasicInfo | undefined): boolean {
  if (!basicInfo) {
    return false
  }

  return (
    hasMeaningfulValue(basicInfo.resourceName) &&
    hasMeaningfulValue(basicInfo.owner) &&
    hasMeaningfulValue(basicInfo.email) &&
    hasMeaningfulValue(basicInfo.description) &&
    hasMeaningfulValue(basicInfo.priority)
  )
}

/** Completeness for list progress only — backend remains authoritative. */
export function isProjectDetailsComplete(
  projectDetails: ProjectDetails | undefined,
): boolean {
  if (!projectDetails) {
    return false
  }

  return (
    hasMeaningfulValue(projectDetails.projectName) &&
    hasMeaningfulValue(projectDetails.budget) &&
    hasMeaningfulValue(projectDetails.category) &&
    Array.isArray(projectDetails.options) &&
    projectDetails.options.length > 0
  )
}

export type ResourceProgress = {
  completed: number
  total: number
  percentage: number
  basicInfoComplete: boolean
  projectDetailsComplete: boolean
}

export function getResourceProgress(resource: Resource): ResourceProgress {
  const basicInfoComplete = isBasicInfoComplete(resource.basicInfo)
  const projectDetailsComplete = isProjectDetailsComplete(resource.projectDetails)
  const completed = (basicInfoComplete ? 1 : 0) + (projectDetailsComplete ? 1 : 0)

  return {
    completed,
    total: TOTAL_MODULES,
    percentage: Math.round((completed / TOTAL_MODULES) * 100),
    basicInfoComplete,
    projectDetailsComplete,
  }
}

export function getCompletedModuleCount(resource: Resource): number {
  return getResourceProgress(resource).completed
}
