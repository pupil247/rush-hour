import * as THREE from 'three';
import { lengthForKind } from '../core/rules.js';

const PALETTE = [0x3aa0ff, 0xffc233, 0x42d392, 0xb069ff, 0xff8b3d, 0x36c5d6, 0x8bc34a];

function colorFor(id, isRed) {
  if (isRed) return 0xd21f2a;
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
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

export function createVehicleMesh(vehicle) {
  const length = lengthForKind(vehicle.kind);
  const bodyW = vehicle.orientation === 'H' ? length * 0.88 : 0.8;
  const bodyD = vehicle.orientation === 'H' ? 0.8 : length * 0.88;

  const geometry = new THREE.BoxGeometry(bodyW, 0.55, bodyD);
  const material = new THREE.MeshStandardMaterial({
    color: colorFor(vehicle.id, vehicle.isRed),
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
  return mesh;
}

export function createVehicles(scene) {
  const group = new THREE.Group();
  scene.add(group);
  return group;
}

/** Rebuild vehicle meshes to match the vehicle list. Returns a map id -> mesh. */
export function syncVehicles(group, vehicles) {
  group.clear();
  const meshes = new Map();
  for (const vehicle of vehicles) {
    const mesh = createVehicleMesh(vehicle);
    group.add(mesh);
    meshes.set(vehicle.id, mesh);
  }
  return meshes;
}
