import { test, expect } from './three-fixture.js';
import { openFirstLevel } from './helpers.js';

test('the HUD shows the move counter, the timer, and the level', async ({ page }) => {
  await openFirstLevel(page);
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await expect(page.getByText(/Temps : \d/)).toBeVisible();
  await expect(page.getByText('Niveau : Débutant')).toBeVisible();
});

test('reset returns the board and counter to the start', async ({ page }) => {
  await openFirstLevel(page);
  const reset = page.getByRole('button', { name: 'Recommencer' });
  await expect(reset).toBeEnabled(); // controls unlock once the 3D layer is ready
  await reset.click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
});
