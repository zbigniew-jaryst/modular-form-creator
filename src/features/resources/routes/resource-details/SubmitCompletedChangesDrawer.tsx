import { useState } from 'react'
import styled from 'styled-components'
import { Button, Drawer } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import { useReplaceCompletedResourceMutation } from '../../api/resourceQueries'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { hasEffectivePendingChanges } from '../../state/completed-edits/completedResourceEdits.selectors'
import { buildFullUpdatePayload } from '../../state/completed-edits/completedResourceUpdatePayload'
import { formatChangedModuleLabels } from '../shared/resourceNotices'
import type { ResourceIdentifier } from '../../domain/resourceIdentifier'
import type { Resource, ResourceModuleKey } from '../../domain/resource.types'

type SubmitCompletedChangesDrawerProps = {
  serverResource: Resource
  identifier: ResourceIdentifier
  changedModules: ResourceModuleKey[]
  isOpen: boolean
  onClose: () => void
  onSubmitted: () => void
  onAlreadyCurrent: () => void
  onResourceMissing: () => void
  refetchResource: () => Promise<Resource | undefined>
}

export function SubmitCompletedChangesDrawer({
  serverResource,
  identifier,
  changedModules,
  isOpen,
  onClose,
  onSubmitted,
  onAlreadyCurrent,
  onResourceMissing,
  refetchResource,
}: SubmitCompletedChangesDrawerProps) {
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isPreparing, setIsPreparing] = useState(false)
  const replaceMutation = useReplaceCompletedResourceMutation(identifier)
  const completedEdits = useCompletedResourceEdits()

  const isBusy = isPreparing || replaceMutation.isPending

  function handleClose() {
    if (isBusy) {
      return
    }

    setSubmitError(undefined)
    replaceMutation.reset()
    onClose()
  }

  async function handleSubmit() {
    if (isBusy) {
      return
    }

    setSubmitError(undefined)
    setIsPreparing(true)

    try {
      let refreshed: Resource | undefined
      try {
        refreshed = await refetchResource()
      } catch {
        setSubmitError('Unable to refresh the resource before submitting. Please try again.')
        return
      }

      if (!refreshed) {
        completedEdits.clearBufferedEdits(serverResource.resourceId)
        replaceMutation.reset()
        onResourceMissing()
        onClose()
        return
      }

      if (refreshed.status !== 'completed') {
        setSubmitError(
          'This resource is no longer completed. Full update is available only for completed resources.',
        )
        return
      }

      const reconciledBufferedEdits =
        completedEdits.reconcileAndGetBufferedEdits(refreshed)

      if (!hasEffectivePendingChanges(refreshed, reconciledBufferedEdits)) {
        completedEdits.clearBufferedEdits(refreshed.resourceId)
        replaceMutation.reset()
        onAlreadyCurrent()
        onClose()
        return
      }

      const payload = buildFullUpdatePayload(refreshed, reconciledBufferedEdits)

      try {
        await replaceMutation.mutateAsync(payload)
        completedEdits.clearBufferedEdits(refreshed.resourceId)
        setSubmitError(undefined)
        replaceMutation.reset()
        onSubmitted()
        onClose()
      } catch (error) {
        if (isApiError(error) && error.status === 404) {
          completedEdits.clearBufferedEdits(refreshed.resourceId)
          replaceMutation.reset()
          onResourceMissing()
          onClose()
          return
        }

        if (isApiError(error) && error.status === 400) {
          const afterError = await refetchResource().catch(() => undefined)
          if (afterError) {
            const remainingBufferedEdits =
              completedEdits.reconcileAndGetBufferedEdits(afterError)

            if (!hasEffectivePendingChanges(afterError, remainingBufferedEdits)) {
              completedEdits.clearBufferedEdits(afterError.resourceId)
              replaceMutation.reset()
              onAlreadyCurrent()
              onClose()
              return
            }
          }

          setSubmitError(error.message)
          return
        }

        if (isApiError(error)) {
          setSubmitError(error.message)
          return
        }

        setSubmitError('Unable to submit changes. Please try again.')
      }
    } finally {
      setIsPreparing(false)
    }
  }

  return (
    <Drawer title="Submit all changes" isOpen={isOpen} onClose={handleClose}>
      <Content>
        <Intro>
          Submit buffered changes for <strong>{serverResource.name}</strong> (ID{' '}
          {serverResource.resourceId})?
        </Intro>
        <Details>
          Modules with unsaved changes: {formatChangedModuleLabels(changedModules)}. All
          displayed changes will be persisted together. The resource status stays
          completed.
        </Details>
        {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}
        <Actions>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleSubmit()
            }}
            disabled={isBusy}
          >
            {isBusy ? 'Saving…' : 'Submit changes'}
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

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
`
