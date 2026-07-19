import { isApiError } from '../../../../shared/api/ApiError'
import type { ResourceIdentifier } from '../../domain/resourceIdentifier'
import type { Resource } from '../../domain/resource.types'

export type ResourceQuerySnapshot = {
  isPending: boolean
  isError: boolean
  error: Error | null
  data: Resource | undefined
}

export type ResourcePageLoadState =
  | { status: 'invalid-id' }
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      identifier: ResourceIdentifier
      serverResource: Resource
    }

/**
 * Resolves resource detail-page load into a discriminated UI state.
 * Blocked states are rendered by ResourcePageStateView.
 */
export function resolveResourcePageState(
  identifier: ResourceIdentifier | undefined,
  resourceQuery: ResourceQuerySnapshot,
): ResourcePageLoadState {
  if (!identifier) {
    return { status: 'invalid-id' }
  }

  if (resourceQuery.isPending && !resourceQuery.data) {
    return { status: 'loading' }
  }

  if (resourceQuery.isError) {
    if (isApiError(resourceQuery.error) && resourceQuery.error.status === 404) {
      return { status: 'not-found' }
    }

    const message = isApiError(resourceQuery.error)
      ? resourceQuery.error.message
      : 'Something went wrong while loading this resource.'

    return { status: 'error', message }
  }

  if (!resourceQuery.data) {
    return { status: 'loading' }
  }

  return {
    status: 'ready',
    identifier,
    serverResource: resourceQuery.data,
  }
}
