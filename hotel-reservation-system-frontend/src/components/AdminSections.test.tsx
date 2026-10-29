import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HotelSection from './HotelSection'
import UserSection from './UserSection'

afterEach(() => vi.unstubAllGlobals())

const res = (data: unknown, status = 200) => ({ ok: status < 400, status, statusText: 'x', json: async () => data })

describe('HotelSection (CRUD real contra la API)', () => {
  it('lista, crea (POST) y recarga', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(res(undefined, 204))                       // lista vacia
      .mockResolvedValueOnce(res({ message: 'ok' }))                    // POST
      .mockResolvedValueOnce(res([{ id: 1, name: 'Nuevo', location: 'L', description: 'd', rating: 4 }])) // recarga
    vi.stubGlobal('fetch', f)
    render(<HotelSection />)
    expect(await screen.findByText('Sin registros.')).toBeInTheDocument()
    await userEvent.click(screen.getByText('+ Nuevo'))
    await userEvent.type(screen.getByLabelText('Nombre'), 'Nuevo')
    await userEvent.click(screen.getByText('Guardar'))
    expect(await screen.findByText('Nuevo')).toBeInTheDocument()
    const post = f.mock.calls[1]
    expect(post[0]).toContain('/api/hotel/registration-hotel')
    expect(post[1].method).toBe('POST')
    expect(JSON.parse(post[1].body).name).toBe('Nuevo')
  })

  it('edita con PUT y elimina con confirmacion', async () => {
    const hotel = { id: 7, name: 'Viejo', location: 'L', description: 'd', rating: 3 }
    const f = vi.fn()
      .mockResolvedValueOnce(res([hotel]))
      .mockResolvedValueOnce(res({ message: 'ok' }))                     // PUT
      .mockResolvedValueOnce(res([{ ...hotel, name: 'Editado' }]))
      .mockResolvedValueOnce(res({ message: 'ok' }))                     // DELETE
      .mockResolvedValueOnce(res(undefined, 204))
    vi.stubGlobal('fetch', f)
    render(<HotelSection />)
    await userEvent.click(await screen.findByText('Editar'))
    const name = screen.getByLabelText('Nombre')
    await userEvent.clear(name)
    await userEvent.type(name, 'Editado')
    await userEvent.click(screen.getByText('Guardar'))
    await screen.findByText('Editado')
    expect(f.mock.calls[1][0]).toContain('/api/hotel/update-hotel/7')
    expect(f.mock.calls[1][1].method).toBe('PUT')
    await userEvent.click(screen.getByText('Eliminar'))
    await userEvent.click(screen.getByText('Sí'))
    expect(await screen.findByText('Sin registros.')).toBeInTheDocument()
    expect(f.mock.calls[3][0]).toContain('/api/hotel/delete-hotel/7')
    expect(f.mock.calls[3][1].method).toBe('DELETE')
  })

  it('muestra el error 409 del backend al eliminar', async () => {
    const hotel = { id: 7, name: 'H', location: 'L', description: 'd', rating: 3 }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(res([hotel]))
      .mockResolvedValueOnce(res({ message: 'No se puede eliminar: el hotel tiene habitaciones con reservas' }, 409)))
    render(<HotelSection />)
    await userEvent.click(await screen.findByText('Eliminar'))
    await userEvent.click(screen.getByText('Sí'))
    expect(await screen.findByRole('alert')).toHaveTextContent('tiene habitaciones con reservas')
  })
})

describe('UserSection', () => {
  it('crea usuario exigiendo contraseña y muestra rol', async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(res([{ id: 1, username: 'admin', email: 'a@t.com', role: 'ADMIN' }]))
      .mockResolvedValueOnce(res({ id: 2 }, 201))
      .mockResolvedValueOnce(res([{ id: 1, username: 'admin', email: 'a@t.com', role: 'ADMIN' }, { id: 2, username: 'ana', email: 'ana@t.com', role: 'USER' }]))
    vi.stubGlobal('fetch', f)
    render(<UserSection />)
    await screen.findByText('admin')
    await userEvent.click(screen.getByText('+ Nuevo'))
    const form = screen.getByRole('form')
    await userEvent.type(within(form).getByLabelText('Usuario'), 'ana')
    await userEvent.type(within(form).getByLabelText('Email'), 'ana@t.com')
    await userEvent.type(within(form).getByLabelText(/Contraseña/), 'password1')
    await userEvent.click(screen.getByText('Guardar'))
    await screen.findByText('ana')
    expect(JSON.parse(f.mock.calls[1][1].body)).toMatchObject({ username: 'ana', role: 'USER', password: 'password1' })
  })

  it('en edicion no muestra el campo usuario', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res([{ id: 1, username: 'admin', email: 'a@t.com', role: 'ADMIN' }])))
    render(<UserSection />)
    await userEvent.click(await screen.findByText('Editar'))
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
  })
})
