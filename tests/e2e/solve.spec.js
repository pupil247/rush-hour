import { test, expect } from './three-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../challenges.json', import.meta.url)), 'utf8'),
);

// Browse to a car with the arrows and select it with Space (the two-mode keyboard model).
async function selectVehicle(page, order, target) {
  const selected = await page.evaluate(() => window.__rushHour.selection());
  if (selected.selectedId) await page.keyboard.press(' '); // deselect before browsing
  for (let i = 0; i <= order.length; i += 1) {
    const current = await page.evaluate(() => window.__rushHour.selection());
    if (current.highlightedId === target) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press(' ');
}

test('solving the first challenge wins and records progress', async ({ page }) => {
  await page.goto('/?test=1');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  const challenge = catalog.challenges[0];
  const order = challenge.vehicles.map((v) => v.id);

  for (const mv of challenge.solution) {
    await selectVehicle(page, order, mv.vehicleId);
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
