import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api'
import { TOKEN_KEY } from '../api/client'
import type { Role, User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('wtp_user')
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    localStorage.setItem(TOKEN_KEY, response.access_token)
    localStorage.setItem('wtp_user', JSON.stringify(response.user))
    setUser(response.user)
    return response.user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('wtp_user')
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function homePathForRole(role: Role): string {
  if (role === 'admin') return '/admin/managers'
  if (role === 'manager') return '/manager'
  return '/join'
}