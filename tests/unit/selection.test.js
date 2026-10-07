import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clear,
  cycle,
  initial,
  keep,
  levelFor,
  reconcile,
  select,
  toggle,
} from '../../src/input/selection.js';

const vehicles = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('initial highlights the first car and selects nothing', () => {
  assert.deepEqual(initial(vehicles), { highlightedId: 'a', selectedId: null });
  assert.deepEqual(initial([]), { highlightedId: null, selectedId: null });
  assert.deepEqual(initial(undefined), { highlightedId: null, selectedId: null });
});

test('cycle moves the highlight and wraps in both directions', () => {
  let s = { highlightedId: 'a', selectedId: null };
  s = cycle(s, vehicles, 1);
  assert.equal(s.highlightedId, 'b');
  s = cycle(s, vehicles, 1);
  s = cycle(s, vehicles, 1);
  assert.equal(s.highlightedId, 'a', 'wraps forward');
  s = cycle(s, vehicles, -1);
  assert.equal(s.highlightedId, 'c', 'wraps backward');
});

test('cycle starts from the first or last car when nothing is highlighted', () => {
  assert.equal(cycle(clear(), vehicles, 1).highlightedId, 'a');
  assert.equal(cycle(clear(), vehicles, -1).highlightedId, 'c');
});

test('cycle is a no-op while a car is selected', () => {
  const selected = { highlightedId: 'b', selectedId: 'b' };
  assert.equal(cycle(selected, vehicles, 1), selected);
});

test('toggle selects the highlighted car and deselects keeping the highlight', () => {
  const selected = toggle({ highlightedId: 'b', selectedId: null });
  assert.deepEqual(selected, { highlightedId: 'b', selectedId: 'b' });
  const browsing = toggle(selected);
  assert.deepEqual(browsing, { highlightedId: 'b', selectedId: null });
  assert.deepEqual(toggle(clear()), { highlightedId: null, selectedId: null });
});

test('select and clear set both fields', () => {
  assert.deepEqual(select(clear(), 'c'), { highlightedId: 'c', selectedId: 'c' });
  assert.deepEqual(clear(), { highlightedId: null, selectedId: null });
});

test('keep re-anchors after a move and falls back when the id is gone', () => {
  assert.deepEqual(keep(clear(), vehicles, 'b'), { highlightedId: 'b', selectedId: 'b' });
  assert.deepEqual(keep(clear(), vehicles, 'z'), { highlightedId: 'a', selectedId: null });
});

test('reconcile preserves valid ids and re-initializes invalid ones', () => {
  const kept = reconcile({ highlightedId: 'c', selectedId: 'c' }, vehicles);
  assert.deepEqual(kept, { highlightedId: 'c', selectedId: 'c' });
  const reset = reconcile({ highlightedId: 'z', selectedId: 'z' }, vehicles);
  assert.deepEqual(reset, { highlightedId: 'a', selectedId: null });
});

test('levelFor gives selected precedence over highlighted', () => {
  const s = { highlightedId: 'b', selectedId: 'b' };
  assert.equal(levelFor(s, 'b'), 'selected');
  assert.equal(levelFor({ highlightedId: 'b', selectedId: 'a' }, 'b'), 'highlighted');
  assert.equal(levelFor(s, 'c'), 'none');
});
