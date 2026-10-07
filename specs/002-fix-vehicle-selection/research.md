# Phase 0 Research: Vehicle Selection & Keyboard Controls

## R1. Root cause of the broken mouse interaction

- **Decision**: Fix `src/input/pointer.js` to read the vehicle group as `getState().three.vehicleGroup`
  (currently `getState().vehicleGroup`), which is why `pickVehicle()` throws on `pointerdown`.
- **Rationale**: `main.js` passes `getState: () => state` and the group lives at `state.three.vehicleGroup`.
  The lookup returns `undefined`, `.children` throws, and the handler aborts before any selection.
  Keyboard tests passed because they never exercised pointer selection.
- **Alternatives considered**: Changing `getState` to return a flattened object (larger blast radius);
  making the handler defensive-only (hides the real bug rather than fixing it).

## R2. Where selection state lives

- **Decision**: A new pure reducer module `src/input/selection.js` owns `{ highlightedId, selectedId }`
  and the operations `initial`, `cycle`, `toggle`, `select`, `clear`, `keep`. `main.js` holds the value
  and drives rendering from it.
- **Rationale**: Keeps interaction state testable with `node --test` (Principle IV) and free of DOM/Three.js
  (Principle II), while leaving game rules in `src/core/` untouched.
- **Alternatives considered**: State inline in `main.js` (untestable in isolation); a framework/store
  (adds a dependency, violates the no-build spirit).

## R3. Highlighting

- **Decision**: Add `applySelection(meshes, selection)` to `src/render/vehicles.js`, using two levels:
  a strong emphasis (scale + bright emissive) for the selected car and a lighter emphasis for the
  browsing highlight. `main.js` calls it whenever the selection changes.
- **Rationale**: Satisfies FR-006–FR-009 with no new assets, and keeps material tweaks in the render layer.
- **Alternatives considered**: An outline/post-processing pass (extra complexity for little gain); a DOM
  overlay marker (misaligned with the 3D scene).

## R4. Keyboard model

- **Decision**: Two modes. Browsing (no selection): ←/↑ previous car, →/↓ next car, cycling the
  `highlightedId` in roster order and wrapping. Space selects the highlighted car. Selected: Space
  deselects; an arrow along the car's axis moves it exactly one cell; perpendicular arrows are ignored.
- **Rationale**: Matches the decisions from clarification, is deterministic, and reuses `legalDeltas`
  from the core so illegal presses simply do nothing.
- **Alternatives considered**: Arrows always move with a separate car-switch key (rejected by the user);
  slide-to-farthest on one press (rejected — overshoots).

## R5. Mouse/keyboard shared selection and move persistence

- **Decision**: A single selection value is shared. Clicking a car selects it; dragging also selects then
  moves; clicking empty space clears both. After a move, the moved car stays selected (`keep`).
- **Rationale**: FR-005, FR-017, FR-018. One source of truth prevents mouse/keyboard divergence.
- **Alternatives considered**: Separate mouse hover and keyboard cursor (confusing, two highlights).

## R6. Input lock during animation

- **Decision**: Reuse the existing `state.busy` flag; pointer and keyboard actions are ignored while a
  move or the reveal animation is in progress.
- **Rationale**: FR-019, prevents selection mid-animation and board inconsistency.
- **Alternatives considered**: Queue inputs (complex, unnecessary for this game).

## R7. Testing approach

- **Decision**: Unit-test the selection reducer with `node --test`; add Playwright specs that click a
  canvas car (using known board coordinates), drag it, and drive the two-mode keyboard scheme.
- **Rationale**: Principle IV. The pointer bug was invisible to the old E2E suite because it never
  clicked the canvas; the new specs close that gap.
- **Alternatives considered**: Only keyboard E2E (would not catch the pointer regression).
