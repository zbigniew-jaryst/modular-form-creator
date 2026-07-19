import { useState } from 'react'
import styled from 'styled-components'
import { Button, Drawer } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import { useDeleteResourceMutation } from '../../api/resourceQueries'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { hasEffectivePendingChanges } from '../../state/completed-edits/completedResourceEdits.selectors'
import type { Resource } from '../../domain/resource.types'

type DeleteResourceDrawerProps = {
  resource: Resource | null
  isOpen: boolean
  onClose: () => void
  onDeleted: (resourceName: string) => void
}

/** Retain the last resource while the drawer closes so the name stays visible. */
function useDisplayResource(resource: Resource | null) {
  const [cachedResource, setCachedResource] = useState(resource)

  if (resource !== null && !Object.is(resource, cachedResource)) {
    setCachedResource(resource)
  }

  return resource ?? cachedResource
}

export function DeleteResourceDrawer({
  resource,
  isOpen,
  onClose,
  onDeleted,
}: DeleteResourceDrawerProps) {
  const [submitError, setSubmitError] = useState<string | undefined>()
  const deleteMutation = useDeleteResourceMutation()
  const completedEdits = useCompletedResourceEdits()
  const displayResource = useDisplayResource(resource)

  const bufferedEdits = displayResource
    ? completedEdits.getBufferedEdits(displayResource.resourceId)
    : undefined
  const hasPendingLocalChanges =
    displayResource != null &&
    displayResource.status === 'completed' &&
    hasEffectivePendingChanges(displayResource, bufferedEdits)

  function handleClose() {
    setSubmitError(undefined)
    onClose()
  }

  async function handleDelete() {
    if (!displayResource) {
      return
    }

    setSubmitError(undefined)

    try {
      await deleteMutation.mutateAsync(String(displayResource.resourceId))
      completedEdits.clearBufferedEdits(displayResource.resourceId)
      onDeleted(displayResource.name)
      setSubmitError(undefined)
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        setSubmitError(error.message)
        return
      }
      setSubmitError('Unable to delete the resource. Please try again.')
    }
  }

  return (
    <Drawer title="Delete resource" isOpen={isOpen} onClose={handleClose}>
      <Content>
        <Intro>
          Delete <strong>{displayResource?.name ?? 'this resource'}</strong>? This action cannot be
          undone.
        </Intro>
        {hasPendingLocalChanges ? (
          <Warning role="status">
            This resource also has unsaved local changes that will be discarded.
          </Warning>
        ) : null}
        {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}
        <Actions>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || !displayResource}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
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

const Warning = styled.p`
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

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
`
