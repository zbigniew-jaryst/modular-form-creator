import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createListResponse,
  createResource,
  jsonResponse,
} from '../test/resourceFixtures'
import { renderResourceApp } from '../test/renderWithProviders'

function readyDraft() {
  return createResource({
    basicInfo: createCompleteBasicInfo(),
    projectDetails: createCompleteProjectDetails(),
  })
}

function completedResource() {
  return createResource({
    status: 'completed',
    basicInfo: createCompleteBasicInfo(),
    projectDetails: createCompleteProjectDetails(),
  })
}

describe('ResourceOverviewPage provisioning', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows a visible reason and keeps provision disabled for incomplete drafts', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1')

    expect(
      await screen.findByText('Basic Info must be completed first.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Provision resource' })).toBeDisabled()
    expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes('/provisioning'))).toBe(
      true,
    )
  })

  it('explains Project Details must be completed when Basic Info alone is done', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
        }),
      ),
    )

    renderResourceApp('/resources/1')

    expect(
      await screen.findByText('Project Details must be completed first.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Provision resource' })).toBeDisabled()
  })

  it('exposes Provision resource for a ready draft without sending a request on open', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(readyDraft()))

    renderResourceApp('/resources/1')

    const provisionButton = await screen.findByRole('button', { name: 'Provision resource' })
    expect(provisionButton).toBeEnabled()

    await user.click(provisionButton)

    expect(await screen.findByRole('dialog', { name: 'Provision resource' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes('/provisioning'))).toBe(
      true,
    )
  })

  it('does not send a request when confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(readyDraft()))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog', { name: 'Provision resource' })).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes('/provisioning'))).toBe(
      true,
    )
  })

  it('sends exactly one PATCH with the correct identifier and no request body', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const draft = readyDraft()
    const provisioned = completedResource()

    fetchMock
      .mockResolvedValueOnce(jsonResponse(draft))
      .mockResolvedValueOnce(jsonResponse(provisioned))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.filter((call) => String(call[0]).includes('/provisioning')),
      ).toHaveLength(1)
    })

    const provisionCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes('/api/resources/1/provisioning'),
    )
    expect(provisionCall?.[1]).toMatchObject({ method: 'PATCH' })
    expect(provisionCall?.[1]?.body).toBeUndefined()
  })

  it('prevents a duplicate request while provisioning is pending', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    let resolveProvision: ((value: Response) => void) | undefined

    fetchMock
      .mockResolvedValueOnce(jsonResponse(readyDraft()))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveProvision = resolve
          }),
      )

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    expect(await screen.findByRole('button', { name: 'Provisioning…' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Provisioning…' }))

    expect(
      fetchMock.mock.calls.filter((call) => String(call[0]).includes('/provisioning')),
    ).toHaveLength(1)

    resolveProvision?.(jsonResponse(completedResource()))

    expect(
      await screen.findByText('Resource provisioned successfully. Status is now completed.'),
    ).toBeInTheDocument()
  })

  it('updates the overview to completed and removes the provision action on success', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)

    fetchMock
      .mockResolvedValueOnce(jsonResponse(readyDraft()))
      .mockResolvedValueOnce(jsonResponse(completedResource()))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    expect(await screen.findByText('Completed')).toBeInTheDocument()
    expect(
      screen.getByText('Resource provisioned successfully. Status is now completed.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Provision resource' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Provision resource' })).not.toBeInTheDocument()
  })

  it('refreshes list status after returning to Resources', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const provisioned = completedResource()

    fetchMock
      .mockResolvedValueOnce(jsonResponse(readyDraft()))
      .mockResolvedValueOnce(jsonResponse(provisioned))
      .mockResolvedValueOnce(jsonResponse(createListResponse([provisioned])))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))
    await screen.findByText('Completed')

    await user.click(screen.getByRole('link', { name: 'Back to resources' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            String(call[0]).includes('/api/resources?') &&
            (call[1]?.method === undefined || call[1]?.method === 'GET'),
        ),
      ).toBe(true)
    })

    const listItem = await screen.findByText('Alpha Resource')
    expect(within(listItem.closest('li') ?? listItem.parentElement!).getByText('Completed')).toBeInTheDocument()
  })

  it('keeps a backend provisioning error visible for a remaining draft', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const draft = readyDraft()

    fetchMock
      .mockResolvedValueOnce(jsonResponse(draft))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message:
              'Provisioning is allowed only after Basic Info and Project Details are completed.',
          },
          400,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(draft))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    expect(
      await screen.findByText(
        'Provisioning is allowed only after Basic Info and Project Details are completed.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Provision resource' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Provision' })).toBeEnabled()
  })

  it('reconciles a stale 400 when the resource is already completed without false success', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)

    fetchMock
      .mockResolvedValueOnce(jsonResponse(readyDraft()))
      .mockResolvedValueOnce(
        jsonResponse({ message: 'Completed resource cannot be reprovisioned.' }, 400),
      )
      .mockResolvedValueOnce(jsonResponse(completedResource()))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    expect(
      await screen.findByText(
        'This resource was already completed before the action finished. The page now shows the current status.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Resource provisioned successfully. Status is now completed.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Provision resource' })).not.toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Provision resource' })).not.toBeInTheDocument()
  })

  it('does not expose a provisioning action for an initially completed resource', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(completedResource()))

    renderResourceApp('/resources/1')

    expect(await screen.findByText('Completed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /provision/i })).not.toBeInTheDocument()
  })

  it('does not preserve an old mutation error after closing and reopening confirmation', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const draft = readyDraft()

    fetchMock
      .mockResolvedValueOnce(jsonResponse(draft))
      .mockResolvedValueOnce(jsonResponse({ message: 'Temporary provisioning failure' }, 400))
      .mockResolvedValueOnce(jsonResponse(draft))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))
    expect(await screen.findByText('Temporary provisioning failure')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Provision resource' }))

    expect(screen.queryByText('Temporary provisioning failure')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Provision resource' })).toBeInTheDocument()
  })

  it('closes the drawer and shows not-found after a provisioning 404', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)

    fetchMock
      .mockResolvedValueOnce(jsonResponse(readyDraft()))
      .mockResolvedValueOnce(jsonResponse({ message: 'Resource not found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ message: 'Resource not found' }, 404))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('button', { name: 'Provision resource' }))
    await user.click(await screen.findByRole('button', { name: 'Provision' }))

    expect(await screen.findByRole('heading', { name: 'Resource not found' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Provision resource' })).not.toBeInTheDocument()
    expect(screen.queryByText('Alpha Resource')).not.toBeInTheDocument()
  })

  it('exposes View details navigation for draft and completed resources', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(readyDraft()))

    renderResourceApp('/resources/1')

    expect(await screen.findByRole('link', { name: 'View details' })).toHaveAttribute(
      'href',
      '/resources/1/details',
    )
  })
})
