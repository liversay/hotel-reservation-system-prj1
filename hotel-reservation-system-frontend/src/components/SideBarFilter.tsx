import { useState, type FormEvent } from 'react'
import type { RoomFilters } from '../api/hotels'

interface Props {
  initial: RoomFilters
  onApply: (filters: RoomFilters) => void
}

export default function SideBarFilter({ initial, onApply }: Props) {
  const [text, setText] = useState(initial.text)
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice === null ? '' : String(initial.maxPrice))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(maxPrice)
    onApply({ text, maxPrice: maxPrice.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null })
  }
  const clear = () => {
    setText('')
    setMaxPrice('')
    onApply({ text: '', maxPrice: null })
  }

  const field = 'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm'
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Filtrar por</h2>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label htmlFor="filter-text" className="block text-sm font-medium text-gray-700">Buscar</label>
          <input id="filter-text" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Número, tipo u hotel" className={field} />
        </div>
        <div>
          <label htmlFor="filter-max" className="block text-sm font-medium text-gray-700">Precio máximo por noche</label>
          <input id="filter-max" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={field} />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-700 focus:outline-none focus:ring focus:ring-orange-400">
            Aplicar filtros
          </button>
          <button type="button" onClick={clear} className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Limpiar
          </button>
        </div>
      </form>
    </div>
  )
}
