import * as THREE from 'three';
import { RULES } from '../core/rules.js';

export function cellToWorld(row, col) {
  const half = RULES.boardSize / 2;
  return { x: col - half - 0.5, z: row - half - 0.5 };
}

export function createBoard(scene) {
  const group = new THREE.Group();
  const half = RULES.boardSize / 2;

  const tileGeometry = new THREE.BoxGeometry(1, 0.2, 1);
  const tileMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a4c, roughness: 0.95 });
  const altMaterial = new THREE.MeshStandardMaterial({ color: 0x31445a, roughness: 0.95 });

  for (let row = 1; row <= RULES.boardSize; row += 1) {
    for (let col = 1; col <= RULES.boardSize; col += 1) {
      const tile = new THREE.Mesh(tileGeometry, (row + col) % 2 === 0 ? tileMaterial : altMaterial);
      const { x, z } = cellToWorld(row, col);
      tile.position.set(x, -0.1, z);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }

  // Frame around the board.
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(RULES.boardSize + 0.4, 0.28, RULES.boardSize + 0.4),
    new THREE.MeshStandardMaterial({ color: 0x18242f, roughness: 0.8 }),
  );
  frame.position.set(0, -0.22, 0);
  frame.receiveShadow = true;
  group.add(frame);

  // The red carpet just outside the exit on row 3.
  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.06, 1),
    new THREE.MeshStandardMaterial({ color: 0xb3121a, emissive: 0x400006, roughness: 0.6 }),
  );
  const exit = cellToWorld(RULES.exitRow, RULES.boardSize + 1);
  carpet.position.set(exit.x + 0.5, 0.06, exit.z);
  carpet.receiveShadow = true;
  group.add(carpet);

  scene.add(group);
  return { group, carpet };
}
