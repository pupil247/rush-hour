---
description: "Task list for the Rush Hour Web Game feature"
---

# Tasks: Rush Hour Web Game

**Input**: Design documents from `/specs/001-rush-hour-web-game/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED and required. Constitution Principle IV (Test-First, Test-Ready) mandates a
`node --test` core suite plus Playwright browser tests, so test tasks are not optional here.

**Organization**: Tasks are grouped by user story so each story is independently implementable and
testable, in priority order (P1 → P5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Every task includes an exact file path

## Path Conventions

- Single static project: `src/`, `tools/`, `tests/` at repository root (see plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository skeleton and dev tooling. No build step exists (Principle III).

- [X] T001 Create the repository directory structure per plan.md (`index.html`; `src/core`, `src/data`, `src/render`, `src/input`, `src/ui`; `tools`; `tests/unit`, `tests/e2e`, `tests/fixtures`)
- [X] T002 [P] Write the verbatim French game rules to `RULES.md` at the repository root (read-only reference; never paraphrased) per Principle I
- [X] T003 [P] Create `index.html` with a `<script type="importmap">` pinning the Three.js version and a module entry `src/main.js`
- [X] T004 [P] Create a dev-only `package.json` (no build scripts) and `playwright.config.js` with a static `webServer` and `tests/e2e` test directory
- [X] T005 [P] Copy `specs/001-rush-hour-web-game/contracts/challenges.schema.json` to `challenges.schema.json` and add a `.gitignore`
- [X] T006 [P] Create the French UI strings module `src/ui/strings.fr.js` with all user-facing labels
- [X] T007 [P] Create test fixtures `tests/fixtures/puzzles.js` with small, known-solvable puzzles for unit tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure game core and the verified content pipeline. No user story can be implemented
until this phase is complete.

**⚠️ CRITICAL**: All of the pure core (`RULES`, board, moves, game, schema, solver) and the challenge
catalog are prerequisites for every user story.

### Tests first (must fail before implementation)

- [X] T008 [P] Write failing unit tests for the board and move legality in `tests/unit/board.test.js` and `tests/unit/moves.test.js` (in-bounds, occupancy, axis-only, blocked slides, multi-cell slide = one move)
- [X] T009 [P] Write failing unit tests for the attempt state machine in `tests/unit/game.test.js` (apply/undo/redo/reset, move count, win only on full exit)
- [X] T010 [P] Write failing unit tests for validation and solving in `tests/unit/schema.test.js` and `tests/unit/solver.test.js` (overlap, one red car, blocked start, optimal counts, difficulty distribution 2/3/2/1/2)
- [X] T011 [P] Write the failing rules guard test in `tests/unit/rules-guard.test.js` asserting `RULES` matches the verbatim `RULES.md`

### Implementation

- [X] T012 Implement the frozen `RULES` constants object in `src/core/rules.js` (`boardSize 6`, `exitRow 3`, `carLength 2`, `truckLength 3`, `redVehicleCount 1`, `moveCost 1`) and the `rulesMatchReference` helper
- [X] T013 [P] Implement board helpers in `src/core/board.js` (`inBounds`, `cellsOf`, `isCellFree`, `exitCell`)
- [X] T014 [P] Implement move legality in `src/core/moves.js` (`legalDeltas`, `canSlide`, `applyMove`) with no mutation of inputs
- [X] T015 Implement the attempt state machine in `src/core/game.js` (`createAttempt`, `move`, `undo`, `redo`, `reset`, `isWon`) per data-model.md transitions (depends on T012–T014)
- [X] T016 [P] Implement the challenge validator in `src/core/schema.js` (`validateCatalog`) enforcing vehicles, overlap, one red car, blocked start, solution legality, `optimalMoveCount === solution.length`, and the exact difficulty distribution
- [X] T017 [P] Implement the BFS optimal solver in `src/core/solver.js` (`solve`) where any-distance slide costs exactly one move
- [X] T018 Implement the offline solver tool `tools/bake-solutions.mjs` that reuses `src/core/solver.js` and writes solutions plus `optimalMoveCount` into `challenges.json` (depends on T017)
- [X] T019 Author 10 curated challenge layouts and generate `challenges.json` with T018: Débutant 2, Intermédiaire 3, Avancé 2, Expert 1, Génie 2 (depends on T018, T016)
- [X] T020 Implement the catalog loader in `src/data/challenges.js` (`loadCatalog`) that fetches `challenges.json`, validates it, and rejects invalid catalogs (depends on T016)

**Checkpoint**: `node --test` covers the pure core; `challenges.json` holds 10 solver-verified challenges.

---

## Phase 3: User Story 1 - Solve a Challenge (Priority: P1) 🎯 MVP

**Goal**: Load one challenge, render it in 3D, let the player slide vehicles along their files, and
declare victory only when the red car has fully exited.

**Independent Test**: Load a single known challenge, make a series of legal moves, and confirm the win
fires exactly when the red car is entirely past the exit — and not before.

### Tests for User Story 1

- [X] T021 [P] [US1] Write the failing E2E test `tests/e2e/solve.spec.js` (page loads a challenge in 3D, a drag slides a car, a blocked drag changes nothing, full exit wins)

### Implementation for User Story 1

- [X] T022 [P] [US1] Implement the Three.js scene bootstrap in `src/render/scene.js` (renderer, lights, shadows, render loop)
- [X] T023 [P] [US1] Implement the procedural board and exit in `src/render/board3d.js`
- [X] T024 [P] [US1] Implement procedural car and truck meshes in `src/render/vehicles.js`, with the red car visually distinct (FR-028)
- [X] T025 [US1] Implement the top-down tilted camera and framing in `src/render/camera.js` (depends on T022)
- [X] T026 [US1] Implement the slide animation in `src/render/animation.js` (depends on T024)
- [X] T027 [US1] Implement pointer drag constrained to a vehicle's axis in `src/input/pointer.js` using a raycaster and `core/moves.js` legal ranges (depends on T022)
- [X] T028 [P] [US1] Implement keyboard select plus arrow-key sliding in `src/input/keyboard.js`
- [X] T029 [US1] Implement the app bootstrap in `src/main.js`: load the first challenge via `loadCatalog`, build the scene, wire input → `core/game.js` → render, and raise a minimal win signal on full exit (depends on T020, T022–T028)

**Checkpoint**: User Story 1 is fully playable and independently testable (MVP).

---

## Phase 4: User Story 2 - Progress Along the Challenge Roadmap (Priority: P2)

**Goal**: A linear roadmap with an advancing car token; exactly one challenge unlocked at the start,
the next unlocked on each solve, and locked challenges unselectable.

**Independent Test**: From a fresh game, confirm one unlocked challenge; solve it; confirm the token
advances, the next unlocks, later stops stay locked, and solving returns the player to the roadmap.

### Tests for User Story 2

- [X] T030 [P] [US2] Write failing unit tests for roadmap building in `tests/unit/roadmap.test.js` (order, five regions, single unlocked at start, exactly-one unlock per solve, no regression on replay)
- [X] T031 [P] [US2] Write the failing E2E test `tests/e2e/roadmap.spec.js` (one unlocked at start, solve advances, locked stop blocked, return to roadmap after win)

### Implementation for User Story 2

- [X] T032 [US2] Implement `buildRoadmap` in `src/data/challenges.js` returning the ordered path, difficulty regions, and per-stop unlock state (depends on T020)
- [X] T033 [US2] Implement the roadmap screen in `src/ui/roadmap.js` (five regions, car token, locked vs. unlocked vs. solved stops)
- [X] T034 [US2] Implement progress read/write in `src/progress.js` for `currentIndex` and per-challenge `solved`, defensively per `contracts/progress-storage.md`
- [X] T035 [US2] Integrate progression in `src/main.js`: open on the roadmap, unlock exactly the next stop on a solve, never move backwards, and return to the roadmap after victory

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Recover, Undo, and Reveal the Solution (Priority: P3)

**Goal**: Unlimited undo/redo, reset to the initial layout, and reveal-by-animation that plays the
optimal solution then restores the player's exact board.

**Independent Test**: From mid-game, undo to the start, redo forward, reset, and reveal; confirm the
counts track and the board is restored exactly after the reveal animation.

### Tests for User Story 3

- [X] T036 [P] [US3] Extend `tests/unit/game.test.js` with failing tests for undo/redo limits, reset semantics, and the reveal flag/restore behavior
- [X] T037 [P] [US3] Write the failing E2E test `tests/e2e/reveal.spec.js` (reset restores the layout; reveal plays and restores; a revealed win does not count)

### Implementation for User Story 3

- [X] T038 [US3] Implement `reveal` in `src/core/game.js` (set `revealed`, restore board after playback) per FR-019a/019b
- [X] T039 [US3] Implement HUD controls undo/redo/reset/reveal in `src/ui/hud.js` (disable when unavailable)
- [X] T040 [US3] Implement solution playback plus board restore in `src/render/animation.js` (reset to start, animate the sequence, restore prior state)
- [X] T041 [US3] Wire undo/redo/reset/reveal actions and keyboard shortcuts in `src/main.js` and `src/input/keyboard.js`

**Checkpoint**: User Stories 1–3 work independently.

---

## Phase 6: User Story 4 - Track Best Performance and Time (Priority: P4)

**Goal**: Show the live move count and elapsed time, compare the player's result with the optimal on
victory, and remember the best count per challenge across sessions.

**Independent Test**: Win in more than the optimal number of moves, see the comparison, reload, and
confirm the best count persists and is never worsened.

### Tests for User Story 4

- [X] T042 [P] [US4] Write failing unit tests for best-score rules in `tests/unit/progress.test.js` (best only lowers; revealed win changes nothing; corrupt storage degrades to a fresh game)
- [X] T043 [P] [US4] Write the failing E2E test `tests/e2e/score.spec.js` (live counter/time, victory comparison, persistence after reload)

### Implementation for User Story 4

- [X] T044 [US4] Extend `src/progress.js` with `bestMoveCount`, `lastMoveCount`, and `solved` rules per `contracts/progress-storage.md`
- [X] T045 [US4] Implement the live move counter and visibility-aware timer in `src/ui/hud.js` (pauses when the page is hidden)
- [X] T046 [US4] Implement the victory celebration and moves-vs-optimal comparison in `src/ui/dialogs.js`
- [X] T047 [US4] Integrate win → record → celebration → return to roadmap in `src/main.js`

**Checkpoint**: User Stories 1–4 work independently.

---

## Phase 7: User Story 5 - Audio and Visual Feedback (Priority: P5)

**Goal**: Distinct audio cues for a successful move, a blocked move, and victory, with mute; illegal
attempts are visually refused.

**Independent Test**: With sound on, perform a move, a blocked move, and a win; confirm each cue
plays; mute and confirm silence.

### Tests for User Story 5

- [X] T048 [P] [US5] Write the failing E2E test `tests/e2e/audio.spec.js` (move/blocked/victory cues fired; mute silences them)

### Implementation for User Story 5

- [X] T049 [US5] Implement Web Audio cues for move, blocked, and victory with a persisted mute flag in `src/audio.js` (start only after first user gesture)
- [X] T050 [US5] Wire cues and the blocked-move visual refusal into `src/main.js` and `src/render/animation.js`
- [X] T051 [P] [US5] Add the mute toggle to the HUD in `src/ui/hud.js`

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening and verification across stories.

- [X] T052 [P] Add the pure-core architecture guard test in `tests/unit/purity.test.js` asserting `src/core/*` imports neither the DOM nor Three.js (Principle II)
- [X] T053 [P] Add loading and recoverable error states for catalog fetch in `src/ui/dialogs.js` and `src/main.js`
- [X] T054 [P] Verify mouse and touch operability across `src/ui/roadmap.js`, `src/ui/hud.js`, `src/ui/dialogs.js`, and `src/input/pointer.js` (FR-032)
- [X] T055 [P] Performance pass: playable within 3 s, moves reflected within 100 ms, 60/30 fps in `src/render/scene.js`
- [X] T056 [P] Add `README.md` with run and test instructions (no build; static server)
- [X] T057 Remove the temporary Sync Impact Report comment from `.specify/memory/constitution.md` before committing
- [X] T058 Run the `quickstart.md` V1–V11 validation and confirm `node --test` and `npx playwright test` are green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3+)**: Each depends only on Foundational; then in priority order P1 → P5
- **Polish (Phase 8)**: Depends on the desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Needs only Foundational — MVP, no other story dependency
- **US2 (P2)**: Needs Foundational; builds on US1's rendering but is independently testable
- **US3 (P3)**: Needs Foundational and US1's board/input; independently testable
- **US4 (P4)**: Needs Foundational and US2's progress storage; independently testable
- **US5 (P5)**: Needs Foundational and US1's render loop; independently testable

### Within Each Story

- Tests are written first and MUST fail before implementation
- Core/logic before integration; render pieces before the `main.js` wiring task
- Finish a story at its checkpoint before starting the next priority

### Parallel Opportunities

- Setup: T002–T007 run in parallel
- Foundational tests: T008–T011 run in parallel
- Foundational implementation: T013, T014, T016, T017 run in parallel
- Foundational content: T018 → T019 are sequential (T019 depends on T018)
- US1: T022, T023, T024, T028 run in parallel; then T025–T027, T029
- US2: T030 and T031 in parallel; T032–T034 can proceed together
- US3: T036 and T037 in parallel
- US4: T042 and T043 in parallel
- Polish: T052–T056 run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch the US1 render building blocks together (different files):
Task: "Implement the Three.js scene bootstrap in src/render/scene.js"
Task: "Implement the procedural board and exit in src/render/board3d.js"
Task: "Implement procedural car and truck meshes in src/render/vehicles.js"
Task: "Implement keyboard select plus arrow-key sliding in src/input/keyboard.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `tests/e2e/solve.spec.js` and the core suite
5. This is a playable single-challenge MVP

### Incremental Delivery

1. Setup + Foundational → core and content ready
2. US1 → playable puzzle (MVP)
3. US2 → roadmap progression
4. US3 → undo/redo/reset/reveal
5. US4 → scoring, timer, persistence
6. US5 → audio and feedback
7. Polish → harden and validate end to end

---

## Notes

- [P] = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- No task may introduce a build step or a runtime dependency beyond the pinned Three.js CDN (Principle III)
- `src/core/*` must never import the DOM or Three.js (Principle II)
- `tools/` is offline-only and must never be loaded by the shipped app (Principle V)
- Verify tests fail before implementing; commit after each task or logical group
