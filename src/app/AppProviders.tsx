import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from '../design-system/theme/GlobalStyles'
import { theme } from '../design-system/theme/theme'
import { CompletedResourceEditsProvider } from '../features/resources/state/completed-edits/CompletedResourceEditsProvider'
import { ApiError } from '../shared/api/ApiError'

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 1
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <CompletedResourceEditsProvider>{children}</CompletedResourceEditsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
