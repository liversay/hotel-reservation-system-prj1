import { tokenStore } from '../api/client'

interface Claims {
  role?: string
  exp?: number
}

/** Lee los claims del JWT almacenado (sin verificar firma: el backend es quien autoriza). */
function claims(): Claims | null {
  const token = tokenStore.get()
  if (!token) return null
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const data = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
    if (typeof data.exp === 'number' && data.exp * 1000 <= Date.now()) return null
    return data as Claims
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => claims() !== null
export const isAdmin = (): boolean => claims()?.role === 'ADMIN'
export const logout = (): void => tokenStore.clear()
