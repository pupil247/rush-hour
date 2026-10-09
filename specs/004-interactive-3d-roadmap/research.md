# Phase 0 Research: Interactive 3D Roadmap

**Feature**: `004-interactive-3d-roadmap` | **Date**: 2026-10-08

All questions were resolved through the grill-me interview; this document fixes the technical
approach that Phase 1 artifacts and `tasks.md` will follow.

---

## R1. Serpentine track generation (pure)

**Decision**: Build the node layout with a pure function `buildTrack(levels, difficulty)` that
arranges the ordered levels in a serpentine grid — rows of `cols = 5` (10 levels → 2 rows), each row
left→right, next row right→left (snake). Constant pitch (1.5 units along a row, 2.4 units between
rows); nodes are placed at integer-ish grid points and centred on the origin. Region boundaries are
computed from the difficulty sequence so each region maps to a set of node indices.

**Rationale**: Deterministic and testable in Node (Principle IV); one winding road reads like the
grown-up "roadmap" the user asked for (option B); no hand-authored layout data file.

**Alternatives considered**:
- *Hand-placed nodes stored in a data file*: rejected — adds authoring/maintenance for no gameplay gain.
- *One straight line*: rejected in the grill (option A) — regions invisible and boring.
- *Per-region branches*: rejected in the grill (option C) — crosses branches complicate the car path.

## R2. Path representation and sampling

