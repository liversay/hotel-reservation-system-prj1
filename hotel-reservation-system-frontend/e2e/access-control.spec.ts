import { test, expect } from '@playwright/test'
import {
  adminToken, API, auth, cleanupHotel, cleanupUsers, createHotel, createRoom, day, demoToken, goNextMonth,
  loginViaUi, nextMonthDate, registerUser, uid, useSession,
} from './helpers'

const suffix = uid('z')
const username = `acc${suffix}`
let hotelId: number
let roomId: number
let admin: string
let password: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
  hotelId = await createHotel(request, admin, `Hotel ${suffix}`)
  roomId = await createRoom(request, admin, hotelId, `Z-${suffix}`)
  password = (await registerUser(request, username)).password
})

test.afterAll(async ({ request }) => {
  await cleanupUsers(request, admin, username)
  await cleanupHotel(request, admin, hotelId)
})

test('visitante a /my-reservations va a /login con next y vuelve tras iniciar sesión', async ({ page }) => {
  await page.goto('/my-reservations')
  await expect(page).toHaveURL(/\/login\?next=%2Fmy-reservations$/)
  await loginViaUi(page, username, password)
  await expect(page).toHaveURL(/\/my-reservations$/)
  await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
})

test('visitante en /book/:id al reservar va a /login?next=/book/:id y vuelve tras iniciar sesión', async ({ page }) => {
  await page.goto(`/book/${roomId}`)
  await goNextMonth(page)
  await day(page, nextMonthDate(3), 'disponible').click()
  await day(page, nextMonthDate(5), 'disponible').click()
  await page.getByRole('button', { name: 'Inicia sesión para reservar' }).click()
  await expect(page).toHaveURL(new RegExp(`/login\\?next=(/|%2F)book(/|%2F)${roomId}$`))
  await loginViaUi(page, username, password)
  await expect(page).toHaveURL(new RegExp(`/book/${roomId}$`))
  await expect(page.getByRole('heading', { name: /Reservar habitación/ })).toBeVisible()
})

test('cliente (demo) en /admin es redirigido a /', async ({ page, request }) => {
  await useSession(page, await demoToken(request))
  await page.goto('/admin')
  await expect(page).toHaveURL('/')
  await expect(page.getByText('Hotel Admin')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Administración' })).toHaveCount(0)
})

test('visitante en /admin va a login', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/)
})

test('endpoints de admin con token de cliente dan 403 y sin token 401', async ({ request }) => {
  const demo = await demoToken(request)
  const h = { headers: auth(demo) }
  const hotel = { name: 'No', location: 'x', description: 'x', rating: 3 }
  const room = { hotelId, roomNumber: 'NO', type: 'x', pricePerNight: 10 }
  const calls = [
    request.post(`${API}/api/hotel/registration-hotel`, { ...h, data: hotel }),
    request.put(`${API}/api/hotel/update-hotel/${hotelId}`, { ...h, data: hotel }),
    request.delete(`${API}/api/hotel/delete-hotel/${hotelId}`, h),
    request.post(`${API}/api/rooms`, { ...h, data: room }),
    request.put(`${API}/api/rooms/${roomId}`, { ...h, data: room }),
    request.delete(`${API}/api/rooms/${roomId}`, h),
    request.get(`${API}/api/admin/users`, h),
    request.post(`${API}/api/admin/users`, { ...h, data: { username: 'nope1234', email: 'n@x.com', password: 'pass12345', role: 'ADMIN' } }),
    request.get(`${API}/api/admin/forecast`, h),
  ]
  for (const res of await Promise.all(calls)) expect(res.status()).toBe(403)

  const anon = await request.get(`${API}/api/admin/users`)
  expect(anon.status()).toBe(401)
})

test('/nope muestra la página 404', async ({ page }) => {
  await page.goto('/nope')
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Volver al inicio' }).click()
  await expect(page).toHaveURL('/')
})

for (const path of ['/rooms/..%2Fadmin%2Fusers', '/rooms/abc']) {
  test(`${path} muestra "no encontrada" sin llamar al API`, async ({ page }) => {
    const apiCalls: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/rooms/') || r.url().includes('/api/admin')) apiCalls.push(r.url())
    })
    await page.goto(path)
    await expect(page.getByText('Habitación no encontrada')).toBeVisible()
    expect(apiCalls).toEqual([])
  })
}

test('errores 400 del API no filtran trace', async ({ request }) => {
  const bad = await request.get(`${API}/api/rooms/${roomId}/availability?month=bad`)
  expect(bad.status()).toBe(400)
  const malformed = await request.post(`${API}/api/auth/login`, {
    headers: { 'Content-Type': 'application/json' }, data: '{"username": ',
  })
  expect(malformed.status()).toBe(400)
  for (const res of [bad, malformed]) {
    const text = await res.text()
    expect(text).not.toMatch(/trace|Exception|at app\.|at org\.|\.java/i)
    const body = JSON.parse(text)
    expect(typeof body.message).toBe('string')
    expect(Object.keys(body)).not.toContain('trace')
  }
})
