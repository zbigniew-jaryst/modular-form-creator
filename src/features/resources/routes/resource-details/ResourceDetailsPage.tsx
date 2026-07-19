import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../../../../design-system'
import { paths } from '../../../../shared/routing/paths'
import { resourceQueryKeys } from '../../api/resourceQueryKeys'
import { useResourceQuery } from '../../api/resourceQueries'
import { DiscardCompletedChangesDrawer } from './DiscardCompletedChangesDrawer'
import { ResourceActionLink } from '../shared/ResourceActionLink'
import { ResourceTextLink } from '../shared/ResourceTextLink'
import { ResourcePageStateView } from '../shared/ResourcePageStateView'
import { resolveResourcePageState } from '../shared/resolveResourcePageState'
import { ResourceMetadata } from '../../ui/ResourceMetadata'
import { ResourceSummary } from './ResourceSummary'
import { StatusBanner } from '../../ui/StatusBanner'
import { StatusLiveRegion } from '../../ui/StatusLiveRegion'
import { SubmitCompletedChangesDrawer } from './SubmitCompletedChangesDrawer'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { getChangedModules, getEffectiveBasicInfo, getEffectiveProjectDetails, hasEffectivePendingChanges } from '../../state/completed-edits/completedResourceEdits.selectors'
import { useReconcileCompletedEdits } from '../../state/completed-edits/useReconcileCompletedEdits'
import { useConsumeResourceNotice } from '../shared/useConsumeResourceNotice'
import { parseResourceIdentifier } from '../../domain/resourceIdentifier'
import {
  getLocalApplySuccessMessage,
  readLocalApplyNotice,
} from '../shared/resourceNotices'
import { getPendingModuleBadgeLabel } from './pendingModuleBadgeLabel'
import { getProvisioningEligibility } from '../../domain/resourceProvisioning'
import { getResourceProgress } from '../../domain/resourceProgress'

