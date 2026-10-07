# Feature Specification: Rush Hour Web Game

**Feature Branch**: `001-rush-hour-web-game`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "A web-based 3D adaptation of the Rush Hour sliding-block puzzle. Objective: drive the red car out through the exit to reach the red carpet. Board: 6×6 square with an exit on the right side of the 3rd row. Vehicles: cars of 2 cells (one of them red) and trucks of 3 cells. Setup: pick a challenge; the card shows the vehicles and their starting positions; the red car is aligned with the exit but blocked. Movement: a vehicle can only move forward or backward along its own file — never sideways. Golden rule: never lift a vehicle off the board. End of game: the red car reaches the exit; fewer moves is better. If stuck: reset the vehicles to their initial positions and start over; the solution is on the back of each card. Difficulty levels: Débutant, Intermédiaire, Avancé, Expert, Génie. The game must work with no build step and be test-ready."

## Clarifications

### Session 2026-10-07

- Q: Can the player start any challenge, or must challenges be unlocked by making progress? → A: Challenges unlock progressively in a single linear sequence; progress is shown on a visual roadmap where a car token advances as challenges are solved.
- Q: After a player solves a challenge, what happens immediately next? → A: A brief victory celebration, then the game returns to the roadmap, where the next challenge is unlocked and the player chooses what to play next.
- Q: Does finishing a challenge after revealing its solution count as solving it? → A: No; a revealed win is shown but does not mark the challenge solved, does not advance the roadmap, and is not recorded as a personal best.
- Q: When the player reveals the solution, how is the answer shown? → A: The full optimal sequence is automatically played as an animation.
- Q: If the solution is revealed mid-challenge, what happens to the player's current board? → A: The board is reset to the starting layout so the solution can play from the beginning, then restored exactly to the player's previous state.
- Q: How many challenges ship on the v1 roadmap and how are they distributed across the levels? → A: Ten challenges — Débutant 2, Intermédiaire 3, Avancé 2, Expert 1, Génie 2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Solve a Challenge (Priority: P1)

A player opens the game on a challenge that is already in play and works toward the goal: clearing a path so the red car can drive out through the exit on the 3rd row. The player moves cars and trucks one at a time, each staying in its own file, until the red car fully leaves the board and reaches the red carpet.

**Why this priority**: This is the game. Without a working board, legal movement, and a correct win condition, nothing else has value. It is the minimum viable product.

**Independent Test**: Load a single known challenge, make a sequence of legal moves, and confirm the game reports a win exactly when the red car has entirely passed the exit — and only then.

**Acceptance Scenarios**:

1. **Given** a challenge is in play, **When** the player moves a car or truck along its file into empty cells, **Then** the vehicle occupies the new cells and the move is registered.
2. **Given** a vehicle's path is blocked by another vehicle or the board edge, **When** the player attempts to move it that direction, **Then** the move is refused, the vehicle stays put, and no move is counted.
3. **Given** the red car is aligned with the open exit, **When** the player slides it out until every one of its cells is past the right edge, **Then** the game declares victory.
4. **Given** the red car is only partly past the edge, **When** the player stops moving, **Then** the game has not yet declared victory.
5. **Given** a player moves one vehicle two or more cells in a single continuous slide, **When** the move completes, **Then** it counts as exactly one move.

---

### User Story 2 - Progress Along the Challenge Roadmap (Priority: P2)

A player advances through the game along a visual roadmap that leads from the easiest challenges to the hardest. The five difficulty levels are regions of the road, each challenge is a stop along it, and a car token marks the player's current position. Solving a challenge advances the token to the next stop and unlocks it; everything further ahead stays locked.

**Why this priority**: Gives players a clear sense of journey and progression; it turns a set of puzzles into a game with a destination. It depends on P1 but is independently demonstrable.

**Independent Test**: Starting from a fresh game, confirm only the first challenge is unlocked, solve it, and confirm the car token advances and the next challenge unlocks while later ones remain locked.

**Acceptance Scenarios**:

1. **Given** a player opens the game for the first time, **When** the roadmap is shown, **Then** the car token sits at the first challenge and only that challenge is unlocked.
2. **Given** the player views the roadmap, **When** they look along the path, **Then** the challenges are ordered into the five difficulty regions from Débutant to Génie.
3. **Given** the player selects the currently unlocked challenge, **When** it loads, **Then** the board shows exactly the vehicles and starting positions defined for that challenge.
4. **Given** the player solves the current challenge, **When** the victory celebration completes, **Then** the car token advances to the next stop, that next challenge becomes unlocked, and the game returns to the roadmap where the player chooses what to play next.
5. **Given** a player has solved challenges, **When** they return to the roadmap, **Then** solved stops show their best move count and the car token rests at the furthest unlocked stop.
6. **Given** a challenge is still locked, **When** the player tries to select it, **Then** the game prevents it and shows that earlier challenges must be solved first.

