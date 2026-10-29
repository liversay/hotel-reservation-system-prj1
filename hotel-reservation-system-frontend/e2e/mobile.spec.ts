import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

for (const path of ['/', '/products', '/login']) {
  test(`sin desborde horizontal en ${path} a 390px`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByText('Cargando')).toHaveCount(0)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    expect(clientWidth).toBe(390)
  })
}

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
