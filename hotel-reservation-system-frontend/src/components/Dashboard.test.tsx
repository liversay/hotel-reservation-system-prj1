import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'

afterEach(() => vi.unstubAllGlobals())

describe('Dashboard', () => {
  it('pide iniciar sesion de admin si la API responde 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden', json: async () => ({}) }))
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent('administrador')
  })

  it('muestra KPIs y grafico con datos', async () => {
    const pt = (m: string, n: number) => ({ month: m, roomNights: n, revenue: n * 100, occupancy: 0.5, suggestedPriceChangePct: 0 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ totalRooms: 5, history: [pt('2030-01', 10)], forecast: [pt('2030-02', 12)] }) }))
    render(<Dashboard />)
    expect(await screen.findByRole('img')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })
})
