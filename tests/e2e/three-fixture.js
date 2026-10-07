// Test fixture: serve the pinned Three.js and addon CDN URLs from local copies so browser tests are
// fast and hermetic. Production still loads everything from the CDN via the import map (Principle III).
import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const THREE_URL = 'https://unpkg.com/three@0.169.0/build/three.module.js';
const GLTF_URL = 'https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';
const BGU_URL = 'https://unpkg.com/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js';

const local = (name) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(THREE_URL, (route) =>
      route.fulfill({ path: local('three.module.js'), contentType: 'text/javascript' }),
    );
    await page.route(GLTF_URL, (route) =>
      route.fulfill({ path: local('GLTFLoader.js'), contentType: 'text/javascript' }),
    );
    await page.route(BGU_URL, (route) =>
      route.fulfill({ path: local('BufferGeometryUtils.js'), contentType: 'text/javascript' }),
    );
    await use(page);
  },
});

export { expect };
