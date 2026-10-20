import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';
import { decodeUserCollectionEnvelope, decodePersilCollectionGroupEnvelope } from '../private/collection-response.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// Upstream responses and credentials are synthetic. HTTP tests use loopback only.
const cases = [
  { id: 'get-collection-getusercollection-d31a50', path: 'collection/GetUserCollection', decode: decodeUserCollectionEnvelope,
    row: { id: ' row-id ', type: 'PERSIL', contentId: ' full:content-id ', createdAt: '2026-03-19T03:04:05+07:00', email: 'fixture@example.invalid', title: '', subTitle: ' subtitle ', groupId: '' } },
  { id: 'get-collection-getpersilcollectiongroup-d31fbc', path: 'collection/GetPersilCollectionGroup', decode: decodePersilCollectionGroupEnvelope,
    row: { collectionGroupId: '', collectionGroupName: '', createdAt: ' raw date ' } },
];
const blank = entry => Object.fromEntries(Object.keys(entry.row).map(key => [key, null]));
const token = { tokenType: 'Bearer', accessToken: 'fixture-collection-access', refreshToken: 'fixture-collection-refresh', expiredAt: 4_000_000_000 };
const config = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-collection-application' };
const session = () => ({ active: true, tokens: { ...token } });
const request = entry => { const prepared = prepareOperation(entry.id, {}, { authenticated: true }); return { ...prepared, base: prepared.service.baseUrl, session: session() }; };
const clientFor = response => new ApiClient(config, { log: () => {}, transport: async () => typeof response === 'function' ? response() : response });

