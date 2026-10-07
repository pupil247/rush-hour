# Contract: Selection Reducer (`src/input/selection.js`)

A pure, dependency-free module (no DOM, no Three.js) holding the interaction selection state. Unit
tested with `node --test`. This document is the interface shape only.

## State

```text
{ highlightedId: string | null, selectedId: string | null }
```

Invariants: at most one of each; when `selectedId` is set it equals `highlightedId`; ids refer to cars
in the current attempt or are null.

## Operations

### `initial(vehicles) => Selection`
- `highlightedId` = id of the first vehicle, or `null` when there are no vehicles.
- `selectedId` = `null`.

### `cycle(selection, vehicles, direction) => Selection`
- `direction` is `+1` (next) or `-1` (previous).
- No-op (returns an equivalent selection) when `selectedId` is set.
- When nothing is highlighted, starts at the first (`+1`) or last (`-1`) vehicle.
- Wraps around the roster. Only one `highlightedId`.

### `toggle(selection) => Selection`
- If `selectedId` is set: return `{ highlightedId: selectedId, selectedId: null }` (deselect, keep the
  browse highlight on the same car).
- Else if `highlightedId` is set: return `{ highlightedId, selectedId: highlightedId }`.
- Else: no-op.

### `select(selection, id) => Selection`
- Returns `{ highlightedId: id, selectedId: id }` (mouse click on a car).

### `clear() => Selection`
- Returns `{ highlightedId: null, selectedId: null }` (mouse click on empty board).

### `keep(selection, vehicles, id) => Selection`
- Re-anchors both to `id` after a move. If `id` is not in `vehicles`, falls back to `initial(vehicles)`.

## Postconditions
- Every returned value satisfies the invariants.
- No operation mutates its input.
- `cycle` always terminates and wraps for any non-empty roster.
