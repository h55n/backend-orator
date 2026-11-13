import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

test('question generation rejects malformed input before Groq or database calls', async t => {
  const previous = { JWT_SECRET: process.env.JWT_SECRET, GROQ_API_KEY: process.env.GROQ_API_KEY };
  process.env.JWT_SECRET = 'offline-generation-validation-fixture';
  process.env.GROQ_API_KEY = 'offline-fixture-not-a-real-key';
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const databaseCalls = [];
  t.mock.method(Pool.prototype, 'query', async (sql, parameters) => {
    databaseCalls.push({ sql, parameters });
    return { rows: [{ id: 'offline-session' }] };
  });
  const realFetch = globalThis.fetch;
  const groqCalls = [];
  const questions = [{ id: 'q1', question: 'Explain closures', difficulty: 'Medium', category: 'Technical' }];
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith('http://127.0.0.1:')) return realFetch(input, options);
    assert.equal(new URL(url).hostname, 'api.groq.com');
    groqCalls.push(JSON.parse(options?.body ?? await input.clone().text()));
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(questions) } }] }), {
      headers: { 'content-type': 'application/json' },
    });
  });
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.on('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/questions/generate`;
  const token = jwt.sign({ id: 'generation-user', sub: 'offline-test' }, process.env.JWT_SECRET);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const valid = { jobRole: 'Backend Developer', technology: 'Node.js', experienceLevel: 'Intermediate' };
  const invalid = [undefined, {}, [], { technology: 'Node.js' }, { jobRole: 'Backend Developer' }];
  for (const field of ['jobRole', 'technology', 'experienceLevel']) {
    for (const value of [null, '', ' \t\n ', false, 42, [], {}]) invalid.push({ ...valid, [field]: value });
  }
  for (const [index, body] of invalid.entries()) {
    await t.test(`invalid request ${index + 1}`, async () => {
      const response = await fetch(url, { method: 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body) });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { message: 'Job role and technology must be non-empty strings; experience level must be a non-empty string when provided' });
      assert.equal(groqCalls.length, 0);
      assert.equal(databaseCalls.length, 0);
    });
  }
  for (const body of [valid, { jobRole: 'Custom role', technology: 'Custom technology' }]) {
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { sessionId: 'offline-session', questions });
    assert.equal(databaseCalls.at(-1).parameters[0], 'generation-user');
    assert.equal(databaseCalls.at(-1).parameters[1], body.jobRole);
    assert.equal(databaseCalls.at(-1).parameters[2], body.technology);
    assert.equal(databaseCalls.at(-1).parameters[3], body.experienceLevel || 'Mid Level');
  }
  assert.equal(groqCalls.length, 2);
  assert.equal(databaseCalls.length, 2);
});
