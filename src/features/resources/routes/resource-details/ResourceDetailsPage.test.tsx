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

describe('ResourceDetailsPage', () => {
  stubFetch()


  it('fetches and renders the resource on direct details-route entry', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
          projectDetails: createCompleteProjectDetails(),
        }),
      ),
    )

    renderResourceApp('/resources/1/details')

    expect(await screen.findByRole('heading', { name: 'Resource details' })).toBeInTheDocument()
    expect(screen.getAllByText('Alpha Resource').length).toBeGreaterThan(0)
    expect(screen.getByText('ID 1')).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/resources/1')
  })

  it('rejects invalid route identifiers without an API request', async () => {
    const fetchMock = vi.mocked(fetch)

    renderResourceApp('/resources/not-valid/details')

    expect(await screen.findByRole('heading', { name: 'Invalid resource' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders not-found for an unknown valid identifier', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Resource not found' }, 404))

    renderResourceApp('/resources/999/details')

    expect(await screen.findByRole('heading', { name: 'Resource not found' })).toBeInTheDocument()
  })

  it('shows Not provided for empty draft fields', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(createResource()))

    renderResourceApp('/resources/1/details')

    expect(await screen.findByRole('heading', { name: 'Resource details' })).toBeInTheDocument()
    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0)
    expect(screen.getByText('Basic Info: Incomplete')).toBeInTheDocument()
    expect(screen.getByText('Project Details: Incomplete')).toBeInTheDocument()
  })

  it('shows both completed modules for a ready draft', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
          projectDetails: createCompleteProjectDetails(),
        }),
      ),
    )

    renderResourceApp('/resources/1/details')

    expect(await screen.findByText('Basic Info: Complete')).toBeInTheDocument()
    expect(screen.getByText('Project Details: Complete')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Both modules are complete. This resource is ready for provisioning from the resource overview.',
      ),
    ).toBeInTheDocument()
  })

  it('shows completed status and edit-oriented summary for a completed resource', async () => {
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

    renderResourceApp('/resources/1/details')

    expect(await screen.findAllByText('Completed')).not.toHaveLength(0)
    expect(
      screen.getByText(
        'This resource is completed. You can edit modules locally and submit all changes from this page.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Basic Info' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Project Details' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit all changes' })).not.toBeInTheDocument()
  })

  it('displays Basic Info and Project Details values with user-facing labels', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo({
            owner: 'Jane Owner',
            email: 'jane@example.com',
            description: 'A useful resource',
            priority: 'medium',
          }),
          projectDetails: createCompleteProjectDetails({
            projectName: 'Alpha Project',
            budget: '1000',
            category: 'internal',
            options: ['FE devs', 'Designer'],
          }),
        }),
      ),
    )

    renderResourceApp('/resources/1/details')

    expect(await screen.findByText('Jane Owner')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('A useful resource')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('Internal')).toBeInTheDocument()
    expect(screen.getByText('FE devs')).toBeInTheDocument()
    expect(screen.getByText('Designer')).toBeInTheDocument()
  })

  it('never exposes a provisioning action on the details page', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        createResource({
          basicInfo: createCompleteBasicInfo(),
          projectDetails: createCompleteProjectDetails(),
        }),
      ),
    )

    renderResourceApp('/resources/1/details')

    await screen.findByRole('heading', { name: 'Resource details' })
    expect(screen.queryByRole('button', { name: /provision/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /provision/i })).not.toBeInTheDocument()
  })

  it('navigates back to the overview from details', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const resource = createResource({
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse(resource))
      .mockResolvedValueOnce(jsonResponse(resource))

    renderResourceApp('/resources/1/details')

    await user.click(await screen.findByRole('link', { name: 'Back to resource overview' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Provision resource' })).toBeInTheDocument()
    })
  })

  it('reaches details from the overview View details link', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.mocked(fetch)
    const resource = createResource({
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse(resource))
      .mockResolvedValueOnce(jsonResponse(resource))

    renderResourceApp('/resources/1')

    await user.click(await screen.findByRole('link', { name: 'View details' }))

    expect(await screen.findByRole('heading', { name: 'Resource details' })).toBeInTheDocument()
  })
})
