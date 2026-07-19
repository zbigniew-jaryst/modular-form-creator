import styled from 'styled-components'
import { getResourceProgress } from '../../domain/resourceProgress'
import type { Resource } from '../../domain/resource.types'

type ResourceModuleProgressProps = {
  resource: Resource
}

export function ResourceModuleProgress({ resource }: ResourceModuleProgressProps) {
  const progress = getResourceProgress(resource)

  return (
    <ProgressText>
      Modules {progress.completed}/{progress.total}
    </ProgressText>
  )
}

const ProgressText = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: 0.95rem;
`
