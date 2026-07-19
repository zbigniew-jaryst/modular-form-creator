import {
  PRIORITIES,
  PROJECT_CATEGORIES,
} from '../../domain/resourceModuleOptions'

const EMPTY_DISPLAY = 'Not provided'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const PRIORITY_LABELS = Object.fromEntries(
  PRIORITIES.map((value) => [value, value.charAt(0).toUpperCase() + value.slice(1)]),
) as Record<string, string>

const CATEGORY_LABELS = Object.fromEntries(
  PROJECT_CATEGORIES.map((value) => [
    value,
    value.charAt(0).toUpperCase() + value.slice(1),
  ]),
) as Record<string, string>

export function displayValue(value: string | undefined | null): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return EMPTY_DISPLAY
  }

  return value.trim()
}

export function displayPriority(value: string | undefined | null): string {
  const normalized = displayValue(value)
  if (normalized === EMPTY_DISPLAY) {
    return EMPTY_DISPLAY
  }

  return PRIORITY_LABELS[value ?? ''] ?? normalized
}

export function displayCategory(value: string | undefined | null): string {
  const normalized = displayValue(value)
  if (normalized === EMPTY_DISPLAY) {
    return EMPTY_DISPLAY
  }

  return CATEGORY_LABELS[value ?? ''] ?? normalized
}

export function displayDate(value: string | undefined | null): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return EMPTY_DISPLAY
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return EMPTY_DISPLAY
  }

  try {
    return DATE_FORMATTER.format(parsed)
  } catch {
    return EMPTY_DISPLAY
  }
}

export function displayOptions(options: string[] | undefined): string[] {
  if (!Array.isArray(options) || options.length === 0) {
    return []
  }

  return options
    .map((option) => displayValue(option))
    .filter((option) => option !== EMPTY_DISPLAY)
}

export { EMPTY_DISPLAY }
