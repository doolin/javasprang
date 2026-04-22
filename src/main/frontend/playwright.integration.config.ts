import { defineConfig, devices } from '@playwright/test';

// Integration config: hits the real Spring Boot backend (no mocks).
// Used by docker/e2e/compose.yaml.

export default defineConfig({
  testDir: './tests/integration',
  timeout: 30_000,
  reporter: [
    ['html', { outputFolder: 'coverage/playwright/html-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8081',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14 Pro'] }
    }
  ]
});
