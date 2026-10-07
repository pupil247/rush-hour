import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyMove, applyReverse, canSlide, legalDeltas } from '../../src/core/moves.js';
import { simpleLayout } from '../fixtures/puzzles.js';

test('a blocked slide is illegal', () => {
  // Red at cols 4-5 is blocked by the car at (3,6).
  assert.equal(canSlide(simpleLayout, 'r', 1), false);
  assert.equal(canSlide(simpleLayout, 'r', 3), false);
});

test('a slide is legal once the blocker moves away', () => {
  const freed = applyMove(simpleLayout, { vehicleId: 'b', delta: 1 });
  assert.equal(canSlide(freed, 'r', 1), true);
  assert.equal(canSlide(freed, 'r', 3), true);
});

test('a vehicle moves only along its own axis', () => {
  const moved = applyMove(simpleLayout, { vehicleId: 'b', delta: 1 });
  const b = moved.find((v) => v.id === 'b');
  assert.equal(b.row, 4, 'vertical car changes row');
  assert.equal(b.col, 6, 'vertical car keeps its column');
});

test('legalDeltas excludes zero and impossible slides', () => {
  const deltas = legalDeltas(simpleLayout, 'r');
  assert.ok(!deltas.includes(0));
  assert.ok(!deltas.includes(1));
  assert.ok(deltas.includes(-3), 'red can retreat to the left');
});

test('the red car may slide into the exit corridor', () => {
  const freed = applyMove(simpleLayout, { vehicleId: 'b', delta: 1 });
  const exited = applyMove(freed, { vehicleId: 'r', delta: 3 });
  const r = exited.find((v) => v.id === 'r');
  assert.equal(r.col, 7);
});

test('applyMove does not mutate its input', () => {
  const before = JSON.stringify(simpleLayout);
  applyMove(simpleLayout, { vehicleId: 'b', delta: 1 });
  assert.equal(JSON.stringify(simpleLayout), before);
});

test('applyMove throws on an illegal move', () => {
  assert.throws(() => applyMove(simpleLayout, { vehicleId: 'r', delta: 1 }));
});

test('applyReverse undoes an applied move', () => {
  const moved = applyMove(simpleLayout, { vehicleId: 'b', delta: 1 });
  const back = applyReverse(moved, { vehicleId: 'b', delta: 1 });
  assert.deepEqual(back, simpleLayout);
});
