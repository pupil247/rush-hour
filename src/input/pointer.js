import * as THREE from 'three';
import { legalDeltas } from '../core/moves.js';
import { vehicleCenter } from '../render/vehicles.js';

// Drag a vehicle along its own axis. The distance is clamped to the core's legal deltas,
// so sideways motion is impossible by construction.
export function createPointerInput({ canvas, camera, getState, onSelect, onMove, onBlocked }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
  let drag = null;

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickVehicle() {
    raycaster.setFromCamera(pointer, camera);
    const group = getState().three.vehicleGroup;
    if (!group) return null;
    const hits = raycaster.intersectObjects(group.children, false);
    return hits[0]?.object ?? null;
  }

  function planePoint() {
    raycaster.setFromCamera(pointer, camera);
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, point) ? point : null;
  }

  function previewAt(vehicle, chosen) {
    const preview = { ...vehicle };
    if (vehicle.orientation === 'H') preview.col = vehicle.col + chosen;
    else preview.row = vehicle.row + chosen;
    return vehicleCenter(preview);
  }

  function onPointerDown(event) {
    updatePointer(event);
    const hit = pickVehicle();
    if (!hit) {
      onSelect(null);
      return;
    }
    const id = hit.userData.vehicleId;
    onSelect(id);
    const vehicles = getState().attempt.vehicles;
    const vehicle = vehicles.find((v) => v.id === id);
    const point = planePoint();
    if (!vehicle || !point) return;
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is best-effort; dragging still works without it.
    }
    drag = { id, vehicle, startX: point.x, startZ: point.z, chosen: 0, mesh: hit };
  }

  function onPointerMove(event) {
    if (!drag) return;
    updatePointer(event);
    const point = planePoint();
    if (!point) return;
    const dx = point.x - drag.startX;
    const dz = point.z - drag.startZ;
    const desired = drag.vehicle.orientation === 'H' ? Math.round(dx) : Math.round(dz);

    let chosen = 0;
    if (desired !== 0) {
      const options = legalDeltas(getState().attempt.vehicles, drag.id).filter(
        (d) => Math.sign(d) === Math.sign(desired),
      );
      if (options.length) {
        chosen = options.reduce((best, d) =>
          Math.abs(d - desired) < Math.abs(best - desired) ? d : best,
        );
      }
    }
    drag.chosen = chosen;
    const center = previewAt(drag.vehicle, chosen);
    drag.mesh.position.x = center.x;
    drag.mesh.position.z = center.z;
  }

  function endDrag() {
    if (!drag) return;
    const finished = drag;
    drag = null;
    if (finished.chosen !== 0) {
      onMove(finished.id, finished.chosen);
    } else {
      const center = vehicleCenter(finished.vehicle);
      finished.mesh.position.x = center.x;
      finished.mesh.position.z = center.z;
      onBlocked?.();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  // Touch dragging should not scroll the page.
  canvas.style.touchAction = 'none';
}
