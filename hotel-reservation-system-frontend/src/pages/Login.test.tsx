import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Login, { safeNext } from './Login'

afterEach(() => vi.unstubAllGlobals())

describe('safeNext (anti open-redirect)', () => {
  it('acepta rutas internas', () => {
    expect(safeNext('/book/3')).toBe('/book/3')
  })
  it('rechaza URLs externas y protocol-relative', () => {
    expect(safeNext('https://evil.com')).toBeNull()
    expect(safeNext('//evil.com')).toBeNull()
    expect(safeNext('/\\evil.com')).toBeNull()
    expect(safeNext('javascript:alert(1)')).toBeNull()
    expect(safeNext(null)).toBeNull()
  })
})

describe('Login', () => {
  it('con la red caída muestra un mensaje en español, no "Failed to fetch"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Usuario'), 'demo')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'demo12345')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor. Inténtalo de nuevo.')
    expect(alert).not.toHaveTextContent('Failed to fetch')
  })

  const submitWith = async (response: unknown) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    render(<MemoryRouter><Login /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Usuario'), 'demo')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala-clave')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    return screen.findByRole('alert')
  }

  it('un 401 del login muestra "Credenciales inválidas", no "sesión expiró"', async () => {
    const alert = await submitWith({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ message: 'Credenciales inválidas' }) })
    expect(alert).toHaveTextContent('Credenciales inválidas')
    expect(alert).not.toHaveTextContent('sesión expiró')
  })

  it('un 429 muestra el mensaje del backend', async () => {
    const msg = 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.'
    const alert = await submitWith({ ok: false, status: 429, statusText: 'Too Many', json: async () => ({ message: msg }) })
    expect(alert).toHaveTextContent(msg)
  })
})
