import { deleteResource, findResourceByExactName } from './api'

const trackedIds = new Set<number>()
const trackedNames = new Set<string>()

export function trackResourceId(resourceId: number): void {
  trackedIds.add(resourceId)
}

export function trackResourceName(name: string): void {
  trackedNames.add(name)
}

export async function cleanupTrackedResources(): Promise<void> {
  const errors: string[] = []

  for (const name of trackedNames) {
    try {
      const found = await findResourceByExactName(name)
      if (found) {
        trackedIds.add(found.resourceId)
      }
    } catch (error) {
      errors.push(
        `Exact-name lookup "${name}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  for (const resourceId of trackedIds) {
    try {
      await deleteResource(resourceId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('(404)')) {
        errors.push(`Delete ${resourceId} failed: ${message}`)
      }
    }
  }

  trackedIds.clear()
  trackedNames.clear()

  if (errors.length > 0) {
    console.warn(`[e2e cleanup] ${errors.join(' | ')}`)
  }
}
