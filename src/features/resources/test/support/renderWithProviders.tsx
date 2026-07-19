import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../../../design-system/theme/theme'
import { CompletedResourceEditsProvider } from '../../state/completed-edits/CompletedResourceEditsProvider'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function createTestWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CompletedResourceEditsProvider>{children}</CompletedResourceEditsProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }
}

type RenderOptions = {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/resources', queryClient = createTestQueryClient() }: RenderOptions = {},
) {
  const router = createMemoryRouter([{ path: '*', element: ui }], {
    initialEntries: [route],
  })

  return {
    queryClient,
    router,
    ...render(<RouterProvider router={router} />, {
      wrapper: createTestWrapper(queryClient),
    }),
  }
}
