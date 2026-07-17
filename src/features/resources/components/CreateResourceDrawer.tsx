import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Button, Drawer, Input } from '../../../design-system'
import { isApiError } from '../../../shared/api/ApiError'
import { useCreateResourceMutation } from '../api/resourcesQueries'
import { normalizeResourceName, validateResourceName } from '../model/resourceValidation'

type CreateResourceDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (resourceName: string) => void
}

export function CreateResourceDrawer({
  isOpen,
  onClose,
  onCreated,
}: CreateResourceDrawerProps) {
  const [resourceName, setResourceName] = useState('')
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const createMutation = useCreateResourceMutation()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateResourceName(resourceName)
    if (validationError) {
      setFieldError(validationError)
      setSubmitError(undefined)
      return
    }

    const trimmedName = normalizeResourceName(resourceName)
    setFieldError(undefined)
    setSubmitError(undefined)

    try {
      await createMutation.mutateAsync({ resourceName: trimmedName })
      onCreated(trimmedName)
      onClose()
    } catch (error) {
      if (isApiError(error)) {
        setSubmitError(error.message)
        return
      }
      setSubmitError('Unable to create the resource. Please try again.')
    }
  }

  return (
    <Drawer title="Create resource" isOpen={isOpen} onClose={onClose}>
      <Form onSubmit={handleSubmit}>
        <Intro>
          Enter a resource name. Names must be unique and can include letters, numbers,
          spaces, and hyphens.
        </Intro>
        <Input
          label="Resource name"
          name="resourceName"
          value={resourceName}
          onChange={(event) => {
            setResourceName(event.target.value)
            if (fieldError) {
              setFieldError(undefined)
            }
          }}
          error={fieldError}
          state={createMutation.isPending ? 'disabled' : 'normal'}
          autoComplete="off"
        />
        {submitError ? <ErrorText role="alert">{submitError}</ErrorText> : null}
        <Actions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create resource'}
          </Button>
        </Actions>
      </Form>
    </Drawer>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Intro = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.warning};
`
