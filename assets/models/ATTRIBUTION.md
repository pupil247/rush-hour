# Vehicle model attribution

The bundled vehicle models under `assets/models/` are third-party assets. This file records their
source, author, and license, as required by `specs/003-real-vehicle-models/contracts/model-asset.md`.

## `car.glb`

- **Model**: "Car" (low-poly, single-hulled sedan)
- **Author**: Quaternius (https://quaternius.com)
- **Source**: https://poly.pizza/m/unqqkULtRU
- **License**: Creative Commons Zero (CC0 1.0) — Public Domain
  (https://creativecommons.org/publicdomain/zero/1.0/)
- **Retrieved**: 2026-10-07

## `truck.glb`

- **Model**: "Military Truck - 2D/3D Collab"
- **Author**: Alex Safayan
- **Source**: https://poly.pizza/m/3XAD5t0Djqv
- **License**: Creative Commons Attribution 3.0 (CC-BY 3.0) — https://creativecommons.org/licenses/by/3.0/
- **Retrieved**: 2026-10-07

## Notes

- Both files are shipped as authored (binary glTF, uncompressed). The game scales and recolors a
  clone of each at runtime; the original files are unmodified.
- Body recoloring targets the model's body material (`LightBlue` for the car, `Truck` for the truck);
  wheels, glass, and lights are left untouched.
