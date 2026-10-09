# Feature Specification: Interactive 3D Roadmap

**Feature Branch**: `004-interactive-3d-roadmap`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "1. make that the red car is always frontways (currently backward in all levels, turn it around). 2. the roadmap to be interactive car in the 3d roadmap with circles connected with lines (straight or curvy) representing the levels, car advancing in the roadmap or going back (should turn around the model when that is the case). The car can't stay on a line, when user clicks arrow (up or down), it should move automatically to next level and highlight the circle (make effect) to know that current level is selected."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Red Car Always Faces Forward (Priority: P1)

A player opens any level and the red car is oriented the right way: its front points in the direction
it will move (towards the exit), in every challenge. Today the model renders backward.

**Why this priority**: It is a visible, reported bug across every level, and the fix is small and
independent of the roadmap work.

**Independent Test**: Open every challenge and confirm the red car's front faces its movement
direction, with no other vehicle's orientation changed.

**Acceptance Scenarios**:

1. **Given** a challenge is open, **When** the red car is horizontally oriented, **Then** its front
   points towards the exit side, not backwards.
2. **Given** a challenge is open, **When** the red car is vertically oriented, **Then** its front
   faces its forward direction consistently with horizontal cases.
3. **Given** any non-red vehicle, **When** the level renders, **Then** its orientation is unchanged
   from today.

---

### User Story 2 - The Car Drives a 3D Roadmap (Priority: P1)

A player returning to the roadmap sees their progress as a **3D scene**: a small car standing on a
track of level nodes (circles) connected by lines, one node per challenge, with the car sitting on
the current level's node. The car drives along the road to another node and always ends at rest on a
node — never mid-line. When it travels backwards, it turns around first.

**Why this priority**: This is the heart of the request: replacing the flat list with a living 3D
roadmap.

**Independent Test**: Open the roadmap, observe the car on the current node, move to the next node
and back, and confirm the car always comes to rest on a node and faces the direction of travel.

**Acceptance Scenarios**:

1. **Given** the roadmap is shown, **When** it renders, **Then** each challenge is a distinct node
   (circle) on the track, nodes are connected by visible lines, and the car sits on the current
   level's node.
2. **Given** the player triggers a move to the next node, **When** the car travels, **Then** it
   follows the connecting line and comes to rest exactly on the target node.
3. **Given** the player triggers a move to the previous node, **When** the car travels, **Then** it
   turns around to face the new travel direction and comes to rest on that node.
4. **Given** the car is travelling, **When** the player triggers another move, **Then** the car still
   always ends at a node (no position between nodes is a resting state).

---

### User Story 3 - Navigate and Pick a Level from the Roadmap (Priority: P2)

A player browses the roadmap with the **up and down arrows**: each press moves the car automatically
to the next (up) or previous (down) level and clearly **highlights the current node** with a visible
effect, so the selected level is obvious. The player can then start that level.

**Why this priority**: Arrow navigation and the selection highlight are the interaction the player
explicitly described; they sit on top of the driving roadmap.

**Independent Test**: Press up and down and confirm the car moves one node per press, the current
node is always visibly highlighted, and the selected level can be started.

**Acceptance Scenarios**:

1. **Given** the roadmap, **When** the player presses the up arrow, **Then** the car moves to the
   next level's node and that node becomes highlighted.
2. **Given** the roadmap, **When** the player presses the down arrow, **Then** the car moves to the
   previous level's node and that node becomes highlighted (turning around if it was travelling forward).
3. **Given** a node is highlighted, **When** the player starts the level, **Then** the game opens
   that challenge.
4. **Given** the car would leave the range of reachable levels, **When** the player presses an
   arrow, **Then** the car stays on the current node and the player is told the road ends (blocked
   feedback), without error.
5. **Given** a node outside the current reach, **When** the player tries to travel to it, **Then**
   the travel is refused or the node stays visually locked.

---

### User Story 4 - Progress, Persistence, and Polish (Priority: P3)

The roadmap reflects the player's real progress: the car starts at the saved current level, solved
levels stay distinct, locked ones look locked, and returning from a level brings the player back to
the right node. The scene stays smooth and readable on the same devices as the game.

**Why this priority**: It makes the 3D roadmap truthful and durable rather than decorative.

**Independent Test**: Win a level, return to the roadmap, and confirm the car now sits on the newly
unlocked node with the solved level marked; reload the page and confirm the position persists.

**Acceptance Scenarios**:

1. **Given** a level is won, **When** the player returns to the roadmap, **Then** the car is on the
   newly unlocked node and the solved node is visually marked as solved.
2. **Given** the page is reloaded, **When** the roadmap opens, **Then** the car is on the saved
   current node.
3. **Given** locked levels exist, **When** the roadmap renders, **Then** they are clearly distinct
   from unlocked ones (e.g. dimmed or with a lock indicator).
4. **Given** a back or mid-range device, **When** the car travels along the track, **Then** the
   animation stays smooth and the scene remains readable.

---

### Edge Cases

- **First level**: at the first node, pressing down (back) cannot go further; give blocked feedback.
- **Last level**: at the last node, pressing up (forward) cannot go further; give blocked feedback.
- **During travel**: arrow presses are ignored (or queued at most once) so the car can never be left
  between nodes.
