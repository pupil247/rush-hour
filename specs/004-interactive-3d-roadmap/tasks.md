---
description: "Task list for Interactive 3D Roadmap"
---

# Tasks: Interactive 3D Roadmap

**Input**: Design documents from `/specs/004-interactive-3d-roadmap/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The constitution (Principle IV) makes tests mandatory, so unit and end-to-end
test tasks are part of this list.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1…US4)
- Every task includes an exact file path

## Path Conventions

- Single static project: `src/`, `tests/`, `assets/` at repository root.
- The roadmap canvas lives in `#screen` inside `index.html`; the game's `#scene` canvas path is untouched.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the HTML/CSS surface and the shared e2e helpers all stories rely on.

- [x] T001 Add `<canvas id="roadmap-scene"></canvas>` plus an overlay container (caption, "Jouer", ▲/▼) inside the `#screen` section of `index.html`, without touching `#game`/`#scene`.
- [x] T002 [P] Add `.roadmap-*` styles to the `<style>` block in `index.html`: canvas full-size, caption pill, "Jouer" button, on-screen ▲/▼ buttons, and a hidden-state utility.
- [x] T003 [P] Create `tests/e2e/helpers.js` exporting `openFirstLevel(page)` (roadmap → press Enter after the roadmap handle is ready) and `openChallenge(page, index)` (uses the roadmap test handle `startLevel(index)`), for reuse across specs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure track layout, path sampling, and red-yaw rule every story builds on. No user story starts before this phase.

**⚠️ CRITICAL**: Complete this phase before any user story.

- [x] T004 [P] Write unit tests in `tests/unit/roadmap-layout.test.js` per `contracts/track-layout.md` — they MUST fail before T005: (a) serpentine bounds & 1 node per level, (b) every node centre appears exactly once in the path, (c) `samplePath` is arc-length monotonic and returns the exact node centre at node parameters, (d) `redYaw(base, isRed) = base + π` when red, unchanged otherwise.
- [x] T005 Implement `src/render/roadmap-layout.js`: pure `buildTrack(levels)` (rows of `cols = 5`, 180° sampled arcs, `segments` tagged by difficulty, `bounds`) and `samplePath(points, t)` (position + xz tangent) and `redYaw(base, isRed)` — no DOM, no `three`.

**Checkpoint**: Pure layout math is green in Node; red-yaw rule ready for US1.

---

## Phase 3: User Story 1 - The Red Car Always Faces Forward (Priority: P1)

**Goal**: The red car's front points towards the exit side in every challenge; other vehicles are untouched.

**Independent Test**: Open levels and confirm the red car faces the exit while every other vehicle's orientation is unchanged.

- [x] T006 [P] [US1] E2E test in `tests/e2e/red-car.spec.js` (uses `tests/e2e/helpers.js`): for levels 1 and 2 the red car's rendered yaw points towards the exit side, and non-red vehicles keep their pre-fix orientation.
- [x] T007 [US1] Apply the red-yaw rule in `src/render/models.js`: in `fromTemplate`, add π to `rotationY` when `vehicle.isRed` is true (fallback boxes have no front and are unchanged per FR-002).

**Checkpoint**: V1 of the quickstart is satisfied.

---

## Phase 4: User Story 2 - The Car Drives the 3D Roadmap (Priority: P1) 🎯 MVP

**Goal**: A 3D serpentine roadmap renders with 10 nodes, the small red car rests on the current node, and it drives node-to-node along the road (turning around when reversing) always ending at rest on a node.

**Independent Test**: See the 3D roadmap with the car on node 1; move to node 2 and back — the car follows the road and always stops on a node.

### Tests for User Story 2 (write first, must fail before T009–T013)

- [x] T008 [P] [US2] E2E test in `tests/e2e/roadmap.spec.js` (part 1): the roadmap renders, `__rushHourRoadmap.nodeCount === 10`, car rests on node 0, `hasRing()` true.
- [x] T014 [P] [US2] E2E test in `tests/e2e/roadmap.spec.js` (part 2): ArrowUp then ArrowDown move the car one node per press (`carIndex` updates), it never reports a position between nodes (`isTraveling` only mid-flight), and it turns around when reversing.

