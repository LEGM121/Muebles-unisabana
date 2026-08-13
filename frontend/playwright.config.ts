import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    baseURL: 'http://localhost:5173',
    headless: false,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000
  }
});