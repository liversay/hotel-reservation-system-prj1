import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { tokenStore } from '../api/client'
import { fakeJwt } from '../auth/testToken'
import Header from './Header'

const future = Math.floor(Date.now() / 1000) + 3600
const renderHeader = () => render(<MemoryRouter><Header /></MemoryRouter>)
beforeEach(() => localStorage.clear())

describe('Header', () => {
  it('sin sesión muestra enlaces reales a login y registro', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/register')
    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull()
  })

  it('con sesión de cliente muestra Mis reservas y Salir, sin panel admin', () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: future }))
    renderHeader()
    expect(screen.getAllByRole('link', { name: 'Mis reservas' })[0]).toHaveAttribute('href', '/my-reservations')
    expect(screen.queryByRole('link', { name: 'Administración' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })

  it('admin ve enlace a /admin', () => {
    tokenStore.set(fakeJwt({ sub: 'a', role: 'ADMIN', exp: future }))
    renderHeader()
    expect(screen.getAllByRole('link', { name: 'Administración' })[0]).toHaveAttribute('href', '/admin')
  })

  it('Salir borra el token y vuelve a mostrar Iniciar sesión', async () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: future }))
    renderHeader()
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(tokenStore.get()).toBeNull()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('la hamburguesa abre y cierra el menú móvil', async () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: 'Abrir menú' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: 'Menú móvil' })).toBeNull()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Menú móvil' })).toBeInTheDocument()
    await userEvent.click(toggle)
    expect(screen.queryByRole('navigation', { name: 'Menú móvil' })).toBeNull()
  })
})
