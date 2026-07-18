import { useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { isApiError } from '../../../shared/api/ApiError'
import { paths } from '../../../shared/routing/paths'
import { useResourceQuery } from '../api/resourcesQueries'
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
import { getResourceProgress } from '../model/resourceProgress'

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
  const resourceQuery = useResourceQuery(identifier)

  const notice = (location.state as { moduleSave?: ModuleSaveNotice } | null)?.moduleSave
  const statusMessage = notice ? getModuleSaveSuccessMessage(notice.module) : ''

  if (!identifier) {
    return (
      <ResourcePageState
        title="Invalid resource"
        description="The resource identifier in the URL is not valid. Use a positive numeric ID or a Mongo ObjectId."
      />
    )
  }

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

  return (
    <Page>
      <ResourceHeader resource={resource} />

      <StatusRegion aria-live="polite">
        {statusMessage ? <StatusMessage>{statusMessage}</StatusMessage> : null}
      </StatusRegion>

      <Modules>
        <ResourceModuleCard
          title="Basic Info"
          summary={summarizeBasicInfo(resource)}
          complete={progress.basicInfoComplete}
          actionLabel={basicInfoActionLabel}
          actionTo={paths.resourceBasicInfo(identifier)}
        />
        <ResourceModuleCard
          title="Project Details"
          summary={summarizeProjectDetails(resource)}
          complete={progress.projectDetailsComplete}
          actionLabel={projectDetailsLocked ? undefined : projectDetailsActionLabel}
          actionTo={
            projectDetailsLocked
              ? undefined
              : paths.resourceProjectDetails(identifier)
          }
          lockedReason={
            projectDetailsLocked
              ? 'Complete Basic Info before opening Project Details.'
              : undefined
          }
        />
      </Modules>
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
`

const Modules = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
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
