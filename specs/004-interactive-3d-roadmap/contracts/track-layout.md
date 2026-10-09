# Contract: Track Layout & Path (pure)

**Feature**: `004-interactive-3d-roadmap` | **Version**: 1.0.0

Pure, DOM-free, Three.js-free module `src/render/roadmap-layout.js`. Unit-testable in Node.

```js
// Build the serpentine track. `levels` = [{ id, difficulty }] in play order.
export function buildTrack(levels, options = {}):
  Promise-free object ({
    nodes: Array<{ id, index, position: {x,y,z}, difficulty }>,
    path:  Array<{ x,y,z }>,                       // polyline incl. sampled corner arcs
    segments: Array<{ fromIndex, toIndex, difficulty }>,
    bounds: { width, depth },                      // for camera framing
  })

// Sample position + tangent along the path, t in [0,1] (arc-length parameterised).
export function samplePath(points, t):
  { position: {x,y,z}, tangent: {x,z} }            // tangent normalized in the xz plane, y ignored
```

## Behavior

- `buildTrack` MUST place `levels.length` nodes in a serpentine: rows of `cols = 5` (default), each
  row left→right then right→left, centred on the origin; node pitch `~1.5`, row gap `~2.4`.
- The `path` MUST include every node centre as an exact point; corner turns MUST be sampled 180° arcs
  (8–12 points) so the car can turn around at row ends.
- `segments` MUST cover every adjacent pair of nodes exactly once, tagged with the difficulty of the
  pair (the node with the higher index's difficulty, or the shared region).
- `samplePath` MUST be deterministic, monotonic (t increasing ⇒ arc length increasing), and return the
  exact node centre when `t` maps to a node index (rest-on-node).
- The module MUST import only the pure helpers it needs (no DOM, no `three`) so tests run in Node.

## Invariants

1. `path[?]` contains every node centre (each exactly once).
2. Consecutive-arc-length between adjacent nodes `> 0`.
3. `buildTrack([], …)` returns empty nodes/path without throwing.
4. Red-car yaw helper (same module or `src/render/models.js`): `redYaw(base, isRed) = isRed ? base + π : base`.