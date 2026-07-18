import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Card } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { paths } from '../../../shared/routing/paths'
import {
  useResourceQuery,
  useUpdateBasicInfoMutation,
} from '../api/resourcesQueries'
import { BasicInfoForm } from '../components/BasicInfoForm'
import { resolveResourceDetailLoad } from '../components/resolveResourceDetailLoad'
import { useCompletedResourceDrafts } from '../completed-edits/CompletedResourceDraftsProvider'
import { getEffectiveBasicInfo } from '../completed-edits/completedResourceDraft.helpers'
import { useBeforeUnloadWarning } from '../completed-edits/useBeforeUnloadWarning'
import { useReconcileCompletedDraft } from '../completed-edits/useReconcileCompletedDraft'
import type { LocalApplyNotice, ModuleSaveNotice } from '../model/resourceNavigation'
import { parseResourceIdentifier } from '../model/resourceIdentifier'
import type { Priority } from '../model/resource.types'

export function BasicInfoPage() {
  const { resourceId } = useParams()
  const identifier = parseResourceIdentifier(resourceId)
  const navigate = useNavigate()
  const resourceQuery = useResourceQuery(identifier)
  const updateMutation = useUpdateBasicInfoMutation(identifier ?? '')
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
  const resourceDraft = drafts.getDraft(currentResource.resourceId)
  const effectiveBasicInfo = getEffectiveBasicInfo(currentResource, resourceDraft)
  const resourceName = currentResource.name
  const completed = currentResource.status === 'completed'

  async function handleDraftSubmit(values: {
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
      const state: { moduleSave: ModuleSaveNotice } = {
        moduleSave: { module: 'basic-info' },
      }
      navigate(paths.resource(resourceIdentifier), { replace: true, state })
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
    drafts.applyBasicInfo(currentResource, values)
    const state: { localApply: LocalApplyNotice } = {
      localApply: { module: 'basic-info' },
    }
    navigate(paths.resourceDetails(resourceIdentifier), { replace: true, state })
  }

  return (
    <Page>
      <Header>
        <BackLink to={paths.resource(resourceIdentifier)}>Back to resource</BackLink>
        <Title>Basic Info</Title>
        <Description>
          {completed
            ? 'Edit Basic Info locally. Changes stay in this browser session until you submit them from the Details page.'
            : 'Complete the Basic Info module for this draft resource.'}
        </Description>
      </Header>

      <Card variant="elevated">
        <BasicInfoForm
          resource={currentResource}
          initialValues={completed ? effectiveBasicInfo : undefined}
          isSubmitting={!completed && updateMutation.isPending}
          submitLabel={completed ? 'Apply changes locally' : 'Save Basic Info'}
          submittingLabel={completed ? 'Applying…' : 'Saving…'}
          submitError={submitError}
          onDirtyChange={completed ? handleDirtyChange : undefined}
          onSubmit={completed ? handleCompletedApply : handleDraftSubmit}
        />
      </Card>
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
