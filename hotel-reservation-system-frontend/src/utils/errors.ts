import { ApiError } from '../api/client'

const GENERIC = 'Ocurrió un error inesperado. Inténtalo de nuevo.'

/**
 * Convierte cualquier error en un mensaje corto, en español y apto para mostrar al usuario.
 * `authForm: true` para formularios de login/registro: ahí un 401 es "credenciales inválidas"
 * (mensaje del backend), no "sesión expirada".
 */
export function friendlyError(e: unknown, opts: { authForm?: boolean } = {}): string {
  if (!opts.authForm && e instanceof ApiError && e.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
  if (e instanceof TypeError) return 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
  const msg = e instanceof Error ? e.message.trim() : ''
  if (!msg || /^[{[]/.test(msg)) return GENERIC
  return msg
}
