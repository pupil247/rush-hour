import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitVehicleModel, FILL, MAX_WIDTH } from '../../src/render/fit.js';
import { lengthForKind } from '../../src/core/rules.js';

const box = (x, y, z) => ({
  size: { x, y, z },
  center: { x: 0, y: y / 2, z: 0 },
  min: { x: -x / 2, y: 0, z: -z / 2 },
});

test('a car fits two cells and stays within one cell wide', () => {
  const b = box(1.638, 1.146, 3.31);
  const { scale, rotationY } = fitVehicleModel(b, 'car', 'V');
  assert.equal(rotationY, 0);
  assert.ok(Math.abs(b.size.z * scale.z - lengthForKind('car') * FILL) < 1e-9);
  assert.ok(b.size.x * scale.x <= MAX_WIDTH + 1e-9, 'width must not exceed one cell');
});

test('a wide truck is capped at one cell across', () => {
  const b = box(2.312, 1.848, 5.18);
  const { scale } = fitVehicleModel(b, 'truck', 'V');
  assert.ok(b.size.x * scale.x <= MAX_WIDTH + 1e-9);
  assert.ok(scale.x < scale.z, 'the width axis is squashed to fit');
  assert.ok(Math.abs(b.size.z * scale.z - lengthForKind('truck') * FILL) < 1e-9, 'length still fills the cells');
});

test('horizontal orientation rotates a quarter turn, vertical does not', () => {
  const b = box(1.5, 1.3, 2.55);
  assert.equal(fitVehicleModel(b, 'car', 'H').rotationY, -Math.PI / 2);
  assert.equal(fitVehicleModel(b, 'car', 'V').rotationY, 0);
});

test('offset centres the model on its cell and grounds it', () => {
  const b = { size: { x: 2, y: 1, z: 4 }, center: { x: 1, y: 0.5, z: 2 }, min: { x: 0, y: 0.2, z: 0 } };
  const { scale, offset } = fitVehicleModel(b, 'car', 'V');
  assert.ok(Math.abs(offset.x + 1 * scale.x) < 1e-9);
  assert.ok(Math.abs(offset.z + 2 * scale.z) < 1e-9);
  assert.ok(Math.abs(offset.y + 0.2 * scale.y) < 1e-9, 'grounded so the model sits on the board');
});

test('a uniform model with a tall box keeps y and z on the same scale', () => {
  const b = box(0.8, 0.5, 2);
  const { scale } = fitVehicleModel(b, 'car', 'V');
  assert.equal(scale.y, scale.z);
});
