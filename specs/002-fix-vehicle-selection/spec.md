# Feature Specification: Vehicle Selection & Keyboard Controls

**Feature Branch**: `002-fix-vehicle-selection`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "Bug: when opening the level, the Rush Hour game shows no working controls on the page; clicking cannot select any car and I can't move in any way. While fixing that, I want the selected car to be highlighted, and the ability to switch cars with the arrows, then select/deselect with Space, then move with the arrows when a car is selected."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select and Move a Car with the Mouse (Priority: P1)

A player opens a level and uses the mouse: clicking a car selects it, dragging it slides it along its file, and clicking the empty board deselects. This is the core interaction that is currently broken — the board renders but no car can be selected or moved.

**Why this priority**: Without working selection and movement, the game is unplayable. Everything else is secondary to restoring the basic interaction.

**Independent Test**: Open a level and, using only the mouse, click a car (it becomes selected), drag it along its file into empty space (it moves and the move counter increases), and click an empty cell (selection clears).

**Acceptance Scenarios**:

1. **Given** a level is open with the board visible, **When** the player clicks any car, **Then** that car becomes the selected car and is highlighted, with no error.
2. **Given** a car is selected, **When** the player drags it along its own axis toward an empty space, **Then** it slides there, the move is counted, and the board updates.
3. **Given** a car is selected, **When** the player clicks an empty cell, **Then** the selection clears and no car is highlighted.
4. **Given** a player drags a car toward a blocked direction, **When** they release, **Then** the car stays put, no move is counted, and the attempt is refused.
5. **Given** a level is open, **When** the player selects and drags cars, **Then** every move obeys the puzzle rules (no sideways movement, no overlap, stay on the board).

---

### User Story 2 - See Which Car Is Highlighted (Priority: P2)

A player can always tell which car is currently selected, and, when browsing with the keyboard, which car is about to be selected. The car the controls will act on is clearly visible.

**Why this priority**: The player explicitly asked for the selected car to be highlighted; without it the keyboard controls are blind. It depends on P1 but is independently demonstrable.

**Independent Test**: Select a car and confirm it is visually distinct from the others; browse with the arrows and confirm the highlighted car visibly changes.

**Acceptance Scenarios**:

1. **Given** any cars on the board, **When** a car is selected, **Then** it is visually emphasized more strongly than any other car.
2. **Given** the player is browsing with the keyboard and nothing is selected, **When** they change the highlighted car, **Then** the highlight moves and only one car is highlighted at a time.
3. **Given** a car is selected and the player deselects it, **When** the selection clears, **Then** the highlight returns to the lighter browsing state (or none).

---

### User Story 3 - Drive Entirely from the Keyboard (Priority: P3)

A player can play without a mouse: arrows browse between cars, Space selects or deselects the current car, and, once a car is selected, arrows move it one cell along its file.

**Why this priority**: Improves accessibility and speed of play, and is the specific interaction the player requested. It depends on the selection/highlight foundation.

**Independent Test**: Open a level, press arrows to cycle through cars, press Space to select, press arrows to move the selected car, press Space to deselect — all without touching the mouse.

**Acceptance Scenarios**:

1. **Given** nothing is selected, **When** the player presses the left or up arrow, **Then** the highlight moves to the previous car in the fixed order; the right or down arrow moves to the next car; the order wraps around.
2. **Given** nothing is selected and a car is highlighted, **When** the player presses Space, **Then** that car becomes selected and the highlight becomes the strong selected highlight.
3. **Given** a car is selected, **When** the player presses an arrow along the car's axis, **Then** the car moves exactly one cell in that direction if the move is legal.
4. **Given** a car is selected, **When** the player presses an arrow perpendicular to the car's axis, **Then** nothing moves.
5. **Given** a car is selected, **When** the player presses Space, **Then** the car is deselected and the highlight returns to browsing.
6. **Given** a car is selected and an arrow would move it into a blocked cell or off the board, **When** the player presses it, **Then** the car does not move, no move is counted, and the player gets blocked feedback.
7. **Given** focus is on the game, **When** the player presses an arrow key, **Then** the page does not scroll.
8. **Given** the keyboard is used throughout, **When** the player selects and moves cars, **Then** the mouse remains usable at any time and both share the same selection.

---

### Edge Cases

