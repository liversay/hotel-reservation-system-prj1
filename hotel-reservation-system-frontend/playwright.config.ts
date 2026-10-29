import { defineConfig, devices } from '@playwright/test'

// Los servidores (backend :3000 y frontend :5173) ya estan corriendo: no se arrancan desde aqui.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  retries: 0,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
