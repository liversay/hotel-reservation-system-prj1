import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from './session'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  }
  return <>{children}</>
}
