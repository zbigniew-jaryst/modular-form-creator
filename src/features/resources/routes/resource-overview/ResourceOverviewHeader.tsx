import styled from 'styled-components'
import { paths } from '../../../../shared/routing/paths'
import type { Resource } from '../../domain/resource.types'
import { ResourceMetadata } from '../../ui/ResourceMetadata'
import { ResourceTextLink } from '../shared/ResourceTextLink'

type ResourceOverviewHeaderProps = {
  resource: Resource
}

export function ResourceOverviewHeader({ resource }: ResourceOverviewHeaderProps) {
  return (
    <Header>
      <Copy>
        <ResourceTextLink to={paths.resources}>Back to resources</ResourceTextLink>
        <Title>{resource.name}</Title>
        <ResourceMetadata resource={resource} />
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

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
  overflow-wrap: anywhere;
`
