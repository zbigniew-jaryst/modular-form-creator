import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { paths } from '../../../shared/routing/paths'
import type { Resource } from '../model/resource.types'
import { getResourceProgress } from '../model/resourceProgress'
import { ResourceStatusBadge } from './ResourceStatusBadge'

type ResourceHeaderProps = {
  resource: Resource
}

export function ResourceHeader({ resource }: ResourceHeaderProps) {
  const progress = getResourceProgress(resource)

  return (
    <Header>
      <Copy>
        <BackLink to={paths.resources}>Back to resources</BackLink>
        <Title>{resource.name}</Title>
        <MetaRow>
          <ResourceId>ID {resource.resourceId}</ResourceId>
          <ResourceStatusBadge status={resource.status} />
        </MetaRow>
        <ProgressText>
          {progress.completed} of {progress.total} modules completed
        </ProgressText>
      </Copy>
    </Header>
  )
}

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const Copy = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const BackLink = styled(Link)`
  width: fit-content;
  color: ${({ theme }) => theme.colors.primaryStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`

const Title = styled.h1`
  margin: 0;
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

const ProgressText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`
