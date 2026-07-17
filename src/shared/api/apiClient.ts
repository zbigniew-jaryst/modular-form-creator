import { getApiBaseUrl } from '../config/environment'
import { ApiError } from './ApiError'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

type BackendErrorBody = {
  message?: unknown
  details?: unknown
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === 'object') {
    const errorBody = body as BackendErrorBody
    const message =
      typeof errorBody.message === 'string' && errorBody.message.trim().length > 0
        ? errorBody.message
        : `Request failed with status ${status}`
    return new ApiError(status, message, errorBody.details)
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return new ApiError(status, body)
  }

  return new ApiError(status, `Request failed with status ${status}`)
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options
  const headers = new Headers()

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  const parsedBody = await parseResponseBody(response)

  if (!response.ok) {
    throw toApiError(response.status, parsedBody)
  }

  return parsedBody as T
}
