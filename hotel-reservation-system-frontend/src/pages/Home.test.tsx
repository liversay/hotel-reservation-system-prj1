import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Home from './Home'
import { stubCatalog } from '../test/catalogMock'

afterEach(() => vi.unstubAllGlobals())

function Where() {
  const l = useLocation()
  return <p data-testid="where">{l.pathname + l.search}</p>
}

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  )

describe('Home', () => {
  it('muestra hoteles y habitaciones reales', async () => {
    stubCatalog()
    renderHome()
    expect(await screen.findByRole('link', { name: 'Costa Azul' })).toBeInTheDocument()
    expect(await screen.findAllByRole('link', { name: 'Ver disponibilidad' })).toHaveLength(3)
    expect(screen.queryByText(/Ritz-Carlton/)).not.toBeInTheDocument()
  })

  it('la barra de búsqueda lleva a /products con el término', async () => {
    stubCatalog()
    renderHome()
    await userEvent.type(screen.getByLabelText('Buscar'), 'suite')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/products?q=suite')
  })

  it('codifica espacios y tildes en el término buscado', async () => {
    stubCatalog()
    renderHome()
    await userEvent.type(screen.getByLabelText('Buscar'), ' suite junior ñ ')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/products?q=' + encodeURIComponent('suite junior ñ'))
  })
})