### Implementation for User Story 2

- [x] T009 [US2] Implement `src/render/roadmap-scene.js` (visuals): dark ground, difficulty-coloured ribbon from `path`/`segments`, cylinder/torus nodes placed at each node position, `setStates` for `locked`/`solved`/`unlocked`/`current`, fixed overview camera framing `bounds` — per `contracts/roadmap-scene.md`.
- [x] T010 [US2] Add the roadmap car: a small red clone of `assets/models/car.glb` (reuse the template loader path in `src/render/models.js`) placed on the current node, cast/receive shadows.
- [x] T011 [US2] Implement `travel(fromIndex, toIndex, durationMs)` in `src/render/roadmap-scene.js`: animate along `samplePath` (~900 ms ease-in-out), yaw = path tangent, and a shortest-arc π spin when the direction reverses (research R3).
- [x] T012 [US2] Add the pulsing emissive ring on the current node and `pulse(dt)` (~1.5 Hz sinus) driving its scale/emissive in `src/render/roadmap-scene.js` (research R6).
- [x] T013 [US2] Implement the render lifecycle in `src/render/roadmap-scene.js`: lazy `createRoadmapScene(canvas, …)`, `start()`/`stop()` loop, idempotent `dispose()` that forces context loss (research R4).

**Checkpoint**: The 3D roadmap renders and the car drives it — this is the MVP.

---

## Phase 5: User Story 3 - Navigate and Pick a Level (Priority: P2)

**Goal**: Arrows (and on-screen ▲/▼ and taps on touch) move the car, the current node is always highlighted, and Enter/Space/"Jouer" (or click-on-resting-node) start the level.

**Independent Test**: Browse with arrows and a node click, confirm the highlight follows the car and the boundary blocks, then start the level with Enter.

### Tests for User Story 3 (write first, must fail before T016–T019)

- [x] T015 [P] [US3] E2E test in `tests/e2e/roadmap.spec.js` (part 3): Enter starts the current level; pressing an arrow at the unlocked boundary gives blocked feedback and does not move the car; locked nodes are dimmed (`nodeStates`) and unreachable.

### Implementation for User Story 3

- [x] T016 [US3] Implement `src/input/roadmap-control.js` per `contracts/roadmap-input.md`: ArrowUp/ArrowDown within `[0, unlockBoundary]` (blocked cue at the ends), Enter/Space start, input ignored (one queued press max) while traveling, and no page scrolling.
- [x] T017 [US3] Node picking: use `pickNode(clientX, clientY)` from `src/render/roadmap-scene.js`; click/tap a node drives to it (≤ `unlockBoundary`), and clicking the resting node starts the level.
- [x] T018 [US3] Rewrite `src/ui/roadmap.js` as the roadmap shell: hosts the canvas, shows the region+level caption (French strings), hint text, "Jouer" button, and on-screen ▲/▼ buttons when `matchMedia('(pointer: coarse)')` matches.
- [x] T019 [US3] Wire the lifecycle in `src/main.js`: `showRoadmap` lazily creates the scene, applies states from progress, starts the loop + roadmap keyboard; `startGame` stops the loop and `dispose()`s the roadmap; returning from a level re-shows it fresh (per `contracts/roadmap-input.md`).

**Checkpoint**: Full navigation + start works; US2 and US3 both functional.

---

## Phase 6: User Story 4 - Progress, Persistence, and Polish (Priority: P3)

**Goal**: The roadmap truthfully reflects progress and survives reloads; existing e2e suites still pass after the DOM list is removed.

**Independent Test**: Win a level, return, reload — the car is on the right node each time.

