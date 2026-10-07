# Rush Hour Constitution

## Core Principles

### I. Rules Are the Single Source of Truth (NON-NEGOTIABLE)
The verbatim game rules MUST live in `RULES.md` at the repository root and MUST NOT be
paraphrased, reinterpreted, or silently edited by code, tests, or tooling. Every rule that the
software depends on (6×6 board, exit on row 3, cars of 2 cells, trucks of 3 cells, exactly one red
car, axis-only movement, win) MUST also be expressed as a frozen constant module (`rules.js`) that
is derived from `RULES.md` and cannot be mutated at runtime. A guard test MUST assert that the
frozen configuration is consistent with `RULES.md`. Changing a rule is a governance event: it
requires amending `RULES.md` explicitly, not editing application code.

**Rationale**: The rules are the product's contract. A single immutable oracle prevents drift
between what players read and what the engine does, and keeps every derived artifact auditable.

### II. Pure, Headless Game Core
All game logic — grid model, legal-move computation, move application, win detection, undo/redo
state, and the BFS/A* solver — MUST live in dependency-free ES modules that import neither the DOM
nor Three.js. Rendering, input handling, audio, and persistence MUST consume the core through a
narrow, explicit interface and MUST NOT embed game rules of their own. The core MUST be
deterministic and side-effect-free apart from its own state transitions.

**Rationale**: A pure core is testable in Node with no browser, guarantees the 3D layer cannot
accidentally change the rules, and makes an offline solver reuse the exact same code as the game.

### III. No Build Step (NON-NEGOTIABLE)
The application MUST run directly from static files with no bundler, transpiler, or compile step.
The browser MUST load native ES modules, and third-party code dependencies (Three.js and its
addons) MUST be resolved at runtime via an `<script type="importmap">` pinned to a CDN. There MUST
be no `dist/`, no build artifact, and no tooling required to open and play the game. Any tooling
used is permitted only for development and testing, never to produce the shipped runtime. Binary
assets (including 3D model files) are permitted as static files and MUST be shipped in the exact
form in which they are authored and served; no asset conversion, packing, or compile step is
permitted in the runtime path.

**Rationale**: "No build" is an explicit product constraint: it maximizes portability, keeps the
deployed artifact identical to the source, and lowers the barrier to inspecting and hosting the game.

### IV. Test-First, Test-Ready
Pure-core behavior MUST be covered by automated tests run with Node's built-in test runner
(`node --test`) with no additional install; browser behavior MUST be covered by Playwright
end-to-end tests driven against a static server. Tests MUST cover, at minimum: legal/illegal moves,
axis-only enforcement, applied-move counting (one slide equals one move), full-exit win detection,
undo/redo/reset, challenge-schema validation, and solver correctness. Tests for a behavior MUST be
written before or alongside that behavior, and the suite MUST pass before a feature is considered done.

**Rationale**: Test-readiness is a stated requirement; a pure core plus a thin browser layer makes
fast, hermetic verification possible without a build pipeline.

### V. Data-Driven, Verified Challenges
Every challenge MUST be declared as data in `challenges.json`, validated against a JSON schema, and
MUST carry its difficulty (Débutant, Intermédiaire, Avancé, Expert, Génie) and its solution. Each
challenge MUST be proven solvable, and its minimum move count MUST be computed by the solver, before
it is committed; solutions MUST NOT be authored or guessed by hand. Difficulty MUST be grounded in
the solver's optimal move count, not asserted arbitrarily.

**Rationale**: Embedding solver-verified solutions makes "the solution on the back of the card"
truthful and lets tests assert that every shipped puzzle is winnable and scored honestly.

## Technology & Platform Constraints

The runtime is a static, host-agnostic web app: plain `index.html`, ES modules, `challenges.json`,
`RULES.md`, and any bundled static assets, servable by any static file server. Three.js and its
addons are loaded as ESM from a CDN via an import map; there is no backend and no server-side code.
The 3D layer MAY render either a procedurally generated scene (Three.js primitives and materials) or
pre-authored 3D model assets (for example `.glb`/`.gltf` files) that are bundled as static files
with the application and loaded at runtime. Bundled model assets MUST be served in their authored
form with no conversion, packing, or compile step, MUST be small enough to load without blocking
first play, and MUST have a playable fallback representation when they cannot be loaded. Game logic
is a 2D grid; "3D" is presentation only. The user interface language is French for v1. Client-side
persistence (best scores and progress) MUST use `localStorage`. Input MUST support pointer drag to
slide a vehicle and click-to-select followed by arrow keys, and the interaction MUST remain usable
on touch devices.

## Development Workflow & Quality Gates

Development MUST run against a static server; no build command exists. The mandatory local gate is
`node --test` for the pure core plus the Playwright suite for browser behavior, and both MUST pass
before a change is considered complete. Landing a change MUST NOT introduce a build step or a
runtime dependency that violates Principle III. The challenge guard test and schema validation MUST
run in the same suite as the game logic. Offline authoring tools (such as the solver script that
bakes solutions into `challenges.json`, or tooling that generates model assets) MAY exist under a
clearly separated tooling path and MUST NOT be loaded by the shipped app. Where a plan or task
conflicts with this constitution, the constitution prevails.

## Governance

This constitution supersedes all other development practices for this project. Amendments MUST be
submitted as an explicit change to this file together with a justification, and MUST follow semantic
versioning: MAJOR for backward-incompatible governance or principle removals/redefinitions, MINOR
for a new principle or materially expanded guidance, and PATCH for clarifications and non-semantic
refinements. Every plan, task list, and pull request review MUST verify compliance with these
principles, and any added complexity MUST be justified against Principle III (no build) and
Principle II (pure core). The runtime source of truth for the game's rules is `RULES.md`, which is
read-only except through the amendment process defined here. The Sync Impact Report at the top of
this file is temporary review material and MUST be removed before the amended constitution is
committed.

**Version**: 1.1.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
