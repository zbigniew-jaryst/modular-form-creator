import styled from 'styled-components'
import { Button } from '../../../../design-system'
import { paths } from '../../../../shared/routing/paths'
import type { ResourcePageLoadState } from './resolveResourcePageState'
import { ResourceActionLink } from './ResourceActionLink'

type ResourcePageStateProps = {
  title: string
  description: string
  onRetry?: () => void
  showBackToResources?: boolean
}

function ResourcePageState({
  title,
  description,
  onRetry,
  showBackToResources = true,
}: ResourcePageStateProps) {
  return (
    <State role={onRetry ? 'alert' : undefined}>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Actions>
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {showBackToResources ? (
          <ResourceActionLink to={paths.resources}>Back to resources</ResourceActionLink>
        ) : null}
      </Actions>
    </State>
  )
}

function ResourcePageLoading() {
  return (
    <ResourcePageState
      title="Loading resource"
      description="Fetching the latest resource details from the server."
      showBackToResources={false}
    />
  )
}

type ResourcePageStateViewProps = {
  state: Exclude<ResourcePageLoadState, { status: 'ready' }>
  onRetry?: () => void
}

export function ResourcePageStateView({
  state,
  onRetry,
}: ResourcePageStateViewProps) {
  switch (state.status) {
    case 'invalid-id':
      return (
        <ResourcePageState
          title="Invalid resource"
          description="The resource identifier in the URL is not valid. Use a positive numeric ID or a Mongo ObjectId."
        />
      )
    case 'loading':
      return <ResourcePageLoading />
    case 'not-found':
      return (
        <ResourcePageState
          title="Resource not found"
          description="No resource exists for this identifier. It may have been deleted."
        />
      )
    case 'error':
      return (
        <ResourcePageState
          title="Unable to load resource"
          description={state.message}
          onRetry={onRetry}
        />
      )
  }
}

const State = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  justify-items: start;
  padding: ${({ theme }) => theme.spacing.xl};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
  max-width: 42rem;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`
