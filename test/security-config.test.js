import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

test('database scripts use DATABASE_URL without embedding a connection URL', () => {
  for (const file of ['init-db.js', 'test.js']) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

    assert.match(source, /process\.env\.DATABASE_URL/);
    assert.doesNotMatch(source, /postgres(?:ql)?:\/\//i);
  }
});

function runNode(args, envOverrides) {
  return spawnSync(process.execPath, args, {
    cwd: repoRoot,
    env: { ...process.env, ...envOverrides },
    encoding: 'utf8',
  });
}

test('database initialization stops before connecting when DATABASE_URL is missing', () => {
  const result = runNode(['init-db.js'], { DATABASE_URL: '' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /DATABASE_URL is required/);
  assert.doesNotMatch(result.stderr, /postgres(?:ql)?:\/\/[^\s]+/i);
});

test('API startup rejects a missing JWT_SECRET instead of using a fallback', () => {
  const result = runNode(
    ['--input-type=module', '-e', "await import('./api/index.js')"],
    { JWT_SECRET: '' },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET must be configured/);
  assert.doesNotMatch(result.stderr, /fallback_secret/);
});
