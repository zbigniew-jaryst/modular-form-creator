import { useState } from 'react'
import styled from 'styled-components'
import { Button, Drawer } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import { useProvisionResourceMutation } from '../../api/resourceQueries'
import type { ResourceIdentifier } from '../../domain/resourceIdentifier'
import { getProvisioningEligibility } from '../../domain/resourceProvisioning'
import { getProvisioningBlockedMessage } from './provisioningMessages'
import type { Resource } from '../../domain/resource.types'

type ProvisionResourceDrawerProps = {
  resource: Resource
  identifier: ResourceIdentifier
  isOpen: boolean
  onClose: () => void
  onProvisioned: () => void
  onStatusChangedExternally: () => void
  onResourceMissing: () => void
  getLatestResource: () => Resource | undefined
  refetchResource: () => Promise<Resource | undefined>
}

export function ProvisionResourceDrawer({
  resource,
  identifier,
  isOpen,
  onClose,
  onProvisioned,
  onStatusChangedExternally,
  onResourceMissing,
  getLatestResource,
  refetchResource,
}: ProvisionResourceDrawerProps) {
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [retryBlockedReason, setRetryBlockedReason] = useState<string | undefined>()
  const provisionMutation = useProvisionResourceMutation(identifier)

  const isPending = provisionMutation.isPending

  function handleClose() {
    if (isPending) {
      return
    }

    setSubmitError(undefined)
    setRetryBlockedReason(undefined)
    provisionMutation.reset()
    onClose()
  }

  async function handleProvision() {
    if (isPending) {
      return
    }

    const latest = getLatestResource()
    if (!latest) {
      return
    }

    const eligibility = getProvisioningEligibility(latest)
    if (!eligibility.allowed) {
      setSubmitError(undefined)
      setRetryBlockedReason(getProvisioningBlockedMessage(eligibility.reason))
      return
    }

    setSubmitError(undefined)
    setRetryBlockedReason(undefined)

    try {
      await provisionMutation.mutateAsync()
      setSubmitError(undefined)
      setRetryBlockedReason(undefined)
      provisionMutation.reset()
      onProvisioned()
      handleClose()
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        setSubmitError(undefined)
        setRetryBlockedReason(undefined)
        provisionMutation.reset()
        onResourceMissing()
        handleClose()
        return
      }

      if (isApiError(error) && error.status === 400) {
        const refreshed = await refetchResource()

        if (refreshed?.status === 'completed') {
          setSubmitError(undefined)
          setRetryBlockedReason(undefined)
          provisionMutation.reset()
          onStatusChangedExternally()
          handleClose()
          return
        }

        if (refreshed) {
          const refreshedEligibility = getProvisioningEligibility(refreshed)
          if (!refreshedEligibility.allowed) {
            setSubmitError(error.message)
            setRetryBlockedReason(
              getProvisioningBlockedMessage(refreshedEligibility.reason),
            )
            return
          }
        }

        setSubmitError(error.message)
        setRetryBlockedReason(undefined)
        return
      }

      if (isApiError(error)) {
        setSubmitError(error.message)
        return
      }

      setSubmitError('Unable to provision the resource. Please try again.')
    }
  }

  const canRetry = !isPending && !retryBlockedReason

  return (
    <Drawer title="Provision resource" isOpen={isOpen} onClose={handleClose}>
      <Content>
        <Intro>
          Provision <strong>{resource.name}</strong> (ID {resource.resourceId})?
        </Intro>
        <Details>
          Both Basic Info and Project Details are complete. Provisioning changes the
          resource status to completed. The resource cannot be provisioned again.
        </Details>
        {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}
        {retryBlockedReason ? (
          <BlockedText role="status">{retryBlockedReason}</BlockedText>
        ) : null}
        <Actions>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleProvision()
            }}
            disabled={!canRetry}
          >
            {isPending ? 'Provisioning…' : 'Provision'}
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

const BlockedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`
