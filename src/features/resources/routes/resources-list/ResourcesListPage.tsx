import { useState } from 'react'
import styled from 'styled-components'
import { Button } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import type { Resource } from '../../domain/resource.types'
import { StatusLiveRegion } from '../../ui/StatusLiveRegion'
import { CreateResourceDrawer } from './CreateResourceDrawer'
import { DeleteResourceDrawer } from './DeleteResourceDrawer'
import {
  ResourceList,
  ResourceListEmpty,
  ResourceListError,
  ResourceListLoading,
} from './ResourceList'
import { ResourcesFilters } from './ResourcesFilters'
import { ResourcesPagination } from './ResourcesPagination'
import { useResourceListSearchParams } from './useResourceListSearchParams'

export function ResourcesListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  const {
    listState,
    resourcesQuery,
    handleSearch,
    handleStatusChange,
    handleSortOrderChange,
    handleClearFilters,
    handlePageChange,
    hasActiveFilters,
  } = useResourceListSearchParams()

  const errorMessage = resourcesQuery.error
    ? isApiError(resourcesQuery.error)
      ? resourcesQuery.error.message
      : 'Something went wrong while loading resources.'
    : ''

  function openCreateDrawer() {
    setIsCreateOpen(true)
  }

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
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(resourceName) => {
          setStatusMessage(`Created resource “${resourceName}”.`)
        }}
      />

      <DeleteResourceDrawer
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

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Copy = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
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
