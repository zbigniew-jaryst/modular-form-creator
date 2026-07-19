import type { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { pathPatterns, paths } from '../../../../shared/routing/paths'
import { BasicInfoPage } from '../../routes/basic-info/BasicInfoPage'
import { ProjectDetailsPage } from '../../routes/project-details/ProjectDetailsPage'
import { ResourceDetailsPage } from '../../routes/resource-details/ResourceDetailsPage'
import { ResourceOverviewPage } from '../../routes/resource-overview/ResourceOverviewPage'
import { ResourcesListPage } from '../../routes/resources-list/ResourcesListPage'
import { createTestQueryClient, createTestWrapper } from './renderWithProviders'

const resourceAppRoutes = [
  { path: paths.resources, element: <ResourcesListPage /> },
  { path: pathPatterns.resource, element: <ResourceOverviewPage /> },
  { path: pathPatterns.resourceDetails, element: <ResourceDetailsPage /> },
  { path: pathPatterns.resourceBasicInfo, element: <BasicInfoPage /> },
  {
    path: pathPatterns.resourceProjectDetails,
    element: <ProjectDetailsPage />,
  },
]

export function renderResourceApp(
  route: string,
  queryClient: QueryClient = createTestQueryClient(),
) {
  const router = createMemoryRouter(resourceAppRoutes, {
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
