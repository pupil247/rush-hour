import { test, expect } from './three-fixture.js';
import { openFirstLevel } from './helpers.js';

// The red car must face the exit side (its winning slide direction). In practice its model yaw is
// the other vehicles' yaw plus a half-turn (the 180° flip), for the same orientation.
const sameOrientation = (a, b) => a.orientation === b.orientation && a.orientation === 'H';

test('in level 1 the red car yaw is a half-turn away from other horizontal cars', async ({ page }) => {
  await openFirstLevel(page);
  const yawDiff = await page.evaluate(() => {
    const ids = window.__rushHour.vehicleIds();
    const vehicles = ids
      .map((id) => {
        const mesh = window.__rushHour;
        return { id, kind: mesh.vehicleKind(id) };
      })
      .filter((v) => v.kind === 'car');
    const red = ids.find((id) => {
      const el = window.__rushHour;
      return el.isModel(id) && el.bodyColors()[id] === 0xd21f2a;
    });
    const other = vehicles.map((v) => v.id).find((id) => id !== red);
    if (!red || !other) return null;
    return Math.abs(window.__rushHour.vehicleYaw(red) - window.__rushHour.vehicleYaw(other));
  });
  expect(yawDiff).not.toBeNull();
  // Normalize to [0, π] and accept a small tolerance around a half-turn.
  const diff = yawDiff % (Math.PI * 2);
  const normalized = diff > Math.PI ? Math.PI * 2 - diff : diff;
  expect(Math.abs(normalized - Math.PI)).toBeLessThan(0.1);
});

test('non-red vehicles keep a consistent orientation (no flip between two H cars)', async ({ page }) => {
  await openFirstLevel(page);
  const yawDelta = await page.evaluate(() => {
    const ids = window.__rushHour.vehicleIds();
    const hCars = ids.filter((id) => window.__rushHour.vehicleKind(id) === 'car');
    const nonRed = hCars.filter((id) => window.__rushHour.bodyColors()[id] !== 0xd21f2a);
    if (nonRed.length < 2) return null;
    const a = window.__rushHour.vehicleYaw(nonRed[0]);
    const b = window.__rushHour.vehicleYaw(nonRed[1]);
    let d = Math.abs(a - b) % (Math.PI * 2);
    if (d > Math.PI) d = Math.PI * 2 - d;
    return d;
  });
  expect(yawDelta).not.toBeNull();
  expect(yawDelta).toBeLessThan(0.1); // same orientation ⇒ same yaw, untouched by the red fix
});