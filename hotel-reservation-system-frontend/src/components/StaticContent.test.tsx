import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenStore } from '../api/client'
import AboutUs from './AboutUs'
import Footer from './Footer'
import HeaderAdmin from './HeaderAdmin'
import ProfileCircule from './ProfileCircule'
import Sidebar from './Sidebar'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('AboutUs', () => {
  it('está en español, sin testimonios ni cifras inventadas ni imágenes externas', () => {
    const { container } = render(<AboutUs />)
    expect(screen.getByRole('heading', { level: 2, name: /Sistema de reservas de hotel/ })).toBeInTheDocument()
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Jane Doe|John Smith|Sarah Lee|Satisfied Customer|Founded in 1985|About Our Hotels/)
    expect(text).not.toMatch(/\b1985\b/)
    for (const img of container.querySelectorAll('img')) expect(img.getAttribute('src') ?? '').not.toMatch(/^https?:/)
  })
})

describe('Footer', () => {
  it('sin Lorem ipsum y con el año actual', () => {
    const { container } = render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(container.textContent).not.toMatch(/Lorem|ipsum/i)
    expect(container.textContent).not.toContain('2024')
    expect(container.textContent).toContain(`© ${new Date().getFullYear()} Sistema de Reservas`)
  })
})

describe('Menú de perfil del panel admin', () => {
  it('sin imágenes externas ni enlaces muertos; ofrece "Ir al sitio" y "Cerrar sesión"', async () => {
    const { container } = render(<MemoryRouter><ProfileCircule /></MemoryRouter>)
    for (const img of container.querySelectorAll('img')) expect(img.getAttribute('src') ?? '').not.toMatch(/^https?:/)
    await userEvent.click(screen.getByRole('button'))
    expect(container.querySelector('a[href="#"]')).toBeNull()
    expect(screen.queryByText(/Config|Change Password/)).toBeNull()
    expect(screen.getByRole('menuitem', { name: 'Ir al sitio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('menuitem', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('"Cerrar sesión" borra el token y navega a /', async () => {
    tokenStore.set('abc')
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<p>Inicio</p>} />
          <Route path="/admin" element={<ProfileCircule />} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button'))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }))
    expect(tokenStore.get()).toBeNull()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })
})

describe('Menú lateral y cabecera del panel admin', () => {
  it('muestra las pestañas en español', () => {
    render(<Sidebar isMobileMenuOpen={false} activeTab="dashboard" setActiveTab={() => {}} toggleMobileMenu={() => {}} />)
    for (const name of ['Panel', 'Hoteles', 'Habitaciones', 'Usuarios']) expect(screen.getByRole('button', { name })).toBeInTheDocument()
    expect(screen.queryByText(/dashboard|rooms|users|Hotel Admin/i)).toBeNull()
  })

  it('el título de la cabecera usa la etiqueta en español', () => {
    render(<MemoryRouter><HeaderAdmin activeTab="rooms" toggleMobileMenu={() => {}} isMobileMenuOpen={false} /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Habitaciones' })).toBeInTheDocument()
  })
})
