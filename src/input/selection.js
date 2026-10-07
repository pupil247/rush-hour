// Pure selection reducer (no DOM, no Three.js). Holds which car is highlighted and which is
// selected. See specs/002-fix-vehicle-selection/contracts/selection.md.
//
// Invariants: at most one highlighted and one selected id; when selectedId is set it equals
// highlightedId; ids refer to cars in the current attempt.

export function initial(vehicles) {
  return { highlightedId: vehicles?.[0]?.id ?? null, selectedId: null };
}

export function cycle(selection, vehicles, direction) {
  const list = vehicles ?? [];
  if (list.length === 0) return { highlightedId: null, selectedId: null };
  if (selection.selectedId) return selection; // arrows do not browse while a car is selected

  const ids = list.map((v) => v.id);
  const current = ids.indexOf(selection.highlightedId);
  const step = direction > 0 ? 1 : -1;
  const next = current === -1 ? (step > 0 ? 0 : ids.length - 1) : (current + step + ids.length) % ids.length;
  return { highlightedId: ids[next], selectedId: null };
}

export function toggle(selection) {
  if (selection.selectedId) {
    return { highlightedId: selection.selectedId, selectedId: null };
  }
  if (selection.highlightedId) {
    return { highlightedId: selection.highlightedId, selectedId: selection.highlightedId };
  }
  return selection;
}

export function select(selection, id) {
  return { highlightedId: id, selectedId: id };
}

export function clear() {
  return { highlightedId: null, selectedId: null };
}

/** Re-anchor to `id` after a move; safe when the id is no longer in the roster. */
export function keep(selection, vehicles, id) {
  if (vehicles?.some((v) => v.id === id)) return { highlightedId: id, selectedId: id };
  return initial(vehicles);
}

/** Keep a valid selection after undo/redo/reset, or fall back to the first car. */
export function reconcile(selection, vehicles) {
  const list = vehicles ?? [];
  const ids = new Set(list.map((v) => v.id));
  const selectedId = selection.selectedId && ids.has(selection.selectedId) ? selection.selectedId : null;
  if (selectedId) return { highlightedId: selectedId, selectedId };
  const highlightedId =
    selection.highlightedId && ids.has(selection.highlightedId)
      ? selection.highlightedId
      : (list[0]?.id ?? null);
  return { highlightedId, selectedId: null };
}

/** The visual level for a car: "selected" wins over "highlighted", otherwise "none". */
export function levelFor(selection, id) {
  if (selection.selectedId === id) return 'selected';
  if (selection.highlightedId === id) return 'highlighted';
  return 'none';
}
