import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { createServer } from '../server.mjs';

const searchId = 'post-berkas-cariberkas-d88218';
const printId = 'post-berkas-getstatuscetak-d87ca8';
const config = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-application' };
const token = { tokenType: 'Bearer', accessToken: 'fixture-search-token', refreshToken: 'fixture-search-refresh', expiredAt: 4_000_000_000 };
const context = { authenticated: true };
const requestFor = (path = '/berkas/CariBerkas', overrides = {}) => ({ path, method: 'POST', encoding: 'form', auth: 'session', session: { tokens: { ...token } }, body: { nomor: '0012', tahun: '2026', kantorId: 'fixture-office', berkasId: null }, ...overrides });
const json = (data, status = 200) => Response.json(data, { status });

test('CariBerkas alone retains its four native nullable form keys for search and detail callers', () => {
  for (const values of [{}, { berkasId: 'fixture-detail' }, { nomor: '0012', tahun: '2026', kantorId: '', berkasId: null }]) {
    const prepared = prepareOperation(searchId, values, context);
    assert.deepEqual({ ...prepared.body }, { nomor: null, tahun: null, kantorId: null, berkasId: null, ...values });
  }
  assert.deepEqual({ ...prepareOperation(searchId, { nomor: 12, tahun: 2026 }, context).body }, { nomor: '12', tahun: '2026', kantorId: null, berkasId: null }, 'Existing numeric-to-string compatibility remains unchanged');
  assert.deepEqual({ ...prepareOperation(searchId, { nomor: undefined }, context).body }, { nomor: null, tahun: null, kantorId: null, berkasId: null });
  assert.throws(() => prepareOperation(searchId, {}, {}), error => error.code === 'LOGIN_REQUIRED');
  for (const value of [false, [], {}, 'x'.repeat(16001), 'bad\0value']) assert.throws(() => prepareOperation(searchId, { nomor: value }, context), error => error.code === 'INVALID_FIELD');
  assert.throws(() => prepareOperation(searchId, { url: '/other' }, context), error => error.code === 'UNKNOWN_FIELD');
  const nullable = OPERATIONS.filter(operation => operation.encoding === 'form').flatMap(operation => operation.fields.filter(field => field.preserveNull).map(field => `${operation.id}/${field.path}`));
  assert.deepEqual(nullable, ['nomor', 'tahun', 'kantorId', 'berkasId'].map(key => `${searchId}/${key}`));
  assert.deepEqual({ ...prepareOperation('post-apis-getdocument-d41ee8', { q: 'fixture-code', name: null }, context).body }, { q: 'fixture-code' }, 'Other optional null values retain their existing omission policy');
});

test('CariBerkas wire distinguishes bare null keys, empty values and existing text', async () => {
  const calls = [];
  const client = new ApiClient(config, { log: () => {}, transport: async (url, init) => { calls.push(init); return json({ data: {} }); } });
  for (const values of [
    { nomor: '0012', tahun: '2026', kantorId: 'fixture +&=', berkasId: null },
    { nomor: null, tahun: null, kantorId: null, berkasId: 'fixture/detail' },
    { nomor: '', tahun: '2026', kantorId: '', berkasId: '' },
    { nomor: '0012', tahun: '2026', kantorId: "é 🙂 !*~()'%", berkasId: null },
  ]) await client.request(requestFor(undefined, { body: prepareOperation(searchId, values, context).body }));
  assert.equal(calls[0].body, 'nomor=0012&tahun=2026&kantorId=fixture+%2B%26%3D&berkasId');
  assert.equal(calls[1].body, 'nomor&tahun&kantorId&berkasId=fixture%2Fdetail');
  assert.equal(calls[2].body, 'nomor=&tahun=2026&kantorId=&berkasId=');
  assert.equal(calls[3].body, 'nomor=0012&tahun=2026&kantorId=%C3%A9+%F0%9F%99%82+%21%2A~%28%29%27%25&berkasId');
  assert.equal(calls[0].headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[0].headers.Authorization, 'Bearer fixture-search-token');
  assert.equal(await new Request('https://sentuh.atrbpn.go.id/berkas/CariBerkas', { method: 'POST', headers: calls[0].headers, body: calls[0].body }).text(), calls[0].body, 'Native HTTPS transport normalizes through Request without changing bare null keys');
  await client.request(requestFor('berkas/berkassop', { body: { berkasid: 'fixture', nullable: null, empty: '' } }));
  assert.ok(calls[4].body instanceof URLSearchParams);
  assert.equal(calls[4].body.toString(), 'berkasid=fixture&empty=');
  await assert.rejects(client.request(requestFor(undefined, { body: { nomor: {} } })), error => error.code === 'FORM_SHAPE_UNSUPPORTED');
  assert.equal(calls.length, 5);
});

