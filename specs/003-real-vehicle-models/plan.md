# Implementation Plan: Realistic Vehicle Models

**Branch**: `003-real-vehicle-models` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-real-vehicle-models/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Replace the procedural box vehicles with pre-authored 3D model assets: one **car** model for the
2-cell vehicles and one **truck** model for the 3-cell vehicles. The two models are committed as
uncompressed binary glTF (`.glb`) files under `assets/models/` and loaded at runtime with
`GLTFLoader` (Three.js addon) resolved through the existing import map — no build step. Each vehicle
is a **clone** of its template, uniformly scaled to its grid footprint, oriented along its movement
axis, and recolored per vehicle (the red car stays red). If a model is unavailable or fails to load,
the current procedural box is used as a playable fallback. Game logic, rules, challenges, and input
are untouched; only the render layer and its picking/picking integration change.

## Technical Context

**Language/Version**: JavaScript (ES2022+), native browser ES modules; Node.js 20+ for tests.

**Primary Dependencies**: Three.js `0.169.0` (ESM via the existing import map, pinned to unpkg) plus
its `GLTFLoader` addon. No new npm dependency; the loader is resolved from the same pinned CDN
through a new `three/addons/` import-map entry.

**Storage**: No new storage. Two static model files (`assets/models/car.glb`,
`assets/models/truck.glb`) plus a license/attribution file are committed with the source.

**Testing**: `node --test` for the new pure model-fitting math and existing core; Playwright
end-to-end tests for model loading, per-vehicle color, the fallback path, and no regressions.

**Target Platform**: Modern evergreen browsers with WebGL, desktop and touch; static hosting,
including the existing GitHub Pages project subpath (so all asset URLs MUST be relative/derived).

**Project Type**: Single static web application (existing).

**Performance Goals**: Keep the existing 60 fps desktop / 30 fps mobile target; models must not
block first play; added asset weight budget ≤ ~500 KB across both `.glb` files.

**Constraints**: No build step (Principle III); `.glb` shipped exactly as authored (no conversion or
packing); non-compressed glTF only (no Draco/KTX2 decoder); mandatory playable fallback; exactly one
red car; car/truck silhouettes must match their 2-cell/3-cell footprints; pure core
(`src/core/`) stays free of DOM and Three.js.

**Scale/Scope**: 1 new render module, edits to ~4 existing files (`index.html`, `src/render/vehicles.js`,
`src/main.js`, `src/input/pointer.js`), 2 model assets + attribution, and new unit/e2e tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Rules Are the Single Source of Truth (NON-NEGOTIABLE) | Presentation only; `RULES.md` / `rules.js` unchanged | PASS — no rule touched; vehicles keep exact 2/3-cell footprints |
| II. Pure, Headless Game Core | Model loading lives in the render layer; fitting math is pure and Three-free where testable | PASS — `src/core/` untouched; fit math unit-tested |
| III. No Build Step (NON-NEGOTIABLE) | Addons via import map; `.glb` served as authored; no bundler | PASS — constitution amended to v1.1.0 explicitly allows bundled static model assets with no build |
| IV. Test-First, Test-Ready | `node --test` for fit math; Playwright for load + fallback + regressions | PASS — tests specified in quickstart |
| V. Data-Driven, Verified Challenges | `challenges.json`, schema, solver unchanged | PASS — no challenge data change |

**Result**: No violations. Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: All gates still **PASS**. The only new runtime dependency
is the Three.js addon loaded from the already-pinned CDN through the import map, which preserves
Principle III; the `.glb` files are plain static assets shipped in authored form, as the amended
constitution requires. Fallbacks keep the game playable if an asset is missing.

## Project Structure

### Documentation (this feature)

```text
specs/003-real-vehicle-models/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── model-asset.md
│   └── vehicle-rendering.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html                 # ADD: import-map entry "three/addons/" -> pinned unpkg examples/jsm/

assets/
└── models/
    ├── car.glb            # NEW: 2-cell car model (CC0), uncompressed glTF
    ├── truck.glb          # NEW: 3-cell truck model (CC0), uncompressed glTF
    └── ATTRIBUTION.md     # NEW: source + license of each model

src/
├── core/                  # unchanged (pure rules, board, moves, game, solver, schema)
├── render/
│   ├── models.js          # NEW: load/cache templates, fit+clone+recolor, pure fit math
│   ├── vehicles.js        # EDIT: build vehicles from templates; model-agnostic highlight
│   ├── animation.js       # unchanged (moves any Object3D by position)
│   └── ...                # scene.js, board3d.js, camera.js unchanged
├── input/
│   └── pointer.js         # EDIT: recursive raycast; resolve vehicle id from the model root
└── main.js                # WIRE: preload templates in initThree; fall back on failure

tools/
└── fetch-models.mjs       # OPTIONAL, offline-only: documents/automates obtaining the .glb files

tests/
├── unit/
│   ├── models.test.js     # NEW: pure fit-math (scale/orientation/offset) unit tests
│   └── ... (existing)
└── e2e/
    ├── models.spec.js     # NEW: models load, colors distinct, red car unique, fallback on 404
    └── three-fixture.js   # EDIT: also route the addon CDN URLs for hermetic tests
```

**Structure Decision**: Single static project. Model loading, fitting, and recoloring are a
**render-layer** concern and live in `src/render/models.js` (imports Three.js), while the
geometry-fitting function is written as a pure function of bounding-box dimensions so it can be
unit-tested in Node without a browser. This satisfies Principle II (pure core untouched) and
Principle IV (fast, headless testability) without weakening the no-build constraint.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; no complexity to justify.
