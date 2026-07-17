import styled from 'styled-components'
import { getResourceProgress } from '../model/resourceProgress'
import type { Resource } from '../model/resource.types'

type ResourceProgressProps = {
  resource: Resource
}

export function ResourceProgress({ resource }: ResourceProgressProps) {
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
