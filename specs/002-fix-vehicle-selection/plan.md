# Implementation Plan: Vehicle Selection & Keyboard Controls

**Branch**: `002-fix-vehicle-selection` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fix-vehicle-selection/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Fix the broken mouse selection (a wrong property lookup makes the pointer handler throw, so no car can
ever be selected or dragged) and add the requested interaction model: one shared selection between
mouse and keyboard, a strong highlight for the selected car and a lighter highlight for the browsing
cursor, and a two-mode keyboard scheme (arrows cycle cars in browsing mode; Space selects/deselects;
arrows move the selected car one cell along its axis). A small pure selection module holds the state
and is unit-tested; the render layer maps the selection to highlights. No new dependencies, no build.

## Technical Context

**Language/Version**: JavaScript (ES2022+), native browser ES modules; Node.js 20+ for tests.

**Primary Dependencies**: Three.js (ESM via the existing import map). None added.

**Storage**: Unchanged (`localStorage` for progress); no new storage.

**Testing**: `node --test` for the new pure selection module and existing core; Playwright for the new
mouse and keyboard interaction end-to-end tests.

**Target Platform**: Modern evergreen browsers, desktop and touch; static hosting.

**Project Type**: Single static web application (existing).

**Performance Goals**: Highlights update within one animation frame; no change to the existing 60/30 fps target.

**Constraints**: No build step; pure core stays free of DOM/Three.js imports; all movement continues to
obey the frozen puzzle rules in `src/core/`.

**Scale/Scope**: Touch points are 5 source files plus 1 new pure module and 2 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Rules Are the Single Source of Truth (NON-NEGOTIABLE) | Movement still routed through `src/core/moves.js`; no rule changes | PASS — no rule logic touched; `RULES` unchanged |
| II. Pure, Headless Game Core | New selection logic is pure and DOM-free; render maps it | PASS — `src/input/selection.js` is a pure reducer, unit-tested |
| III. No Build Step (NON-NEGOTIABLE) | Native ESM only; no new dependencies | PASS — no bundler, no runtime dep |
| IV. Test-First, Test-Ready | `node --test` for selection + Playwright for interaction | PASS — test tasks included in quickstart |
| V. Data-Driven, Verified Challenges | No challenge changes | PASS — `challenges.json` untouched |

**Result**: No violations. Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: All gates still **PASS**. The new module is pure and
unit-tested; the fix reuses the existing core legality functions; no build artifact or dependency was
introduced. `quickstart.md` V1–V7 verify the fix, the two-mode keyboard, the highlights, and no
regressions.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-vehicle-selection/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── selection.md
│   └── interaction.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── core/                    # unchanged (pure rules, board, moves, game, solver, schema)
├── input/
│   ├── selection.js         # NEW: pure selection reducer (highlighted / selected), unit-tested
│   ├── pointer.js           # FIX: read the vehicle group via state.three; select on pointerdown
│   └── keyboard.js          # REWRITE: two-mode arrows/Space model
├── render/
│   └── vehicles.js          # ADD: applySelection(meshes, selection) with two highlight levels
├── main.js                  # WIRE: own the selection state; ignore input while busy; keep selection on move
└── ...                      # ui/, data/, audio.js unchanged

tests/
├── unit/
│   ├── selection.test.js    # NEW: reducer ordering, toggle, clear, keep-after-move
│   └── ... (existing)
└── e2e/
    ├── selection.spec.js    # NEW: mouse select/drag, empty-click deselect, illegal drag refused
    ├── keyboard.spec.js     # NEW: browse/select/move/deselect via keys, perpendicular ignored
    └── ... (existing)
```

**Structure Decision**: Single static project. The selection reducer is placed in `src/input/`
(interaction concern, not game rules) but kept pure and dependency-free so it can be unit-tested
without a browser — satisfying Principle II and IV without polluting `src/core/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; no complexity to justify.
