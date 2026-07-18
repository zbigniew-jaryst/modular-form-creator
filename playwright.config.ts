import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'
const reuseExistingServer = process.env.E2E_REUSE_SERVER === '1'

/**
 * Real-backend E2E against Vite.
 * Start backend+mongo first: `docker compose up -d backend mongo`
 * Keep Compose frontend stopped so port 5173 stays free for Playwright's webServer.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
})
