import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { tokenStore } from '../api/client'
import RequireAuth from './RequireAuth'
import RequireAdmin from './RequireAdmin'
import { fakeJwt } from './testToken'
import NotFound from '../pages/NotFound'

const future = Math.floor(Date.now() / 1000) + 3600
const Where = () => {
  const l = useLocation()
  return <p>en:{l.pathname}{l.search}</p>
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>inicio</p>} />
        <Route path="/login" element={<Where />} />
        <Route path="/mine" element={<RequireAuth><p>privado</p></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><p>panel</p></RequireAdmin>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => localStorage.clear())

describe('RequireAuth', () => {
  it('sin token redirige a /login?next=<ruta>', () => {
    renderAt('/mine')
    expect(screen.getByText('en:/login?next=%2Fmine')).toBeInTheDocument()
  })
  it('con token deja pasar', () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: future }))
    renderAt('/mine')
    expect(screen.getByText('privado')).toBeInTheDocument()
  })
  it('token vencido cuenta como sin sesión', () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: 1 }))
    renderAt('/mine')
    expect(screen.getByText('en:/login?next=%2Fmine')).toBeInTheDocument()
  })
})

describe('RequireAdmin', () => {
  it('sin token redirige a login', () => {
    renderAt('/admin')
    expect(screen.getByText('en:/login?next=%2Fadmin')).toBeInTheDocument()
  })
  it('un cliente no pasa y vuelve a /', () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: future }))
    renderAt('/admin')
    expect(screen.getByText('inicio')).toBeInTheDocument()
    expect(screen.queryByText('panel')).toBeNull()
  })
  it('un admin pasa', () => {
    tokenStore.set(fakeJwt({ sub: 'a', role: 'ADMIN', exp: future }))
    renderAt('/admin')
    expect(screen.getByText('panel')).toBeInTheDocument()
  })
})

describe('ruta *', () => {
  it('renderiza NotFound con enlace al inicio', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: /no encontrada/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })
})
