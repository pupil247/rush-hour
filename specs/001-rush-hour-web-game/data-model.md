# Phase 1 Data Model: Rush Hour Web Game

Entities are described as logical shapes. Field names here are the canonical names used across the
core interface (`contracts/core-api.md`), the challenge file (`contracts/challenges.schema.json`),
and persistence (`contracts/progress-storage.md`).

## Rules (immutable configuration)

The single frozen source of puzzle constants, derived from `RULES.md` (Constitution Principle I).

| Field | Meaning | Value |
|-------|---------|-------|
| `boardSize` | Grid is square | `6` |
| `exitRow` | Row (1-indexed from top) containing the exit on the right edge | `3` |
| `carLength` | Cells occupied by a car | `2` |
| `truckLength` | Cells occupied by a truck | `3` |
| `redVehicleCount` | Exactly one red vehicle per challenge | `1` |
| `moveCost` | One continuous slide counts as this many moves regardless of distance | `1` |

**Invariants**: the object is deeply frozen; no runtime code may mutate it. A guard test asserts these
values match the statements in `RULES.md`.

## Board

The static play area implied by `Rules`, not a stored entity.

- **Derived fields**: width, height (= `boardSize`), the exit cell edge on `exitRow`, the set of
  in-bounds coordinates.
- **Rules**: a vehicle is legal only if all of its cells are in-bounds (FR-004).

## Vehicle

One car or truck in a challenge.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique within a challenge (stable across reloads) |
| `kind` | `"car"` \| `"truck"` | Determines length |
| `length` | integer | `2` for car, `3` for truck (must match `kind`) |
| `orientation` | `"H"` \| `"V"` | Fixed; never changes during play (FR-003) |
| `row`, `col` | integer | Top-left/leading cell, 1-indexed |
| `isRed` | boolean | Exactly one vehicle per challenge is `true` (FR-002, FR-028) |

**Validation rules**:
- `length` MUST equal the length implied by `kind`.
- A horizontal vehicle spans `col … col+length-1` on `row`; a vertical one spans `row … row+length-1`
  on `col`; all cells MUST be in-bounds.
- No two vehicles MAY occupy the same cell.
- Exactly one vehicle MUST have `isRed = true`.

## Move

A single continuous slide of one vehicle.

| Field | Type | Notes |
|-------|------|-------|
| `vehicleId` | string | Which vehicle moved |
| `delta` | integer (non-zero) | Signed cells along the vehicle's own axis (negative = toward start) |

**Derived**: direction and distance. Adding `delta` to the vehicle's `row` (vertical) or `col`
(horizontal) yields the new position. A move is legal only if every intermediate cell is
empty/in-bounds for the whole slide (FR-005). Each `Move` increases the attempt's move count by
exactly `Rules.moveCost` (FR-006).

## Challenge

One named puzzle and its verified solution.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable, unique across all challenges |
| `name` | string | Display name (French) |
| `difficulty` | enum | `"Débutant"` \| `"Intermédiaire"` \| `"Avancé"` \| `"Expert"` \| `"Génie"` |
| `vehicles` | Vehicle[] | Complete starting layout |
| `solution` | Move[] | Optimal sequence, produced by the offline solver |
| `optimalMoveCount` | integer | MUST equal `solution.length` and the solver's minimum |

**Validation rules** (FR-010, FR-011, FR-013, Principle V):
- `vehicles` MUST satisfy every Vehicle rule and contain the red car aligned with the exit row but
  blocked (no trivial win at start).
- `solution` MUST be a legal sequence from the starting layout ending in a win; replaying it MUST
  reach the win state.
- `optimalMoveCount` MUST equal `solution.length` and MUST equal the BFS minimum for the layout.
- The v1 catalog MUST contain exactly 10 challenges distributed Débutant 2, Intermédiaire 3,
  Avancé 2, Expert 1, Génie 2 (FR-009a).

## Attempt

One play of one challenge. This is the in-memory game state owned by `core/game.js`.

| Field | Type | Notes |
|-------|------|-------|
| `challengeId` | string | Challenge being played |
| `vehicles` | Vehicle[] | Current positions |
| `history` | Move[] | Moves applied, oldest first |
| `redoStack` | Move[] | Moves undone, most recent last |
| `moveCount` | integer | Equals `history.length` |
| `revealed` | boolean | True once the player has viewed the solution this attempt (FR-026) |
| `status` | enum | `"playing"` \| `"revealing"` \| `"won"` |

**State transitions**:

```text
(start) ──load challenge──▶ playing
playing ──legal move──────▶ playing        (history+1, redoStack cleared)
playing ──undo────────────▶ playing        (history-1, redoStack+1)
playing ──redo────────────▶ playing        (history+1, redoStack-1)
playing ──reset───────────▶ playing        (back to initial layout, count 0, revealed false)
playing ──reveal──────────▶ revealing ──animation ends──▶ playing   (revealed = true)
playing ──red car fully out▶ won
```

**Win condition**: `status = "won"` only when all red-car cells are strictly past the exit edge
(FR-007). A partially exited red car does not win.

## Roadmap

The ordered progression derived from the challenge catalog plus player progress.

| Field | Type | Notes |
|-------|------|-------|
| `order` | challengeId[] | Single linear sequence from first Débutant to last Génie (FR-020) |
| `regions` | { difficulty, challengeIds }[] | The five difficulty regions shown along the path (FR-020a) |

**Rules**:
- Exactly one challenge is unlocked at the start: the first entry (SC-010).
- Solving the current challenge unlocks exactly the next entry (FR-020b).
- Locked entries are not selectable (FR-020c); any previously reached entry is replayable (FR-020d).

## Player Progress

Per-device record persisted in `localStorage` (FR-024, FR-025).

| Field | Type | Notes |
|-------|------|-------|
| `version` | integer | Storage schema version |
| `currentIndex` | integer | Furthest unlocked position on the roadmap (never decreases) |
| `records` | map challengeId → record | Per challenge |

**Record**:

| Field | Type | Notes |
|-------|------|-------|
| `solved` | boolean | True only for an unaided win (FR-025) |
| `bestMoveCount` | integer \| null | Lowest unaided move count; only lowers (FR-024) |
| `lastMoveCount` | integer \| null | Most recent completion, for display |

**Rules**: a revealed win MUST NOT set `solved`, MUST NOT advance `currentIndex`, and MUST NOT
change `bestMoveCount` (FR-026).