- **Locked levels**: the car must not rest on a locked level; navigation bounds to reachable levels.
- **Returning from a level**: the car re-enters on the saved current node (not the last one started).
- **Empty or corrupt progress**: behaves as a fresh game with the car on the first node.
- **Extremely fast repeated presses**: result is deterministic and always ends on a node.
- **Touch devices**: on touch screens the navigation MUST be usable without a keyboard (on-screen
  ▲/▼ buttons, tap-a-node to drive), and starting a level MUST have a visible "Jouer" affordance.
- **Animation priority**: if a travel and a selection coincide, the final resting node is the
  selected one.
- **Red car fix regression**: re-running the vehicle tests must confirm only the red car changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The red car MUST render facing the exit side (the direction it slides to win) in every
  challenge, without changing any other vehicle's orientation.
- **FR-002**: The orientation of all non-red vehicles MUST remain unchanged.
- **FR-003**: The roadmap screen MUST present the challenges as a set of nodes (circles) connected
  by visible lines in a 3D scene, replacing the current flat list.
- **FR-004**: A small car model on the roadmap MUST represent the player's current level and MUST
  always rest on a node, never on a line.
- **FR-005**: When the player moves to another node, the car MUST travel along the connecting line
  and come to rest exactly on the target node.
- **FR-006**: When the car travels backwards, it MUST turn around (change its facing direction)
  during the travel.
- **FR-007**: Pressing the up arrow MUST move the car to the next level's node; pressing the down
  arrow MUST move it to the previous node.
- **FR-008**: The node corresponding to the current level MUST be visually highlighted with a clear
  effect (e.g. glow, pulse), and the highlight MUST move with the car.
- **FR-009**: The player MUST be able to start the highlighted level.
- **FR-010**: Travel off the end of the road (before the first or after the last reachable level)
  MUST be refused with feedback, without error.
- **FR-011**: The roadmap MUST reflect saved progress: the car starts on the saved current node and
  locked levels stay locked and visually distinct.
- **FR-012**: The roadmap MUST NOT change the challenges, rules, progression, or any gameplay
  behaviour of the levels themselves.
- **FR-013**: The roadmap MUST remain smooth and readable on the same desktop and touch hardware the
  game already runs on.
- **FR-014**: The roadmap track MUST be a single continuous serpentine through all challenges in
  level order, made of straight runs with softly curved turns, and the five difficulty regions MUST
  remain visible (colour-coded track segments and/or floating region labels).
- **FR-015**: Starting the selected level MUST work by pressing Enter or Space, or by clicking the
  node the car is resting on; both MUST open that challenge.
- **FR-016**: The car MUST travel only within the unlocked range (the current level and every
  earlier one); locked nodes MUST be visible but visually dimmed and unreachable, and pressing an
  arrow at the ends of the unlocked range MUST be refused with blocked feedback.

### Key Entities *(include if feature involves data)*

- **Current level (roadmap position)**: the node the car rests on; derived from saved progress.
- **Node**: a level's place on the track, with an id, position, and state (current / unlocked / locked / solved).
- **Track**: the ordered path of nodes and the connecting lines between them.
- **Highlight effect**: the visual emphasis marking the node that current selection points to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The red car faces forward in 100% of the challenges, with zero other vehicle
  orientation changes.
- **SC-002**: In 100% of travel operations the car ends at rest on a node (never between nodes).
- **SC-003**: A player can reach every reachable level with only the up/down arrows, one node per
  press, within 2 seconds per move (matching animation length).
- **SC-004**: The current node is always visually highlighted; the highlight moves with the car in
  every navigation step.
- **SC-005**: 100% of the existing gameplay tests (rules, moves, solving, vehicles) still pass —
  the feature is roadmap-presentation only.
- **SC-006**: Reloading the page restores the car to the correct saved node in 100% of cases.

## Assumptions

- **Red car fix (resolved)**: "frontways" means the red car's front points toward the exit side (the
  direction it slides to win). In practice the red car is always on the exit row and horizontal, so
  this is a **180° turn** of its model; only `isRed` vehicles change, and no per-level logic is needed.
- **Arrow mapping**: Up = next level (advance), Down = previous level (go back), consistent with
  "advancing in the roadmap or going back".
- **Car is reused**: the roadmap car reuses the existing car model, scaled down; it does not need a
  new asset. **Resolved**: the roadmap car is `car.glb` at small scale, tinted red (the player is the
  red car in-game).
- **Rest-on-node**: the car always eases to the target node before new input is accepted; travel
  input is ignored (or queued once) while driving.
- **Layout (resolved)**: a single continuous serpentine track in level order, straight runs with
  curved 180° turns; difficulty regions are colour-coded segments with floating labels.
- **Highlight (resolved)**: a glowed, gently pulsing ring under/around the current node.
- **Touch (resolved)**: on-screen ▲/▼ buttons + tap-a-node to drive, and a visible "Jouer" button to
  start, on touch; desktop uses the real arrow keys, Enter/Space, and node clicks.
- **Out of scope**: no change to challenge data, rules, solver, or in-level gameplay.