import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshProgress, recordCompletion } from '../../src/progress.js';

const order = ['a', 'b', 'c'];

test('an unaided win marks solved, sets best, and advances', () => {
  let progress = freshProgress();
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 5, revealed: false, order });
  assert.equal(progress.records.a.solved, true);
  assert.equal(progress.records.a.bestMoveCount, 5);
  assert.equal(progress.currentIndex, 1);
});

test('the best move count only ever lowers', () => {
  let progress = freshProgress();
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 5, revealed: false, order });
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 8, revealed: false, order });
  assert.equal(progress.records.a.bestMoveCount, 5);
});

test('a revealed win changes nothing', () => {
  let progress = freshProgress();
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 2, revealed: true, order });
  assert.equal(progress.records.a, undefined);
  assert.equal(progress.currentIndex, 0);
});

test('progression advances only from the current stop and never past the end', () => {
  let progress = freshProgress();
  progress = recordCompletion(progress, { challengeId: 'c', moveCount: 1, revealed: false, order });
  assert.equal(progress.currentIndex, 0, 'a non-current challenge must not advance the roadmap');
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 1, revealed: false, order });
  assert.equal(progress.currentIndex, 1);
  progress = recordCompletion(progress, { challengeId: 'b', moveCount: 1, revealed: false, order });
  assert.equal(progress.currentIndex, 2);
  progress = recordCompletion(progress, { challengeId: 'c', moveCount: 1, revealed: false, order });
  assert.equal(progress.currentIndex, 2, 'must not advance past the final stop');
});

test('replaying an earlier stop does not move the roadmap backwards', () => {
  let progress = freshProgress();
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 1, revealed: false, order });
  progress = recordCompletion(progress, { challengeId: 'b', moveCount: 1, revealed: false, order });
  progress = recordCompletion(progress, { challengeId: 'a', moveCount: 1, revealed: false, order });
  assert.equal(progress.currentIndex, 2);
});
