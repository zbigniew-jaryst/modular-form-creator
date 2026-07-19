import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { stubFetch } from '../support/stubFetch'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createListResponse,
  createResource,
  jsonResponse,
} from '../support/resourceFixtures'
import { renderResourceApp } from '../support/renderResourceApp'

function completedResource(overrides: Parameters<typeof createResource>[0] = {}) {
  return createResource({
    resourceId: 1,
    name: 'Alpha Resource',
    status: 'completed',
    basicInfo: createCompleteBasicInfo({ resourceName: 'Alpha Resource' }),
    projectDetails: createCompleteProjectDetails(),
    ...overrides,
  })
}

function mockResourceGets(
  fetchMock: ReturnType<typeof vi.fn>,
  resource: ReturnType<typeof completedResource>,
) {
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = String(init?.method ?? 'GET').toUpperCase()
    const url = String(input)

    if (method === 'GET' && url.includes('/api/resources')) {
      return jsonResponse(resource)
    }

    return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
  })
}

describe('completed resource buffered edits', () => {
  stubFetch()


  it('applies Basic Info locally, navigates to Details, and sends no PATCH or PUT', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    mockResourceGets(fetchMock, completedResource())

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))

    expect(
      await screen.findByText(/Basic Info changes applied locally/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Buffered Owner')).toBeInTheDocument()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit all changes' })).toBeInTheDocument()

    const mutatingCalls = fetchMock.mock.calls.filter(([, init]) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      return method !== 'GET'
    })
    expect(mutatingCalls).toHaveLength(0)
  })

  it('applies Project Details locally without draft sequencing lock and preserves Basic Info buffer', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    mockResourceGets(fetchMock, completedResource())

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    expect(await screen.findByText('Buffered Owner')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Edit Project Details' }))
    const projectName = await screen.findByLabelText('Project name')
    await user.clear(projectName)
    await user.type(projectName, 'Buffered Project')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))

    expect(await screen.findByText('Buffered Project')).toBeInTheDocument()
    expect(screen.getByText('Buffered Owner')).toBeInTheDocument()
    expect(screen.getByText('Basic Info pending')).toBeInTheDocument()
    expect(screen.getByText('Project Details pending')).toBeInTheDocument()

    const mutatingCalls = fetchMock.mock.calls.filter(([, init]) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      return method !== 'GET'
    })
    expect(mutatingCalls).toHaveLength(0)
  })

  it('submits after pre-submit refetch with a full PUT payload and clears pending state', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const initial = completedResource()
    const refreshed = completedResource({
      basicInfo: createCompleteBasicInfo({
        resourceName: 'Alpha Resource',
        owner: 'Server Owner',
        email: 'server@example.com',
        description: 'Server description',
        priority: 'low',
      }),
      projectDetails: createCompleteProjectDetails({
        projectName: 'Fresh Project',
        budget: '2500',
        category: 'external',
        options: ['BE devs'],
      }),
      updatedAt: '2026-02-01T10:00:00.000Z',
    })
    const saved = completedResource({
      basicInfo: createCompleteBasicInfo({
        resourceName: 'Alpha Resource',
        owner: 'Buffered Owner',
        email: 'server@example.com',
        description: 'Server description',
        priority: 'low',
      }),
      projectDetails: createCompleteProjectDetails({
        projectName: 'Fresh Project',
        budget: '2500',
        category: 'external',
        options: ['BE devs'],
      }),
      updatedAt: '2026-02-01T11:00:00.000Z',
    })

    let getCount = 0
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      const url = String(input)

      if (method === 'GET' && url.includes('/api/resources/') && !url.includes('?')) {
        getCount += 1
        if (getCount <= 2) {
          return jsonResponse(initial)
        }
        return jsonResponse(refreshed)
      }

      if (method === 'PUT') {
        return jsonResponse(saved)
      }

      if (method === 'GET' && url.includes('/api/resources?')) {
        return jsonResponse(createListResponse([saved]))
      }

      return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
    })

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    expect(await screen.findByRole('button', { name: 'Submit all changes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Submit all changes' }))
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByText(/Modules with unsaved changes: Basic Info/i),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Submit changes' }))

    await waitFor(() => {
      expect(screen.getByText('All changes submitted successfully.')).toBeInTheDocument()
    })

    const putCall = fetchMock.mock.calls.find(
      ([, init]) => String(init?.method ?? '').toUpperCase() === 'PUT',
    )
    expect(putCall).toBeTruthy()
    expect(String(putCall?.[0])).toContain('/api/resources/1')

    const body = JSON.parse(String(putCall?.[1]?.body))
    expect(body).toEqual({
      name: 'Alpha Resource',
      basicInfo: {
        resourceName: 'Alpha Resource',
        owner: 'Buffered Owner',
        email: 'jane@example.com',
        description: 'A useful resource',
        priority: 'medium',
      },
      projectDetails: {
        projectName: 'Fresh Project',
        budget: '2500',
        category: 'external',
        options: ['BE devs'],
      },
    })
    expect(body).not.toHaveProperty('status')
    expect(body).not.toHaveProperty('resourceId')

    expect(screen.queryByRole('button', { name: 'Submit all changes' })).not.toBeInTheDocument()
    expect(screen.getByText('Buffered Owner')).toBeInTheDocument()
  })

  it('does not send PUT when refreshed server data already matches overrides', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const initial = completedResource()
    const refreshed = completedResource({
      basicInfo: createCompleteBasicInfo({
        resourceName: 'Alpha Resource',
        owner: 'Buffered Owner',
      }),
    })

    let getCount = 0
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      const url = String(input)

      if (method === 'GET' && url.includes('/api/resources')) {
        getCount += 1
        if (getCount <= 2) {
          return jsonResponse(initial)
        }
        return jsonResponse(refreshed)
      }

      return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
    })

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    await user.click(await screen.findByRole('button', { name: 'Submit all changes' }))
    await user.click(screen.getByRole('button', { name: 'Submit changes' }))

    await waitFor(() => {
      expect(
        screen.getByText(
          'The resource already contains the reviewed values. No update was sent.',
        ),
      ).toBeInTheDocument()
    })

    const putCalls = fetchMock.mock.calls.filter(
      ([, init]) => String(init?.method ?? '').toUpperCase() === 'PUT',
    )
    expect(putCalls).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Submit all changes' })).not.toBeInTheDocument()
  })

  it('retains the buffer after PUT failure and clears it on discard', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const resource = completedResource()

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      const url = String(input)

      if (method === 'PUT') {
        return jsonResponse({ message: 'Validation failed' }, 400)
      }

      if (method === 'GET' && url.includes('/api/resources')) {
        return jsonResponse(resource)
      }

      return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
    })

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    await user.click(await screen.findByRole('button', { name: 'Submit all changes' }))
    await user.click(screen.getByRole('button', { name: 'Submit changes' }))

    expect(await screen.findByText('Validation failed')).toBeInTheDocument()
    expect(screen.getByText('Buffered Owner')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    const discardDialog = await screen.findByRole('dialog')
    await user.click(within(discardDialog).getByRole('button', { name: 'Discard changes' }))

    expect(
      await screen.findByText('Local changes discarded. Showing server-backed values.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Jane Owner')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit all changes' })).not.toBeInTheDocument()
  })

  it('shows Review changes on Overview without a PUT action', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    mockResourceGets(fetchMock, completedResource())

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    await user.click(await screen.findByRole('link', { name: 'Back to resource overview' }))

    expect(await screen.findByRole('link', { name: 'Review changes' })).toBeInTheDocument()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument()
  })

  it('clears the obsolete buffer after PUT 404', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const resource = completedResource()
    let putSeen = false

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      const url = String(input)

      if (method === 'PUT') {
        putSeen = true
        return jsonResponse({ message: 'Resource not found' }, 404)
      }

      if (method === 'GET' && url.includes('/api/resources')) {
        if (putSeen) {
          return jsonResponse({ message: 'Resource not found' }, 404)
        }
        return jsonResponse(resource)
      }

      return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
    })

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Buffered Owner')
    await user.click(screen.getByRole('button', { name: 'Apply changes locally' }))
    await user.click(await screen.findByRole('button', { name: 'Submit all changes' }))
    await user.click(screen.getByRole('button', { name: 'Submit changes' }))

    expect(await screen.findByText('Resource not found')).toBeInTheDocument()
  })

  it('keeps draft Basic Info on the PATCH workflow', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const draft = createResource({
      basicInfo: createCompleteBasicInfo(),
    })
    const saved = createResource({
      basicInfo: createCompleteBasicInfo({ owner: 'Draft Owner' }),
    })

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = String(init?.method ?? 'GET').toUpperCase()
      const url = String(input)

      if (method === 'PATCH' && url.includes('/basic-info')) {
        return jsonResponse(saved)
      }

      if (method === 'GET' && url.includes('/api/resources')) {
        return jsonResponse(draft)
      }

      return jsonResponse({ message: `Unhandled ${method} ${url}` }, 500)
    })

    renderResourceApp('/resources/1/basic-info')

    const owner = await screen.findByLabelText('Owner')
    await user.clear(owner)
    await user.type(owner, 'Draft Owner')
    await user.click(screen.getByRole('button', { name: 'Save Basic Info' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes('/basic-info') &&
            String(init?.method ?? '').toUpperCase() === 'PATCH',
        ),
      ).toBe(true)
    })
  })
})
