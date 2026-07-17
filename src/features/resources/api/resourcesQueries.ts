import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateResourcePayload, ResourceListQuery } from '../model/resource.types'
import { resourceKeys } from './resourceKeys'
import { createResource, deleteResource, listResources } from './resourcesApi'

export function useResourcesListQuery(query: ResourceListQuery) {
  return useQuery({
    queryKey: resourceKeys.list(query),
    queryFn: ({ signal }) => listResources(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateResourcePayload) => createResource(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
    },
  })
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (resourceId: number) => deleteResource(resourceId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
    },
  })
}