**Decision**: The road is a **polyline**: the node centres joined by straight segments, with the two
corner turns at each row end replaced by a **180° arc** sampled into ~8–12 points. The path is an
ordered list of `{x, y, z}` points; a pure `samplePath(points, t)` interpolates along arc length and
returns `{ position, tangent }` (tangent = normalized segment direction, reused for the car's yaw).

**Rationale**: A polyline-with-arcs is simple to compute, exactly passes through node centres (rest-on-
node is exact), and gives an unambiguous tangent everywhere — no Catmull-Rom overshoot or endpoint
jitter. Pure → unit-testable.

**Alternatives considered**:
- *Catmull-Rom spline through nodes*: rejected — overshoots near corners, harder to guarantee exact
  node arrival.
- *Per-frame bezier per segment*: rejected — more math, no user-visible benefit.

## R3. Car travel and turning around

**Decision**: Travel animates the car along `samplePath` between the current node and the target node
(t ≈ 0.9 s, ease-in-out). The car's yaw is the path tangent; when travelling backwards the yaw target
differs by π, so the yaw tweens through the **shortest arc** (spinning the model around) rather than
snapping. Input during travel is ignored (a single queued press is allowed at most once, then
dropped) so the car always comes to rest on a node.

**Rationale**: Satisfies FR-004/005/006 (never rests on a line; turns around when reversing) and the
edge cases on rapid presses, deterministically.

**Alternatives considered**:
- *Instant warp to the next node*: rejected — destroys the "car drives the road" feel.
- *Yaw snap*: rejected in the grill — the user wants the model to visibly turn around.

## R4. Roadmap canvas and render lifecycle

**Decision**: Add a **dedicated `<canvas id="roadmap-scene">`** inside `#screen`, with its own
`WebGLRenderer` created lazily on first roadmap display and destroyed (`renderer.dispose()` +
`renderer.forceContextLoss()`) when leaving for a level, freeing the GPU context. The roadmap has its
own render loop (rAF) that runs only while the roadmap is visible; the game's `#scene` canvas and
renderer are untouched.

**Rationale**: Zero risk to the existing game render path; the roadmap can exist before `initThree`
(the WebGL context cannot be shared trivially across two scenes with different cameras without
refactoring the game loop). Two short-lived contexts are well within browser limits.

**Alternatives considered**:
- *Shared canvas + scene swap in a single renderer*: rejected — requires touching the running game
  render loop and object lifecycles; higher regression risk for this feature.
- *DOM/CSS-only roadmap*: rejected — the user asked for 3D.

## R5. Nodes, road, and region visuals

**Decision**: Ground = a large dark plane (matches the game's background style). Road = a wide, flat
ribbon (slightly above ground) built from the polyline (`TUBE`/`ExtrudeGeometry` is overkill; use a
`THREE.Line` + a flat `PlaneGeometry` ribbon sampled every few path points), tinted per difficulty
segment (5 accent colors derived from the existing game palette). Nodes = small cylinders/toruses
placed at each level's position; **locked** nodes are dimmed (lower opacity material) with a lock
icon hint, **solved** nodes get a subtle ✓ tint, the **current** node hosts the pulsing ring. A DOM
caption (not 3D text) shows the current region name and level name above the canvas.

**Rationale**: Colour-coded segments + DOM caption satisfy FR-014's "colour-coded segments and/or
floating labels" with the simplest, legible stack; DOM text is crisper than canvas sprites and
translatable via the existing French strings module.

**Alternatives considered**:
- *3D text sprites (canvas textures)*: rejected — more code, blurry at scale, harder to translate.
- *Per-node floating name labels*: rejected — 10 labels clutter the small map.

## R6. Highlight effect on the current node

**Decision**: The current node gets a **ring** (thin `TorusGeometry`, laid flat) whose emissive
intensity and scale pulse (sinus, ~1.5 Hz) in the roadmap render loop; the car sits on the node at
its centre. This matches the grill decision (Q6: A).

**Rationale**: Cheap, unambiguous, and visible at a glance; no extra textures.

**Alternatives considered**: grown node, beacon beam, text swap — all rejected in the grill.

## R7. Picking and interaction wiring

**Decision**: Pointer input on the roadmap canvas raycasts the road-plane to nodes (closest node to
the hit point within a threshold). Behaviour:
- **Click/tap a node** the car is not on → select it, drive there (if within the unlocked range).
- **Click the node the car rests on** → start the level (grill Q2).
- **ArrowUp / on-screen ▲** → next unlocked level; **ArrowDown / ▲▼�... else previous**; blocked at
  the ends (grill Q3) with an audio/visual "blocked" cue.
- **Enter / Space / "Jouer" button** → start the highlighted (current) level.
The roadmap captures `keydown` only while `#screen` is visible, and never while travelling.

**Rationale**: Covers the user's described flows plus mouse/touch consistency; one shared
`currentIndex` drives both the car and the highlight.

**Alternatives considered**:
- *Click anywhere starts immediately*: rejected in the grill (Q2).
- *Wander freely over locked nodes*: rejected in the grill (Q3).

## R8. Touch support

**Decision**: On touch (`'ontouchstart' in window` or `pointer: coarse`), show on-screen ▲/▼ buttons
and a visible "Jouer" button over the roadmap canvas (DOM overlay). Tapping a node drives there; the
"Jouer" button starts the level. On desktop, arrows + Enter/Space + node clicks apply (the "Jouer"
button can also be present for discovery).

**Rationale**: Fulfils FR-013 and the touch edge case; no keyboard required on phones.

**Alternatives considered**: swipe-only, double-tap-to-start — rejected in the grill.

## R9. Red-car frontways rule (pure)

**Decision**: The red-car orientation is a pure rule applied when building a vehicle mesh/model:
for `isRed` vehicles, add `π` to the model's yaw (180°). No per-level data; the red car is always on
the exit row and horizontal, so facing the exit = one consistent flip (grill Q7). Testable as a pure
function `$redYaw(orientation)` and asserted end-to-end by reading the model's rotation.

**Rationale**: One-line, rule-derived fix that satisfies FR-001 without touching any other vehicle
(FR-002).

**Alternatives considered**: dynamic per-move facing (rejected — model would spin each slide), fixed
world direction (equivalent here, less principled).

## R10. Tests and test handle

**Decision**: A `?test=1` handle for the roadmap (`window.__rushHourRoadmap`) exposing:
`{ currentIndex, nodeCount, nodeStates: {locked:any, current:any}[], carIndex, hasRing, isTraveling }`
plus `startLevel(i)` used by specs that must open a specific challenge. Existing e2e specs that open
the first level switch to a shared helper: load roadmap → press **Enter** (car already rests on level 1).
`roadmap.spec.js` is rewritten around the 3D scene assertions.

**Rationale**: Keeps every existing Playwright spec working through a genuine user path (Enter), while
the handle makes roadmap state and multi-level flows observable and non-flaky.

**Alternatives considered**: DOM scraping of the old list — obsolete; raycast-clicking tiny nodes in
every spec — fragile and slow.

---

## Summary of decisions

| # | Topic | Decision |
|---|-------|----------|
| R1 | Track layout | Pure serpentine `buildTrack` — rows of 5, 180° ends, no data file |
| R2 | Path | Polyline with sampled corner arcs; `samplePath` → position + tangent |
| R3 | Travel | ~0.9 s ease along path; yaw = tangent, 180° reverse spins via shortest arc; input ignored/queued once |
| R4 | Rendering | Dedicated `#roadmap-scene` canvas + own renderer/lifecycle; game path untouched |
| R5 | Visuals | Dark ground, ribbon road, difficulty-coloured segments, cylinder nodes, DOM caption |
| R6 | Highlight | Pulsing emissive ring on the current node (~1.5 Hz) |
| R7 | Picking | Click drive / click-resting start / Enter+Space+Jouer start / arrows bounded to unlocked |
| R8 | Touch | On-screen ▲/▼ + "Jouer" on coarse pointers; tap node to drive |
| R9 | Red car | Pure rule: 180° yaw flip for `isRed` only |
| R10 | Tests | Roadmap test handle + shared "open first level via Enter" helper; `roadmap.spec.js` rewritten |