// Pure roadmap layout math: serpentine track generation and arc-length path sampling.
// No DOM, no Three.js — unit-tested in Node (Principle II / IV).
// See specs/004-interactive-3d-roadmap/contracts/track-layout.md.

export const COLS = 5;
export const PITCH = 1.5;
export const ROW_GAP = 2.4;
const ARC_POINTS = 10;

/** The red car's effective yaw: 180° flip so its front faces the exit side. */
export function redYaw(baseYaw, isRed) {
  return isRed ? baseYaw + Math.PI : baseYaw;
}

/**
 * Build the serpentine track for an ordered list of levels `[{ id, difficulty }]`.
 * Returns { nodes, path, segments, bounds }.
 */
export function buildTrack(levels) {
  const nodes = [];
  const n = levels.length;
  if (n === 0) return { nodes, path: [], segments: [], bounds: { width: 0, depth: 0 }, nodePointIndex: {} };
  const rows = Math.ceil(n / COLS);
  const rowLen = (row) => Math.min(COLS, n - row * COLS);

  for (let i = 0; i < n; i += 1) {
    const row = Math.floor(i / COLS);
    const colInRow = i % COLS;
    const effCol = row % 2 === 0 ? colInRow : rowLen(row) - 1 - colInRow; // serpentine direction
    const x = (effCol - (rowLen(row) - 1) / 2) * PITCH;
    const z = -(rows - 1) * (ROW_GAP / 2) + row * ROW_GAP;
    nodes.push({ id: levels[i].id, index: i, position: { x, y: 0, z }, difficulty: levels[i].difficulty });
  }

  // Path: straight segments between neighbours + sampled 180° arcs at row-end transitions.
  const points = [{ ...nodes[0].position }];
  const nodePointIndex = { 0: 0 };
  let currentIndex = 0;

  const push = (p) => {
    points.push({ x: p.x, y: 0, z: p.z });
    currentIndex += 1;
  };

  for (let i = 0; i < n - 1; i += 1) {
    const a = nodes[i].position;
    const b = nodes[i + 1].position;
    const rowA = Math.floor(i / COLS);
    const rowB = Math.floor((i + 1) / COLS);
    if (rowA === rowB) {
      push(b); // straight run
    } else {
      // Row end -> row start on the same side: a U-turn bulging outwards.
      const r = (b.z - a.z) / 2;
      const zMid = (a.z + b.z) / 2;
      const side = a.x >= 0 ? 1 : -1;
      for (let k = 1; k <= ARC_POINTS; k += 1) {
        const dz = -r + (2 * r * k) / (ARC_POINTS + 1);
        const bulge = Math.sqrt(Math.max(0, r * r - dz * dz)) * side;
        push({ x: a.x + bulge, y: 0, z: zMid + dz });
      }
      push(b);
    }
    nodePointIndex[i + 1] = currentIndex;
  }

  // Difficulty-coloured segments (one per consecutive pair).
  const segments = [];
  for (let i = 0; i < n - 1; i += 1) {
    segments.push({ fromIndex: i, toIndex: i + 1, difficulty: nodes[i].difficulty });
  }

  const xs = nodes.map((node) => node.position.x);
  const zs = nodes.map((node) => node.position.z);
  const width = Math.max(...xs) - Math.min(...xs) + PITCH;
  const depth = Math.max(...zs) - Math.min(...zs) + ROW_GAP;

  return { nodes, path: points, segments, bounds: { width, depth }, nodePointIndex };
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

/**
 * Sample the polyline at arc-length parameter t ∈ [0, 1].
 * Returns { position: {x,y,z}, tangent: {x,z} } with the xz tangent normalized.
 */
export function samplePath(points, t) {
  if (points.length === 0) return { position: { x: 0, y: 0, z: 0 }, tangent: { x: 0, z: 0 } };
  if (points.length === 1) return { position: { ...points[0] }, tangent: { x: 1, z: 0 } };
  if (t <= 0) return { position: { ...points[0] }, tangent: tangentOf(points[0], points[1]) };
  if (t >= 1) return { position: { ...points[points.length - 1] }, tangent: tangentOf(points[points.length - 2], points[points.length - 1]) };

  const lengths = [];
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += dist(points[i - 1], points[i]);
    lengths.push(total);
  }
  const target = t * total;
  let segment = 0;
  while (segment < lengths.length - 1 && lengths[segment] < target) segment += 1;
  const a = points[segment];
  const b = points[segment + 1];
  const len = lengths[segment] - (segment === 0 ? 0 : lengths[segment - 1]);
  const local = len === 0 ? 0 : (target - (segment === 0 ? 0 : lengths[segment - 1])) / len;
  return {
    position: { x: a.x + (b.x - a.x) * local, y: 0, z: a.z + (b.z - a.z) * local },
    tangent: tangentOf(a, b),
  };
}

function tangentOf(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}