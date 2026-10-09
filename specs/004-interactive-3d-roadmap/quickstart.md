# Quickstart Validation: Interactive 3D Roadmap

**Feature**: `004-interactive-3d-roadmap` | **Date**: 2026-10-08

Runnable scenarios that prove the feature end-to-end. Details in
[`contracts/`](./contracts/) and [`data-model.md`](./data-model.md). No build step anywhere.

## Prerequisites

- Node.js 20+ and Playwright (`npm install && npx playwright install`).
- Static server: `python3 -m http.server 8080` (or `npm run serve`).
- The game's assets present (`assets/models/car.glb` — reused by the roadmap).

---

## V1 — The red car faces forward

```bash
python3 -m http.server 8080
# open http://localhost:8080, roadmap → Enter to start level 1
```

**Expected**: the red car's front points **towards the exit side** in every level; other vehicles
look exactly as before (FR-001/002).

## V2 — The 3D roadmap renders

**Expected**: on load you see a dark 3D scene with a winding **serpentine road**, 10 **nodes**
(circles), difficulty regions colour-coded with a caption, and a small **red car** resting on node 1.
No console errors.

## V3 — Driving and turning around

**Expected**: pressing **ArrowUp** moves the car along the road to the next node (~0.9 s) and it
stops **exactly on the node**. Pressing **ArrowDown** moves it back and the car **turns around** mid-
travel. Rapid presses never leave the car between nodes (FR-004/005/006).

## V4 — Locked levels and boundaries

**Expected**: nodes ahead of the unlocked range are **dimmed** and unreachable; at the first/last
reachable node, the arrow gives **blocked feedback** and nothing moves (FR-016).

## V5 — Highlight and selection

**Expected**: the node the car rests on is always marked by the **pulsing ring**; the highlight
follows the car on every move (FR-008). The caption shows the level name + region.

## V6 — Starting a level

**Expected**: pressing **Enter** (or **Space**, or clicking the resting node, or the "Jouer" button)
opens the current level; gameplay, rules, and HUD are unchanged (FR-009, FR-012).

## V7 — Progress and persistence

**Expected**: win a level → return to the roadmap → the car is on the newly unlocked node and the
solved node is marked. Reload the page → the car is still on the saved node (FR-011, SC-006).

## V8 — Touch (optional, manual)

**Expected**: on a touch device you see on-screen ▲/▼ buttons and a "Jouer" button; tapping a node
drives there and "Jouer" starts the level (FR-013).

---

## Automated gates

```bash
# Pure layout/path math + red-yaw rule (no browser)
node --test

# Roadmap rendering/navigation/tests + ALL existing suites (updated open-first-level helper)
npx playwright test
```

**Expected**: both pass. New/rewritten specs: `tests/unit/roadmap-layout.test.js`,
`tests/unit/red-orientation.test.js`, `tests/e2e/roadmap.spec.js` (nodes, locked dim, arrows,
highlight, start, persistence); the other e2e specs use the shared "open first level via Enter"
helper so none regress.

## Done when

- [ ] V1–V8 observed locally (V8 on a touch device if available).
- [ ] `node --test` passes, including the new layout/red-yaw tests.
- [ ] `npx playwright test` passes — roadmap spec plus all existing suites.
- [ ] No challenge, rule, solving, or in-game interaction change (existing gameplay tests green).