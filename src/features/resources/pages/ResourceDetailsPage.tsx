import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Badge, Card } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { paths } from '../../../shared/routing/paths'
import { useResourceQuery } from '../api/resourcesQueries'
import {
  ResourcePageLoading,
  ResourcePageState,
} from '../components/ResourcePageState'
import { ResourceStatusBadge } from '../components/ResourceStatusBadge'
import { ResourceSummary } from '../components/ResourceSummary'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import { getProvisioningEligibility } from '../model/resourceProvisioning'
import { getResourceProgress } from '../model/resourceProgress'

export function ResourceDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const resourceQuery = useResourceQuery(identifier)

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
  const eligibility = getProvisioningEligibility(resource)
  const isCompleted = resource.status === 'completed'
  const isReadyDraft = eligibility.allowed

  return (
    <Page>
      <Header>
        <NavRow>
          <TextLink to={paths.resource(identifier)}>Back to resource</TextLink>
          <TextLink to={paths.resources}>Back to resources</TextLink>
        </NavRow>
        <Title>Resource details</Title>
        <MetaRow>
          <ResourceName>{resource.name}</ResourceName>
          <MetaItem>ID {resource.resourceId}</MetaItem>
          <ResourceStatusBadge status={resource.status} />
        </MetaRow>
        <ProgressText>
          {progress.completed} of {progress.total} modules completed
        </ProgressText>
      </Header>

      {isCompleted ? (
        <Notice role="status">
          This resource is completed. Module information is shown in read-only mode.
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
                  <TextLink to={paths.resourceBasicInfo(identifier)}>
                    Complete Basic Info
                  </TextLink>
                </li>
              ) : null}
              {!progress.projectDetailsComplete ? (
                <li>
                  {progress.basicInfoComplete ? (
                    <TextLink to={paths.resourceProjectDetails(identifier)}>
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
      </ModuleOverview>

      <ResourceSummary resource={resource} />

      <Actions>
        <ActionLink to={paths.resource(identifier)}>Back to resource overview</ActionLink>
        {isReadyDraft ? (
          <ActionLink $primary to={paths.resource(identifier)}>
            Go to overview to provision
          </ActionLink>
        ) : null}
        {isCompleted ? (
          <>
            <ActionLink to={paths.resourceBasicInfo(identifier)}>
              Review Basic Info
            </ActionLink>
            <ActionLink to={paths.resourceProjectDetails(identifier)}>
              Review Project Details
            </ActionLink>
          </>
        ) : null}
      </Actions>
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
