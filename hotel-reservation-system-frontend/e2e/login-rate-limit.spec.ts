import { test, expect } from '@playwright/test'
import { loginViaUi, uid } from './helpers'

// Username unico por ejecucion: el limite es por usuario+IP y no contamina a las demas specs
// (solo cuentan intentos fallidos; los logins correctos de otras specs no se ven afectados).
test('el 6.º intento fallido seguido da 429 con mensaje en español', async ({ page }) => {
  const username = uid('rl')
  await page.goto('/login')
  for (let i = 1; i <= 5; i++) {
    await loginViaUi(page, username, 'clave-incorrecta-1')
    await expect(page.getByRole('alert')).toContainText(/Credenciales inv/)
    await expect(page.getByRole('alert')).not.toContainText('Demasiados')
    await expect(page).toHaveURL(/\/login$/)
  }
  const responsePromise = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'))
  await loginViaUi(page, username, 'clave-incorrecta-1')
  const res = await responsePromise
  expect(res.status()).toBe(429)
  await expect(page.getByRole('alert')).toContainText('Demasiados intentos')
  await expect(page.getByRole('alert')).toContainText('Inténtalo de nuevo')
})
