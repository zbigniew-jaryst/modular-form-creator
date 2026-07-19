import type { Resource, ResourceListResponse } from '../../domain/resource.types'

export function createResource(overrides: Partial<Resource> = {}): Resource {
  return {
    resourceId: 1,
    name: 'Alpha Resource',
    status: 'draft',
    basicInfo: {
      resourceName: 'Alpha Resource',
      owner: '',
      email: '',
      description: '',
      priority: '',
    },
    projectDetails: {
      projectName: '',
      budget: '',
      category: '',
      options: [],
    },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  }
}

export function createCompleteBasicInfo(
  overrides: Partial<Resource['basicInfo']> = {},
): Resource['basicInfo'] {
  return {
    resourceName: 'Alpha Resource',
    owner: 'Jane Owner',
    email: 'jane@example.com',
    description: 'A useful resource',
    priority: 'medium',
    ...overrides,
  }
}

export function createCompleteProjectDetails(
  overrides: Partial<Resource['projectDetails']> = {},
): Resource['projectDetails'] {
  return {
    projectName: 'Alpha Project',
    budget: '1000',
    category: 'internal',
    options: ['FE devs', 'Designer'],
    ...overrides,
  }
}

export function createListResponse(
  items: Resource[],
  pagination: Partial<ResourceListResponse['pagination']> = {},
): ResourceListResponse {
  return {
    items,
    pagination: {
      page: 1,
      pageSize: 10,
      totalItems: items.length,
      totalPages: 1,
      ...pagination,
    },
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
