import type { ReactNode } from 'react'
import styled from 'styled-components'
import type { Resource } from '../domain/resource.types'
import { getResourceProgress } from '../domain/resourceProgress'
import { ResourceStatusBadge } from './ResourceStatusBadge'

type ResourceMetadataProps = {
  resource: Resource
  extraMeta?: ReactNode
}

export function ResourceMetadata({ resource, extraMeta }: ResourceMetadataProps) {
  const progress = getResourceProgress(resource)

  return (
    <>
      <MetaRow>
        <ResourceId>ID {resource.resourceId}</ResourceId>
        <ResourceStatusBadge status={resource.status} />
        {extraMeta}
      </MetaRow>
      <ProgressText>
        {progress.completed} of {progress.total} modules completed
      </ProgressText>
    </>
  )
}

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
