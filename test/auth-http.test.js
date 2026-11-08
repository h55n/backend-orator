import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';

test('configured auth accepts genuine sessions and rejects wrong signatures', async t => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'offline-test-only-not-a-production-signing-key';
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/auth/me`;
  for (const [key, expected] of [[process.env.JWT_SECRET, 200], ['fallback_secret', 401]]) {
    const token = jwt.sign({ id: 'synthetic', sub: 'offline-test' }, key);
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    assert.equal(response.status, expected);
  }
});
