# Implementation Plan: Rush Hour Web Game

**Branch**: `001-rush-hour-web-game` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-rush-hour-web-game/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Build a static, no-build 3D web adaptation of the Rush Hour sliding-block puzzle. The puzzle rules
(6×6 board, single exit on row 3, 2-cell cars, 3-cell trucks, one red car, axis-only movement, full
exit to win, one slide = one move) are expressed as a frozen rules module derived from a verbatim
`RULES.md`. All game logic — board, legal moves, move application, undo/redo, win detection, and a
BFS optimal solver — lives in dependency-free ES modules tested with `node --test`. The presentation
layer uses Three.js loaded as ESM through an import map (no bundler) to render a procedurally
generated board and vehicles, drive a mouse/touch drag plus keyboard interaction, animate the
solution playback, and show a roadmap-based progression UI in French. Ten curated challenges
(2/3/2/1/2 across Débutant→Génie) ship in `challenges.json`, each proven solvable with its optimal
move count baked in by an offline solver tool. Browser behavior is verified with Playwright against
a static server.

## Technical Context

**Language/Version**: JavaScript (ES2022+), native browser ES modules; Node.js 20+ for tests and the
offline solver tool.

**Primary Dependencies**: Three.js (ESM build, version-pinned CDN via `<script type="importmap">`).
No other runtime dependency. Dev-only: Playwright for browser tests.

**Storage**: Browser `localStorage` for player progress and best scores; static `challenges.json` for
content. No server-side storage.

**Testing**: Node built-in test runner (`node --test`) for the pure core; Playwright for browser
end-to-end tests. No test framework install required for the unit layer.

**Target Platform**: Modern evergreen browsers on desktop and touch devices; any static file host.

**Project Type**: Single static web application (frontend only, no backend).

**Performance Goals**: 60 fps on typical desktop and ≥30 fps on typical phones; a completed move is
reflected on screen within 100 ms; game is playable within 3 seconds on a typical connection.

**Constraints**: No build, bundler, or transpiler at any point; no binary 3D assets (procedural
geometry only); French-only UI; rules are read-only and non-reinterpretable; no network dependency
beyond the pinned Three.js CDN; fully host-agnostic static files.

**Scale/Scope**: 10 challenges (Débutant 2, Intermédiaire 3, Avancé 2, Expert 1, Génie 2), a 6×6
grid with at most a handful of vehicles per puzzle, single player, one feature area.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Rules Are the Single Source of Truth (NON-NEGOTIABLE) | `RULES.md` verbatim + frozen `rules.js` + guard test | PASS — planned in Phase 1; guard test in quickstart |
| II. Pure, Headless Game Core | Core modules import no DOM and no Three.js; render consumes a narrow interface | PASS — `src/core/*` is dependency-free; interface in `contracts/core-api.md` |
| III. No Build Step (NON-NEGOTIABLE) | Native ESM + import map; static files only; no `dist/` | PASS — no tooling in the runtime path; only dev/test tooling |
| IV. Test-First, Test-Ready | `node --test` for core + Playwright E2E | PASS — both layers planned in quickstart and data-model tests |
| V. Data-Driven, Verified Challenges | `challenges.json` + schema; solver-proven, solver-scored | PASS — JSON schema contract + offline solver tool |

**Result**: No violations. Complexity Tracking section is therefore empty.

**Post-design re-check (after Phase 1)**: All gates still **PASS**. The pure-core boundary is
enforced by `contracts/core-api.md`; no build artifacts are introduced anywhere in the runtime path;
and `quickstart.md` V1–V11 verifies the rules guard, solver optimality, and the 2/3/2/1/2 catalog
distribution. No new complexity or dependency was added during design.

## Project Structure

### Documentation (this feature)

```text
specs/001-rush-hour-web-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── challenges.schema.json
│   ├── core-api.md
│   └── progress-storage.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
index.html                    # ESM entry, import map, canvas + UI mounts
RULES.md                      # verbatim rules, read-only reference (Principle I)
challenges.json               # 10 curated challenges with baked solutions
challenges.schema.json        # canonical JSON Schema (copied from contracts/)

src/
├── core/                     # Pure, dependency-free game logic (no DOM, no Three.js)
│   ├── rules.js              # frozen constants derived from RULES.md
│   ├── board.js              # 6×6 grid, occupancy, bounds
│   ├── moves.js              # legal moves, slide distance, movement on an axis
│   ├── game.js               # attempt state, apply/undo/redo/reset, win detection
│   ├── solver.js             # BFS optimal solver (min moves)
│   └── schema.js             # challenge validation (no external validator)
├── data/
│   └── challenges.js         # fetch + validate challenges.json; roadmap ordering
├── render/                   # Three.js presentation layer
│   ├── scene.js              # renderer, lights, shadows, loop
│   ├── board3d.js            # procedural board + exit
│   ├── vehicles.js           # procedural car/truck meshes (red car distinct)
│   ├── camera.js             # top-down tilted camera + framing
│   └── animation.js          # slide animation, solution playback, victory
├── input/
│   ├── pointer.js            # raycast + drag constrained to a vehicle's axis
│   └── keyboard.js           # select vehicle, arrow keys, undo/redo/reset shortcuts
├── ui/
│   ├── roadmap.js            # roadmap screen, car token, locked/unlocked stops
│   ├── hud.js                # move counter, timer, undo/redo/reset, reveal, mute
│   ├── dialogs.js            # victory celebration, completion, errors
│   └── strings.fr.js         # all French UI text
├── audio.js                  # Web Audio cues (move, blocked, victory), mute
└── progress.js               # localStorage read/write of roadmap + best scores

tools/
└── bake-solutions.mjs        # offline: solve challenges, write optimal moves + counts

tests/
├── unit/                     # node --test against src/core (+ schema, rules guard)
├── e2e/                      # Playwright specs (load page, drag, win, roadmap)
└── fixtures/                 # small known-solvable puzzles for tests
```

**Structure Decision**: Single static project (Option 1 shape) because this is a frontend-only web
app with no backend. The strict `src/core/` boundary enforces Constitution Principle II; `tools/` is
intentionally outside `src/` so the offline solver is never loaded by the shipped app (Principle V).
No `dist/` directory exists because there is no build (Principle III).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations; no complexity to justify.
