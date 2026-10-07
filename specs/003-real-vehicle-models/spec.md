# Feature Specification: Realistic Vehicle Models

**Feature Branch**: `003-real-vehicle-models`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "can you use now real car model and truck model? the game is working properly, i just want to change the car 3d models"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Vehicles Look Like Real Cars and Trucks (Priority: P1)

A player opens a challenge and sees the 2-cell vehicles rendered as recognizable car models and the 3-cell vehicles rendered as recognizable truck models, instead of the current block-like shapes. The puzzle itself plays exactly as before; only the appearance of the vehicles changes.

**Why this priority**: This is the entire request. The user states the game already works and only wants the vehicle models changed, so a more realistic car and truck appearance is the single outcome that delivers the feature.

**Independent Test**: Open any challenge and confirm that every 2-cell vehicle reads as a car and every 3-cell vehicle reads as a truck, while every existing gameplay behavior (movement, move counting, undo/redo, reveal, win detection) is unchanged.

**Acceptance Scenarios**:

1. **Given** a challenge is open, **When** the board renders, **Then** each 2-cell vehicle is displayed with a recognizable car model and each 3-cell vehicle with a recognizable truck model.
2. **Given** the new models are shown, **When** the player moves vehicles to solve the puzzle, **Then** movement, move counting, undo/redo, reveal, and win detection behave exactly as before.
3. **Given** the level contains the single red car, **When** the board renders, **Then** that vehicle is still unmistakably red and remains the only red vehicle.

---

### User Story 2 - Vehicles Stay Instantly Distinguishable (Priority: P2)

A player can still tell at a glance which vehicle is a car and which is a truck, which way each vehicle points, and which vehicle is currently selected or highlighted. The richer models must not make the board harder to read.

**Why this priority**: The puzzle depends on players distinguishing vehicle type, length, and orientation. More detailed models are only acceptable if they preserve that readability.

**Independent Test**: On a board with several cars and trucks, confirm cars and trucks are distinguishable by shape, each vehicle's orientation matches its movement axis, colors stay distinct, and the selection/highlight is clearly visible on top of the new models.

**Acceptance Scenarios**:

1. **Given** a mix of cars and trucks on the board, **When** rendered, **Then** cars and trucks differ clearly in silhouette and each occupies exactly its grid footprint (2 cells for cars, 3 cells for trucks).
2. **Given** a vehicle is horizontal or vertical, **When** rendered, **Then** its model is oriented along the vehicle's movement axis.
3. **Given** a vehicle is selected or browsed-to with the keyboard, **When** the highlight is applied, **Then** the existing emphasis remains clearly visible over the new model.
4. **Given** several vehicles share the board, **When** rendered, **Then** each keeps a distinct color so players can track them.

---

### User Story 3 - Change Is Safe for Static Hosting and Performance (Priority: P3)

A player opening the game from a static host (such as GitHub Pages) on a typical laptop or phone still gets a fast load and smooth play after the models are introduced. The no-build, static-hosting nature of the game is preserved.

**Why this priority**: The game is already deployed as static files; a model change must not break that deployment, require a build step, or make play stutter.

**Independent Test**: Load the deployed static game, confirm vehicles appear and the game is playable, then simulate an unavailable model and confirm the game still plays via a fallback.

**Acceptance Scenarios**:

1. **Given** the game is served as static files, **When** it loads, **Then** the vehicle models appear and the game is playable without any build step.
2. **Given** a vehicle model cannot be loaded (offline, unavailable, or corrupted), **When** the board renders, **Then** the game shows a usable placeholder for that vehicle and remains fully playable.
3. **Given** a typical laptop or mid-range phone, **When** playing a challenge, **Then** animations remain smooth with no perceptible stutter.

---

### Edge Cases

