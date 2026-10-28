import { describe, expect, it } from 'vitest'
import { isRangeFree, leadingBlanks, nightsBetween, selectDay, type DayStatus } from './calendar'

const map = (entries: Record<string, DayStatus>) => new Map(Object.entries(entries))

const status = map({
  '2030-05-01': 'AVAILABLE',
  '2030-05-02': 'AVAILABLE',
  '2030-05-03': 'OCCUPIED',
  '2030-05-04': 'AVAILABLE',
  '2030-05-05': 'AVAILABLE',
  '2030-04-30': 'PAST',
})

describe('isRangeFree', () => {
  it('acepta rango con todas las noches libres (check-out exclusivo)', () => {
    expect(isRangeFree('2030-05-01', '2030-05-03', status)).toBe(true) // noches 1 y 2; el 3 es la salida
  })
  it('rechaza rango que incluye una noche ocupada', () => {
    expect(isRangeFree('2030-05-02', '2030-05-04', status)).toBe(false)
  })
  it('rechaza rango vacio o invertido', () => {
    expect(isRangeFree('2030-05-02', '2030-05-02', status)).toBe(false)
    expect(isRangeFree('2030-05-02', '2030-05-01', status)).toBe(false)
  })
  it('rechaza dias desconocidos (fuera del mes cargado)', () => {
    expect(isRangeFree('2030-05-05', '2030-05-07', status)).toBe(false)
  })
})

describe('selectDay', () => {
  it('primer clic fija la entrada y segundo la salida', () => {
    const a = selectDay({ checkIn: null, checkOut: null }, '2030-05-01', status)
    expect(a).toEqual({ checkIn: '2030-05-01', checkOut: null })
    expect(selectDay(a, '2030-05-03', status)).toEqual({ checkIn: '2030-05-01', checkOut: null }) // 3 ocupado: ignorado
    expect(selectDay(a, '2030-05-02', status)).toEqual({ checkIn: '2030-05-01', checkOut: '2030-05-02' })
  })
  it('ignora clics en dias ocupados o pasados', () => {
    const start = { checkIn: null, checkOut: null }
    expect(selectDay(start, '2030-05-03', status)).toBe(start)
    expect(selectDay(start, '2030-04-30', status)).toBe(start)
  })
  it('reinicia si el rango cruza un dia ocupado', () => {
    const a = { checkIn: '2030-05-02', checkOut: null }
    expect(selectDay(a, '2030-05-05', status)).toEqual({ checkIn: '2030-05-05', checkOut: null })
  })
  it('un clic anterior a la entrada mueve la entrada', () => {
    const a = { checkIn: '2030-05-02', checkOut: null }
    expect(selectDay(a, '2030-05-01', status)).toEqual({ checkIn: '2030-05-01', checkOut: null })
  })
  it('con rango completo, un nuevo clic empieza otro rango', () => {
    const a = { checkIn: '2030-05-01', checkOut: '2030-05-02' }
    expect(selectDay(a, '2030-05-04', status)).toEqual({ checkIn: '2030-05-04', checkOut: null })
  })
})

describe('helpers', () => {
  it('leadingBlanks: lunes=0, domingo=6', () => {
    expect(leadingBlanks('2030-05-06')).toBe(0) // lunes
    expect(leadingBlanks('2030-05-05')).toBe(6) // domingo
  })
  it('nightsBetween cuenta noches', () => {
    expect(nightsBetween('2030-05-01', '2030-05-04')).toBe(3)
  })
})
