# Phase 1 Data Model: Realistic Vehicle Models

**Feature**: `003-real-vehicle-models` | **Date**: 2026-10-07

This feature is presentation-only, so the "data" is the in-memory render structures and the static
asset files — not persisted game data. Game state (`challenges.json`, progress in `localStorage`) is
unchanged.

---

## Entities

### VehicleTemplate

A loaded, un-fitted model shared by all vehicles of one type.

| Field | Type | Description |
|-------|------|-------------|
| `kind` | `'car' \| 'truck'` | Which vehicle type this template represents (2 cells / 3 cells). |
| `object` | `THREE.Group` | The decoded glTF scene, cached and never added to the scene directly (clones are). |
| `size` | `{ x: number, y: number, z: number }` | Axis-aligned bounding-box dimensions of `object`, in model units. |
| `sourceUrl` | `string` | Resolved URL the template was loaded from (diagnostics only). |

**Validation rules**
- `object` MUST be non-empty and contain at least one mesh; otherwise the template is treated as
  unavailable and the fallback is used.
- `size` components MUST be finite and `> 0`.
- Templates are loaded at most once per session and reused (cache).

### ModelCatalog

The session cache of loaded templates.

| Field | Type | Description |
|-------|------|-------------|
| `car` | `VehicleTemplate \| null` | The car template, or `null` if it failed to load. |
| `truck` | `VehicleTemplate \| null` | The truck template, or `null` if it failed to load. |

**Validation rules**
- A `null` entry is a valid state and MUST NOT be treated as an error; it selects the fallback path.

### FitTransform

The pure, testable output of `fitVehicleModel`.

| Field | Type | Description |
|-------|------|-------------|
| `scale` | `number` | Uniform scale to apply to the template so its length fits the grid footprint. |
| `rotationY` | `number` | Y-axis rotation (radians) aligning the model's forward axis with the movement axis. |
| `offset` | `{ x: number, y: number, z: number }` | Translation to centre and ground the model on the board cell. |

**Rules**
- `scale` is uniform (never per-axis) to avoid distortion.
- The fitted bounding box length MUST equal the vehicle footprint length (`cells * FILL`, where
  `cells = lengthForKind(kind)` and `FILL ≈ 0.88`), and the width MUST NOT exceed `≈ 1` cell.
- `offset.y` grounds the model so it sits on the board surface, not floating or sunken.
- For `orientation === 'H'` the model's length runs along world X; for `'V'` along world Z.

### VehicleInstance *(existing, from the pure core — unchanged)*

The logical vehicle: `{ id, kind, orientation, row, col, isRed }`. This feature adds no fields to it.

### VehicleObject

The render-side object for one vehicle on the board: the unit that animation, selection, and picking
operate on.

| Field | Type | Description |
|-------|------|-------------|
| `object` | `THREE.Group` | Wrapper placed at the vehicle's world position; `userData.vehicleId` and `userData.isRed` are set here. |
| `children` | `Array<THREE.Object3D>` | Either one fitted, recolored model clone, or one procedural fallback mesh. |
| `position` | `Vector3` | World position from `vehicleCenter(vehicle)` with the grounded Y. |

**Rules**
- `object.userData.vehicleId === vehicle.id` for every vehicle; picking resolves to this object.
- The body material's color equals `colorFor(vehicle.id, vehicle.isRed)`; `isRed` vehicles use the
  reserved red and remain unique on the board.
- `object` MUST exist and be visible even when no template is available (fallback).

### FallbackRepresentation

The procedural box produced by the existing `createVehicleMesh` logic (a `THREE.Mesh` with the
vehicle color and red emissive when applicable).

**Rules**
- Used whenever the relevant template is `null` or fails to build.
- Must obey the same footprint/grounding rules as a fitted model so play and picking are unaffected.

### SelectionState *(existing, from feature 002 — unchanged)*

`{ highlightedId, selectedId }` produced by the pure `src/input/selection.js` reducer. The highlight
is applied on top of whichever representation (model or fallback) is present.

---

## Relationships

```text
ModelCatalog 1 ──< 2 VehicleTemplate        (one car + one truck)
VehicleTemplate 1 ──< N VehicleObject       (templates are cloned per vehicle)
VehicleInstance 1 ── 1 VehicleObject        (position, orientation, color)
VehicleObject 1 ── 1 (fitted model clone | FallbackRepresentation)
SelectionState 1 ── 0..1 VehicleObject      (selectedId / highlightedId)
```

---

## State transitions

### Template lifecycle

```text
absent ──load ok──▶ ready ──clone──▶ per-vehicle clone
   │
   └──load fails / empty──▶ unavailable ──▶ fallback box (play continues)
```

### Vehicle build (per board sync)

```text
syncVehicles(vehicles, catalog)
  for each vehicle:
    template = catalog[kind]
    if template: object = clone, fit (FitTransform), recolor body
    else:        object = fallback box
    place at vehicleCenter(vehicle), tag userData.vehicleId / isRed
```

### Highlight (unchanged from 002, made model-agnostic)

```text
none → scale 1.0, default body color
highlighted (browsing) → scale factor, subtle emissive on the body material(s)
selected → larger scale, stronger emissive on the body material(s)
```

---

## Persisted data

None. No `localStorage`, schema, or `challenges.json` changes. If a model is replaced later, only the
static file and `ATTRIBUTION.md` change.
