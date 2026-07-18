import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { theme } from '../../../design-system/theme/theme'
import { CompletedResourceDraftsProvider } from '../completed-edits/CompletedResourceDraftsProvider'
import { BasicInfoPage } from '../pages/BasicInfoPage'
import { ProjectDetailsPage } from '../pages/ProjectDetailsPage'
import { ResourceDetailsPage } from '../pages/ResourceDetailsPage'
import { ResourceOverviewPage } from '../pages/ResourceOverviewPage'
import { ResourcesListPage } from '../pages/ResourcesListPage'

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

type RenderOptions = {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/resources', queryClient = createTestQueryClient() }: RenderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <CompletedResourceDraftsProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </CompletedResourceDraftsProvider>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  }
}

export function renderResourceApp(
  route: string,
  queryClient: QueryClient = createTestQueryClient(),
) {
  return renderWithProviders(
    <Routes>
      <Route path="/resources" element={<ResourcesListPage />} />
      <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
      <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
      <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
      <Route
        path="/resources/:resourceId/project-details"
        element={<ProjectDetailsPage />}
      />
    </Routes>,
    { route, queryClient },
  )
}
