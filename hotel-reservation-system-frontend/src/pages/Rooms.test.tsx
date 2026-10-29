import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Rooms from './Rooms'
import { fail, ok, stubCatalog } from '../test/catalogMock'

afterEach(() => vi.unstubAllGlobals())

const renderAt = (url = '/products') => render(<MemoryRouter initialEntries={[url]}><Rooms /></MemoryRouter>)

describe('Rooms (/products)', () => {
  it('lista las habitaciones reales del backend', async () => {
    stubCatalog()
    renderAt()
    expect(await screen.findAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(3)
    expect(screen.getAllByText('Gran Hotel Sol')).toHaveLength(2)
    expect(screen.queryByText(/Ritz-Carlton/)).not.toBeInTheDocument()
  })

  it('enlaza cada tarjeta con /rooms/:id', async () => {
    stubCatalog()
    renderAt()
    const links = await screen.findAllByRole('link', { name: 'Ver disponibilidad' })
    expect(links[0]).toHaveAttribute('href', '/rooms/10')
  })

  it('filtra por texto (tipo, número u hotel)', async () => {
    stubCatalog()
    renderAt()
    await screen.findAllByRole('link', { name: 'Ver disponibilidad' })
    await userEvent.type(screen.getByLabelText('Buscar'), 'cádiz')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    const links = screen.getAllByRole('link', { name: 'Ver disponibilidad' })
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/rooms/12')
  })

  it('filtra por precio máximo', async () => {
    stubCatalog()
    renderAt()
    await screen.findAllByRole('link', { name: 'Ver disponibilidad' })
    await userEvent.type(screen.getByLabelText('Precio máximo por noche'), '100')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: /Doble/ })).toBeInTheDocument()
  })

  it('aplica el término de la URL (?q=) desde el inicio', async () => {
    stubCatalog()
    renderAt('/products?q=suite')
    const links = await screen.findAllByRole('link', { name: 'Ver disponibilidad' })
    expect(links).toHaveLength(1)
    expect(screen.getByLabelText('Buscar')).toHaveValue('suite')
  })

  it('muestra estado vacío cuando nada coincide', async () => {
    stubCatalog()
    renderAt('/products?q=zzz')
    expect(await screen.findByText(/No hay habitaciones/)).toBeInTheDocument()
  })

  it('muestra estado vacío si el backend no devuelve habitaciones (204)', async () => {
    const empty = { ok: true, status: 204, json: async () => { throw new Error('sin cuerpo') } }
    stubCatalog({ '/api/rooms': empty, '/api/hotel/get-all': empty })
    renderAt()
    expect(await screen.findByText(/No hay habitaciones/)).toBeInTheDocument()
  })

  it('muestra cargando y luego error si el backend falla', async () => {
    stubCatalog({ '/api/rooms': fail(500, 'Error interno') })
    renderAt()
    expect(screen.getByText('Cargando habitaciones…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno')
  })

  it('sigue mostrando habitaciones aunque falle la carga de hoteles', async () => {
    stubCatalog({ '/api/hotel/get-all': fail(500, 'x') })
    renderAt()
    expect(await screen.findAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(3)
    expect(within(document.body).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('un precio máximo inválido se ignora', async () => {
    stubCatalog()
    renderAt()
    await screen.findAllByRole('link', { name: 'Ver disponibilidad' })
    await userEvent.type(screen.getByLabelText('Precio máximo por noche'), '-5')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.getAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(3)
  })

  it('con tope de precio, una habitación sin precio no pasa el filtro', async () => {
    const noPrice = [{ id: 20, roomNumber: '9', type: 'Rara', pricePerNight: null, availability: true, hotelId: 1 }, { id: 21, roomNumber: '8', type: 'Barata', pricePerNight: 10, availability: true, hotelId: 1 }]
    stubCatalog({ '/api/rooms': ok(noPrice) })
    renderAt()
    expect(await screen.findByText('Precio no disponible')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Precio máximo por noche'), '50')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))
    expect(screen.queryByText('Precio no disponible')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(1)
  })
})
