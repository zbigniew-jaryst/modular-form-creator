import type { ResourceListQuery } from '../model/resource.types'

export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (query: ResourceListQuery) => [...resourceKeys.lists(), query] as const,
}
