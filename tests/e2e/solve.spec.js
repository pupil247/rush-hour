import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../challenges.json', import.meta.url)), 'utf8'),
);

// Drive the UI with the baked optimal solution, one cell per key press (each press is a move).
test('solving the first challenge wins and records progress', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();

  const challenge = catalog.challenges[0];
  const order = challenge.vehicles.map((v) => v.id);
  let selected = null;

  for (const mv of challenge.solution) {
    const target = order.indexOf(mv.vehicleId);
    const current = selected == null ? -1 : order.indexOf(selected);
    let presses = (target - current + order.length) % order.length;
    if (presses === 0) presses = order.length;
    for (let i = 0; i < presses; i += 1) await page.keyboard.press('Tab');
    selected = mv.vehicleId;

    const vehicle = challenge.vehicles.find((v) => v.id === mv.vehicleId);
    const key =
      vehicle.orientation === 'H'
        ? mv.delta > 0
          ? 'ArrowRight'
          : 'ArrowLeft'
        : mv.delta > 0
          ? 'ArrowDown'
          : 'ArrowUp';
    for (let i = 0; i < Math.abs(mv.delta); i += 1) await page.keyboard.press(key);
  }

  await expect(page.getByText('Bravo !')).toBeVisible();
  await page.locator('#dialogs').getByRole('button', { name: 'Retour à la route' }).click();
  await expect(page.locator('.stop.solved')).toHaveCount(1);
});
