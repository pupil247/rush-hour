import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const coreDir = fileURLToPath(new URL('../../src/core', import.meta.url));

test('core modules import neither the DOM nor Three.js', () => {
  for (const file of readdirSync(coreDir)) {
    if (!file.endsWith('.js')) continue;
    const raw = readFileSync(new URL(`../../src/core/${file}`, import.meta.url), 'utf8');
    const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    assert.ok(!/from\s+['"]three['"]/.test(code), `${file} must not import three`);
    assert.ok(
      !/\bdocument\.|\bwindow\.|\bglobalThis\.(document|window)/.test(code),
      `${file} must not touch the DOM`,
    );
  }
});
