import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTrack, samplePath, redYaw, PITCH, ROW_GAP } from '../../src/render/roadmap-layout.js';

const levels = Array.from({ length: 10 }, (_, i) => ({ id: `defi-${String(i + 1).padStart(2, '0')}`, difficulty: i < 2 ? 'Débutant' : 'Intermédiaire' }));

test('buildTrack places one node per level in a serpentine', () => {
  const { nodes } = buildTrack(levels);
  assert.equal(nodes.length, 10);
  assert.ok(nodes[0].position.x < 0, 'row 0 starts on the left');
  assert.ok(nodes[4].position.x > 0, 'row 0 ends on the right');
  assert.equal(nodes[5].position.x, nodes[4].position.x, 'serpentine: row 1 starts where row 0 ended');
  assert.ok(nodes[9].position.x < 0, 'row 1 ends on the left');
  assert.equal(nodes[1].position.z, nodes[0].position.z, 'same-row neighbours share the row');
  assert.equal(nodes[5].position.z - nodes[4].position.z, ROW_GAP);
});

test('every node centre appears exactly once in the path', () => {
  const { nodes, path } = buildTrack(levels);
  const key = (p) => `${Math.round(p.x * 1000)}:${Math.round(p.z * 1000)}`;
  const counts = path.map(key);
  for (const node of nodes) {
    assert.equal(counts.filter((k) => k === key(node.position)).length, 1, `node ${node.id} centre in path`);
  }
});

test('samplePath is arc-length monotonic and ends on node centres', () => {
  const { path } = buildTrack(levels);
  const ts = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];
  let prev = null;
  for (const t of ts) {
    const { position, tangent } = samplePath(path, t);
    if (prev) {
      const dx = position.x - prev.position.x;
      const dz = position.z - prev.position.z;
      const advance = dx * prev.tangent.x + dz * prev.tangent.z;
      assert.ok(advance >= -1e-6, `t=${t} advances forward`);
    }
    prev = { position, tangent };
  }
  const first = samplePath(path, 0).position;
  const last = samplePath(path, 1).position;
  assert.deepEqual(first, path[0]);
  assert.deepEqual(last, path[path.length - 1]);
});

test('tangent is normalized', () => {
  const { path, nodes } = buildTrack(levels);
  const { tangent } = samplePath(path, 0.5);
  assert.ok(Math.abs(Math.hypot(tangent.x, tangent.z) - 1) < 1e-9);
  const between = samplePath(path, 0.001).tangent; // first straight run (horizontal)
  assert.ok(Math.abs(between.z) < 1e-6, 'first run goes along x');
  assert.equal(nodes.length, 10);
});

test('redYaw flips 180° for the red car only', () => {
  assert.equal(redYaw(0, true), Math.PI);
  assert.equal(redYaw(1.2, true), 1.2 + Math.PI);
  assert.equal(redYaw(1.2, false), 1.2);
  assert.equal(redYaw(-Math.PI / 2, true), -Math.PI / 2 + Math.PI);
});

test('empty track does not throw', () => {
  const { nodes, path } = buildTrack([]);
  assert.equal(nodes.length, 0);
  assert.equal(path.length, 0);
  assert.deepEqual(samplePath(path, 0.5).position, { x: 0, y: 0, z: 0 });
});

test('pitch separates same-row neighbours horizontally', () => {
  const { nodes } = buildTrack(levels);
  assert.equal(nodes[1].position.x - nodes[0].position.x, PITCH);
});