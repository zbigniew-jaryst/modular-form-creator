import {
  normalizeEditableBasicInfo,
  normalizeProjectDetailsPayload,
} from '../../domain/resourceModuleValidation'
import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
  Resource,
} from '../../domain/resource.types'
import {
  areEditableBasicInfoEqual,
  areProjectDetailsEqual,
  editableBasicInfoFromServer,
  projectDetailsFromServer,
} from './completedResourceEdits.comparison'
import {
  cloneBufferedEdits,
  cloneEditableBasicInfo,
  cloneProjectDetails,
} from './completedResourceEdits.clone'
import type {
  CompletedResourceEdits,
  CompletedResourceEditsState,
} from './completedResourceEdits.types'

function bufferKey(resourceId: number): string {
  return String(resourceId)
}

function isEmptyBufferedEdits(
  bufferedEdits: CompletedResourceEdits | undefined,
): boolean {
  return !bufferedEdits?.basicInfo && !bufferedEdits?.projectDetails
}

function areBufferedEditsEqual(
  left: CompletedResourceEdits,
  right: CompletedResourceEdits,
): boolean {
  const basicInfoPresenceMatches =
    Boolean(left.basicInfo) === Boolean(right.basicInfo)
  const projectDetailsPresenceMatches =
    Boolean(left.projectDetails) === Boolean(right.projectDetails)

  if (!basicInfoPresenceMatches || !projectDetailsPresenceMatches) {
    return false
  }

  const basicInfoContentMatches =
    !right.basicInfo ||
    areEditableBasicInfoEqual(left.basicInfo!, right.basicInfo)
  const projectDetailsContentMatches =
    !right.projectDetails ||
    areProjectDetailsEqual(left.projectDetails!, right.projectDetails)

  return basicInfoContentMatches && projectDetailsContentMatches
}

export function readBufferedEditsFromState(
  state: CompletedResourceEditsState,
  resourceId: number,
): CompletedResourceEdits | undefined {
  const entry = state[bufferKey(resourceId)]
  return entry ? cloneBufferedEdits(entry) : undefined
}

function setBufferedEditsEntry(
  state: CompletedResourceEditsState,
  key: string,
  bufferedEdits: CompletedResourceEdits | undefined,
): CompletedResourceEditsState {
  if (isEmptyBufferedEdits(bufferedEdits)) {
    if (!(key in state)) {
      return state
    }

    const next = { ...state }
    delete next[key]
    return next
  }

  return {
    ...state,
    [key]: cloneBufferedEdits(bufferedEdits!),
  }
}

export function applyBasicInfoOverride(
  state: CompletedResourceEditsState,
  serverResource: Resource,
  values: EditableBasicInfo,
): CompletedResourceEditsState {
  if (serverResource.status !== 'completed') {
    return state
  }

  const key = bufferKey(serverResource.resourceId)
  const existing = state[key]
  const nextBufferedEdits = cloneBufferedEdits({
    projectDetails: existing?.projectDetails,
  })

  const normalized = normalizeEditableBasicInfo(values)
  const differsFromServer = !areEditableBasicInfoEqual(
    normalized,
    editableBasicInfoFromServer(serverResource),
  )

  if (differsFromServer) {
    nextBufferedEdits.basicInfo = normalized
  }

  return setBufferedEditsEntry(state, key, nextBufferedEdits)
}

export function applyProjectDetailsOverride(
  state: CompletedResourceEditsState,
  serverResource: Resource,
  values: ProjectDetailsUpdatePayload,
): CompletedResourceEditsState {
  if (serverResource.status !== 'completed') {
    return state
  }

  const key = bufferKey(serverResource.resourceId)
  const existing = state[key]
  const nextBufferedEdits = cloneBufferedEdits({
    basicInfo: existing?.basicInfo,
  })

  const normalized = normalizeProjectDetailsPayload(values)
  const differsFromServer = !areProjectDetailsEqual(
    normalized,
    projectDetailsFromServer(serverResource),
  )

  if (differsFromServer) {
    nextBufferedEdits.projectDetails = normalized
  }

  return setBufferedEditsEntry(state, key, nextBufferedEdits)
}

export function clearBufferedEditsFromState(
  state: CompletedResourceEditsState,
  resourceId: number,
): CompletedResourceEditsState {
  return setBufferedEditsEntry(state, bufferKey(resourceId), undefined)
}

export function reconcileBufferedEditsInState(
  state: CompletedResourceEditsState,
  serverResource: Resource,
): CompletedResourceEditsState {
  const key = bufferKey(serverResource.resourceId)
  const existing = state[key]

  if (!existing) {
    return state
  }

  const serverBasicInfo = editableBasicInfoFromServer(serverResource)
  const serverProjectDetails = projectDetailsFromServer(serverResource)

  const basicInfoStillDiffers =
    Boolean(existing.basicInfo) &&
    !areEditableBasicInfoEqual(existing.basicInfo!, serverBasicInfo)
  const projectDetailsStillDiffers =
    Boolean(existing.projectDetails) &&
    !areProjectDetailsEqual(existing.projectDetails!, serverProjectDetails)

  const nextBufferedEdits: CompletedResourceEdits = {}

  if (basicInfoStillDiffers) {
    nextBufferedEdits.basicInfo = cloneEditableBasicInfo(existing.basicInfo!)
  }

  if (projectDetailsStillDiffers) {
    nextBufferedEdits.projectDetails = cloneProjectDetails(
      existing.projectDetails!,
    )
  }

  if (isEmptyBufferedEdits(nextBufferedEdits)) {
    return setBufferedEditsEntry(state, key, undefined)
  }

  if (areBufferedEditsEqual(existing, nextBufferedEdits)) {
    return state
  }

  return setBufferedEditsEntry(state, key, nextBufferedEdits)
}

export function reconcileBufferedEditsSnapshot(
  serverResource: Resource,
  bufferedEdits: CompletedResourceEdits | undefined,
): CompletedResourceEdits | undefined {
  const key = bufferKey(serverResource.resourceId)
  const reconciledState = reconcileBufferedEditsInState(
    bufferedEdits ? { [key]: bufferedEdits } : {},
    serverResource,
  )

  return reconciledState[key]
}

export function stateHasAnyBufferedEdits(
  state: CompletedResourceEditsState,
): boolean {
  return Object.keys(state).length > 0
}
