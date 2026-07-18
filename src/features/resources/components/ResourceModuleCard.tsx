import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../../../design-system'

type ResourceModuleCardProps = {
  title: string
  summary: string
  complete: boolean
  actionLabel?: string
  actionTo?: string
  lockedReason?: string
}

export function ResourceModuleCard({
  title,
  summary,
  complete,
  actionLabel,
  actionTo,
  lockedReason,
}: ResourceModuleCardProps) {
  return (
    <Card variant="elevated">
      <CardBody>
        <CardHeader>
          <ModuleTitle>{title}</ModuleTitle>
          <Badge variant={complete ? 'success' : 'neutral'}>
            {complete ? 'Complete' : 'Incomplete'}
          </Badge>
        </CardHeader>
        <Summary>{summary}</Summary>
        {lockedReason ? <LockedReason>{lockedReason}</LockedReason> : null}
        {actionTo && actionLabel ? (
          <ActionLink to={actionTo}>{actionLabel}</ActionLink>
        ) : null}
        {!actionTo && lockedReason ? (
          <Button type="button" state="locked" disabled>
            Locked
          </Button>
        ) : null}
      </CardBody>
    </Card>
  )
}

const CardBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ModuleTitle = styled.h2`
  margin: 0;
  font-size: 1.15rem;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const Summary = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const LockedReason = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
`

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.surface};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
