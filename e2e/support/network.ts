import type { Page, Request } from '@playwright/test'

export type MutationCounter = {
  count: (method: string, pathMatcher: RegExp | string) => number
  reset: () => void
  dispose: () => void
}

function matchesPath(url: string, pathMatcher: RegExp | string): boolean {
  try {
    const pathname = new URL(url).pathname
    if (typeof pathMatcher === 'string') {
      return pathname === pathMatcher
    }
    return pathMatcher.test(pathname)
  } catch {
    return false
  }
}

/** Install after seeding / create so setup traffic is excluded. */
export function installMutationCounter(page: Page): MutationCounter {
  const requests: Request[] = []

  const onRequest = (request: Request) => {
    const method = request.method().toUpperCase()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return
    }
    requests.push(request)
  }

  page.on('request', onRequest)

  return {
    count(method: string, pathMatcher: RegExp | string) {
      const upper = method.toUpperCase()
      return requests.filter(
        (request) =>
          request.method().toUpperCase() === upper &&
          matchesPath(request.url(), pathMatcher),
      ).length
    },
    reset() {
      requests.length = 0
    },
    dispose() {
      page.off('request', onRequest)
    },
  }
}
