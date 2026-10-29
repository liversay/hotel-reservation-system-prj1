import { useEffect, useState } from 'react'
import CrudPanel from './CrudPanel'
import { api } from '../api/client'

interface Room {
  id: number
  roomNumber: string
  type: string
  pricePerNight: number
  hotelId: number
}

interface Hotel {
  id: number
  name: string
}

const body = (v: Record<string, string>) =>
  JSON.stringify({ hotelId: Number(v.hotelId), roomNumber: v.roomNumber, type: v.type, pricePerNight: Number(v.pricePerNight) })

const load = () => api<Room[]>('/api/rooms')
const create = (v: Record<string, string>) => api('/api/rooms', { method: 'POST', body: body(v) })
const update = (r: Room, v: Record<string, string>) => api(`/api/rooms/${r.id}`, { method: 'PUT', body: body(v) })
const remove = (r: Room) => api(`/api/rooms/${r.id}`, { method: 'DELETE' })

export default function RoomSection() {
  const [hotels, setHotels] = useState<Hotel[] | null>(null)

  useEffect(() => {
    api<Hotel[] | undefined>('/api/hotel/get-all').then((h) => setHotels(h ?? [])).catch(() => setHotels([]))
  }, [])

  if (!hotels) return <p>Cargando…</p>
  if (hotels.length === 0) return <p>Crea primero un hotel en la pestaña Hoteles para poder agregar habitaciones.</p>

  const hotelName = (id: number) => hotels.find((h) => h.id === id)?.name ?? `#${id}`

  return (
    <CrudPanel<Room>
      title="Habitaciones"
      columns={[
        { label: 'Hotel', render: (r) => hotelName(r.hotelId) },
        { label: 'Número', render: (r) => r.roomNumber },
        { label: 'Tipo', render: (r) => r.type },
        { label: 'Precio/noche', render: (r) => `$${r.pricePerNight}` },
      ]}
      fields={[
        { name: 'hotelId', label: 'Hotel', type: 'select', options: hotels.map((h) => ({ value: String(h.id), label: h.name })) },
        { name: 'roomNumber', label: 'Número', required: true },
        { name: 'type', label: 'Tipo', required: true },
        { name: 'pricePerNight', label: 'Precio por noche', type: 'number', required: true },
      ]}
      load={load}
      create={create}
      update={update}
      remove={remove}
      toValues={(r) => ({ hotelId: String(r.hotelId), roomNumber: r.roomNumber ?? '', type: r.type ?? '', pricePerNight: String(r.pricePerNight ?? '') })}
    />
  )
}
