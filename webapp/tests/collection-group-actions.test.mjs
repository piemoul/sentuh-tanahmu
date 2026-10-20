import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';
import { decodeCollectionMutationEnvelope } from '../private/collection-response.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// All upstream transports, credentials and identifiers are synthetic.
// HTTP tests exercise the real local API on loopback only.
const actions = [
  { id: 'post-collection-addpersilcollectiontogroup-da897c', path: 'Collection/AddPersilCollectionToGroup', method: 'POST', encoding: 'multipart', scope: 'COLLECTION_MOVE_SCOPE', values: { collectionGroupId: ' group + / & ', collectionId: ' row:id + / & ' } },
  { id: 'delete-collection-deletepersilcollectiongroup-path-argument-1-da9450', path: 'Collection/DeletePersilCollectionGroup/{path_argument_1}', prefix: 'Collection/DeletePersilCollectionGroup/', method: 'DELETE', encoding: 'none', scope: 'COLLECTION_DELETE_SCOPE', values: { path_argument_1: ' group:id + / & ' } },
  { id: 'delete-collection-deletepersilcollectionfromgroup-path-argument-1-da7d60', path: 'Collection/DeletePersilCollectionFromGroup/{path_argument_1}', prefix: 'Collection/DeletePersilCollectionFromGroup/', method: 'DELETE', encoding: 'none', scope: 'COLLECTION_DELETE_SCOPE', values: { path_argument_1: ' row:id + / & ' } },
];
const token = { tokenType: 'Bearer', accessToken: 'fixture-actions-access', refreshToken: 'fixture-actions-refresh', expiredAt: 4_000_000_000 };
const config = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-actions-application' };
const session = () => ({ active: true, tokens: { ...token } });
const context = { authenticated: true };
const segment = text => encodeURIComponent(text.toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
const request = (action, values = action.values) => { const prepared = prepareOperation(action.id, values, context); return { ...prepared, base: prepared.service.baseUrl, session: session() }; };
const clientFor = response => new ApiClient(config, { log: () => {}, transport: async () => response });

async function fixture(t, responder) {
  const calls = [], logs = [], sessions = new SessionStore();
  const server = createServer({ configuration: config, sessions, log: entry => logs.push(entry), transport: async (url, init) => {
    calls.push({ url: new URL(url), ...init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { username: 'fixture-actions-user', token: { ...token } } });
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
  return { calls, logs, sessions, send, login: () => send('/api/login', { username: 'fixture-actions-user', password: 'fixture-actions-password' }),
    execute: (action, values = action.values, confirm = true, headers) => send('/api/execute', { operationId: action.id, values, confirm }, headers) };
}

test('group action registry has exact scoped fields and keeps every write behind confirmation', () => {
  assert.equal(OPERATIONS.length, 176); assert.equal(OPERATIONS.filter(item => item.enabled).length, 75);
  for (const action of actions) {
    const operation = OPERATIONS.find(item => item.id === action.id);
    for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: action.method, path: action.path, encoding: action.encoding, effect: 'write', mutates: true, requiresConfirmation: true })) assert.equal(operation[key], value);
    assert.ok(operation.fields.every(field => field.type === 'string' && field.strictString && field.clientRequired && field.source === 'input'));
    if (action.prefix) {
      assert.deepEqual(operation.fields.map(field => [field.path, field.location, field.allowEmpty]), [['path_argument_1', 'path', true]]);
      assert.equal(operation.evidence.contractSource, 'supplemental audited group DELETE');
    } else assert.deepEqual(operation.fields.map(field => [field.path, field.location, field.allowEmpty]), [['collectionGroupId', 'body', false], ['collectionId', 'body', true]]);
  }
});

test('the two supplemental group DELETE IDs prepare a dynamic path and each ID remains one segment', () => {
  for (const action of actions.slice(1)) for (const suppliedId of ['', ' ', ' plain-id ', 'a/b\\c?d#e%2F', "+&:;=@!'()*~", 'é/文😀', '\ud800']) {
    const prepared = request(action, { path_argument_1: suppliedId });
    assert.equal(prepared.path, action.prefix + segment(suppliedId)); assert.equal(prepared.service.id, 'main');
    assert.deepEqual(prepared.body, {}); assert.deepEqual(prepared.query, {}); assert.deepEqual(prepared.files, []);
    const url = new URL(prepared.path, prepared.base); assert.equal(url.search, ''); assert.equal(url.hash, '');
    assert.equal(url.pathname, '/' + action.prefix + segment(suppliedId));
  }
  const unrelated = OPERATIONS.find(item => item.path === 'api/booking/' && !item.enabled);
  assert.throws(() => prepareOperation(unrelated.id, { path_argument_1: 'fixture' }, context), { code: 'OPERATION_INSPECT_ONLY' });
});

test('DELETE ID input must be explicitly supplied as a String and cannot escape through dot paths', () => {
  for (const action of actions.slice(1)) {
    for (const values of [{}, { path_argument_1: null }, { path_argument_1: undefined }]) assert.throws(() => prepareOperation(action.id, values, context), { code: 'FIELD_REQUIRED' });
    for (const value of [1, true, [], {}, '.', '..', 'nul\0value', 'x'.repeat(16001)]) assert.throws(() => prepareOperation(action.id, { path_argument_1: value }, context), { code: 'INVALID_FIELD' });
    for (const key of ['groupId', 'collectionId', 'path', 'url', 'headers', 'body']) assert.throws(() => prepareOperation(action.id, { path_argument_1: '', [key]: 'unexpected' }, context), { code: 'UNKNOWN_FIELD' });
    assert.throws(() => prepareOperation(action.id, { path_argument_1: '' }, {}), { code: 'LOGIN_REQUIRED' });
  }
});

test('move retains the exact collection row ID including empty fallback and does not trim either ID', () => {
  const action = actions[0];
  for (const collectionGroupId of [' ', ' group-id ']) for (const collectionId of ['', ' row-id ', 'full:row/id']) {
    const prepared = request(action, { collectionGroupId, collectionId });
    assert.deepEqual({ ...prepared.body }, { collectionGroupId, collectionId });
  }
  for (const value of ['', null, undefined]) assert.throws(() => prepareOperation(action.id, { collectionGroupId: value, collectionId: '' }, context), { code: 'FIELD_REQUIRED' });
  for (const field of ['collectionGroupId', 'collectionId']) for (const value of [1, true, [], {}]) assert.throws(() => prepareOperation(action.id, { ...action.values, [field]: value }, context), { code: 'INVALID_FIELD' });
  for (const key of ['CollectionId', 'contentId', 'persilId', 'groupId']) assert.throws(() => prepareOperation(action.id, { ...action.values, [key]: 'unexpected' }, context), { code: 'UNKNOWN_FIELD' });
});

test('wire actions use ordinary stored-account auth, exact methods, multipart order or an absent DELETE body', async () => {
  const calls = [], client = new ApiClient(config, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: '', data: ' action-result ' }); } });
  for (const action of actions) {
    const input = request(action), result = await client.request(input), { url, init } = calls.at(-1);
    assert.equal(url.href, 'https://sentuh.atrbpn.go.id/' + input.path); assert.equal(init.method, action.method); assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers.Accept, 'application/json');
    if (action.prefix) { assert.equal(init.body, undefined); assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded'); }
    else { assert.ok(init.body instanceof FormData); assert.deepEqual([...init.body], Object.entries(action.values)); assert.equal(init.headers['Content-Type'], undefined); }
    assert.deepEqual(result.data, { error: true, message: '', data: ' action-result ' });
  }
  assert.equal(calls.length, 3, 'No implicit group or collection refresh belongs to the transport');
});

