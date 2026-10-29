import { useEffect, useState } from 'react'
import { fetchCatalog, type Hotel, type Room } from '../api/hotels'

export interface CatalogState {
  loading: boolean
  error: string | null
  rooms: Room[]
  hotels: Map<number, Hotel>
}

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ loading: true, error: null, rooms: [], hotels: new Map() })
  useEffect(() => {
    let alive = true
    fetchCatalog()
      .then((c) => alive && setState({ loading: false, error: null, ...c }))
      .catch((e: Error) => alive && setState({ loading: false, error: e.message, rooms: [], hotels: new Map() }))
    return () => {
      alive = false
    }
  }, [])
  return state
}
