const RESOURCE_NAME_PATTERN = /^[A-Za-z0-9 -]+$/
const MAX_RESOURCE_NAME_LENGTH = 255

export function validateResourceName(value: string): string | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Resource name is required'
  }

  if (trimmed.length > MAX_RESOURCE_NAME_LENGTH) {
    return 'Resource name must be at most 255 characters'
  }

  if (!RESOURCE_NAME_PATTERN.test(trimmed)) {
    return 'Resource name can contain only letters, numbers, spaces, and hyphens'
  }

  return undefined
}

export function normalizeResourceName(value: string): string {
  return value.trim()
}
