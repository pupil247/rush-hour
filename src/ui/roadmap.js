// Roadmap screen (3D): hosts <canvas id="roadmap-scene"> inside #screen, builds the serpentine
// track, drives the small red car, and wires navigation/start. The old flat DOM list is gone.
// Navigation and level start are scene-fail-safe: if the 3D scene cannot be created (bad GPU,
// blocked WebGL) the buttons/keys still work and the level still starts.
import { STRINGS } from './strings.fr.js';
import { playBlocked } from '../audio.js';
import { createRoadmapControl } from '../input/roadmap-control.js';

export async function showRoadmap({ order, challenges, roadmap, onStartLevel }) {
  const canvas = document.getElementById('roadmap-scene');

  // Screen chrome is wired before the scene so the page is never left with no controls.
  const [title, subtitle, pill, actions, hint, playBtn, prevBtn, nextBtn] = [
    'roadmap-title', 'roadmap-subtitle', 'roadmap-pill', 'roadmap-actions',
    'roadmap-hint', 'roadmap-play', 'roadmap-prev', 'roadmap-next',
  ].map((id) => document.getElementById(id));

  const byId = new Map(challenges.map((c) => [c.id, c]));
  const stopsById = new Map(roadmap.stops.map((s) => [s.id, s]));
  const border = roadmap.currentIndex; // furthest unlocked index

  const levels = order.map((id) => {
    const challenge = byId.get(id);
    return { id, difficulty: challenge.difficulty };
  });
  const nodeStates = order.map((id) => {
    const stop = stopsById.get(id);
    return { locked: !stop.unlocked, solved: stop.solved, current: stop.current };
  });

  const [layoutMod, sceneMod, modelsMod] = await Promise.all([
    import('../render/roadmap-layout.js'),
    import('../render/roadmap-scene.js'),
    import('../render/models.js'),
  ]);
  const track = layoutMod.buildTrack(levels);

  // Best-effort car clone: the roadmap still works without it.
  let carModel = null;
  try {
    const templates = await modelsMod.loadVehicleTemplates();
    if (templates.car) {
      carModel = modelsMod.cloneVehicleModel(templates.car);
      modelsMod.tintBody(carModel, 0xd21f2a);
    }
  } catch {
    carModel = null;
  }

  // Scene is optional: anything below must work with scene === null.
  let scene = null;
  try {
    scene = sceneMod.createRoadmapScene(canvas, {
      nodes: track.nodes,
      path: track.path,
      segments: track.segments,
      nodePointIndex: track.nodePointIndex,
      bounds: track.bounds,
      carModel,
    });
    scene.setStates(nodeStates);
    scene.setCurrent(roadmap.currentIndex);
    scene.setOnArrive((index) => updateUi(index));
    scene.start();
  } catch (error) {
    console.warn('[roadmap] 3D scene unavailable, running in fallback mode:', error?.message ?? error);
    scene = null;
  }

  title.textContent = STRINGS.appTitle;
  subtitle.textContent = STRINGS.roadmapTitle;
  pill.hidden = false;
  actions.hidden = false;
  hint.hidden = false;
  const coarse = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
  hint.textContent = coarse ? STRINGS.roadmapHintTouch : STRINGS.roadmapHintDesktop;

  let fallbackIndex = roadmap.currentIndex;

  function updateUi(index) {
    const id = order[index];
    const challenge = byId.get(id);
    const stop = stopsById.get(id);
    const badge = stop.solved ? ' ✅' : stop.locked ? ' 🔒' : '';
    pill.textContent = `${challenge.difficulty} · ${challenge.name}${badge}`;
  }
  updateUi(roadmap.currentIndex);

  const carIndex = () => (scene ? scene.carIndex() : fallbackIndex);
  const isTraveling = () => Boolean(scene?.isTraveling());

  function stepTo(direction) {
    if (isTraveling()) return; // queue-once: ignored while driving (never rests on a line)
    const current = carIndex();
    const next = current + direction;
    if (next < 0 || next > border) {
      playBlocked();
      return;
    }
    if (scene) {
      scene.travel(current, next);
    } else {
      fallbackIndex = next;
      updateUi(next);
    }
  }

  function startCurrent() {
    onStartLevel(order[carIndex()]);
  }

  const control = createRoadmapControl({ onStep: stepTo, onStart: startCurrent });

  const onCanvasClick = (event) => {
    const index = scene?.pickNode(event.clientX, event.clientY);
    if (index == null || isTraveling()) return;
    if (index === carIndex()) {
      startCurrent(); // clicking the resting node starts the level
      return;
    }
    if (index > border) return; // locked nodes are unreachable
    scene.travel(carIndex(), index);
  };
  canvas.addEventListener('click', onCanvasClick);
  playBtn.addEventListener('click', startCurrent);
  prevBtn.addEventListener('click', () => stepTo(-1));
  nextBtn.addEventListener('click', () => stepTo(1));

  if (new URLSearchParams(location.search).has('test')) {
    globalThis.__rushHourRoadmap = {
      currentIndex: () => carIndex(),
      carIndex: () => carIndex(),
      nodeCount: () => order.length,
      nodeStates: () => nodeStates,
      isTraveling,
      hasRing: () => Boolean(scene?.hasRing()),
      startLevel: (index) => onStartLevel(order[index]),
    };
  }

  return {
    dispose() {
      control.dispose();
      canvas.removeEventListener('click', onCanvasClick);
      playBtn.removeEventListener('click', startCurrent);
      prevBtn.removeEventListener('click', () => stepTo(-1));
      nextBtn.removeEventListener('click', () => stepTo(1));
      scene?.dispose();
    },
  };
}