---

### User Story 3 - Recover, Undo, and Reveal the Solution (Priority: P3)

A player who makes a wrong move, gets stuck, or wants to learn can undo and redo moves freely, reset the challenge to its initial layout, or reveal the challenge's optimal solution (the "back of the card").

**Why this priority**: The rules explicitly tell stuck players to reset and start over, and the printed game offers the solution on the back of each card. This keeps players from hitting a dead end and quitting.

**Independent Test**: From a mid-game state, undo moves back to the start, redo forward again, reset to the initial layout, and reveal the solution; confirm the board matches expectations at each step.

**Acceptance Scenarios**:

1. **Given** the player has made moves, **When** they undo, **Then** the most recent move is reversed and the move count decreases by one.
2. **Given** the player has undone a move, **When** they redo, **Then** the move is reapplied and the move count increases by one.
3. **Given** any game state, **When** the player resets, **Then** every vehicle returns to its initial position and the move count and timer restart.
4. **Given** any game state, **When** the player reveals the solution, **Then** the game resets to the starting layout, automatically plays the optimal sequence as an animation, and then restores the board to the state it was in before the reveal.
5. **Given** the player has revealed the solution, **When** they win the challenge, **Then** the challenge is not marked solved, the roadmap does not advance, and the result is not recorded as a personal best.

---

### User Story 4 - Track Best Performance and Time (Priority: P4)

A player sees how many moves they have used and how long they have been playing, and after winning they see how their result compares with the optimal. Their best result per challenge is remembered the next time they return.

**Why this priority**: The rules state that fewer moves means a better solution, so measuring and remembering performance is central to the challenge. It is valuable but not required to play.

**Independent Test**: Solve a challenge in more moves than optimal, confirm the comparison is shown, reload the game, and confirm the best move count persists.

**Acceptance Scenarios**:

1. **Given** an attempt is in progress, **When** the player views the screen, **Then** the current move count and elapsed time are visible.
2. **Given** the player wins, **When** the result screen appears, **Then** it shows the player's move count next to the optimal move count for that challenge.
3. **Given** the player solves a challenge and later returns, **When** they view the challenge, **Then** their best (lowest) move count is shown.
4. **Given** the player has already set a best score, **When** they solve the challenge with more moves, **Then** the previous best is kept.

---

### User Story 5 - Audio and Visual Feedback (Priority: P5)

A player receives immediate, clear feedback: vehicles slide smoothly, illegal attempts are visually refused, and sound plays for moves, blocked attempts, and victory. Sound can be muted.

**Why this priority**: Polish that improves clarity and satisfaction but is not required to complete the game.

**Independent Test**: Perform legal moves, blocked moves, and a winning move with sound on, then mute; confirm every action produces the expected visual cue and the expected sound (or silence when muted).

**Acceptance Scenarios**:

1. **Given** sound is on, **When** the player moves a vehicle, **Then** a move sound plays.
2. **Given** sound is on, **When** a move is blocked, **Then** a distinct blocked sound plays and no move is counted.
3. **Given** sound is on, **When** the player wins, **Then** a victory sound plays and can be stopped by muting.

### Edge Cases

- **Blocked or illegal move**: the vehicle stays in place, the game gives clear feedback, and the move count does not change.
- **Diagonal or off-axis drag**: the attempted motion is constrained to the vehicle's own file; a move is either snapped to the axis or refused, never performed sideways.
- **Red car partially out of the board**: victory is not declared until all of the red car's cells have passed the exit.
- **Undo at the start of a challenge**: undo and redo are unavailable (or no-ops) when there is nothing to undo or redo.
- **Reset mid-attempt**: the layout, move count, and timer all return to their initial values.
- **Revealing the solution then winning**: the win is shown but the challenge is not marked solved, the roadmap does not advance, and the player's recorded best score is not overwritten.
- **Revealing mid-attempt**: the board is reset only for the duration of the solution animation, then restored exactly to the player's previous state, so no progress is lost.
- **Persistence unavailable or full**: the game remains fully playable; progress simply is not remembered, with no error shown to the player.
- **Slow or interrupted loading of challenge data**: the player sees a clear loading state and, on failure, a recoverable message rather than a broken board.
- **Sound blocked by the browser**: the game still works silently until the player interacts, at which point sound may begin.
- **Timer while the page is hidden or backgrounded**: the timer does not accumulate time the player was not actively playing.
- **Malformed or unsolvable challenge data**: such a challenge is not offered to the player.
- **Replaying an earlier solved stop**: the player may replay it, but their roadmap position does not move backwards and their recorded best score is preserved.
- **Solving the final challenge**: the game shows a completion state rather than trying to advance the car token past the end of the roadmap.

