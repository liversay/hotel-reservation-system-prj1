import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { leadingBlanks, selectDay, type DayAvailability, type DayStatus, type Range } from '../utils/calendar'

interface Props {
  roomId: number
  onChange: (range: Range) => void
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const STYLES: Record<DayStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-900 hover:bg-green-200 cursor-pointer',
  OCCUPIED: 'bg-red-100 text-red-400 line-through cursor-not-allowed',
  PAST: 'bg-gray-100 text-gray-300 cursor-not-allowed',
}

export default function AvailabilityCalendar({ roomId, onChange }: Props) {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [days, setDays] = useState<DayAvailability[]>([])
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>({ checkIn: null, checkOut: null })

  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`

  useEffect(() => {
    let cancelled = false
    setError(null)
    api<DayAvailability[]>(`/api/rooms/${roomId}/availability?month=${monthKey}`)
      .then((d) => !cancelled && setDays(d))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [roomId, monthKey])

  const statusByDate = useMemo(() => new Map(days.map((d) => [d.date, d.status])), [days])

  const click = (date: string) => {
    const next = selectDay(range, date, statusByDate)
    if (next !== range) {
      setRange(next)
      onChange(next)
    }
  }

  const shiftMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const inRange = (date: string) =>
    !!range.checkIn && date >= range.checkIn && (range.checkOut ? date < range.checkOut : date === range.checkIn)

  return (
    <div className="w-full max-w-sm rounded-lg border p-4" aria-label="Calendario de disponibilidad">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mes anterior" className="px-2">‹</button>
        <h3 className="font-semibold">{MONTHS[cursor.month]} {cursor.year}</h3>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Mes siguiente" className="px-2">›</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">No se pudo cargar la disponibilidad: {error}</p>}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAYS.map((w) => <div key={w} className="font-medium text-gray-500">{w}</div>)}
        {days.length > 0 && Array.from({ length: leadingBlanks(days[0].date) }, (_, i) => <div key={`b${i}`} />)}
        {days.map((d) => (
          <button
            key={d.date}
            type="button"
            disabled={d.status !== 'AVAILABLE'}
            data-status={d.status}
            aria-label={`${d.date} ${d.status === 'AVAILABLE' ? 'disponible' : d.status === 'OCCUPIED' ? 'ocupado' : 'pasado'}`}
            onClick={() => click(d.date)}
            className={`rounded py-1 ${STYLES[d.status]} ${inRange(d.date) ? 'ring-2 ring-blue-500 font-bold' : ''}`}
          >
            {Number(d.date.slice(8))}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-3 text-xs text-gray-600">
        <span><i className="mr-1 inline-block h-3 w-3 rounded bg-green-100" />Disponible</span>
        <span><i className="mr-1 inline-block h-3 w-3 rounded bg-red-100" />Ocupado</span>
      </div>
    </div>
  )
}
