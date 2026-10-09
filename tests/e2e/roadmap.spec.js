import { test, expect } from './three-fixture.js';
import { openFirstLevel } from './helpers.js';

async function openRoadmap(page) {
  await page.goto('/?test=1');
  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
}

test('the 3D roadmap renders 10 nodes with the car on node 1 and a ring', async ({ page }) => {
  await openRoadmap(page);
  expect(await page.evaluate(() => window.__rushHourRoadmap.nodeCount())).toBe(10);
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(0);
  expect(await page.evaluate(() => window.__rushHourRoadmap.hasRing())).toBe(true);
});

test('exactly one node is unlocked at the start, the rest locked', async ({ page }) => {
  await openRoadmap(page);
  const states = await page.evaluate(() => window.__rushHourRoadmap.nodeStates());
  expect(states.filter((s) => s.locked).length).toBe(9);
  expect(states.filter((s) => !s.locked).length).toBe(1);
});

test('arrows travel one node and back, always resting on a node; boundary blocks', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'rushHour.progress',
        JSON.stringify({ version: 1, currentIndex: 1, records: {} }),
      );
    } catch {
      /* storage unavailable */
    }
  });
  await openRoadmap(page);
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(1);

  // Boundary at node 1 (unlock boundary): advancing further is blocked.
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(1);

  // Back to node 0 (turn-around travel), then forward again.
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => {
    const s = window.__rushHourRoadmap;
    return !s.isTraveling() && s.carIndex() === 0;
  });
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => {
    const s = window.__rushHourRoadmap;
    return !s.isTraveling() && s.carIndex() === 1;
  });
  // The car is never reported between nodes.
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(1);
});

test('Enter starts the current level from the roadmap', async ({ page }) => {
  await openRoadmap(page);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');
  await expect(page.getByText('Déplacements : 0')).toBeVisible();
});

test('winning a level advances the roadmap and persists after reload', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
  // Use the test handle to open level 1, then drive the baked solution with the keyboard.
  await page.evaluate(() => window.__rushHourRoadmap.startLevel(0));
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');
  await expect(page.getByText('Déplacements : 0')).toBeVisible();

  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const catalog = JSON.parse(
    readFileSync(fileURLToPath(new URL('../../challenges.json', import.meta.url)), 'utf8'),
  );
  const challenge = catalog.challenges[0];
  const order = challenge.vehicles.map((v) => v.id);

  async function selectVehicle(target) {
    const selected = await page.evaluate(() => window.__rushHour.selection());
    if (selected.selectedId) await page.keyboard.press(' ');
    for (let i = 0; i <= order.length; i += 1) {
      const current = await page.evaluate(() => window.__rushHour.selection());
      if (current.highlightedId === target) break;
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press(' ');
  }
  for (const mv of challenge.solution) {
    await selectVehicle(mv.vehicleId);
    const vehicle = challenge.vehicles.find((v) => v.id === mv.vehicleId);
    const key =
      vehicle.orientation === 'H'
        ? mv.delta > 0
          ? 'ArrowRight'
          : 'ArrowLeft'
        : mv.delta > 0
          ? 'ArrowDown'
          : 'ArrowUp';
    for (let i = 0; i < Math.abs(mv.delta); i += 1) {
      await page.keyboard.press(key);
      await page.waitForFunction(() => window.__rushHour && !window.__rushHour.busy());
    }
  }
  await expect(page.getByText('Bravo !')).toBeVisible();
  await page.getByRole('button', { name: 'Retour à la route' }).click();

  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(1);
  const states = await page.evaluate(() => window.__rushHourRoadmap.nodeStates());
  expect(states[0].solved).toBe(true);
  expect(states[0].locked).toBe(false);

  await page.reload();
  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
  expect(await page.evaluate(() => window.__rushHourRoadmap.carIndex())).toBe(1);
});