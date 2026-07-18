import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BasicInfoUpdatePayload,
  CreateResourcePayload,
  ProjectDetailsUpdatePayload,
  ResourceListQuery,
} from '../model/resource.types'
import type { ResourceIdentifier } from '../model/resourceIdentifier'
import { resourceKeys } from './resourceKeys'
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  updateBasicInfo,
  updateProjectDetails,
} from './resourcesApi'

export function useResourcesListQuery(query: ResourceListQuery) {
  return useQuery({
    queryKey: resourceKeys.list(query),
    queryFn: ({ signal }) => listResources(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useResourceQuery(identifier: ResourceIdentifier | undefined) {
  return useQuery({
    queryKey: resourceKeys.detail(identifier ?? ''),
    queryFn: ({ signal }) => getResource(identifier as ResourceIdentifier, signal),
    enabled: Boolean(identifier),
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

export function useUpdateBasicInfoMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BasicInfoUpdatePayload) =>
      updateBasicInfo(identifier, payload),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceKeys.detail(identifier), resource)
      await queryClient.invalidateQueries({ queryKey: resourceKeys.lists() })
    },
  })
}

export function useUpdateProjectDetailsMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProjectDetailsUpdatePayload) =>
      updateProjectDetails(identifier, payload),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceKeys.detail(identifier), resource)
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
