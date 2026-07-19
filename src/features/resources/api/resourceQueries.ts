import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  BasicInfoUpdatePayload,
  CreateResourcePayload,
  ProjectDetailsUpdatePayload,
  ReplaceCompletedResourcePayload,
  ResourceListQuery,
} from '../domain/resource.types'
import type { ResourceIdentifier } from '../domain/resourceIdentifier'
import { resourceQueryKeys } from './resourceQueryKeys'
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  provisionResource,
  replaceCompletedResource,
  updateBasicInfo,
  updateProjectDetails,
} from './resourceApi'

export function useResourcesListQuery(query: ResourceListQuery) {
  return useQuery({
    queryKey: resourceQueryKeys.list(query),
    queryFn: ({ signal }) => listResources(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useResourceQuery(identifier: ResourceIdentifier | undefined) {
  return useQuery({
    queryKey: resourceQueryKeys.detail(identifier ?? ''),
    queryFn: ({ signal }) => getResource(identifier as ResourceIdentifier, signal),
    enabled: Boolean(identifier),
  })
}

export function useCreateResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateResourcePayload) => createResource(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}

export function useUpdateBasicInfoMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BasicInfoUpdatePayload) =>
      updateBasicInfo(identifier, payload),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceQueryKeys.detail(identifier), resource)
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}

export function useUpdateProjectDetailsMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProjectDetailsUpdatePayload) =>
      updateProjectDetails(identifier, payload),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceQueryKeys.detail(identifier), resource)
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}

export function useDeleteResourceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (identifier: ResourceIdentifier) => deleteResource(identifier),
    onSuccess: async (_resource, identifier) => {
      queryClient.removeQueries({ queryKey: resourceQueryKeys.detail(identifier) })
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}

export function useProvisionResourceMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => provisionResource(identifier),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceQueryKeys.detail(identifier), resource)
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}

export function useReplaceCompletedResourceMutation(identifier: ResourceIdentifier) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReplaceCompletedResourcePayload) =>
      replaceCompletedResource(identifier, payload),
    onSuccess: async (resource) => {
      queryClient.setQueryData(resourceQueryKeys.detail(identifier), resource)
      await queryClient.invalidateQueries({ queryKey: resourceQueryKeys.lists() })
    },
  })
}
