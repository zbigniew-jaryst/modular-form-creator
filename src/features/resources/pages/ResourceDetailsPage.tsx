import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button, Card } from '../../../design-system'
import { paths } from '../../../shared/routing/paths'
import { resourceKeys } from '../api/resourceKeys'
import { useResourceQuery } from '../api/resourcesQueries'
import { DiscardCompletedChangesDrawer } from '../components/DiscardCompletedChangesDrawer'
import { resolveResourceDetailLoad } from '../components/resolveResourceDetailLoad'
import { ResourceStatusBadge } from '../components/ResourceStatusBadge'
import { ResourceSummary } from '../components/ResourceSummary'
import { StatusLiveRegion } from '../components/StatusLiveRegion'
import { SubmitCompletedChangesDrawer } from '../components/SubmitCompletedChangesDrawer'
import { useCompletedResourceDrafts } from '../completed-edits/CompletedResourceDraftsProvider'
import {
  getChangedModules,
  getEffectiveBasicInfo,
  getEffectiveProjectDetails,
  hasEffectivePendingChanges,
} from '../completed-edits/completedResourceDraft.helpers'
import { useReconcileCompletedDraft } from '../completed-edits/useReconcileCompletedDraft'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import {
  getLocalApplySuccessMessage,
  getPendingModuleBadgeLabel,
  type LocalApplyNotice,
} from '../model/resourceNavigation'
import { getProvisioningEligibility } from '../model/resourceProvisioning'
import { getResourceProgress } from '../model/resourceProgress'

export function ResourceDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resourceQuery = useResourceQuery(identifier)
  const drafts = useCompletedResourceDrafts()

  const localApplyNotice = (
    location.state as { localApply?: LocalApplyNotice } | null
  )?.localApply

  const [statusMessage, setStatusMessage] = useState(() =>
    localApplyNotice ? getLocalApplySuccessMessage(localApplyNotice.module) : '',
  )
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)

  useReconcileCompletedDraft(resourceQuery.data)

  useEffect(() => {
    if (!localApplyNotice || !identifier) {
      return
    }

    navigate(paths.resourceDetails(identifier), { replace: true, state: null })
  }, [localApplyNotice, identifier, navigate])

  const load = resolveResourceDetailLoad(identifier, resourceQuery)
  if (load.kind === 'blocked') {
    return load.node
  }

  const { identifier: resourceIdentifier, serverResource } = load
  const resourceDraft = drafts.getDraft(serverResource.resourceId)
  const changedModules = getChangedModules(serverResource, resourceDraft)
  const hasPending = hasEffectivePendingChanges(serverResource, resourceDraft)
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, resourceDraft)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    resourceDraft,
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
        <NavRow>
          <TextLink to={paths.resource(resourceIdentifier)}>Back to resource</TextLink>
          <TextLink to={paths.resources}>Back to resources</TextLink>
        </NavRow>
        <Title>Resource details</Title>
        <MetaRow>
          <ResourceName>{serverResource.name}</ResourceName>
          <MetaItem>ID {serverResource.resourceId}</MetaItem>
          <ResourceStatusBadge status={serverResource.status} />
          {isCompleted && hasPending ? (
            <Badge variant="warning">Unsaved changes</Badge>
          ) : null}
        </MetaRow>
        <ProgressText>
          {progress.completed} of {progress.total} modules completed
        </ProgressText>
      </Header>

      <StatusLiveRegion message={statusMessage} />

      {isCompleted && hasPending ? (
        <Notice role="status">
          You have unsaved changes stored only in this browser session. Review them below,
          then submit or discard from this page.
        </Notice>
      ) : null}

      {isCompleted && !hasPending ? (
        <Notice role="status">
          This resource is completed. You can edit modules locally and submit all changes
          from this page.
        </Notice>
      ) : null}

      {isReadyDraft ? (
        <Notice role="status">
          Both modules are complete. This resource is ready for provisioning from the
          resource overview.
        </Notice>
      ) : null}

      {!isCompleted && !isReadyDraft ? (
        <Card variant="outline">
          <IncompletePanel>
            <IncompleteTitle>Modules still needed</IncompleteTitle>
            <IncompleteList>
              {!progress.basicInfoComplete ? (
                <li>
                  <TextLink to={paths.resourceBasicInfo(resourceIdentifier)}>
                    Complete Basic Info
                  </TextLink>
                </li>
              ) : null}
              {!progress.projectDetailsComplete ? (
                <li>
                  {progress.basicInfoComplete ? (
                    <TextLink to={paths.resourceProjectDetails(resourceIdentifier)}>
                      Complete Project Details
                    </TextLink>
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
        <ActionLink to={paths.resource(resourceIdentifier)}>
          Back to resource overview
        </ActionLink>
        {isReadyDraft ? (
          <ActionLink $primary to={paths.resource(resourceIdentifier)}>
            Go to overview to provision
          </ActionLink>
        ) : null}
        {isCompleted ? (
          <>
            <ActionLink to={paths.resourceBasicInfo(resourceIdentifier)}>
              Edit Basic Info
            </ActionLink>
            <ActionLink to={paths.resourceProjectDetails(resourceIdentifier)}>
              Edit Project Details
            </ActionLink>
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
                queryKey: resourceKeys.detail(resourceIdentifier),
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
              drafts.clearDraft(serverResource.resourceId)
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

const NavRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const TextLink = styled(Link)`
  width: fit-content;
  color: ${({ theme }) => theme.colors.primaryStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ResourceName = styled.p`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.inkStrong};
  overflow-wrap: anywhere;
`

const MetaItem = styled.span`
  color: ${({ theme }) => theme.colors.inkMuted};
`

const ProgressText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Notice = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.inkStrong};
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

const ActionLink = styled(Link)<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, $primary }) =>
      $primary ? theme.colors.primaryStrong : theme.colors.border};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.primaryStrong : theme.colors.surface};
  color: ${({ theme, $primary }) =>
    $primary ? theme.colors.surface : theme.colors.inkStrong};
  text-decoration: none;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryStrong};
    outline-offset: 2px;
  }
`
