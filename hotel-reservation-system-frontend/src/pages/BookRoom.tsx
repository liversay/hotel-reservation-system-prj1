import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, tokenStore } from '../api/client'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import { nightsBetween, type Range } from '../utils/calendar'

interface Room {
  id: number
  roomNumber: string
  type: string
  pricePerNight: number
}

export default function BookRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [range, setRange] = useState<Range>({ checkIn: null, checkOut: null })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const loggedIn = !!tokenStore.get()

  useEffect(() => {
    api<Room>(`/api/rooms/${roomId}`).then(setRoom).catch((e: Error) => setError(e.message))
  }, [roomId])

  const nights = range.checkIn && range.checkOut ? nightsBetween(range.checkIn, range.checkOut) : 0

  const reserve = async () => {
    if (!loggedIn) return navigate(`/login?next=/book/${roomId}`)
    setError(null)
    try {
      await api('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId: Number(roomId), checkIn: range.checkIn, checkOut: range.checkOut }),
      })
      setDone('¡Reserva confirmada!')
    } catch (e) {
      // 409: alguien reservo esas fechas mientras se elegia; el calendario se refresca al cambiar de mes
      setError(e instanceof ApiError && e.status === 409 ? 'Esas fechas ya no están disponibles. Elige otras.' : (e as Error).message)
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link to="/" className="text-sm text-blue-700 underline">← Inicio</Link>
      <h1 className="text-2xl font-bold">Reservar habitación {room?.roomNumber} {room && `· ${room.type}`}</h1>
      <AvailabilityCalendar roomId={Number(roomId)} onChange={setRange} />
      {nights > 0 && room && (
        <p>{range.checkIn} → {range.checkOut} · {nights} noche(s) · <strong>${nights * room.pricePerNight}</strong></p>
      )}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {done ? <p role="status" className="font-semibold text-green-700">{done}</p> : (
        <button disabled={nights === 0} onClick={reserve} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-40">
          {loggedIn ? 'Reservar' : 'Inicia sesión para reservar'}
        </button>
      )}
    </main>
  )
}
