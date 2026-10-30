import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { fetchRoom } from '../api/hotels'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import SavedCards, { type PaymentMethod } from '../components/SavedCards'
import { isAuthenticated } from '../auth/session'
import { friendlyError } from '../utils/errors'
import { nightsBetween, type Range } from '../utils/calendar'

interface Room {
  id: number
  roomNumber: string
  type: string
  pricePerNight: number
}

export default function BookRoom() {
  const { roomId } = useParams()
  const validId = !!roomId && /^\d+$/.test(roomId)
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [range, setRange] = useState<Range>({ checkIn: null, checkOut: null })
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [done, setDone] = useState<string | null>(null)
  const loggedIn = isAuthenticated()
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null)
  const [methodId, setMethodId] = useState<number | null>(null)

  useEffect(() => {
    if (!validId) return
    fetchRoom(roomId!).then((r) => setRoom(r as Room)).catch((e: unknown) => setError(friendlyError(e)))
  }, [roomId, validId])

  useEffect(() => {
    if (!loggedIn || !validId) return
    api<PaymentMethod[]>('/api/payment-methods')
      .then((list) => {
        setMethods(list)
        setMethodId((list.find((m) => m.defaultMethod) ?? list[0])?.id ?? null) // predeterminada preseleccionada
      })
      .catch((e: unknown) => setError(friendlyError(e)))
  }, [loggedIn, validId])

  const nights = range.checkIn && range.checkOut ? nightsBetween(range.checkIn, range.checkOut) : 0

  const reserve = async () => {
    if (!loggedIn) return navigate(`/login?next=${encodeURIComponent(`/book/${roomId}`)}`)
    setError(null)
    try {
      await api('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId: Number(roomId), checkIn: range.checkIn, checkOut: range.checkOut, savedPaymentMethodId: methodId }),
      })
      setDone('¡Reserva confirmada!')
      setRefreshKey((k) => k + 1) // recarga el mes para marcar los días recién reservados
    } catch (e) {
      // 409: alguien reservo esas fechas mientras se elegia; el calendario se refresca al cambiar de mes
      setError(e instanceof ApiError && e.status === 409 ? 'Esas fechas ya no están disponibles. Elige otras.' : friendlyError(e))
    }
  }

  if (!validId) {
    return (
      <main className="mx-auto max-w-xl space-y-3 p-6 text-center">
        <p className="text-xl font-semibold">Habitación no encontrada</p>
        <Link to="/products" className="text-blue-700 underline">Volver a habitaciones</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link to="/" className="text-sm text-blue-700 underline">← Inicio</Link>
      <h1 className="text-2xl font-bold">Reservar habitación {room?.roomNumber} {room && `· ${room.type}`}</h1>
      <AvailabilityCalendar roomId={Number(roomId)} onChange={(r) => { setRange(r); setDone(null) }} refreshKey={refreshKey} />
      {nights > 0 && room && (
        <p>{range.checkIn} → {range.checkOut} · {nights} noche(s) · <strong>${nights * room.pricePerNight}</strong></p>
      )}
      {loggedIn && methods && (
        <SavedCards methods={methods} selectedId={methodId} onSelect={setMethodId}
          onAdded={(m) => { setMethods([...methods, m]); setMethodId(m.id) }} />
      )}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {done ? <p role="status" className="font-semibold text-green-700">{done}</p> : (
        <button disabled={nights === 0} onClick={reserve} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40">
          {!loggedIn ? 'Inicia sesión para reservar' : methodId ? 'Reservar y pagar con tarjeta guardada' : 'Reservar (pago en el hotel)'}
        </button>
      )}
    </main>
  )
}
