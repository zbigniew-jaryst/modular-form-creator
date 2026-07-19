import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBeforeUnloadWarning } from './useBeforeUnloadWarning'
import {
  CompletedResourceEditsProvider,
  useCompletedResourceEdits,
} from './CompletedResourceEditsProvider'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
} from '../../test/support/resourceFixtures'

function Probe({ enabled }: { enabled: boolean }) {
  useBeforeUnloadWarning(enabled)
  return null
}

function EditsProbe() {
  const completedEdits = useCompletedResourceEdits()
  return (
    <div>
      <span data-testid="pending">{String(completedEdits.hasAnyBufferedEdits)}</span>
      <button
        type="button"
        onClick={() => {
          completedEdits.applyBasicInfo(
            createResource({
              resourceId: 1,
              status: 'completed',
              basicInfo: createCompleteBasicInfo(),
              projectDetails: createCompleteProjectDetails(),
            }),
            {
              owner: 'Changed',
              email: 'jane@example.com',
              description: 'A useful resource',
              priority: 'medium',
            },
          )
        }}
      >
        apply
      </button>
      <button
        type="button"
        onClick={() => {
          completedEdits.clearBufferedEdits(1)
        }}
      >
        clear
      </button>
    </div>
  )
}

describe('useBeforeUnloadWarning', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('does not register a listener when disabled', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    render(<Probe enabled={false} />)
    expect(
      addSpy.mock.calls.some(
        ([eventName]) => eventName === 'beforeunload',
      ),
    ).toBe(false)
  })

  it('registers and cleans up the beforeunload listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Probe enabled={true} />)

    expect(
      addSpy.mock.calls.some(
        ([eventName]) => eventName === 'beforeunload',
      ),
    ).toBe(true)

    unmount()

    expect(
      removeSpy.mock.calls.some(
        ([eventName]) => eventName === 'beforeunload',
      ),
    ).toBe(true)
  })
})

describe('CompletedResourceEditsProvider', () => {
  afterEach(() => {
    cleanup()
  })

  it('starts with an empty buffer on mount', () => {
    const { getByTestId } = render(
      <CompletedResourceEditsProvider>
        <EditsProbe />
      </CompletedResourceEditsProvider>,
    )

    expect(getByTestId('pending').textContent).toBe('false')
  })

  it('enables pending state after apply and disables after clear', async () => {
    const { getByTestId, getByRole } = render(
      <CompletedResourceEditsProvider>
        <EditsProbe />
      </CompletedResourceEditsProvider>,
    )

    await act(async () => {
      getByRole('button', { name: 'apply' }).click()
    })
    expect(getByTestId('pending').textContent).toBe('true')

    await act(async () => {
      getByRole('button', { name: 'clear' }).click()
    })
    expect(getByTestId('pending').textContent).toBe('false')
  })
})
