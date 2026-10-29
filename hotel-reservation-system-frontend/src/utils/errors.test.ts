import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('traduce el fallo de red a un mensaje legible', () => {
    expect(friendlyError(new TypeError('Failed to fetch'))).toBe('No se pudo conectar con el servidor. Inténtalo de nuevo.')
  })
  it('conserva el mensaje en español del backend', () => {
    expect(friendlyError(new ApiError(400, 'No se puede cancelar'))).toBe('No se puede cancelar')
  })
  it('no muestra JSON crudo ni mensajes vacíos', () => {
    expect(friendlyError(new ApiError(500, '{"error":"x"}'))).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.')
    expect(friendlyError(new ApiError(500, ''))).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.')
  })
  it('explica la sesión vencida', () => {
    expect(friendlyError(new ApiError(401, 'Unauthorized'))).toBe('Tu sesión expiró. Inicia sesión de nuevo.')
  })
})
