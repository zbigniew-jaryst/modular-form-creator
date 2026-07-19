import { describe, expect, it } from 'vitest'
import {
  getDefaultResourceListSearchState,
  parseResourceListSearchParams,
  serializeResourceListSearchParams,
} from './resourceListSearchParams'

describe('resourceListSearchParams', () => {
  it('uses backend defaults when parameters are absent', () => {
    expect(parseResourceListSearchParams(new URLSearchParams())).toEqual(
      getDefaultResourceListSearchState(),
    )
  })

  it('normalizes unsupported values', () => {
    const state = parseResourceListSearchParams(
      new URLSearchParams({
        page: '0',
        status: 'unknown',
        sortOrder: 'sideways',
        name: '  ',
      }),
    )

    expect(state).toEqual({
      page: 1,
      sortOrder: 'desc',
    })
  })

  it('serializes only non-default committed values', () => {
    const params = serializeResourceListSearchParams({
      page: 2,
      status: 'draft',
      name: 'Alpha',
      sortOrder: 'asc',
    })

    expect(params.get('page')).toBe('2')
    expect(params.get('status')).toBe('draft')
    expect(params.get('name')).toBe('Alpha')
    expect(params.get('sortOrder')).toBe('asc')
  })
})
