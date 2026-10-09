import { test, expect } from './three-fixture.js';
import { openFirstLevel } from './helpers.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const catalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../challenges.json', import.meta.url)), 'utf8'),
);

test('keyboard browses, selects, and deselects; arrows do not scroll the page', async ({ page }) => {
  await openFirstLevel(page);
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  const start = await page.evaluate(() => window.__rushHour.selection());
  expect(start.selectedId).toBeNull();
  expect(start.highlightedId).not.toBeNull();

  await page.keyboard.press('ArrowRight');
  const cycled = await page.evaluate(() => window.__rushHour.selection());
  expect(cycled.highlightedId).not.toBe(start.highlightedId);
  expect(cycled.selectedId).toBeNull();

  await page.keyboard.press(' ');
  const selected = await page.evaluate(() => window.__rushHour.selection());
  expect(selected.selectedId).toBe(cycled.highlightedId);

  await page.keyboard.press(' ');
  const browsing = await page.evaluate(() => window.__rushHour.selection());
  expect(browsing.selectedId).toBeNull();
  expect(browsing.highlightedId).toBe(cycled.highlightedId);

  await page.keyboard.press('ArrowDown');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('a selected car moves one cell per axis arrow; perpendicular arrow is ignored', async ({ page }) => {
  await openFirstLevel(page);
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  const firstMove = catalog.challenges[0].solution[0];
  const vehicle = catalog.challenges[0].vehicles.find((v) => v.id === firstMove.vehicleId);
  const ids = await page.evaluate(() => window.__rushHour.vehicleIds());

  // Browse to the car of the first optimal move.
  for (let i = 0; i <= ids.length; i += 1) {
    const current = await page.evaluate(() => window.__rushHour.selection());
    if (current.highlightedId === firstMove.vehicleId) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press(' '); // select

  const axisKey =
    vehicle.orientation === 'H'
      ? firstMove.delta > 0
        ? 'ArrowRight'
        : 'ArrowLeft'
      : firstMove.delta > 0
        ? 'ArrowDown'
        : 'ArrowUp';
  const perpKey =
    vehicle.orientation === 'H'
      ? firstMove.delta > 0
        ? 'ArrowDown'
        : 'ArrowUp'
      : firstMove.delta > 0
        ? 'ArrowRight'
        : 'ArrowLeft';

  // A perpendicular arrow must be ignored.
  await page.keyboard.press(perpKey);
  await expect(page.getByText('Déplacements : 0')).toBeVisible();

  // An axis arrow moves exactly one cell.
  await page.keyboard.press(axisKey);
  await expect(page.getByText('Déplacements : 1')).toBeVisible();
  const stillSelected = await page.evaluate(() => window.__rushHour.selection());
  expect(stillSelected.selectedId).toBe(firstMove.vehicleId);
});
