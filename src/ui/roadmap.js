// Roadmap screen (3D): hosts <canvas id="roadmap-scene"> inside #screen, builds the serpentine
// track, drives the small red car, and wires navigation/start. The old flat DOM list is gone.
import { STRINGS } from './strings.fr.js';
import { playBlocked } from '../audio.js';
import { createRoadmapControl } from '../input/roadmap-control.js';

export async function showRoadmap({ order, challenges, roadmap, onStartLevel }) {
  const canvas = document.getElementById('roadmap-scene');
  const [layoutMod, sceneMod, modelsMod] = await Promise.all([
    import('../render/roadmap-layout.js'),
    import('../render/roadmap-scene.js'),
    import('../render/models.js'),
  ]);

  const byId = new Map(challenges.map((c) => [c.id, c]));
  const stopsById = new Map(roadmap.stops.map((s) => [s.id, s]));
  const border = roadmap.currentIndex; // furthest unlocked index

  const levels = order.map((id) => {
    const challenge = byId.get(id);
    return { id, difficulty: challenge.difficulty };
  });

  const track = layoutMod.buildTrack(levels);
  const nodeStates = order.map((id) => {
    const stop = stopsById.get(id);
    return { locked: !stop.unlocked, solved: stop.solved, current: stop.current };
  });

  // Small red car clone of the game's car model (best-effort: the roadmap still works without it).
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

  const scene = sceneMod.createRoadmapScene(canvas, {
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

  // Screen chrome ----------------------------------------------------------
  const title = document.getElementById('roadmap-title');
  const subtitle = document.getElementById('roadmap-subtitle');
  const pill = document.getElementById('roadmap-pill');
  const actions = document.getElementById('roadmap-actions');
  const hint = document.getElementById('roadmap-hint');
  const playBtn = document.getElementById('roadmap-play');
  const prevBtn = document.getElementById('roadmap-prev');
  const nextBtn = document.getElementById('roadmap-next');

  title.textContent = STRINGS.appTitle;
  subtitle.textContent = STRINGS.roadmapTitle;
  pill.hidden = false;
  actions.hidden = false;
  hint.hidden = false;
  const coarse = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
  hint.textContent = coarse ? STRINGS.roadmapHintTouch : STRINGS.roadmapHintDesktop;

  function updateUi(index) {
    const id = order[index];
    const challenge = byId.get(id);
    const stop = stopsById.get(id);
    const badge = stop.solved ? ' ✅' : stop.locked ? ' 🔒' : '';
    pill.textContent = `${challenge.difficulty} · ${challenge.name}${badge}`;
  }
  updateUi(roadmap.currentIndex);

  function stepTo(direction) {
    if (scene.isTraveling()) return; // queue-once: ignored while driving (never rests on a line)
    const current = scene.carIndex();
    const next = current + direction;
    if (next < 0 || next > border) {
      playBlocked();
      return;
    }
    scene.travel(current, next);
  }

  function startCurrent() {
    onStartLevel(order[scene.carIndex()]);
  }

  const control = createRoadmapControl({ onStep: stepTo, onStart: startCurrent });

  const onCanvasClick = (event) => {
    const index = scene.pickNode(event.clientX, event.clientY);
    if (index == null || scene.isTraveling()) return;
    if (index === scene.carIndex()) {
      startCurrent(); // clicking the resting node starts the level
      return;
    }
    if (index > border) return; // locked nodes are unreachable
    scene.travel(scene.carIndex(), index);
  };
  canvas.addEventListener('click', onCanvasClick);
  playBtn.addEventListener('click', startCurrent);
  prevBtn.addEventListener('click', () => stepTo(-1));
  nextBtn.addEventListener('click', () => stepTo(1));

  if (new URLSearchParams(location.search).has('test')) {
    globalThis.__rushHourRoadmap = {
      currentIndex: () => scene.carIndex(),
      carIndex: () => scene.carIndex(),
      nodeCount: () => order.length,
      nodeStates: () => nodeStates,
      isTraveling: () => scene.isTraveling(),
      hasRing: () => scene.hasRing(),
      startLevel: (index) => onStartLevel(order[index]),
    };
  }

  scene.start();

  return {
    dispose() {
      control.dispose();
      canvas.removeEventListener('click', onCanvasClick);
      playBtn.removeEventListener('click', startCurrent);
      prevBtn.removeEventListener('click', () => stepTo(-1));
      nextBtn.removeEventListener('click', () => stepTo(1));
      scene.dispose();
    },
  };
}