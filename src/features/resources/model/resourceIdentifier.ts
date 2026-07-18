const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/
const MONGO_OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/

export type ResourceIdentifier = string

export function isValidResourceIdentifier(value: string): boolean {
  return POSITIVE_INTEGER_PATTERN.test(value) || MONGO_OBJECT_ID_PATTERN.test(value)
}

/** Returns a normalized string identifier, or undefined when invalid. */
export function parseResourceIdentifier(
  value: string | undefined,
): ResourceIdentifier | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  if (!isValidResourceIdentifier(value)) {
    return undefined
  }

  return value
}
