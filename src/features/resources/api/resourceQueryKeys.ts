import type { ResourceListQuery } from '../domain/resource.types'
import type { ResourceIdentifier } from '../domain/resourceIdentifier'

export const resourceQueryKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceQueryKeys.all, 'list'] as const,
  list: (query: ResourceListQuery) => [...resourceQueryKeys.lists(), query] as const,
  details: () => [...resourceQueryKeys.all, 'detail'] as const,
  detail: (identifier: ResourceIdentifier) =>
    [...resourceQueryKeys.details(), identifier] as const,
}
