// Pure movement rules. No DOM, no Three.js imports.
import { RULES } from './rules.js';
import { cellsOf, inBounds, isCellFree, isExitCorridor } from './board.js';

/**
 * Is a slide legal? The vehicle must move along its own axis, stay in-bounds (except the red
 * car, which may move into the exit corridor on the exit row), and never overlap another vehicle.
 * Every intermediate cell is checked, so a slide cannot pass through an obstacle.
 */
export function canSlide(vehicles, vehicleId, delta) {
  if (!Number.isInteger(delta) || delta === 0) return false;
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return false;

  const step = delta > 0 ? 1 : -1;
  const distance = Math.abs(delta);

  for (let i = 1; i <= distance; i += 1) {
    const candidate = {
      ...vehicle,
      row: vehicle.orientation === 'V' ? vehicle.row + step * i : vehicle.row,
      col: vehicle.orientation === 'H' ? vehicle.col + step * i : vehicle.col,
    };
    for (const cell of cellsOf(candidate)) {
      if (inBounds(cell.row, cell.col)) {
        if (!isCellFree(vehicles, cell.row, cell.col, vehicle.id)) return false;
      } else if (vehicle.isRed && isExitCorridor(cell.row, cell.col)) {
        // The red car may leave through the exit; the corridor is always empty.
        continue;
      } else {
        return false;
      }
    }
  }
  return true;
}

/** Every legal signed slide distance for one vehicle, ascending. */
export function legalDeltas(vehicles, vehicleId) {
  const out = [];
  const max = RULES.boardSize;
  for (let d = -max; d <= max; d += 1) {
    if (d === 0) continue;
    if (canSlide(vehicles, vehicleId, d)) out.push(d);
  }
  return out;
}

/** Apply a legal move, returning a new vehicle list. Never mutates its input. */
export function applyMove(vehicles, move) {
  const vehicle = vehicles.find((v) => v.id === move.vehicleId);
  if (!vehicle) throw new Error(`Unknown vehicle: ${move.vehicleId}`);
  if (!canSlide(vehicles, move.vehicleId, move.delta)) {
    throw new Error(`Illegal move: ${move.vehicleId} by ${move.delta}`);
  }
  return vehicles.map((v) => {
    if (v.id !== move.vehicleId) return v;
    return v.orientation === 'H'
      ? { ...v, col: v.col + move.delta }
      : { ...v, row: v.row + move.delta };
  });
}

/** Reverse a previously applied move. */
export function applyReverse(vehicles, move) {
  return applyMove(vehicles, { vehicleId: move.vehicleId, delta: -move.delta });
}
