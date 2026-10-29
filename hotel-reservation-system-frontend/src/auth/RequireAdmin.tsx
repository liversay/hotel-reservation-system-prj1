import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from './session'
import RequireAuth from './RequireAuth'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  return <RequireAuth>{isAdmin() ? children : <Navigate to="/" replace />}</RequireAuth>
}