- [x] T020 [P] [US4] E2E test in `tests/e2e/roadmap.spec.js` (part 4): win a level → return → car on the newly unlocked node and the solved node marked; `page.reload()` keeps the position (SC-006).
- [x] T021 [US4] Make nodes reflect progress: derive `nodeStates` from `progress.currentIndex` + `records` on show and on return, in `src/main.js` and via `roadmap-scene.setStates` per `contracts/roadmap-scene.md`.
- [x] T022 [US4] Update existing e2e specs to use `tests/e2e/helpers.js` (`openFirstLevel`) instead of clicking the removed DOM list: `tests/e2e/selection.spec.js`, `keyboard.spec.js`, `solve.spec.js`, `reveal.spec.js`, `audio.spec.js`, `score.spec.js`, `models.spec.js`, and `roadmap.spec.js`'s legacy cases — with zero gameplay-code changes.
- [x] T023 [US4] Run quickstart V1–V8 in `specs/004-interactive-3d-roadmap/quickstart.md` on the local static server and fix any issue found.

**Checkpoint**: Roadmap is truthful, persistent, and no legacy suite regressed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final verification.

- [x] T024 [P] Update `README.md`: describe the 3D roadmap (serpentine, arrows ▲/▼, Enter/"Jouer") and the red-car fix.
- [x] T025 Run the full gate: `node --test` and `npx playwright test` — both MUST pass; record results in `specs/004-interactive-3d-roadmap/quickstart.md`.
- [x] T026 [P] Re-check constitution compliance in `.specify/memory/constitution.md` (no build step; `src/core/` untouched; assets reused as authored) and confirm the Pages workflow still stages `assets/models/`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — memory-independent tasks.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (pure layout is shared).
- **User Stories (Phase 3–6)**:
  - US1 (Phase 3) depends only on the red-yaw rule (part of Foundational) — smallest, independent slice.
  - US2 (Phase 4) is the MVP and depends on Foundational.
  - US3 (Phase 5) depends on US2 (scene + handle).
  - US4 (Phase 6) depends on US2/US3 (progress wiring) and touches legacy specs.
- **Polish (Phase 7)**: depends on all stories.

### User Story Dependencies

- **US1 (P1)**: Foundational only — independently testable (red car faces exit).
- **US2 (P1)**: Foundational only — independently testable (roadmap renders + drives).
- **US3 (P2)**: depends on US2 (scene/pickNode) — independently testable (navigate + start).
- **US4 (P3)**: depends on US2/US3 — independently testable (persistence + no-regression).

### Within Each User Story

- Tests are written first and MUST fail before implementation (T004 before T005; T008/T014 before T009–T013; T015 before T016–T019; T020 before T021–T023).
- Pure math before scene; scene before input; input before lifecycle wiring.

### Parallel Opportunities

- Setup: T002 and T003 together.
- Foundational: T004 alone (it defines the contract T005 implements).
- US2 tests: T008 and T014 together (both in `roadmap.spec.js` — same file, run sequentially despite [P]).
- US4: T020 (e2e) parallel with T022 (legacy spec migration).
- Polish: T024 and T026 in parallel.

---

## Parallel Example: User Story 2

```bash
# Write both US2 test parts first (they should fail):
Task: "E2E render/nodes test in tests/e2e/roadmap.spec.js"
Task: "E2E travel/turn test in tests/e2e/roadmap.spec.js"

# Then implement the scene (tests turn green):
Task: "Implement src/render/roadmap-scene.js (visuals + car + travel + ring + lifecycle)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Setup + Foundational → red-yaw rule + layout math green.
2. Complete US1 → the red car faces forward everywhere.
3. **STOP and VALIDATE**: quickstart V1 + `node --test`.

### Incremental Delivery

1. Setup + Foundational → ready.
2. US1 → red car fixed → ship.
3. US2 → 3D roadmap renders & the car drives the road → **major demo**.
4. US3 → navigation + start → ship.
5. US4 → persistence + updated legacy suites → ship.

---

## Notes

- [P] tasks touch different files and have no dependencies.
- [Story] labels map each task to a user story for traceability.
- Keep `src/render/roadmap-layout.js` free of DOM/Three.js (Principle II/IV).
- The game's `#scene` render path must remain untouched; the roadmap is additive.
- Commit after each task or logical group; stop at each checkpoint to validate independently.