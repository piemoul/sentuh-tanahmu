import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';
import { decodeCreatePersilCollectionGroupEnvelope as decode } from '../private/collection-response.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// No production transport is used. HTTP execution below is loopback-only;
// upstream responses, credentials, and submitted names are synthetic.
const id = 'post-collection-addpersilcollectiongroup-da8f20';
const path = 'Collection/AddPersilCollectionGroup';
const token = { tokenType: 'Bearer', accessToken: 'fixture-create-access', refreshToken: 'fixture-create-refresh', expiredAt: 4_000_000_000 };
const config = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-create-application' };
const session = () => ({ active: true, tokens: { ...token } });
const request = (GroupName = '  Tanah & Warisan + : / 🏡  ') => {
  const prepared = prepareOperation(id, { GroupName }, { authenticated: true });
  return { ...prepared, base: prepared.service.baseUrl, session: session() };
};
const clientFor = response => new ApiClient(config, { log: () => {}, transport: async () => response });

async function fixture(t, responder) {
  const calls = [], logs = [], sessions = new SessionStore();
  const server = createServer({ configuration: config, sessions, log: entry => logs.push(entry), transport: async (url, init) => {
    calls.push({ url: new URL(url), ...init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { username: 'fixture-create-user', token: { ...token } } });
    return responder(url, init);
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '', state;
  async function send(route, data, headers = {}) {
    const response = await fetch(base + route, { method: data === undefined ? 'GET' : 'POST', headers: {
      ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { Origin: base, 'X-CSRF-Token': state?.csrfToken ?? '', 'Content-Type': 'application/json' }), ...headers,
    }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const result = await response.json();
    if (result.csrfToken) state = result;
    return { response, result };
  }
  await send('/api/state');
  return { calls, logs, sessions, send, login: () => send('/api/login', { username: 'fixture-create-user', password: 'fixture-create-password' }),
    execute: (values = { GroupName: 'fixture group' }, confirm = true, headers) => send('/api/execute', { operationId: id, values, confirm }, headers) };
}

test('create-group registry retains the existing enabled write and explicit confirmation gate', () => {
  const operation = OPERATIONS.find(item => item.id === id);
  for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: 'POST', path, encoding: 'multipart', effect: 'write', mutates: true, requiresConfirmation: true })) assert.equal(operation[key], value);
  assert.deepEqual(operation.fields.map(field => [field.path, field.type, field.location, field.source]), [['GroupName', 'string', 'body', 'input']]);
  for (const key of ['groupName', 'groupId', 'url', 'headers']) assert.throws(() => prepareOperation(id, { GroupName: 'fixture group', [key]: 'unexpected' }, { authenticated: true }), { code: 'UNKNOWN_FIELD' });
});

test('yEb create response preserves nullable bool/String/String values without decoding or coercion', () => {
  for (const input of [{}, { error: null, message: null, data: null }, Object.create(null)]) assert.deepEqual(decode(input), { error: null, message: null, data: null });
  for (const error of [null, false, true]) for (const message of [null, '', ' raw message ']) for (const data of [null, '', ' raw group id ', '{"not":"decoded"}']) {
    const input = { error, message, data, extra: { fixture: true } }, before = JSON.stringify(input);
    assert.deepEqual(decode(input), { error, message, data }); assert.equal(JSON.stringify(input), before);
  }
  assert.deepEqual(decode(JSON.parse('{"__proto__":{"data":"inherited"},"constructor":{"message":"hidden"}}')), { error: null, message: null, data: null });
  assert.deepEqual(decode(Object.assign(Object.create(null), { error: true, message: '', data: '' })), { error: true, message: '', data: '' });
});

test('yEb rejects String roots, non-Map roots, and wrong nonnull field types', () => {
  for (const input of [null, undefined, [], true, 0, '{}', '{"data":"fixture"}', new Date(), Object.create({ data: 'inherited' })]) assert.throws(() => decode(input), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
  for (const field of ['message', 'data']) for (const value of [0, 1, false, true, {}, [], undefined]) assert.throws(() => decode({ [field]: value }), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
  for (const value of [0, 1, 'true', {}, [], undefined]) assert.throws(() => decode({ error: value }), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
});

test('create wire uses exact case, one multipart String field and ordinary stored account auth', async () => {
  const calls = [], input = request();
  const client = new ApiClient(config, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: '', data: ' group id ' }); } });
  const result = await client.request(input), { url, init } = calls[0];
  assert.equal(calls.length, 1); assert.equal(url.href, `https://sentuh.atrbpn.go.id/${path}`); assert.equal(init.method, 'POST');
  assert.ok(init.body instanceof FormData); assert.deepEqual([...init.body], [['GroupName', input.body.GroupName]]);
  assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers.Accept, 'application/json');
  assert.equal(init.headers['Content-Type'], undefined, 'Multipart boundary belongs to the transport, not a fixed header');
  assert.deepEqual(result, { status: 200, contentType: 'application/json', data: { error: true, message: '', data: ' group id ' } });
});

