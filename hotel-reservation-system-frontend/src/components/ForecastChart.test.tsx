import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ForecastChart, { type ForecastData } from './ForecastChart'

const p = (month: string, roomNights: number, occupancy: number, pct = 0) => ({ month, roomNights, revenue: roomNights * 100, occupancy, suggestedPriceChangePct: pct })

const data: ForecastData = {
  totalRooms: 5,
  history: [p('2030-01', 20, 0.13), p('2030-02', 40, 0.28), p('2030-03', 60, 0.39)],
  forecast: [p('2030-04', 130, 0.87, 10), p('2030-05', 30, 0.2, -10), p('2030-06', 90, 0.6, 0)],
}

describe('ForecastChart', () => {
  it('dibuja una barra por mes, distinguiendo historico y prevision', () => {
    render(<ForecastChart data={data} />)
    expect(screen.getAllByTestId('bar-history')).toHaveLength(3)
    expect(screen.getAllByTestId('bar-forecast')).toHaveLength(3)
  })

  it('la barra mas alta ocupa toda la altura y las demas son proporcionales', () => {
    render(<ForecastChart data={data} />)
    const heights = screen.getAllByTestId(/bar-/).map((g) => Number(g.querySelector('rect')!.getAttribute('height')))
    const max = Math.max(...heights)
    expect(heights[3]).toBe(max) // 130 es el maximo
    expect(heights[0]).toBeCloseTo(max * (20 / 130), 5)
  })

  it('muestra sugerencias de precio con signo', () => {
    render(<ForecastChart data={data} />)
    const rows = screen.getAllByRole('row')
    expect(within(rows[1]).getByText('+10%')).toBeInTheDocument()
    expect(within(rows[2]).getByText('-10%')).toBeInTheDocument()
    expect(within(rows[3]).getByText('0%')).toBeInTheDocument()
  })

  it('no falla con historico vacio', () => {
    render(<ForecastChart data={{ totalRooms: 0, history: [], forecast: [] }} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