test('only the audited session/form envelopes may retain error:true', async () => {
  const envelope = { error: true, message: 'fixture print status', data: { berkasId: 'fixture-result' } };
  const client = new ApiClient(config, { log: () => {}, transport: async () => json(envelope) });
  for (const path of ['/berkas/CariBerkas', 'berkas/getStatusCetak']) assert.deepEqual((await client.request(requestFor(path))).data, envelope);
  for (const request of [
    requestFor('berkas/berkassop'), requestFor('account/account_summary'),
    requestFor(undefined, { auth: 'none' }), requestFor(undefined, { auth: 'optionalSession' }),
    requestFor(undefined, { encoding: 'json' }), requestFor(undefined, { encoding: 'urlencoded' }),
    requestFor(undefined, { query: { extra: 'fixture' } }),
    requestFor(undefined, { method: 'GET', encoding: 'none', body: {} }),
    requestFor(undefined, { base: 'https://antre.atrbpn.go.id/', auth: 'none' }),
  ]) await assert.rejects(client.request(request), error => error.code === 'UPSTREAM_REJECTED');
  await assert.rejects(client.request(requestFor(undefined, { base: 'https://antre.atrbpn.go.id/' })), error => error.code === 'TOKEN_AUDIENCE_UNVERIFIED');
});

test('Berkas response exceptions retain HTTP, redirect, parse, session and size boundaries', async () => {
  for (const status of [201, 299]) {
    const envelope = { error: true, message: `fixture print status ${status}` };
    const client = new ApiClient(config, { log: () => {}, transport: async () => json(envelope, status) });
    const printed = await client.request(requestFor('berkas/getStatusCetak'));
    assert.equal(printed.status, status);
    assert.deepEqual(printed.data, envelope, 'Print consumes its message for every shared accepted 2xx status');
    await assert.rejects(client.request(requestFor('/berkas/CariBerkas')), error => error.code === 'UPSTREAM_REJECTED', 'Primary search retains its HTTP200-only envelope exception');
  }
  for (const path of ['/berkas/CariBerkas', 'berkas/getStatusCetak']) {
    for (const status of [400, 403, 500, 503]) {
      const client = new ApiClient(config, { log: () => {}, transport: async () => json({ error: true, message: 'fixture rejection' }, status) });
      await assert.rejects(client.request(requestFor(path)), error => error.code === 'UPSTREAM_REJECTED');
    }
    const session = { tokens: { ...token } };
    const rejected = new ApiClient(config, { log: () => {}, transport: async () => json({ error: true, message: 'expired' }, 401) });
    await assert.rejects(rejected.request(requestFor(path, { session })), error => error.code === 'SESSION_EXPIRED');
    assert.equal(session.tokens, null);
    for (const [response, code] of [
      [new Response(null, { status: 300 }), 'UPSTREAM_REDIRECT'],
      [new Response(null, { status: 302, headers: { Location: 'https://example.invalid/' } }), 'UPSTREAM_REDIRECT'],
      [new Response('{', { headers: { 'Content-Type': 'application/json' } }), 'INVALID_UPSTREAM_JSON'],
      [new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': String(20 * 1024 * 1024 + 1) } }), 'RESPONSE_TOO_LARGE'],
    ]) {
      const client = new ApiClient(config, { log: () => {}, transport: async () => response });
      await assert.rejects(client.request(requestFor(path)), error => error.code === code);
    }
  }
});

async function localFixture(t, responder) {
  const calls = [];
  const server = createServer({ configuration: config, log: () => {}, transport: async (url, init) => {
    calls.push({ path: url.pathname, ...init });
    if (url.pathname === '/auth/signin') return json({ data: { username: 'fixture-user', token } });
    return responder(url, init);
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', state;
  async function request(route, data) {
    const response = await fetch(base + route, { method: data === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, ...(data === undefined ? {} : { Origin: base, 'X-CSRF-Token': state.csrfToken, 'Content-Type': 'application/json' }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const body = await response.json(); if (body.csrfToken) state = body;
    return { status: response.status, body };
  }
  await request('/api/state'); await request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  return { request, calls };
}

test('execute preserves audited search/print responses while retaining redaction and local validation', async t => {
  const f = await localFixture(t, url => json({ error: true, message: `status ${token.accessToken}`, data: url.pathname === '/berkas/CariBerkas' ? { berkasId: 'fixture-result' } : null }));
  const result = await f.request('/api/execute', { operationId: searchId, values: { nomor: '0012', tahun: '2026', kantorId: 'fixture-office', berkasId: null } });
  assert.equal(result.status, 200);
  assert.equal(result.body.result.data.error, true);
  assert.equal(result.body.result.data.data.berkasId, 'fixture-result');
  assert.equal(result.body.result.data.message, 'status [REDACTED]');
  assert.equal(f.calls.at(-1).body, 'nomor=0012&tahun=2026&kantorId=fixture-office&berkasId');
  const printed = await f.request('/api/execute', { operationId: printId, values: { berkasid: 'fixture-result' } });
  assert.equal(printed.status, 200); assert.equal(printed.body.result.data.message, 'status [REDACTED]');
  const count = f.calls.length;
  assert.equal((await f.request('/api/execute', { operationId: searchId, values: { nomor: {} } })).status, 400);
  assert.equal(f.calls.length, count);
});

test('logout during a delayed CariBerkas response still prevents delivery or session resurrection', async t => {
  let release, started;
  const ready = new Promise(resolve => { started = resolve; });
  const f = await localFixture(t, async () => { started(); return new Promise(resolve => { release = resolve; }); });
  const pending = f.request('/api/execute', { operationId: searchId, values: { berkasId: 'fixture-detail' } });
  await ready;
  assert.equal((await f.request('/api/logout', {})).status, 200);
  release(json({ error: true, data: { berkasId: 'fixture-result' } }));
  const result = await pending;
  assert.equal(result.status, 401); assert.equal(result.body.error.code, 'SESSION_EXPIRED');
  assert.equal((await f.request('/api/state')).body.authenticated, false);
});
