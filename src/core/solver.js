// Pure BFS optimal solver. No DOM, no Three.js imports.
// Any-distance slide costs exactly one move, so BFS depth is the game's move count.
import { RULES } from './rules.js';
import { cellsOf } from './board.js';
import { applyMove, legalDeltas } from './moves.js';

function keyOf(vehicles) {
  return [...vehicles]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((v) => `${v.id}:${v.row},${v.col}`)
    .join('|');
}

export function isGoalState(vehicles) {
  const red = vehicles.find((v) => v.isRed);
  if (!red || red.orientation !== 'H') return false;
  return cellsOf(red).every((c) => c.row === RULES.exitRow && c.col > RULES.boardSize);
}

function reconstruct(parent, goalKey) {
  const moves = [];
  let key = goalKey;
  for (;;) {
    const entry = parent.get(key);
    if (!entry) break;
    moves.push(entry.move);
    key = entry.prevKey;
  }
  return moves.reverse();
}

/** Returns a minimum-length Move[] for the layout, or null when unsolvable. */
export function solve(layout) {
  const start = layout.map((v) => ({ ...v }));
  if (isGoalState(start)) return [];

  const startKey = keyOf(start);
  const parent = new Map([[startKey, null]]);
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const state = queue[head];
    head += 1;
    const stateKey = keyOf(state);

    for (const vehicle of state) {
      for (const delta of legalDeltas(state, vehicle.id)) {
        const next = applyMove(state, { vehicleId: vehicle.id, delta });
        const key = keyOf(next);
        if (parent.has(key)) continue;
        parent.set(key, { prevKey: stateKey, move: { vehicleId: vehicle.id, delta } });
        if (isGoalState(next)) return reconstruct(parent, key);
        queue.push(next);
      }
    }
  }
  return null;
}
