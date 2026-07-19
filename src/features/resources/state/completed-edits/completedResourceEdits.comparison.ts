import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
  Resource,
  ResourceModuleKey,
} from '../../domain/resource.types'
import { canonicalizeTeamMemberOptions } from '../../domain/resourceModuleOptions'
import {
  normalizeEditableBasicInfo,
  normalizeProjectDetailsPayload,
} from '../../domain/resourceModuleValidation'
import type { CompletedResourceEdits } from './completedResourceEdits.types'

export function editableBasicInfoFromServer(
  serverResource: Resource,
): EditableBasicInfo {
  return normalizeEditableBasicInfo(serverResource.basicInfo)
}

export function projectDetailsFromServer(
  serverResource: Resource,
): ProjectDetailsUpdatePayload {
  return normalizeProjectDetailsPayload(serverResource.projectDetails)
}

export function areEditableBasicInfoEqual(
  left: EditableBasicInfo,
  right: EditableBasicInfo,
): boolean {
  return (
    left.owner === right.owner &&
    left.email === right.email &&
    left.description === right.description &&
    left.priority === right.priority
  )
}

export function areProjectDetailsEqual(
  left: ProjectDetailsUpdatePayload,
  right: ProjectDetailsUpdatePayload,
): boolean {
  if (
    left.projectName !== right.projectName ||
    left.budget !== right.budget ||
    left.category !== right.category
  ) {
    return false
  }

  const leftOptions = canonicalizeTeamMemberOptions(left.options)
  const rightOptions = canonicalizeTeamMemberOptions(right.options)

  if (leftOptions.length !== rightOptions.length) {
    return false
  }

  return leftOptions.every((option, index) => option === rightOptions[index])
}

export function diffBufferedEdits(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): ResourceModuleKey[] {
  if (!bufferedEdits) {
    return []
  }

  const changed: ResourceModuleKey[] = []
  const serverBasicInfo = editableBasicInfoFromServer(serverResource)
  const serverProjectDetails = projectDetailsFromServer(serverResource)

  if (
    bufferedEdits.basicInfo &&
    !areEditableBasicInfoEqual(bufferedEdits.basicInfo, serverBasicInfo)
  ) {
    changed.push('basic-info')
  }

  if (
    bufferedEdits.projectDetails &&
    !areProjectDetailsEqual(bufferedEdits.projectDetails, serverProjectDetails)
  ) {
    changed.push('project-details')
  }

  return changed
}
