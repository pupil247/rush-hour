// Pure model-fitting math (no DOM, no Three.js). Kept separate from models.js so it can be
// unit-tested in Node without loading Three.js (Principle II / IV).
import { lengthForKind } from '../core/rules.js';

// Fraction of the vehicle's cell span the model should fill along its length.
export const FILL = 0.88;
// A vehicle occupies exactly one cell across, so the model must not be wider than one cell.
export const MAX_WIDTH = 1.0;

/**
 * Compute how to place a model on the board.
 *
 * @param {{ size: {x:number,y:number,z:number}, center: {x:number,y:number,z:number}, min: {x:number,y:number,z:number} }} box
 *        Axis-aligned bounding box of the loaded template, in model units. `z` is the model's
 *        forward/length axis, `x` its width, `y` its height.
 * @param {'car'|'truck'} kind    Vehicle kind (2 cells for a car, 3 for a truck).
 * @param {'H'|'V'} orientation   Movement axis: H = horizontal (world X), V = vertical (world Z).
 * @returns {{ scale: {x:number,y:number,z:number}, rotationY: number, offset: {x:number,y:number,z:number} }}
 *          `scale` is applied to the model, `rotationY` to the wrapper, and `offset` to the model so
 *          it is centred on the cell and grounded (min y at 0).
 */
export function fitVehicleModel(box, kind, orientation) {
  const size = box.size;
  const center = box.center;
  const min = box.min;

  const targetLength = lengthForKind(kind) * FILL;
  const lengthScale = targetLength / size.z;

  // Uniform scale to fill the length; if that would overflow one cell across, cap the width axis.
  const projectedWidth = size.x * lengthScale;
  const widthScale = projectedWidth > MAX_WIDTH ? MAX_WIDTH / size.x : lengthScale;

  const scale = { x: widthScale, y: lengthScale, z: lengthScale };
  const rotationY = orientation === 'H' ? -Math.PI / 2 : 0;
  const offset = {
    x: -center.x * scale.x,
    y: -min.y * scale.y,
    z: -center.z * scale.z,
  };
  return { scale, rotationY, offset };
}
