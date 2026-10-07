import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog, validateChallenge } from '../../src/core/schema.js';
import { redBlockedByCar, unsolvablePair } from '../fixtures/puzzles.js';

function errorsFor(challenge) {
  return validateChallenge(challenge, []);
}

test('a valid challenge passes validation', () => {
  assert.deepEqual(errorsFor(redBlockedByCar), []);
});

test('overlapping vehicles fail validation', () => {
  const bad = structuredClone(redBlockedByCar);
  bad.vehicles[1] = { id: 'b', kind: 'car', orientation: 'V', row: 3, col: 4, isRed: false };
  assert.ok(errorsFor(bad).some((e) => e.includes('overlap')));
});

test('a missing red car fails validation', () => {
  const bad = structuredClone(redBlockedByCar);
  bad.vehicles[0].isRed = false;
  assert.ok(errorsFor(bad).some((e) => e.includes('red vehicle')));
});

test('an unsolvable challenge fails validation', () => {
  const bad = structuredClone(unsolvablePair);
  bad.name = 'Unsolvable';
  bad.difficulty = 'Débutant';
  bad.solution = [{ vehicleId: 't', delta: 1 }];
  bad.optimalMoveCount = 1;
  const errors = errorsFor(bad);
  assert.ok(errors.some((e) => e.includes('unsolvable') || e.includes('does not reach a win')));
});

test('a wrong optimal count fails validation', () => {
  const bad = structuredClone(redBlockedByCar);
  bad.optimalMoveCount = 5;
  assert.ok(errorsFor(bad).some((e) => e.includes('solver minimum')));
});

test('the catalog enforces exactly ten challenges and the distribution', () => {
  const result = validateCatalog({ version: 1, challenges: [] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('exactly 10')));
});
