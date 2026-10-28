export type DayStatus = 'AVAILABLE' | 'OCCUPIED' | 'PAST'

export interface DayAvailability {
  date: string // YYYY-MM-DD
  status: DayStatus
}

export interface Range {
  checkIn: string | null
  checkOut: string | null // dia de salida (exclusivo)
}

/** Dias vacios al inicio para alinear el primer dia del mes (semana empieza en lunes). */
export function leadingBlanks(firstDay: string): number {
  const dow = new Date(firstDay + 'T00:00:00').getDay() // 0=domingo
  return (dow + 6) % 7
}

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Un rango [checkIn, checkOut) es reservable si todas sus noches estan AVAILABLE segun el mapa. */
export function isRangeFree(checkIn: string, checkOut: string, status: Map<string, DayStatus>): boolean {
  if (checkOut <= checkIn) return false
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    if (status.get(d) !== 'AVAILABLE') return false
  }
  return true
}

/**
 * Logica de seleccion por clics: 1er clic = entrada, 2do clic = salida.
 * Un clic en dia ocupado/pasado se ignora. Si el rango resultante incluye noches ocupadas,
 * se reinicia con el dia clicado como nueva entrada (nunca se produce un rango invalido).
 */
export function selectDay(current: Range, clicked: string, status: Map<string, DayStatus>): Range {
  if (status.get(clicked) !== 'AVAILABLE') return current
  if (!current.checkIn || current.checkOut) return { checkIn: clicked, checkOut: null }
  if (clicked <= current.checkIn) return { checkIn: clicked, checkOut: null }
  return isRangeFree(current.checkIn, clicked, status)
    ? { checkIn: current.checkIn, checkOut: clicked }
    : { checkIn: clicked, checkOut: null }
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut + 'T00:00:00').getTime() - new Date(checkIn + 'T00:00:00').getTime()) / 86400000)
}
