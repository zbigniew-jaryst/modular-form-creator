const DEFAULT_API_URL = 'http://localhost:5001'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return normalizeBaseUrl(configured.trim())
  }
  return DEFAULT_API_URL
}
