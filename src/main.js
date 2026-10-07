// App orchestration: ties the pure core to the Three.js layer, input, UI, audio, and progress.
// The 3D layer is imported lazily so the roadmap (DOM only) renders without waiting on the CDN.
import { buildRoadmap, loadCatalog } from './data/challenges.js';
import { loadProgress, recordCompletion, saveProgress } from './progress.js';
import * as game from './core/game.js';
import { applyMove } from './core/moves.js';
import {
  clear as clearSelection,
  cycle as cycleSelectionState,
  initial as initialSelection,
  keep as keepSelection,
  reconcile as reconcileSelection,
  select as selectState,
  toggle as toggleSelectionState,
} from './input/selection.js';
import { renderRoadmap } from './ui/roadmap.js';
import { createHud } from './ui/hud.js';
import { createDialogs } from './ui/dialogs.js';
import * as audio from './audio.js';

const state = {
  catalog: null,
  progress: null,
  roadmap: null,
  challenge: null,
  attempt: null,
  selection: { highlightedId: null, selectedId: null },
  three: null,
  meshes: null,
  hud: null,
  busy: false,
  elapsed: 0,
  running: false,
  lastTick: 0,
};

let dialogs = null;
let timerHandle = null;

const el = (id) => document.getElementById(id);

/* ---------------------------------------------------------------- timer */

function startTimer() {
  state.running = true;
  state.lastTick = performance.now();
  if (!timerHandle) timerHandle = setInterval(tick, 250);
}

function stopTimer() {
  state.running = false;
}

function tick() {
  const now = performance.now();
  if (state.running) state.elapsed += (now - state.lastTick) / 1000;
  state.lastTick = now;
  updateHud();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (state.running) state.elapsed += (performance.now() - state.lastTick) / 1000;
    state.running = false;
  } else if (state.challenge && state.attempt?.status === 'playing') {
    state.running = true;
    state.lastTick = performance.now();
  }
});

/* --------------------------------------------------------------- 3D setup */

async function initThree() {
  if (state.three) return state.three;
  const [sceneMod, cameraMod, boardMod, vehiclesMod, animMod, pointerMod, keyboardMod] = await Promise.all([
    import('./render/scene.js'),
    import('./render/camera.js'),
    import('./render/board3d.js'),
    import('./render/vehicles.js'),
    import('./render/animation.js'),
    import('./input/pointer.js'),
    import('./input/keyboard.js'),
  ]);

  const canvas = el('scene');
  const { renderer, scene } = sceneMod.createScene(canvas);
  const camera = cameraMod.createCamera(canvas.clientWidth || 800, canvas.clientHeight || 600);
  boardMod.createBoard(scene);
  const vehicleGroup = vehiclesMod.createVehicles(scene);
  sceneMod.createRenderLoop(renderer, scene, camera);

  state.three = {
    renderer,
    scene,
    camera,
    vehicleGroup,
    canvas,
    syncVehicles: vehiclesMod.syncVehicles,
    applySelection: vehiclesMod.applySelection,
    animateMove: animMod.animateMove,
    playSolution: animMod.playSolution,
    resize: cameraMod.resize,
  };

  pointerMod.createPointerInput({
    canvas,
    camera,
    getState: () => state,
    onSelect: selectVehicle,
    onMove: doMove,
    onBlocked: () => audio.playBlocked(),
  });

  keyboardMod.createKeyboardInput({
    getSelection: () => state.selection,
    getVehicles: () => state.attempt?.vehicles ?? [],
    onCycle: cycleSelection,
    onToggle: toggleSelection,
    onMove: doMove,
    onBlocked: () => audio.playBlocked(),
    onUndo: undo,
    onRedo: redo,
    onReset: reset,
    onReveal: reveal,
  });

  window.addEventListener('resize', resizeThree);
  exposeTestHandle();
  return state.three;
}

function resizeThree() {
  if (!state.three) return;
  const canvas = el('scene');
  state.three.resize(state.three.renderer, state.three.camera, canvas.clientWidth || 800, canvas.clientHeight || 600);
}

// Test-only handle, exposed only when the URL carries ?test (used by the Playwright specs).
function exposeTestHandle() {
  if (!new URLSearchParams(location.search).has('test')) return;
  globalThis.__rushHour = {
    selection: () => ({ ...state.selection }),
    vehicleIds: () => state.attempt?.vehicles.map((v) => v.id) ?? [],
    vehicleScreenPoint(id) {
      const mesh = state.meshes?.get(id);
      if (!mesh) return null;
      const projected = mesh.position.clone().project(state.three.camera);
      const rect = state.three.canvas.getBoundingClientRect();
      return {
        x: rect.left + (projected.x * 0.5 + 0.5) * rect.width,
        y: rect.top + (-projected.y * 0.5 + 0.5) * rect.height,
      };
    },
    emphasized() {
      const out = { selected: [], highlighted: [] };
      for (const [id, mesh] of state.meshes ?? []) {
        if (Math.abs(mesh.scale.x - 1.14) < 0.001) out.selected.push(id);
        else if (Math.abs(mesh.scale.x - 1.06) < 0.001) out.highlighted.push(id);
      }
      return out;
    },
  };
}

/* ------------------------------------------------------------- rendering */

function applySelectionToScene() {
  if (state.three) state.three.applySelection(state.meshes, state.selection);
}

function resyncMeshes() {
  if (!state.three) return;
  state.meshes = state.three.syncVehicles(state.three.vehicleGroup, state.attempt.vehicles);
  applySelectionToScene();
}

