import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useResourcesListQuery } from '../../api/resourceQueries'
import {
  getDefaultResourceListSearchState,
  parseResourceListSearchParams,
  serializeResourceListSearchParams,
  toResourceListQuery,
  type ResourceListSearchState,
} from './resourceListSearchParams'
import type { ResourceSortOrder, ResourceStatus } from '../../domain/resource.types'

export function useResourceListSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const listState = parseResourceListSearchParams(searchParams)
  const listQuery = toResourceListQuery(listState)
  const resourcesQuery = useResourcesListQuery(listQuery)

  useEffect(() => {
    const backendPage = resourcesQuery.data?.pagination.page
    if (
      !resourcesQuery.isSuccess ||
      typeof backendPage !== 'number' ||
      backendPage === listState.page
    ) {
      return
    }

    setSearchParams(
      (currentParams) => {
        const currentState = parseResourceListSearchParams(currentParams)
        if (currentState.page === backendPage) {
          return currentParams
        }
        return serializeResourceListSearchParams({ ...currentState, page: backendPage })
      },
      { replace: true },
    )
  }, [
    resourcesQuery.isSuccess,
    resourcesQuery.data?.pagination.page,
    listState.page,
    setSearchParams,
  ])

  function pushListState(next: ResourceListSearchState) {
    setSearchParams(serializeResourceListSearchParams(next))
  }

  function updateFilters(partial: Partial<ResourceListSearchState>) {
    pushListState({
      ...listState,
      ...partial,
      page: 1,
    })
  }

  return {
    listState,
    resourcesQuery,
    handleSearch(nameDraft: string) {
      const trimmed = nameDraft.trim()
      updateFilters({ name: trimmed.length > 0 ? trimmed : undefined })
    },
    handleStatusChange(status: ResourceStatus | undefined) {
      updateFilters({ status })
    },
    handleSortOrderChange(sortOrder: ResourceSortOrder) {
      updateFilters({ sortOrder })
    },
    handleClearFilters() {
      pushListState(getDefaultResourceListSearchState())
    },
    handlePageChange(page: number) {
      pushListState({ ...listState, page })
    },
    hasActiveFilters: Boolean(
      listState.name || listState.status || listState.sortOrder !== 'desc',
    ),
  }
}
