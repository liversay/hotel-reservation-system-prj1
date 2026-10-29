import { test, expect } from '@playwright/test'
import {
  addCardViaApi, adminToken, API, auth, cleanupHotel, cleanupUsers, createHotel, createRoom, day, goNextMonth,
  nextMonthDate, registerUser, reserveViaApi, uid, useSession,
} from './helpers'

const suffix = uid('x')
const username = `can${suffix}`
let hotelId: number
let roomId: number
let admin: string
let token: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
  hotelId = await createHotel(request, admin, `Hotel ${suffix}`)
  roomId = await createRoom(request, admin, hotelId, `X-${suffix}`, 'Doble E2E', 100)
  token = (await registerUser(request, username)).token
  const cardId = await addCardViaApi(request, token)
  await reserveViaApi(request, token, roomId, nextMonthDate(10), nextMonthDate(12), cardId) // $200 pagados con tarjeta
})

test.afterAll(async ({ request }) => {
  await cleanupHotel(request, admin, hotelId)
  await cleanupUsers(request, admin, username)
})

test('cancelar con confirmación, estado Cancelada, reembolso y disponibilidad restaurada', async ({ page, request }) => {
  await useSession(page, token)

  // Antes: los dias estan ocupados.
  await page.goto(`/book/${roomId}`)
  await goNextMonth(page)
  await expect(day(page, nextMonthDate(10), 'ocupado')).toBeDisabled()

  await page.goto('/my-reservations')
  const row = page.getByRole('listitem').filter({ hasText: `Hab. X-${suffix}` })
  await expect(row).toContainText('Confirmada')
  await expect(row).toContainText('$200')

  // Primer intento: se pide confirmacion y se puede abortar.
  await row.getByRole('button', { name: 'Cancelar reserva' }).click()
  await expect(row.getByText('¿Confirmar cancelación?')).toBeVisible()
  await row.getByRole('button', { name: 'No, mantener' }).click()
  await expect(row).toContainText('Confirmada')
  await expect(row.getByRole('button', { name: 'Cancelar reserva' })).toBeVisible()

  // Segundo intento: se confirma.
  await row.getByRole('button', { name: 'Cancelar reserva' }).click()
  await row.getByRole('button', { name: 'Sí, cancelar' }).click()
  await expect(row).toContainText('Cancelada')
  await expect(row).toContainText('Reembolsado $200')
  await expect(row.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0)

  // Persiste tras recargar.
  await page.reload()
  await expect(row).toContainText('Cancelada')
  await expect(row).toContainText('Reembolsado $200')

  // Disponibilidad restaurada en el API y en el calendario.
  const av = await (await request.get(`${API}/api/rooms/${roomId}/availability?month=${nextMonthDate(1).slice(0, 7)}`, { headers: auth(token) })).json()
  for (const d of [10, 11]) {
    expect(av.find((x: { date: string }) => x.date === nextMonthDate(d)).status).toBe('AVAILABLE')
  }
  await page.goto(`/book/${roomId}`)
  await goNextMonth(page)
  await expect(day(page, nextMonthDate(10), 'disponible')).toBeEnabled()
  await expect(day(page, nextMonthDate(11), 'disponible')).toBeEnabled()
})
