import { legalDeltas } from '../core/moves.js';

// Keyboard: Tab cycles vehicles, arrows slide the selected vehicle along its axis,
// plus shortcuts for undo/redo/reset/reveal.
export function createKeyboardInput({
  getSelected,
  getVehicles,
  onMove,
  onBlocked,
  onCycle,
  onUndo,
  onRedo,
  onReset,
  onReveal,
}) {
  function handle(event) {
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const key = event.key;

    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) onRedo();
      else onUndo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'y') {
      event.preventDefault();
      onRedo();
      return;
    }
    if (key === 'Tab') {
      event.preventDefault();
      onCycle(event.shiftKey ? -1 : 1);
      return;
    }
    if (key.toLowerCase() === 'r') {
      onReset();
      return;
    }
    if (key.toLowerCase() === 'h') {
      onReveal();
      return;
    }

    const selected = getSelected();
    if (!selected) return;
    const vehicle = getVehicles().find((v) => v.id === selected);
    if (!vehicle) return;

    let direction = 0;
    if (vehicle.orientation === 'H') {
      if (key === 'ArrowLeft') direction = -1;
      else if (key === 'ArrowRight') direction = 1;
    } else if (key === 'ArrowUp') direction = -1;
    else if (key === 'ArrowDown') direction = 1;

    if (!direction) return;
    event.preventDefault();
    if (legalDeltas(getVehicles(), selected).includes(direction)) onMove(selected, direction);
    else onBlocked();
  }

  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}
