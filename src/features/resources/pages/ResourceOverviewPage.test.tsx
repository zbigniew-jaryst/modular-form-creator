import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
  jsonResponse,
} from '../test/resourceFixtures'
import { renderResourceApp } from '../test/renderWithProviders'

describe('ResourceOverviewPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders resource data, status and progress', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
        }),
      ),
    )

    renderResourceApp('/resources/1')

    expect(await screen.findByRole('heading', { name: 'Alpha Resource' })).toBeInTheDocument()
    expect(screen.getByText('ID 1')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 modules completed')).toBeInTheDocument()
  })

  it('keeps Basic Info accessible for a draft resource', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1')

    expect(await screen.findByRole('link', { name: 'Complete module' })).toHaveAttribute(
      'href',
      '/resources/1/basic-info',
    )
  })

  it('visibly locks Project Details when Basic Info is incomplete', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1')

    expect(
      await screen.findByText('Complete Basic Info before opening Project Details.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /project details/i })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Locked' }),
    ).toBeDisabled()
  })

  it('unlocks Project Details when Basic Info is complete', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
        }),
      ),
    )

    renderResourceApp('/resources/1')

    const projectCard = await screen.findByRole('heading', { name: 'Project Details' })
    const card = projectCard.closest('div')?.parentElement
    expect(card).toBeTruthy()
    expect(
      within(card as HTMLElement).getByRole('link', { name: 'Complete module' }),
    ).toHaveAttribute('href', '/resources/1/project-details')
  })

  it('exposes edit module actions for a completed resource without pending changes', async () => {
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

    renderResourceApp('/resources/1')

    const editLinks = await screen.findAllByRole('link', { name: 'Edit module' })
    expect(editLinks).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /provision/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Complete module' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review module' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Review changes' })).not.toBeInTheDocument()
  })

  it('does not invent progress from completed status alone', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          status: 'completed',
          basicInfo: {
            resourceName: 'Alpha Resource',
            owner: '',
            email: '',
            description: '',
            priority: '',
          },
        }),
      ),
    )

    renderResourceApp('/resources/1')

    expect(await screen.findByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('0 of 2 modules completed')).toBeInTheDocument()
  })

  it('renders not-found for a backend 404', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: 'Resource not found' }, 404),
    )

    renderResourceApp('/resources/999')

    expect(await screen.findByRole('heading', { name: 'Resource not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to resources' })).toHaveAttribute(
      'href',
      '/resources',
    )
  })

  it('rejects malformed identifiers without a request', async () => {
    const fetchMock = vi.mocked(fetch)

    renderResourceApp('/resources/not-a-valid-id')

    expect(await screen.findByRole('heading', { name: 'Invalid resource' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('ResourceOverviewPage locked Project Details action count', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not offer Project Details navigation while locked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(createResource()))
    renderResourceApp('/resources/1')
    await screen.findByRole('heading', { name: 'Project Details' })
    expect(screen.getAllByRole('link', { name: 'Complete module' })).toHaveLength(1)
  })
})