test('typed action exceptions reject noncanonical profile method auth encoding and parameter shapes before transport', async () => {
  let calls = 0;
  const client = new ApiClient(config, { log: () => {}, transport: async () => { calls++; return Response.json({ data: null }); } });
  for (const action of actions) {
    const input = request(action);
    for (const patch of [{ method: 'GET' }, { method: 'HEAD' }, { method: action.method === 'POST' ? 'DELETE' : 'POST' }, { encoding: action.encoding === 'none' ? 'form' : 'none' }, { encoding: 'json' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + input.path }, { path: input.path + '?extra=1' }, { path: input.path + '#fragment' }, { query: { extra: undefined } }, { query: { extra: 'value' } }, { body: { ...input.body, extra: 'unexpected' } }, { body: null }, { body: [] }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code: action.scope });
    await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
    await assert.rejects(client.request({ ...input, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
    await assert.rejects(client.request({ ...input, base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
    if (action.prefix) for (const suffix of ['raw/slash', 'raw\\slash', 'raw space', '%', '%2f', '%2e', '%2E%2E', 'raw?query', 'raw#fragment']) await assert.rejects(client.request({ ...input, path: action.prefix + suffix }), { code: suffix.includes('\\') ? 'INVALID_PATH' : action.scope });
    else for (const body of [{ collectionGroupId: '', collectionId: '' }, { collectionGroupId: null, collectionId: '' }, { collectionGroupId: 'fixture', collectionId: 1 }, { collectionGroupId: 'fixture' }, { collectionId: 'fixture', collectionGroupId: 'reversed' }]) await assert.rejects(client.request({ ...input, body }), { code: action.scope });
  }
  assert.equal(calls, 0);
});

test('HTTP200 action models preserve missing/null/empty String values and ignore the envelope error flag', async () => {
  for (const action of actions) for (const envelope of [{}, { error: true }, { error: true, message: '', data: '' }, { error: null, message: null, data: null }, { error: true, message: ' flag ', data: ' result ', unknown: ['discard'] }]) {
    const result = await clientFor(Response.json(envelope)).request(request(action)); assert.equal(result.status, 200); assert.deepEqual(result.data, decodeCollectionMutationEnvelope(envelope));
    assert.deepEqual((await clientFor(new Response(JSON.stringify(envelope), { headers: { 'Content-Type': 'text/plain' } })).request(request(action))).data, decodeCollectionMutationEnvelope(envelope));
  }
  for (const action of actions) for (const envelope of ['{"data":"no-second-decode"}', [], { error: 'true' }, { message: [] }, { data: [] }, { data: {} }, { data: 1 }]) await assert.rejects(clientFor(Response.json(envelope)).request(request(action)), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
});

test('non200 action responses and redirects fail without expanding success or changing unrelated business errors', async () => {
  for (const action of actions) {
    for (const status of [201, 204, 299, 400, 401, 403, 500]) {
      const response = status === 204 ? new Response(null, { status }) : Response.json({ error: false, data: 'result' }, { status });
      await assert.rejects(clientFor(response).request(request(action)), error => error.code === (status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED') && error.details.upstreamStatus === status);
    }
    await assert.rejects(clientFor(new Response(null, { status: 302, headers: { Location: 'https://untrusted.example.invalid/' } })).request(request(action)), { code: 'UPSTREAM_REDIRECT' });
    for (const patch of [{ path: 'collection/OtherOperation' }, { path: action.prefix ? action.prefix.replace('Collection/', 'collection/') + 'fixture' : action.path.toLowerCase() }, { base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: 'result' })).request({ ...request(action), ...patch }), { code: 'UPSTREAM_REJECTED' });
  }
});

test('connection logs replace dynamic DELETE IDs with a fixed template on success and transport failure', async () => {
  const logs = [], sensitiveId = 'fixture-private-id / ? # % & +';
  for (const action of actions.slice(1)) for (const fail of [false, true]) {
    const client = new ApiClient(config, { log: entry => logs.push(entry), transport: async () => { if (fail) throw Object.assign(new Error('fixture network'), { code: 'ECONNRESET' }); return Response.json({ data: '' }); } });
    const pending = client.request(request(action, { path_argument_1: sensitiveId }));
    if (fail) await assert.rejects(pending, { code: 'UPSTREAM_UNREACHABLE' }); else await pending;
    assert.equal(logs.at(-1).path, '/' + action.prefix + '{path_argument_1}');
  }
  for (const secret of [sensitiveId, segment(sensitiveId), token.accessToken, token.refreshToken]) assert.ok(!JSON.stringify(logs).includes(secret));
  assert.ok(logs.every(entry => !Object.hasOwn(entry, 'body') && !Object.hasOwn(entry, 'headers')));
});

test('HTTP action execution retains authentication Origin CSRF field and explicit confirmation guards', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: '', data: 'result', extra: 'discard' }));
  for (const action of actions) assert.equal((await f.execute(action)).response.status, 401);
  assert.equal(f.calls.length, 0); await f.login();
  for (const action of actions) {
    assert.equal((await f.execute(action, undefined, true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
    assert.equal((await f.execute(action, undefined, true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
    assert.equal((await f.execute(action, { ...action.values, extra: 'unexpected' })).response.status, 400);
    for (const confirm of [false, undefined, 'true']) {
      const output = await f.send('/api/execute', { operationId: action.id, values: action.values, ...(confirm === undefined ? {} : { confirm }) });
      assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'CONFIRMATION_REQUIRED');
    }
    const output = await f.execute(action); assert.equal(output.response.status, 200); assert.deepEqual(output.result.result.data, { error: true, message: '', data: 'result' });
  }
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', ...actions.map(action => '/' + request(action).path)]);
});

test('HTTP action output and diagnostics preserve redaction for tokens and dynamic IDs', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: token.accessToken, data: `${token.refreshToken} fixture-actions-application`, password: 'discarded-extra' }));
  await f.login();
  for (const action of actions) {
    const output = await f.execute(action); assert.equal(output.response.status, 200);
    for (const secret of [token.accessToken, token.refreshToken, 'fixture-actions-application', 'discarded-extra']) assert.ok(!JSON.stringify(output.result).includes(secret));
  }
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-actions-password', ...actions.flatMap(action => Object.values(action.values)), ...actions.slice(1).map(action => segment(action.values.path_argument_1))]) assert.ok(!JSON.stringify(f.logs).includes(secret));
});

test('HTTP DELETE 401 revokes the account and delayed action success cannot publish after logout', async t => {
  const rejected = await fixture(t, () => Response.json({ data: '' }, { status: 401 }));
  await rejected.login(); const current = [...rejected.sessions.sessions.values()][0]; current.downloads.set('fixture-download', {});
  const failure = await rejected.execute(actions[1]); assert.equal(failure.response.status, 401); assert.equal(failure.result.error.code, 'SESSION_EXPIRED'); assert.equal(current.tokens, null); assert.equal(current.user, null); assert.equal(current.downloads.size, 0);
  for (const action of actions) {
    let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
    const f = await fixture(t, async () => { ready(); await pending; return Response.json({ error: true, data: 'fixture-private-delayed-result' }); });
    await f.login(); const inFlight = f.execute(action); await started; await f.send('/api/logout', {}); release();
    const output = await inFlight; assert.equal(output.response.status, 401); assert.equal(output.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(output.result).includes('fixture-private-delayed-result'));
  }
});
