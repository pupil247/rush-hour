# Phase 0 Research: Realistic Vehicle Models

**Feature**: `003-real-vehicle-models` | **Date**: 2026-10-07

This document resolves every open technical question for the feature. There are no
`[NEEDS CLARIFICATION]` markers remaining in the specification; the decisions below define the
technical approach that the Phase 1 design artifacts and `tasks.md` will follow.

---

## D1. glTF loading mechanism

**Decision**: Load the `.glb` templates with Three.js's official `GLTFLoader` addon, resolved
through the existing import map via a new entry:
`"three/addons/": "https://unpkg.com/three@0.169.0/examples/jsm/"` (same pinned version as `three`).

**Rationale**: `GLTFLoader` is the canonical glTF loader, supports the binary `.glb` single-file
container, and is distributed as a native ES module under `examples/jsm/`. It imports only `three`
(resolved by the existing map) and `../utils/BufferGeometryUtils.js` (a sibling under the same pinned
CDN), both verified reachable. This keeps the no-build constraint intact (Principle III).

**Alternatives considered**:
- *Hand-rolled glTF parser*: rejected — large surface area, reimplements a solved problem.
- *`ObjectLoader` + `.json`*: rejected — Three.js-specific format, not portable, no tooling ecosystem.
- *`OBJLoader`*: rejected — no embedded materials/colors, sidecar `.mtl`/textures add files.

---

## D2. Asset format and compression

**Decision**: Ship **uncompressed binary glTF (`.glb`)** with embedded textures/materials: one file
per model, no external `.bin` or texture files.

**Rationale**: A single self-contained file per model is simplest to commit, serve from any static
host, and clone; it needs no decoder beyond `GLTFLoader`. It also ships "in authored form" exactly as
the amended constitution requires, with no conversion or packing step.

**Alternatives considered**:
- *Draco mesh compression*: rejected — requires `DRACOLoader` plus a WASM decoder fetched at runtime,
  adding a network dependency and complexity for no meaningful benefit at this model size.
- *KTX2/Basis textures*: rejected — same decoder/transcoder cost; plain embedded textures suffice for
  low-poly models.
- *`.gltf` + `.bin` + external textures*: rejected — several files per model and more request/portability
  surface for no gain.

**Budget**: Keep the two files small (target ≤ ~500 KB total). Low-poly, flat-color models are
preferred so the recolor strategy (D4) works and shadows stay cheap.

---

## D3. Model sourcing and licensing

**Decision**: Source two low-poly **CC0 / public-domain** models — one car (2-cell) and one truck
(3-cell) — and commit them under `assets/models/` together with `assets/models/ATTRIBUTION.md`
recording the author, source URL, license, and retrieval date. Preferred sources: **Kenney** (Car
Kit / Truck Kit, CC0) and **Quaternius** vehicle packs (CC0, distributed via poly.pizza). An optional
offline-only helper `tools/fetch-models.mjs` documents how the files are obtained and MUST NOT be
loaded by the shipped app.

**Rationale**: CC0 removes attribution/legal friction while still giving recognizable, "real-looking"
low-poly vehicles. Committing the files (spec option A) makes the game self-contained and offline-
capable apart from the Three.js CDN already in use. Keeping a fetch helper as offline tooling matches
the constitution's rule that authoring tools live outside the runtime and are never loaded by the app.

**Alternatives considered**:
- *Procedurally generate car/truck meshes*: rejected — the user explicitly asked for "real … model"
  assets, and the spec resolved to bundled model files (option A).
- *Load models from a CDN at runtime*: rejected — spec option B; adds an external service dependency
  and an offline failure mode the user did not ask for.
- *Paid/attribution-required assets*: rejected — unnecessary given abundant CC0 options.

**Acceptance criteria for the chosen models**: single-mesh or clearly named body material; origin at
the vehicle's ground-level center; consistent forward axis; no baked-in scene transforms; recognizable
as a car / a truck at a glance.

---

## D4. Per-vehicle recoloring

**Decision**: Load each template once, then for every vehicle **clone the template scene** and clone
its materials, tinting only the **body material(s)** to the vehicle's color while preserving
glass/wheel/trim materials. Detect the body material by an explicit name convention (case-insensitive
match on `body`, `paint`, `car`, or `truck`), falling back to the **largest mesh by bounding-box
volume** when no material is named. The red car uses the reserved red (`0xd21f2a`) plus its red
emissive; other vehicles keep the existing distinct palette (hashed from vehicle id).

**Rationale**: glTF materials are shared between clones; cloning per instance prevents one vehicle's
color from leaking into another. Tinting only the body preserves wheels/glass so the model still reads
as a real vehicle, and the largest-mesh fallback makes the strategy robust to models that do not follow
the naming convention.

**Alternatives considered**:
- *Tint the whole model*: rejected — recolors wheels/windows and looks wrong.
- *Texture atlas / UV recolor*: rejected — requires texture authoring per model, out of scope.
- *Vertex colors*: rejected — models would need to be authored with a recolorable channel.

---

## D5. Fitting, orientation, and grounding

**Decision**: Write a **pure function** `fitVehicleModel(size, kind, orientation)` that, given a
model's axis-aligned bounding-box dimensions (`{x, y, z}`), the vehicle kind (car/truck → 2/3 cells),
and orientation (`H`/`V`), returns a uniform `scale`, a `rotationY`, and a `position` offset. Apply it
to the cloned model as a wrapper group. Target footprint matches the current procedural vehicle:
length ≈ `cells * 0.88`, width ≈ `0.8`, grounded so the wheels sit on the board and the model does not
overflow its cells.

