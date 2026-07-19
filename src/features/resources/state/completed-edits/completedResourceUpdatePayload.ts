import type {
  Resource,
  ReplaceCompletedResourcePayload,
} from '../../domain/resource.types'
import {
  getEffectiveBasicInfo,
  getEffectiveProjectDetails,
} from './completedResourceEdits.selectors'
import type { CompletedResourceEdits } from './completedResourceEdits.types'

export function buildFullUpdatePayload(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): ReplaceCompletedResourcePayload {
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, bufferedEdits)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    bufferedEdits,
  )
  const canonicalName = serverResource.name

  return {
    name: canonicalName,
    basicInfo: {
      resourceName: canonicalName,
      owner: effectiveBasicInfo.owner,
      email: effectiveBasicInfo.email,
      description: effectiveBasicInfo.description,
      priority: effectiveBasicInfo.priority,
    },
    projectDetails: {
      projectName: effectiveProjectDetails.projectName,
      budget: effectiveProjectDetails.budget,
      category: effectiveProjectDetails.category,
      options: effectiveProjectDetails.options,
    },
  }
}
