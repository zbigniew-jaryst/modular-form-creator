import styled from 'styled-components'
import { Button } from '../../../design-system'
import type { ResourceListPagination } from '../model/resource.types'

type ResourcesPaginationProps = {
  pagination: ResourceListPagination
  onPageChange: (page: number) => void
}

export function ResourcesPagination({ pagination, onPageChange }: ResourcesPaginationProps) {
  const { page, pageSize, totalItems, totalPages } = pagination

  if (totalItems === 0) {
    return null
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <PaginationBar>
      <Summary>
        Showing {start}-{end} of {totalItems}
      </Summary>
      <Controls>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <PageLabel>
          Page {page} of {Math.max(totalPages, 1)}
        </PageLabel>
        <Button
          type="button"
          variant="secondary"
          size="small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </Controls>
    </PaginationBar>
  )
}

const PaginationBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const PageLabel = styled.span`
  color: ${({ theme }) => theme.colors.ink};
  min-width: 7rem;
  text-align: center;
`
