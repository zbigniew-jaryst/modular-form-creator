import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, Card } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { paths } from '../../../shared/routing/paths'
import {
  useResourceQuery,
  useUpdateProjectDetailsMutation,
} from '../api/resourcesQueries'
import { ProjectDetailsForm } from '../components/ProjectDetailsForm'
import {
  ResourcePageLoading,
  ResourcePageState,
} from '../components/ResourcePageState'
import type { ModuleSaveNotice } from '../model/resourceNavigation'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import { isBasicInfoComplete } from '../model/resourceProgress'
import type { ProjectCategory, TeamMemberOption } from '../model/resource.types'

export function ProjectDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const navigate = useNavigate()
  const resourceQuery = useResourceQuery(identifier)
  const updateMutation = useUpdateProjectDetailsMutation(identifier ?? '')
  const [submitError, setSubmitError] = useState<string | undefined>()

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

  const isCompleted = resource.status === 'completed'
  const basicInfoComplete = isBasicInfoComplete(resource.basicInfo)
  const isLocked = !isCompleted && !basicInfoComplete

  async function handleSubmit(values: {
    projectName: string
    budget: string
    category: ProjectCategory
    options: TeamMemberOption[]
  }) {
    setSubmitError(undefined)

    try {
      await updateMutation.mutateAsync(values)
      const state: { moduleSave: ModuleSaveNotice } = {
        moduleSave: { module: 'project-details' },
      }
      navigate(paths.resource(resourceIdentifier), { replace: true, state })
    } catch (error) {
      if (isApiError(error)) {
        setSubmitError(error.message)
        return
      }
      setSubmitError('Unable to save Project Details. Please try again.')
    }
  }

  return (
    <Page>
      <Header>
        <BackLink to={paths.resource(resourceIdentifier)}>Back to resource</BackLink>
        <Title>Project Details</Title>
        <Description>
          {isCompleted
            ? 'This resource is completed. Module values are shown read-only and cannot be updated through this form.'
            : isLocked
              ? 'Project Details stays locked until Basic Info is complete.'
              : 'Complete the Project Details module for this draft resource.'}
        </Description>
      </Header>

      {isLocked ? (
        <Card variant="elevated">
          <LockedBody>
            <LockedTitle>Project Details is locked</LockedTitle>
            <LockedText>
              Complete Basic Info before you can edit Project Details.
            </LockedText>
            <LockedActions>
              <Button
                type="button"
                onClick={() => navigate(paths.resourceBasicInfo(resourceIdentifier))}
              >
                Open Basic Info
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(paths.resource(resourceIdentifier))}
              >
                Back to resource
              </Button>
            </LockedActions>
          </LockedBody>
        </Card>
      ) : (
        <Card variant="elevated">
          <ProjectDetailsForm
            resource={resource}
            readOnly={isCompleted}
            isSubmitting={updateMutation.isPending}
            submitError={submitError}
            onSubmit={isCompleted ? undefined : handleSubmit}
          />
        </Card>
      )}
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 40rem;
`

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing.sm};
`

const BackLink = styled(Link)`
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

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const LockedBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`

const LockedTitle = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.heading};
  color: ${({ theme }) => theme.colors.inkStrong};
`

const LockedText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const LockedActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`
