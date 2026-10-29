import { test, expect } from '@playwright/test'
import {
  adminToken, cleanupHotel, cleanupUsers, createHotel, createRoom, day, goNextMonth, nextMonthDate,
  registerUser, reserveViaApi, uid, useSession,
} from './helpers'

const suffix = uid('b')
const username = `cus${suffix}`
let hotelId: number
let roomId: number
let admin: string
let token: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
  hotelId = await createHotel(request, admin, `Hotel ${suffix}`)
  roomId = await createRoom(request, admin, hotelId, `B-${suffix}`, 'Doble E2E', 100)
  token = (await registerUser(request, username)).token
  // Ocupa las noches del 10 y 11 del mes siguiente (checkout el 12).
  await reserveViaApi(request, token, roomId, nextMonthDate(10), nextMonthDate(12))
})

test.afterAll(async ({ request }) => {
  await cleanupHotel(request, admin, hotelId)
  await cleanupUsers(request, admin, username)
})

test.beforeEach(async ({ page }) => {
  await useSession(page, token)
  await page.goto(`/book/${roomId}`)
})

test('las flechas de mes cambian el mes con clics reales (ida y vuelta)', async ({ page }) => {
  const title = page.getByRole('heading', { level: 3 })
  const first = await title.textContent()
  await goNextMonth(page)
  const second = await title.textContent()
  expect(second).not.toBe(first)
  await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(title).toHaveText(first!)
})

test('días ocupados no son seleccionables y un rango que los cruza se rechaza', async ({ page }) => {
  await goNextMonth(page)
  const occupied = day(page, nextMonthDate(10), 'ocupado')
  await expect(occupied).toBeDisabled()
  await expect(day(page, nextMonthDate(11), 'ocupado')).toBeDisabled()
  await expect(day(page, nextMonthDate(12), 'disponible')).toBeEnabled()
  await expect(day(page, nextMonthDate(9), 'disponible')).toBeEnabled()

  // 8 -> 14 cruza las noches ocupadas: no se forma rango (no hay resumen ni se habilita reservar).
  await day(page, nextMonthDate(8), 'disponible').click()
  await day(page, nextMonthDate(14), 'disponible').click()
  await expect(page.getByText(/noche\(s\)/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Reservar/ })).toBeDisabled()

  // Tras el rechazo se puede elegir un rango valido sin recargar.
  await day(page, nextMonthDate(14), 'disponible').click() // ya es la entrada; clic en el mismo dia lo reinicia
  await day(page, nextMonthDate(16), 'disponible').click()
  await expect(page.getByText(/2 noche\(s\)/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Reservar/ })).toBeEnabled()
})

test('reserva completa y el calendario marca los días nuevos como ocupados sin recargar', async ({ page }) => {
  await goNextMonth(page)
  const from = nextMonthDate(20)
  const to = nextMonthDate(23)
  await day(page, from, 'disponible').click()
  await day(page, to, 'disponible').click()
  await expect(page.getByText('3 noche(s)')).toBeVisible()
  await expect(page.getByText('$300')).toBeVisible()

  await page.getByRole('button', { name: /Reservar/ }).click()
  await expect(page.getByRole('status')).toHaveText('¡Reserva confirmada!')

  for (const d of [20, 21, 22]) {
    await expect(day(page, nextMonthDate(d), 'ocupado')).toBeDisabled()
  }
  await expect(day(page, to, 'disponible')).toBeEnabled() // el dia de salida queda libre
})

test('una reserva que otro usuario hizo mientras se elegía da un mensaje claro (409)', async ({ page, request }) => {
  await goNextMonth(page)
  await day(page, nextMonthDate(25), 'disponible').click()
  await day(page, nextMonthDate(27), 'disponible').click()
  await reserveViaApi(request, token, roomId, nextMonthDate(26), nextMonthDate(28)) // se solapa
  await page.getByRole('button', { name: /Reservar/ }).click()
  await expect(page.getByRole('alert')).toContainText('Esas fechas ya no están disponibles')
})
