import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-content-center gap-4 bg-white px-4 text-center">
      <p className="text-sm uppercase tracking-widest text-gray-500">Error 404</p>
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link to="/" className="text-orange-600 underline">Volver al inicio</Link>
    </main>
  )
}
