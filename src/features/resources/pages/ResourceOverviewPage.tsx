import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Button } from '../../../design-system'
import { paths } from '../../../shared/routing/paths'
import { resourceKeys } from '../api/resourceKeys'
import { useResourceQuery } from '../api/resourcesQueries'
import { ProvisionResourceDrawer } from '../components/ProvisionResourceDrawer'
import { resolveResourceDetailLoad } from '../components/resolveResourceDetailLoad'
import { ResourceHeader } from '../components/ResourceHeader'
import { ResourceModuleCard } from '../components/ResourceModuleCard'
import { StatusLiveRegion } from '../components/StatusLiveRegion'
import { useCompletedResourceDrafts } from '../completed-edits/CompletedResourceDraftsProvider'
import {
  getChangedModules,
  getEffectiveBasicInfo,
  getEffectiveProjectDetails,
  hasEffectivePendingChanges,
} from '../completed-edits/completedResourceDraft.helpers'
import { useReconcileCompletedDraft } from '../completed-edits/useReconcileCompletedDraft'
import {
  formatChangedModuleLabels,
  getModuleSaveSuccessMessage,
  type ModuleSaveNotice,
} from '../model/resourceNavigation'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import {
  getProvisioningBlockedMessage,
  getProvisioningEligibility,
} from '../model/resourceProvisioning'
import { getResourceProgress } from '../model/resourceProgress'
import type { Resource } from '../model/resource.types'

function summarizeBasicInfo(basicInfo: {
  owner: string
  email: string
  priority: string
}): string {
  const { owner, email, priority } = basicInfo
  if (!owner && !email && !priority) {
    return 'No Basic Info saved yet.'
  }

  const parts = [
    owner ? `Owner: ${owner}` : null,
    email ? `Email: ${email}` : null,
    priority ? `Priority: ${priority}` : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

function summarizeProjectDetails(projectDetails: {
  projectName: string
  budget: string
  category: string
  options: string[]
}): string {
  const { projectName, budget, category, options } = projectDetails
  if (!projectName && !budget && !category && options.length === 0) {
    return 'No Project Details saved yet.'
  }

  const parts = [
    projectName ? `Project: ${projectName}` : null,
    budget ? `Budget: ${budget}` : null,
    category ? `Category: ${category}` : null,
    options.length > 0 ? `Team: ${options.join(', ')}` : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function ResourceOverviewPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const resourceQuery = useResourceQuery(identifier)
  const drafts = useCompletedResourceDrafts()
  const [isProvisionOpen, setIsProvisionOpen] = useState(false)

  const moduleSaveNotice = (
    location.state as { moduleSave?: ModuleSaveNotice } | null
  )?.moduleSave

  const [statusMessage, setStatusMessage] = useState(() =>
    moduleSaveNotice ? getModuleSaveSuccessMessage(moduleSaveNotice.module) : '',
  )

  useReconcileCompletedDraft(resourceQuery.data)

  useEffect(() => {
    if (!moduleSaveNotice || !identifier) {
      return
    }

    navigate(paths.resource(identifier), { replace: true, state: null })
  }, [moduleSaveNotice, identifier, navigate])

  const load = resolveResourceDetailLoad(identifier, resourceQuery)
  if (load.kind === 'blocked') {
    return load.node
  }

  const { identifier: resourceIdentifier, serverResource } = load
  const resourceDraft = drafts.getDraft(serverResource.resourceId)
  const changedModules = getChangedModules(serverResource, resourceDraft)
  const hasPending =
    serverResource.status === 'completed' &&
    hasEffectivePendingChanges(serverResource, resourceDraft)
  const effectiveBasicInfo = getEffectiveBasicInfo(serverResource, resourceDraft)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    serverResource,
    resourceDraft,
  )

  const progress = getResourceProgress(serverResource)
  const isCompleted = serverResource.status === 'completed'
  const eligibility = getProvisioningEligibility(serverResource)
  const basicInfoActionLabel = isCompleted
    ? 'Edit module'
    : progress.basicInfoComplete
      ? 'Edit module'
      : 'Complete module'
  const projectDetailsLocked = !isCompleted && !progress.basicInfoComplete
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
      <ResourceHeader resource={serverResource} />

      <ActionsRow>
        <DetailsLink to={paths.resourceDetails(resourceIdentifier)}>
          View details
        </DetailsLink>
        {hasPending ? (
          <DetailsLink $primary to={paths.resourceDetails(resourceIdentifier)}>
            Review changes
          </DetailsLink>
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
              <ProvisionCopy role="status">
                {getProvisioningBlockedMessage(eligibility.reason)}
              </ProvisionCopy>
              <Button type="button" state="disabled">
                Provision resource
              </Button>
            </>
          )}
        </ProvisionPanel>
      ) : null}

      <Modules>
        <ResourceModuleCard
          title="Basic Info"
          summary={summarizeBasicInfo(
            isCompleted ? effectiveBasicInfo : serverResource.basicInfo,
          )}
          complete={progress.basicInfoComplete}
          actionLabel={basicInfoActionLabel}
          actionTo={paths.resourceBasicInfo(resourceIdentifier)}
        />
        <ResourceModuleCard
          title="Project Details"
          summary={summarizeProjectDetails(
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

      {isProvisionOpen ? (
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
              queryKey: resourceKeys.detail(resourceIdentifier),
            })
          }}
          getLatestResource={() => resourceQuery.data}
          refetchResource={refetchResource}
        />
      ) : null}
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

const DetailsLink = styled(Link)<{ $primary?: boolean }>`
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
