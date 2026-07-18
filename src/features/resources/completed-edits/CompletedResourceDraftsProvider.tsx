import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  ProjectDetailsUpdatePayload,
  Resource,
} from '../model/resource.types'
import {
  applyBasicInfoOverride,
  applyProjectDetailsOverride,
  clearDraftFromState,
  readDraftFromState,
  reconcileDraftInState,
  stateHasAnyDraftEntries,
} from './completedResourceDraft.helpers'
import type {
  CompletedResourceDraft,
  CompletedResourceDraftsState,
  EditableCompletedBasicInfo,
} from './completedResourceDraft.types'
import { useBeforeUnloadWarning } from './useBeforeUnloadWarning'

type DraftsAction =
  | {
      type: 'apply-basic-info'
      serverResource: Resource
      values: EditableCompletedBasicInfo
    }
  | {
      type: 'apply-project-details'
      serverResource: Resource
      values: ProjectDetailsUpdatePayload
    }
  | { type: 'clear-draft'; resourceId: number }
  | { type: 'reconcile-draft'; serverResource: Resource }

function draftsReducer(
  state: CompletedResourceDraftsState,
  action: DraftsAction,
): CompletedResourceDraftsState {
  switch (action.type) {
    case 'apply-basic-info':
      return applyBasicInfoOverride(state, action.serverResource, action.values)
    case 'apply-project-details':
      return applyProjectDetailsOverride(
        state,
        action.serverResource,
        action.values,
      )
    case 'clear-draft':
      return clearDraftFromState(state, action.resourceId)
    case 'reconcile-draft':
      return reconcileDraftInState(state, action.serverResource)
  }
}

type CompletedResourceDraftsContextValue = {
  getDraft: (resourceId: number) => CompletedResourceDraft | undefined
  applyBasicInfo: (
    serverResource: Resource,
    values: EditableCompletedBasicInfo,
  ) => void
  applyProjectDetails: (
    serverResource: Resource,
    values: ProjectDetailsUpdatePayload,
  ) => void
  clearDraft: (resourceId: number) => void
  reconcileDraft: (serverResource: Resource) => void
  hasAnyPendingChanges: boolean
}

const CompletedResourceDraftsContext =
  createContext<CompletedResourceDraftsContextValue | null>(null)

type CompletedResourceDraftsProviderProps = {
  children: ReactNode
}

export function CompletedResourceDraftsProvider({
  children,
}: CompletedResourceDraftsProviderProps) {
  const [state, dispatch] = useReducer(draftsReducer, {})

  const getDraft = useCallback(
    (resourceId: number) => readDraftFromState(state, resourceId),
    [state],
  )

  const applyBasicInfo = useCallback(
    (serverResource: Resource, values: EditableCompletedBasicInfo) => {
      dispatch({ type: 'apply-basic-info', serverResource, values })
    },
    [],
  )

  const applyProjectDetails = useCallback(
    (serverResource: Resource, values: ProjectDetailsUpdatePayload) => {
      dispatch({ type: 'apply-project-details', serverResource, values })
    },
    [],
  )

  const clearDraft = useCallback((resourceId: number) => {
    dispatch({ type: 'clear-draft', resourceId })
  }, [])

  const reconcileDraft = useCallback((serverResource: Resource) => {
    dispatch({ type: 'reconcile-draft', serverResource })
  }, [])

  const hasAnyPendingChanges = stateHasAnyDraftEntries(state)

  useBeforeUnloadWarning(hasAnyPendingChanges)

  const value = useMemo(
    () => ({
      getDraft,
      applyBasicInfo,
      applyProjectDetails,
      clearDraft,
      reconcileDraft,
      hasAnyPendingChanges,
    }),
    [
      getDraft,
      applyBasicInfo,
      applyProjectDetails,
      clearDraft,
      reconcileDraft,
      hasAnyPendingChanges,
    ],
  )

  return (
    <CompletedResourceDraftsContext.Provider value={value}>
      {children}
    </CompletedResourceDraftsContext.Provider>
  )
}

// Hook lives beside the provider; consumers import from this feature module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCompletedResourceDrafts(): CompletedResourceDraftsContextValue {
  const context = useContext(CompletedResourceDraftsContext)

  if (!context) {
    throw new Error(
      'useCompletedResourceDrafts must be used within CompletedResourceDraftsProvider',
    )
  }

  return context
}
