import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from '../../src/core/schema.js';

test('the shipped challenges.json is a valid, solver-verified catalog', () => {
  const path = fileURLToPath(new URL('../../challenges.json', import.meta.url));
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const result = validateCatalog(data);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(data.challenges.length, 10);
});
