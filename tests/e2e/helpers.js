// Shared e2e helpers. Levels open through the real 3D roadmap: the car rests on level 1, so a
// single Enter press starts it — a genuine user path (the old DOM list is gone).
export async function openFirstLevel(page) {
  await page.goto('/?test=1');
  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');
  await page.getByText('Déplacements : 0').first().waitFor();
}

export async function openChallenge(page, index) {
  await page.goto('/?test=1');
  await page.waitForFunction(() => typeof window.__rushHourRoadmap !== 'undefined');
  await page.evaluate((i) => window.__rushHourRoadmap.startLevel(i), index);
  await page.waitForFunction(() => typeof window.__rushHour !== 'undefined');
  await page.getByText('Déplacements : 0').first().waitFor();
}