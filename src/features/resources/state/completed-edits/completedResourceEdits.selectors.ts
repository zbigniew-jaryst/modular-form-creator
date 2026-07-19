import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
  Resource,
  ResourceModuleKey,
} from '../../domain/resource.types'
import {
  diffBufferedEdits,
  editableBasicInfoFromServer,
  projectDetailsFromServer,
} from './completedResourceEdits.comparison'
import {
  cloneEditableBasicInfo,
  cloneProjectDetails,
} from './completedResourceEdits.clone'
import type { CompletedResourceEdits } from './completedResourceEdits.types'

export function getEffectiveBasicInfo(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): EditableBasicInfo {
  if (bufferedEdits?.basicInfo) {
    return cloneEditableBasicInfo(bufferedEdits.basicInfo)
  }

  return editableBasicInfoFromServer(serverResource)
}

export function getEffectiveProjectDetails(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): ProjectDetailsUpdatePayload {
  if (bufferedEdits?.projectDetails) {
    return cloneProjectDetails(bufferedEdits.projectDetails)
  }

  return projectDetailsFromServer(serverResource)
}

export function getChangedModules(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): ResourceModuleKey[] {
  return diffBufferedEdits(serverResource, bufferedEdits)
}

export function hasEffectivePendingChanges(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): boolean {
  return diffBufferedEdits(serverResource, bufferedEdits).length > 0
}