**Rationale**: A pure `size → transform` function is trivially unit-testable in Node with no Three.js
(Principle IV) and keeps the Three-dependent cloning thin. The wrapper group carries the transform and
the vehicle id, so animation and picking operate on it regardless of the model's internal hierarchy.

**Alternatives considered**:
- *Per-model hand-tuned transforms*: rejected — brittle and untestable; any model swap breaks it.
- *Scale in the model authoring tool*: rejected — we commit models as authored and fit at runtime.

---

## D6. Fallback and error handling

**Decision**: Keep the existing procedural box builder as the fallback. Vehicles are created as
fallback boxes immediately (always playable); when a template is available they are replaced by
fitted model clones. If a `.glb` request fails, decodes badly, or is absent, the fallback remains and
no error propagates to the user (a console warning is acceptable).

**Rationale**: Satisfies FR-009 and SC-006 (game stays 100% playable when a model is unavailable) and
protects first play on slow connections (SC-004). Also lets the browser suite assert the fallback path
by intentionally failing the model request.

**Alternatives considered**:
- *Block the board until models load*: rejected — hurts first-play time and violates the "no
  perceptible block" intent.
- *Throw/show an error*: rejected — a missing cosmetic asset must never break the puzzle.

---

## D7. Async loading integration

**Decision**: Preload both templates once in `initThree()` (awaited alongside scene setup, cached for
the session) and then build the board. `syncVehicles` uses the cached templates synchronously to
clone fitted vehicles. If preloading fails, play continues with fallbacks; a later successful load is
not required.

**Rationale**: `syncVehicles` is currently synchronous and used by undo/redo/reset; keeping it
synchronous (backed by a template cache) avoids threading async through the game state. Preloading at
`initThree` reuses the existing "controls locked until ready" gate so the first board painted already
shows models when they are available.

**Alternatives considered**:
- *Lazy-load per board*: rejected — repeated async work and races on undo/redo/reset.
- *Stream models in after first paint*: rejected as the default — the HUD unlock already gives a clean
  ready point; the fallback still covers the failure case.

---

## D8. Picking and dragging with grouped models

**Decision**: Make raycasting **recursive** (`intersectObjects(group.children, true)`) and resolve the
hit back to its vehicle by walking up the ancestor chain to the object carrying
`userData.vehicleId`. Drag/animation operate on that **vehicle root group** (which has `.position`),
not on an internal child mesh.

**Rationale**: A `.glb` model is a `Group` hierarchy, so the current non-recursive pick and direct
`hit.userData.vehicleId` read no longer apply. Resolving to the root keeps drag preview and
`animateMove` (both position-based) working unchanged.

**Alternatives considered**:
- *Give every descendant `userData.vehicleId`*: rejected — duplicated state; ancestor lookup is
  simpler and single-sourced.
- *Invisible picking proxy box per vehicle*: rejected — extra objects to maintain; recursive pick on
  the model is fine at these poly counts.

---

## D9. Asset URL resolution and static-subpath portability

**Decision**: Resolve model URLs from the module location, e.g.
`new URL('../../assets/models/car.glb', import.meta.url)`, rather than a leading-slash path.

**Rationale**: The game is deployed on a GitHub Pages **project subpath** (`/rush-hour/`). Root-absolute
URLs would 404 there. `import.meta.url`-relative resolution works both locally and under any subpath,
with no build configuration.

**Alternatives considered**:
- *Absolute `/assets/...`*: rejected — breaks on the Pages subpath.
- *Configurable base in `index.html`*: rejected — unnecessary indirection; `import.meta.url` is exact.

---

## D10. Hermetic browser tests for the addon

**Decision**: Extend the existing Playwright fixture (`tests/e2e/three-fixture.js`) to also intercept
and serve the pinned CDN URLs for `GLTFLoader` and `BufferGeometryUtils` from vendored test copies,
mirroring what it already does for `three.module.js`. Model `.glb` files are served by the test
web-server like any other static asset.

**Rationale**: The current fixture makes browser tests fast and network-independent for Three.js; the
addon files are now part of the runtime path, so they must be covered the same way. Production still
loads everything from the pinned CDN via the import map (Principle III).

**Alternatives considered**:
- *Allow the addon to hit the network in tests*: rejected — reintroduces flakiness/network dependency
  the fixture was created to remove.
- *Stub the loader in tests*: rejected — would not exercise the real load/fit/recolor path.

---

## Summary of decisions

| # | Topic | Decision |
|---|-------|----------|
| D1 | Loader | `GLTFLoader` addon via new `three/addons/` import-map entry (pinned) |
| D2 | Format | Single uncompressed `.glb` per model, embedded textures |
| D3 | Sourcing | CC0 models (Kenney / Quaternius), committed + `ATTRIBUTION.md` |
| D4 | Recolor | Clone scene + materials; tint body material (name, else largest mesh) |
| D5 | Fit | Pure `fitVehicleModel(size, kind, orientation)` → scale/rotation/offset |
| D6 | Failure | Keep procedural box as always-available fallback |
| D7 | Loading | Preload templates in `initThree`, cached; `syncVehicles` stays sync |
| D8 | Picking | Recursive raycast → walk ancestors to `userData.vehicleId` root |
| D9 | URLs | Resolve assets relative to module (`import.meta.url`) |
| D10 | Tests | Vendor + route addon CDN URLs in the Playwright fixture |
