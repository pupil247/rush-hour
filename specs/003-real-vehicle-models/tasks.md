---
description: "Task list for Realistic Vehicle Models"
---

# Tasks: Realistic Vehicle Models

**Input**: Design documents from `/specs/003-real-vehicle-models/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The project constitution (Principle IV) makes tests mandatory, so unit and
end-to-end test tasks are part of this list.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested
independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes an exact file path

## Path Conventions

- Single static project: `src/`, `tests/`, and `assets/` at repository root.
- All runtime asset URLs are module-relative (resolved via `import.meta.url`); all model files live
  under `assets/models/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the import map, the asset folder, and the hermetic test fixtures.

- [ ] T001 Add the `three/addons/` entry to the import map in `index.html`, pinned to the same version as `three` (`"three/addons/": "https://unpkg.com/three@0.169.0/examples/jsm/"`).
- [ ] T002 [P] Create `assets/models/` and write `assets/models/ATTRIBUTION.md` with the fields required by `contracts/model-asset.md` (source, author, license, retrieval date) left ready to fill when the files land.
- [ ] T003 [P] Vendor pinned hermetic copies of `GLTFLoader.js` and `BufferGeometryUtils.js` into `tests/fixtures/` (downloaded from `three@0.169.0/examples/jsm/`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing every user story depends on. No story work starts until this phase completes.

**⚠️ CRITICAL**: Complete this phase before any user story.

- [ ] T004 Refactor `src/render/vehicles.js` to export the existing procedural builder and palette as `createFallbackVehicle(vehicle)` and `colorFor(vehicle)` with no behavior change, so the new model module can reuse them.
- [ ] T005 Update `tests/e2e/three-fixture.js` to route the addon CDN URLs (`.../GLTFLoader.js` and `.../utils/BufferGeometryUtils.js`) to the vendored fixtures from T003, alongside the existing `three` route.

**Checkpoint**: Import map, asset folder, shared vehicle helpers, and hermetic fixtures are ready.

---

## Phase 3: User Story 1 - Vehicles Look Like Real Cars and Trucks (Priority: P1) 🎯 MVP

**Goal**: 2-cell vehicles render as recognizable car models and 3-cell vehicles as recognizable truck
models, with gameplay unchanged.

**Independent Test**: Open any challenge and confirm cars and trucks are model meshes (not the
procedural box) and that moves, counting, undo/redo, and win detection still behave as before.

### Tests for User Story 1 (write first, must fail before T009–T014)

- [ ] T006 [P] [US1] Unit test the pure `fitVehicleModel(size, kind, orientation)` in `tests/unit/models.test.js`: uniform scale makes the fitted length equal `lengthForKind(kind) * 0.88`, width ≤ 1 cell, `rotationY` aligns the axis, and the model is grounded (`offset.y`) — per `data-model.md` rules.
- [ ] T007 [P] [US1] E2E test in `tests/e2e/models.spec.js` that opening `Premier virage` renders model vehicles (not the fallback) and raises no `pageerror`.

### Implementation for User Story 1

- [ ] T008 [US1] Add the two assets: commit `assets/models/car.glb` (2-cell car) and `assets/models/truck.glb` (3-cell truck) sourced per `contracts/model-asset.md` (CC0, uncompressed glTF, self-contained, ≤ ~250 KB each), and fill in `assets/models/ATTRIBUTION.md`.
- [ ] T009 [US1] Implement the pure `fitVehicleModel(size, kind, orientation)` in `src/render/models.js` per research D5.
- [ ] T010 [US1] Implement `loadVehicleTemplates(baseUrl)` in `src/render/models.js`: load both `.glb` files in parallel with `GLTFLoader`, compute each bounding-box size, cache, and resolve a slot to `null` on failure (never throw) per research D1/D2/D7.
- [ ] T011 [US1] Implement `createVehicleObject(vehicle, catalog, { colorFor, createFallback })` in `src/render/models.js`: clone the template, apply the `FitTransform`, enable shadows, and tag `userData.vehicleId` / `userData.isRed`; return the fallback when the template is `null` — per `contracts/vehicle-rendering.md`.
- [ ] T012 [US1] Update `src/render/vehicles.js`: `syncVehicles(group, vehicles, catalog)` builds every vehicle via `createVehicleObject`, and `applySelection` traverses the object to work with either a model group or a fallback mesh.
- [ ] T013 [US1] Wire the catalog in `src/main.js`: call `loadVehicleTemplates()` in `initThree`, store it on `state`, and pass it to `syncVehicles` on every board sync.
- [ ] T014 [US1] Update `src/input/pointer.js`: raycast recursively (`intersectObjects(group.children, true)`) and resolve the hit to the ancestor carrying `userData.vehicleId`, then drag/animate that vehicle root per research D8.
- [ ] T015 [US1] Run quickstart V1–V2 in `specs/003-real-vehicle-models/quickstart.md` and fix any issues until models render correctly on the board.

**Checkpoint**: Models render and the game plays exactly as before — this is the MVP.

---

## Phase 4: User Story 2 - Vehicles Stay Instantly Distinguishable (Priority: P2)

**Goal**: Distinct per-vehicle colors, exactly one red car, body-only tinting, and correct
orientation/footprint so the board stays easy to read.

**Independent Test**: On a board with several cars and trucks, confirm cars and trucks differ by
silhouette, each vehicle's color is distinct, exactly one vehicle is red, wheels/glass are not tinted,
and highlights remain legible over the models.

- [ ] T016 [P] [US2] E2E test in `tests/e2e/models.spec.js`: body colors are distinct across vehicles, exactly one vehicle is red, and non-body materials keep their original color.
- [ ] T017 [P] [US2] Unit test the body-material selection/tinting helper in `tests/unit/models.test.js`: name match on `body|paint|car|truck` wins, otherwise the largest mesh by bounding-box volume is chosen.
- [ ] T018 [US2] Implement per-instance material cloning and body tinting in `src/render/models.js`: clone materials, tint only the body material(s) to `colorFor(vehicle)`, preserve `glass`/`wheel`/`tire`/`chrome` per `contracts/model-asset.md` and research D4.
- [ ] T019 [US2] Ensure the reserved red (`0xd21f2a`) plus red emissive is used for `isRed` vehicles and that exactly one red vehicle exists, reused from `colorFor` in `src/render/vehicles.js`.
- [ ] T020 [US2] Verify and adjust fit so a car is visibly shorter than a truck (2 vs 3 cells) and `rotationY` matches the `H`/`V` axis, in `src/render/models.js`.
- [ ] T021 [US2] Confirm `applySelection` emissive is applied to the tinted body material(s) (not a single `.material`) in `src/render/vehicles.js`, keeping the selected/browsing highlight legible.
- [ ] T022 [US2] Run quickstart V2–V4 in `specs/003-real-vehicle-models/quickstart.md` and fix any issues.

**Checkpoint**: The board is readable at a glance; US1 and US2 both work.

---

## Phase 5: User Story 3 - Change Is Safe for Static Hosting and Performance (Priority: P3)

**Goal**: No build step, subpath-safe asset URLs, a playable fallback when a model is missing, and
smooth play.

**Independent Test**: Serve the game statically (including a subpath base), confirm models load; then
fail a model request and confirm the game stays fully playable via the fallback with no error.

- [ ] T023 [P] [US3] E2E fallback test in `tests/e2e/models.spec.js`: abort the `car.glb` request, assert a fallback vehicle renders and the player can still select, drag, and move (win path intact), with no unhandled error.
- [ ] T024 [P] [US3] E2E asset-URL test in `tests/e2e/models.spec.js`: assert the model requests are module-relative (no leading slash) and succeed, proving subpath portability.
- [ ] T025 [US3] Guarantee failure isolation in `src/render/models.js`: a load/parse failure or empty model yields the fallback and logs at most a console warning, never an unhandled rejection.
- [ ] T026 [US3] Ensure all model URLs are resolved via `import.meta.url` (research D9) in `src/render/models.js`.
- [ ] T027 [US3] Tune performance: keep each `.glb` ≤ ~250 KB and low-poly, and ensure per-vehicle cloning shares geometry where possible; verify no perceptible stutter in `src/render/models.js`.
- [ ] T028 [US3] Run quickstart V6–V8 in `specs/003-real-vehicle-models/quickstart.md` and fix any issues.

**Checkpoint**: All three stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final verification across all stories.

- [ ] T029 [P] Update `README.md` with a short "Véhicules 3D" note and the model attribution pointer to `assets/models/ATTRIBUTION.md`.
- [ ] T030 Run the full gate: `node --test` and `npx playwright test`; both MUST pass with no regressions in rules, moves, scoring, or challenge tests; record results in `specs/003-real-vehicle-models/quickstart.md`.
- [ ] T031 Verify the no-build, source-identical deployment: serve `index.html` with `python3 -m http.server 8080`, confirm play, and confirm no `dist/` or build artifact exists.
- [ ] T032 [P] Re-check constitution compliance in `.specify/memory/constitution.md` (Principle III: assets shipped as authored; Principle II: `src/core/` untouched) and adjust documentation if anything drifted.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational.
  - US1 is the MVP and should be completed first.
  - US2 and US3 build on US1's module but are independently testable.
- **Polish (Phase 6)**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. Delivers the MVP.
- **US2 (P2)**: Depends on US1 (uses `createVehicleObject`); independently testable via color/red-uniqueness assertions.
- **US3 (P3)**: Depends on US1 (uses `loadVehicleTemplates`); independently testable via the fallback and URL assertions.

### Within Each User Story

- Tests are written first and MUST fail before implementation (T006/T007 before T009–T014; T016/T017 before T018–T021; T023/T024 before T025–T027).
- Loader/fit before builder; builder before wiring; wiring before picking.
- Complete a story and validate it before moving to the next priority.

### Parallel Opportunities

- Setup: T002, T003 in parallel.
- Foundational: T004 and T005 in parallel.
- US1 tests: T006, T007 in parallel.
- US2 tests: T016, T017 in parallel.
- US3 tests: T023, T024 in parallel.
- Polish: T029 and T032 in parallel.

---

## Parallel Example: User Story 1

```bash
# Write both US1 tests first (they should fail):
Task: "Unit test fitVehicleModel in tests/unit/models.test.js"
Task: "E2E test that models render in tests/e2e/models.spec.js"
```

## Parallel Example: User Story 2

```bash
Task: "E2E colors/red-uniqueness test in tests/e2e/models.spec.js"
Task: "Unit test body-material selection in tests/unit/models.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocks everything).
3. Complete Phase 3: User Story 1 (models render).
4. **STOP and VALIDATE**: quickstart V1–V2 + T006/T007.
5. Deploy/demo the MVP.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → cars and trucks render → deploy (MVP).
3. US2 → colors/distinguishability → deploy.
4. US3 → fallback + hosting/perf hardening → deploy.
5. US3 and Polish leave the game fully playable even if assets are missing.

---

## Notes

- [P] tasks touch different files and have no dependencies.
- [Story] labels map each task to a user story for traceability.
- Model assets are committed files; no build step is introduced anywhere.
- Keep `src/core/` free of DOM/Three.js imports (Principle II).
- Commit after each task or logical group; stop at each checkpoint to validate independently.
