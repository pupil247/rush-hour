import * as THREE from 'three';
import { vehicleCenter } from './vehicles.js';

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function tweenTo(mesh, target, duration = 180) {
  return new Promise((resolve) => {
    const start = mesh.position.clone();
    const from = performance.now();
    function step(now) {
      const t = Math.min(1, (now - from) / duration);
      const e = easeInOut(t);
      mesh.position.set(
        start.x + (target.x - start.x) * e,
        start.y + (target.y - start.y) * e,
        start.z + (target.z - start.z) * e,
      );
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

/** Animate a single vehicle mesh to the world position implied by a vehicle snapshot. */
export function animateMove(mesh, vehicle, duration = 180) {
  const c = vehicleCenter(vehicle);
  return tweenTo(mesh, new THREE.Vector3(c.x, mesh.position.y, c.z), duration);
}

export async function playSolution(meshes, initialVehicles, solution, applyMove, stepMs = 420) {
  let vehicles = initialVehicles.map((v) => ({ ...v }));
  for (const mv of solution) {
    vehicles = applyMove(vehicles, mv);
    const moved = vehicles.find((v) => v.id === mv.vehicleId);
    const mesh = meshes.get(mv.vehicleId);
    if (mesh && moved) await animateMove(mesh, moved, stepMs);
  }
  return vehicles;
}
