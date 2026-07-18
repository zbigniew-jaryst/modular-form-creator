import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import styled from 'styled-components'
import { Button, Input, Select } from '../../../design-system'
import { PRIORITY_OPTIONS } from '../model/resource.constants'
import type { BasicInfoFormValues, Priority, Resource } from '../model/resource.types'
import {
  normalizeBasicInfoFormValues,
  validateDescription,
  validateEmail,
  validateOwner,
  validatePriority,
} from '../model/resourceModuleValidation'

type BasicInfoFormProps = {
  resource: Resource
  readOnly?: boolean
  isSubmitting?: boolean
  submitError?: string
  onSubmit?: (values: {
    owner: string
    email: string
    description: string
    priority: Priority
  }) => Promise<void> | void
}

function toFormValues(resource: Resource): BasicInfoFormValues {
  const priority = resource.basicInfo.priority
  return {
    owner: resource.basicInfo.owner,
    email: resource.basicInfo.email,
    description: resource.basicInfo.description,
    priority:
      priority === 'low' || priority === 'medium' || priority === 'high' ? priority : '',
  }
}

export function BasicInfoForm({
  resource,
  readOnly = false,
  isSubmitting = false,
  submitError,
  onSubmit,
}: BasicInfoFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setFocus,
  } = useForm<BasicInfoFormValues>({
    defaultValues: toFormValues(resource),
    mode: 'onSubmit',
  })

  useEffect(() => {
    reset(toFormValues(resource))
  }, [resource, reset])

  async function submit(values: BasicInfoFormValues) {
    if (!onSubmit) {
      return
    }

    const normalized = normalizeBasicInfoFormValues(values)
    await onSubmit(normalized)
  }

  function onInvalid() {
    if (errors.owner) {
      setFocus('owner')
      return
    }
    if (errors.email) {
      setFocus('email')
      return
    }
    if (errors.description) {
      setFocus('description')
      return
    }
    if (errors.priority) {
      setFocus('priority')
    }
  }

  const fieldState = readOnly || isSubmitting ? 'disabled' : 'normal'

  return (
    <Form
      onSubmit={handleSubmit((values) => void submit(values), onInvalid)}
      noValidate
    >
      <Input
        label="Resource name"
        name="resourceName"
        value={resource.name}
        readOnly
        state="locked"
        helperText="Resource name is set at creation and cannot be changed."
      />

      <Input
        label="Owner"
        {...register('owner', {
          validate: validateOwner,
        })}
        error={errors.owner?.message}
        state={fieldState}
        autoComplete="name"
      />

      <Input
        label="Email"
        type="email"
        {...register('email', {
          validate: validateEmail,
        })}
        error={errors.email?.message}
        state={fieldState}
        autoComplete="email"
      />

      <Input
        label="Description"
        multiline
        rows={4}
        {...register('description', {
          validate: validateDescription,
        })}
        error={errors.description?.message}
        state={fieldState}
      />

      <Controller
        name="priority"
        control={control}
        rules={{ validate: validatePriority }}
        render={({ field }) => (
          <Select
            label="Priority"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            options={[{ value: '', label: 'Select priority' }, ...PRIORITY_OPTIONS]}
            error={errors.priority?.message}
            state={fieldState}
          />
        )}
      />

      {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}

      {!readOnly ? (
        <Actions>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Basic Info'}
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
