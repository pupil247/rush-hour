// Test fixture: serve the pinned Three.js CDN URL from a local copy so browser tests are fast and
// hermetic. Production still loads Three.js from the CDN via the import map (Principle III).
import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const threePath = fileURLToPath(new URL('../fixtures/three.module.js', import.meta.url));
const THREE_URL = 'https://unpkg.com/three@0.169.0/build/three.module.js';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(THREE_URL, (route) =>
      route.fulfill({ path: threePath, contentType: 'text/javascript' }),
    );
    await use(page);
  },
});

export { expect };
