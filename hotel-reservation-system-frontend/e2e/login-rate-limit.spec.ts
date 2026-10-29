import { test, expect } from '@playwright/test'
import { loginViaUi, uid } from './helpers'

/*
 * LIMITACION: el backend limita los fallos de login por IP (30 en 15 min, ventana por inactividad, segun
 * request.getRemoteAddr()). Esta spec consume 5 fallos de ese contador en cada corrida (el 6.o intento es
 * 429 y no cuenta), asi que NO es repetible indefinidamente sin reiniciar el backend: unas 5-6 corridas por
 * ventana. Usa el mismo origen que el resto de specs. El username es unico por ejecucion, por lo que los
 * contadores por usuario no contaminan a las demas specs. Ver e2e/README.md.
 */
test('el 6.º intento fallido seguido da 429 con mensaje en español', async ({ page }) => {
  const username = uid('rl')
  await page.goto('/login')
  for (let i = 1; i <= 5; i++) {
    const response = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'))
    await loginViaUi(page, username, 'clave-incorrecta-1')
    const res = await response
    expect(res.status(), `intento ${i}`).toBe(401)
    await expect(page.getByRole('alert')).toContainText(/Credenciales inv/)
  }
  const sixth = page.waitForResponse((r) => r.url().endsWith('/api/auth/login'))
  await loginViaUi(page, username, 'clave-incorrecta-1')
  const res = await sixth
  expect(res.status()).toBe(429)
  await expect(page.getByRole('alert')).toContainText('Demasiados intentos')
  await expect(page.getByRole('alert')).toContainText('Inténtalo de nuevo')
})
