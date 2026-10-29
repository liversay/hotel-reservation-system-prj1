import { test, expect, type Page } from '@playwright/test'
import { adminToken, createHotel, createRoom, cleanupHotel, cleanupUsers, registerUser, uid, useSession } from './helpers'

test.use({ viewport: { width: 390, height: 844 } })

async function expectNoOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(clientWidth).toBe(390)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

for (const path of ['/', '/products', '/login']) {
  test(`sin desborde horizontal en ${path} a 390px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByText('Cargando')).toHaveCount(0)
    await expectNoOverflow(page)
  })
}

test.describe('rutas con datos o sesión', () => {
  const suffix = uid('m')
  let admin: string
  let hotelId: number
  let roomId: number
  let customer: string

  test.beforeAll(async ({ request }) => {
    admin = await adminToken(request)
    hotelId = await createHotel(request, admin, `Hotel ${suffix}`)
    roomId = await createRoom(request, admin, hotelId, `M-${suffix}`)
    customer = (await registerUser(request, `mob${suffix}`)).token
  })

  test.afterAll(async ({ request }) => {
    await cleanupHotel(request, admin, hotelId)
    await cleanupUsers(request, admin, `mob${suffix}`)
  })

  test('sin desborde en /my-reservations (con sesión)', async ({ page }) => {
    await useSession(page, customer)
    await page.goto('/my-reservations')
    await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible()
    await expect(page.getByText('Aún no tienes reservas.')).toBeVisible()
    await expectNoOverflow(page)
  })

  test('sin desborde en /rooms/:id', async ({ page }) => {
    await page.goto(`/rooms/${roomId}`)
    await expect(page.getByRole('heading', { name: 'Suite E2E' })).toBeVisible()
    await expectNoOverflow(page)
  })

  test('sin desborde en /admin (con admin)', async ({ page }) => {
    await useSession(page, admin)
    await page.goto('/admin')
    await expect(page.getByText('Hotel Admin')).toBeAttached()
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expectNoOverflow(page)
  })
})

test('el menú hamburguesa abre y cierra', async ({ page }) => {
  await page.goto('/')
  const menu = page.getByRole('navigation', { name: 'Menú móvil' })
  await expect(menu).toHaveCount(0)
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Rooms' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Registrarse' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar menú' }).click()
  await expect(menu).toHaveCount(0)

  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await menu.getByRole('link', { name: 'Rooms' }).click()
  await expect(page).toHaveURL(/\/products$/)
  await expect(page.getByRole('navigation', { name: 'Menú móvil' })).toHaveCount(0)
})
