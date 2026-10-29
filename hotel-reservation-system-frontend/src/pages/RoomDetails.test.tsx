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

describe('RoomDetails: robustez', () => {
  it.each(['..%2Fadmin%2Fusers', 'abc'])('el id inválido %s no hace ninguna petición y muestra "no encontrada"', async (bad) => {
    const fetchMock = stubCatalog()
    renderAt(`/rooms/${bad}`)
    expect(await screen.findByText(/Habitación no encontrada/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /Volver a habitaciones/ })).toHaveAttribute('href', '/products')
  })

  it('un error de red muestra un mensaje en español', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderAt('/rooms/11')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo conectar con el servidor')
    expect(alert).not.toHaveTextContent('Failed to fetch')
  })

  it('/productDetail sin id muestra "no encontrada"', async () => {
    const fetchMock = stubCatalog()
    render(
      <MemoryRouter initialEntries={['/productDetail']}>
        <Routes><Route path="/productDetail" element={<RoomDetails />} /></Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Habitación no encontrada/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('una habitación sin precio muestra "Precio no disponible"', async () => {
    stubCatalog({ '/api/rooms/11': { ok: true, status: 200, json: async () => ({ id: 11, roomNumber: '201', type: 'Suite', pricePerNight: null, hotelId: 1 }) } })
    renderAt('/rooms/11')
    expect(await screen.findByText('Precio no disponible')).toBeInTheDocument()
  })
})
