import styled from 'styled-components'
import { Button, Drawer } from '../../../../design-system'
import type { Resource } from '../../domain/resource.types'

type DiscardCompletedChangesDrawerProps = {
  serverResource: Resource
  isOpen: boolean
  onClose: () => void
  onDiscard: () => void
}

export function DiscardCompletedChangesDrawer({
  serverResource,
  isOpen,
  onClose,
  onDiscard,
}: DiscardCompletedChangesDrawerProps) {
  function handleDiscard() {
    onDiscard()
    onClose()
  }

  return (
    <Drawer title="Discard changes" isOpen={isOpen} onClose={onClose}>
      <Content>
        <Intro>
          Discard all locally applied changes for <strong>{serverResource.name}</strong>?
        </Intro>
        <Details>
          Backend data will remain unchanged. Only unsaved changes stored in this browser
          session will be removed.
        </Details>
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDiscard}>
            Discard changes
          </Button>
        </Actions>
      </Content>
    </Drawer>
  )
}

const Content = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Intro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.5;
`

const Details = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
  line-height: 1.5;
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`
