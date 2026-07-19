import { afterEach, beforeEach, vi } from 'vitest'

export function stubFetch(): void {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
}
