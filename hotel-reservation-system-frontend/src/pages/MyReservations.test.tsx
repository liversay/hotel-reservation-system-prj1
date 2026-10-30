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
    expect(screen.getAllByRole('button', { name: 'Cancelar reserva' })).toHaveLength(1)
  })

  it('pide confirmación inline y permite mantener la reserva', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [list[0]] })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }))
    expect(screen.getByText('¿Confirmar cancelación?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'No, mantener' }))
    expect(screen.queryByText('¿Confirmar cancelación?')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1) // solo la carga de la lista, ningún PUT
  })

  it('cancela tras confirmar, muestra Cancelada y el reembolso', async () => {
    const paid = { ...list[0], payments: [{ id: 9, amount: 200, status: 'PAID' }] }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [paid] })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ...paid, status: 'CANCELLED', payments: [{ id: 9, amount: 200, status: 'REFUNDED' }] }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(await screen.findByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText(/Reembolsado/)).toHaveTextContent('Reembolsado $200')
    expect(screen.queryByRole('button', { name: 'Cancelar reserva' })).not.toBeInTheDocument()
  })

  it('muestra el error del backend al fallar', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [list[0]] })
      .mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad', json: async () => ({ message: 'No se puede cancelar' }) })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede cancelar')
  })

  it('muestra un error legible si no hay conexión al cargar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor. Inténtalo de nuevo.')
  })
})

describe('MyReservations: fecha local', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

  it('a las 20:00 locales en UTC-5 la reserva de mañana sigue siendo cancelable', async () => {
    vi.stubEnv('TZ', 'America/Bogota') // UTC-5 fijo
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2030-05-01T20:00:00-05:00') }) // en UTC ya es 2030-05-02
    const tomorrow = { id: 5, startDate: '2030-05-02', endDate: '2030-05-04', status: 'CONFIRMED', totalPrice: 100, room: { roomNumber: '201', type: 'Doble' } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [tomorrow] }))
    render(<MemoryRouter><MyReservations /></MemoryRouter>)
    await screen.findByText(/Hab. 201/)
    expect(screen.getAllByRole('button', { name: 'Cancelar reserva' })).toHaveLength(1)
  })
})
