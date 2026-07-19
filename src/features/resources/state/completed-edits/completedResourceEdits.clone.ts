import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
} from '../../domain/resource.types'
import type { CompletedResourceEdits } from './completedResourceEdits.types'

export function cloneEditableBasicInfo(
  basicInfo: EditableBasicInfo,
): EditableBasicInfo {
  return { ...basicInfo }
}

export function cloneProjectDetails(
  projectDetails: ProjectDetailsUpdatePayload,
): ProjectDetailsUpdatePayload {
  return {
    ...projectDetails,
    options: [...projectDetails.options],
  }
}

export function cloneBufferedEdits(
  bufferedEdits: CompletedResourceEdits,
): CompletedResourceEdits {
  const clone: CompletedResourceEdits = {}

  if (bufferedEdits.basicInfo) {
    clone.basicInfo = cloneEditableBasicInfo(bufferedEdits.basicInfo)
  }

  if (bufferedEdits.projectDetails) {
    clone.projectDetails = cloneProjectDetails(bufferedEdits.projectDetails)
  }

  return clone
}
