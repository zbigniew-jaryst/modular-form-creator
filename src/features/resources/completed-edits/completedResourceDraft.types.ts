import type {
  Priority,
  ProjectDetailsUpdatePayload,
} from '../model/resource.types'

export type EditableCompletedBasicInfo = {
  owner: string
  email: string
  description: string
  priority: Priority
}

export type CompletedResourceDraft = {
  basicInfo?: EditableCompletedBasicInfo
  projectDetails?: ProjectDetailsUpdatePayload
}

export type CompletedResourceDraftsState = Record<string, CompletedResourceDraft>

export type ChangedModule = 'basic-info' | 'project-details'

export type ReplaceCompletedResourcePayload = {
  name: string
  basicInfo: {
    resourceName: string
    owner: string
    email: string
    description: string
    priority: Priority
  }
  projectDetails: ProjectDetailsUpdatePayload
}
