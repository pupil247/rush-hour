import { test, expect } from './three-fixture.js';

test('the browsing highlight and the selected highlight are distinct and unique', async ({ page }) => {
  await page.goto('/?test=1');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');

  // Browsing: exactly one car highlighted, none selected.
  const browsing = await page.evaluate(() => window.__rushHour.emphasized());
  expect(browsing.highlighted.length).toBe(1);
  expect(browsing.selected.length).toBe(0);

  // Selecting promotes that car to the strong selected level.
  await page.keyboard.press(' ');
  const selected = await page.evaluate(() => window.__rushHour.emphasized());
  expect(selected.selected.length).toBe(1);
  expect(selected.highlighted.length).toBe(0);

  // Moving the highlight while browsing keeps exactly one highlighted car.
  await page.keyboard.press(' '); // deselect
  await page.keyboard.press('ArrowRight'); // browse
  const after = await page.evaluate(() => window.__rushHour.emphasized());
  expect(after.highlighted.length).toBe(1);
  expect(after.selected.length).toBe(0);
});
