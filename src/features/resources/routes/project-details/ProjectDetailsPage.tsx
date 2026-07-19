import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import { paths } from '../../../../shared/routing/paths'
import {
  useResourceQuery,
  useUpdateProjectDetailsMutation,
} from '../../api/resourceQueries'
import { ModuleEditPageLayout } from '../shared/ModuleEditPageLayout'
import { ProjectDetailsForm } from './ProjectDetailsForm'
import { ProjectDetailsLockedView } from './ProjectDetailsLockedView'
import { ResourcePageStateView } from '../shared/ResourcePageStateView'
import { resolveResourcePageState } from '../shared/resolveResourcePageState'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { getEffectiveProjectDetails } from '../../state/completed-edits/completedResourceEdits.selectors'
import { useReconcileCompletedEdits } from '../../state/completed-edits/useReconcileCompletedEdits'
import { useUnsavedChangesWarning } from '../../state/completed-edits/useUnsavedChangesWarning'
import {
  createLocalApplyNotice,
  createModuleSaveNotice,
} from '../shared/resourceNotices'
import { parseResourceIdentifier } from '../../domain/resourceIdentifier'
import { isProjectDetailsLocked } from '../../domain/resourceProgress'
import type { ProjectCategory, TeamMemberOption } from '../../domain/resource.types'

export function ProjectDetailsPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const navigate = useNavigate()
  const resourceQuery = useResourceQuery(identifier)
  const updateMutation = useUpdateProjectDetailsMutation(identifier ?? '')
  const completedEdits = useCompletedResourceEdits()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [isFormDirty, setIsFormDirty] = useState(false)

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsFormDirty(dirty)
  }, [])

  const serverResource = resourceQuery.data
  const isCompletedResource = serverResource?.status === 'completed'
  useUnsavedChangesWarning(Boolean(isCompletedResource && isFormDirty))
  useReconcileCompletedEdits(serverResource)

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

  const { identifier: resourceIdentifier, serverResource: currentResource } = pageState
  const isCompleted = currentResource.status === 'completed'
  const isLocked = isProjectDetailsLocked(currentResource)
  const bufferedEdits = completedEdits.getBufferedEdits(currentResource.resourceId)
  const effectiveProjectDetails = getEffectiveProjectDetails(
    currentResource,
    bufferedEdits,
  )

  async function handlePersistProjectDetails(values: {
    projectName: string
    budget: string
    category: ProjectCategory
    options: TeamMemberOption[]
  }) {
    setSubmitError(undefined)

    try {
      await updateMutation.mutateAsync(values)
      navigate(paths.resource(resourceIdentifier), {
        replace: true,
        state: createModuleSaveNotice('project-details'),
      })
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
    flushSync(() => {
      setIsFormDirty(false)
    })
    completedEdits.applyProjectDetails(currentResource, values)
    navigate(paths.resourceDetails(resourceIdentifier), {
      replace: true,
      state: createLocalApplyNotice('project-details'),
    })
  }

  const description = isCompleted
    ? 'Edit Project Details locally. Changes stay in this browser session until you submit them from the Details page.'
    : isLocked
      ? 'Project Details stays locked until Basic Info is complete.'
      : 'Complete the Project Details module for this draft resource.'

  return (
    <ModuleEditPageLayout
      backTo={paths.resource(resourceIdentifier)}
      title="Project Details"
      description={description}
    >
      {isLocked ? (
        <ProjectDetailsLockedView
          onOpenBasicInfo={() => navigate(paths.resourceBasicInfo(resourceIdentifier))}
          onBackToResource={() => navigate(paths.resource(resourceIdentifier))}
        />
      ) : (
        <Card variant="elevated">
          <ProjectDetailsForm
            resource={currentResource}
            initialValues={isCompleted ? effectiveProjectDetails : undefined}
            isSubmitting={!isCompleted && updateMutation.isPending}
            submitLabel={isCompleted ? 'Apply changes locally' : 'Save Project Details'}
            submittingLabel={isCompleted ? 'Applying…' : 'Saving…'}
            submitError={submitError}
            onDirtyChange={isCompleted ? handleDirtyChange : undefined}
            onSubmit={isCompleted ? handleCompletedApply : handlePersistProjectDetails}
          />
        </Card>
      )}
    </ModuleEditPageLayout>
  )
}
