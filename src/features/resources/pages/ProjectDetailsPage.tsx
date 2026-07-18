import { useCallback, useState } from 'react'
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
import { resolveResourceDetailLoad } from '../components/resolveResourceDetailLoad'
import { useCompletedResourceDrafts } from '../completed-edits/CompletedResourceDraftsProvider'
import { getEffectiveProjectDetails } from '../completed-edits/completedResourceDraft.helpers'
import { useBeforeUnloadWarning } from '../completed-edits/useBeforeUnloadWarning'
import { useReconcileCompletedDraft } from '../completed-edits/useReconcileCompletedDraft'
import type { LocalApplyNotice, ModuleSaveNotice } from '../model/resourceNavigation'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import { isBasicInfoComplete } from '../model/resourceProgress'
import type { ProjectCategory, TeamMemberOption } from '../model/resource.types'

export function ProjectDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const navigate = useNavigate()
  const resourceQuery = useResourceQuery(identifier)
  const updateMutation = useUpdateProjectDetailsMutation(identifier ?? '')
  const drafts = useCompletedResourceDrafts()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isFormDirty, setIsFormDirty] = useState(false)

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsFormDirty(dirty)
  }, [])

  const serverResource = resourceQuery.data
  const isCompleted = serverResource?.status === 'completed'
  useBeforeUnloadWarning(
    Boolean(isCompleted && isFormDirty && !drafts.hasAnyPendingChanges),
  )
  useReconcileCompletedDraft(serverResource)

  const load = resolveResourceDetailLoad(identifier, resourceQuery)
  if (load.kind === 'blocked') {
    return load.node
  }

  const { identifier: resourceIdentifier, serverResource: currentResource } = load
  const completed = currentResource.status === 'completed'
  const basicInfoComplete = isBasicInfoComplete(currentResource.basicInfo)
  const isLocked = !completed && !basicInfoComplete
  const resourceDraft = drafts.getDraft(currentResource.resourceId)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    currentResource,
    resourceDraft,
  )

  async function handleDraftSubmit(values: {
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

  function handleCompletedApply(values: {
    projectName: string
    budget: string
    category: ProjectCategory
    options: TeamMemberOption[]
  }) {
    drafts.applyProjectDetails(currentResource, values)
    const state: { localApply: LocalApplyNotice } = {
      localApply: { module: 'project-details' },
    }
    navigate(paths.resourceDetails(resourceIdentifier), { replace: true, state })
  }

  return (
    <Page>
      <Header>
        <BackLink to={paths.resource(resourceIdentifier)}>Back to resource</BackLink>
        <Title>Project Details</Title>
        <Description>
          {completed
            ? 'Edit Project Details locally. Changes stay in this browser session until you submit them from the Details page.'
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
            resource={currentResource}
            initialValues={completed ? effectiveProjectDetails : undefined}
            isSubmitting={!completed && updateMutation.isPending}
            submitLabel={completed ? 'Apply changes locally' : 'Save Project Details'}
            submittingLabel={completed ? 'Applying…' : 'Saving…'}
            submitError={submitError}
            onDirtyChange={completed ? handleDirtyChange : undefined}
            onSubmit={completed ? handleCompletedApply : handleDraftSubmit}
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
