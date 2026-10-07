import * as THREE from 'three';
import { lengthForKind } from '../core/rules.js';
import { levelFor } from '../input/selection.js';
import { createVehicleObject } from './models.js';

const PALETTE = [
  0x3aa0ff, 0xffc233, 0x42d392, 0xb069ff, 0xff8b3d, 0x36c5d6,
  0x8bc34a, 0xff6fae, 0x5f6cff, 0x14b8a6, 0xf4a261, 0xc084fc,
];

const SELECTED_SCALE = 1.14;
const HIGHLIGHTED_SCALE = 1.06;
const RED = 0xd21f2a;

/** The reserved red for the red car; other vehicles get colors assigned per board (see syncVehicles). */
export function colorFor(vehicle) {
  if (vehicle.isRed) return RED;
  let hash = 0;
  for (const ch of vehicle.id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return PALETTE[hash % PALETTE.length];
}

export function vehicleCenter(vehicle) {
  const length = lengthForKind(vehicle.kind);
  const half = 3; // boardSize / 2
  if (vehicle.orientation === 'H') {
    return { x: vehicle.col + (length - 1) / 2 - half - 0.5, z: vehicle.row - half - 0.5 };
  }
  return { x: vehicle.col - half - 0.5, z: vehicle.row + (length - 1) / 2 - half - 0.5 };
}

/**
 * Procedural box used when a model template is unavailable. Kept as the guaranteed-playable
 * fallback; it obeys the same footprint and grounding rules as a fitted model.
 */
export function createFallbackVehicle(vehicle, color = colorFor(vehicle)) {
  const length = lengthForKind(vehicle.kind);
  const bodyW = vehicle.orientation === 'H' ? length * 0.88 : 0.8;
  const bodyD = vehicle.orientation === 'H' ? 0.8 : length * 0.88;

  const geometry = new THREE.BoxGeometry(bodyW, 0.55, bodyD);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.15,
    emissive: vehicle.isRed ? 0x4a0004 : 0x000000,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const center = vehicleCenter(vehicle);
  mesh.position.set(center.x, 0.35, center.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.vehicleId = vehicle.id;
  mesh.userData.isRed = vehicle.isRed;
  mesh.userData.isModel = false;
  mesh.userData.centerY = 0.35;
  mesh.userData.tintMaterials = [material];
  return mesh;
}

export function createVehicles(scene) {
  const group = new THREE.Group();
  scene.add(group);
  return group;
}

/** Rebuild vehicle objects to match the vehicle list. Returns a map id -> Object3D. */
export function syncVehicles(group, vehicles, catalog = { car: null, truck: null }) {
  group.clear();
  // Assign distinct palette colors per board (red reserved for the red car) so no two vehicles
  // share a body color even though the palette is finite.
  const colorById = new Map();
  let paletteIndex = 0;
  for (const vehicle of vehicles) {
    if (vehicle.isRed) colorById.set(vehicle.id, RED);
    else {
      colorById.set(vehicle.id, PALETTE[paletteIndex % PALETTE.length]);
      paletteIndex += 1;
    }
  }

  const meshes = new Map();
  for (const vehicle of vehicles) {
    const object = createVehicleObject(vehicle, catalog, {
      colorFor: (v) => colorById.get(v.id) ?? colorFor(v),
      centerFor: vehicleCenter,
      createFallback: (v) => createFallbackVehicle(v, colorById.get(v.id) ?? colorFor(v)),
    });
    group.add(object);
    meshes.set(vehicle.id, object);
  }
  return meshes;
}

function setEmissive(materials, hex) {
  for (const material of materials ?? []) {
    if (material?.emissive) material.emissive.setHex(hex);
  }
}

/**
 * Apply the two-level highlight: a strong emphasis for the selected car and a lighter one for the
 * browsing highlight; all other cars return to their default look. Works for model clones and for
 * fallback meshes (both expose `userData.tintMaterials`).
 */
export function applySelection(meshes, selection) {
  if (!meshes) return;
  for (const [id, mesh] of meshes) {
    const materials = mesh.userData?.tintMaterials;
    const level = levelFor(selection, id);
    if (level === 'selected') {
      mesh.scale.setScalar(SELECTED_SCALE);
      setEmissive(materials, 0x2a6db5);
    } else if (level === 'highlighted') {
      mesh.scale.setScalar(HIGHLIGHTED_SCALE);
      setEmissive(materials, 0x14314f);
    } else {
      mesh.scale.setScalar(1);
      setEmissive(materials, mesh.userData?.isRed ? 0x4a0004 : 0x000000);
    }
  }
}
