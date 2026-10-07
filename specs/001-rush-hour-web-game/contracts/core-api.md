# Contract: Pure Core API

The render, input, UI, audio, and progress layers consume the game only through the modules below.
Every module in `src/core/` MUST be dependency-free ESM with no DOM and no Three.js imports
(Constitution Principle II). All operations are pure: they receive data and return new data; they do
not touch the DOM, the renderer, storage, or time. This document is the interface shape only —
implementation bodies live in the code and in `tasks.md`.

## `src/core/rules.js`

- `export const RULES` — deeply frozen object: `{ boardSize, exitRow, carLength, truckLength,
  redVehicleCount, moveCost }` (see `data-model.md`).
- `export function rulesMatchReference(rulesText)` — returns `true` when `RULES` is consistent with
  the verbatim `RULES.md` content. Used by the guard test (Principle I).

## `src/core/board.js`

- `export function inBounds(row, col)` — `true` when a coordinate is inside the grid.
- `export function cellsOf(vehicle)` — the list of `{row, col}` a vehicle occupies.
- `export function isCellFree(vehicles, row, col, ignoreId)` — occupancy test excluding one vehicle.
- `export function exitCell()` — the `{row, col}` just outside the exit on `RULES.exitRow`.

## `src/core/moves.js`

- `export function legalDeltas(vehicles, vehicleId)` — sorted list of non-zero signed slide distances
  the vehicle can legally make along its own axis (FR-003, FR-005).
- `export function canSlide(vehicles, vehicleId, delta)` — `true` when the whole slide is legal.
- `export function applyMove(vehicles, move)` — returns a new vehicle list with `move` applied; throws
  if the move is illegal. Never mutates its input.

## `src/core/game.js`

- `export function createAttempt(challenge)` — fresh `Attempt` in `playing` (see `data-model.md`).
- `export function move(attempt, move)` — applies a legal move; returns a new `Attempt`; rejects
  illegal moves.
- `export function undo(attempt)` / `export function redo(attempt)` — return new `Attempt`s, or the
  same attempt when there is nothing to undo/redo (FR-016, FR-017).
- `export function reset(attempt)` — returns the initial layout with count 0 and `revealed = false`
  (FR-018).
- `export function reveal(attempt, challenge)` — returns the attempt flagged `revealed` and the
  solution to play, with the board state restored after playback (FR-019, FR-019a, FR-019b).
- `export function isWon(attempt)` — `true` only when the entire red car is past the exit (FR-007).

## `src/core/solver.js`

- `export function solve(layout)` — returns an optimal `Move[]` of minimum length for a starting
  layout, or `null` when unsolvable (FR-011). Reused by `tools/bake-solutions.mjs`.

## `src/core/schema.js`

- `export function validateCatalog(data)` — returns `{ ok, errors }`; enforces the JSON Schema rules
  plus: vehicle overlap, in-bounds cells, exactly one red car, red car aligned with and blocked from
  the exit, solution legality and completion, `optimalMoveCount === solution.length`, and the exact
  difficulty distribution Débutant 2 / Intermédiaire 3 / Avancé 2 / Expert 1 / Génie 2 (FR-009a).

## `src/data/challenges.js`

- `export async function loadCatalog(url)` — fetches and validates `challenges.json`; rejects invalid
  catalogs so the UI never presents an unsolvable challenge (FR-013).
- `export function buildRoadmap(catalog, progress)` — returns the `Roadmap` with unlock state for the
  current `Player Progress`.
