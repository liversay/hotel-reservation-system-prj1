import CrudPanel from './CrudPanel'
import { api } from '../api/client'

interface Hotel {
  id: number
  name: string
  location: string
  description: string
  rating: number
}

const body = (v: Record<string, string>) =>
  JSON.stringify({ name: v.name, location: v.location, description: v.description, rating: v.rating === '' ? null : Number(v.rating) })

// Definidos fuera del componente para tener identidad estable (CrudPanel recarga al cambiar `load`).
const load = async () => (await api<Hotel[] | undefined>('/api/hotel/get-all')) ?? [] // el backend responde 204 si no hay hoteles
const create = (v: Record<string, string>) => api('/api/hotel/registration-hotel', { method: 'POST', body: body(v) })
const update = (h: Hotel, v: Record<string, string>) => api(`/api/hotel/update-hotel/${h.id}`, { method: 'PUT', body: body(v) })
const remove = (h: Hotel) => api(`/api/hotel/delete-hotel/${h.id}`, { method: 'DELETE' })

export default function HotelSection() {
  return (
    <CrudPanel<Hotel>
      title="Hoteles"
      columns={[
        { label: 'ID', render: (h) => h.id },
        { label: 'Nombre', render: (h) => h.name },
        { label: 'Ubicación', render: (h) => h.location },
        { label: 'Descripción', render: (h) => h.description },
        { label: 'Rating', render: (h) => h.rating },
      ]}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'location', label: 'Ubicación' },
        { name: 'description', label: 'Descripción' },
        { name: 'rating', label: 'Rating (0-5)', type: 'number' },
      ]}
      load={load}
      create={create}
      update={update}
      remove={remove}
      toValues={(h) => ({ name: h.name ?? '', location: h.location ?? '', description: h.description ?? '', rating: h.rating?.toString() ?? '' })}
    />
  )
}
