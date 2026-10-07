# Contract: Vehicle Rendering Interface

**Feature**: `003-real-vehicle-models` | **Version**: 1.0.0

This is an internal module contract (JavaScript) inside the static app. It defines the public surface
of `src/render/models.js` and the behavior expected from `src/render/vehicles.js` after the change.
There is no network/service API for this feature.

---

## `src/render/models.js` (NEW)

```js
// Load the two templates once. Never throws: a failed/missing model yields null for that slot.
export async function loadVehicleTemplates(baseUrl = import.meta.url): Promise<{
  car: VehicleTemplate | null,
  truck: VehicleTemplate | null,
}>

// Pure: no Three.js. Given a model's bounding-box size, return the fit transform.
// kind: 'car' | 'truck'  orientation: 'H' | 'V'
export function fitVehicleModel(
  size: { x: number, y: number, z: number },
  kind: 'car' | 'truck',
  orientation: 'H' | 'V',
): { scale: number, rotationY: number, offset: { x: number, y: number, z: number } }

// Build one board vehicle: a fitted, recolored clone of the template, or a fallback box.
// Always returns an Object3D with userData.vehicleId and a valid .position.
export function createVehicleObject(
  vehicle: VehicleInstance,
  catalog: { car: VehicleTemplate | null, truck: VehicleTemplate | null },
  { colorFor, createFallback }: {
    colorFor: (vehicle: VehicleInstance) => number,
    createFallback: (vehicle: VehicleInstance) => THREE.Object3D,
  },
): THREE.Object3D
```

### Behavior

- `loadVehicleTemplates` resolves `car.glb` / `truck.glb` relative to the module URL, loads both in
  parallel, computes each bounding-box `size`, and caches the result. A load/parse failure or an empty
  model resolves that slot to `null` (the game MUST remain playable).
- `fitVehicleModel` is deterministic and side-effect-free; it uses the same footprint constants as the
  procedural vehicle (length = `lengthForKind(kind) * 0.88`, width ≤ 1 cell) and grounds the model.
- `createVehicleObject`:
  - If the template for `vehicle.kind` exists: `template.object.clone(true)`, apply the `FitTransform`
    from `fitVehicleModel`, clone materials and tint the body material to `colorFor(vehicle)`, keep
    non-body materials untouched, enable `castShadow`/`receiveShadow`, and wrap in a group tagged with
    `userData.vehicleId` / `userData.isRed`.
  - Otherwise: return `createFallback(vehicle)` (the existing procedural box) tagged the same way.

## `src/render/vehicles.js` (EDIT)

```js
export function syncVehicles(group, vehicles, catalog): Map<string, THREE.Object3D>
export function applySelection(meshes, selection): void   // now model-agnostic
```

### Behavior

- `syncVehicles` builds each vehicle via `createVehicleObject` and returns the `id → object` map. It
  stays **synchronous** (templates are pre-cached).
- `applySelection` MUST work whether an entry is a model group or a fallback mesh:
  - `selected` → larger uniform scale; set emissive on the vehicle's tintable (body) material(s).
  - `highlighted` (browsing) → smaller emphasis; subtle emissive on the same material(s).
  - `none` → scale 1 and restore the vehicle's default emissive (red cars keep their red emissive).
  - It MUST find tintable materials by traversing the object, not by assuming a lone `.material`.

## `src/input/pointer.js` (EDIT)

- Picking MUST use `raycaster.intersectObjects(group.children, true)` (recursive) and resolve the hit to
  the ancestor whose `userData.vehicleId` is set.
- Drag/animation MUST move that ancestor (the vehicle root), which has a valid `.position`.

## `src/main.js` (WIRE)

- `initThree` calls `loadVehicleTemplates()` once and stores the `ModelCatalog` in `state`.
- `syncVehicles` is called with the catalog.
- No behavior change to rules, moves, scoring, undo/redo/reset, HUD, or the roadmap.

## Invariants (must hold after every board sync)

1. `state.meshes` has exactly one entry per `attempt.vehicles`.
2. Every entry is a visible `Object3D` at `vehicleCenter(vehicle)` with `userData.vehicleId === id`.
3. Exactly one body color per vehicle matches `colorFor(id, isRed)`; exactly one `isRed` vehicle exists.
4. If both templates are `null`, the board still renders, is selectable/draggable/movable, and win
   detection is unchanged.
5. No unhandled error reaches `window.onerror` when a model is missing or corrupt.
