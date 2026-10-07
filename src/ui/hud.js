import { STRINGS } from './strings.fr.js';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function createHud(root, handlers) {
  root.replaceChildren();
  const bar = document.createElement('div');
  bar.className = 'hud';

  const counters = document.createElement('div');
  counters.className = 'hud-counters';
  const moves = document.createElement('span');
  moves.className = 'hud-stat';
  const time = document.createElement('span');
  time.className = 'hud-stat';
  const level = document.createElement('span');
  level.className = 'hud-stat';
  counters.append(level, moves, time);

  const controls = document.createElement('div');
  controls.className = 'hud-controls';

  const button = (label, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };

  const undoBtn = button(STRINGS.undo, () => handlers.undo());
  const redoBtn = button(STRINGS.redo, () => handlers.redo());
  const resetBtn = button(STRINGS.reset, () => handlers.reset());
  const revealBtn = button(STRINGS.reveal, () => handlers.reveal());
  const soundBtn = button(handlers.isMuted() ? STRINGS.soundOff : STRINGS.soundOn, () => {
    const muted = handlers.toggleSound();
    soundBtn.textContent = muted ? STRINGS.soundOff : STRINGS.soundOn;
  });
  const menuBtn = button(STRINGS.backToRoadmap, () => handlers.back());

  controls.append(undoBtn, redoBtn, resetBtn, revealBtn, soundBtn, menuBtn);
  bar.append(counters, controls);
  root.append(bar);

  return {
    update({ moveCount, seconds, canUndo, canRedo, difficulty }) {
      level.textContent = `${STRINGS.level} : ${difficulty}`;
      moves.textContent = `${STRINGS.moveCount} : ${moveCount}`;
      time.textContent = `${STRINGS.time} : ${formatTime(seconds)}`;
      undoBtn.disabled = !canUndo;
      redoBtn.disabled = !canRedo;
    },
    setLocked(locked) {
      for (const b of controls.querySelectorAll('button')) {
        if (b !== soundBtn && b !== menuBtn) b.disabled = locked;
      }
    },
  };
}
