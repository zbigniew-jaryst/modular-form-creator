import { useState } from 'react'
import styled from 'styled-components'
import { Button, Input, Select } from '../../../design-system'
import { parseSortOrder, parseStatus } from '../model/resourceListSearchParams'
import type { ResourceSortOrder, ResourceStatus } from '../model/resource.types'

type ResourcesFiltersProps = {
  committedName: string
  status?: ResourceStatus
  sortOrder: ResourceSortOrder
  onSearch: (nameDraft: string) => void
  onStatusChange: (status: ResourceStatus | undefined) => void
  onSortOrderChange: (sortOrder: ResourceSortOrder) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

const sortOptions = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
]

export function ResourcesFilters({
  committedName,
  status,
  sortOrder,
  onSearch,
  onStatusChange,
  onSortOrderChange,
  onClearFilters,
  hasActiveFilters,
}: ResourcesFiltersProps) {
  const [nameDraft, setNameDraft] = useState(committedName)

  return (
    <FiltersForm
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(nameDraft)
      }}
    >
      <Fields>
        <Input
          label="Resource name"
          name="name"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          placeholder="Search by name"
        />
        <Select
          label="Status"
          name="status"
          value={status ?? ''}
          options={statusOptions}
          onChange={(event) => onStatusChange(parseStatus(event.target.value))}
        />
        <Select
          label="Sort order"
          name="sortOrder"
          value={sortOrder}
          options={sortOptions}
          onChange={(event) => onSortOrderChange(parseSortOrder(event.target.value))}
        />
      </Fields>
      <Actions>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
      </Actions>
    </FiltersForm>
  )
}

const FiltersForm = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const Fields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr;
    align-items: start;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`
