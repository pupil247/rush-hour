import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAttempt,
  isWon,
  move,
  redo,
  reset,
  reveal,
  undo,
} from '../../src/core/game.js';
import { redBlockedByCar } from '../fixtures/puzzles.js';

test('createAttempt starts in a clean playing state', () => {
  const attempt = createAttempt(redBlockedByCar);
  assert.equal(attempt.moveCount, 0);
  assert.equal(attempt.status, 'playing');
  assert.equal(attempt.revealed, false);
  assert.deepEqual(attempt.history, []);
});

test('a multi-cell slide counts as exactly one move', () => {
  let attempt = createAttempt(redBlockedByCar);
  attempt = move(attempt, { vehicleId: 'b', delta: 1 });
  assert.equal(attempt.moveCount, 1);
});

test('an illegal move is refused and changes nothing', () => {
  const attempt = createAttempt(redBlockedByCar);
  const refused = move(attempt, { vehicleId: 'r', delta: 1 });
  assert.equal(refused, attempt);
  assert.equal(refused.moveCount, 0);
});

test('a partial exit does not win; a full exit does', () => {
  let attempt = createAttempt(redBlockedByCar);
  attempt = move(attempt, { vehicleId: 'b', delta: 1 });
  attempt = move(attempt, { vehicleId: 'r', delta: 2 });
  assert.equal(isWon(attempt), false, 'cols 6-7 is only a partial exit');
  const partial = attempt;
  attempt = move(partial, { vehicleId: 'r', delta: 1 });
  assert.equal(isWon(attempt), true);
  assert.equal(attempt.status, 'won');
});

test('undo and redo walk the history without limit', () => {
  let attempt = createAttempt(redBlockedByCar);
  attempt = move(attempt, { vehicleId: 'b', delta: 1 });
  attempt = undo(attempt);
  assert.equal(attempt.moveCount, 0);
  assert.equal(attempt.redoStack.length, 1);
  attempt = redo(attempt);
  assert.equal(attempt.moveCount, 1);
  assert.equal(attempt.redoStack.length, 0);
});

test('undo and redo are no-ops at their boundaries', () => {
  const attempt = createAttempt(redBlockedByCar);
  assert.equal(undo(attempt), attempt);
  assert.equal(redo(attempt), attempt);
});

test('reset restores the initial layout and count', () => {
  let attempt = createAttempt(redBlockedByCar);
  attempt = move(attempt, { vehicleId: 'b', delta: 1 });
  attempt = reset(attempt);
  assert.equal(attempt.moveCount, 0);
  assert.equal(attempt.revealed, false);
  assert.deepEqual(attempt.vehicles, attempt.initialVehicles);
});

test('reveal flags the attempt and returns the solution', () => {
  const attempt = createAttempt(redBlockedByCar);
  const { attempt: revealed, solution } = reveal(attempt, redBlockedByCar);
  assert.equal(revealed.revealed, true);
  assert.equal(solution.length, redBlockedByCar.solution.length);
});