## Requirements *(mandatory)*

### Functional Requirements

**Board and rules**

- **FR-001**: The board MUST be a 6×6 grid with a single exit on the right side of the 3rd row.
- **FR-002**: Vehicles MUST be either cars of exactly 2 cells or trucks of exactly 3 cells, and exactly one vehicle MUST be the red car.
- **FR-003**: A vehicle MUST move only forward or backward along its own file and MUST NEVER move sideways.
- **FR-004**: A vehicle MUST NOT be lifted off the board; every position it occupies MUST stay within the grid.
- **FR-005**: A move MUST be refused when it would make a vehicle overlap another vehicle or leave the board.
- **FR-006**: Each continuous slide of one vehicle, regardless of how many cells it covers, MUST count as exactly one move.
- **FR-007**: The game MUST declare victory only when the red car has fully exited the board through the exit.
- **FR-008**: No direction, keyboard key, drag, or command may move a vehicle against these rules.

**Challenges and levels**

- **FR-009**: The game MUST offer a set of challenges grouped under five difficulty levels: Débutant, Intermédiaire, Avancé, Expert, Génie.
- **FR-009a**: The v1 roadmap MUST contain exactly ten challenges, distributed as Débutant 2, Intermédiaire 3, Avancé 2, Expert 1, Génie 2.
- **FR-010**: Each challenge MUST define a complete, valid starting layout of vehicles and their positions.
- **FR-011**: Every offered challenge MUST be solvable, and each MUST carry its optimal (minimum) move count.
- **FR-012**: Challenge content MUST be kept as data separate from the game's interaction behavior, so challenges can be added or changed without changing how the game plays.
- **FR-013**: The game MUST NOT present a challenge whose data is invalid or unsolvable.

**Interaction**

- **FR-014**: Users MUST be able to move a vehicle by dragging it along its own file.
- **FR-015**: Users MUST be able to select a vehicle and move it along its file using the keyboard arrow keys.
- **FR-016**: Users MUST be able to undo moves without limit.
- **FR-017**: Users MUST be able to redo moves that were undone without limit.
- **FR-018**: Users MUST be able to reset the current challenge to its initial layout at any time.
- **FR-019**: Users MUST be able to reveal the optimal solution of the current challenge, shown by automatically playing the full optimal sequence as an animation.
- **FR-019a**: While the reveal animation plays, player moves MUST be prevented, and the animation MUST NOT count as moves or alter the player's recorded result.
- **FR-019b**: To reveal, the game MUST first reset the board to the challenge's starting layout so the optimal sequence plays from the beginning, then restore the board to exactly the state it was in before the reveal.
- **FR-020**: Challenges MUST unlock progressively in a single linear sequence, from the first Débutant challenge to the final Génie challenge.
- **FR-020a**: The game MUST present a visual roadmap that orders all challenges into the five difficulty regions and shows the player's progress along it.
- **FR-020b**: A car token MUST mark the player's current position on the roadmap and MUST advance to the next stop when the current challenge is solved.
- **FR-020c**: A locked challenge MUST NOT be playable, and the game MUST communicate that earlier challenges must be solved first.
- **FR-020d**: Users MUST be able to select and replay any challenge they have already reached.

**Feedback and progress**

- **FR-021**: The game MUST display the current number of moves for the attempt.
- **FR-022**: The game MUST display the elapsed time of the current attempt.
- **FR-023**: On victory, the game MUST briefly show a celebration and the player's move count alongside the challenge's optimal move count.
- **FR-023a**: After the victory celebration, the game MUST return the player to the roadmap, where the next challenge has been unlocked and any previously reached challenge can be chosen.
- **FR-023b**: When the final challenge is solved, the game MUST show a completion state that celebrates finishing the roadmap, since there is no further challenge to unlock.
- **FR-024**: The game MUST remember the player's best (fewest) move count per challenge across sessions on the same device.
- **FR-025**: The game MUST mark a challenge as solved only when the player wins it without having revealed its solution during that attempt.
- **FR-026**: A challenge completed after revealing its solution MUST NOT be marked as solved, MUST NOT advance the roadmap, and MUST NOT overwrite the player's recorded best score.
- **FR-027**: The game MUST provide distinct audio feedback for a successful move, a blocked move, and victory, and MUST allow sound to be muted.
- **FR-028**: The game MUST visually distinguish the red car from all other vehicles at all times.

