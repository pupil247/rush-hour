# Phase 1 Data Model: Interactive 3D Roadmap

**Feature**: `004-interactive-3d-roadmap` | **Date**: 2026-10-08

This feature is presentation-only. The "model" is the in-memory representation of the track and the
car's position, derived from existing saved progress — nothing new is persisted.

---

## Entities

### RoadmapState (in-memory, per roadmap session)

The state the roadmap screen runs on.

| Field | Type | Description |
|-------|------|-------------|
| `order` | `string[]` | Challenge ids in play order (10 ids, already difficulty-grouped). |
| `currentIndex` | `number` | The node the car rests on and that is highlighted (0 ≤ `i` ≤ unlock boundary). |
| `unlockBoundary` | `number` | Index of the furthest unlocked level (= saved `progress.currentIndex`). |
| `isTraveling` | `boolean` | True while the car animates between nodes. |
| `attempts` | `Map<id, { solved, bestMoveCount }>` | Derived from saved progress for node states. |

**Rules**
- `0 ≤ currentIndex ≤ unlockBoundary ≤ order.length - 1`.
- The car never rests on a locked node: travel targets are clamped to `[0, unlockBoundary]`.
- `isTraveling` is true from a travel start until the car arrives exactly on the target node; arrow
  input is ignored (one queued press max) while traveling.

### TrackNode

One level on the map.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Challenge id (`defi-01` … `defi-10`). |
| `index` | `number` | Position in `order`. |
| `position` | `{ x, y, z }` | World position on the serpentine (car rests here). |
| `stateNode` | `'current' \| 'unlocked' \| 'solved' \| 'locked'` | Derived visual state. |
| `difficulty` | `string` | Region it belongs to (drives segment colour). |

**Rules**
- `stateNode === 'locked'` ⟺ `index > unlockBoundary`.
- `stateNode === 'current'` ⟺ `index === currentIndex` (and therefore unlocked).
- `solved` nodes are within `[0, unlockBoundary - 1]` when the corresponding record is `solved`.

### RoadPath

The sampled road the car drives on.

| Field | Type | Description |
|-------|------|-------------|
| `points` | `{ x, y, z }[]` | Straight segments + 180° corner arcs sampled to points; node centres are exact points. |
| `segments` | `{ fromIndex, toIndex, difficulty }[]` | Difficulty-coloured spans for the ribbon. |

**Rules**
- `points[0]` is node 0's centre, `points[last]` is node (N−1)'s centre; every node centre appears
  in `points`.
- Adjacent nodes in `order` are connected by a path arc length strictly greater than zero (travelling
  two adjacent nodes never teleports).

### TravelSnapshot (animator)

| Field | Type | Description |
|-------|------|-------------|
| `fromIndex` | `number` | Node index at departure. |
| `toIndex` | `number` | Target node index. |
| `elapsed` | `number` | Progress 0→1 (eased). |
| `duration` | `number` | ~900 ms. |
| `direction` | `1 \| -1` | `+1` forward, `-1` backward (drives the yaw flip). |

**Rules**
- Ended when `elapsed ≥ 1`; at that instant the car position equals `toIndex` node position and
  `currentIndex` becomes `toIndex` (atomic with highlight).
- The yaw at any time is the path tangent; a `direction === -1` travel produces a target yaw π from
  the forward one, tweened via the shortest arc.

---

## Relationships

```text
progress (localStorage) ──▶ unlockBoundary ──┐
challenges.json ──▶ order ──▶ buildTrack ────┤
                                             ▼
                       RoadmapState ──┬──▶ TrackNode[n]  (one per level)
                                      └──▶ RoadPath ──▶ TravelSnapshot (animating car)
```

- Each `order[i]` maps 1:1 to `TrackNode[i]` and appears in `RoadPath.points`.
- `currentIndex` selects exactly one node as `current`; the ring highlight renders there.
- `unlockBoundary` bounds travel, highlight movement, and `stateNode`.

## State transitions

### Navigation (arrows / ▲▼ / node click)

```text
ready(current=a) ──advance──▶ traveling(a→a+1, dir=+1) ──arrival──▶ ready(current=a+1)
ready(current=a) ──retreat──▶ traveling(a→a−1, dir=−1) ──arrival──▶ ready(current=a−1)
ready(current=a) ──click node b∈[0,unlock]──▶ traveling(a→b) ──arrival──▶ ready(current=b)
ready(current=a) ──blocked press at boundary──▶ ready(current=a) + blocked feedback
ready(current=a) ──Enter/Space/click-resting/─Jouer▶ start level order[a]
```

### Travel lifetime

```text
idle ──request(dir or node)──▶ animating ──(>=1 queued ignored)──▶ locked_at_arrival ──▶ idle(current=to)
```

## Persisted data

None added. `progress.currentIndex` already encodes the unlock boundary; `records` encode solved
states. The roadmap writes nothing.

## Red-car orientation rule (pure)

A small derived rule used at vehicle build time:

| Input | Output |
|-------|--------|
| `isRed = true` | effective yaw = base yaw + π (facing the exit side) |
| `isRed = false` | unchanged (FR-002) |