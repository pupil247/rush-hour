# Phase 0 Research: Rush Hour Web Game

All Technical Context unknowns are resolved here. No item remains marked NEEDS CLARIFICATION.

## R1. 3D delivery without a build step

- **Decision**: Load Three.js as native ESM through an `<script type="importmap">` entry pointing at
  a version-pinned CDN URL, and `import` it directly from application modules.
- **Rationale**: Satisfies Constitution Principle III (no build). Import maps are supported by all
  target browsers and let bare specifiers (`three`) resolve without a bundler. Pinning the exact
  version guarantees the deployed artifact is reproducible.
- **Alternatives considered**: Bundling Three.js locally (violates no-build, produces a `dist/`);
  Babylon.js (viable but heavier, no benefit for a small grid); A-Frame (declarative, awkward for
  precise per-vehicle drag).

## R2. Pure core / presentation boundary

- **Decision**: `src/core/*` is dependency-free ESM with no DOM or Three.js imports. The render and
  UI layers consume the core only through the documented interface in `contracts/core-api.md`.
- **Rationale**: Principle II. Enables `node --test` to exercise the real game logic without a
  browser and guarantees the 3D layer cannot change the rules.
- **Alternatives considered**: Framework-style reactive state (adds a dependency and couples logic to
  rendering); logic inside event handlers (untestable, violates Principle II).

## R3. Drag interaction on a fixed axis

- **Decision**: Use pointer events plus a Three.js raycaster to pick a vehicle, intersect the pointer
  ray with the board plane, project the hit onto the vehicle's own axis (row for horizontal,
  column for vertical), and convert that offset to a whole-cell slide distance clamped to the legal
  range from `core/moves.js`. A tap/click selects a vehicle; arrow keys slide the selected vehicle.
- **Rationale**: Guarantees axis-only movement (FR-003) because diagonal motion is discarded by
  construction, and it reuses the core's legal-range computation so the render layer holds no rules.
- **Alternatives considered**: Free 3D translation then snapping (can produce illegal intermediate
  states); click-source/click-target only (less tactile); physics/constraints engine (overkill).

## R4. Optimal solver

- **Decision**: Breadth-First Search over the puzzle's state space in `src/core/solver.js`, where a
  state is the ordered list of vehicle positions and each edge is one legal slide (any distance = one
  edge, matching the "one slide = one move" rule). BFS returns a minimum-move solution.
- **Rationale**: The 6×6 board with a handful of vehicles has a small reachable state space, so BFS
  is exact and fast enough. Because a slide of any length costs one move, the solver's step count is
  exactly the game's move count, so difficulty and the recorded optimum stay consistent.
- **Alternatives considered**: A* with a heuristic (unnecessary at this scale); greedy/DFS (not
  optimal, invalid for FR-011); precomputed solution tables (brittle, not needed).

## R5. Challenge validation without an external library

- **Decision**: Validate `challenges.json` with a small hand-rolled validator in `src/core/schema.js`
  plus a JSON Schema document (`challenges.schema.json`) that documents and machine-checks the format.
- **Rationale**: Avoids adding a runtime dependency (keeps Principle III clean) while still giving a
  precise, testable contract. The validator throws structured errors the tests assert on.
- **Alternatives considered**: Ajv loaded from CDN (extra runtime dependency for a tiny schema);
  no validation (violates FR-013 and Principle V).

## R6. Baked, verified solutions

- **Decision**: `tools/bake-solutions.mjs` reuses `src/core/solver.js` to compute each challenge's
  optimal solution and move count, then writes them into `challenges.json`. The app never solves at
  runtime for content; it only validates.
- **Rationale**: Principle V — solutions are solver-produced, not hand-authored, and every shipped
  challenge is proven solvable. Reusing the core solver guarantees the baked answers match the game's
  own rules.
- **Alternatives considered**: Hand-authored solutions (error-prone); runtime solving on load (adds
  latency and risk, and could disagree with the recorded optimum).

## R7. Persistence format

- **Decision**: Store roadmap position and per-challenge records in `localStorage` under a single
  versioned key (see `contracts/progress-storage.md`). Reads are defensive; corrupt or absent data
  degrades to a fresh game without error.
- **Rationale**: FR-024/FR-025 and the resilience edge cases. No backend (Principle III context).
- **Alternatives considered**: IndexedDB (overkill for a few KB); cookies (wrong tool, size limits).

## R8. Audio without asset files

- **Decision**: Synthesize short tones with the Web Audio API for move, blocked, and victory cues,
  gated behind the first user gesture, with a persisted mute flag.
- **Rationale**: No binary assets (constraint) and FR-027. Web Audio avoids autoplay violations by
  starting on first interaction.
- **Alternatives considered**: Bundled audio files (adds assets, contradicts the constraint).

## R9. Testing static files

- **Decision**: Unit tests run with `node --test` over `src/core`. Playwright E2E specs run against a
  static server started by Playwright's `webServer` config (no app code involved), driving real
  pointer drags and keyboard input.
- **Rationale**: Principle IV. Keeps unit tests hermetic and browser tests realistic.
- **Alternatives considered**: A browser test runner for everything (slower unit feedback); jsdom
  (cannot exercise Three.js or real pointer events).

## R10. Timer semantics

- **Decision**: Measure active play with `performance.now()`, accumulating only while the page is
  visible and an attempt is active; pause on `visibilitychange` and resume on return.
- **Rationale**: Matches the timer assumption in the spec (FR-022 and its edge case).
- **Alternatives considered**: Wall-clock elapsed time (counts time away from the game).

## R11. Difficulty mapping

- **Decision**: Assign each challenge's level from the solver's optimal move count, using the curated
  ordering to place 2/3/2/1/2 challenges into Débutant/Intermédiaire/Avancé/Expert/Génie.
- **Rationale**: Keeps "difficulty" objective and testable (assumption in the spec), and matches
  FR-009a's fixed distribution.
- **Alternatives considered**: Subjective labels (untestable); a pure threshold with no curation
  (may misplace puzzles).

## R12. Procedural geometry and camera

- **Decision**: Build the board, cars, and trucks from Three.js primitives (rounded boxes, simple
  materials) and render with a top-down, slightly tilted camera; the red car uses a distinct
  material/emissive accent.
- **Rationale**: No binary assets, fast load, and FR-028 guarantees the red car is always
  distinguishable.
- **Alternatives considered**: GLTF models (adds assets and a loader error path); free-orbit camera
  (disorienting for a grid puzzle).
