import { Navigate, Route, Routes } from 'react-router-dom'
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
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}