- **Model unavailable or offline**: the game must fall back to a playable representation and must not crash or block play.
- **Slow connection**: the board must remain usable while models load, and the fallback must be shown in the meantime.
- **Low-end graphics hardware**: reduced model detail is acceptable as long as play stays smooth and the board stays readable.
- **Highlight over a detailed model**: selection and browsing emphasis must stay legible on top of the new geometry.
- **Red car uniqueness**: exactly one vehicle may be red, regardless of model or color variations.
- **Footprint honesty**: a model must not visually overflow its cells in a way that misleads the player about which cells it occupies.
- **Orientation**: vertical and horizontal vehicles must be oriented consistently, including after undo, redo, or reset.
- **Non-vehicle visuals unchanged**: the board, exit, background, HUD, dialogs, and roadmap must not be altered by this feature.
- **Regression safety**: pointer and keyboard selection, dragging, and all existing automated tests must continue to pass.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each 2-cell vehicle MUST be rendered using a more realistic car model than the current procedural block, and each 3-cell vehicle using a more realistic truck model.
- **FR-002**: The single red car MUST remain unmistakably red and MUST remain the only red vehicle.
- **FR-003**: Cars and trucks MUST remain visually distinguishable by type, each matching its grid footprint (2 cells for cars, 3 cells for trucks).
- **FR-004**: Each vehicle on a board MUST keep a distinct color from the others so players can track individual vehicles.
- **FR-005**: Each vehicle model MUST be oriented along the vehicle's movement axis (horizontal or vertical).
- **FR-006**: The selected and browsing highlights MUST remain clearly visible over the new models.
- **FR-007**: Replacing the models MUST NOT change any game rule, legal move, move count, solver result, or challenge data.
- **FR-008**: The game MUST continue to run directly from static files with no build step and MUST remain hostable on a static host.
- **FR-009**: If a vehicle model cannot be loaded, the game MUST fall back to a playable representation and MUST NOT crash, block play, or raise an unhandled error.
- **FR-010**: The change MUST NOT regress pointer or keyboard selection, dragging, undo/redo, reset, reveal, or HUD behaviors.
- **FR-011**: Rendering MUST remain interactive and free of perceptible stutter on typical laptop and mid-range phone hardware.
- **FR-012**: Vehicle models MUST be provided as 3D model asset files (e.g. `.glb`/`.gltf`) that are bundled with the application and loaded by the game from the deployed static files; no build step may be required to ship or load them.
- **FR-013**: Bundled model assets MUST be treated as static game files, versioned with the source, and served as-is by the static host alongside the existing game files.

### Key Entities *(include if feature involves data)*

- **Vehicle type**: whether a vehicle is a car (2 cells) or a truck (3 cells).
- **Vehicle model / visual asset**: the 3D representation used to draw a car or truck.
- **Vehicle instance**: a specific vehicle on the board, with its color, length, orientation, and grid position.
- **Fallback representation**: the simple shape shown for a vehicle whose model cannot be loaded.
- **Highlight state**: whether a vehicle is selected, merely browsed-to, or neither.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of vehicles display either their car/truck model or a usable fallback once a challenge has loaded; no vehicle is ever left invisible or broken.
- **SC-002**: At least 90% of sampled players correctly identify which vehicles are cars and which are trucks at first glance.
- **SC-003**: 100% of the existing automated tests (pure-core and browser) continue to pass with no rule or scoring changes.
- **SC-004**: The game remains fully playable when served from a static host with no build step.
- **SC-005**: Play stays smooth on a typical laptop and a mid-range phone, with no perceptible stutter during moves and animations.
- **SC-006**: When a vehicle model is unavailable, the game remains 100% playable using fallbacks.

## Assumptions

- **Presentation-only change**: All gameplay, rules, board layout, challenge data, solver behavior, HUD, and French interface text remain unchanged. This feature touches only how vehicles are drawn.
- **One car model and one truck model**: As phrased by the user ("real car model and truck model"), a single car model and a single truck model are reused across all vehicles, differentiated by per-vehicle color.
- **Bundled real model assets (chosen)**: The user selected option A — real 3D model files (e.g. `.glb`/`.gltf`) are committed to the repository and loaded directly by the game from the static host. There is no external model service; only the existing runtime import map for the rendering library remains a network dependency. Bundling files is compatible with the no-build constraint (they are static files, not compiled output), but it requires the constitution amendment described below.
- **Non-red color palette kept**: Non-red vehicles continue to use a distinct-color palette so they remain individually trackable; the red car keeps its dedicated red.
- **Existing selection/highlight reused**: The existing selected/highlighted emphasis approach is retained and applied on top of the new models.
- **Assets are modest in size**: Models are small enough to load quickly on a normal connection without a loading screen.
- **Modern browsers with WebGL**: Target devices support WebGL and modern ES modules, consistent with the current game.
- **Required constitution amendment (governance)**: The current constitution previously stated that "the 3D layer renders a procedurally generated scene (Three.js primitives and materials), and v1 MUST NOT depend on binary 3D assets" (Technology & Platform Constraints), and Principle III reinforces the no-build, source-identical runtime. Option A intentionally adopts bundled binary model assets, so this feature is accompanied by an explicit constitution amendment that removed the prohibition while preserving the no-build rule. **Resolved**: constitution amended to v1.1.0 on 2026-10-07; bundled pre-authored 3D model assets are now permitted as static files with a mandatory playable fallback.
