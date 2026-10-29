import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStore } from '../api/client'
import { fakeJwt } from '../auth/testToken'
import BookRoom from './BookRoom'

const ok = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body })
const room = { id: 1, roomNumber: '101', type: 'Doble', pricePerNight: 80 }

function setup(reserve: () => unknown) {
  let booked = false
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('/availability')) {
      return ok([
        { date: '2030-05-01', status: 'AVAILABLE' },
        { date: '2030-05-02', status: booked ? 'OCCUPIED' : 'AVAILABLE' },
        { date: '2030-05-03', status: 'AVAILABLE' },
      ])
    }
    if (url.endsWith('/api/payment-methods')) return ok([])
    if (url.endsWith('/api/rooms/1')) return ok(room)
    if (url.endsWith('/api/reservations') && init?.method === 'POST') {
      const r = reserve()
      if (r === 'ok') booked = true
      return r === 'ok' ? ok({ id: 1 }, 201) : r
    }
    return ok({})
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2030-05-01T10:00:00') })
  render(
    <MemoryRouter initialEntries={['/book/1']}>
      <Routes><Route path="/book/:roomId" element={<BookRoom />} /></Routes>
    </MemoryRouter>,
  )
  return fetchMock
}

// exp lejano: el reloj falso del test fija la fecha en 2030
beforeEach(() => tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: 4_000_000_000 })))
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear() })

describe('BookRoom', () => {
  it('tras reservar vuelve a pedir la disponibilidad y marca los días como ocupados', async () => {
    const fetchMock = setup(() => 'ok')
    const user = userEvent.setup({ advanceTimers: () => {} })
    await user.click(await screen.findByLabelText('2030-05-01 disponible'))
    await user.click(screen.getByLabelText('2030-05-03 disponible'))
    const before = fetchMock.mock.calls.filter((c) => String(c[0]).includes('/availability')).length
    await user.click(screen.getByRole('button', { name: /Reservar/ }))
    expect(await screen.findByText('¡Reserva confirmada!')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/availability')).length).toBe(before + 1))
    expect(await screen.findByLabelText('2030-05-02 ocupado')).toBeDisabled()
  })

  it('muestra un error legible en español si la red falla al reservar', async () => {
    setup(() => { throw new TypeError('Failed to fetch') })
    const user = userEvent.setup({ advanceTimers: () => {} })
    await user.click(await screen.findByLabelText('2030-05-01 disponible'))
    await user.click(screen.getByLabelText('2030-05-03 disponible'))
    await user.click(screen.getByRole('button', { name: /Reservar/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor. Inténtalo de nuevo.')
  })

  it('con token vencido no pide métodos de pago y ofrece iniciar sesión', async () => {
    tokenStore.set(fakeJwt({ sub: 'u', role: 'CUSTOMER', exp: 1 }))
    const fetchMock = setup(() => 'ok')
    const user = userEvent.setup({ advanceTimers: () => {} })
    await user.click(await screen.findByLabelText('2030-05-01 disponible'))
    await user.click(screen.getByLabelText('2030-05-03 disponible'))
    expect(screen.getByRole('button', { name: 'Inicia sesión para reservar' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/api/payment-methods'))).toBe(false)
  })
})
