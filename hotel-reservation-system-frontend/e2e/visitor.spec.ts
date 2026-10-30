import { test, expect } from '@playwright/test'
import { adminToken, cleanupHotel, cleanupUsers, createHotel, createRoom, loginViaUi, TOKEN_KEY, uid } from './helpers'

const suffix = uid('v')
const hotelName = `Hotel ${suffix}`
const roomNumber = `V-${suffix}`
const username = `vis${suffix}`
let hotelId: number
let roomId: number
let admin: string

test.beforeAll(async ({ request }) => {
  admin = await adminToken(request)
  hotelId = await createHotel(request, admin, hotelName)
  roomId = await createRoom(request, admin, hotelId, roomNumber, 'Junior E2E', 77)
})

test.afterAll(async ({ request }) => {
  await cleanupUsers(request, admin, username)
  await cleanupHotel(request, admin, hotelId)
})

test('home muestra hoteles reales del backend', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nuestros hoteles' })).toBeVisible()
  await expect(page.getByRole('link', { name: hotelName })).toBeVisible()
  await expect(page.getByRole('link', { name: 'MN Hotel Centro' })).toBeVisible()
  await expect(page.getByText('The Ritz-Carlton')).toHaveCount(0)
})

test('/products filtra por texto y el detalle /rooms/:id muestra datos reales', async ({ page }) => {
  await page.goto('/products')
  await expect(page.getByText(`Hab. ${roomNumber}`)).toBeVisible()
  await expect(page.getByText('Hab. 101')).toBeVisible()

  await page.getByLabel('Buscar').fill(roomNumber)
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByText(`Hab. ${roomNumber}`)).toBeVisible()
  await expect(page.getByText('Hab. 101')).toHaveCount(0)

  await page.getByLabel('Buscar').fill(`zzz-no-existe-${suffix}`)
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await expect(page.getByText('No hay habitaciones que coincidan con la búsqueda.')).toBeVisible()

  await page.getByRole('button', { name: 'Limpiar' }).click()
  await page.getByLabel('Buscar').fill(roomNumber)
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  await page.getByRole('link', { name: 'Ver disponibilidad' }).click()
  await expect(page).toHaveURL(new RegExp(`/rooms/${roomId}$`))
  await expect(page.getByRole('heading', { name: 'Junior E2E' })).toBeVisible()
  await expect(page.getByText('$77 / noche')).toBeVisible()
  await expect(page.getByText(hotelName)).toBeVisible()
  await page.getByRole('link', { name: 'Reservar' }).click()
  await expect(page).toHaveURL(new RegExp(`/book/${roomId}$`))
})

test('registro, logout y login de un usuario nuevo desde la UI', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Registrarse' }).first().click()
  await expect(page).toHaveURL(/\/register$/)

  await page.getByLabel('Usuario').fill(username)
  await page.getByLabel('Email').fill(`${username}@e2e.test`)
  await page.getByLabel('Contraseña').fill('e2e-pass-123')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mis reservas' })).toBeVisible()

  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), TOKEN_KEY)).toBeNull()

  await page.getByRole('link', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await loginViaUi(page, username, 'e2e-pass-123')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
})

test('registro rechaza contraseña corta con mensaje en español', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Usuario').fill(`${username}x`)
  await page.getByLabel('Email').fill(`${username}x@e2e.test`)
  await page.getByLabel('Contraseña').fill('corta')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByRole('alert')).toContainText('al menos 8 caracteres')
})

test('enlaces de navbar y footer no son enlaces muertos', async ({ page }) => {
  await page.goto('/')
  const footerLinks = page.getByRole('contentinfo').getByRole('link')
  expect(await footerLinks.count()).toBeGreaterThan(0)
  const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  expect(hrefs.length).toBeGreaterThan(5)
  for (const h of await footerLinks.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) expect(hrefs).toContain(h)
  for (const h of hrefs) {
    expect(h, 'href').toBeTruthy()
    expect(h).not.toMatch(/^#|#$/)
  }

  // Cada href interno resuelve a una ruta real de la app (no cae en el 404).
  const internal = [...new Set(hrefs.filter((h): h is string => !!h && h.startsWith('/')))]
  expect(internal.length).toBeGreaterThan(3)
  for (const h of internal) {
    await page.goto(h)
    await expect(page.getByRole('heading', { name: 'Página no encontrada' }), h).toHaveCount(0)
    await expect(page.locator('main, form, header').first(), h).toBeVisible()
  }
  await page.goto('/')

  const nav = page.getByRole('navigation', { name: 'Global' })
  await nav.getByRole('link', { name: 'Habitaciones' }).click()
  await expect(page).toHaveURL(/\/products$/)
  await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Nosotros' }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.getByRole('navigation', { name: 'Global' }).getByRole('link', { name: 'Inicio' }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/')
  await page.getByRole('link', { name: 'Registrarse' }).first().click()
  await expect(page).toHaveURL(/\/register$/)
})

test('/about está en español, sin Lorem ni "Copyright © 2024" ni imágenes externas', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'Sistema de reservas de hotel' })).toBeVisible()
  const text = (await page.locator('body').textContent()) ?? ''
  expect(text).not.toMatch(/Lorem/i)
  expect(text).not.toContain('Copyright © 2024')
  expect(text).not.toMatch(/Jane Doe|John Smith|Sarah Lee/)
  const srcs = await page.locator('img').evaluateAll((els) => els.map((e) => e.getAttribute('src') ?? ''))
  expect(srcs.filter((s) => /^https?:/.test(s))).toEqual([])
})
