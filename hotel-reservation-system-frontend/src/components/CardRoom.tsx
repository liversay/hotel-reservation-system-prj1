import type { Hotel, Room } from '../api/hotels'
import Button from './Button'
import RoomPhoto from './RoomPhoto'

export default function CardRoom({ room, hotel }: { room: Room; hotel?: Hotel }) {
  return (
    <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl hover:-translate-y-2 transition-transform duration-300 ease-in-out bg-white">
      <RoomPhoto className="h-64 w-full" />
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-black">{room.type} · Hab. {room.roomNumber}</h3>
          <div className="text-2xl font-bold text-black">${room.pricePerNight}<span className="text-sm font-normal text-gray-500"> / noche</span></div>
        </div>
        <div className="text-gray-500">
          <p>{hotel?.name ?? 'Hotel'}</p>
          {hotel?.location && <p className="text-sm">{hotel.location}</p>}
        </div>
        <div className="mt-4 md:mt-8">
          <Button to={`/rooms/${room.id}`} content="Ver disponibilidad" className="w-full px-12 py-3 text-center" />
        </div>
      </div>
    </div>
  )
}
