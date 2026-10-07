// Pure rules oracle. No DOM, no Three.js imports (Constitution Principle I & II).
// This module is the single source of truth for puzzle constants and must stay consistent
// with the verbatim RULES.md. `rulesMatchReference` is used by the rules guard test.

export const RULES = Object.freeze({
  boardSize: 6,
  exitRow: 3,
  carLength: 2,
  truckLength: 3,
  redVehicleCount: 1,
  moveCost: 1,
});

export function lengthForKind(kind) {
  if (kind === 'car') return RULES.carLength;
  if (kind === 'truck') return RULES.truckLength;
  throw new Error(`Unknown vehicle kind: ${kind}`);
}

/**
 * Confirm the frozen RULES constants are consistent with the verbatim RULES.md text.
 * Returns true when every constant matches the declared value in the reference document.
 */
export function rulesMatchReference(rulesText) {
  const text = String(rulesText);
  const read = (re) => {
    const m = text.match(re);
    return m ? Number(m[1]) : null;
  };

  const board = text.match(/Plateau\s*:\s*(\d+)\s*[×x]\s*(\d+)/i);
  const boardSize = board ? Number(board[1]) : null;
  const exitRow = read(/Sortie\s*:\s*(\d+)/i);
  const carLength = read(/Voiture\s*:\s*(\d+)\s*cases/i);
  const truckLength = read(/Camion\s*:\s*(\d+)\s*cases/i);
  const redVehicleCount = read(/Voiture rouge\s*:\s*exactement\s*(\d+)/i);
  const moveCost = read(/D[ée]placement\s*:\s*(\d+)/i);

  return (
    boardSize === RULES.boardSize &&
    exitRow === RULES.exitRow &&
    carLength === RULES.carLength &&
    truckLength === RULES.truckLength &&
    redVehicleCount === RULES.redVehicleCount &&
    moveCost === RULES.moveCost
  );
}
