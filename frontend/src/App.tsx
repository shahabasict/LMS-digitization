import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { homePathForRole, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/guard/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ManagersPage from './pages/admin/ManagersPage'
import OrgSettingsPage from './pages/admin/OrgSettingsPage'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import JoinersPage from './pages/manager/JoinersPage'
import NewJoinerDetailPage from './pages/manager/NewJoinerDetailPage'
import ModulesPage from './pages/manager/ModulesPage'
import AssignTrainingPage from './pages/manager/AssignTrainingPage'
import FeedbackPage from './pages/manager/FeedbackPage'
import ReportsPage from './pages/manager/ReportsPage'
import NewJoinerDashboard from './pages/joiner/NewJoinerDashboard'
import MyTrainingPage from './pages/joiner/MyTrainingPage'
import HomePage from './pages/HomePage'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={homePathForRole(user.role)} replace />
}

function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  )
}

function ManagerLayout() {
  return (
    <ProtectedRoute allowedRoles={['manager']}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  )
}

function JoinerLayout() {
  return (
    <ProtectedRoute allowedRoles={['new_joiner']}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/home" element={<HomePage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/managers" replace />} />
        <Route path="managers" element={<ManagersPage />} />
        <Route path="org" element={<OrgSettingsPage />} />
      </Route>

      <Route path="/manager" element={<ManagerLayout />}>
        <Route index element={<ManagerDashboard />} />
        <Route path="joiners" element={<JoinersPage />} />
        <Route path="joiners/:joinerId" element={<NewJoinerDetailPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="assignments" element={<AssignTrainingPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route path="/join" element={<JoinerLayout />}>
        <Route index element={<NewJoinerDashboard />} />
        <Route path="training" element={<MyTrainingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App