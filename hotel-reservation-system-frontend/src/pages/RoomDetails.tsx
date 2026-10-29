import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchHotel, fetchRoom, type Hotel, type Room } from '../api/hotels'
import { ApiError } from '../api/client'
import Header from '../components/Header'
import HeaderBanner from '../components/HeaderBanner'
import RoomDetailComponent from '../components/RoomDetailComponent'

export default function RoomDetails() {
  const { id } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setNotFound(false)
    setRoom(null)
    setHotel(null)
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }
    fetchRoom(id)
      .then((r) => {
        if (!alive) return
        setRoom(r)
        if (r.hotelId != null) fetchHotel(r.hotelId).then((h) => alive && setHotel(h)).catch(() => {})
      })
      .catch((e: Error) => {
        if (!alive) return
        if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setNotFound(true)
        else setError(e.message)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div>
      <Header />
      <HeaderBanner />
      <main>
        {loading && <p className="p-6">Cargando habitación…</p>}
        {error && <p role="alert" className="p-6 text-red-600">{error}</p>}
        {notFound && (
          <div className="mx-auto max-w-xl space-y-3 p-6 text-center">
            <p className="text-xl font-semibold">Habitación no encontrada</p>
            <Link to="/products" className="text-orange-700 underline">Volver a habitaciones</Link>
          </div>
        )}
        {room && <RoomDetailComponent room={room} hotel={hotel} />}
      </main>
    </div>
  )
}
