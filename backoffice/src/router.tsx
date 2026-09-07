import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { JobListPage } from './pages/JobListPage'
import { JobEditPage } from './pages/JobEditPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { FinancePage } from './pages/FinancePage'
import { AffiliatePage } from './pages/AffiliatePage'
import { AdminListPage } from './pages/AdminListPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { LoginPage } from './pages/LoginPage'

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <Navigate to="/users/candidates" replace /> },
      { path: 'users/candidates', element: <UsersPage /> },
      { path: 'users/candidates/:id', element: <UserDetailPage /> },
      { path: 'users/employers', element: <UsersPage /> },
      { path: 'users/employers/:id', element: <UserDetailPage /> },
      { path: 'jobs', element: <JobListPage /> },
      { path: 'jobs/edit/:jobId', element: <JobEditPage /> },
      { path: 'jobs/edit/:jobId/:jobSlug', element: <JobEditPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'finance', element: <FinancePage /> },
      { path: 'affiliates', element: <AffiliatePage /> },
      { path: 'admins', element: <AdminListPage /> },
      { path: 'account', element: <AccountSettingsPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
