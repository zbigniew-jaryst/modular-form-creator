import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, Link, RouterProvider } from 'react-router-dom'
import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

function DirtyPage() {
  useUnsavedChangesWarning(true)
  return (
    <div>
      <h1>Dirty form</h1>
      <Link to="/elsewhere">Leave</Link>
    </div>
  )
}

function ElsewherePage() {
  return <h1>Elsewhere</h1>
}

function renderDirtyApp() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <DirtyPage /> },
      { path: '/elsewhere', element: <ElsewherePage /> },
    ],
    { initialEntries: ['/'] },
  )

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}

describe('useUnsavedChangesWarning', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('registers beforeunload while enabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    renderDirtyApp()

    expect(
      addSpy.mock.calls.some(([eventName]) => eventName === 'beforeunload'),
    ).toBe(true)
  })

  it('asks for confirmation before SPA navigation and stays when cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderDirtyApp()

    await user.click(screen.getByRole('link', { name: 'Leave' }))

    expect(window.confirm).toHaveBeenCalledWith(
      'You have unsaved edits on this page. Leave anyway?',
    )
    expect(screen.getByRole('heading', { name: 'Dirty form' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Elsewhere' }),
    ).not.toBeInTheDocument()
  })

  it('proceeds with SPA navigation when confirmation is accepted', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderDirtyApp()

    await user.click(screen.getByRole('link', { name: 'Leave' }))

    expect(await screen.findByRole('heading', { name: 'Elsewhere' })).toBeInTheDocument()
  })
})