- **Selection state is shared**: clicking a car selects it, and arrows can then move it, without any separate "keyboard mode".
- **Browsing with nothing on the board selected**: Space with no highlighted car does nothing.
- **Perpendicular arrows**: ignored while a car is selected (they must not switch cars mid-selection).
- **Key auto-repeat**: holding an arrow moves the car one cell per repeat; each repeat is one move.
- **Dragging a car that was not previously selected**: dragging selects it as part of the move.
- **Clicking and releasing without moving**: a pure click selects the car without counting a move.
- **Touch devices**: dragging a car works with touch, and touch does not scroll the page.
- **Selection while a move/reveal animation is playing**: input is ignored until the animation finishes.
- **Undo/redo/reset while a car is selected**: the selection is preserved or safely cleared, and no error occurs.
- **Re-selecting after a move**: after moving, the just-moved car stays selected.
- **Rapid clicks or key repeats**: no unhandled error, and the board stays consistent.

## Requirements *(mandatory)*

### Functional Requirements

**Fix broken mouse interaction**

- **FR-001**: Clicking a car on the board MUST select it and mark it as the selected car, without raising an error.
- **FR-002**: Dragging a selected car along its own axis MUST slide it within the legal range for that car.
- **FR-003**: Clicking an empty cell MUST clear the current selection.
- **FR-004**: A drag that would move a car illegally MUST be refused: the car returns to its position and no move is counted.
- **FR-005**: Selecting and moving MUST work the first time a level is opened, with no prior keyboard input required.

**Highlighting**

- **FR-006**: Exactly one car at a time may be highlighted.
- **FR-007**: The selected car MUST be visually emphasized more strongly than every other car.
- **FR-008**: While browsing with the keyboard, the currently highlighted car MUST be visually indicated, distinctly from the selected car.
- **FR-009**: The highlight MUST update immediately when the highlighted or selected car changes.

**Keyboard controls**

- **FR-010**: With nothing selected, the left and up arrows MUST move the highlight to the previous car, and the right and down arrows to the next car, in a fixed order that wraps around.
- **FR-011**: Pressing Space with a highlighted car and nothing selected MUST select it.
- **FR-012**: Pressing Space with a car selected MUST deselect it and return to browsing.
- **FR-013**: With a car selected, an arrow along the car's axis MUST move it exactly one cell in that direction when legal; each such move counts as one move.
- **FR-014**: With a car selected, an arrow perpendicular to the car's axis MUST NOT move it and MUST NOT change the selection.
- **FR-015**: A keyboard move that is illegal MUST leave the car in place, count no move, and give blocked feedback.
- **FR-016**: Arrow keys used by the game MUST NOT scroll the page.

**Consistency and no regressions**

- **FR-017**: Mouse and keyboard MUST share a single selection state (selecting with one is reflected in the other).
- **FR-018**: After a car is moved, it MUST remain the selected car.
- **FR-019**: Input MUST be ignored while a move or the reveal animation is playing.
- **FR-020**: Undo, redo, reset, reveal, mute, and return-to-roadmap MUST keep working, and using them MUST NOT leave a corrupted selection or raise an error.
- **FR-021**: All movement, regardless of input method, MUST obey the existing puzzle rules (axis-only, no overlap, stay on the board, one slide equals one move).

### Key Entities *(include if feature involves data)*

- **Selection**: Which car, if any, is currently selected. Exactly one selection at a time (or none).
- **Highlight**: The car the controls will act on. There are two visual levels: a lighter browsing highlight and a stronger selected highlight.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of clicks on a car select it, with no unhandled error in the console (the current failure is eliminated).
- **SC-002**: A first-time player can select and move a car using the mouse alone within 30 seconds of opening a level.
- **SC-003**: A player can complete a full challenge using the keyboard alone (browse, select, move, reach the exit).
- **SC-004**: The selected car is visually distinguishable from all other cars within one animation frame of being selected.
- **SC-005**: 100% of keyboard moves that are illegal leave the board unchanged and do not increase the move count.
- **SC-006**: The existing roadmap, solve-to-win, reveal, and reset behaviors continue to pass their tests after the change.

## Assumptions

- **Rendering already works**: The board and cars are visible; this change is about interaction and highlighting only.
- **Mouse remains primary**: Click-to-select and drag-to-move remain available; the keyboard is an additional way to play, not a replacement.
- **Move distance**: One arrow press moves one cell (holding the key repeats); each press counts as one move.
- **Browsing order**: The fixed cycling order follows the existing order of the cars in the level definition.
- **Highlight technique**: The highlight is achieved with visual emphasis only (color, outline, or scale); no new art assets are required.
- **Out of scope**: The separate "Error creating WebGL context" / challenge-loading message issue is not addressed here.
