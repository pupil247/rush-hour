import { test, expect } from '@playwright/test';

test('the HUD shows the move counter, the timer, and the level', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await expect(page.getByText(/Temps : \d/)).toBeVisible();
  await expect(page.getByText('Niveau : Débutant')).toBeVisible();
});

test('reset returns the board and counter to the start', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Premier virage').click();
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
});
