import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { filterRooms, type RoomFilters } from '../api/hotels'
import CardRoom from '../components/CardRoom'
import Header from '../components/Header'
import HeaderBanner from '../components/HeaderBanner'
import SideBarFilter from '../components/SideBarFilter'
import { useCatalog } from '../components/useCatalog'

export default function Product() {
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<RoomFilters>({ text: params.get('q') ?? '', maxPrice: null })
  const { loading, error, rooms, hotels } = useCatalog()
  const visible = useMemo(() => filterRooms(rooms, hotels, filters), [rooms, hotels, filters])

  return (
    <div>
      <Header />
      <HeaderBanner />
      <main className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 gap-4 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-2">
        <aside className="w-full p-6 bg-white shadow-sm rounded-lg self-start">
          <SideBarFilter initial={filters} onApply={setFilters} />
        </aside>
        <section className="rounded-lg bg-white shadow-sm lg:col-span-2 p-4">
          {loading && <p>Cargando habitaciones…</p>}
          {error && <p role="alert" className="text-red-600">{error}</p>}
          {!loading && !error && visible.length === 0 && <p>No hay habitaciones que coincidan con la búsqueda.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {visible.map((r) => (
              <CardRoom key={r.id} room={r} hotel={r.hotelId != null ? hotels.get(r.hotelId) : undefined} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
