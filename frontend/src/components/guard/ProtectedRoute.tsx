import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homePathForRole, useAuth } from '../../contexts/AuthContext'
import type { Role } from '../../types'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles: Role[]
}) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <>{children}</>
}