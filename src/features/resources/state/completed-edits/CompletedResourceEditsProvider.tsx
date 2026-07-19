import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  EditableBasicInfo,
  ProjectDetailsUpdatePayload,
  Resource,
} from '../../domain/resource.types'
import {
  applyBasicInfoOverride,
  applyProjectDetailsOverride,
  clearBufferedEditsFromState,
  readBufferedEditsFromState,
  reconcileBufferedEditsInState,
  reconcileBufferedEditsSnapshot,
  stateHasAnyBufferedEdits,
} from './completedResourceEdits.reducer'
import type {
  CompletedResourceEdits,
  CompletedResourceEditsState,
} from './completedResourceEdits.types'
import { useBeforeUnloadWarning } from './useBeforeUnloadWarning'

type BufferedEditsAction =
  | {
      type: 'apply-basic-info'
      serverResource: Resource
      values: EditableBasicInfo
    }
  | {
      type: 'apply-project-details'
      serverResource: Resource
      values: ProjectDetailsUpdatePayload
    }
  | { type: 'clear-buffered-edits'; resourceId: number }
  | { type: 'reconcile-buffered-edits'; serverResource: Resource }

function bufferedEditsReducer(
  state: CompletedResourceEditsState,
  action: BufferedEditsAction,
): CompletedResourceEditsState {
  switch (action.type) {
    case 'apply-basic-info':
      return applyBasicInfoOverride(state, action.serverResource, action.values)
    case 'apply-project-details':
      return applyProjectDetailsOverride(
        state,
        action.serverResource,
        action.values,
      )
    case 'clear-buffered-edits':
      return clearBufferedEditsFromState(state, action.resourceId)
    case 'reconcile-buffered-edits':
      return reconcileBufferedEditsInState(state, action.serverResource)
  }
}

type CompletedResourceEditsContextValue = {
  getBufferedEdits: (resourceId: number) => CompletedResourceEdits | undefined
  applyBasicInfo: (serverResource: Resource, values: EditableBasicInfo) => void
  applyProjectDetails: (
    serverResource: Resource,
    values: ProjectDetailsUpdatePayload,
  ) => void
  clearBufferedEdits: (resourceId: number) => void
  reconcileBufferedEdits: (serverResource: Resource) => void
  reconcileAndGetBufferedEdits: (
    serverResource: Resource,
  ) => CompletedResourceEdits | undefined
  hasAnyBufferedEdits: boolean
}

const CompletedResourceEditsContext =
  createContext<CompletedResourceEditsContextValue | null>(null)

type CompletedResourceEditsProviderProps = {
  children: ReactNode
}

export function CompletedResourceEditsProvider({
  children,
}: CompletedResourceEditsProviderProps) {
  const [state, dispatch] = useReducer(bufferedEditsReducer, {})

  const getBufferedEdits = useCallback(
    (resourceId: number) => readBufferedEditsFromState(state, resourceId),
    [state],
  )

  const applyBasicInfo = useCallback(
    (serverResource: Resource, values: EditableBasicInfo) => {
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

  const clearBufferedEdits = useCallback((resourceId: number) => {
    dispatch({ type: 'clear-buffered-edits', resourceId })
  }, [])

  const reconcileBufferedEdits = useCallback((serverResource: Resource) => {
    dispatch({ type: 'reconcile-buffered-edits', serverResource })
  }, [])

  const reconcileAndGetBufferedEdits = useCallback(
    (serverResource: Resource) => {
      const current = readBufferedEditsFromState(state, serverResource.resourceId)
      const reconciled = reconcileBufferedEditsSnapshot(
        serverResource,
        current,
      )
      dispatch({ type: 'reconcile-buffered-edits', serverResource })
      return reconciled
    },
    [state],
  )

  const hasAnyBufferedEdits = stateHasAnyBufferedEdits(state)

  useBeforeUnloadWarning(hasAnyBufferedEdits)

  const value = useMemo(
    () => ({
      getBufferedEdits,
      applyBasicInfo,
      applyProjectDetails,
      clearBufferedEdits,
      reconcileBufferedEdits,
      reconcileAndGetBufferedEdits,
      hasAnyBufferedEdits,
    }),
    [
      getBufferedEdits,
      applyBasicInfo,
      applyProjectDetails,
      clearBufferedEdits,
      reconcileBufferedEdits,
      reconcileAndGetBufferedEdits,
      hasAnyBufferedEdits,
    ],
  )

  return (
    <CompletedResourceEditsContext.Provider value={value}>
      {children}
    </CompletedResourceEditsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompletedResourceEdits(): CompletedResourceEditsContextValue {
  const context = useContext(CompletedResourceEditsContext)

  if (!context) {
    throw new Error(
      'useCompletedResourceEdits must be used within CompletedResourceEditsProvider',
    )
  }

  return context
}
