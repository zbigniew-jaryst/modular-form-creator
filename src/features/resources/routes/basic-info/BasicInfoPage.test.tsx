import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { stubFetch } from '../../test/support/stubFetch'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
  jsonResponse,
} from '../../test/support/resourceFixtures'
import { renderResourceApp } from '../../test/support/renderResourceApp'

describe('BasicInfoPage', () => {
  stubFetch()


  it('populates the form from existing data and keeps resource name read-only', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo({
            owner: 'Existing Owner',
            email: 'existing@example.com',
            description: 'Existing description',
            priority: 'high',
          }),
        }),
      ),
    )

    renderResourceApp('/resources/1/basic-info')

    expect(await screen.findByDisplayValue('Existing Owner')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alpha Resource')).toHaveAttribute('readonly')
  })

  it('blocks submission for invalid owner, email or description', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1/basic-info')

    await screen.findByRole('button', { name: 'Save Basic Info' })

    await user.type(screen.getByLabelText('Owner'), 'Owner123')
    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Description'), 'Valid description')
    await user.selectOptions(screen.getByLabelText('Priority'), 'low')
    await user.click(screen.getByRole('button', { name: 'Save Basic Info' }))

    expect(await screen.findByText('Owner can contain only letters and spaces')).toBeInTheDocument()
    expect(screen.getByText('Email must be a valid email format')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('submits the complete trimmed payload with canonical resource.name', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const draft = createResource({
      name: 'Canonical Name',
      basicInfo: {
        resourceName: '',
        owner: '',
        email: '',
        description: '',
        priority: '',
      },
    })
    const saved = createResource({
      name: 'Canonical Name',
      basicInfo: createCompleteBasicInfo({
        resourceName: 'Canonical Name',
        owner: 'Jane Owner',
        email: 'jane@example.com',
        description: 'A useful resource',
        priority: 'medium',
      }),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse(draft))
      .mockResolvedValueOnce(jsonResponse(saved))
      .mockResolvedValueOnce(jsonResponse(saved))

    renderResourceApp('/resources/1/basic-info')

    await screen.findByRole('button', { name: 'Save Basic Info' })

    await user.type(screen.getByLabelText('Owner'), '  Jane Owner  ')
    await user.type(screen.getByLabelText('Email'), '  jane@example.com  ')
    await user.type(screen.getByLabelText('Description'), '  A useful resource  ')
    await user.selectOptions(screen.getByLabelText('Priority'), 'medium')
    await user.click(screen.getByRole('button', { name: 'Save Basic Info' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const patchCall = fetchMock.mock.calls[1]
    expect(patchCall?.[0]).toContain('/api/resources/1/basic-info')
    expect(patchCall?.[1]).toMatchObject({ method: 'PATCH' })
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      resourceName: 'Canonical Name',
      owner: 'Jane Owner',
      email: 'jane@example.com',
      description: 'A useful resource',
      priority: 'medium',
    })

    expect(
      await screen.findByText('Basic Info saved successfully.'),
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 2 modules completed')).toBeInTheDocument()
  })

  it('keeps form values visible after a backend failure', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(createResource()))
      .mockResolvedValueOnce(
        jsonResponse({ message: 'Backend rejected Basic Info' }, 400),
      )

    renderResourceApp('/resources/1/basic-info')

    await screen.findByRole('button', { name: 'Save Basic Info' })
    await user.type(screen.getByLabelText('Owner'), 'Jane Owner')
    await user.type(screen.getByLabelText('Email'), 'jane@example.com')
    await user.type(screen.getByLabelText('Description'), 'A useful resource')
    await user.selectOptions(screen.getByLabelText('Priority'), 'low')
    await user.click(screen.getByRole('button', { name: 'Save Basic Info' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Backend rejected Basic Info',
    )
    expect(screen.getByDisplayValue('Jane Owner')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A useful resource')).toBeInTheDocument()
  })

  it('exposes local apply for completed resources without sending PATCH', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          status: 'completed',
          basicInfo: createCompleteBasicInfo(),
          projectDetails: createCompleteProjectDetails(),
        }),
      ),
    )

    renderResourceApp('/resources/1/basic-info')

    expect(await screen.findByDisplayValue('Jane Owner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply changes locally' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save Basic Info' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
