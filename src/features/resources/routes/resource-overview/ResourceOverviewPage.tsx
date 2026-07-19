import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button } from '../../../../design-system'
import { paths } from '../../../../shared/routing/paths'
import { resourceQueryKeys } from '../../api/resourceQueryKeys'
import { useResourceQuery } from '../../api/resourceQueries'
import { ProvisionResourceDrawer } from './ProvisionResourceDrawer'
import { ResourceActionLink } from '../shared/ResourceActionLink'
import { ResourcePageStateView } from '../shared/ResourcePageStateView'
import { resolveResourcePageState } from '../shared/resolveResourcePageState'
import { ResourceOverviewHeader } from './ResourceOverviewHeader'
import { ResourceModuleCard } from './ResourceModuleCard'
import { StatusLiveRegion } from '../../ui/StatusLiveRegion'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { getChangedModules, getEffectiveBasicInfo, getEffectiveProjectDetails, hasEffectivePendingChanges } from '../../state/completed-edits/completedResourceEdits.selectors'
import { useReconcileCompletedEdits } from '../../state/completed-edits/useReconcileCompletedEdits'
import { useConsumeResourceNotice } from '../shared/useConsumeResourceNotice'
import {
  formatChangedModuleLabels,
  getModuleSaveSuccessMessage,
  readModuleSaveNotice,
} from '../shared/resourceNotices'
import {
  formatBasicInfoModuleSummary,
  formatProjectDetailsModuleSummary,
} from './moduleCardSummaries'
import { parseResourceIdentifier } from '../../domain/resourceIdentifier'
import { getProvisioningEligibility } from '../../domain/resourceProvisioning'
import { getProvisioningBlockedMessage } from './provisioningMessages'
import {
  getResourceProgress,
  isProjectDetailsLocked,
} from '../../domain/resourceProgress'
import type { Resource } from '../../domain/resource.types'

