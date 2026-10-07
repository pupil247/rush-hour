# Contract: Interaction (`src/input/pointer.js`, `src/input/keyboard.js`)

The user-facing input contract for selecting and moving cars. Mouse and keyboard share one selection.

## Mouse / touch (`src/input/pointer.js`)

| Action | Result |
|--------|--------|
| Pointer down on a car | Select that car (`select`); begin a drag |
| Pointer move while dragging | Preview the slide along the car's axis, clamped to legal deltas |
| Pointer up after a legal drag | Commit the move (one move), keep the car selected (`keep`) |
| Pointer up with no movement | A plain click selects; no move counted |
| Pointer up after an illegal/zero drag | Car returns to position; blocked feedback |
| Pointer down on empty board | Clear selection (`clear`) |

**Postcondition**: the vehicle group is read via `state.three.vehicleGroup`; the handler never throws.

## Keyboard (`src/input/keyboard.js`)

Reserved shortcuts that keep working: `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y` redo,
`R` reset, `H` reveal solution.

| State | Key | Result |
|-------|-----|--------|
| Browsing (nothing selected) | ← / ↑ | Highlight previous car (roster order, wraps) |
| Browsing | → / ↓ | Highlight next car |
| Browsing | Space | Select the highlighted car |
| Selected | Space | Deselect (return to browsing, same car highlighted) |
| Selected | Arrow along the car's axis | Move the car one cell in that direction if legal |
| Selected | Arrow across the car's axis | No move, no selection change |
| Selected | Illegal move | No move, no count change, blocked feedback |
| Any | Arrow used by the game | Page must not scroll (`preventDefault`) |
| Any | Input while an animation plays | Ignored |

## Shared invariants
- One selection only; mouse and keyboard reflect the same value.
- After any move the moved car stays selected.
- All movement is validated by `src/core/moves.js`; an illegal attempt changes nothing.
- A lost/failed input MUST NOT raise an unhandled error.
