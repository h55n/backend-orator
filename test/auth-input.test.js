import assert from 'node:assert/strict';
import test from 'node:test';
import { Pool } from 'pg';

test('auth rejects missing or malformed credentials before querying the database', async t => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'offline-auth-validation-fixture';
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  let queries = 0;
  let acceptValid = false;
  let lastParameters;
  t.mock.method(Pool.prototype, 'query', (_query, parameters) => {
    lastParameters = parameters;
    queries += 1;
    if (acceptValid) return Promise.resolve({ rows: [] });
    throw new Error('Invalid credentials must not reach the database');
  });
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cases = [
    undefined,
    {},
    { email: 'person@example.invalid' },
    { password: 'test-password' },
    { email: '', password: 'test-password' },
    { email: '   ', password: 'test-password' },
    { email: 'person@example.invalid', password: '' },
    { email: 123, password: 'test-password' },
    { email: ['person@example.invalid'], password: 'test-password' },
    { email: 'person@example.invalid', password: 123 },
    { email: 'person@example.invalid', password: ['test-password'] },
  ];
  for (const route of ['register', 'login']) {
    for (const body of cases) {
      await t.test(`${route}: ${JSON.stringify(body)}`, async () => {
        const response = await fetch(`${base}/api/auth/${route}`, {
          method: 'POST',
          ...(body === undefined ? {} : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
        });
        assert.equal(response.status, 400);
        assert.match(response.headers.get('content-type'), /application\/json/);
        assert.deepEqual(await response.json(), { message: 'Email and password are required' });
      });
    }
  }
  assert.equal(queries, 0);
  acceptValid = true;
  const response = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'person@example.invalid', password: ' ' }),
  });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Invalid email or password' });
  assert.equal(queries, 1);
  assert.deepEqual(lastParameters, ['person@example.invalid']);
});
