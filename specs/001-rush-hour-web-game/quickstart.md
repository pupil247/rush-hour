# Quickstart & Validation: Rush Hour Web Game

A run-and-verify guide. It proves the feature works end to end without describing implementation
bodies. Entity and interface details live in `data-model.md` and `contracts/`.

## Prerequisites

- Node.js 20+ (unit tests and the offline solver tool only).
- A modern evergreen browser (desktop or mobile).
- A static file server for local play (no build). Examples: `python3 -m http.server` or `npx serve`.

## Run the game (no build)

```bash
# from the repository root
python3 -m http.server 8080
# open http://localhost:8080
```

Expected: the roadmap screen appears with the first Débutant challenge unlocked, rendered in 3D.

## Run the tests

```bash
# Pure core unit tests (no install, no browser)
node --test

# Browser end-to-end tests (dev-only dependency; Playwright starts the static server itself)
npx playwright test
```

## Regenerate verified solutions (offline, dev-only)

```bash
node tools/bake-solutions.mjs        # rewrites challenges.json using the core solver
node --test                          # confirms schema + optimal counts still hold
```

Expected: `challenges.json` is reproducible; the catalog validates and every `optimalMoveCount`
equals the solver's minimum.

## Validation scenarios

### V1 — Rules are the single source of truth (Principle I)

- Run the guard test; it passes.
- Confirm `RULES.md` content equals the frozen `RULES` constants via `rulesMatchReference`.
- Expected: editing a rule requires editing `RULES.md`, not code; the guard test fails if code drifts.

### V2 — Board and movement rules (FR-001–FR-008)

- Load a fixture puzzle; attempt a legal slide, a blocked slide, an off-axis drag, and a slide of two
  cells.
- Expected: the legal slide applies; the blocked/off-axis attempts change nothing and add no move;
  the two-cell slide counts as exactly one move.

### V3 — Win condition (FR-007)

- Slide the red car until it only partly passes the exit, then stop; then slide it fully out.
- Expected: no win while partial; win only when every red-car cell is past the edge.

### V4 — Roadmap progression (FR-009a, FR-020/020a–d, SC-010)

- Fresh start, then view the roadmap.
- Expected: exactly one challenge unlocked; the catalog shows 10 stops in regions
  2/3/2/1/2 (Débutant→Génie); locked stops cannot be opened.

### V5 — Victory returns to the roadmap (FR-023/023a/023b)

- Solve the first challenge.
- Expected: a brief celebration with moves vs. optimal, then the roadmap reappears with the car token
  advanced and the next challenge unlocked; the player chooses what to play next.

### V6 — Undo, redo, reset (FR-016–FR-018)

- Make several moves, undo to the start, redo forward, then reset.
- Expected: counts track each action; reset reproduces the exact starting layout with count 0.

### V7 — Reveal solution (FR-019/019a/019b, FR-026)

- Mid-attempt, reveal the solution; let the animation finish; then win.
- Expected: the animation plays from the starting layout and the board is restored to the player's
  exact prior state; the revealed win does not mark the challenge solved, does not advance the
  roadmap, and does not change the recorded best.

### V8 — Best score and persistence (FR-021–FR-024, SC-008)

- Solve unaided; note the best; replay with more moves; reload the page.
- Expected: best is the lower value, persists after reload, and is not lowered by a worse run.

### V9 — Challenge validation (FR-013, FR-009a, Principle V)

- Feed the validator a catalog with an overlap, a missing red car, an unsolvable layout, a
  mismatched `optimalMoveCount`, or the wrong level distribution.
- Expected: validation fails with a structured error and the challenge is never offered.

### V10 — 3D input and feedback (FR-014, FR-015, FR-027, FR-028, FR-029, FR-032)

- Drag a car with a pointer; select a car and press arrow keys; perform a blocked move; toggle mute.
- Expected: the vehicle slides along its axis, the red car is always visually distinct, move/blocked/
  victory cues play when unmuted, and the game is usable by touch.

### V11 — Performance (SC-004, SC-006, SC-009)

- Load the game and make a move on a typical machine.
- Expected: playable within 3 seconds, the move is on screen within 100 ms, and the scene stays
  smoothly interactive.

## Definition of Done (this feature)

- All V1–V11 scenarios pass.
- `node --test` is green; `npx playwright test` is green.
- `challenges.json` validates and contains exactly 10 solver-verified challenges (2/3/2/1/2).
- The app runs from static files with no build artifact present.
