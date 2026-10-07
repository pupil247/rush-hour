import { test, expect } from './three-fixture.js';

const RED = 0xd21f2a;

async function openFirstChallenge(page) {
  await page.goto('/?test=1');
  await page.getByText('Premier virage').click();
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined', null, { timeout: 30_000 });
}

test('vehicles render as 3D models, not the procedural fallback', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openFirstChallenge(page);

  const ids = await page.evaluate(() => window.__rushHour.vehicleIds());
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    expect(await page.evaluate((i) => window.__rushHour.isModel(i), id)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('every vehicle kind is a car or a truck', async ({ page }) => {
  await openFirstChallenge(page);
  const kinds = await page.evaluate(() =>
    window.__rushHour.vehicleIds().map((id) => window.__rushHour.vehicleKind(id)),
  );
  for (const kind of kinds) expect(['car', 'truck']).toContain(kind);
});

test('every vehicle has a distinct body color and exactly one is red', async ({ page }) => {
  await openFirstChallenge(page);
  const colors = await page.evaluate(() => Object.values(window.__rushHour.bodyColors()));
  expect(colors.length).toBeGreaterThan(1);
  expect(colors.filter((c) => c === RED).length).toBe(1);
  expect(new Set(colors).size).toBe(colors.length);
});

test('model assets load from the app origin', async ({ page }) => {
  const responses = [];
  page.on('response', (r) => {
    if (r.url().includes('/assets/models/')) responses.push({ url: r.url(), status: r.status() });
  });
  await openFirstChallenge(page);
  const car = responses.find((r) => r.url.endsWith('/assets/models/car.glb'));
  expect(car?.status).toBe(200);
});

test('the game stays playable when a model is unavailable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/assets/models/car.glb', (route) => route.abort());
  await openFirstChallenge(page);

  const ids = await page.evaluate(() => window.__rushHour.vehicleIds());
  const carId = await page.evaluate(
    () => window.__rushHour.vehicleIds().find((id) => window.__rushHour.vehicleKind(id) === 'car'),
  );
  expect(await page.evaluate((i) => window.__rushHour.isModel(i), carId)).toBe(false);

  // The fallback is still selectable via the keyboard, so the puzzle remains playable.
  for (let i = 0; i <= ids.length; i += 1) {
    const current = await page.evaluate(() => window.__rushHour.selection());
    if (current.highlightedId === carId) break;
    await page.keyboard.press('ArrowRight');
  }
  await page.keyboard.press(' ');
  const selection = await page.evaluate(() => window.__rushHour.selection());
  expect(selection.selectedId).toBe(carId);
  expect(errors).toEqual([]);
});
