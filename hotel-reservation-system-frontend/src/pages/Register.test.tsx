import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from './Register'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

const fill = async (password: string) => {
  render(<MemoryRouter><Register /></MemoryRouter>)
  await userEvent.type(screen.getByLabelText('Usuario'), 'ana')
  await userEvent.type(screen.getByLabelText('Email'), 'ana@x.com')
  await userEvent.type(screen.getByLabelText(/Contraseña/), password)
  await userEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
}

describe('Register', () => {
  it('rechaza contraseñas de menos de 8 caracteres sin llamar al backend', async () => {
    const f = vi.spyOn(globalThis, 'fetch')
    await fill('corta')
    expect(screen.getByRole('alert')).toHaveTextContent('al menos 8 caracteres')
    expect(f).not.toHaveBeenCalled()
  })

  it('envía POST /api/auth/register y guarda el token', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ token: 'tkn', username: 'ana', role: 'CUSTOMER' }), { status: 200 }),
    )
    await fill('contraseña123')
    expect(String(f.mock.calls[0][0])).toMatch(/\/api\/auth\/register$/)
    expect(localStorage.getItem('hotel.token')).toBe('tkn')
  })

  it('con la red caída muestra un mensaje en español', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await fill('contraseña123')
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor. Inténtalo de nuevo.')
  })
})
