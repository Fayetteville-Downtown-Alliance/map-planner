import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/worker', outputDir: './worker-test-results', reporter: [['list'], ['html', { outputFolder: 'worker-playwright-report', open: 'never' }]], workers: 1, retries: 0,
  use: { baseURL: process.env.MAP_PLANNER_PREVIEW_URL ?? 'https://127.0.0.1:8790', trace: process.env.MAP_PLANNER_PREVIEW_URL ? 'off' : 'retain-on-failure', ignoreHTTPSErrors: !process.env.MAP_PLANNER_PREVIEW_URL },
  projects: [{ name: 'worker-chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'worker-webkit-phone', use: { ...devices['iPhone 13'], reducedMotion: 'reduce' } }],
  webServer: process.env.MAP_PLANNER_PREVIEW_URL ? undefined : { command: 'npm run preview:worker', url: 'https://127.0.0.1:8790/api/health', ignoreHTTPSErrors: true, reuseExistingServer: false, timeout: 30000 },
})
