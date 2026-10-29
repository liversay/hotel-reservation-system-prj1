import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RoomDetails from './RoomDetails'
import { stubCatalog } from '../test/catalogMock'

afterEach(() => vi.unstubAllGlobals())

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/rooms/:id" element={<RoomDetails />} />
      </Routes>
    </MemoryRouter>,
  )

describe('RoomDetails (/rooms/:id)', () => {
  it('muestra los datos reales de la habitación y su hotel', async () => {
    stubCatalog()
    renderAt('/rooms/11')
    expect(await screen.findByRole('heading', { name: /Suite/ })).toBeInTheDocument()
    expect(screen.getByText(/250/)).toBeInTheDocument()
    expect(screen.getByText(/201/)).toBeInTheDocument()
    expect(await screen.findByText(/Gran Hotel Sol/)).toBeInTheDocument()
    expect(screen.getByText(/Madrid/)).toBeInTheDocument()
  })

  it('el botón Reservar navega a /book/:id', async () => {
    stubCatalog()
    renderAt('/rooms/11')
    const reservar = await screen.findByRole('link', { name: 'Reservar' })
    expect(reservar).toHaveAttribute('href', '/book/11')
  })

  it('una habitación inexistente muestra "no encontrada" con enlace a /products', async () => {
    stubCatalog()
    renderAt('/rooms/999')
    expect(await screen.findByText(/Habitación no encontrada/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver a habitaciones/ })).toHaveAttribute('href', '/products')
    expect(screen.queryByRole('link', { name: 'Reservar' })).not.toBeInTheDocument()
  })
})
