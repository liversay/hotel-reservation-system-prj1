export interface ForecastPoint {
  month: string
  roomNights: number
  revenue: number
  occupancy: number
  suggestedPriceChangePct: number
}

export interface ForecastData {
  totalRooms: number
  history: ForecastPoint[]
  forecast: ForecastPoint[]
}

const W = 640
const H = 240
const PAD = { top: 16, right: 12, bottom: 32, left: 40 }

export default function ForecastChart({ data }: { data: ForecastData }) {
  const points = [
    ...data.history.map((p) => ({ ...p, predicted: false })),
    ...data.forecast.map((p) => ({ ...p, predicted: true })),
  ]
  const max = Math.max(1, ...points.map((p) => p.roomNights))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const slot = innerW / Math.max(1, points.length)
  const barW = slot * 0.7
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Noches reservadas por mes: histórico y previsión" className="w-full">
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(max * t)} y2={y(max * t)} stroke="#e5e7eb" />
            <text x={PAD.left - 6} y={y(max * t) + 4} textAnchor="end" fontSize="10" fill="#6b7280">{Math.round(max * t)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2
          return (
            <g key={p.month} data-testid={p.predicted ? 'bar-forecast' : 'bar-history'}>
              <title>{`${p.month}: ${p.roomNights} noches (${Math.round(p.occupancy * 100)}% ocupación)${p.predicted ? ' — previsión' : ''}`}</title>
              <rect x={x} y={y(p.roomNights)} width={barW} height={PAD.top + innerH - y(p.roomNights)}
                fill={p.predicted ? '#f59e0b' : '#2563eb'} fillOpacity={p.predicted ? 0.55 : 0.9}
                stroke={p.predicted ? '#b45309' : 'none'} strokeDasharray={p.predicted ? '4 2' : undefined} />
              {(i % 2 === 0 || p.predicted) && (
                <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize="9" fill="#6b7280">{p.month.slice(2)}</text>
              )}
            </g>
          )
        })}
      </svg>
      <p className="mt-1 text-xs text-gray-500">
        <span className="mr-3"><i className="mr-1 inline-block h-2 w-2 bg-blue-600" />Histórico</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-amber-500" />Previsión</span>
      </p>
      <table className="mt-4 w-full text-sm">
        <caption className="mb-1 text-left font-semibold">Ajuste de precios sugerido</caption>
        <thead><tr className="text-left text-gray-500"><th>Mes</th><th>Noches previstas</th><th>Ocupación</th><th>Precio</th></tr></thead>
        <tbody>
          {data.forecast.map((p) => (
            <tr key={p.month} className="border-t">
              <td>{p.month}</td>
              <td>{p.roomNights}</td>
              <td>{Math.round(p.occupancy * 100)}%</td>
              <td className={p.suggestedPriceChangePct > 0 ? 'text-green-700' : p.suggestedPriceChangePct < 0 ? 'text-red-700' : ''}>
                {p.suggestedPriceChangePct > 0 ? '+' : ''}{p.suggestedPriceChangePct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
