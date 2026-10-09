# Contract: Roadmap Input & Screen (input + UI)

**Feature**: `004-interactive-3d-roadmap` | **Version**: 1.0.0

`src/input/roadmap-control.js` + the rewritten `src/ui/roadmap.js` (screen shell) + wiring in
`src/main.js`.

## Input mapping (desktop)

| Trigger | Action |
|---------|--------|
| `ArrowUp` / on-screen ▲ | Travel to the next unlocked node (blocked feedback at the boundary). |
| `ArrowDown` / on-screen ▼ | Travel to the previous node (blocked feedback at node 0 / boundary). |
| `Enter` / `Space` | Start the level at the current node. |
| Click/tap a node | Travel to it (if unlocked); if it's the resting node, **start** the level. |
| `Escape` / roadmap button | (existing) back affordance — exits the roadmap only if needed by the app shell. |

## Rules

- Keyboard handling is active **only while the roadmap screen is visible** and MUST NOT scroll the
  page (preventDefault on arrows/Space).
- While `isTraveling`, arrow/tap presses are ignored (at most one queued press, then dropped), so the
  car always rests on a node (FR-005).
- Travel targets are clamped to `[0, unlockBoundary]` (FR-016); a boundary press gives a "blocked"
  cue (existing blocked sound/visual idiom) with no state change.
- Starting a locked node is impossible by construction (car never rests there).
- `Enter`/`Space` start only the current node's level; the game then launches the existing
  `startGame(order[i])` path, unchanged.

## Touch

- If `matchMedia('(pointer: coarse)')` matches, `roadmap.js` shows on-screen ▲/▼ buttons and a
  **"Jouer"** button over the canvas; tapping a node drives there; "Jouer" (or tap-on-resting-node)
  starts the level. Desktop may also show "Jouer" for discoverability.

## Region caption / HUD

- A DOM caption above the canvas shows: app title, current **region** (difficulty) and **level
  name**, and a short hint (`Entrée : jouer` on desktop; `▲▼ : se déplacer`). Updated whenever the
  current node changes.

## Lifecycle wiring (`main.js`)

- `showRoadmap()`: hide `#game`, show `#screen`; ensure the roadmap canvas exists; create the scene
  lazily; set states from `progress`; start loop; focus the screen for keyboard.
- `startGame(id)`: existing flow; additionally `roadmapScene.dispose()` (context freed) and stop the
  roadmap loop before the game canvas shows.
- On return from a level: `showRoadmap()` again recreates the scene and the car rests on the (new)
  `currentIndex` from `progress` (P3 persistence).

## Invariants

1. No roadmap keyboard handler runs while the game screen is active (no arrow-key pollution).
2. A reload of the page shows the car on the saved `currentIndex`.
3. "Start" always opens the exact level the car rests on.