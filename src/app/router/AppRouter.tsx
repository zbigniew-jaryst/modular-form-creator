import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'
import { BasicInfoPage } from '../../features/resources/routes/basic-info/BasicInfoPage'
import { ProjectDetailsPage } from '../../features/resources/routes/project-details/ProjectDetailsPage'
import { ResourceDetailsPage } from '../../features/resources/routes/resource-details/ResourceDetailsPage'
import { ResourceOverviewPage } from '../../features/resources/routes/resource-overview/ResourceOverviewPage'
import { ResourcesListPage } from '../../features/resources/routes/resources-list/ResourcesListPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { pathPatterns, paths } from '../../shared/routing/paths'
import { AppShell } from '../layout/AppShell'

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

const appRouter = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: paths.home, element: <Navigate to={paths.resources} replace /> },
      { path: paths.resources, element: <ResourcesListPage /> },
      { path: pathPatterns.resource, element: <ResourceOverviewPage /> },
      { path: pathPatterns.resourceDetails, element: <ResourceDetailsPage /> },
      { path: pathPatterns.resourceBasicInfo, element: <BasicInfoPage /> },
      {
        path: pathPatterns.resourceProjectDetails,
        element: <ProjectDetailsPage />,
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={appRouter} />
}
