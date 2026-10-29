import { Link } from 'react-router-dom'
import CardRoom from '../components/CardRoom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Hero from '../components/Hero'
import { useCatalog } from '../components/useCatalog'

const FEATURED_ROOMS = 6

export default function Home() {
  const { loading, error, rooms, hotels } = useCatalog()
  const hotelList = [...hotels.values()]

  return (
    <div>
      <Header />
      <main>
        <Hero />
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-2 space-y-12">
          {loading && <p>Cargando…</p>}
          {error && <p role="alert" className="text-red-600">{error}</p>}

          {hotelList.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Nuestros hoteles</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotelList.map((h) => (
                  <li key={h.id} className="rounded-lg bg-white p-4 shadow-md">
                    <Link to={`/products?q=${encodeURIComponent(h.name)}`} className="text-lg font-semibold text-orange-700 hover:underline">{h.name}</Link>
                    {h.location && <p className="text-gray-500">{h.location}</p>}
                    {h.rating != null && <p className="text-sm text-gray-500">Calificación: {h.rating} / 5</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rooms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Habitaciones destacadas</h2>
                <Link to="/products" className="text-orange-700 underline">Ver todas</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.slice(0, FEATURED_ROOMS).map((r) => (
                  <CardRoom key={r.id} room={r} hotel={r.hotelId != null ? hotels.get(r.hotelId) : undefined} />
                ))}
              </div>
            </section>
          )}

          {!loading && !error && rooms.length === 0 && hotelList.length === 0 && (
            <p className="text-center text-gray-600">Aún no hay hoteles ni habitaciones publicados.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
