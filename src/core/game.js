// Pure attempt state machine. No DOM, no Three.js imports.
// Mirrors the transitions in specs/001-rush-hour-web-game/data-model.md.
import { RULES } from './rules.js';
import { cellsOf } from './board.js';
import { applyMove, applyReverse, canSlide } from './moves.js';

function cloneVehicles(vehicles) {
  return vehicles.map((v) => ({ ...v }));
}

export function createAttempt(challenge) {
  const vehicles = cloneVehicles(challenge.vehicles);
  return {
    challengeId: challenge.id,
    vehicles,
    initialVehicles: cloneVehicles(vehicles),
    history: [],
    redoStack: [],
    moveCount: 0,
    revealed: false,
    status: 'playing',
  };
}

/** True only when the entire red car is past the right edge on the exit row. */
export function isWon(attempt) {
  const red = attempt.vehicles.find((v) => v.isRed);
  if (!red) return false;
  if (red.orientation !== 'H') return false;
  return cellsOf(red).every((c) => c.row === RULES.exitRow && c.col > RULES.boardSize);
}

/** Apply a legal move. Illegal moves are refused and leave the attempt unchanged. */
export function move(attempt, mv) {
  if (attempt.status !== 'playing') return attempt;
  if (!canSlide(attempt.vehicles, mv.vehicleId, mv.delta)) return attempt;

  const vehicles = applyMove(attempt.vehicles, mv);
  const history = [...attempt.history, { vehicleId: mv.vehicleId, delta: mv.delta }];
  const next = {
    ...attempt,
    vehicles,
    history,
    redoStack: [],
    moveCount: attempt.moveCount + RULES.moveCost,
  };
  if (isWon(next)) next.status = 'won';
  return next;
}

export function undo(attempt) {
  if (attempt.history.length === 0) return attempt;
  const last = attempt.history[attempt.history.length - 1];
  return {
    ...attempt,
    vehicles: applyReverse(attempt.vehicles, last),
    history: attempt.history.slice(0, -1),
    redoStack: [...attempt.redoStack, last],
    moveCount: attempt.moveCount - RULES.moveCost,
    status: 'playing',
  };
}

export function redo(attempt) {
  if (attempt.redoStack.length === 0) return attempt;
  const last = attempt.redoStack[attempt.redoStack.length - 1];
  const next = {
    ...attempt,
    vehicles: applyMove(attempt.vehicles, last),
    history: [...attempt.history, last],
    redoStack: attempt.redoStack.slice(0, -1),
    moveCount: attempt.moveCount + RULES.moveCost,
  };
  if (isWon(next)) next.status = 'won';
  return next;
}

export function reset(attempt) {
  return {
    challengeId: attempt.challengeId,
    vehicles: cloneVehicles(attempt.initialVehicles),
    initialVehicles: cloneVehicles(attempt.initialVehicles),
    history: [],
    redoStack: [],
    moveCount: 0,
    revealed: false,
    status: 'playing',
  };
}

/**
 * Flag the attempt as having viewed the solution and return the sequence to play.
 * The board is not mutated here; the animation layer restores it after playback.
 */
export function reveal(attempt, challenge) {
  return {
    attempt: { ...attempt, revealed: true },
    solution: (challenge.solution || []).map((m) => ({ vehicleId: m.vehicleId, delta: m.delta })),
  };
}
