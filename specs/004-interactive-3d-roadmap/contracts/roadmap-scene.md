# Contract: Roadmap Scene (render + lifecycle)

**Feature**: `004-interactive-3d-roadmap` | **Version**: 1.0.0

`src/render/roadmap-scene.js` builds and runs the 3D roadmap inside `<canvas id="roadmap-scene">`
(added to `#screen` in `index.html`). The game's `#scene` canvas/renderer path is untouched.

```js
// Create (lazily) the roadmap scene and start its render loop.
export function createRoadmapScene(canvas, { nodes, path, segments, bounds, carTemplate }):
  { start(), stop(), setCurrent(index), setStates(nodeStates),
    travel(fromIndex, toIndex, durationMs), isTraveling(): boolean,
    pickNode(clientX, clientY): index | null,
    dispose() }

// Frame-rate pulse driver for the highlight ring (used by the render loop).
export function pulse(dt): number   // 0..1 sinusoid ~1.5 Hz
```

## Behavior

- **Ground/board**: a large dark plane; the ribbon road is a flat, difficulty-coloured band following
  `path`; nodes are flat cylinders/toruses at each `nodes[i].position`.
- **States**: `setStates` re-colours nodes: `locked` dimmed + lock hint, `solved` subtle ✓ tint,
  `unlocked` normal, `current` shows the **pulsing emissive ring** under the node.
- **Car**: a small clone of `carTemplate` (the loaded `car.glb`), tinted red, placed at node 0 on
  start. `travel(from, to)` animates position along `samplePath` over `durationMs` (~900 ms) and
  orients yaw to the path tangent, flipping π when travelling backwards (shortest-arc tween).
- **Camera**: fixed overview (see `camera`) framing `bounds` with a top-down tilt.
- **Picking**: `pickNode` raycasts the road plane and returns the nearest node within tolerance, or
  `null`.
- **Lifecycle**: `createRoadmapScene` is called lazily on first roadmap display; `dispose()` releases
  the renderer context (called when entering a level). `stop()`/`start()` gate the render loop.
- **Errors**: a missing `carTemplate` MUST NOT break the roadmap — the car is omitted (or a simple
  marker drawn) and navigation still works.

## Test handle (`?test=1`)

Exposed by `main.js` as `window.__rushHourRoadmap`:

```js
{
  currentIndex, nodeCount, carIndex, isTraveling,
  nodeStates: () => Array<{locked, solved, current}>,
  hasRing: () => bool,                     // ring visible on current node
  startLevel(index)                        // test-only: open order[index]
}
```

## Invariants

1. After `travel` completes, the car position equals the target node centre and `carIndex` updates
   with `current` atomically; there is never a resting index that points between nodes.
2. `pickNode` returns a node index ≤ `unlockBoundary` for interactive nodes.
3. `dispose` is idempotent; re-creating the scene after a level works (fresh trip back to the road).