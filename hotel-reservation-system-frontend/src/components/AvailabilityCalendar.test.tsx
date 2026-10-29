import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AvailabilityCalendar from './AvailabilityCalendar'

function mockMonth(days: Array<[string, string]>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => days.map(([date, status]) => ({ date, status })),
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('AvailabilityCalendar', () => {
  it('pinta ocupados como deshabilitados y disponibles como clicables', async () => {
    mockMonth([['2030-05-01', 'AVAILABLE'], ['2030-05-02', 'OCCUPIED']])
    render(<AvailabilityCalendar roomId={1} onChange={() => {}} />)
    const free = await screen.findByLabelText('2030-05-01 disponible')
    const busy = screen.getByLabelText('2030-05-02 ocupado')
    expect(free).toBeEnabled()
    expect(busy).toBeDisabled()
  })

  it('emite el rango al elegir entrada y salida', async () => {
    mockMonth([['2030-05-01', 'AVAILABLE'], ['2030-05-02', 'AVAILABLE'], ['2030-05-03', 'AVAILABLE']])
    const onChange = vi.fn()
    render(<AvailabilityCalendar roomId={1} onChange={onChange} />)
    await userEvent.click(await screen.findByLabelText('2030-05-01 disponible'))
    await userEvent.click(screen.getByLabelText('2030-05-03 disponible'))
    expect(onChange).toHaveBeenLastCalledWith({ checkIn: '2030-05-01', checkOut: '2030-05-03' })
  })

  it('no emite nada al hacer clic en un dia ocupado', async () => {
    mockMonth([['2030-05-01', 'OCCUPIED']])
    const onChange = vi.fn()
    render(<AvailabilityCalendar roomId={1} onChange={onChange} />)
    await userEvent.click(await screen.findByLabelText('2030-05-01 ocupado'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('las flechas cambian de mes y piden la disponibilidad del mes nuevo', async () => {
    mockMonth([['2030-05-01', 'AVAILABLE']])
    render(<AvailabilityCalendar roomId={1} onChange={() => {}} />)
    const title = screen.getByRole('heading', { level: 3 })
    const start = title.textContent
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(title.textContent).not.toBe(start)
    await userEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(title.textContent).toBe(start)
    const urls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]))
    expect(new Set(urls).size).toBe(2)
  })

  it('vuelve a pedir la disponibilidad cuando cambia refreshKey', async () => {
    mockMonth([['2030-05-01', 'AVAILABLE']])
    const { rerender } = render(<AvailabilityCalendar roomId={1} onChange={() => {}} refreshKey={0} />)
    await screen.findByLabelText('2030-05-01 disponible')
    expect(fetch).toHaveBeenCalledTimes(1)
    rerender(<AvailabilityCalendar roomId={1} onChange={() => {}} refreshKey={1} />)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it('muestra un error legible en español si la red falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<AvailabilityCalendar roomId={1} onChange={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
    expect(screen.getByRole('alert')).not.toHaveTextContent('Failed to fetch')
  })

  it('muestra un error si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'boom', json: async () => ({}) }))
    render(<AvailabilityCalendar roomId={1} onChange={() => {}} />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
