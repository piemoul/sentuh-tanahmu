import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ApiClient } from '../private/api-client.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// No real upstream transport is used. Identifiers, credentials and replies are
// synthetic; HTTP tests exercise the real API server on loopback only.
const actions = [
  { id: 'delete-collection-deletecollectionpersil-path-argument-1-da7530', prefix: 'Collection/DeleteCollectionPersil/' },
  { id: 'delete-collection-deletecollectionberkas-path-argument-1-d92888', prefix: 'Collection/DeleteCollectionBerkas/' },
];
const edit = { id: 'put-collection-editcollectionpersil-da839c', path: 'Collection/EditCollectionPersil' };
const token = { tokenType: 'Bearer', accessToken: 'fixture-item-access', refreshToken: 'fixture-item-refresh', expiredAt: 4_000_000_000 };
const configuration = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-item-application' };
const context = { authenticated: true };
const session = () => ({ active: true, tokens: { ...token } });
const values = (id = ' fixture:id + / & ') => ({ path_argument_1: id });
const segment = text => encodeURIComponent(text.toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
const request = (action, input = values()) => { const prepared = prepareOperation(action.id, input, context); return { ...prepared, base: prepared.service.baseUrl, session: session() }; };
const clientFor = response => new ApiClient(configuration, { log: () => {}, transport: async () => response });

async function fixture(t, responder) {
  const calls = [], logs = [], sessions = new SessionStore();
  const server = createServer({ configuration, sessions, log: entry => logs.push(entry), transport: async (url, init) => {
    calls.push({ url: new URL(url), ...init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { username: 'fixture-item-user', token: { ...token } } });
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
  return { calls, logs, sessions, send, login: () => send('/api/login', { username: 'fixture-item-user', password: 'fixture-item-password' }),
    execute: (action, input = values(), confirm = true, headers) => send('/api/execute', { operationId: action.id, values: input, confirm }, headers) };
}

test('collection-item supplemental actions leave the original 170-shape corpus byte-identical to the prebatch baseline', async () => {
  const bytes = await readFile(new URL('../../analysis/request-contracts.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'c731e68ec6bbf3525f7d6d74f8965c2e3cbf107e91eb38f2b4d605603379cf7f');
  const contracts = JSON.parse(bytes).contracts;
  assert.equal(contracts.length, 170);
  assert.ok(contracts.every(contract => !actions.some(action => contract.endpoint.startsWith(action.prefix))));
  assert.ok(contracts.every(contract => contract.endpoint !== edit.path));
  assert.equal(OPERATIONS.length, 176); assert.equal(OPERATIONS.filter(operation => operation.enabled).length, 75);
});

test('item DELETE registry exposes two exact main-session writes with required explicit String IDs and confirmation', () => {
  for (const action of actions) {
    const operation = OPERATIONS.find(item => item.id === action.id);
    for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: 'DELETE', path: action.prefix + '{path_argument_1}', encoding: 'none', effect: 'write', mutates: true, requiresConfirmation: true })) assert.equal(operation[key], value);
    assert.deepEqual(operation.fields.map(field => [field.path, field.type, field.strictString, field.location, field.clientRequired, field.allowEmpty]), [['path_argument_1', 'string', true, 'path', true, true]]);
    assert.equal(operation.evidence.source, 'analysis/recovered/collection-item-delete/flow.json');
    assert.equal(operation.evidence.nativeProofSha256, 'a88478e6e4865f778b6821062623139f8fcbf516bba4467197f14a6cb734a97d');
  }
});

test('item DELETE path adapters retain empty and exact IDs while containing special characters in one encoded segment', () => {
  for (const action of actions) {
    for (const id of ['', ' ', ' collection:id ', 'a/b\\c?d#e%2F', "+&:;=@!'()*~", 'é/文😀', '\ud800']) {
      const prepared = request(action, values(id));
      assert.equal(prepared.path, action.prefix + segment(id));
      assert.deepEqual(prepared.query, {}); assert.deepEqual(prepared.body, {}); assert.deepEqual(prepared.files, []);
      const url = new URL(prepared.path, prepared.base); assert.equal(url.search, ''); assert.equal(url.hash, ''); assert.equal(url.pathname, '/' + action.prefix + segment(id));
    }
    for (const input of [{}, values(null), { path_argument_1: undefined }]) assert.throws(() => prepareOperation(action.id, input, context), { code: 'FIELD_REQUIRED' });
    for (const id of [1, true, {}, [], '.', '..', 'nul\0value', 'x'.repeat(16001)]) assert.throws(() => prepareOperation(action.id, values(id), context), { code: 'INVALID_FIELD' });
    for (const key of ['contentId', 'persilId', 'BerkasId', 'type', 'path', 'headers', 'url']) assert.throws(() => prepareOperation(action.id, { ...values(), [key]: 'unexpected' }, context), { code: 'UNKNOWN_FIELD' });
    assert.throws(() => prepareOperation(action.id, values(), {}), { code: 'LOGIN_REQUIRED' });
  }
  assert.throws(() => prepareOperation('delete-collection-deletecollection-path-argument-1', values(), context), { code: 'UNKNOWN_OPERATION' });
});

test('item DELETE wire uses the selected fixed endpoint without adding body query files or privileged credentials', async () => {
  const calls = [], client = new ApiClient(configuration, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: '', data: '' }); } });
  for (const action of actions) for (const id of ['', ' fixture:row/id ']) {
    const input = request(action, values(id)), result = await client.request(input), { url, init } = calls.at(-1);
    assert.equal(url.href, 'https://sentuh.atrbpn.go.id/' + action.prefix + segment(id)); assert.equal(init.method, 'DELETE'); assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers.Accept, 'application/json'); assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
    assert.deepEqual(result.data, { error: true, message: '', data: '' });
  }
  assert.equal(calls.length, 4, 'Transport performs exactly the requested write, with no implicit reads');
});

