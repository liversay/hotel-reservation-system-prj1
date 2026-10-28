import { useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import ForecastChart, { type ForecastData } from './ForecastChart'

export default function Dashboard() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<ForecastData>('/api/admin/forecast?historyMonths=12&horizonMonths=3')
      .then(setData)
      .catch((e: Error) =>
        setError(e instanceof ApiError && (e.status === 401 || e.status === 403)
          ? 'Necesitas iniciar sesión como administrador para ver la previsión.'
          : e.message))
  }, [])

  const last = data?.history[data.history.length - 1]
  const totalRevenue = data?.history.reduce((s, p) => s + p.revenue, 0) ?? 0

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Previsión de demanda</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!data && !error && <p>Cargando…</p>}
      {data && (
        <>
          <dl className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <dd className="text-3xl font-extrabold text-gray-700">${Math.round(totalRevenue).toLocaleString()}</dd>
              <dt className="text-gray-500">Ingresos (12 meses)</dt>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <dd className="text-3xl font-extrabold text-gray-700">{last ? Math.round(last.occupancy * 100) : 0}%</dd>
              <dt className="text-gray-500">Ocupación mes actual</dt>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <dd className="text-3xl font-extrabold text-gray-700">{data.totalRooms}</dd>
              <dt className="text-gray-500">Habitaciones</dt>
            </div>
          </dl>
          <ForecastChart data={data} />
        </>
      )}
    </div>
  )
}
