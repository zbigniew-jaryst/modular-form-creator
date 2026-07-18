import { TEAM_MEMBER_OPTIONS } from '../model/resource.constants'
import type {
  Priority,
  ProjectDetailsUpdatePayload,
  Resource,
  TeamMemberOption,
} from '../model/resource.types'
import type {
  ChangedModule,
  CompletedResourceDraft,
  CompletedResourceDraftsState,
  EditableCompletedBasicInfo,
  ReplaceCompletedResourcePayload,
} from './completedResourceDraft.types'

export function draftKey(resourceId: number): string {
  return String(resourceId)
}

export function canonicalizeTeamMemberOptions(
  options: readonly string[],
): TeamMemberOption[] {
  const unique = new Set(options)
  return TEAM_MEMBER_OPTIONS.filter((option) => unique.has(option))
}

function editableBasicInfoFromServer(serverResource: Resource): EditableCompletedBasicInfo {
  return {
    owner: serverResource.basicInfo.owner.trim(),
    email: serverResource.basicInfo.email.trim(),
    description: serverResource.basicInfo.description.trim(),
    priority: serverResource.basicInfo.priority as Priority,
  }
}

function projectDetailsFromServer(serverResource: Resource): ProjectDetailsUpdatePayload {
  return {
    projectName: serverResource.projectDetails.projectName.trim(),
    budget: serverResource.projectDetails.budget.trim(),
    category: serverResource.projectDetails.category as ProjectDetailsUpdatePayload['category'],
    options: canonicalizeTeamMemberOptions(serverResource.projectDetails.options),
  }
}

export function areEditableBasicInfoEqual(
  left: EditableCompletedBasicInfo,
  right: EditableCompletedBasicInfo,
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

export function getEffectiveBasicInfo(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): EditableCompletedBasicInfo {
  if (resourceDraft?.basicInfo) {
    return { ...resourceDraft.basicInfo }
  }

  return editableBasicInfoFromServer(serverResource)
}

export function getEffectiveProjectDetails(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): ProjectDetailsUpdatePayload {
  if (resourceDraft?.projectDetails) {
    return {
      ...resourceDraft.projectDetails,
      options: [...resourceDraft.projectDetails.options],
    }
  }

  return projectDetailsFromServer(serverResource)
}

export function getChangedModules(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): ChangedModule[] {
  if (!resourceDraft) {
    return []
  }

  const changed: ChangedModule[] = []
  const serverBasicInfo = editableBasicInfoFromServer(serverResource)
  const serverProjectDetails = projectDetailsFromServer(serverResource)

  if (
    resourceDraft.basicInfo &&
    !areEditableBasicInfoEqual(resourceDraft.basicInfo, serverBasicInfo)
  ) {
    changed.push('basic-info')
  }

  if (
    resourceDraft.projectDetails &&
    !areProjectDetailsEqual(resourceDraft.projectDetails, serverProjectDetails)
  ) {
    changed.push('project-details')
  }

  return changed
}

export function hasEffectivePendingChanges(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): boolean {
  return getChangedModules(serverResource, resourceDraft).length > 0
}

export function buildFullUpdatePayload(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): ReplaceCompletedResourcePayload {
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, resourceDraft)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    resourceDraft,
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
      options: canonicalizeTeamMemberOptions(effectiveProjectDetails.options),
    },
  }
}

function cloneDraft(draft: CompletedResourceDraft): CompletedResourceDraft {
  return {
    ...(draft.basicInfo ? { basicInfo: { ...draft.basicInfo } } : {}),
    ...(draft.projectDetails
      ? {
          projectDetails: {
            ...draft.projectDetails,
            options: [...draft.projectDetails.options],
          },
        }
      : {}),
  }
}

export function readDraftFromState(
  state: CompletedResourceDraftsState,
  resourceId: number,
): CompletedResourceDraft | undefined {
  const draft = state[draftKey(resourceId)]
  return draft ? cloneDraft(draft) : undefined
}

function setDraftEntry(
  state: CompletedResourceDraftsState,
  key: string,
  draft: CompletedResourceDraft | undefined,
): CompletedResourceDraftsState {
  if (!draft || (!draft.basicInfo && !draft.projectDetails)) {
    if (!(key in state)) {
      return state
    }

    const next = { ...state }
    delete next[key]
    return next
  }

  return {
    ...state,
    [key]: cloneDraft(draft),
  }
}

