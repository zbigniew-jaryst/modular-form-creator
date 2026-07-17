import styled from 'styled-components'
import { Button } from '../../../design-system'
import type { Resource } from '../model/resource.types'
import { ResourceListItem } from './ResourceListItem'

type ResourceListProps = {
  resources: Resource[]
  isRefetching: boolean
  onDelete: (resource: Resource) => void
}

export function ResourceList({ resources, isRefetching, onDelete }: ResourceListProps) {
  return (
    <ListSection aria-busy={isRefetching}>
      <List>
        {resources.map((resource) => (
          <ResourceListItem
            key={resource.resourceId}
            resource={resource}
            onDelete={onDelete}
          />
        ))}
      </List>
    </ListSection>
  )
}

type ResourceListEmptyProps = {
  hasFilters: boolean
  onCreate: () => void
  onClearFilters: () => void
}

export function ResourceListEmpty({
  hasFilters,
  onCreate,
  onClearFilters,
}: ResourceListEmptyProps) {
  if (hasFilters) {
    return (
      <EmptyState>
        <EmptyTitle>No matching resources</EmptyTitle>
        <EmptyDescription>
          No resources match the current filters. Clear filters to see all resources.
        </EmptyDescription>
        <Button type="button" variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      </EmptyState>
    )
  }

  return (
    <EmptyState>
      <EmptyTitle>No resources yet</EmptyTitle>
      <EmptyDescription>
        Create your first resource to start configuring Basic Info and Project Details.
      </EmptyDescription>
      <Button type="button" onClick={onCreate}>
        Create resource
      </Button>
    </EmptyState>
  )
}

type ResourceListErrorProps = {
  message: string
  onRetry: () => void
}

export function ResourceListError({ message, onRetry }: ResourceListErrorProps) {
  return (
    <EmptyState role="alert">
      <EmptyTitle>Unable to load resources</EmptyTitle>
      <EmptyDescription>{message}</EmptyDescription>
      <Button type="button" onClick={onRetry}>
        Retry
      </Button>
    </EmptyState>
  )
}

export function ResourceListLoading() {
  return (
    <EmptyState aria-busy="true">
      <EmptyTitle>Loading resources</EmptyTitle>
      <EmptyDescription>Fetching the latest resources from the server.</EmptyDescription>
    </EmptyState>
  )
}

const ListSection = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const List = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  margin: 0;
  padding: 0;
`

const EmptyState = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  justify-items: start;
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const EmptyTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const EmptyDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
  max-width: 42rem;
`
