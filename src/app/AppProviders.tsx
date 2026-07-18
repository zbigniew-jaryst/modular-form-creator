import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from '../design-system/theme/GlobalStyles'
import { theme } from '../design-system/theme/theme'
import { CompletedResourceDraftsProvider } from '../features/resources/completed-edits/CompletedResourceDraftsProvider'
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
        <CompletedResourceDraftsProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </CompletedResourceDraftsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
