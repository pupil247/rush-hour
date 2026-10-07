import * as THREE from 'three';

// Top-down, slightly tilted camera framing the 6x6 board. Tilt is modest so taller 3D models do
// not occlude the vehicles behind them for picking or play.
export function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 12.5, 5);
  camera.lookAt(0, 0, 0.15);
  return camera;
}

export function resize(renderer, camera, width, height) {
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
