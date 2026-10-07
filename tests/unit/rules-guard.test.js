import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RULES, rulesMatchReference } from '../../src/core/rules.js';

const rulesPath = fileURLToPath(new URL('../../RULES.md', import.meta.url));

test('the frozen RULES match the verbatim RULES.md', () => {
  const text = readFileSync(rulesPath, 'utf8');
  assert.equal(
    rulesMatchReference(text),
    true,
    'RULES constants drifted from RULES.md — amend the reference explicitly, do not edit code',
  );
});

test('RULES is frozen against mutation', () => {
  assert.throws(() => {
    'use strict';
    RULES.boardSize = 99;
  });
});
