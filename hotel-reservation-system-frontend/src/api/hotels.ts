import { api } from './client'

export interface Room {
  id: number
  roomNumber: string
  type: string
  pricePerNight: number
  availability?: boolean | null
  hotelId?: number | null
}

export interface Hotel {
  id: number
  name: string
  location?: string | null
  description?: string | null
  rating?: number | null
  roomIds?: number[]
}

export interface RoomFilters {
  text: string
  maxPrice: number | null
}

// get-all responde 204 sin cuerpo cuando no hay datos: api() devuelve undefined.
export const fetchRooms = async () => (await api<Room[] | undefined>('/api/rooms')) ?? []
export const fetchHotels = async () => (await api<Hotel[] | undefined>('/api/hotel/get-all')) ?? []
export const fetchRoom = (id: string | number) => api<Room>(`/api/rooms/${id}`)
export const fetchHotel = (id: string | number) => api<Hotel>(`/api/hotel/get-hotel/${id}`)

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Filtra por texto (número, tipo, nombre u ubicación del hotel) y precio máximo por noche. */
export function filterRooms(rooms: Room[], hotels: Map<number, Hotel>, { text, maxPrice }: RoomFilters): Room[] {
  const needle = norm(text.trim())
  return rooms.filter((r) => {
    if (maxPrice !== null && r.pricePerNight > maxPrice) return false
    if (!needle) return true
    const hotel = r.hotelId != null ? hotels.get(r.hotelId) : undefined
    const haystack = [r.roomNumber, r.type, hotel?.name, hotel?.location].filter(Boolean).join(' ')
    return norm(haystack).includes(needle)
  })
}

/** Carga habitaciones y hoteles; si fallan los hoteles las habitaciones se muestran igual. */
export async function fetchCatalog() {
  const [rooms, hotels] = await Promise.all([fetchRooms(), fetchHotels().catch(() => [] as Hotel[])])
  return { rooms, hotels: new Map(hotels.map((h) => [h.id, h])) }
}
