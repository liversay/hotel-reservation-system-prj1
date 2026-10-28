import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SavedCards, { type PaymentMethod } from './SavedCards'

const visa: PaymentMethod = { id: 1, brand: 'VISA', last4: '4242', holderName: 'Ana', expMonth: 12, expYear: 2031, defaultMethod: true }

afterEach(() => vi.unstubAllGlobals())

describe('SavedCards', () => {
  it('lista tarjetas guardadas sin mostrar numero completo y permite elegirlas', async () => {
    const onSelect = vi.fn()
    render(<SavedCards methods={[visa]} selectedId={null} onSelect={onSelect} onAdded={() => {}} />)
    expect(screen.getByText(/VISA •••• 4242/)).toBeInTheDocument()
    expect(screen.getByText('predeterminada')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('sin tarjetas muestra el formulario y notifica la tarjeta creada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => visa }))
    const onAdded = vi.fn()
    render(<SavedCards methods={[]} selectedId={null} onSelect={() => {}} onAdded={onAdded} />)
    await userEvent.type(screen.getByLabelText('Número de tarjeta'), '4242424242424242')
    await userEvent.type(screen.getByLabelText('Titular'), 'Ana')
    await userEvent.type(screen.getByLabelText('Mes'), '12')
    await userEvent.type(screen.getByLabelText('Año'), '2031')
    await userEvent.click(screen.getByText('Guardar tarjeta'))
    expect(onAdded).toHaveBeenCalledWith(visa)
  })

  it('muestra el error del backend (tarjeta invalida)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, statusText: 'Bad', json: async () => ({ message: 'Numero de tarjeta invalido' }) }))
    render(<SavedCards methods={[]} selectedId={null} onSelect={() => {}} onAdded={() => {}} />)
    await userEvent.type(screen.getByLabelText('Número de tarjeta'), '1111')
    await userEvent.type(screen.getByLabelText('Titular'), 'Ana')
    await userEvent.type(screen.getByLabelText('Mes'), '12')
    await userEvent.type(screen.getByLabelText('Año'), '2031')
    await userEvent.click(screen.getByText('Guardar tarjeta'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Numero de tarjeta invalido')
  })
})
