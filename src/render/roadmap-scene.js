// 3D roadmap scene: ground, serpentine ribbon, level nodes, the small red car, travel animation
// and the pulsing highlight ring. Consumes the pure layout from roadmap-layout.js and a cloned
// car template from models.js. Lives on its own <canvas id="roadmap-scene"> so the game path is
// untouched.
import * as THREE from 'three';
import { samplePath } from './roadmap-layout.js';

const REGION_COLORS = {
  Débutant: 0x3aa0ff,
  Intermédiaire: 0xffc233,
  Avancé: 0xb069ff,
  Expert: 0xff8b3d,
  Génie: 0x42d392,
};
const REGION_MISSING = 0x5a6b85; // grey when a region isn't in the map above
const RED = 0xd21f2a;
const CAR_SCALE = 0.28;
const TRAVEL_MS = 900;

// One roadmap renderer for the whole session: repeated show/dispose cycles must never create new
// WebGL contexts (Chrome/SwiftShader chokes on context churn). dispose() only stops the loop.
let sharedRenderer = null;
function getRenderer(canvas) {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    sharedRenderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    sharedRenderer.shadowMap.enabled = true;
    sharedRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return sharedRenderer;
}

function regionColor(difficulty) {
  return REGION_COLORS[difficulty] ?? REGION_MISSING;
}

