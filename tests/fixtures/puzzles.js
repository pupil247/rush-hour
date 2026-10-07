// Shared small puzzles for unit tests. Not part of the shipped catalog.
export const redBlockedByCar = {
  id: 'fixture-blocked',
  name: 'Fixture bloquée',
  difficulty: 'Débutant',
  vehicles: [
    { id: 'r', kind: 'car', orientation: 'H', row: 3, col: 4, isRed: true },
    { id: 'b', kind: 'car', orientation: 'V', row: 3, col: 6, isRed: false },
  ],
  solution: [
    { vehicleId: 'b', delta: 1 },
    { vehicleId: 'r', delta: 3 },
  ],
  optimalMoveCount: 2,
};

export const unsolvablePair = {
  id: 'fixture-unsolvable',
  vehicles: [
    { id: 'r', kind: 'car', orientation: 'H', row: 3, col: 1, isRed: true },
    { id: 't', kind: 'truck', orientation: 'H', row: 3, col: 3, isRed: false },
  ],
};

export const simpleLayout = [
  { id: 'r', kind: 'car', orientation: 'H', row: 3, col: 4, isRed: true },
  { id: 'b', kind: 'car', orientation: 'V', row: 3, col: 6, isRed: false },
];
