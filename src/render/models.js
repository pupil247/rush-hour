// Model loading, fitting, cloning, and per-vehicle recoloring (the only module that imports the
// GLTFLoader addon). Templates are loaded once and cached; every board vehicle is a clone. A missing
// or failed model degrades to the procedural fallback so the game is always playable.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fitVehicleModel } from './fit.js';

const MODEL_URLS = {
  car: '../../assets/models/car.glb',
  truck: '../../assets/models/truck.glb',
};

// Materials that must never receive the vehicle's body color (they are not the body).
const PROTECTED_MATERIAL =
  /window|glass|tire|tyre|wheel|rim|light|brake|chrome|license|plate|reflect|emissiv|headlight|taillight|black|grey|gray/i;

function boxOf(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    size: { x: size.x, y: size.y, z: size.z },
    center: { x: center.x, y: center.y, z: center.z },
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
  };
}

async function loadOne(loader, url) {
  try {
    const gltf = await loader.loadAsync(url);
    const object = gltf.scene;
    const box = boxOf(object);
    if (!box || !(box.size.x > 0 && box.size.y > 0 && box.size.z > 0)) return null;
    return { object, box, size: box.size, sourceUrl: String(url) };
  } catch (error) {
    console.warn(`[models] could not load ${url}:`, error?.message ?? error);
    return null;
  }
}

/**
 * Load and cache the two vehicle templates. Never throws: a failed/missing model resolves to `null`
 * for that slot, which selects the procedural fallback.
 */
export async function loadVehicleTemplates(baseUrl = import.meta.url) {
  const loader = new GLTFLoader();
  const [car, truck] = await Promise.all([
    loadOne(loader, new URL(MODEL_URLS.car, baseUrl).href),
    loadOne(loader, new URL(MODEL_URLS.truck, baseUrl).href),
  ]);
  return { car, truck };
}

function cloneModel(template) {
  const model = template.object.clone(true);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (Array.isArray(object.material)) object.material = object.material.map((m) => m.clone());
    else if (object.material) object.material = object.material.clone();
  });
  return model;
}

function tintableMaterials(model) {
  const found = [];
  model.traverse((object) => {
    if (!object.isMesh) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material?.color) found.push({ material, object });
  });
  if (!found.length) return [];

  // Prefer materials explicitly named as the body (e.g. "Truck", "Body"). This keeps wheels,
  // glass, and lights untouched and works for solid-material models.
  const named = found.filter((entry) => {
    const name = entry.material.name || '';
    return /body|paint|truck|car/i.test(name) && !PROTECTED_MATERIAL.test(name);
  });
  if (named.length) return [...new Set(named.map((entry) => entry.material))];

  // Otherwise tint the single largest primitive (by local bounding-box volume): for typical
  // car models this is the body shell.
  let best = null;
  let bestVolume = -1;
  for (const entry of found) {
    const geometry = entry.object.geometry;
    if (!geometry) continue;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    const s = geometry.boundingBox.getSize(new THREE.Vector3());
    const volume = s.x * s.y * s.z;
    if (volume > bestVolume) {
      bestVolume = volume;
      best = entry;
    }
  }
  return best ? [best.material] : [];
}

function fromTemplate(template, vehicle, { colorFor, centerFor }) {
  const model = cloneModel(template);
  const fit = fitVehicleModel(template.box, vehicle.kind, vehicle.orientation);
  model.scale.set(fit.scale.x, fit.scale.y, fit.scale.z);
  model.position.set(fit.offset.x, fit.offset.y, fit.offset.z);

  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.rotation.y = fit.rotationY;
  wrapper.userData.centerY = (template.box.size.y * fit.scale.y) / 2;

  const materials = tintableMaterials(model);
  for (const material of materials) material.color.setHex(colorFor(vehicle));
  wrapper.userData.tintMaterials = materials;
  wrapper.userData.isModel = true;

  const center = centerFor(vehicle);
  wrapper.position.set(center.x, 0, center.z);
  return wrapper;
}

/**
 * Build one board vehicle: a fitted, recolored clone of the template, or the fallback when no
 * template is available. Always returns an Object3D tagged with `userData.vehicleId`.
 */
export function createVehicleObject(vehicle, catalog, deps) {
  const template = catalog?.[vehicle.kind] ?? null;
  if (template) {
    const wrapper = fromTemplate(template, vehicle, deps);
    wrapper.userData.vehicleId = vehicle.id;
    wrapper.userData.isRed = vehicle.isRed;
    return wrapper;
  }
  const fallback = deps.createFallback(vehicle);
  fallback.userData.isModel = false;
  return fallback;
}