**Presentation and platform**

- **FR-029**: The board and vehicles MUST be presented in 3D while the underlying puzzle remains the 6×6 grid.
- **FR-030**: The user interface text MUST be in French.
- **FR-031**: The game MUST run directly in a web browser with no installation and no build step for the player.
- **FR-032**: The game MUST be playable with a mouse and with touch, and must not require a physical keyboard to complete a challenge.

### Key Entities *(include if feature involves data)*

- **Board**: The 6×6 play area and the single exit on row 3; defines the bounds every vehicle must respect.
- **Vehicle**: A car (2 cells) or truck (3 cells), with a color, a fixed orientation (horizontal or vertical), and a position; exactly one vehicle is the red car.
- **Challenge**: A named puzzle with a difficulty level, a complete starting layout of vehicles, an optimal solution sequence, and the optimal move count.
- **Move**: One continuous slide of a single vehicle along its file, with a direction, a distance, and the resulting position; equals one unit of the move count.
- **Attempt**: One play of a challenge, tracking the current layout, the move history, the move count, the elapsed time, and whether the solution was revealed.
- **Roadmap**: The ordered path of all challenges, divided into the five difficulty regions, along which the player advances; it defines unlock order and shows the player's position through a car token.
- **Player Progress**: The player's current position on the roadmap plus the per-challenge record of best move count and solved status, retained on the player's device.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player can complete the easiest challenge in under 2 minutes without external help.
- **SC-002**: 100% of offered challenges can be solved in exactly their stated optimal number of moves.
- **SC-003**: 100% of attempted illegal moves leave the board unchanged and do not increase the move count.
- **SC-004**: After any legal move, the board reflects the new position within 100 milliseconds of the player finishing the gesture.
- **SC-005**: A player can undo back to the initial layout and reset to it, and the resulting board is identical to the challenge's defined starting layout every time.
- **SC-006**: The game becomes playable within 3 seconds on a typical broadband connection, with nothing to install.
- **SC-007**: At least 90% of first-time players complete the first challenge they attempt.
- **SC-008**: A player's best move count for a solved challenge is still shown after closing and reopening the game 100% of the time (when on-device storage is available).
- **SC-009**: The game maintains a smooth, interactive frame rate on typical laptop and phone hardware.
- **SC-010**: A fresh player sees exactly one unlocked challenge, and each solved challenge makes exactly one additional challenge available.

## Assumptions

- **Audience and scope**: The game targets casual players of all ages on modern evergreen browsers; a physical keyboard is a convenience, not a requirement.
- **Rules authority**: The printed rules (kept as a read-only reference in the project) are authoritative; this specification derives from them and does not alter them.
- **Language**: The interface ships in French only for this version; other languages are out of scope.
- **Persistence model**: Progress and best scores are stored only on the player's own device; there are no accounts and no server.
- **Solution reveal semantics**: Revealing a solution is a learning aid only; a subsequent win is shown but does not mark the challenge solved, does not advance the roadmap, and does not overwrite an existing best (FR-026). A player progresses by solving challenges unaided.
- **Timer semantics**: The timer measures active play time and does not advance while the page is hidden or backgrounded.
- **Audio**: Sound is on by default with a mute control; audio may only begin after the player's first interaction, per common browser behaviour.
- **Difficulty meaning**: A challenge's difficulty reflects the length of its optimal solution as determined when the challenge is prepared, not a subjective label.
- **Content curation**: The set of challenges is curated for this version; automatic generation of new challenges is out of scope.
- **Challenge preparation**: Every shipped challenge has been confirmed solvable and given its optimal move count before it is included.
- **Progression order**: The roadmap follows a single linear sequence from the easiest Débutant challenge to the hardest Génie challenge; there is no branching and the player cannot choose the order.
- **Accessibility scope**: There are no specific assistive-technology targets for v1 (no dedicated screen-reader or color-blind requirements beyond basic keyboard and touch operability, FR-015 and FR-032).
- **Victory flow**: After a brief celebration (a short fixed pause), the game returns to the roadmap with the next challenge unlocked; the player chooses what to play next and can replay any earlier stop.
