import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../../src/core/rules.js';
import { cellsOf, inBounds, isCellFree, isExitCorridor, exitCell } from '../../src/core/board.js';

test('board size and exit are the frozen rules', () => {
  assert.equal(RULES.boardSize, 6);
  assert.equal(RULES.exitRow, 3);
});

test('cellsOf expands a horizontal car', () => {
  const cells = cellsOf({ id: 'r', kind: 'car', orientation: 'H', row: 3, col: 4 });
  assert.deepEqual(cells, [
    { row: 3, col: 4 },
    { row: 3, col: 5 },
  ]);
});

test('cellsOf expands a vertical truck', () => {
  const cells = cellsOf({ id: 't', kind: 'truck', orientation: 'V', row: 2, col: 1 });
  assert.deepEqual(cells, [
    { row: 2, col: 1 },
    { row: 3, col: 1 },
    { row: 4, col: 1 },
  ]);
});

test('inBounds covers the grid and rejects the outside', () => {
  assert.equal(inBounds(1, 1), true);
  assert.equal(inBounds(6, 6), true);
  assert.equal(inBounds(0, 3), false);
  assert.equal(inBounds(3, 7), false);
  assert.equal(inBounds(2.5, 3), false);
});

test('isCellFree accounts for occupancy and can ignore one vehicle', () => {
  const vehicles = [
    { id: 'r', kind: 'car', orientation: 'H', row: 3, col: 4 },
    { id: 'b', kind: 'car', orientation: 'V', row: 3, col: 6 },
  ];
  assert.equal(isCellFree(vehicles, 3, 4), false);
  assert.equal(isCellFree(vehicles, 3, 4, 'r'), true);
  assert.equal(isCellFree(vehicles, 1, 1), true);
});

test('exit corridor is only beyond the right edge on the exit row', () => {
  assert.equal(isExitCorridor(3, 7), true);
  assert.equal(isExitCorridor(3, 6), false);
  assert.equal(isExitCorridor(2, 7), false);
  assert.deepEqual(exitCell(), { row: 3, col: 7 });
});
