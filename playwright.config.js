import { defineConfig } from '@playwright/test';

// Dev-only test config. The game itself has no build step; Playwright starts a plain static server.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8080',
    headless: true,
  },
  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://127.0.0.1:8080/index.html',
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
