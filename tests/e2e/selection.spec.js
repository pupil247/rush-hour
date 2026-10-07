import { test, expect } from './three-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../challenges.json', import.meta.url)), 'utf8'),
);

test('clicking a car selects it without error; empty click clears', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?test=1');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  const ids = await page.evaluate(() => window.__rushHour.vehicleIds());
  const target = ids[0];
  const point = await page.evaluate((id) => window.__rushHour.vehicleScreenPoint(id), target);
  await page.mouse.click(point.x, point.y);

  const selection = await page.evaluate(() => window.__rushHour.selection());
  expect(selection.selectedId).toBe(target);
  expect(errors).toEqual([]);

  await page.mouse.click(4, 4); // empty corner of the viewport
  const cleared = await page.evaluate(() => window.__rushHour.selection());
  expect(cleared.selectedId).toBeNull();
  expect(cleared.highlightedId).toBeNull();
});

test('dragging a car moves it and increments the counter', async ({ page }) => {
  await page.goto('/?test=1');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  const firstMove = catalog.challenges[0].solution[0];
  const vehicle = catalog.challenges[0].vehicles.find((v) => v.id === firstMove.vehicleId);
  const point = await page.evaluate((id) => window.__rushHour.vehicleScreenPoint(id), firstMove.vehicleId);

  // Drag in the direction of the first optimal move (screen: right for H, down for V).
  const sign = firstMove.delta > 0 ? 1 : -1;
  const dx = vehicle.orientation === 'H' ? 140 * sign : 0;
  const dy = vehicle.orientation === 'V' ? 140 * sign : 0;

  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByText(/Déplacements : [1-9]/)).toBeVisible();
});
