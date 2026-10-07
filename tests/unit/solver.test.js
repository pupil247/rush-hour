import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGoalState, solve } from '../../src/core/solver.js';
import { applyMove } from '../../src/core/moves.js';
import { createAttempt, isWon, move } from '../../src/core/game.js';
import { simpleLayout, unsolvablePair, redBlockedByCar } from '../fixtures/puzzles.js';

test('the solver returns the minimum number of slides', () => {
  const solution = solve(simpleLayout);
  assert.equal(solution.length, 2);
  // Multiple 2-move solutions exist (the blocker can move up or down); assert that replaying
  // the returned solution wins rather than pinning one specific first move.
  let vehicles = simpleLayout.map((v) => ({ ...v }));
  for (const mv of solution) vehicles = applyMove(vehicles, mv);
  assert.equal(isGoalState(vehicles), true);
});

test('the solver returns null for an unsolvable layout', () => {
  assert.equal(solve(unsolvablePair.vehicles), null);
});

test('replaying the solver solution wins with the same move count', () => {
  const solution = solve(redBlockedByCar.vehicles);
  assert.equal(solution.length, redBlockedByCar.optimalMoveCount);
  let attempt = createAttempt(redBlockedByCar);
  for (const mv of solution) attempt = move(attempt, mv);
  assert.equal(isWon(attempt), true);
  assert.equal(attempt.moveCount, solution.length);
});
