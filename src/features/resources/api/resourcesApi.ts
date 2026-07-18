import { apiClient } from '../../../shared/api/apiClient'
import type {
  BasicInfoUpdatePayload,
  CreateResourcePayload,
  ProjectDetailsUpdatePayload,
  Resource,
  ResourceListQuery,
  ResourceListResponse,
} from '../model/resource.types'
import type { ResourceIdentifier } from '../model/resourceIdentifier'

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

function resourcePath(identifier: ResourceIdentifier): string {
  return `/api/resources/${encodeURIComponent(identifier)}`
}

export function listResources(
  params: ResourceListQuery,
  signal?: AbortSignal,
): Promise<ResourceListResponse> {
  const query = buildListQueryString(params)
  return apiClient<ResourceListResponse>(`/api/resources?${query}`, { signal })
}

export function getResource(
  identifier: ResourceIdentifier,
  signal?: AbortSignal,
): Promise<Resource> {
  return apiClient<Resource>(resourcePath(identifier), { signal })
}

export function createResource(payload: CreateResourcePayload): Promise<Resource> {
  return apiClient<Resource>('/api/resources', {
    method: 'POST',
    body: payload,
  })
}

export function updateBasicInfo(
  identifier: ResourceIdentifier,
  payload: BasicInfoUpdatePayload,
): Promise<Resource> {
  return apiClient<Resource>(`${resourcePath(identifier)}/basic-info`, {
    method: 'PATCH',
    body: payload,
  })
}

export function updateProjectDetails(
  identifier: ResourceIdentifier,
  payload: ProjectDetailsUpdatePayload,
): Promise<Resource> {
  return apiClient<Resource>(`${resourcePath(identifier)}/project-details`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteResource(resourceId: number): Promise<Resource> {
  return apiClient<Resource>(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  })
}
