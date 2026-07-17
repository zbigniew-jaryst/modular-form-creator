import styled from 'styled-components'
import { Button, Card } from '../../../design-system'
import type { Resource } from '../model/resource.types'
import { ResourceProgress } from './ResourceProgress'
import { ResourceStatusBadge } from './ResourceStatusBadge'

type ResourceListItemProps = {
  resource: Resource
  onDelete: (resource: Resource) => void
}

function formatDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function ResourceListItem({ resource, onDelete }: ResourceListItemProps) {
  const displayDate = formatDate(resource.updatedAt) ?? formatDate(resource.createdAt)

  return (
    <ListItem>
      <Card variant="elevated">
        <ItemHeader>
          <TitleGroup>
            <ItemTitle>{resource.name}</ItemTitle>
            <MetaRow>
              <ResourceId>ID {resource.resourceId}</ResourceId>
              <ResourceStatusBadge status={resource.status} />
            </MetaRow>
          </TitleGroup>
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={() => onDelete(resource)}
          >
            Delete
          </Button>
        </ItemHeader>
        <ItemFooter>
          <ResourceProgress resource={resource} />
          {displayDate ? <DateText>Updated {displayDate}</DateText> : null}
        </ItemFooter>
      </Card>
    </ListItem>
  )
}

const ListItem = styled.li`
  list-style: none;
`

const ItemHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

const TitleGroup = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 0;
`

const ItemTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
  overflow-wrap: anywhere;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ResourceId = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.95rem;
`

const ItemFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

const DateText = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.9rem;
`
