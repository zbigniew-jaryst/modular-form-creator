const API_BASE = (process.env.E2E_API_URL ?? 'http://localhost:5001').replace(/\/$/, '')

export type E2EResource = {
  resourceId: number
  name: string
  status: 'draft' | 'completed'
  basicInfo: {
    resourceName: string
    owner: string
    email: string
    description: string
    priority: string
  }
  projectDetails: {
    projectName: string
    budget: string
    category: string
    options: string[]
  }
}

type ListResponse = {
  items: E2EResource[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
}

export function uniqueResourceName(prefix: string): string {
  const safePrefix = prefix.replace(/[^A-Za-z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim()
  const stamp = Date.now().toString(36)
  const suffix = Math.random().toString(36).slice(2, 6)
  const name = `${safePrefix} ${stamp} ${suffix}`.slice(0, 255)
  return name
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${body}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function createResource(resourceName: string): Promise<E2EResource> {
  return apiFetch<E2EResource>('/api/resources', {
    method: 'POST',
    body: JSON.stringify({ resourceName }),
  })
}

export function getResource(resourceId: number): Promise<E2EResource> {
  return apiFetch<E2EResource>(`/api/resources/${resourceId}`)
}

export function deleteResource(resourceId: number): Promise<E2EResource> {
  return apiFetch<E2EResource>(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  })
}

export async function findResourceByExactName(name: string): Promise<E2EResource | undefined> {
  const result = await apiFetch<ListResponse>(
    `/api/resources?page=1&pageSize=100&sortOrder=desc&name=${encodeURIComponent(name)}`,
  )
  return result.items.find(
    (item) => item.name === name || item.basicInfo.resourceName === name,
  )
}

export function updateBasicInfo(
  resourceId: number,
  basicInfo: E2EResource['basicInfo'],
): Promise<E2EResource> {
  return apiFetch<E2EResource>(`/api/resources/${resourceId}/basic-info`, {
    method: 'PATCH',
    body: JSON.stringify(basicInfo),
  })
}

export function updateProjectDetails(
  resourceId: number,
  projectDetails: E2EResource['projectDetails'],
): Promise<E2EResource> {
  return apiFetch<E2EResource>(`/api/resources/${resourceId}/project-details`, {
    method: 'PATCH',
    body: JSON.stringify(projectDetails),
  })
}

export function provisionResource(resourceId: number): Promise<E2EResource> {
  return apiFetch<E2EResource>(`/api/resources/${resourceId}/provisioning`, {
    method: 'PATCH',
  })
}

export async function seedCompletedResource(resourceName: string): Promise<E2EResource> {
  const created = await createResource(resourceName)
  await updateBasicInfo(created.resourceId, {
    resourceName: created.name,
    owner: 'Seed Owner',
    email: 'seed@example.com',
    description: 'Seeded basic info for E2E',
    priority: 'medium',
  })
  await updateProjectDetails(created.resourceId, {
    projectName: 'Seed Project',
    budget: '1500',
    category: 'internal',
    options: ['FE devs', 'Designer'],
  })
  return provisionResource(created.resourceId)
}