test('item DELETE typed exception requires canonical path method encoding auth profile and empty caller parameters', async () => {
  let calls = 0;
  const client = new ApiClient(configuration, { log: () => {}, transport: async () => { calls++; return Response.json({ data: null }); } });
  for (const action of actions) {
    const input = request(action);
    for (const patch of [{ method: 'GET' }, { method: 'POST' }, { method: 'PUT' }, { encoding: 'form' }, { encoding: 'json' }, { encoding: 'multipart' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + input.path }, { path: input.path + '?extra=1' }, { path: input.path + '#fragment' }, { query: { extra: undefined } }, { query: { extra: 'value' } }, { body: { id: 'unexpected' } }, { body: null }, { body: [] }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code: 'COLLECTION_DELETE_SCOPE' });
    for (const suffix of ['raw/slash', 'raw space', '%', '%2f', '%2e', '%2E%2E', 'raw?query', 'raw#fragment']) await assert.rejects(client.request({ ...input, path: action.prefix + suffix }), { code: 'COLLECTION_DELETE_SCOPE' });
    await assert.rejects(client.request({ ...input, path: action.prefix + '..' }), { code: 'INVALID_PATH' });
    await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
    await assert.rejects(client.request({ ...input, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
    await assert.rejects(client.request({ ...input, base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
  }
  assert.equal(calls, 0);
});

test('item DELETE accepts only HTTP200 typed yEb maps and never expands unrelated business-error handling', async () => {
  for (const action of actions) {
    for (const envelope of [{}, { error: true }, { error: true, message: '', data: '' }, { error: null, message: null, data: null }]) {
      const output = await clientFor(Response.json(envelope)).request(request(action)); assert.equal(output.status, 200); assert.deepEqual(output.data, { error: envelope.error ?? null, message: envelope.message ?? null, data: envelope.data ?? null });
    }
    for (const envelope of ['{"data":"second-decode-denied"}', [], { error: 'true' }, { message: [] }, { data: [] }, { data: {} }, { data: 1 }]) await assert.rejects(clientFor(Response.json(envelope)).request(request(action)), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
    for (const status of [201, 204, 299, 400, 401, 403, 500]) await assert.rejects(clientFor(status === 204 ? new Response(null, { status }) : Response.json({ data: '' }, { status })).request(request(action)), error => error.code === (status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED') && error.details.upstreamStatus === status);
    await assert.rejects(clientFor(new Response(null, { status: 302, headers: { Location: 'https://untrusted.example.invalid/' } })).request(request(action)), { code: 'UPSTREAM_REDIRECT' });
    for (const patch of [{ path: action.prefix.toLowerCase() + 'fixture' }, { path: 'Collection/DeleteOtherCollection/fixture' }, { base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: '' })).request({ ...request(action), ...patch }), { code: 'UPSTREAM_REJECTED' });
  }
});

test('item DELETE logs mask dynamic IDs on both success and network failure', async () => {
  const logs = [], id = 'fixture-private-item / ? # % & +';
  for (const action of actions) for (const fail of [false, true]) {
    const client = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => { if (fail) throw Object.assign(new Error('fixture network'), { code: 'ECONNRESET' }); return Response.json({ data: '' }); } });
    const pending = client.request(request(action, values(id)));
    if (fail) await assert.rejects(pending, { code: 'UPSTREAM_UNREACHABLE' }); else await pending;
    assert.equal(logs.at(-1).path, '/' + action.prefix + '{path_argument_1}');
  }
  for (const secret of [id, segment(id), token.accessToken, token.refreshToken]) assert.ok(!JSON.stringify(logs).includes(secret));
});

test('item DELETE HTTP execution keeps auth Origin CSRF field and boolean confirmation gates', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: '', data: 'result', extra: 'discard' }));
  for (const action of actions) assert.equal((await f.execute(action)).response.status, 401);
  assert.equal(f.calls.length, 0); await f.login();
  for (const action of actions) {
    assert.equal((await f.execute(action, undefined, true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
    assert.equal((await f.execute(action, undefined, true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
    assert.equal((await f.execute(action, { ...values(), contentId: 'unexpected' })).response.status, 400);
    for (const confirm of [false, undefined, 'true']) {
      const output = await f.send('/api/execute', { operationId: action.id, values: values(), ...(confirm === undefined ? {} : { confirm }) });
      assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'CONFIRMATION_REQUIRED');
    }
    const output = await f.execute(action); assert.equal(output.response.status, 200); assert.deepEqual(output.result.result.data, { error: true, message: '', data: 'result' });
  }
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', ...actions.map(action => '/' + request(action).path)]);
});

test('item DELETE HTTP response and logs redact credentials while preserving recoverable failures', async t => {
  let attempts = 0;
  const f = await fixture(t, url => {
    if (url.pathname === '/auth/refresh_token') return Response.json({ data: { ...token, accessToken: 'fixture-item-renewed' } });
    if (++attempts === 1) throw Object.assign(new Error('fixture network'), { code: 'ECONNRESET' });
    if (attempts === 2) return Response.json({ data: [] });
    return Response.json({ error: true, message: 'fixture-item-renewed', data: `${token.refreshToken} fixture-item-renewed fixture-item-application`, password: 'discarded-extra' });
  });
  await f.login(); [...f.sessions.sessions.values()][0].tokens.expiredAt = 1;
  const network = await f.execute(actions[0]); assert.equal(network.response.status, 502); assert.equal(network.result.error.code, 'UPSTREAM_UNREACHABLE');
  const malformed = await f.execute(actions[0]); assert.equal(malformed.response.status, 502); assert.equal(malformed.result.error.code, 'COLLECTION_RESPONSE_UNRECOGNIZED');
  const output = await f.execute(actions[0]); assert.equal(output.response.status, 200); assert.equal((await f.send('/api/state')).result.authenticated, true);
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-item-renewed', 'fixture-item-application', 'discarded-extra']) assert.ok(!JSON.stringify(output.result).includes(secret));
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-item-renewed', 'fixture-item-password', values().path_argument_1, segment(values().path_argument_1)]) assert.ok(!JSON.stringify(f.logs).includes(secret));
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/auth/refresh_token', ...Array(3).fill('/' + request(actions[0]).path)]);
});

test('item DELETE HTTP 401 revokes private state and a delayed success cannot publish after logout', async t => {
  for (const action of actions) {
    const rejected = await fixture(t, () => Response.json({ data: '' }, { status: 401 }));
    await rejected.login(); const current = [...rejected.sessions.sessions.values()][0]; current.downloads.set('fixture-download', {});
    const failure = await rejected.execute(action); assert.equal(failure.response.status, 401); assert.equal(failure.result.error.code, 'SESSION_EXPIRED'); assert.equal(current.tokens, null); assert.equal(current.user, null); assert.equal(current.downloads.size, 0);
    let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
    const f = await fixture(t, async () => { ready(); await pending; return Response.json({ error: true, data: 'fixture-private-delayed-result' }); });
    await f.login(); const inFlight = f.execute(action); await started; await f.send('/api/logout', {}); release();
    const output = await inFlight; assert.equal(output.response.status, 401); assert.equal(output.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(output.result).includes('fixture-private-delayed-result'));
  }
});

test('item caption PUT registry retains exact id/caption String fields and raw service-level empty values', () => {
  const operation = OPERATIONS.find(item => item.id === edit.id);
  for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: 'PUT', path: edit.path, encoding: 'multipart', effect: 'write', mutates: true, requiresConfirmation: true })) assert.equal(operation[key], value);
  assert.deepEqual(operation.fields.map(field => [field.path, field.type, field.strictString, field.location, field.clientRequired, field.allowEmpty]), [['id', 'string', true, 'body', true, true], ['caption', 'string', true, 'body', true, true]]);
  assert.equal(operation.evidence.source, 'analysis/recovered/collection-item-edit/flow.json');
  assert.equal(operation.evidence.nativeProofSha256, 'eabdaed76d862c8a5dd6a8feb1d927233e18a5755263c25614ff04fe3f86d4c8');
  for (const id of ['', ' row:id ']) for (const caption of ['', ' ', '  Caption + & / é😀\u0085  ']) assert.deepEqual({ ...request(edit, { id, caption }).body }, { id, caption });
  for (const field of ['id', 'caption']) {
    for (const value of [undefined, null]) assert.throws(() => prepareOperation(edit.id, { id: '', caption: '', [field]: value }, context), { code: 'FIELD_REQUIRED' });
    for (const value of [1, false, {}, [], 'nul\0value', 'x'.repeat(16001)]) assert.throws(() => prepareOperation(edit.id, { id: '', caption: '', [field]: value }, context), { code: 'INVALID_FIELD' });
  }
  for (const key of ['Caption', 'title', 'Title', 'subTitle', 'contentId', 'persilId', 'url', 'headers']) assert.throws(() => prepareOperation(edit.id, { id: '', caption: '', [key]: 'unexpected' }, context), { code: 'UNKNOWN_FIELD' });
});

test('item caption wire is PUT multipart with exact ordered String fields and stored-account authorization', async () => {
  const calls = [], client = new ApiClient(configuration, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: '', data: '' }); } });
  for (const input of [{ id: '', caption: '' }, { id: ' row:id + / & ', caption: '  untouched caption \u0085 + & / é😀  ' }]) {
    const result = await client.request(request(edit, input)), { url, init } = calls.at(-1);
    assert.equal(url.href, 'https://sentuh.atrbpn.go.id/' + edit.path); assert.equal(init.method, 'PUT'); assert.ok(init.body instanceof FormData);
    assert.deepEqual([...init.body], [['id', input.id], ['caption', input.caption]]);
    assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers.Accept, 'application/json'); assert.equal(init.headers['Content-Type'], undefined);
    assert.deepEqual(result.data, { error: true, message: '', data: '' });
  }
  assert.equal(calls.length, 2, 'No implicit list reload or caption transformation belongs to the transport');
});

