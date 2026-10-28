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

  it('muestra un error si la API falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'boom', json: async () => ({}) }))
    render(<AvailabilityCalendar roomId={1} onChange={() => {}} />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
