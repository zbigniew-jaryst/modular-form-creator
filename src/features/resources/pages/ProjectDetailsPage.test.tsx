import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
  jsonResponse,
} from '../test/resourceFixtures'
import { renderResourceApp } from '../test/renderWithProviders'

describe('ProjectDetailsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('blocks direct route access when Basic Info is incomplete without PATCH', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1/project-details')

    expect(
      await screen.findByRole('heading', { name: 'Project Details is locked' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save Project Details' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('project-details')
  })

  it('rejects non-digit budget and missing team members', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
        }),
      ),
    )

    renderResourceApp('/resources/1/project-details')

    await screen.findByRole('button', { name: 'Save Project Details' })
    await user.type(screen.getByLabelText('Project name'), 'Alpha Project')
    await user.type(screen.getByLabelText('Budget'), '12.5')
    await user.selectOptions(screen.getByLabelText('Category'), 'internal')
    await user.click(screen.getByRole('button', { name: 'Save Project Details' }))

    expect(await screen.findByText('Budget must contain digits only')).toBeInTheDocument()
    expect(screen.getByText('At least one team member is required')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('submits the complete normalized payload and updates progress', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const withBasicInfo = createResource({
      basicInfo: createCompleteBasicInfo(),
    })
    const saved = createResource({
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse(withBasicInfo))
      .mockResolvedValueOnce(jsonResponse(saved))
      .mockResolvedValueOnce(jsonResponse(saved))

    renderResourceApp('/resources/1/project-details')

    await screen.findByRole('button', { name: 'Save Project Details' })
    await user.type(screen.getByLabelText('Project name'), '  Alpha Project  ')
    await user.type(screen.getByLabelText('Budget'), ' 1000 ')
    await user.selectOptions(screen.getByLabelText('Category'), 'internal')
    await user.click(screen.getByLabelText('FE devs'))
    await user.click(screen.getByLabelText('Designer'))
    await user.click(screen.getByRole('button', { name: 'Save Project Details' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    const patchCall = fetchMock.mock.calls[1]
    expect(patchCall?.[0]).toContain('/api/resources/1/project-details')
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      projectName: 'Alpha Project',
      budget: '1000',
      category: 'internal',
      options: ['FE devs', 'Designer'],
    })

    expect(
      await screen.findByText('Project Details saved successfully.'),
    ).toBeInTheDocument()
    expect(screen.getByText('2 of 2 modules completed')).toBeInTheDocument()
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

    renderResourceApp('/resources/1/project-details')

    expect(await screen.findByDisplayValue('Alpha Project')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Apply changes locally' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save Project Details' }),
    ).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
