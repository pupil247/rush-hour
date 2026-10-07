# Quickstart Validation: Realistic Vehicle Models

**Feature**: `003-real-vehicle-models` | **Date**: 2026-10-07

Runnable scenarios that prove the feature end-to-end. Details of the contract live in
[`contracts/`](./contracts/) and [`data-model.md`](./data-model.md); this guide only tells you how to
run and what to observe. No build step is used anywhere.

## Prerequisites

- Node.js 20+ (for `node --test`).
- Playwright installed: `npm install && npx playwright install` (browser tests only).
- The feature's asset files present: `assets/models/car.glb`, `assets/models/truck.glb`,
  `assets/models/ATTRIBUTION.md` (see [`contracts/model-asset.md`](./contracts/model-asset.md)).
- A static server: `python3 -m http.server 8080` (or `npm run serve`).

---

## V1 — The board shows car and truck models

```bash
python3 -m http.server 8080
# open http://localhost:8080, click "Premier virage"
```

**Expected**: every 2-cell vehicle is a recognizable **car** and every 3-cell vehicle a recognizable
**truck**; no console errors. If models are missing, see V6 (fallback) — the game must still run.

## V2 — Footprints and grounding

**Expected**: a car occupies exactly **2 cells** and a truck exactly **3 cells** with no visible
overflow into neighbouring cells; vehicles sit **on** the board (wheels at board level), not floating
or sunk; horizontal vehicles run left–right and vertical ones front–back.

## V3 — Colors and the red car

**Expected**: each vehicle has a distinct body color; exactly **one** vehicle is red and it is the
puzzle's red car. Wheels/windows are not tinted with the body color.

## V4 — Highlight over models

**Expected**: pressing an arrow while nothing is selected moves a light browse highlight between
vehicles; pressing **Space** promotes that vehicle to a stronger selected highlight; pressing **Space**
again returns to browsing. The highlight is clearly visible on top of the model.

## V5 — Gameplay is unchanged

**Expected**: click-to-select and drag-to-move still work; legal/illegal moves behave as before; the
move counter, timer, undo/redo/reset, reveal, and return-to-roadmap all still work; solving still wins.

## V6 — Fallback when a model is unavailable (must remain playable)

Simulate a missing/corrupt model, e.g. temporarily rename `assets/models/car.glb`, then reload and open
a level.

**Expected**: the board still renders (a simple box vehicle in place of the car), selection, dragging,
movement, and win detection all still work, and there is no unhandled error. Restore the file
afterwards.

## V7 — Static hosting / project subpath

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Also verify the deployed GitHub Pages URL (served from a `/rush-hour/` subpath).

**Expected**: models load in both cases — asset URLs are module-relative, so a subpath deployment
works without configuration.

## V8 — Performance (manual)

**Expected**: moving vehicles and the reveal animation remain smooth on a typical laptop and a
mid-range phone, with no perceptible stutter from model geometry or material cloning.

---

## Automated gates

```bash
# Pure model-fitting math + existing core (no browser needed)
node --test

# Browser behavior: model load, colors, red uniqueness, fallback, no regressions
npx playwright test
```

**Expected**: both suites pass. The browser suite includes a test that intentionally fails the model
request and asserts the fallback keeps the game playable (V6) and one that asserts the red car is
unique and colors are distinct (V3).

## Done when

- [ ] V1–V8 observed on a local static server.
- [ ] `node --test` passes (including the new `tests/unit/models.test.js`).
- [ ] `npx playwright test` passes (including `tests/e2e/models.spec.js`).
- [ ] No rule, challenge, or scoring change (existing tests still green).
