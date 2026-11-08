import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../api/index.js';

test('source-visible fallback secret cannot authenticate a user', async t => {
  const old = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ id: 'synthetic', sub: 'test' }, 'fallback_secret');
  const response = await fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(response.status, 503);
});
test('missing configuration rejects login before any database request', async t => {
  const old = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.invalid', password: 'test-only' }) });
  assert.equal(response.status, 503);
});
test('configured signing key authenticates genuine sessions and rejects wrong keys', async t => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-not-a-live-jwt-key-at-least32characters';
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/auth/me`;
  for (const [secret, expected] of [[process.env.JWT_SECRET, 200], ['fallback_secret', 401]]) {
    const token = jwt.sign({ id: 'synthetic', sub: 'test' }, secret);
    assert.equal((await fetch(base, { headers: { Authorization: 'Bearer ' + token } })).status, expected);
  }
});
test('short signing keys are not accepted as valid configuration', async t => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'too-short';
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/me`);
  assert.equal(response.status, 503);
});