test('item caption typed exception is restricted to canonical main-session PUT multipart and the exact two fields', async () => {
  let calls = 0;
  const client = new ApiClient(configuration, { log: () => {}, transport: async () => { calls++; return Response.json({ data: null }); } });
  const input = request(edit, { id: '', caption: '' });
  for (const patch of [{ method: 'GET' }, { method: 'POST' }, { method: 'PATCH' }, { method: 'DELETE' }, { encoding: 'form' }, { encoding: 'json' }, { encoding: 'none' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + edit.path }, { path: edit.path + '?extra=1' }, { path: edit.path + '#fragment' }, { query: { extra: undefined } }, { query: { extra: 'value' } }, { body: {} }, { body: { id: 'missing-caption' } }, { body: { caption: 'missing-id' } }, { body: { id: '', caption: '', extra: 'unexpected' } }, { body: { id: 1, caption: '' } }, { body: { id: '', caption: null } }, { body: { caption: '', id: '' } }, { body: null }, { body: [] }, { body: Object.create({ id: '', caption: '' }) }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code: 'COLLECTION_EDIT_SCOPE' });
  await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
  await assert.rejects(client.request({ ...input, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
  await assert.rejects(client.request({ ...input, base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
  assert.equal(calls, 0);
});

test('item caption PUT uses exact HTTP200 yEb semantics without String redecoding or widened generic success', async () => {
  const input = () => request(edit, { id: '', caption: '' });
  for (const envelope of [{}, { error: true }, { error: true, message: '', data: '' }, { error: null, message: null, data: null }]) {
    const expected = { error: envelope.error ?? null, message: envelope.message ?? null, data: envelope.data ?? null };
    assert.deepEqual((await clientFor(Response.json(envelope)).request(input())).data, expected);
    assert.deepEqual((await clientFor(new Response(JSON.stringify(envelope), { headers: { 'Content-Type': 'text/plain' } })).request(input())).data, expected);
  }
  for (const envelope of ['{"data":"second-decode-denied"}', [], { error: 'true' }, { message: [] }, { data: [] }, { data: {} }, { data: 1 }]) await assert.rejects(clientFor(Response.json(envelope)).request(input()), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
  for (const status of [201, 204, 299, 400, 401, 403, 500]) await assert.rejects(clientFor(status === 204 ? new Response(null, { status }) : Response.json({ data: '' }, { status })).request(input()), error => error.code === (status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED') && error.details.upstreamStatus === status);
  for (const patch of [{ path: edit.path.toLowerCase() }, { path: 'Collection/EditOtherCollection' }, { base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: '' })).request({ ...input(), ...patch }), { code: 'UPSTREAM_REJECTED' });
});

test('item caption HTTP execution retains authentication CSRF Origin and explicit confirmation without logging body values', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: token.accessToken, data: `${token.refreshToken} fixture-item-application`, extra: 'discard' }));
  const input = { id: 'fixture-private-caption-id', caption: 'fixture-private-caption-text' };
  assert.equal((await f.execute(edit, input)).response.status, 401); assert.equal(f.calls.length, 0); await f.login();
  assert.equal((await f.execute(edit, input, true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
  assert.equal((await f.execute(edit, input, true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
  assert.equal((await f.execute(edit, { ...input, title: 'unexpected' })).response.status, 400);
  for (const confirm of [false, undefined, 'true']) {
    const output = await f.send('/api/execute', { operationId: edit.id, values: input, ...(confirm === undefined ? {} : { confirm }) });
    assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'CONFIRMATION_REQUIRED');
  }
  const output = await f.execute(edit, input); assert.equal(output.response.status, 200);
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-item-application', 'discard']) assert.ok(!JSON.stringify(output.result).includes(secret));
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-item-password', ...Object.values(input)]) assert.ok(!JSON.stringify(f.logs).includes(secret));
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/' + edit.path]);
  assert.deepEqual([...f.calls.at(-1).body], Object.entries(input));
});

test('item caption HTTP 401 revokes private state and delayed success is isolated from logout', async t => {
  const input = { id: '', caption: 'fixture caption' };
  const rejected = await fixture(t, () => Response.json({ data: '' }, { status: 401 }));
  await rejected.login(); const current = [...rejected.sessions.sessions.values()][0]; current.downloads.set('fixture-download', {});
  const failure = await rejected.execute(edit, input); assert.equal(failure.response.status, 401); assert.equal(failure.result.error.code, 'SESSION_EXPIRED'); assert.equal(current.tokens, null); assert.equal(current.user, null); assert.equal(current.downloads.size, 0);
  let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, async () => { ready(); await pending; return Response.json({ error: true, data: 'fixture-private-delayed-caption-result' }); });
  await f.login(); const inFlight = f.execute(edit, input); await started; await f.send('/api/logout', {}); release();
  const output = await inFlight; assert.equal(output.response.status, 401); assert.equal(output.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(output.result).includes('fixture-private-delayed-caption-result'));
});
