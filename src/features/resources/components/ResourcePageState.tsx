import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../design-system'
import { paths } from '../../../shared/routing/paths'

type ResourcePageStateProps = {
  title: string
  description: string
  onRetry?: () => void
  showBackToResources?: boolean
}

export function ResourcePageState({
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
          <BackLink to={paths.resources}>Back to resources</BackLink>
        ) : null}
      </Actions>
    </State>
  )
}

export function ResourcePageLoading() {
  return (
    <ResourcePageState
      title="Loading resource"
      description="Fetching the latest resource details from the server."
      showBackToResources={false}
    />
  )
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

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
