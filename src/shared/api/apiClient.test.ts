import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { apiClient } from './apiClient'

describe('apiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns parsed JSON for a successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient<{ ok: boolean }>('/api/ping')).resolves.toEqual({
      ok: true,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/ping$/),
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('returns undefined for an empty successful body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 200 })),
    )

    await expect(apiClient<undefined>('/api/empty')).resolves.toBeUndefined()
  })

  it('throws ApiError from a structured backend error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Not found', details: { id: 1 } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await apiClient('/api/missing').catch((caught) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 404,
      message: 'Not found',
      details: { id: 1 },
    })
  })

  it('falls back for non-JSON error bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Gateway down', { status: 502 })),
    )

    const error = await apiClient('/api/down').catch((caught) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, message: 'Gateway down' })
  })

  it('sets Content-Type only when a body is present', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('/api/resources', { method: 'POST', body: { name: 'A' } })
    const withBody = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect((withBody.headers as Headers).get('Content-Type')).toBe(
      'application/json',
    )

    await apiClient('/api/resources/1', { method: 'DELETE' })
    const withoutBody = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect((withoutBody.headers as Headers).get('Content-Type')).toBeNull()
  })

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiClient('/api/resources', { signal: controller.signal })
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
