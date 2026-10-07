import { legalDeltas } from '../core/moves.js';

// Two-mode keyboard model (see contracts/interaction.md):
//  - Browsing (nothing selected): arrows cycle the highlighted car; Space selects it.
//  - Selected: arrows move it one cell along its axis; perpendicular arrows are ignored; Space deselects.
// Shortcuts kept: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo, R reset, H reveal.
export function createKeyboardInput({
  getSelection,
  getVehicles,
  onCycle,
  onToggle,
  onMove,
  onBlocked,
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
    if (key.toLowerCase() === 'r') {
      onReset();
      return;
    }
    if (key.toLowerCase() === 'h') {
      onReveal();
      return;
    }

    if (key === ' ') {
      event.preventDefault();
      onToggle();
      return;
    }

    const isArrow = key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown';
    if (!isArrow) return;
    event.preventDefault();

    const selection = getSelection();

    if (!selection.selectedId) {
      // Browsing: left/up previous, right/down next.
      onCycle(key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1);
      return;
    }

    const vehicle = getVehicles().find((v) => v.id === selection.selectedId);
    if (!vehicle) return;

    let direction = 0;
    if (vehicle.orientation === 'H') {
      if (key === 'ArrowLeft') direction = -1;
      else if (key === 'ArrowRight') direction = 1;
    } else if (key === 'ArrowUp') direction = -1;
    else if (key === 'ArrowDown') direction = 1;

    if (!direction) return; // perpendicular arrow: ignored

    if (legalDeltas(getVehicles(), selection.selectedId).includes(direction)) {
      onMove(selection.selectedId, direction);
    } else {
      onBlocked();
    }
  }

  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}
