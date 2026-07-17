import { useState } from 'react'
import styled from 'styled-components'
import { Button, Drawer } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { useDeleteResourceMutation } from '../api/resourcesQueries'
import type { Resource } from '../model/resource.types'

type DeleteResourceDrawerProps = {
  resource: Resource | null
  isOpen: boolean
  onClose: () => void
  onDeleted: (resourceName: string) => void
}

export function DeleteResourceDrawer({
  resource,
  isOpen,
  onClose,
  onDeleted,
}: DeleteResourceDrawerProps) {
  const [submitError, setSubmitError] = useState<string | undefined>()
  const deleteMutation = useDeleteResourceMutation()

  async function handleDelete() {
    if (!resource) {
      return
    }

    setSubmitError(undefined)

    try {
      await deleteMutation.mutateAsync(resource.resourceId)
      onDeleted(resource.name)
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
    <Drawer title="Delete resource" isOpen={isOpen} onClose={onClose}>
      <Content>
        <Intro>
          Delete <strong>{resource?.name ?? 'this resource'}</strong>? This action cannot be
          undone.
        </Intro>
        {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDelete} disabled={deleteMutation.isPending || !resource}>
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
