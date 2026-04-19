import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  reporter: [
    ['html', { outputFolder: 'coverage/playwright/html-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://127.0.0.1:4201',
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