export function ResourceOverviewPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const location = useLocation()
  const queryClient = useQueryClient()
  const resourceQuery = useResourceQuery(identifier)
  const completedEdits = useCompletedResourceEdits()
  const [isProvisionOpen, setIsProvisionOpen] = useState(false)

  const moduleSaveNotice = readModuleSaveNotice(location.state)

  const [statusMessage, setStatusMessage] = useConsumeResourceNotice(
    moduleSaveNotice,
    (notice) => getModuleSaveSuccessMessage(notice.module),
    identifier ? paths.resource(identifier) : undefined,
  )

  useReconcileCompletedEdits(resourceQuery.data)

  const pageState = resolveResourcePageState(identifier, resourceQuery)
  if (pageState.status !== 'ready') {
    return (
      <ResourcePageStateView
        state={pageState}
        onRetry={() => {
          void resourceQuery.refetch()
        }}
      />
    )
  }

  const { identifier: resourceIdentifier, serverResource } = pageState
  const bufferedEdits = completedEdits.getBufferedEdits(serverResource.resourceId)
  const changedModules = getChangedModules(serverResource, bufferedEdits)
  const hasPending =
    serverResource.status === 'completed' &&
    hasEffectivePendingChanges(serverResource, bufferedEdits)
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, bufferedEdits)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    bufferedEdits,
  )

  const progress = getResourceProgress(serverResource)
  const isCompleted = serverResource.status === 'completed'
  const eligibility = getProvisioningEligibility(serverResource)
  const basicInfoActionLabel = isCompleted
    ? 'Edit module'
    : progress.basicInfoComplete
      ? 'Edit module'
      : 'Complete module'
  const projectDetailsLocked = isProjectDetailsLocked(serverResource)
  const projectDetailsActionLabel = isCompleted
    ? 'Edit module'
    : progress.projectDetailsComplete
      ? 'Edit module'
      : 'Complete module'

  function openProvisionDrawer() {
    const latest = resourceQuery.data
    if (!latest) {
      return
    }

    const currentEligibility = getProvisioningEligibility(latest)
    if (!currentEligibility.allowed) {
      return
    }

    setStatusMessage('')
    setIsProvisionOpen(true)
  }

  async function refetchResource(): Promise<Resource | undefined> {
    const result = await resourceQuery.refetch()
    return result.data
  }

  return (
    <Page>
      <ResourceOverviewHeader resource={serverResource} />

      <ActionsRow>
        <ResourceActionLink to={paths.resourceDetails(resourceIdentifier)}>
          View details
        </ResourceActionLink>
        {hasPending ? (
          <ResourceActionLink $primary to={paths.resourceDetails(resourceIdentifier)}>
            Review changes
          </ResourceActionLink>
        ) : null}
      </ActionsRow>

      <StatusLiveRegion message={statusMessage} />

      {hasPending ? (
        <PendingPanel role="status">
          <PendingTitle>
            <Badge variant="warning">Unsaved changes</Badge>
          </PendingTitle>
          <PendingCopy>
            {changedModules.length} module
            {changedModules.length === 1 ? '' : 's'} changed locally
            {changedModules.length > 0
              ? `: ${formatChangedModuleLabels(changedModules)}`
              : ''}
            . Review and submit from the Details page.
          </PendingCopy>
        </PendingPanel>
      ) : null}

      {!isCompleted ? (
        <ProvisionPanel>
          {eligibility.allowed ? (
            <>
              <ProvisionCopy>
                Both modules are complete. You can provision this resource to mark it as
                completed.
              </ProvisionCopy>
              <Button type="button" onClick={openProvisionDrawer}>
                Provision resource
              </Button>
            </>
          ) : (
            <>
              <ProvisionCopy id="provision-blocked-reason" role="status">
                {getProvisioningBlockedMessage(eligibility.reason)}
              </ProvisionCopy>
              <Button
                type="button"
                state="disabled"
                aria-describedby="provision-blocked-reason"
              >
                Provision resource
              </Button>
            </>
          )}
        </ProvisionPanel>
      ) : null}

      <Modules>
        <ResourceModuleCard
          title="Basic Info"
          summary={formatBasicInfoModuleSummary(
            isCompleted ? effectiveBasicInfo : serverResource.basicInfo,
          )}
          complete={progress.basicInfoComplete}
          actionLabel={basicInfoActionLabel}
          actionTo={paths.resourceBasicInfo(resourceIdentifier)}
        />
        <ResourceModuleCard
          title="Project Details"
          summary={formatProjectDetailsModuleSummary(
            isCompleted ? effectiveProjectDetails : serverResource.projectDetails,
          )}
          complete={progress.projectDetailsComplete}
          actionLabel={projectDetailsLocked ? undefined : projectDetailsActionLabel}
          actionTo={
            projectDetailsLocked
              ? undefined
              : paths.resourceProjectDetails(resourceIdentifier)
          }
          lockedReason={
            projectDetailsLocked
              ? 'Complete Basic Info before opening Project Details.'
              : undefined
          }
        />
      </Modules>

      <ProvisionResourceDrawer
        resource={serverResource}
        identifier={resourceIdentifier}
        isOpen={isProvisionOpen}
        onClose={() => {
          setIsProvisionOpen(false)
        }}
        onProvisioned={() => {
          setStatusMessage('Resource provisioned successfully. Status is now completed.')
        }}
        onStatusChangedExternally={() => {
          setStatusMessage(
            'This resource was already completed before the action finished. The page now shows the current status.',
          )
        }}
        onResourceMissing={() => {
          queryClient.removeQueries({
            queryKey: resourceQueryKeys.detail(resourceIdentifier),
          })
        }}
        getLatestResource={() => resourceQuery.data}
        refetchResource={refetchResource}
      />
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Modules = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const ProvisionPanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  justify-items: start;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const ProvisionCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.5;
`

const PendingPanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const PendingTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const PendingCopy = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.ink};
  line-height: 1.5;
`
