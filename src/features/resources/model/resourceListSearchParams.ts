import type { ResourceListQuery, ResourceSortOrder, ResourceStatus } from './resource.types'

export const DEFAULT_LIST_PAGE = 1
export const DEFAULT_LIST_PAGE_SIZE = 10
export const DEFAULT_LIST_SORT_ORDER: ResourceSortOrder = 'desc'

export type ResourceListSearchState = {
  page: number
  status?: ResourceStatus
  name?: string
  sortOrder: ResourceSortOrder
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export function parseStatus(value: string | null): ResourceStatus | undefined {
  if (value === 'draft' || value === 'completed') {
    return value
  }
  return undefined
}

export function parseSortOrder(value: string | null): ResourceSortOrder {
  if (value === 'asc' || value === 'desc') {
    return value
  }
  return DEFAULT_LIST_SORT_ORDER
}

export function parseResourceListSearchParams(
  searchParams: URLSearchParams,
): ResourceListSearchState {
  const name = searchParams.get('name')?.trim()

  return {
    page: parsePositiveInteger(searchParams.get('page'), DEFAULT_LIST_PAGE),
    status: parseStatus(searchParams.get('status')),
    name: name && name.length > 0 ? name : undefined,
    sortOrder: parseSortOrder(searchParams.get('sortOrder')),
  }
}

export function toResourceListQuery(state: ResourceListSearchState): ResourceListQuery {
  return {
    page: state.page,
    pageSize: DEFAULT_LIST_PAGE_SIZE,
    status: state.status,
    name: state.name,
    sortOrder: state.sortOrder,
  }
}

export function serializeResourceListSearchParams(
  state: ResourceListSearchState,
): URLSearchParams {
  const params = new URLSearchParams()

  if (state.page !== DEFAULT_LIST_PAGE) {
    params.set('page', String(state.page))
  }

  if (state.status) {
    params.set('status', state.status)
  }

  if (state.name) {
    params.set('name', state.name)
  }

  if (state.sortOrder !== DEFAULT_LIST_SORT_ORDER) {
    params.set('sortOrder', state.sortOrder)
  }

  return params
}

export function getDefaultResourceListSearchState(): ResourceListSearchState {
  return {
    page: DEFAULT_LIST_PAGE,
    sortOrder: DEFAULT_LIST_SORT_ORDER,
  }
}
