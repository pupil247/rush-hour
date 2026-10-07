# Contract: Vehicle Model Asset (`.glb`)

**Feature**: `003-real-vehicle-models` | **Version**: 1.0.0

This contract defines what a bundled vehicle model file must satisfy. Any `.glb` that replaces
`car.glb` or `truck.glb` MUST meet these requirements, or the fit/recolor/fallback logic may degrade.

---

## Location and naming

| Path | Kind | Footprint |
|------|------|-----------|
| `assets/models/car.glb` | car | 2 cells |
| `assets/models/truck.glb` | truck | 3 cells |
| `assets/models/ATTRIBUTION.md` | — | Records source, author, license, and retrieval date for each file |

- Paths are fixed so the render layer can resolve them via `import.meta.url` (no configuration).
- Exactly one car file and one truck file are required for the feature's happy path; missing files are
  a supported (fallback) state, not an error.

## File requirements

1. **Format**: binary glTF 2.0 (`.glb`), self-contained (embedded buffers and textures).
2. **Compression**: none. No Draco mesh compression, no KTX2/Basis textures, no external `.bin` or
   image sidecars. The file MUST load with a bare `GLTFLoader`.
3. **Size budget**: ≤ ~250 KB per file (≤ ~500 KB total) so first play is not blocked.
4. **Units/orientation**: Y-up; the model's "forward" axis is documented in `ATTRIBUTION.md`. The fit
   step rotates to the movement axis, so any consistent forward axis is acceptable.
5. **Origin & grounding**: the model's origin SHOULD be at the centre of its footprint on the ground
   plane (wheels at y = 0). The fit step normalizes this, but a sane origin keeps the result stable.
6. **No baked scene transforms**: apply scale/rotation in the authoring tool before export; the loader
   will not "bake" a scene graph and stray transforms confuse bounding-box fitting.
7. **LOD**: single LOD only; low-poly (target ≤ ~5,000 triangles) so many clones stay cheap.
8. **Materials**:
   - MUST have at least one mesh with a material.
   - SHOULD include a **body material** whose name case-insensitively contains `body`, `paint`, `car`,
     or `truck`. This is the material that gets the per-vehicle color.
   - Glass, wheels, and trim SHOULD use distinct material names (e.g. `glass`, `wheel`, `tire`,
     `chrome`) so they are preserved, not tinted.
   - If no body material is named, the largest mesh by bounding-box volume is tinted instead.

## Licensing

- The model MUST be distributable under a license that permits bundling and modification for this
  project (CC0 preferred). The license and source MUST be recorded in `ATTRIBUTION.md`.
- The shipped file MUST be the authored file — no conversion, re-encoding, or packing (constitution
  Principle III as amended in v1.1.0).

## Acceptance checks

- [ ] `car.glb` and `truck.glb` exist under `assets/models/` and load with `GLTFLoader`.
- [ ] Each contains ≥ 1 mesh with a material; each is ≤ ~250 KB.
- [ ] Neither uses Draco/KTX2 or references external files.
- [ ] `ATTRIBUTION.md` lists source, author, license, and date for both files.
- [ ] On the board, a car occupies 2 cells and a truck 3 cells with no visual overflow.
