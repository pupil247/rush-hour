# Phase 1 Data Model: Vehicle Selection & Keyboard Controls

## Selection

The interaction state. Owned by `src/input/selection.js` (pure).

| Field | Type | Notes |
|-------|------|-------|
| `highlightedId` | string \| null | The car the controls will act on; can exist without a selection (browsing) |
| `selectedId` | string \| null | The selected car, or null. At most one; when set it equals `highlightedId` |

**Invariants**:
- At most one car is `selectedId` and at most one is `highlightedId`.
- When `selectedId` is set, `highlightedId` MUST equal it.
- Both are either `null` or the id of an existing car in the current attempt.

**Operations** (all pure, returning a new value):

| Operation | Signature | Effect |
|-----------|-----------|--------|
| `initial` | `(vehicles) => Selection` | `highlightedId` = first car (or null), `selectedId` = null |
| `cycle` | `(selection, vehicles, direction) => Selection` | Moves `highlightedId` by ±1 in roster order, wrapping; no-op when a car is selected |
| `toggle` | `(selection) => Selection` | If selected → deselect (keep the browse highlight on that car); else select `highlightedId` |
| `select` | `(selection, id) => Selection` | Sets both to `id` (mouse click) |
| `clear` | `() => Selection` | Both `null` (mouse click on empty board) |
| `keep` | `(selection, vehicles, id) => Selection` | Re-anchors both to `id` after a move, safe if `id` left the roster |

## Highlight

A derived, per-car visual level rendered by `src/render/vehicles.js`. Not stored.

| Level | Condition | Visual |
|-------|-----------|--------|
| Selected | `car.id === selectedId` | Strong emphasis (e.g., scale up + bright emissive) |
| Browsing | `car.id === highlightedId` and not selected | Lighter emphasis |
| None | otherwise | Default appearance |

## State transitions

```text
(start) ──open level────────▶ browsing(highlight = first car, selected = null)

browsing ──arrow────────────▶ browsing(highlight cycles in roster order, wraps)
browsing ──Space────────────▶ selected(highlight = selected = highlighted car)
browsing ──click car────────▶ selected(highlight = selected = clicked car)
browsing ──click empty──────▶ browsing(highlight = null, selected = null)

selected ──arrow (axis)─────▶ selected(move one cell if legal, else unchanged)
selected ──arrow (perp)─────▶ selected(unchanged)
selected ──move (any input)─▶ selected(keep: same car remains selected)
selected ──Space────────────▶ browsing(highlight = previously selected car)
selected ──click empty──────▶ browsing(highlight = null, selected = null)

any ──undo/redo/reset───────▶ selection preserved or safely cleared, never corrupt
any ──animation playing─────▶ input ignored until it finishes
```

## Validation rules

- A selected/highlighted id MUST refer to a car present in the current attempt; after `reset` or loading
  a new level, the selection MUST re-initialize from that attempt's vehicle list.
- `cycle` MUST terminate (finite roster) and MUST wrap.
- No operation may produce an illegal move; movement goes through `src/core/moves.js` (`legalDeltas`/`applyMove`).
