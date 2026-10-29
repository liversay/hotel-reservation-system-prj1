import { ApiError } from '../api/client'

const GENERIC = 'Ocurrió un error inesperado. Inténtalo de nuevo.'

/** Convierte cualquier error en un mensaje corto, en español y apto para mostrar al usuario. */
export function friendlyError(e: unknown): string {
  if (e instanceof ApiError && e.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
  if (e instanceof TypeError) return 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
  const msg = e instanceof Error ? e.message.trim() : ''
  if (!msg || /^[{[]/.test(msg)) return GENERIC
  return msg
}
