import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { JobListPage } from './pages/JobListPage'
import { LoginPage } from './pages/LoginPage'

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'jobs', element: <JobListPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
