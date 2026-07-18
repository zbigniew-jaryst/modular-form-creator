import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { isApiError } from '../../../shared/api/ApiError'
import type { ResourceIdentifier } from '../model/resourceIdentifier'
import type { Resource } from '../model/resource.types'
import { ResourcePageLoading, ResourcePageState } from './ResourcePageState'

type ResourceDetailLoadReady = {
  kind: 'ready'
  identifier: ResourceIdentifier
  serverResource: Resource
}

type ResourceDetailLoadBlocked = {
  kind: 'blocked'
  node: ReactNode
}

export type ResourceDetailLoadResult =
  | ResourceDetailLoadReady
  | ResourceDetailLoadBlocked

export function resolveResourceDetailLoad(
  identifier: ResourceIdentifier | undefined,
  resourceQuery: UseQueryResult<Resource, Error>,
): ResourceDetailLoadResult {
  if (!identifier) {
    return {
      kind: 'blocked',
      node: (
        <ResourcePageState
          title="Invalid resource"
          description="The resource identifier in the URL is not valid. Use a positive numeric ID or a Mongo ObjectId."
        />
      ),
    }
  }

  if (resourceQuery.isPending && !resourceQuery.data) {
    return {
      kind: 'blocked',
      node: <ResourcePageLoading />,
    }
  }

  if (resourceQuery.isError) {
    if (isApiError(resourceQuery.error) && resourceQuery.error.status === 404) {
      return {
        kind: 'blocked',
        node: (
          <ResourcePageState
            title="Resource not found"
            description="No resource exists for this identifier. It may have been deleted."
          />
        ),
      }
    }

    const message = isApiError(resourceQuery.error)
      ? resourceQuery.error.message
      : 'Something went wrong while loading this resource.'

    return {
      kind: 'blocked',
      node: (
        <ResourcePageState
          title="Unable to load resource"
          description={message}
          onRetry={() => {
            void resourceQuery.refetch()
          }}
        />
      ),
    }
  }

  if (!resourceQuery.data) {
    return {
      kind: 'blocked',
      node: <ResourcePageLoading />,
    }
  }

  return {
    kind: 'ready',
    identifier,
    serverResource: resourceQuery.data,
  }
}
