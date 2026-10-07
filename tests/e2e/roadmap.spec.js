import { test, expect } from './three-fixture.js';

test('the roadmap loads and the first challenge opens in 3D', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Rush Hour' })).toBeVisible();
  await page.getByText('Premier virage').click();
  await expect(page.locator('#scene')).toBeVisible();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
});

test('exactly one challenge is unlocked at the start', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.stop.unlocked')).toHaveCount(1);
  await expect(page.locator('.stop.locked').first()).toBeVisible();
});