async function fixture(t, responder) {
  const calls = [], logs = [], sessions = new SessionStore();
  const server = createServer({ configuration: config, sessions, log: entry => logs.push(entry), transport: async (url, init) => {
    calls.push({ url: new URL(url), ...init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { username: 'fixture-collection-user', token: { ...token } } });
    return responder(url, init);
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', state;
  async function send(path, data, headers = {}) {
    const response = await fetch(base + path, { method: data === undefined ? 'GET' : 'POST', headers: {
      ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { Origin: base, 'X-CSRF-Token': state?.csrfToken ?? '', 'Content-Type': 'application/json' }), ...headers,
    }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const result = await response.json();
    if (result.csrfToken) state = result;
    return { response, result };
  }
  await send('/api/state');
  return { calls, logs, sessions, send, login: () => send('/api/login', { username: 'fixture-collection-user', password: 'fixture-collection-password' }),
    execute: (entry, values = {}, headers) => send('/api/execute', { operationId: entry.id, values }, headers) };
}

test('collection registry keeps both enabled main-session GET reads parameter-free', () => {
  for (const entry of cases) {
    const operation = OPERATIONS.find(item => item.id === entry.id);
    for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: 'GET', path: entry.path, encoding: 'none', effect: 'read', mutates: false, requiresConfirmation: false })) assert.equal(operation[key], value);
    const prepared = request(entry);
    assert.deepEqual({ ...prepared.body }, {}); assert.deepEqual({ ...prepared.query }, {}); assert.deepEqual(prepared.files, []);
    for (const key of ['id', 'groupId', 'page', 'url', 'headers']) assert.throws(() => prepareOperation(entry.id, { [key]: 'unexpected' }, { authenticated: true }), { code: 'UNKNOWN_FIELD' });
  }
});

test('collection models preserve every known nullable String, order, duplicates and blank values', () => {
  for (const entry of cases) {
    const input = { error: true, message: '', data: [entry.row, {}, blank(entry), { ...entry.row, ignored: 'discard', accessToken: 'discard' }, entry.row], secret: 'discard' };
    const before = JSON.stringify(input), decoded = entry.decode(input);
    assert.deepEqual(decoded, { error: true, message: '', data: [entry.row, blank(entry), blank(entry), entry.row, entry.row] });
    assert.equal(JSON.stringify(input), before); assert.notEqual(decoded.data[0], entry.row); assert.notEqual(decoded.data[0], decoded.data[4]);
    decoded.data[0].createdAt = 'local edit'; assert.equal(JSON.stringify(input), before);
    assert.equal(entry.decode({ data: Array.from({ length: 37 }, () => entry.row) }).data.length, 37);
    assert.deepEqual(entry.decode(Object.assign(Object.create(null), { data: [Object.create(null)] })), { error: null, message: null, data: [blank(entry)] });
    const dangerous = JSON.parse('{"data":[{"__proto__":{"title":"hidden"},"constructor":{"title":"hidden"}}],"authorization":"discard"}');
    assert.deepEqual(entry.decode(dangerous), { error: null, message: null, data: [blank(entry)] });
  }
});

test('missing or null collection data is a successful empty native snapshot boundary', () => {
  for (const entry of cases) {
    for (const input of [{}, { data: null }, { error: null, message: null, data: null }]) assert.deepEqual(entry.decode(input), { error: null, message: null, data: null });
    for (const error of [true, false, null]) assert.deepEqual(entry.decode({ error, message: ' raw message ', data: [] }), { error, message: ' raw message ', data: [] });
  }
});

test('collection models reject String JSON roots, nested shapes and malformed list records', () => {
  for (const entry of cases) for (const input of [null, undefined, [], true, 1, '{}', JSON.stringify({ data: [entry.row] }), { data: {} }, { data: '[]' }, { data: 0 }, { data: false }, { data: undefined }, { data: [null] }, { data: [[]] }, { data: [1] }, { data: ['row'] }, { data: Array(1) }, Object.create({ data: [] }), { data: [Object.create({ title: 'inherited' })] }]) {
    assert.throws(() => entry.decode(input), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
  }
});

test('each collection model field and both envelope fields reject non-null values of the wrong type', () => {
  for (const entry of cases) {
    for (const field of Object.keys(entry.row)) for (const value of [0, 1, true, false, {}, [], undefined]) assert.throws(() => entry.decode({ error: true, data: [{ ...entry.row, [field]: value }] }), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
    for (const value of [0, 1, 'true', {}, [], undefined]) assert.throws(() => entry.decode({ error: value, data: [] }), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
    for (const value of [0, 1, true, false, {}, [], undefined]) assert.throws(() => entry.decode({ message: value, data: [] }), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
  }
});

test('collection wire reads use exact fixed URLs and stored credentials without a body or query', async () => {
  const calls = [];
  const client = new ApiClient(config, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, data: [] }); } });
  for (const entry of cases) {
    const result = await client.request(request(entry)), { url, init } = calls.at(-1);
    assert.equal(url.href, `https://sentuh.atrbpn.go.id/${entry.path}`); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.equal(init.headers.Accept, 'application/json'); assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded'); assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`);
    assert.deepEqual(result.data, { error: true, message: null, data: [] }); assert.equal(result.status, 200);
  }
});

test('collection transport exception requires the canonical method profile auth path and empty parameters', async () => {
  let calls = 0;
  const client = new ApiClient(config, { log: () => {}, transport: async () => { calls++; return Response.json({ data: [] }); } });
  for (const entry of cases) {
    const original = request(entry);
    for (const patch of [{ method: 'POST' }, { method: 'HEAD' }, { encoding: 'form' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { query: { page: undefined } }, { query: { page: '1' } }, { path: entry.path + '?page=1' }, { path: entry.path + '#fragment' }, { path: '/' + entry.path }, { body: { id: 'unexpected' } }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...original, ...patch }), { code: 'COLLECTION_READ_SCOPE' });
    await assert.rejects(client.request({ ...original, session: undefined }), { code: 'AUTH_REQUIRED' });
    await assert.rejects(client.request({ ...original, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
  }
  assert.equal(calls, 0);
});

test('only typed HTTP200 collection envelopes can bypass the generic business-error check', async () => {
  for (const entry of cases) {
    for (const envelope of [{ error: true, message: 'upstream flag', data: [entry.row, {}] }, { error: true, data: null }, { error: true }]) {
      for (const response of [Response.json(envelope), new Response(JSON.stringify(envelope), { headers: { 'Content-Type': 'text/plain' } })]) {
        const result = await clientFor(response).request(request(entry)); assert.equal(result.status, 200); assert.deepEqual(result.data, entry.decode(envelope));
      }
    }
    for (const status of [201, 202, 204, 206, 299, 400, 401, 403, 404, 500]) {
      const response = status === 204 ? new Response(null, { status }) : Response.json({ error: false, data: [entry.row] }, { status });
      await assert.rejects(clientFor(response).request(request(entry)), error => error.code === (status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED') && error.status === (status === 401 ? 401 : status === 403 ? 403 : 502) && error.details.upstreamStatus === status);
    }
    await assert.rejects(clientFor(new Response(null, { status: 302, headers: { Location: 'https://untrusted.example.invalid/' } })).request(request(entry)), { code: 'UPSTREAM_REDIRECT' });
  }
  for (const input of [{ path: 'account/fixture', auth: 'none' }, { path: 'collection/fixtureUnaudited', auth: 'session', session: session() }, { path: 'collection/getusercollection', method: 'GET', encoding: 'none', auth: 'session', session: session() }, { ...request(cases[0]), base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: [] })).request(input), { code: 'UPSTREAM_REJECTED' });
  await assert.rejects(clientFor(Response.json({ error: true, data: [] })).request({ ...request(cases[0]), base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
});

test('invalid collection HTTP200 bodies fail without raw fallback, String redecoding or reflected values', async () => {
  const sentinel = 'fixture-do-not-echo-sensitive-collection-value';
  for (const entry of cases) for (const response of [Response.json(JSON.stringify({ data: [entry.row] })), Response.json({ error: true, data: [{ createdAt: { secret: sentinel } }] }), Response.json({ error: 'true', data: [] }), Response.json({ message: [], data: [] }), Response.json({ data: { data: [] } }), Response.json([entry.row]), new Response('<html>' + sentinel + '</html>', { headers: { 'Content-Type': 'text/html' } }), new Response('', { headers: { 'Content-Type': 'application/octet-stream' } })]) {
    await assert.rejects(clientFor(response).request(request(entry)), error => error.code === 'COLLECTION_RESPONSE_UNRECOGNIZED' && !JSON.stringify(error).includes(sentinel) && !error.cause);
  }
  for (const entry of cases) await assert.rejects(clientFor(new Response('{bad', { headers: { 'Content-Type': 'application/json' } })).request(request(entry)), { code: 'INVALID_UPSTREAM_JSON' });
});

test('collection HTTP execution keeps authentication Origin CSRF and parameter guards', async t => {
  const f = await fixture(t, url => Response.json({ error: true, data: [cases.find(entry => '/' + entry.path === url.pathname).row, {}] }));
  for (const entry of cases) assert.equal((await f.execute(entry)).response.status, 401);
  assert.equal(f.calls.length, 0);
  await f.login();
  for (const entry of cases) {
    assert.equal((await f.execute(entry, {}, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
    assert.equal((await f.execute(entry, {}, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
    assert.equal((await f.execute(entry, { page: '2' })).response.status, 400);
    const output = await f.execute(entry); assert.equal(output.response.status, 200);
    assert.deepEqual(output.result.result, { status: 200, contentType: 'application/json', data: { error: true, message: null, data: [entry.row, blank(entry)] } });
  }
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', ...cases.map(entry => '/' + entry.path)]);
});

test('collection HTTP failures remain failures and a refreshed session can retry', async t => {
  let attempts = 0;
  const f = await fixture(t, url => {
    if (url.pathname === '/auth/refresh_token') return Response.json({ data: { ...token, accessToken: 'fixture-collection-renewed' } });
    if (++attempts === 1) throw Object.assign(new Error('fixture transient'), { code: 'ECONNRESET' });
    if (attempts === 2) return Response.json({ error: true, data: [{ title: 42 }] });
    return Response.json({ error: true, data: null });
  });
  await f.login(); const current = [...f.sessions.sessions.values()][0]; current.tokens.expiredAt = 1;
  const failed = await f.execute(cases[0]); assert.equal(failed.response.status, 502); assert.equal(failed.result.error.code, 'UPSTREAM_UNREACHABLE');
  const malformed = await f.execute(cases[0]); assert.equal(malformed.response.status, 502); assert.equal(malformed.result.error.code, 'COLLECTION_RESPONSE_UNRECOGNIZED');
  const success = await f.execute(cases[0]); assert.equal(success.response.status, 200); assert.deepEqual(success.result.result.data, { error: true, message: null, data: null });
  assert.equal((await f.send('/api/state')).result.authenticated, true);
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/auth/refresh_token', ...Array(3).fill('/' + cases[0].path)]);
  assert.ok(f.calls.slice(2).every(call => call.headers.Authorization === 'Bearer fixture-collection-renewed'));
});

test('collection HTTP output and logs retain existing credential redaction', async t => {
  const f = await fixture(t, url => {
    const entry = cases.find(item => '/' + item.path === url.pathname), name = entry === cases[0] ? 'title' : 'collectionGroupName';
    return Response.json({ error: true, message: token.accessToken, data: [{ ...entry.row, [name]: `${token.accessToken} ${token.refreshToken} fixture-collection-application`, accessToken: 'discarded-extra' }], password: 'discarded-root' });
  });
  await f.login();
  for (const entry of cases) {
    const result = await f.execute(entry); assert.equal(result.response.status, 200);
    for (const secret of [token.accessToken, token.refreshToken, 'fixture-collection-application', 'discarded-extra', 'discarded-root']) assert.ok(!JSON.stringify(result.result).includes(secret));
  }
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-collection-application', 'fixture-collection-password', cases[0].row.contentId]) assert.ok(!JSON.stringify(f.logs).includes(secret));
  assert.ok(f.logs.every(entry => !Object.hasOwn(entry, 'body') && !Object.hasOwn(entry, 'headers')));
});

test('collection 401 and delayed HTTP success preserve session revocation and logout isolation', async t => {
  for (const entry of cases) {
    const f = await fixture(t, () => Response.json({ data: [] }, { status: 401 }));
    await f.login(); const current = [...f.sessions.sessions.values()][0]; current.downloads.set('fixture-download', {});
    const result = await f.execute(entry); assert.equal(result.response.status, 401); assert.equal(result.result.error.code, 'SESSION_EXPIRED');
    assert.equal(current.tokens, null); assert.equal(current.user, null); assert.equal(current.downloads.size, 0);
  }
  let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, async () => { ready(); await pending; return Response.json({ error: true, data: [{ title: 'fixture old collection' }] }); });
  await f.login(); const inFlight = f.execute(cases[0]); await started; await f.send('/api/logout', {}); release();
  const result = await inFlight; assert.equal(result.response.status, 401); assert.equal(result.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(result.result).includes('fixture old collection'));
});
