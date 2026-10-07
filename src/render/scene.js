import * as THREE from 'three';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1622);

  const hemi = new THREE.HemisphereLight(0xf3f7ff, 0x233042, 1.0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  scene.add(key);

  return { renderer, scene };
}

export function createRenderLoop(renderer, scene, camera) {
  let running = true;
  function frame() {
    if (!running) return;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    stop() {
      running = false;
    },
  };
}
