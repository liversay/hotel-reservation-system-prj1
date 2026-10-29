import type { Hotel, Room } from '../api/hotels'
import Button from './Button'
import RoomPhoto from './RoomPhoto'

export default function RoomDetailComponent({ room, hotel }: { room: Room; hotel?: Hotel | null }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg shadow-lg">
        <RoomPhoto className="h-full min-h-64 w-full" />
      </div>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">{room.type}</h2>
          <p className="text-gray-500">Habitación {room.roomNumber}</p>
          <p className="text-2xl font-semibold mt-2">${room.pricePerNight} / noche</p>
          <p className={room.availability === false ? 'text-red-600' : 'text-green-700'}>
            {room.availability === false ? 'No disponible actualmente' : 'Disponible'}
          </p>
        </div>
        {hotel && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Hotel</h3>
            <p>{hotel.name}</p>
            {hotel.location && <p className="text-gray-500">{hotel.location}</p>}
            {hotel.rating != null && <p className="text-gray-500">Calificación: {hotel.rating} / 5</p>}
            {hotel.description && <p className="mt-2 text-gray-600">{hotel.description}</p>}
          </div>
        )}
        <Button to={`/book/${room.id}`} content="Reservar" className="w-full text-center" />
      </div>
    </section>
  )
}