export function ResourceDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const location = useLocation()
  const queryClient = useQueryClient()
  const resourceQuery = useResourceQuery(identifier)
  const completedEdits = useCompletedResourceEdits()

  const localApplyNotice = readLocalApplyNotice(location.state)

  const [statusMessage, setStatusMessage] = useConsumeResourceNotice(
    localApplyNotice,
    (notice) => getLocalApplySuccessMessage(notice.module),
    identifier ? paths.resourceDetails(identifier) : undefined,
  )
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)

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
  const hasPending = hasEffectivePendingChanges(serverResource, bufferedEdits)
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, bufferedEdits)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    bufferedEdits,
  )

  const progress = getResourceProgress(serverResource)
  const eligibility = getProvisioningEligibility(serverResource)
  const isCompleted = serverResource.status === 'completed'
  const isReadyDraft = eligibility.allowed

  async function refetchResource() {
    const result = await resourceQuery.refetch()
    if (result.error) {
      throw result.error
    }
    return result.data
  }

  return (
    <Page>
      <Header>
        <ResourceTextLink to={paths.resources}>Back to resources</ResourceTextLink>
        <Title>Resource details</Title>
        <ResourceName>{serverResource.name}</ResourceName>
        <ResourceMetadata
          resource={serverResource}
          extraMeta={
            isCompleted && hasPending ? (
              <Badge variant="warning">Unsaved changes</Badge>
            ) : null
          }
        />
      </Header>

      <StatusLiveRegion message={statusMessage} />

      {isCompleted && hasPending ? (
        <StatusBanner>
          You have unsaved changes stored only in this browser session. Review them below,
          then submit or discard from this page.
        </StatusBanner>
      ) : null}

      {isCompleted && !hasPending ? (
        <StatusBanner>
          This resource is completed. You can edit modules locally and submit all changes
          from this page.
        </StatusBanner>
      ) : null}

      {isReadyDraft ? (
        <StatusBanner>
          Both modules are complete. This resource is ready for provisioning from the
          resource overview.
        </StatusBanner>
      ) : null}

      {!isCompleted && !isReadyDraft ? (
        <Card variant="outline">
          <IncompletePanel>
            <IncompleteTitle>Modules still needed</IncompleteTitle>
            <IncompleteList>
              {!progress.basicInfoComplete ? (
                <li>
                  <ResourceTextLink to={paths.resourceBasicInfo(resourceIdentifier)}>
                    Complete Basic Info
                  </ResourceTextLink>
                </li>
              ) : null}
              {!progress.projectDetailsComplete ? (
                <li>
                  {progress.basicInfoComplete ? (
                    <ResourceTextLink to={paths.resourceProjectDetails(resourceIdentifier)}>
                      Complete Project Details
                    </ResourceTextLink>
                  ) : (
                    <span>Complete Project Details after Basic Info</span>
                  )}
                </li>
              ) : null}
            </IncompleteList>
          </IncompletePanel>
        </Card>
      ) : null}

      <ModuleOverview>
        <Badge variant={progress.basicInfoComplete ? 'success' : 'warning'}>
          Basic Info: {progress.basicInfoComplete ? 'Complete' : 'Incomplete'}
        </Badge>
        <Badge variant={progress.projectDetailsComplete ? 'success' : 'warning'}>
          Project Details:{' '}
          {progress.projectDetailsComplete ? 'Complete' : 'Incomplete'}
        </Badge>
        {isCompleted && hasPending
          ? changedModules.map((module) => (
              <Badge key={module} variant="warning">
                {getPendingModuleBadgeLabel(module)}
              </Badge>
            ))
          : null}
      </ModuleOverview>

      <ResourceSummary
        serverResource={serverResource}
        effectiveBasicInfo={isCompleted ? effectiveBasicInfo : undefined}
        effectiveProjectDetails={isCompleted ? effectiveProjectDetails : undefined}
        changedModules={isCompleted ? changedModules : []}
        showUnsavedLabels={isCompleted && hasPending}
      />

      <Actions>
        <ResourceActionLink to={paths.resource(resourceIdentifier)}>
          Back to resource overview
        </ResourceActionLink>
        {isReadyDraft ? (
          <ResourceActionLink $primary to={paths.resource(resourceIdentifier)}>
            Go to overview to provision
          </ResourceActionLink>
        ) : null}
        {isCompleted ? (
          <>
            <ResourceActionLink to={paths.resourceBasicInfo(resourceIdentifier)}>
              Edit Basic Info
            </ResourceActionLink>
            <ResourceActionLink to={paths.resourceProjectDetails(resourceIdentifier)}>
              Edit Project Details
            </ResourceActionLink>
            {hasPending ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDiscardOpen(true)
                  }}
                >
                  Discard changes
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsSubmitOpen(true)
                  }}
                >
                  Submit all changes
                </Button>
              </>
            ) : null}
          </>
        ) : null}
      </Actions>

      {isCompleted && hasPending ? (
        <>
          <SubmitCompletedChangesDrawer
            serverResource={serverResource}
            identifier={resourceIdentifier}
            changedModules={changedModules}
            isOpen={isSubmitOpen}
            onClose={() => {
              setIsSubmitOpen(false)
            }}
            onSubmitted={() => {
              setStatusMessage('All changes submitted successfully.')
            }}
            onAlreadyCurrent={() => {
              setStatusMessage(
                'The resource already contains the reviewed values. No update was sent.',
              )
            }}
            onResourceMissing={() => {
              setIsSubmitOpen(false)
              queryClient.removeQueries({
                queryKey: resourceQueryKeys.detail(resourceIdentifier),
              })
            }}
            refetchResource={refetchResource}
          />
          <DiscardCompletedChangesDrawer
            serverResource={serverResource}
            isOpen={isDiscardOpen}
            onClose={() => {
              setIsDiscardOpen(false)
            }}
            onDiscard={() => {
              completedEdits.clearBufferedEdits(serverResource.resourceId)
              setStatusMessage('Local changes discarded. Showing server-backed values.')
            }}
          />
        </>
      ) : null}
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const ResourceName = styled.p`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.inkStrong};
  overflow-wrap: anywhere;
`

const IncompletePanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};
`

const IncompleteTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const IncompleteList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.ink};
`

const ModuleOverview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`
