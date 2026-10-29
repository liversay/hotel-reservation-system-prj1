import { test, expect } from '@playwright/test'
import {
  adminToken, API, auth, cleanupHotel, cleanupUsers, createHotel, createRoom, day, goNextMonth, nextMonthDate,
  registerUser, uid, useSession,
} from './helpers'

const suffix = uid('c')
const username = `card${suffix}`
let hotelId: number
let roomId: number
let admin: string
let token: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
  hotelId = await createHotel(request, admin, `Hotel ${suffix}`)
  roomId = await createRoom(request, admin, hotelId, `C-${suffix}`, 'Suite E2E', 120)
  token = (await registerUser(request, username)).token
})

test.afterAll(async ({ request }) => {
  await cleanupHotel(request, admin, hotelId)
  await cleanupUsers(request, admin, username)
})

test('guardar una tarjeta y reservar con un clic con la guardada', async ({ page, request }) => {
  await useSession(page, token)
  await page.goto(`/book/${roomId}`)

  // Sin tarjetas guardadas: el formulario de alta aparece abierto y la reserva es "pago en el hotel".
  await expect(page.getByRole('button', { name: 'Reservar (pago en el hotel)' })).toBeVisible()

  // Un numero invalido muestra error.
  await page.getByLabel('Número de tarjeta').fill('1234')
  await page.getByLabel('Titular').fill('E2E Tester')
  await page.getByLabel('Mes', { exact: true }).fill('12')
  await page.getByLabel('Año', { exact: true }).fill('2030')
  await page.getByRole('button', { name: 'Guardar tarjeta' }).click()
  await expect(page.getByRole('alert')).not.toHaveCount(0)

  await page.getByLabel('Número de tarjeta').fill('4111111111111111')
  await page.getByRole('button', { name: 'Guardar tarjeta' }).click()
  await expect(page.getByText('•••• 1111')).toBeVisible()
  await expect(page.getByRole('radio')).toBeChecked()

  await goNextMonth(page)
  await day(page, nextMonthDate(5), 'disponible').click()
  await day(page, nextMonthDate(7), 'disponible').click()
  await expect(page.getByText('$240')).toBeVisible()

  const button = page.getByRole('button', { name: 'Reservar y pagar con tarjeta guardada' })
  await expect(button).toBeEnabled()
  await button.click() // un solo clic
  await expect(page.getByRole('status')).toHaveText('¡Reserva confirmada!')

  const mine = await (await request.get(`${API}/api/reservations/mine`, { headers: auth(token) })).json()
  expect(mine).toHaveLength(1)
  expect(mine[0].totalPrice).toBe(240)
  expect(mine[0].payments?.length ?? 0).toBeGreaterThan(0)
})

test('con una tarjeta ya guardada se preselecciona y se reserva con un clic al recargar', async ({ page }) => {
  await useSession(page, token)
  await page.goto(`/book/${roomId}`)
  await expect(page.getByRole('radio')).toBeChecked()
  await goNextMonth(page)
  await day(page, nextMonthDate(15), 'disponible').click()
  await day(page, nextMonthDate(16), 'disponible').click()
  await page.getByRole('button', { name: 'Reservar y pagar con tarjeta guardada' }).click()
  await expect(page.getByRole('status')).toHaveText('¡Reserva confirmada!')
})
