import { Navigate, Route, Routes } from 'react-router-dom'
import { BasicInfoPage } from '../../features/resources/pages/BasicInfoPage'
import { ProjectDetailsPage } from '../../features/resources/pages/ProjectDetailsPage'
import { ResourceDetailsPage } from '../../features/resources/pages/ResourceDetailsPage'
import { ResourceOverviewPage } from '../../features/resources/pages/ResourceOverviewPage'
import { ResourcesListPage } from '../../features/resources/pages/ResourcesListPage'
import { NotFoundPage } from '../../shared/pages/NotFoundPage'
import { paths } from '../../shared/routing/paths'
import { AppShell } from '../layout/AppShell'

export function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path={paths.home} element={<Navigate to={paths.resources} replace />} />
        <Route path={paths.resources} element={<ResourcesListPage />} />
        <Route path="/resources/:resourceId" element={<ResourceOverviewPage />} />
        <Route path="/resources/:resourceId/details" element={<ResourceDetailsPage />} />
        <Route path="/resources/:resourceId/basic-info" element={<BasicInfoPage />} />
        <Route
          path="/resources/:resourceId/project-details"
          element={<ProjectDetailsPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
