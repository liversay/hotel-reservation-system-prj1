import { describe, expect, it } from 'vitest'
import { safeNext } from './Login'

describe('safeNext (anti open-redirect)', () => {
  it('acepta rutas internas', () => {
    expect(safeNext('/book/3')).toBe('/book/3')
  })
  it('rechaza URLs externas y protocol-relative', () => {
    expect(safeNext('https://evil.com')).toBeNull()
    expect(safeNext('//evil.com')).toBeNull()
    expect(safeNext('/\\evil.com')).toBeNull()
    expect(safeNext('javascript:alert(1)')).toBeNull()
    expect(safeNext(null)).toBeNull()
  })
})
