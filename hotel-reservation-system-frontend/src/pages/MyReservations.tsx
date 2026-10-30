import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { friendlyError } from '../utils/errors'
import { todayLocal } from '../utils/calendar'

export interface Reservation {
  id: number
  startDate: string
  endDate: string
  status: string
  totalPrice: number
  room: { roomNumber: string; type: string }
  payments?: { id: number; amount: number; status: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
}

const refunded = (r: Reservation) =>
  (r.payments ?? []).filter((p) => p.status === 'REFUNDED').reduce((sum, p) => sum + p.amount, 0)

const day = (iso: string) => iso.slice(0, 10)

export default function MyReservations() {
  const [items, setItems] = useState<Reservation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    api<Reservation[]>('/api/reservations/mine').then(setItems).catch((e: unknown) => setError(friendlyError(e)))
  }, [])

  const cancel = async (r: Reservation) => {
    setError(null)
    setConfirmingId(null)
    try {
      const updated = await api<Reservation>(`/api/reservations/${r.id}/cancel`, { method: 'PUT' })
      setItems((list) => list?.map((x) => (x.id === r.id ? { ...x, status: updated.status, payments: updated.payments ?? x.payments } : x)) ?? null)
    } catch (e) {
      setError(friendlyError(e))
    }
  }

  const cancellable = (r: Reservation) => r.status !== 'CANCELLED' && day(r.startDate) > todayLocal()

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-6">
      <Link to="/" className="text-sm text-blue-700 underline">← Inicio</Link>
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {items?.length === 0 && <p>Aún no tienes reservas.</p>}
      <ul className="space-y-2">
        {items?.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
            <span>
              Hab. {r.room.roomNumber} · {day(r.startDate)} → {day(r.endDate)} · ${r.totalPrice} ·{' '}
              <strong className={r.status === 'CANCELLED' ? 'text-red-600' : 'text-green-700'}>{STATUS_LABEL[r.status] ?? r.status}</strong>
              {r.status === 'CANCELLED' && refunded(r) > 0 && (
                <span className="ml-2 text-sm text-gray-700">Reembolsado ${refunded(r)}</span>
              )}
            </span>
            {cancellable(r) && confirmingId !== r.id && (
              <button onClick={() => setConfirmingId(r.id)} className="rounded border border-red-400 px-2 py-1 text-sm text-red-700">Cancelar reserva</button>
            )}
            {cancellable(r) && confirmingId === r.id && (
              <span className="flex items-center gap-2 text-sm">
                <span>¿Confirmar cancelación?</span>
                <button onClick={() => cancel(r)} className="rounded bg-red-600 px-2 py-1 text-white">Sí, cancelar</button>
                <button onClick={() => setConfirmingId(null)} className="rounded border px-2 py-1">No, mantener</button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
