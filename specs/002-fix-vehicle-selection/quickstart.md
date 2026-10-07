# Quickstart & Validation: Vehicle Selection & Keyboard Controls

Validation guide for the fix and the new interaction. Entity/interface details live in
`data-model.md` and `contracts/`.

## Prerequisites

- Node.js 20+ (unit tests).
- A static server for local play (no build): `python3 -m http.server 8080`.
- Playwright for the browser tests (`npm install && npx playwright install chromium`).

## Run

```bash
python3 -m http.server 8080        # open http://localhost:8080
node --test                        # pure unit tests (selection + core)
npx playwright test                # browser interaction tests
```

## Validation scenarios

### V1 — The selection crash is gone (FR-001, SC-001)
- Open a level, open the browser console, click a car.
- Expected: the car is selected with **no** unhandled error; the previous
  `Cannot read properties of undefined (reading 'children')` no longer occurs.

### V2 — Mouse select and drag (FR-002–FR-005, SC-002)
- With the mouse only: click a car, drag it along its file into empty space, click an empty cell.
- Expected: the car moves and the move counter increases; the empty click clears the selection;
  a blocked drag leaves the car in place and counts nothing.

### V3 — Highlighting (FR-006–FR-009, SC-004)
- Select a car; then deselect and browse with the keyboard.
- Expected: the selected car is strongly emphasized; the browsing car has a lighter highlight;
  exactly one car is highlighted at a time; the highlight updates immediately.

### V4 — Keyboard browsing and selection (FR-010–FR-012)
- With nothing selected, press ← / ↑ and → / ↓; then press Space; then Space again.
- Expected: the highlight cycles in a fixed order and wraps; Space selects the highlighted car;
  Space again deselects and returns to browsing with that car still highlighted.

### V5 — Keyboard movement (FR-013–FR-016, SC-003, SC-005)
- Select a horizontal car and press ←/→; then a perpendicular arrow; then an arrow into a blocked area.
- Expected: each axis arrow moves the car one cell and counts one move; a perpendicular arrow does
  nothing; a blocked move does not move the car or change the count. Complete a whole challenge with
  the keyboard only.

### V6 — Shared state and persistence (FR-017, FR-018, FR-019)
- Select with the mouse, then move with the keyboard; move a car and check what is selected.
- Expected: one shared selection; the moved car stays selected; input is ignored while a move or the
  reveal animation plays.

### V7 — No regressions (FR-020, FR-021, SC-006)
- Use undo, redo, reset, reveal, mute, and return-to-roadmap, including while a car is selected.
- Expected: all still work, no error, the selection is preserved or safely cleared, and the core
  rules (axis-only, no overlap, on-board, one slide = one move) still hold.

## Definition of Done

- All V1–V7 scenarios pass.
- `node --test` green (including the new selection tests).
- `npx playwright test` green (including the new mouse and keyboard specs).
- No new dependency and no build artifact.
