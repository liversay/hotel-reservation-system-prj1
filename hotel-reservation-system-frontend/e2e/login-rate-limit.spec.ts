import { test, expect } from '@playwright/test'
import { loginViaUi, uid } from './helpers'

/*
 * El limitador del backend cuenta fallos por IP (30 en 15 min) usando request.getRemoteAddr().
 * El resto de la suite llega al backend desde ::1 (Node/Chromium resuelven "localhost" a ::1), asi que
 * esta spec envia sus intentos fallidos desde 127.0.0.1 (otra direccion remota => otro contador por IP)
 * reescribiendo el host del POST de login. Asi sus fallos no se acumulan en la IP que usan las demas
 * specs y la suite se puede repetir sin agotar el limite. El username es unico por ejecucion.
 */
test('el 6.º intento fallido seguido da 429 con mensaje en español', async ({ page }) => {
  await page.route('**/api/auth/login', (route) => {
    const url = new URL(route.request().url())
    url.hostname = '127.0.0.1'
    return route.continue({ url: url.toString() })
  })

  const username = uid('rl')
  await page.goto('/login')
  for (let i = 1; i <= 5; i++) {
    const response = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'))
    await loginViaUi(page, username, 'clave-incorrecta-1')
    const res = await response
    expect(res.status(), `intento ${i}`).toBe(401)
    expect(res.url()).toContain('127.0.0.1')
    await expect(page.getByRole('alert')).toContainText(/Credenciales inv/)
  }
  const sixth = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'))
  await loginViaUi(page, username, 'clave-incorrecta-1')
  const res = await sixth
  expect(res.status()).toBe(429)
  await expect(page.getByRole('alert')).toContainText('Demasiados intentos')
  await expect(page.getByRole('alert')).toContainText('Inténtalo de nuevo')
})
