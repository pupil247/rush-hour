// Progress persistence. Defensive reads per contracts/progress-storage.md.
// Uses localStorage; a corrupt or unavailable store degrades to a fresh game with no error.
const KEY = 'rushHour.progress';
const VERSION = 1;

export function freshProgress() {
  return { version: VERSION, currentIndex: 0, records: {} };
}

function isRecord(value) {
  return value && typeof value === 'object' && typeof value.solved === 'boolean';
}

export function loadProgress() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return freshProgress();
    const data = JSON.parse(raw);
    if (!data || data.version !== VERSION || typeof data.currentIndex !== 'number' || typeof data.records !== 'object') {
      return freshProgress();
    }
    const records = {};
    for (const [id, record] of Object.entries(data.records)) {
      if (isRecord(record)) records[id] = record;
    }
    return {
      version: VERSION,
      currentIndex: Math.max(0, Math.floor(data.currentIndex)),
      records,
    };
  } catch {
    return freshProgress();
  }
}

export function saveProgress(progress) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable or full: play continues, progress is simply not remembered.
  }
}

/**
 * Record a completed attempt. An unaided win marks the challenge solved, lowers the best
 * move count, and advances the roadmap to the next stop. A revealed win changes nothing.
 */
export function recordCompletion(progress, { challengeId, moveCount, revealed, order }) {
  const records = { ...progress.records };
  const previous = records[challengeId] ?? { solved: false, bestMoveCount: null, lastMoveCount: null };
  let currentIndex = progress.currentIndex;

  if (!revealed) {
    const best =
      previous.bestMoveCount == null ? moveCount : Math.min(previous.bestMoveCount, moveCount);
    records[challengeId] = { solved: true, bestMoveCount: best, lastMoveCount: moveCount };

    const index = order.indexOf(challengeId);
    if (index === currentIndex && index < order.length - 1) currentIndex = index + 1;
  }

  return { version: VERSION, currentIndex, records };
}
