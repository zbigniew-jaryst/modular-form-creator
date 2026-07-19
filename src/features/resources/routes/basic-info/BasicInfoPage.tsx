import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../../../../design-system'
import { isApiError } from '../../../../shared/api/ApiError'
import { paths } from '../../../../shared/routing/paths'
import {
  useResourceQuery,
  useUpdateBasicInfoMutation,
} from '../../api/resourceQueries'
import { BasicInfoForm } from './BasicInfoForm'
import { ModuleEditPageLayout } from '../shared/ModuleEditPageLayout'
import { ResourcePageStateView } from '../shared/ResourcePageStateView'
import { resolveResourcePageState } from '../shared/resolveResourcePageState'
import { useCompletedResourceEdits } from '../../state/completed-edits/CompletedResourceEditsProvider'
import { getEffectiveBasicInfo } from '../../state/completed-edits/completedResourceEdits.selectors'
import { useReconcileCompletedEdits } from '../../state/completed-edits/useReconcileCompletedEdits'
import { useUnsavedChangesWarning } from '../../state/completed-edits/useUnsavedChangesWarning'
import {
  createLocalApplyNotice,
  createModuleSaveNotice,
} from '../shared/resourceNotices'
import { parseResourceIdentifier } from '../../domain/resourceIdentifier'
import type { Priority } from '../../domain/resource.types'

export function BasicInfoPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const navigate = useNavigate()
  const resourceQuery = useResourceQuery(identifier)
  const updateMutation = useUpdateBasicInfoMutation(identifier ?? '')
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
  const bufferedEdits = completedEdits.getBufferedEdits(currentResource.resourceId)
  const effectiveBasicInfo = getEffectiveBasicInfo(currentResource, bufferedEdits)
  const resourceName = currentResource.name
  const isCompleted = currentResource.status === 'completed'

  async function handlePersistBasicInfo(values: {
    owner: string
    email: string
    description: string
    priority: Priority
  }) {
    setSubmitError(undefined)

    try {
      await updateMutation.mutateAsync({
        resourceName: resourceName,
        ...values,
      })
      navigate(paths.resource(resourceIdentifier), {
        replace: true,
        state: createModuleSaveNotice('basic-info'),
      })
    } catch (error) {
      if (isApiError(error)) {
        setSubmitError(error.message)
        return
      }
      setSubmitError('Unable to save Basic Info. Please try again.')
    }
  }

  function handleCompletedApply(values: {
    owner: string
    email: string
    description: string
    priority: Priority
  }) {
    flushSync(() => {
      setIsFormDirty(false)
    })
    completedEdits.applyBasicInfo(currentResource, values)
    navigate(paths.resourceDetails(resourceIdentifier), {
      replace: true,
      state: createLocalApplyNotice('basic-info'),
    })
  }

  return (
    <ModuleEditPageLayout
      backTo={paths.resource(resourceIdentifier)}
      title="Basic Info"
      description={
        isCompleted
          ? 'Edit Basic Info locally. Changes stay in this browser session until you submit them from the Details page.'
          : 'Complete the Basic Info module for this draft resource.'
      }
    >
      <Card variant="elevated">
        <BasicInfoForm
          resource={currentResource}
          initialValues={isCompleted ? effectiveBasicInfo : undefined}
          isSubmitting={!isCompleted && updateMutation.isPending}
          submitLabel={isCompleted ? 'Apply changes locally' : 'Save Basic Info'}
          submittingLabel={isCompleted ? 'Applying…' : 'Saving…'}
          submitError={submitError}
          onDirtyChange={isCompleted ? handleDirtyChange : undefined}
          onSubmit={isCompleted ? handleCompletedApply : handlePersistBasicInfo}
        />
      </Card>
    </ModuleEditPageLayout>
  )
}
