import { test, expect, type Page } from '@playwright/test'
import { adminToken, API, auth, cleanupHotel, cleanupUsers, createHotel, createRoom, loginViaUi, uid } from './helpers'

const suffix = uid('a')
const hotelName = `Hotel ${suffix}`
const hotelRenamed = `Hotel ${suffix} editado`
const roomNumber = `A-${suffix}`
const userName = `adm${suffix}`
let admin: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
})

test.afterAll(async ({ request }) => {
  const hotels = await (await request.get(`${API}/api/hotel/get-all`)).json()
  for (const h of hotels.filter((x: { name: string }) => x.name.includes(suffix))) await cleanupHotel(request, admin, h.id)
  await cleanupUsers(request, admin, userName)
})

const TAB_LABEL = { hotel: 'Hoteles', rooms: 'Habitaciones', users: 'Usuarios' } as const

async function openAdmin(page: Page, tab: keyof typeof TAB_LABEL) {
  await page.goto('/login')
  await loginViaUi(page, 'admin', 'admin12345')
  await expect(page).toHaveURL(/\/admin$/)
  await page.locator('aside').getByRole('button', { name: TAB_LABEL[tab], exact: true }).click()
}

const rowOf = (page: Page, text: string) => page.getByRole('row').filter({ hasText: text })

test('admin crea, edita y borra un hotel; rating fuera de 1..5 se rechaza', async ({ page }) => {
  await openAdmin(page, 'hotel')
  await page.getByRole('button', { name: '+ Nuevo' }).click()
  const form = page.getByRole('form', { name: 'Crear Hoteles' })
  await form.getByLabel('Nombre').fill(hotelName)
  await form.getByLabel('Ubicación').fill('Ciudad E2E')
  await form.getByLabel('Descripción').fill('Creado por E2E')
  await form.getByLabel('Rating').fill('99')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText(/rating|Calificación/i)
  await expect(rowOf(page, hotelName)).toHaveCount(0)

  await form.getByLabel('Rating').fill('4')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, hotelName)).toBeVisible()
  await expect(rowOf(page, hotelName)).toContainText('Ciudad E2E')

  await rowOf(page, hotelName).getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('form', { name: 'Editar Hoteles' })
  await edit.getByLabel('Nombre').fill(hotelRenamed)
  await edit.getByLabel('Rating').fill('0')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText(/rating|Calificación/i) // 0 tampoco es valido
  await edit.getByLabel('Rating').fill('5')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, hotelRenamed)).toBeVisible()
  // Columnas: ID, Nombre, Ubicación, Descripción, Rating -> la celda 5 (índice 4) es el rating.
  await expect(rowOf(page, hotelRenamed).getByRole('cell').nth(4)).toHaveText(/^5(\.0)?$/)

  await rowOf(page, hotelRenamed).getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByText('¿Eliminar?')).toBeVisible()
  await rowOf(page, hotelRenamed).getByRole('button', { name: 'Sí' }).click()
  await expect(rowOf(page, hotelRenamed)).toHaveCount(0)
})

test('admin crea, edita y borra una habitación; precio inválido se rechaza', async ({ page, request }) => {
  const hotel = `Hotel ${suffix} hab`
  const res = await request.post(`${API}/api/hotel/registration-hotel`, {
    headers: auth(admin), data: { name: hotel, location: 'L', description: 'd', rating: 3 },
  })
  expect(res.status()).toBe(200)

  await openAdmin(page, 'rooms')
  await page.getByRole('button', { name: '+ Nuevo' }).click()
  const form = page.getByRole('form', { name: 'Crear Habitaciones' })
  await form.getByLabel('Hotel').selectOption({ label: hotel })
  await form.getByLabel('Número').fill(roomNumber)
  await form.getByLabel('Tipo').fill('Suite E2E')
  await form.getByLabel('Precio por noche').fill('-5')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(rowOf(page, roomNumber)).toHaveCount(0)

  await form.getByLabel('Precio por noche').fill('90')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, roomNumber)).toContainText('$90')
  await expect(rowOf(page, roomNumber)).toContainText(hotel)

  await rowOf(page, roomNumber).getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('form', { name: 'Editar Habitaciones' })
  await edit.getByLabel('Precio por noche').fill('120')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, roomNumber)).toContainText('$120')

  await rowOf(page, roomNumber).getByRole('button', { name: 'Eliminar' }).click()
  await rowOf(page, roomNumber).getByRole('button', { name: 'Sí' }).click()
  await expect(rowOf(page, roomNumber)).toHaveCount(0)
})

// Requiere el backend con la Tarea 8a (409 "Ya existe una habitación con ese número en este hotel").
test('admin: habitación con número duplicado en el mismo hotel muestra el error en español', async ({ page, request }) => {
  const hotel = `Hotel ${suffix} dup`
  const dupNumber = `D-${suffix}`
  const hotelId = await createHotel(request, admin, hotel)
  await createRoom(request, admin, hotelId, dupNumber)

  await openAdmin(page, 'rooms')
  await page.getByRole('button', { name: '+ Nuevo' }).click()
  const form = page.getByRole('form', { name: 'Crear Habitaciones' })
  await form.getByLabel('Hotel').selectOption({ label: hotel })
  await form.getByLabel('Número').fill(dupNumber)
  await form.getByLabel('Tipo').fill('Suite E2E')
  await form.getByLabel('Precio por noche').fill('90')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText('Ya existe una habitación con ese número en este hotel')
})

test('admin crea, edita y borra un usuario; valida contraseña corta y duplicado', async ({ page }) => {
  await openAdmin(page, 'users')
  await page.getByRole('button', { name: '+ Nuevo' }).click()
  const form = page.getByRole('form', { name: 'Crear Usuarios' })
  await form.getByLabel('Usuario').fill(userName)
  await form.getByLabel('Email').fill(`${userName}@e2e.test`)
  await form.getByLabel('Contraseña').fill('corta')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText('8 caracteres')
  await expect(rowOf(page, userName)).toHaveCount(0)

  await form.getByLabel('Contraseña').fill('e2e-pass-123')
  await form.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, userName)).toContainText('USER')

  // Duplicado -> 409 con mensaje.
  await page.getByRole('button', { name: '+ Nuevo' }).click()
  const again = page.getByRole('form', { name: 'Crear Usuarios' })
  await again.getByLabel('Usuario').fill(userName)
  await again.getByLabel('Email').fill(`${userName}@e2e.test`)
  await again.getByLabel('Contraseña').fill('e2e-pass-123')
  await again.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toContainText('ya existe')
  await again.getByRole('button', { name: 'Cancelar' }).click()

  await rowOf(page, userName).getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('form', { name: 'Editar Usuarios' })
  await edit.getByLabel('Rol').selectOption('ADMIN')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(rowOf(page, userName)).toContainText('ADMIN')

  await rowOf(page, userName).getByRole('button', { name: 'Eliminar' }).click()
  await rowOf(page, userName).getByRole('button', { name: 'Sí' }).click()
  await expect(rowOf(page, userName)).toHaveCount(0)
})
