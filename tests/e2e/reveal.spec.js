import { test, expect } from '@playwright/test';

test('revealing the solution plays an animation and restores the board', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();

  await page.getByRole('button', { name: 'Voir la solution' }).click();
  await expect(page.getByText('Solution en cours…')).toBeVisible();
  await expect(page.getByText('Solution en cours…')).toBeHidden({ timeout: 20_000 });

  // The reveal must not have changed the player's move count.
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
});
