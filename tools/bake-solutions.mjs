// Offline tool: compute optimal solutions for every challenge and write them back.
// Reuses the pure core solver so baked answers always match the game's own rules (Principle V).
// Never loaded by the shipped app. Run: node tools/bake-solutions.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { solve } from '../src/core/solver.js';
import { validateCatalog } from '../src/core/schema.js';

const catalogPath = fileURLToPath(new URL('../challenges.json', import.meta.url));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));

let baked = 0;
let failed = false;
for (const challenge of catalog.challenges) {
  const solution = solve(challenge.vehicles);
  if (!solution) {
    console.error(`Unsolvable challenge: ${challenge.id}`);
    failed = true;
    continue;
  }
  challenge.solution = solution;
  challenge.optimalMoveCount = solution.length;
  baked += 1;
}

if (failed) process.exit(1);

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const result = validateCatalog(catalog);
if (!result.ok) {
  console.error('Catalog validation failed:');
  for (const error of result.errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`Baked optimal solutions for ${baked} challenges; catalog is valid.`);
