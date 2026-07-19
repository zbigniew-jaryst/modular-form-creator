import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import styled from 'styled-components'
import { Button, CheckboxGroup, Input, Select } from '../../../../design-system'
import type { ProjectDetailsUpdatePayload } from '../../domain/resource.types'
import {
  PROJECT_CATEGORIES,
  TEAM_MEMBER_OPTIONS,
} from '../../domain/resourceModuleOptions'
import type {
  ProjectCategory,
  ProjectDetailsFormValues,
  Resource,
  TeamMemberOption,
} from '../../domain/resource.types'
import {
  normalizeProjectDetailsPayload,
  validateBudget,
  validateCategory,
  validateProjectName,
  validateTeamMemberOptions,
} from '../../domain/resourceModuleValidation'

const CATEGORY_OPTIONS = PROJECT_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))

type ProjectDetailsFormProps = {
  resource: Resource
  initialValues?: ProjectDetailsUpdatePayload
  readOnly?: boolean
  isSubmitting?: boolean
  submitLabel?: string
  submittingLabel?: string
  submitError?: string
  onDirtyChange?: (dirty: boolean) => void
  onSubmit?: (values: {
    projectName: string
    budget: string
    category: ProjectCategory
    options: TeamMemberOption[]
  }) => Promise<void> | void
}

function toFormValues(
  resource: Resource,
  initialValues?: ProjectDetailsUpdatePayload,
): ProjectDetailsFormValues {
  const category = initialValues?.category ?? resource.projectDetails.category
  const rawOptions = initialValues?.options ?? resource.projectDetails.options
  // Canonical TEAM_MEMBER_OPTIONS order keeps valuesKey stable across refetches.
  const options = TEAM_MEMBER_OPTIONS.filter((option) =>
    rawOptions.includes(option),
  )

  return {
    projectName: initialValues?.projectName ?? resource.projectDetails.projectName,
    budget: initialValues?.budget ?? resource.projectDetails.budget,
    category:
      category === 'internal' || category === 'external' || category === 'vendor'
        ? category
        : '',
    options,
  }
}

export function ProjectDetailsForm({
  resource,
  initialValues,
  readOnly = false,
  isSubmitting = false,
  submitLabel = 'Save Project Details',
  submittingLabel = 'Saving…',
  submitError,
  onDirtyChange,
  onSubmit,
}: ProjectDetailsFormProps) {
  const formValues = toFormValues(resource, initialValues)
  const valuesKey = [
    formValues.projectName,
    formValues.budget,
    formValues.category,
    formValues.options.join(','),
    resource.resourceId,
  ].join('\u0000')

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setFocus,
  } = useForm<ProjectDetailsFormValues>({
    defaultValues: formValues,
    mode: 'onSubmit',
  })

  useEffect(() => {
    reset(toFormValues(resource, initialValues))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity change only
  }, [resource.resourceId, reset])

  useEffect(() => {
    if (isDirty) {
      return
    }
    reset(toFormValues(resource, initialValues))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- valuesKey is the content fingerprint
  }, [valuesKey, isDirty, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  async function submit(values: ProjectDetailsFormValues) {
    if (!onSubmit) {
      return
    }

    const normalized = normalizeProjectDetailsPayload(values)
    await onSubmit(normalized)
  }

  function onInvalid() {
    if (errors.projectName) {
      setFocus('projectName')
      return
    }
    if (errors.budget) {
      setFocus('budget')
      return
    }
    if (errors.category) {
      setFocus('category')
      return
    }
    if (errors.options) {
      setFocus('options')
    }
  }

  const fieldState = readOnly || isSubmitting ? 'disabled' : 'normal'

  return (
    <Form
      onSubmit={handleSubmit((values) => void submit(values), onInvalid)}
      noValidate
    >
      <Input
        label="Project name"
        {...register('projectName', {
          validate: validateProjectName,
        })}
        error={errors.projectName?.message}
        state={fieldState}
        autoComplete="off"
      />

      <Input
        label="Budget"
        inputMode="numeric"
        {...register('budget', {
          validate: validateBudget,
        })}
        error={errors.budget?.message}
        state={fieldState}
        helperText="Enter digits only."
      />

      <Controller
        name="category"
        control={control}
        rules={{ validate: validateCategory }}
        render={({ field }) => (
          <Select
            label="Category"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            options={[{ value: '', label: 'Select category' }, ...CATEGORY_OPTIONS]}
            error={errors.category?.message}
            state={fieldState}
          />
        )}
      />

      <Controller
        name="options"
        control={control}
        rules={{ validate: validateTeamMemberOptions }}
        render={({ field }) => (
          <CheckboxGroup
            label="Team members"
            options={[...TEAM_MEMBER_OPTIONS]}
            value={field.value}
            onChange={field.onChange}
            error={errors.options?.message}
            disabled={readOnly || isSubmitting}
          />
        )}
      />

      {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}

      {!readOnly ? (
        <Actions>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </Actions>
      ) : null}
    </Form>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
`
