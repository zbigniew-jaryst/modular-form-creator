import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../../shared/api/ApiError'
import { resolveResourcePageState } from './resolveResourcePageState'

describe('resolveResourcePageState', () => {
  it('returns invalid-id without requiring query data', () => {
    expect(
      resolveResourcePageState(undefined, {
        isPending: false,
        isError: false,
        error: null,
        data: undefined,
      }),
    ).toEqual({ status: 'invalid-id' })
  })

  it('distinguishes 404 from retryable errors', () => {
    expect(
      resolveResourcePageState('1', {
        isPending: false,
        isError: true,
        error: new ApiError(404, 'Missing'),
        data: undefined,
      }),
    ).toEqual({ status: 'not-found' })

    expect(
      resolveResourcePageState('1', {
        isPending: false,
        isError: true,
        error: new ApiError(500, 'Boom'),
        data: undefined,
      }),
    ).toEqual({ status: 'error', message: 'Boom' })
  })
})
