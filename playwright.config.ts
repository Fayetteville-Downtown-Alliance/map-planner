import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8788', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone-chromium', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' } },
    { name: 'phone-webkit', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' } },
  ],
  webServer: { command: 'npm run preview:sandbox', url: 'http://127.0.0.1:8788/api/health', reuseExistingServer: false, timeout: 30_000,
    env: { MAP_PLANNER_DB: `.data/browser-${process.pid}.sqlite` } },
})
