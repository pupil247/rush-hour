import { test, expect } from './three-fixture.js';
import { openFirstLevel } from './helpers.js';

test('sound can be muted and unmuted', async ({ page }) => {
  await openFirstLevel(page);
  await page.getByRole('button', { name: 'Couper le son' }).click();
  await expect(page.getByRole('button', { name: 'Activer le son' })).toBeVisible();
  await page.getByRole('button', { name: 'Activer le son' }).click();
  await expect(page.getByRole('button', { name: 'Couper le son' })).toBeVisible();
});
