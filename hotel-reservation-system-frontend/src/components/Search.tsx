import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Search() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <div className="absolute inset-x-0 mx-auto max-w-4xl bg-gray-100/90 rounded-md shadow-lg p-2 sm:p-3 bottom-1/2 lg:bottom-1/3 w-full z-10">
      <form onSubmit={submit} role="search" className="flex flex-col sm:flex-row gap-2 sm:items-end p-1">
        <div className="flex-1">
          <label htmlFor="home-search" className="block text-sm font-medium text-gray-700">Buscar</label>
          <input
            id="home-search"
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hotel, ciudad, tipo o número de habitación"
            className="mt-1 w-full py-2 px-4 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm"
          />
        </div>
        <button type="submit" className="shrink-0 rounded-md border border-orange-600 bg-orange-600 px-16 py-2 text-sm font-medium text-white transition hover:bg-transparent hover:text-orange-600 focus:outline-none focus:ring focus:ring-orange-400">
          Buscar
        </button>
      </form>
    </div>
  )
}
