# Contract: Progress Storage

Player progress and best scores are stored on the device in `localStorage` (FR-024, FR-025). There is
no backend.

## Key

- **Key**: `rushHour.progress`
- **Format**: JSON string of the object below.

## Shape

```json
{
  "version": 1,
  "currentIndex": 0,
  "records": {
    "<challengeId>": {
      "solved": false,
      "bestMoveCount": null,
      "lastMoveCount": null
    }
  }
}
```

| Field | Type | Notes |
|-------|------|-------|
| `version` | integer | Storage schema version; bump on incompatible shape changes |
| `currentIndex` | integer | Furthest unlocked roadmap position; MUST NOT decrease |
| `records` | object | Keyed by challenge `id` |

## Rules

- A **record MUST exist only for challenges the player has interacted with**; missing records mean
  "not started".
- `solved` is set `true` **only for an unaided win** (FR-025). A revealed win MUST leave it `false`.
- `bestMoveCount` MUST only ever decrease (FR-024).
- A revealed win MUST NOT change `currentIndex`, `solved`, or `bestMoveCount` (FR-026).
- Solving a challenge MUST advance `currentIndex` to exactly the next roadmap entry, never backwards
  (FR-020b, SC-010).
- Replaying an earlier challenge MUST NOT move `currentIndex` backwards.

## Resilience

- Read MUST be wrapped in `try/catch`. If the key is absent, unparsable, the wrong `version`, or the
  wrong shape, the game MUST start a fresh game with no error shown to the player (edge case:
  "Persistence unavailable or full").
- Write failure (e.g., quota or storage disabled) MUST NOT interrupt play; the attempt simply is not
  remembered.
