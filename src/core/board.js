// Pure board geometry. No DOM, no Three.js imports.
import { RULES, lengthForKind } from './rules.js';

export function inBounds(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 1 &&
    row <= RULES.boardSize &&
    col >= 1 &&
    col <= RULES.boardSize
  );
}

/** The cells a vehicle would occupy, given its leading cell and orientation. */
export function cellsOf(vehicle) {
  const len = lengthForKind(vehicle.kind);
  const cells = [];
  for (let i = 0; i < len; i += 1) {
    cells.push(
      vehicle.orientation === 'H'
        ? { row: vehicle.row, col: vehicle.col + i }
        : { row: vehicle.row + i, col: vehicle.col },
    );
  }
  return cells;
}

export function isCellFree(vehicles, row, col, ignoreId = null) {
  for (const v of vehicles) {
    if (ignoreId != null && v.id === ignoreId) continue;
    if (cellsOf(v).some((c) => c.row === row && c.col === col)) return false;
  }
  return true;
}

/** A cell just beyond the right edge on the exit row (part of the exit corridor). */
export function isExitCorridor(row, col) {
  return row === RULES.exitRow && col > RULES.boardSize;
}

export function exitCell() {
  return { row: RULES.exitRow, col: RULES.boardSize + 1 };
}