export function createRoadmapScene(canvas, options) {
  const { nodes, path, segments, nodePointIndex, bounds, carTemplate } = options;
  const renderer = getRenderer(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1622);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const distance = Math.max(bounds.width, bounds.depth);
  camera.position.set(0, distance * 1.45, distance * 1.15);
  camera.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0xf3f7ff, 0x233042, 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(6, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  // Ground ---------------------------------------------------------------
  const spread = Math.max(bounds.width, bounds.depth) + 8;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(spread, spread),
    new THREE.MeshStandardMaterial({ color: 0x18242f, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Ribbon road (triangle strip with per-vertex difficulty colors) --------
  const difficultyAt = [];
  for (let p = 0; p < path.length; p += 1) {
    let seg = 0;
    while (seg < segments.length - 1 && p >= nodePointIndex[seg + 1]) seg += 1;
    difficultyAt.push(segments[seg]?.difficulty ?? nodes[0]?.difficulty ?? '');
  }

  const RIBBON_W = 0.75;
  const positions = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();
  for (let p = 0; p < path.length; p += 1) {
    const prev = path[Math.max(0, p - 1)];
    const next = path[Math.min(path.length - 1, p + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    const c = path[p];
    positions.push(c.x - nx * RIBBON_W, 0.06, c.z - nz * RIBBON_W);
    positions.push(c.x + nx * RIBBON_W, 0.06, c.z + nz * RIBBON_W);
    color.setHex(regionColor(difficultyAt[p]));
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    if (p > 0) {
      const base = (p - 1) * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const ribbon = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05 }),
  );
  const ribbonGeometry = ribbon.geometry;
  ribbonGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  ribbonGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ribbonGeometry.setIndex(indices);
  ribbonGeometry.computeVertexNormals();
  ribbon.receiveShadow = true;
  scene.add(ribbon);

  // Nodes + highlight ring ------------------------------------------------
  const nodeObjects = [];
  for (const node of nodes) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: regionColor(node.difficulty), roughness: 0.7 }),
    );
    disc.position.set(node.position.x, 0.04, node.position.z);
    disc.receiveShadow = true;
    disc.userData.nodeIndex = node.index;
    scene.add(disc);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.035, 8, 48),
      new THREE.MeshStandardMaterial({
        color: 0x3aa0ff,
        emissive: 0x3aa0ff,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.95,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(node.position.x, 0.03, node.position.z);
    ring.visible = false;
    scene.add(ring);
    nodeObjects.push({ disc, ring });
  }

  // The roadmap car (small red clone of the game's car model) -----------------
  const car = new THREE.Group();
  const carModel = options.carModel ?? null;
  if (carModel) {
    car.add(carModel);
    carModel.castShadow = true;
    carModel.receiveShadow = true;
  }
  car.scale.setScalar(CAR_SCALE);
  scene.add(car);

  let currentIndex = 0;
  let travel = null; // { sub, fromIndex, toIndex, elapsed, duration, startYaw, targetYaw }
  let currentYaw = 0;
  let stopped = true;
  let raf = 0;
  let onArrive = null;

  /** Shortest-arc step from a towards b. */
  const stepYaw = (a, b, t) => {
    let diff = (b - a) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  };

  const subPathFor = (from, to) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    let sub = path.slice(nodePointIndex[lo], nodePointIndex[hi] + 1);
    if (to < from) sub = [...sub].reverse();
    return sub;
  };

  const travelTangentYaw = () => {
    const sub = travel.sub;
    let a = sub[0];
    let b = sub[Math.min(1, sub.length - 1)];
    if (travel.toIndex < travel.fromIndex) [a, b] = [b, a];
    return Math.atan2(b.x - a.x, b.z - a.z);
  };

  const placeCarAt = (index, yaw) => {
    const node = nodes[index];
    car.position.set(node.position.x, 0, node.position.z);
    currentYaw = yaw;
    car.rotation.y = yaw;
  };

  const startTravel = (from, to, duration = TRAVEL_MS) => {
    if (from === to) return;
    const startYaw = currentYaw;
    travel = { sub: subPathFor(from, to), fromIndex: from, toIndex: to, elapsed: 0, duration, startYaw, targetYaw: 0 };
    travel.targetYaw = travelTangentYaw();
  };

  const step = (now) => {
    if (stopped) return; // never re-schedule after stop()
    if (travel) {
      travel.elapsed += 16; // approx: rAF at ~60 fps; we advance by fixed dt for determinism
      const t = Math.min(1, travel.elapsed / travel.duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const sample = samplePath(travel.sub, eased);
      car.position.set(sample.position.x, 0, sample.position.z);
      car.rotation.y = stepYaw(travel.startYaw, travel.targetYaw, eased);
      currentYaw = car.rotation.y;
      if (t >= 1) {
        currentIndex = travel.toIndex;
        car.position.set(nodes[travel.toIndex].position.x, 0, nodes[travel.toIndex].position.z);
        travel = null;
        setCurrentVisual();
        if (onArrive) { const cb = onArrive; onArrive = null; cb(currentIndex); }
      }
    }
    // Pulse the highlight ring.
    const pulse = (Math.sin(now * 0.0095) + 1) / 2; // ~1.5 Hz
    for (const nodeItem of nodeObjects) {
      if (nodeItem.ring.visible) {
        nodeItem.ring.scale.setScalar(1 + pulse * 0.25);
        nodeItem.ring.material.emissiveIntensity = 0.6 + pulse * 1.1;
      }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(step);
  };

  const setCurrentVisual = () => {
    for (let i = 0; i < nodeObjects.length; i += 1) {
      nodeObjects[i].ring.visible = i === currentIndex;
    }
  };

  const resize = () => {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const roadPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      resize();
      window.addEventListener('resize', resize);
      // Re-measure after the first layout pass (canvas may size in late).
      requestAnimationFrame(resize);
      raf = requestAnimationFrame(step);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
    dispose() {
      // Stop the loop and drop scene references; NEVER destroy the shared renderer or force a
      // context loss (context churn breaks gameplay on software WebGL).
      this.stop();
    },
    setCurrent(index, yawOffset = 0) {
      currentIndex = index;
      if (index < nodes.length) {
        const node = nodes[index];
        // Face along the track's forward direction at this node.
        const forward = Math.min(index + 1, nodes.length - 1);
        const sub = subPathFor(index, forward);
        const sample = samplePath(sub, 0.5);
        const yaw = Math.atan2(sample.tangent.x, sample.tangent.z) + yawOffset;
        placeCarAt(index, yaw);
      }
      setCurrentVisual();
    },
    setStates(nodeStates) {
      for (let i = 0; i < nodeObjects.length && i < nodeStates.length; i += 1) {
        const { disc, ring } = nodeObjects[i];
        const state = nodeStates[i] ?? {};
        const mat = disc.material;
        if (state.locked) {
          mat.color.setHex(0x3a4654);
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.emissive && mat.emissive.setHex(0x000000);
        } else {
          mat.transparent = false;
          mat.opacity = 1;
          mat.color.setHex(regionColor(nodes[i].difficulty));
          if (state.solved) mat.emissive?.setHex(0x174f26);
          else mat.emissive?.setHex(0x000000);
        }
        ring.visible = Boolean(state.current);
      }
      currentIndex = nodeStates.findIndex((s) => s?.current);
      if (currentIndex < 0) currentIndex = 0;
    },
    travel(from, to, duration) {
      startTravel(from, to, duration);
    },
    isTraveling() {
      return Boolean(travel);
    },
    setOnArrive(cb) {
      onArrive = cb;
    },
    carIndex() {
      return currentIndex;
    },
    hasRing() {
      return nodeObjects[currentIndex]?.ring.visible ?? false;
    },
    pickNode(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(roadPlane, hit)) return null;
      let best = null;
      let bestDist = Infinity;
      for (const node of nodes) {
        const d = Math.hypot(node.position.x - hit.x, node.position.z - hit.z);
        if (d < 0.6 && d < bestDist) {
          bestDist = d;
          best = node.index;
        }
      }
      return best;
    },
    _renderer: renderer,
  };
}