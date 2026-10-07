---
description: "Task list for the Vehicle Selection & Keyboard Controls feature"
---

# Tasks: Vehicle Selection & Keyboard Controls

**Input**: Design documents from `/specs/002-fix-vehicle-selection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED and required. Constitution Principle IV (Test-First, Test-Ready) mandates a
`node --test` suite plus Playwright browser tests.

**Organization**: Tasks are grouped by user story (P1 → P3). The pointer bug (US1) is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Every task includes an exact file path

## Path Conventions

- Single static project: `src/`, `tests/` at repository root (see plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a green baseline before changing anything.

- [X] T001 Verify the baseline is green by running `node --test` and `npx playwright test` (scripts in `package.json`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure selection reducer and the shared selection state that all three stories use.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests first (must fail before implementation)

- [X] T002 [P] Write failing unit tests for the selection reducer in `tests/unit/selection.test.js`: `initial` (first car or null), `cycle` (wraps, honors direction, no-op when selected), `toggle` (select / deselect keeping the browse highlight), `select`, `clear`, `keep` (safe when the id left the roster)

### Implementation

- [X] T003 Implement the pure selection reducer in `src/input/selection.js` with `initial`, `cycle`, `toggle`, `select`, `clear`, `keep`, satisfying the invariants in `contracts/selection.md` (no DOM, no Three.js imports)
- [X] T004 Add the shared selection state to `src/main.js`: initialize it with `initial(vehicles)` when a level opens and on reset, and expose the current value to the pointer and keyboard modules
- [X] T005 [P] Extend `tests/unit/purity.test.js` to assert `src/input/selection.js` imports neither the DOM nor Three.js

**Checkpoint**: `node --test` green for the reducer; the app still runs.

---

## Phase 3: User Story 1 - Select and Move a Car with the Mouse (Priority: P1) 🎯 MVP

**Goal**: Restore working mouse selection and dragging.

**Independent Test**: With the mouse only, click a car (selected, no console error), drag it into empty
space (moves, counter increases), click empty space (deselect), drag into a blocked direction (refused).

### Tests for User Story 1

- [X] T006 [P] [US1] Write the failing E2E test `tests/e2e/selection.spec.js`: clicking a car selects it with no page error, dragging moves it and increments the counter, clicking empty space clears the selection, and a blocked drag is refused

### Implementation for User Story 1

- [X] T007 [US1] Fix `src/input/pointer.js`: read the group as `getState().three.vehicleGroup`, select the car on `pointerdown` via the selection reducer, and stop throwing in `pickVehicle`
- [X] T008 [US1] Wire mouse selection into `src/main.js`: `select` on a car click, `clear` on an empty click, and `keep` the moved car after `doMove`

**Checkpoint**: User Story 1 is fully playable with the mouse.

---

## Phase 4: User Story 2 - See Which Car Is Highlighted (Priority: P2)

**Goal**: A strong highlight for the selected car and a lighter one for the browsing highlight.

**Independent Test**: Select a car and confirm it is visually distinct; browse and confirm the
highlight moves and only one car is highlighted.

### Tests for User Story 2

- [X] T009 [P] [US2] Write failing unit tests for `levelFor(selection, id)` in `tests/unit/selection.test.js`: returns `"selected"` when `id === selectedId`, `"highlighted"` when `id === highlightedId` but not selected, otherwise `"none"`

### Implementation for User Story 2

- [X] T010 [US2] Implement `levelFor(selection, id)` in `src/input/selection.js` with selected-wins-over-highlighted precedence
- [X] T011 [US2] Implement `applySelection(meshes, selection)` in `src/render/vehicles.js` with a strong selected level (scale + bright emissive) and a lighter browsing level, resetting all others to default
- [X] T012 [US2] Call `applySelection` from `src/main.js` on every selection change and after each move so the highlight updates within one frame
- [X] T013 [P] [US2] Write `tests/e2e/highlight.spec.js`: capture the canvas before and after a selection change and assert the image differs, and that no page error occurs

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Drive Entirely from the Keyboard (Priority: P3)

**Goal**: Two-mode keyboard: arrows cycle in browsing, Space selects/deselects, arrows move one cell.

**Independent Test**: Open a level and play with the keyboard only: cycle cars, select, move one cell
per press, ignore perpendicular arrows, deselect, and never scroll the page.

### Tests for User Story 3

- [X] T014 [P] [US3] Write the failing E2E test `tests/e2e/keyboard.spec.js`: arrows cycle the highlight and wrap, Space selects, an axis arrow moves the car one cell, a perpendicular arrow is ignored, Space deselects, and arrows do not scroll the page

### Implementation for User Story 3

- [X] T015 [US3] Rewrite `src/input/keyboard.js` for the two-mode model in `contracts/interaction.md`: browsing cycles via the reducer; selected moves one cell via `legalDeltas`; perpendicular arrows ignored; keep the undo/redo/reset/reveal shortcuts
- [X] T016 [US3] Wire the keyboard handlers in `src/main.js`: `cycle`, `toggle`, and one-cell move actions, ignoring all input while `state.busy`

**Checkpoint**: All three user stories work independently and together.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Robustness, docs, and full validation.

- [X] T017 [P] Preserve or safely clear the selection across undo/redo/reset in `src/main.js`, re-initializing from the attempt's vehicles when an id no longer exists
- [X] T018 [P] Remove the stale `Tab`-to-select hint and document the two-mode keyboard in the `src/input/keyboard.js` header comment and `README.md`
- [X] T019 Run the `quickstart.md` V1–V7 scenarios and confirm `node --test` and `npx playwright test` are green
- [X] T020 [P] Confirm no new dependency and no build artifact were introduced (`package.json`, repository root)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: Each depends only on Foundational
- **Polish (Phase 6)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Needs Foundational — MVP, no dependency on other stories
- **US2 (P2)**: Needs Foundational and US1's selection wiring (to have something to highlight)
- **US3 (P3)**: Needs Foundational and US2's highlight (to see what is selected)

### Within Each Story

- Tests are written first and MUST fail before implementation
- The reducer/helper is implemented before the render/input wiring that uses it
- Finish a story at its checkpoint before starting the next priority

### Parallel Opportunities

- Foundational: T002 (tests) and T005 (purity guard) touch different files
- US1: T006 (test) can be written while T007 is prepared
- US2: T009 (test) and T013 (E2E) are independent files
- Polish: T017, T018, T020 are independent files

---

## Parallel Example: Phase 2 + US2

```bash
# Different files, can proceed together:
Task: "Write failing unit tests for the selection reducer in tests/unit/selection.test.js"
Task: "Extend tests/unit/purity.test.js to assert src/input/selection.js is pure"
Task: "Write tests/e2e/highlight.spec.js for the selection highlight"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (the reducer + shared state)
3. Complete Phase 3: User Story 1 — the pointer bug is fixed and the game is playable with the mouse
4. **STOP and VALIDATE**: `tests/e2e/selection.spec.js` and the core suite pass

### Incremental Delivery

1. Foundational → reducer ready and tested
2. US1 → mouse selection/drag restored (MVP)
3. US2 → highlights
4. US3 → keyboard two-mode controls
5. Polish → robustness, docs, full validation

---

## Notes

- [P] = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Every movement goes through `src/core/moves.js`; never implement movement in the input layer
- `src/input/selection.js` must stay pure (no DOM, no Three.js)
- Verify tests fail before implementing; commit after each task or logical group