/* ---------------------------------------------------------------- actions */

function selectVehicle(id) {
  state.selection = id == null ? clearSelection() : selectState(state.selection, id);
  applySelectionToScene();
}

function cycleSelection(direction) {
  state.selection = cycleSelectionState(state.selection, state.attempt.vehicles, direction);
  applySelectionToScene();
}

function toggleSelection() {
  state.selection = toggleSelectionState(state.selection);
  applySelectionToScene();
}

async function doMove(id, delta) {
  if (state.busy || !state.attempt || state.attempt.status !== 'playing') return;
  const next = game.move(state.attempt, { vehicleId: id, delta });
  if (next === state.attempt) {
    audio.playBlocked();
    return;
  }
  state.attempt = next;
  state.selection = keepSelection(state.selection, next.vehicles, id);
  audio.playMove();
  const mesh = state.meshes?.get(id);
  const vehicle = next.vehicles.find((v) => v.id === id);
  if (mesh && vehicle) await state.three.animateMove(mesh, vehicle);
  applySelectionToScene();
  updateHud();
  if (state.attempt.status === 'won') handleWin();
}

function undo() {
  if (state.busy || !state.attempt) return;
  const next = game.undo(state.attempt);
  if (next === state.attempt) return;
  state.attempt = next;
  state.selection = reconcileSelection(state.selection, next.vehicles);
  resyncMeshes();
  updateHud();
}

function redo() {
  if (state.busy || !state.attempt) return;
  const next = game.redo(state.attempt);
  if (next === state.attempt) return;
  state.attempt = next;
  state.selection = reconcileSelection(state.selection, next.vehicles);
  resyncMeshes();
  updateHud();
}

function reset() {
  if (state.busy || !state.attempt) return;
  state.attempt = game.reset(state.attempt);
  state.selection = initialSelection(state.attempt.vehicles);
  state.elapsed = 0;
  state.lastTick = performance.now();
  resyncMeshes();
  updateHud();
}

async function reveal() {
  if (state.busy || !state.attempt || state.attempt.status !== 'playing' || !state.three) return;
  state.busy = true;
  const { attempt, solution } = game.reveal(state.attempt, state.challenge);
  state.attempt = attempt;
  const playback = dialogs.showRevealPlayback();

  // Play the optimal solution from the starting layout, then restore the player's board.
  state.meshes = state.three.syncVehicles(
    state.three.vehicleGroup,
    state.challenge.vehicles.map((v) => ({ ...v })),
  );
  await state.three.playSolution(state.meshes, state.challenge.vehicles, solution, applyMove, 420);
  playback.close();
  resyncMeshes();
  state.busy = false;
  updateHud();
}

function handleWin() {
  stopTimer();
  audio.playVictory();
  const revealed = state.attempt.revealed;
  const order = state.roadmap.order;
  const isFinal = order.indexOf(state.challenge.id) === order.length - 1;

  state.progress = recordCompletion(state.progress, {
    challengeId: state.challenge.id,
    moveCount: state.attempt.moveCount,
    revealed,
    order,
  });
  saveProgress(state.progress);
  state.roadmap = buildRoadmap(state.catalog, state.progress);

  dialogs.showVictory(
    {
      moveCount: state.attempt.moveCount,
      optimal: state.challenge.optimalMoveCount,
      revealed,
      isFinal,
    },
    showRoadmap,
  );
}

/* ------------------------------------------------------------------- HUD */

function updateHud() {
  if (!state.hud || !state.attempt) return;
  state.hud.update({
    moveCount: state.attempt.moveCount,
    seconds: state.elapsed,
    canUndo: state.attempt.history.length > 0,
    canRedo: state.attempt.redoStack.length > 0,
    difficulty: state.challenge.difficulty,
  });
}

/* --------------------------------------------------------------- screens */

function showRoadmap() {
  stopTimer();
  dialogs.close();
  el('game').hidden = true;
  el('screen').hidden = false;
  renderRoadmap(el('screen'), state.roadmap, state.catalog.challenges, startGame);
}

async function startGame(id) {
  dialogs.close();
  state.challenge = state.catalog.challenges.find((c) => c.id === id);
  state.attempt = game.createAttempt(state.challenge);
  state.selection = initialSelection(state.attempt.vehicles);
  state.elapsed = 0;
  state.busy = false;
  el('screen').hidden = true;
  el('game').hidden = false;

  state.hud = createHud(el('hud'), {
    undo,
    redo,
    reset,
    reveal,
    back: showRoadmap,
    isMuted: audio.isMuted,
    toggleSound: () => audio.toggleMuted(),
  });
  updateHud(); // show the counters immediately, before the 3D layer loads
  state.hud.setLocked(true); // controls stay disabled until the level is ready

  try {
    await initThree();
  } catch (error) {
    dialogs.showError(error.message, () => startGame(id));
    return;
  }

  resyncMeshes();
  state.hud.setLocked(false);
  resizeThree();
  requestAnimationFrame(resizeThree);
  startTimer();
  updateHud();
}

/* ------------------------------------------------------------------ boot */

async function boot() {
  dialogs = createDialogs(el('dialogs'));
  window.addEventListener('pointerdown', () => audio.unlockAudio(), { once: true });
  try {
    state.catalog = await loadCatalog('./challenges.json');
  } catch (error) {
    el('screen').hidden = false;
    dialogs.showError(error.message, boot);
    return;
  }
  state.progress = loadProgress();
  state.roadmap = buildRoadmap(state.catalog, state.progress);
  showRoadmap();
}

boot();
