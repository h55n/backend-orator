import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

test('favorites validates pagination before querying the database', async t => {
  const old = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'offline-pagination-validation-fixture';
  t.after(() => old === undefined ? delete process.env.JWT_SECRET : process.env.JWT_SECRET = old);
  const calls = [];
  t.mock.method(Pool.prototype, 'query', (sql, parameters) => {
    calls.push({ sql, parameters });
    return Promise.resolve({ rows: sql.includes('COUNT(*)') ? [{ count: '41' }] : [] });
  });
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/favorites`;
  const token = jwt.sign({ id: 'pagination-user', sub: 'offline-test' }, process.env.JWT_SECRET);
  const headers = { Authorization: `Bearer ${token}` };
  for (const query of [
    'page=-1', 'size=-1', 'size=0', 'page=1.5', 'size=2.5',
    'page=abc', 'size=20items', 'page=', 'size=',
    'page=1&page=2', 'size=1&size=2',
    'page=9007199254740992', 'size=9007199254740992',
    'page=9007199254740991&size=20',
  ]) {
    await t.test(query, async () => {
      const before = calls.length;
      const response = await fetch(`${url}?${query}`, { headers });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { message: 'Invalid pagination parameters' });
      assert.equal(calls.length, before);
    });
  }
  for (const [query, size, offset, pages] of [
    ['', 20, 0, 3], ['page=0', 20, 0, 3], ['page=2&size=10', 10, 20, 5],
  ]) {
    const response = await fetch(`${url}?${query}`, { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: [], totalPages: pages, totalElements: 41 });
    assert.deepEqual(calls.at(-1).parameters, ['pagination-user', size, offset]);
  }
  assert.equal(calls.length, 6);
});
