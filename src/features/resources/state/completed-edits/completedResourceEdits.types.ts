import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
} from '../../domain/resource.types'

export type CompletedResourceEdits = {
  basicInfo?: EditableBasicInfo
  projectDetails?: ProjectDetailsUpdatePayload
}

export type CompletedResourceEditsState = Record<string, CompletedResourceEdits>