export function applyBasicInfoOverride(
  state: CompletedResourceDraftsState,
  serverResource: Resource,
  values: EditableCompletedBasicInfo,
): CompletedResourceDraftsState {
  const key = draftKey(serverResource.resourceId)
  const existing = state[key]
  const nextDraft: CompletedResourceDraft = {
    ...(existing?.projectDetails
      ? {
          projectDetails: {
            ...existing.projectDetails,
            options: [...existing.projectDetails.options],
          },
        }
      : {}),
  }

  const normalized: EditableCompletedBasicInfo = {
    owner: values.owner.trim(),
    email: values.email.trim(),
    description: values.description.trim(),
    priority: values.priority,
  }
  const serverBasicInfo = editableBasicInfoFromServer(serverResource)

  if (!areEditableBasicInfoEqual(normalized, serverBasicInfo)) {
    nextDraft.basicInfo = normalized
  }

  return setDraftEntry(state, key, nextDraft)
}

export function applyProjectDetailsOverride(
  state: CompletedResourceDraftsState,
  serverResource: Resource,
  values: ProjectDetailsUpdatePayload,
): CompletedResourceDraftsState {
  const key = draftKey(serverResource.resourceId)
  const existing = state[key]
  const nextDraft: CompletedResourceDraft = {
    ...(existing?.basicInfo ? { basicInfo: { ...existing.basicInfo } } : {}),
  }

  const normalized: ProjectDetailsUpdatePayload = {
    projectName: values.projectName.trim(),
    budget: values.budget.trim(),
    category: values.category,
    options: canonicalizeTeamMemberOptions(values.options),
  }
  const serverProjectDetails = projectDetailsFromServer(serverResource)

  if (!areProjectDetailsEqual(normalized, serverProjectDetails)) {
    nextDraft.projectDetails = normalized
  }

  return setDraftEntry(state, key, nextDraft)
}

export function clearDraftFromState(
  state: CompletedResourceDraftsState,
  resourceId: number,
): CompletedResourceDraftsState {
  return setDraftEntry(state, draftKey(resourceId), undefined)
}

export function reconcileDraftInState(
  state: CompletedResourceDraftsState,
  serverResource: Resource,
): CompletedResourceDraftsState {
  const key = draftKey(serverResource.resourceId)
  const existing = state[key]

  if (!existing) {
    return state
  }

  const nextDraft: CompletedResourceDraft = {}
  const serverBasicInfo = editableBasicInfoFromServer(serverResource)
  const serverProjectDetails = projectDetailsFromServer(serverResource)

  if (
    existing.basicInfo &&
    !areEditableBasicInfoEqual(existing.basicInfo, serverBasicInfo)
  ) {
    nextDraft.basicInfo = { ...existing.basicInfo }
  }

  if (
    existing.projectDetails &&
    !areProjectDetailsEqual(existing.projectDetails, serverProjectDetails)
  ) {
    nextDraft.projectDetails = {
      ...existing.projectDetails,
      options: [...existing.projectDetails.options],
    }
  }

  if (!nextDraft.basicInfo && !nextDraft.projectDetails) {
    return setDraftEntry(state, key, undefined)
  }

  const basicUnchanged =
    Boolean(existing.basicInfo) === Boolean(nextDraft.basicInfo) &&
    (!nextDraft.basicInfo ||
      areEditableBasicInfoEqual(existing.basicInfo!, nextDraft.basicInfo))
  const projectUnchanged =
    Boolean(existing.projectDetails) === Boolean(nextDraft.projectDetails) &&
    (!nextDraft.projectDetails ||
      areProjectDetailsEqual(existing.projectDetails!, nextDraft.projectDetails))

  if (basicUnchanged && projectUnchanged) {
    return state
  }

  return setDraftEntry(state, key, nextDraft)
}

export function reconcileDraftSnapshot(
  serverResource: Resource,
  resourceDraft: CompletedResourceDraft | undefined,
): CompletedResourceDraft | undefined {
  const reconciledState = reconcileDraftInState(
    resourceDraft
      ? { [draftKey(serverResource.resourceId)]: resourceDraft }
      : {},
    serverResource,
  )

  return reconciledState[draftKey(serverResource.resourceId)]
}

export function stateHasAnyDraftEntries(
  state: CompletedResourceDraftsState,
): boolean {
  return Object.keys(state).length > 0
}
