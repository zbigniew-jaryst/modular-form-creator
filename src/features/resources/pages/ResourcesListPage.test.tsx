import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSearchParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ResourcesListPage } from '../pages/ResourcesListPage'
import type { Resource, ResourceListResponse } from '../model/resource.types'
import { renderWithProviders } from '../test/renderWithProviders'

function createResource(overrides: Partial<Resource> = {}): Resource {
  return {
    resourceId: 1,
    name: 'Alpha Resource',
    status: 'draft',
    basicInfo: {
      resourceName: 'Alpha Resource',
      owner: '',
      email: '',
      description: '',
      priority: '',
    },
    projectDetails: {
      projectName: '',
      budget: '',
      category: '',
      options: [],
    },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  }
}

function createListResponse(
  items: Resource[],
  pagination: Partial<ResourceListResponse['pagination']> = {},
): ResourceListResponse {
  return {
    items,
    pagination: {
      page: 1,
      pageSize: 10,
      totalItems: items.length,
      totalPages: 1,
      ...pagination,
    },
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ResourcesListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders backend resources and statuses', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createListResponse([
          createResource({ resourceId: 1, name: 'Alpha Resource', status: 'draft' }),
          createResource({
            resourceId: 2,
            name: 'Beta Resource',
            status: 'completed',
            basicInfo: {
              resourceName: 'Beta Resource',
              owner: 'Owner',
              email: 'owner@example.com',
              description: 'Ready',
              priority: 'high',
            },
            projectDetails: {
              projectName: 'Project',
              budget: '100',
              category: 'internal',
              options: ['FE devs'],
            },
          }),
        ]),
      ),
    )

    renderWithProviders(<ResourcesListPage />)

    expect(await screen.findByRole('heading', { name: 'Alpha Resource' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Beta Resource' })).toBeInTheDocument()
    expect(screen.getByText('ID 1')).toBeInTheDocument()
    expect(screen.getByText('ID 2')).toBeInTheDocument()
    expect(screen.getByText('Modules 0/2')).toBeInTheDocument()
    expect(screen.getByText('Modules 2/2')).toBeInTheDocument()
  })

  it('shows an initial loading state', async () => {
    const fetchMock = vi.mocked(fetch)
    let resolveFetch: ((value: Response) => void) | undefined
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )

    renderWithProviders(<ResourcesListPage />)

    expect(screen.getByText('Loading resources')).toBeInTheDocument()

    resolveFetch?.(jsonResponse(createListResponse([])))

    expect(await screen.findByText('No resources yet')).toBeInTheDocument()
  })

  it('exposes a retryable error state when the list request fails', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Backend unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse(createListResponse([createResource()])))

    renderWithProviders(<ResourcesListPage />)

    expect(await screen.findByText('Unable to load resources')).toBeInTheDocument()
    expect(screen.getByText('Backend unavailable')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { name: 'Alpha Resource' })).toBeInTheDocument()
  })

  it('validates an invalid resource name before sending a create request', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createListResponse([])))

    renderWithProviders(<ResourcesListPage />)
    await screen.findByText('No resources yet')

    await user.click(screen.getAllByRole('button', { name: 'Create resource' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Create resource' })
    await user.type(within(dialog).getByLabelText('Resource name'), 'Invalid@Name')
    await user.click(within(dialog).getByRole('button', { name: 'Create resource' }))

    expect(
      await within(dialog).findByText(
        'Resource name can contain only letters, numbers, spaces, and hyphens',
      ),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends a trimmed payload on successful creation', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(createListResponse([])))
      .mockResolvedValueOnce(
        jsonResponse(createResource({ name: 'Gamma Resource', resourceId: 3 }), 201),
      )
      .mockResolvedValueOnce(
        jsonResponse(createListResponse([createResource({ name: 'Gamma Resource', resourceId: 3 })])),
      )

    renderWithProviders(<ResourcesListPage />)
    await screen.findByText('No resources yet')

    await user.click(screen.getAllByRole('button', { name: 'Create resource' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Create resource' })
    await user.type(within(dialog).getByLabelText('Resource name'), '  Gamma Resource  ')
    await user.click(within(dialog).getByRole('button', { name: 'Create resource' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/resources'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ resourceName: 'Gamma Resource' }),
        }),
      )
    })

    expect(await screen.findByText(/Created resource/)).toBeInTheDocument()
  })

  it('does not send delete before explicit confirmation', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createListResponse([createResource()])))

    renderWithProviders(<ResourcesListPage />)
    await screen.findByRole('heading', { name: 'Alpha Resource' })

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('dialog', { name: 'Delete resource' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refreshes the resource list after successful deletion', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(createListResponse([createResource()])))
      .mockResolvedValueOnce(jsonResponse(createResource()))
      .mockResolvedValueOnce(jsonResponse(createListResponse([])))

    renderWithProviders(<ResourcesListPage />)
    await screen.findByRole('heading', { name: 'Alpha Resource' })

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete resource' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('No resources yet')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => call[1]?.method === 'DELETE')).toBe(true)
  })

  it('resets page to 1 when a filter changes', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(createListResponse([createResource()], { page: 1 }))),
    )

    renderWithProviders(<ResourcesListPage />, { route: '/resources?page=3' })
    await screen.findByRole('heading', { name: 'Alpha Resource' })

    await user.selectOptions(screen.getByLabelText('Status'), 'draft')

    await waitFor(() => {
      const listUrls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((url) => url.includes('/api/resources?'))
      const latestUrl = listUrls.at(-1) ?? ''
      expect(latestUrl).toContain('page=1')
      expect(latestUrl).toContain('status=draft')
    })
  })

  it('syncs an outdated URL page to the backend pagination page', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          createListResponse([createResource()], {
            page: 1,
            totalPages: 1,
            totalItems: 1,
          }),
        ),
      ),
    )

    function SearchProbe() {
      const [params] = useSearchParams()
      return <div data-testid="search">{params.toString()}</div>
    }

    renderWithProviders(
      <>
        <SearchProbe />
        <ResourcesListPage />
      </>,
      { route: '/resources?page=999' },
    )

    expect(await screen.findByTestId('search')).toHaveTextContent('page=999')
    expect(await screen.findByRole('heading', { name: 'Alpha Resource' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('search')).toHaveTextContent('')
    })
  })
})
