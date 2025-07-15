import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        ...devices['Desktop Chrome'],
        // API testing doesn't need viewport
        viewport: null,
      },
    },
    {
      name: 'websocket',
      testDir: './tests/websocket',
      use: {
        ...devices['Desktop Chrome'],
        viewport: null,
      },
    },
  ],
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: './tests',
  use: {
    baseURL: process.env.API_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },

  webServer: [
    {
      command: 'pnpm dev:api',
      env: {
        NODE_ENV: 'test',
      },
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev:websocket',
      env: {
        NODE_ENV: 'test',
      },
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
  ],
  workers: process.env.CI ? 1 : undefined,
})
