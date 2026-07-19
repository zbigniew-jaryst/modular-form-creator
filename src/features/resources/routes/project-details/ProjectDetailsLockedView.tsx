import { Button, Card } from '../../../../design-system'
import styled from 'styled-components'

type ProjectDetailsLockedViewProps = {
  onOpenBasicInfo: () => void
  onBackToResource: () => void
}

export function ProjectDetailsLockedView({
  onOpenBasicInfo,
  onBackToResource,
}: ProjectDetailsLockedViewProps) {
  return (
    <Card variant="elevated">
      <LockedBody>
        <LockedTitle>Project Details is locked</LockedTitle>
        <LockedText>
          Complete Basic Info before you can edit Project Details.
        </LockedText>
        <LockedActions>
          <Button type="button" onClick={onOpenBasicInfo}>
            Open Basic Info
          </Button>
          <Button type="button" variant="ghost" onClick={onBackToResource}>
            Back to resource
          </Button>
        </LockedActions>
      </LockedBody>
    </Card>
  )
}

const LockedBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const LockedTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const LockedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const LockedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`
