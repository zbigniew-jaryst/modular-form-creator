import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { useResourcesListQuery } from '../api/resourcesQueries'
import { CreateResourceDrawer } from '../components/CreateResourceDrawer'
import { DeleteResourceDrawer } from '../components/DeleteResourceDrawer'
import {
  ResourceList,
  ResourceListEmpty,
  ResourceListError,
  ResourceListLoading,
} from '../components/ResourceList'
import { ResourcesFilters } from '../components/ResourcesFilters'
import { ResourcesPagination } from '../components/ResourcesPagination'
import { StatusLiveRegion } from '../components/StatusLiveRegion'
import {
  getDefaultResourceListSearchState,
  parseResourceListSearchParams,
  serializeResourceListSearchParams,
  toResourceListQuery,
  type ResourceListSearchState,
} from '../model/resourceListSearchParams'
import type { Resource, ResourceSortOrder, ResourceStatus } from '../model/resource.types'

export function ResourcesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const listState = parseResourceListSearchParams(searchParams)
  const listQuery = toResourceListQuery(listState)
  const resourcesQuery = useResourcesListQuery(listQuery)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createDrawerKey, setCreateDrawerKey] = useState(0)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

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

  function openCreateDrawer() {
    setCreateDrawerKey((current) => current + 1)
    setIsCreateOpen(true)
  }

  function handleSearch(nameDraft: string) {
    const trimmed = nameDraft.trim()
    updateFilters({ name: trimmed.length > 0 ? trimmed : undefined })
  }

  function handleStatusChange(status: ResourceStatus | undefined) {
    updateFilters({ status })
  }

  function handleSortOrderChange(sortOrder: ResourceSortOrder) {
    updateFilters({ sortOrder })
  }

  function handleClearFilters() {
    pushListState(getDefaultResourceListSearchState())
  }

  function handlePageChange(page: number) {
    pushListState({ ...listState, page })
  }

  const hasActiveFilters = Boolean(
    listState.name || listState.status || listState.sortOrder !== 'desc',
  )
  const errorMessage = resourcesQuery.error
    ? isApiError(resourcesQuery.error)
      ? resourcesQuery.error.message
      : 'Something went wrong while loading resources.'
    : ''

  return (
    <Page>
      <Header>
        <Copy>
          <Title>Resources</Title>
          <Description>
            Review resource status and module progress, then create or remove resources as
            needed.
          </Description>
        </Copy>
        <Button type="button" onClick={openCreateDrawer}>
          Create resource
        </Button>
      </Header>

      <ResourcesFilters
        key={listState.name ?? ''}
        committedName={listState.name ?? ''}
        status={listState.status}
        sortOrder={listState.sortOrder}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onSortOrderChange={handleSortOrderChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <StatusLiveRegion message={statusMessage} />

      {resourcesQuery.isPending && !resourcesQuery.data ? <ResourceListLoading /> : null}

      {resourcesQuery.isError ? (
        <ResourceListError
          message={errorMessage}
          onRetry={() => {
            void resourcesQuery.refetch()
          }}
        />
      ) : null}

      {resourcesQuery.data && resourcesQuery.data.items.length === 0 ? (
        <ResourceListEmpty
          hasFilters={hasActiveFilters}
          onCreate={openCreateDrawer}
          onClearFilters={handleClearFilters}
        />
      ) : null}

      {resourcesQuery.data && resourcesQuery.data.items.length > 0 ? (
        <>
          <ResourceList
            resources={resourcesQuery.data.items}
            isRefetching={resourcesQuery.isFetching && !resourcesQuery.isPending}
            onDelete={setResourceToDelete}
          />
          <ResourcesPagination
            pagination={resourcesQuery.data.pagination}
            onPageChange={handlePageChange}
          />
        </>
      ) : null}

      <CreateResourceDrawer
        key={createDrawerKey}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(resourceName) => {
          setStatusMessage(`Created resource “${resourceName}”.`)
        }}
      />

      <DeleteResourceDrawer
        key={resourceToDelete?.resourceId ?? 'closed'}
        resource={resourceToDelete}
        isOpen={resourceToDelete !== null}
        onClose={() => setResourceToDelete(null)}
        onDeleted={(resourceName) => {
          setStatusMessage(`Deleted resource “${resourceName}”.`)
        }}
      />
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Copy = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  max-width: 40rem;
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`
