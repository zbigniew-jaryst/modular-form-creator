import { apiClient } from '../../../shared/api/apiClient'
import type {
  CreateResourcePayload,
  Resource,
  ResourceListQuery,
  ResourceListResponse,
} from '../model/resource.types'

function buildListQueryString(params: ResourceListQuery): string {
  const searchParams = new URLSearchParams()
  searchParams.set('page', String(params.page))
  searchParams.set('pageSize', String(params.pageSize))
  searchParams.set('sortOrder', params.sortOrder)

  if (params.status) {
    searchParams.set('status', params.status)
  }

  if (params.name) {
    searchParams.set('name', params.name)
  }

  return searchParams.toString()
}

export function listResources(
  params: ResourceListQuery,
  signal?: AbortSignal,
): Promise<ResourceListResponse> {
  const query = buildListQueryString(params)
  return apiClient<ResourceListResponse>(`/api/resources?${query}`, { signal })
}

export function createResource(payload: CreateResourcePayload): Promise<Resource> {
  return apiClient<Resource>('/api/resources', {
    method: 'POST',
    body: payload,
  })
}

export function deleteResource(resourceId: number): Promise<Resource> {
  return apiClient<Resource>(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  })
}
