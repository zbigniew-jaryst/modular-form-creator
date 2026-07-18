import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { paths } from '../../../shared/routing/paths'
import { resourceKeys } from '../api/resourceKeys'
import { useResourceQuery } from '../api/resourcesQueries'
import { ProvisionResourceDrawer } from '../components/ProvisionResourceDrawer'
import { ResourceHeader } from '../components/ResourceHeader'
import { ResourceModuleCard } from '../components/ResourceModuleCard'
import {
  ResourcePageLoading,
  ResourcePageState,
} from '../components/ResourcePageState'
import {
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

function summarizeBasicInfo(resource: {
  basicInfo: {
    owner: string
    email: string
    priority: string
  }
}): string {
  const { owner, email, priority } = resource.basicInfo
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

function summarizeProjectDetails(resource: {
  projectDetails: {
    projectName: string
    budget: string
    category: string
    options: string[]
  }
}): string {
  const { projectName, budget, category, options } = resource.projectDetails
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
  const queryClient = useQueryClient()
  const resourceQuery = useResourceQuery(identifier)
  const [isProvisionOpen, setIsProvisionOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const notice = (location.state as { moduleSave?: ModuleSaveNotice } | null)?.moduleSave
  const moduleSaveMessage = notice ? getModuleSaveSuccessMessage(notice.module) : ''
  const liveMessage = statusMessage || moduleSaveMessage

  if (!identifier) {
    return (
      <ResourcePageState
        title="Invalid resource"
        description="The resource identifier in the URL is not valid. Use a positive numeric ID or a Mongo ObjectId."
      />
    )
  }

  const resourceIdentifier = identifier

  if (resourceQuery.isPending && !resourceQuery.data) {
    return <ResourcePageLoading />
  }

  if (resourceQuery.isError) {
    if (isApiError(resourceQuery.error) && resourceQuery.error.status === 404) {
      return (
        <ResourcePageState
          title="Resource not found"
          description="No resource exists for this identifier. It may have been deleted."
        />
      )
    }

    const message = isApiError(resourceQuery.error)
      ? resourceQuery.error.message
      : 'Something went wrong while loading this resource.'

    return (
      <ResourcePageState
        title="Unable to load resource"
        description={message}
        onRetry={() => {
          void resourceQuery.refetch()
        }}
      />
    )
  }

  const resource = resourceQuery.data
  if (!resource) {
    return <ResourcePageLoading />
  }

  const progress = getResourceProgress(resource)
  const isCompleted = resource.status === 'completed'
  const eligibility = getProvisioningEligibility(resource)
  const basicInfoActionLabel = isCompleted
    ? 'Review module'
    : progress.basicInfoComplete
      ? 'Edit module'
      : 'Complete module'
  const projectDetailsLocked =
    !isCompleted && !progress.basicInfoComplete
  const projectDetailsActionLabel = isCompleted
    ? 'Review module'
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
      <ResourceHeader resource={resource} />

      <ActionsRow>
        <DetailsLink to={paths.resourceDetails(resourceIdentifier)}>
          View details
        </DetailsLink>
      </ActionsRow>

      <StatusRegion aria-live="polite">
        {liveMessage ? <StatusMessage>{liveMessage}</StatusMessage> : null}
      </StatusRegion>

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
          summary={summarizeBasicInfo(resource)}
          complete={progress.basicInfoComplete}
          actionLabel={basicInfoActionLabel}
          actionTo={paths.resourceBasicInfo(resourceIdentifier)}
        />
        <ResourceModuleCard
          title="Project Details"
          summary={summarizeProjectDetails(resource)}
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
          resource={resource}
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

const DetailsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkStrong};
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

const StatusRegion = styled.div`
  min-height: 0;
`

const StatusMessage = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.inkStrong};
`
