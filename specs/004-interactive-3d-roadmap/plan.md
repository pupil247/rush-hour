# Implementation Plan: Interactive 3D Roadmap

**Branch**: `004-interactive-3d-roadmap` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-interactive-3d-roadmap/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Two deliverables. (1) **Red-car orientation fix**: the red car model renders backward in every
challenge; it must face its winning slide direction (towards the exit). Since the red car is always
on the exit row and horizontal, this is a 180° yaw flip applied only to `isRed` vehicles — no
per-level logic. (2) **Interactive 3D roadmap**: replace the flat DOM list with a 3D scene showing a
single continuous serpentine track of one node per level, straight runs with curved turns and the
five difficulty regions colour-coded with labels. A small red `car.glb` rests on the current node,
drives along the track to the next/previous node (turning around when reversing), and always comes to
rest on a node. Travel is bounded to unlocked levels; up/down arrows (and on-screen ▲/▼ on touch)
navigate, Enter/Space or a "Jouer" button starts the highlighted level, and the current node glows
with a pulsing ring.

## Technical Context

**Language/Version**: JavaScript (ES2022+), native browser ES modules; Node.js 20+ for tests.

**Primary Dependencies**: Three.js `0.169.0` (ESM via the existing import map) and the existing
`GLTFLoader` addon to reuse `assets/models/car.glb` for the roadmap car. No new dependency.

**Storage**: Unchanged (`localStorage` progress → `progress.currentIndex`); the roadmap is derived
from it, nothing new is persisted.

**Testing**: `node --test` for the pure track-layout and path-sampling math and for the red-car
rotation rule; Playwright for roadmap rendering, arrow navigation, highlight, start, persistence, and
the red-car orientation, plus all existing suites (existing "open first level" flows must be updated
to the new roadmap interaction).

**Target Platform**: Modern evergreen browsers with WebGL, desktop and touch; static hosting
(incl. the GitHub Pages subpath). Reuses `car.glb` via module-relative URLs.

**Project Type**: Single static web application (existing).

**Performance Goals**: Roadmap renders and car travels at the existing 60/30 fps target; travel
animation ~0.9 s; no additional asset weight (reuses `car.glb`).

**Constraints**: No build step; `src/core/` stays free of DOM/Three.js; pure layout/path math is
unit-testable in Node; the roadmap is presentation-only (challenges, rules, solver untouched); touch
navigable without a keyboard.

**Scale/Scope**: 1 small render change (red-car yaw), 1 new render module + 1 new pure layout module
for the roadmap, a new canvas element, input wiring, and test updates.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Rules Are the Single Source of Truth (NON-NEGOTIABLE) | Presentation only; `RULES.md`/`rules.js` untouched | PASS — no rule change; red-car face is a visual fix |
| II. Pure, Headless Game Core | Track layout / path sampling / red-yaw rule are pure functions; roadmap render is a separate layer | PASS — `src/core/` untouched; new pure module unit-tested |
| III. No Build Step (NON-NEGOTIABLE) | Static files; reuses the pinned import map + bundled `car.glb`; no new deps | PASS — no build artifact, no conversion step |
| IV. Test-First, Test-Ready | `node --test` for layout/path/red-yaw; Playwright for the roadmap + updated open-level flows | PASS — test updates are part of the plan (existing e2e "open first level" helpers adapt to the roadmap) |
| V. Data-Driven, Verified Challenges | Challenges, schema, solver untouched | PASS — roadmap is derived from existing order |

**Result**: No violations. Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: All gates still **PASS**. The roadmap is a second render
layer over the same static stack; the pure modules keep it head-less-testable; the only asset touched
is `car.glb` reused at a smaller scale (allowed by constitution v1.1.0).

## Project Structure

### Documentation (this feature)

```text
specs/004-interactive-3d-roadmap/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── track-layout.md
│   ├── roadmap-scene.md
│   └── roadmap-input.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html                 # ADD: <canvas id="roadmap-scene"> inside #screen + overlay affordances

src/
├── core/                  # unchanged
├── render/
│   ├── roadmap-layout.js  # NEW (pure): serpentine track builder + path sampling, unit-tested
│   ├── roadmap-scene.js   # NEW (Three.js): ground/road, nodes, lines, car, ring, camera, picking
│   ├── vehicles.js        # EDIT: apply the red-car 180° yaw (isRed only)
│   └── models.js          # EDIT: expose car-template reuse for the roadmap car (fit at scale)
├── input/
│   └── roadmap-control.js # NEW: arrows, Enter/Space, ▲/▼ buttons, node clicks, travel queue
├── ui/
│   └── roadmap.js         # REWRITE: shows the 3D canvas + region caption + "Jouer" affordance
└── main.js                # WIRE: roadmap screen lifecycle (show/hide canvas, render loop, start)

tests/
├── unit/
│   ├── roadmap-layout.test.js  # NEW: serpentine + path sample + arc-length/tangent
│   └── red-orientation.test.js # NEW: red-car 180° yaw rule (pure part)
├── e2e/
│   ├── roadmap.spec.js    # REWRITE: nodes, current index, locked dim, arrows, highlight, start
│   └── (existing specs)   # EDIT: shared "open first level" helper → roadmapEnter (real user path)
```

**Structure Decision**: Single static project. Layout math is pure and goes in
`src/render/roadmap-layout.js` so it is Node-testable (Principle IV); the Three.js scene lives in
`roadmap-scene.js`; the roadmap canvas lives in `#screen` next to the (unused) DOM list so the game's
`#scene` canvas path is untouched. The red-car fix is a one-line rule in `vehicles.js/models.js`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; no complexity to justify.