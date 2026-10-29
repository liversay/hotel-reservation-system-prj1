import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const API = process.env.E2E_API_URL ?? 'http://localhost:3000'
export const TOKEN_KEY = 'hotel.token'

/** Sufijo unico por ejecucion (timestamp en base 36 + 2 caracteres aleatorios). */
export const uid = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`

export async function apiLogin(request: APIRequestContext, username: string, password: string): Promise<string> {
  const res = await request.post(`${API}/api/auth/login`, { data: { username, password } })
  expect(res.status(), `login ${username}`).toBe(200)
  return (await res.json()).token as string
}

export const adminToken = (request: APIRequestContext) => apiLogin(request, 'admin', 'admin12345')
export const demoToken = (request: APIRequestContext) => apiLogin(request, 'demo', 'demo12345')

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

export async function registerUser(request: APIRequestContext, username: string, password = 'e2e-pass-123') {
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, email: `${username}@e2e.test`, password },
  })
  expect(res.status(), `register ${username}`).toBe(201)
  return { username, password, token: (await res.json()).token as string }
}

export async function createHotel(request: APIRequestContext, token: string, name: string): Promise<number> {
  const res = await request.post(`${API}/api/hotel/registration-hotel`, {
    headers: auth(token),
    data: { name, location: 'Ubicacion E2E', description: 'Hotel creado por la suite E2E', rating: 4 },
  })
  expect(res.status()).toBe(200)
  const all = await (await request.get(`${API}/api/hotel/get-all`)).json()
  return all.find((h: { name: string; id: number }) => h.name === name).id
}

export async function createRoom(
  request: APIRequestContext, token: string, hotelId: number, roomNumber: string, type = 'Suite E2E', price = 100,
): Promise<number> {
  const res = await request.post(`${API}/api/rooms`, {
    headers: auth(token),
    data: { hotelId, roomNumber, type, pricePerNight: price },
  })
  expect(res.status()).toBe(201)
  return (await res.json()).id
}

/** Borra (mejor esfuerzo) sus habitaciones y luego el hotel. */
export async function cleanupHotel(request: APIRequestContext, token: string, hotelId: number) {
  const rooms = await (await request.get(`${API}/api/rooms`)).json()
  for (const r of rooms.filter((x: { hotelId: number }) => x.hotelId === hotelId)) {
    await request.delete(`${API}/api/rooms/${r.id}`, { headers: auth(token) })
  }
  await request.delete(`${API}/api/hotel/delete-hotel/${hotelId}`, { headers: auth(token) })
}

export async function cleanupUsers(request: APIRequestContext, token: string, prefix: string) {
  const users = await (await request.get(`${API}/api/admin/users`, { headers: auth(token) })).json()
  for (const u of users.filter((x: { username: string }) => x.username.startsWith(prefix))) {
    await request.delete(`${API}/api/admin/users/${u.id}`, { headers: auth(token) })
  }
}

/** Inicia sesion con el token ya emitido por el API (para no repetir el formulario en cada spec). */
export async function useSession(page: Page, token: string) {
  await page.addInitScript(([k, t]) => localStorage.setItem(k, t), [TOKEN_KEY, token])
}

export async function loginViaUi(page: Page, username: string, password: string) {
  await page.getByLabel('Usuario').fill(username)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Fecha YYYY-MM-DD en el mes siguiente al actual (hora local, igual que el calendario). */
export function nextMonthDate(day: number): string {
  const d = new Date()
  const m = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(day)}`
}

export async function reserveViaApi(
  request: APIRequestContext, token: string, roomId: number, checkIn: string, checkOut: string, savedPaymentMethodId?: number,
) {
  const res = await request.post(`${API}/api/reservations`, {
    headers: auth(token),
    data: { roomId, checkIn, checkOut, savedPaymentMethodId },
  })
  expect(res.status()).toBe(201)
  return res.json()
}

export async function addCardViaApi(request: APIRequestContext, token: string): Promise<number> {
  const res = await request.post(`${API}/api/payment-methods`, {
    headers: auth(token),
    data: { cardNumber: '4111111111111111', holderName: 'E2E Tester', expMonth: 12, expYear: 2030 },
  })
  expect(res.status()).toBe(201)
  return (await res.json()).id
}

/** Avanza el calendario un mes con un clic real y espera a que cargue el mes nuevo. */
export async function goNextMonth(page: Page) {
  const title = page.getByRole('heading', { level: 3 })
  const before = await title.textContent()
  await page.getByRole('button', { name: 'Mes siguiente' }).click()
  await expect(title).not.toHaveText(before!)
}

export const day = (page: Page, date: string, state: 'disponible' | 'ocupado' | 'pasado') =>
  page.getByRole('button', { name: `${date} ${state}` })
