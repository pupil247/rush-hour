// Data layer: fetch, validate, and shape the challenge catalog. No DOM, no Three.js imports.
// Consumes the pure core; the UI/render layers consume this module.
import { validateCatalog } from '../core/schema.js';

export const DIFFICULTY_ORDER = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert', 'Génie'];

export class CatalogError extends Error {}

export function validateOrThrow(data) {
  const result = validateCatalog(data);
  if (!result.ok) {
    throw new CatalogError(`Invalid challenge catalog:\n - ${result.errors.join('\n - ')}`);
  }
  return data;
}

export async function loadCatalog(url = 'challenges.json') {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new CatalogError(`Failed to load ${url}: ${response.status}`);
  const data = await response.json();
  return validateOrThrow(data);
}

/** Order challenges into a single linear path, grouped by the five difficulty regions. */
export function buildRoadmap(catalog, progress) {
  const order = [];
  const regions = [];
  for (const difficulty of DIFFICULTY_ORDER) {
    const inRegion = catalog.challenges.filter((c) => c.difficulty === difficulty);
    if (!inRegion.length) continue;
    const regionIds = [];
    for (const challenge of inRegion) {
      order.push(challenge.id);
      regionIds.push(challenge.id);
    }
    regions.push({ difficulty, challengeIds: regionIds });
  }

  const currentIndex = Math.min(progress?.currentIndex ?? 0, Math.max(0, order.length - 1));
  const stops = order.map((id, index) => {
    const record = progress?.records?.[id];
    return {
      id,
      index,
      unlocked: index <= currentIndex,
      solved: Boolean(record?.solved),
      bestMoveCount: record?.bestMoveCount ?? null,
      current: index === currentIndex,
    };
  });

  return { order, regions, stops, currentIndex };
}
