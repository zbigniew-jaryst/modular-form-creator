import type { ResourceListQuery } from '../model/resource.types'
import type { ResourceIdentifier } from '../model/resourceIdentifier'

export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (query: ResourceListQuery) => [...resourceKeys.lists(), query] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (identifier: ResourceIdentifier) =>
    [...resourceKeys.details(), identifier] as const,
}