test('create transport exception cannot be reached with a different method profile auth path or field shape', async () => {
  let calls = 0;
  const client = new ApiClient(config, { log: () => {}, transport: async () => { calls++; return Response.json({ data: 'fixture' }); } });
  const input = request();
  for (const patch of [{ method: 'GET' }, { method: 'HEAD' }, { encoding: 'form' }, { encoding: 'json' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { query: { id: undefined } }, { query: { id: 'fixture' } }, { path: path + '?id=fixture' }, { path: path + '#fragment' }, { path: '/' + path }, { body: {} }, { body: null }, { body: [] }, { body: { groupName: 'fixture' } }, { body: { GroupName: 1 } }, { body: { GroupName: null } }, { body: { GroupName: undefined } }, { body: { GroupName: 'fixture', extra: 'value' } }, { body: Object.create({ GroupName: 'inherited' }) }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code: 'COLLECTION_CREATE_SCOPE' });
  await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
  await assert.rejects(client.request({ ...input, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
  await assert.rejects(client.request({ ...input, base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
  assert.equal(calls, 0);
});

test('only a typed HTTP200 create Map bypasses the generic error flag and unrelated requests stay unchanged', async () => {
  for (const envelope of [{}, { error: true }, { error: true, message: '', data: '' }, { error: true, message: 'upstream flag', data: 'created' }, { error: false, data: null }]) for (const response of [Response.json(envelope), new Response(JSON.stringify(envelope), { headers: { 'Content-Type': 'text/plain' } })]) {
    const result = await clientFor(response).request(request()); assert.equal(result.status, 200); assert.deepEqual(result.data, decode(envelope));
  }
  for (const input of [{ ...request(), path: 'collection/AddPersilCollectionGroup' }, { ...request(), path: 'Collection/addpersilcollectiongroup' }, { ...request(), path: 'Collection/OtherOperation' }, { ...request(), base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: 'created' })).request(input), { code: 'UPSTREAM_REJECTED' });
});

test('non200 create outcomes remain failures, including ordinary 201/204 and revoked sessions', async () => {
  for (const status of [201, 202, 204, 206, 299, 400, 401, 403, 404, 500]) {
    const input = request(), response = status === 204 ? new Response(null, { status }) : Response.json({ error: false, data: 'fixture' }, { status });
    await assert.rejects(clientFor(response).request(input), error => error.code === (status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED') && error.status === (status === 401 ? 401 : status === 403 ? 403 : 502) && error.details.upstreamStatus === status);
    if (status === 401) assert.equal(input.session.tokens, null);
  }
  await assert.rejects(clientFor(new Response(null, { status: 302, headers: { Location: 'https://untrusted.example.invalid/' } })).request(request()), { code: 'UPSTREAM_REDIRECT' });
});

test('invalid create HTTP200 bodies cannot leak raw values or fall back to list/object/String redecoding', async () => {
  const sentinel = 'fixture-sensitive-create-value';
  for (const response of [Response.json(JSON.stringify({ data: 'created' })), Response.json({ data: [] }), Response.json({ data: { secret: sentinel } }), Response.json({ error: 'true' }), Response.json({ message: [] }), Response.json([]), new Response('<html>' + sentinel + '</html>', { headers: { 'Content-Type': 'text/html' } }), new Response('', { headers: { 'Content-Type': 'application/octet-stream' } })]) {
    await assert.rejects(clientFor(response).request(request()), error => error.code === 'COLLECTION_RESPONSE_UNRECOGNIZED' && !JSON.stringify(error).includes(sentinel) && !error.cause);
  }
  await assert.rejects(clientFor(new Response('{bad', { headers: { 'Content-Type': 'application/json' } })).request(request()), { code: 'INVALID_UPSTREAM_JSON' });
});

test('HTTP create retains auth Origin CSRF field and confirmation gates without automatic refresh calls', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: '', data: 'created', extra: 'discard' }));
  assert.equal((await f.execute()).response.status, 401); assert.equal(f.calls.length, 0);
  await f.login();
  assert.equal((await f.execute(undefined, true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
  assert.equal((await f.execute(undefined, true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
  assert.equal((await f.execute({ GroupName: 'fixture', extra: 'unexpected' })).response.status, 400);
  for (const confirm of [false, undefined, 'true']) {
    const output = await f.send('/api/execute', { operationId: id, values: { GroupName: 'fixture' }, ...(confirm === undefined ? {} : { confirm }) });
    assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'CONFIRMATION_REQUIRED');
  }
  assert.equal(f.calls.length, 1);
  const output = await f.execute({ GroupName: 'fixture group & / +' });
  assert.equal(output.response.status, 200); assert.deepEqual(output.result.result.data, { error: true, message: '', data: 'created' });
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/' + path]);
  assert.deepEqual([...f.calls.at(-1).body], [['GroupName', 'fixture group & / +']]);
});

test('HTTP create handles refreshed sessions, transport and malformed-model failures without losing a valid session', async t => {
  let attempts = 0;
  const f = await fixture(t, url => {
    if (url.pathname === '/auth/refresh_token') return Response.json({ data: { ...token, accessToken: 'fixture-create-renewed' } });
    if (++attempts === 1) throw Object.assign(new Error('fixture transient'), { code: 'ECONNRESET' });
    return attempts === 2 ? Response.json({ error: true, data: [] }) : Response.json({ error: true, data: null });
  });
  await f.login(); [...f.sessions.sessions.values()][0].tokens.expiredAt = 1;
  const failed = await f.execute(); assert.equal(failed.response.status, 502); assert.equal(failed.result.error.code, 'UPSTREAM_UNREACHABLE');
  const malformed = await f.execute(); assert.equal(malformed.response.status, 502); assert.equal(malformed.result.error.code, 'COLLECTION_RESPONSE_UNRECOGNIZED');
  const success = await f.execute(); assert.equal(success.response.status, 200); assert.deepEqual(success.result.result.data, { error: true, message: null, data: null });
  assert.equal((await f.send('/api/state')).result.authenticated, true);
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/auth/refresh_token', ...Array(3).fill('/' + path)]);
  assert.ok(f.calls.slice(2).every(call => call.headers.Authorization === 'Bearer fixture-create-renewed'));
});

test('HTTP create output and logs retain credential redaction while dropping model extras', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: token.accessToken, data: `${token.accessToken} ${token.refreshToken} fixture-create-application`, password: 'discarded-extra' }));
  await f.login(); const output = await f.execute({ GroupName: 'fixture-private-group-name' }); assert.equal(output.response.status, 200);
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-create-application', 'discarded-extra']) assert.ok(!JSON.stringify(output.result).includes(secret));
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-create-application', 'fixture-create-password', 'fixture-private-group-name']) assert.ok(!JSON.stringify(f.logs).includes(secret));
  assert.ok(f.logs.every(entry => !Object.hasOwn(entry, 'body') && !Object.hasOwn(entry, 'headers')));
});

test('delayed create HTTP success cannot publish after logout', async t => {
  let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, async () => { ready(); await pending; return Response.json({ error: true, data: 'fixture-old-group-id' }); });
  await f.login(); const inFlight = f.execute(); await started; await f.send('/api/logout', {}); release();
  const output = await inFlight; assert.equal(output.response.status, 401); assert.equal(output.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(output.result).includes('fixture-old-group-id'));
});
