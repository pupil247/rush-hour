// Pure challenge validation. No DOM, no Three.js imports.
// Enforces the structural rules plus the rule-based checks the JSON Schema cannot express.
import { RULES, lengthForKind } from './rules.js';
import { cellsOf, inBounds } from './board.js';
import { applyMove, canSlide } from './moves.js';
import { isGoalState, solve } from './solver.js';

export const DIFFICULTIES = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert', 'Génie'];

export const DIFFICULTY_DISTRIBUTION = Object.freeze({
  Débutant: 2,
  Intermédiaire: 3,
  Avancé: 2,
  Expert: 1,
  Génie: 2,
});

export const CATALOG_SIZE = 10;

function validateVehicles(vehicles, errors) {
  if (!Array.isArray(vehicles) || vehicles.length < 2) {
    errors.push('vehicles: at least 2 are required');
    return null;
  }
  const ids = new Set();
  let redCount = 0;
  const geometric = [];

  for (const v of vehicles) {
    if (!v || typeof v.id !== 'string' || !v.id) {
      errors.push('vehicle: a non-empty string id is required');
      continue;
    }
    if (ids.has(v.id)) errors.push(`duplicate vehicle id: ${v.id}`);
    ids.add(v.id);

    const kindOk = v.kind === 'car' || v.kind === 'truck';
    const orientationOk = v.orientation === 'H' || v.orientation === 'V';
    const positionOk = Number.isInteger(v.row) && Number.isInteger(v.col);
    if (!kindOk) errors.push(`vehicle ${v.id}: kind must be "car" or "truck"`);
    if (!orientationOk) errors.push(`vehicle ${v.id}: orientation must be "H" or "V"`);
    if (!positionOk) errors.push(`vehicle ${v.id}: row and col must be integers`);
    if (typeof v.isRed !== 'boolean') errors.push(`vehicle ${v.id}: isRed must be a boolean`);
    if (v.isRed) redCount += 1;

    if (kindOk && orientationOk && positionOk) geometric.push(v);
  }

  const seen = new Map();
  for (const v of geometric) {
    for (const cell of cellsOf(v)) {
      if (!inBounds(cell.row, cell.col)) {
        errors.push(`vehicle ${v.id}: cell out of bounds (${cell.row},${cell.col})`);
      }
      const key = `${cell.row},${cell.col}`;
      if (seen.has(key)) errors.push(`overlap at ${key}: ${seen.get(key)} and ${v.id}`);
      else seen.set(key, v.id);
    }
  }

  if (redCount !== RULES.redVehicleCount) {
    errors.push(`expected exactly ${RULES.redVehicleCount} red vehicle, found ${redCount}`);
  }
  return { ids, redCount };
}

function isBlockedFromExit(vehicles, red) {
  const others = vehicles.filter((v) => v.id !== red.id);
  const occupied = new Set();
  for (const v of others) for (const c of cellsOf(v)) occupied.add(`${c.row},${c.col}`);
  const len = lengthForKind(red.kind);
  for (let col = red.col + len; col <= RULES.boardSize; col += 1) {
    if (occupied.has(`${RULES.exitRow},${col}`)) return true;
  }
  return false;
}

function replaySolution(vehicles, solution, errors) {
  let current = vehicles.map((v) => ({ ...v }));
  solution.forEach((move, index) => {
    if (!move || typeof move.vehicleId !== 'string') {
      errors.push(`solution[${index}]: vehicleId is required`);
      return;
    }
    if (!Number.isInteger(move.delta) || move.delta === 0) {
      errors.push(`solution[${index}]: delta must be a non-zero integer`);
      return;
    }
    if (!canSlide(current, move.vehicleId, move.delta)) {
      errors.push(`solution[${index}]: illegal move for ${move.vehicleId} by ${move.delta}`);
      return;
    }
    current = applyMove(current, move);
  });
  if (!isGoalState(current)) errors.push('solution: does not reach a win');
  return current;
}

export function validateChallenge(challenge, errors = []) {
  if (!challenge || typeof challenge !== 'object') {
    errors.push('challenge must be an object');
    return errors;
  }
  if (typeof challenge.id !== 'string' || !challenge.id) errors.push('challenge id is required');
  if (typeof challenge.name !== 'string' || !challenge.name) errors.push(`challenge ${challenge.id}: name is required`);
  if (!DIFFICULTIES.includes(challenge.difficulty)) {
    errors.push(`challenge ${challenge.id}: unknown difficulty "${challenge.difficulty}"`);
  }

  const info = validateVehicles(challenge.vehicles, errors);
  if (info) {
    const red = challenge.vehicles.find((v) => v.isRed);
    if (red) {
      if (red.orientation !== 'H' || red.row !== RULES.exitRow) {
        errors.push(`challenge ${challenge.id}: the red car must be horizontal on the exit row`);
      }
      if (!isBlockedFromExit(challenge.vehicles, red)) {
        errors.push(`challenge ${challenge.id}: the red car must start blocked from the exit`);
      }
    }

    if (Array.isArray(challenge.solution)) {
      replaySolution(challenge.vehicles, challenge.solution, errors);
      if (challenge.solution.length !== challenge.optimalMoveCount) {
        errors.push(`challenge ${challenge.id}: optimalMoveCount must equal the solution length`);
      }
    } else {
      errors.push(`challenge ${challenge.id}: solution is required`);
    }

    if (!Number.isInteger(challenge.optimalMoveCount) || challenge.optimalMoveCount < 1) {
      errors.push(`challenge ${challenge.id}: optimalMoveCount must be a positive integer`);
    } else {
      const optimal = solve(challenge.vehicles);
      if (!optimal) errors.push(`challenge ${challenge.id}: layout is unsolvable`);
      else if (optimal.length !== challenge.optimalMoveCount) {
        errors.push(
          `challenge ${challenge.id}: optimalMoveCount ${challenge.optimalMoveCount} != solver minimum ${optimal.length}`,
        );
      }
    }
  }
  return errors;
}

export function validateCatalog(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['catalog must be an object'] };
  }
  if (!Number.isInteger(data.version) || data.version < 1) errors.push('catalog version must be a positive integer');
  if (!Array.isArray(data.challenges)) {
    return { ok: false, errors: [...errors, 'catalog challenges must be an array'] };
  }
  if (data.challenges.length !== CATALOG_SIZE) {
    errors.push(`catalog must contain exactly ${CATALOG_SIZE} challenges, found ${data.challenges.length}`);
  }

  const ids = new Set();
  const counts = Object.fromEntries(DIFFICULTIES.map((d) => [d, 0]));
  for (const challenge of data.challenges) {
    validateChallenge(challenge, errors);
    if (challenge && typeof challenge.id === 'string') {
      if (ids.has(challenge.id)) errors.push(`duplicate challenge id: ${challenge.id}`);
      ids.add(challenge.id);
    }
    if (challenge && DIFFICULTIES.includes(challenge.difficulty)) counts[challenge.difficulty] += 1;
  }

  for (const difficulty of DIFFICULTIES) {
    if (counts[difficulty] !== DIFFICULTY_DISTRIBUTION[difficulty]) {
      errors.push(
        `difficulty ${difficulty}: expected ${DIFFICULTY_DISTRIBUTION[difficulty]}, found ${counts[difficulty]}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
