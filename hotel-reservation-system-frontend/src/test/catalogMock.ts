import { vi } from 'vitest'

export const hotels = [
  { id: 1, name: 'Gran Hotel Sol', location: 'Madrid', description: 'Céntrico', rating: 4.5, roomIds: [10, 11] },
  { id: 2, name: 'Costa Azul', location: 'Cádiz', description: 'Frente al mar', rating: 4, roomIds: [12] },
]
export const rooms = [
  { id: 10, roomNumber: '101', type: 'Doble', pricePerNight: 80, availability: true, hotelId: 1 },
  { id: 11, roomNumber: '201', type: 'Suite', pricePerNight: 250, availability: true, hotelId: 1 },
  { id: 12, roomNumber: '301', type: 'Familiar', pricePerNight: 120, availability: true, hotelId: 2 },
]

export const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
export const fail = (status: number, message: string) => ({ ok: false, status, statusText: message, json: async () => ({ message }) })

/** Simula el backend público; `overrides` permite forzar respuestas por ruta. */
export function stubCatalog(overrides: Record<string, unknown> = {}) {
  const fn = vi.fn(async (url: string) => {
    const path = String(url).replace(/^https?:\/\/[^/]+/, '')
    if (path in overrides) return overrides[path]
    if (path === '/api/rooms') return ok(rooms)
    if (path === '/api/hotel/get-all') return ok(hotels)
    const room = path.match(/^\/api\/rooms\/(\d+)$/)
    if (room) {
      const r = rooms.find((x) => x.id === Number(room[1]))
      return r ? ok(r) : fail(404, 'Habitación no encontrada')
    }
    const hotel = path.match(/^\/api\/hotel\/get-hotel\/(\d+)$/)
    if (hotel) {
      const h = hotels.find((x) => x.id === Number(hotel[1]))
      return h ? ok(h) : fail(404, 'Hotel no encontrado')
    }
    return fail(404, 'ruta inesperada ' + path)
  })
  vi.stubGlobal('fetch', fn)
  return fn
}
