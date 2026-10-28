import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export interface Reservation {
  id: number
  startDate: string
  endDate: string
  status: string
  totalPrice: number
  room: { roomNumber: string; type: string }
}

const day = (iso: string) => iso.slice(0, 10)

export default function MyReservations() {
  const [items, setItems] = useState<Reservation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Reservation[]>('/api/reservations/mine').then(setItems).catch((e: Error) => setError(e.message))
  }, [])

  const cancel = async (r: Reservation) => {
    setError(null)
    try {
      const updated = await api<Reservation>(`/api/reservations/${r.id}/cancel`, { method: 'PUT' })
      setItems((list) => list?.map((x) => (x.id === r.id ? { ...x, status: updated.status } : x)) ?? null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const cancellable = (r: Reservation) => r.status !== 'CANCELLED' && day(r.startDate) > new Date().toISOString().slice(0, 10)

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-6">
      <Link to="/" className="text-sm text-blue-700 underline">← Inicio</Link>
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {items?.length === 0 && <p>Aún no tienes reservas.</p>}
      <ul className="space-y-2">
        {items?.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded border p-3">
            <span>
              Hab. {r.room.roomNumber} · {day(r.startDate)} → {day(r.endDate)} · ${r.totalPrice} ·{' '}
              <strong className={r.status === 'CANCELLED' ? 'text-red-600' : 'text-green-700'}>{r.status}</strong>
            </span>
            {cancellable(r) && (
              <button onClick={() => cancel(r)} className="rounded border border-red-400 px-2 py-1 text-sm text-red-700">Cancelar</button>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
