import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MyReservations from './MyReservations'

afterEach(() => vi.unstubAllGlobals())

const iso = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString()
const list = [
  { id: 1, startDate: iso(10), endDate: iso(12), status: 'CONFIRMED', totalPrice: 200, room: { roomNumber: '101', type: 'Doble' } },
  { id: 2, startDate: iso(-5), endDate: iso(-3), status: 'COMPLETED', totalPrice: 150, room: { roomNumber: '102', type: 'Doble' } },
  { id: 3, startDate: iso(20), endDate: iso(22), status: 'CANCELLED', totalPrice: 90, room: { roomNumber: '103', type: 'Suite' } },
]

describe('MyReservations', () => {
  it('solo ofrece cancelar reservas futuras y activas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => list }))
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await screen.findByText(/Hab. 101/)
    expect(screen.getAllByText('Cancelar')).toHaveLength(1)
  })

  it('cancela y actualiza el estado en pantalla', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [list[0]] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...list[0], status: 'CANCELLED' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await userEvent.click(await screen.findByText('Cancelar'))
    expect(await screen.findByText('CANCELLED')).toBeInTheDocument()
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument()
  })

  it('muestra el error del backend al fallar', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [list[0]] })
      .mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad', json: async () => ({ message: 'No se puede cancelar' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await userEvent.click(await screen.findByText('Cancelar'))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede cancelar')
  })
})
