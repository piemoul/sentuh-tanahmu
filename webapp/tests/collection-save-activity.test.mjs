import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { ApiClient } from '../private/api-client.mjs';
import { decodeUserActivityEnvelope } from '../private/activity-response.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// All upstream replies/credentials are synthetic. HTTP tests use only a real
// loopback API server, never a provider or logged-in production session.
const read = { id: 'get-activity-getuseractivity-d1dc68', path: 'activity/GetUserActivity' };
const remove = { id: 'post-activity-deleteuseractivity-de6c94', path: 'activity/deleteUserActivity' };
const bookmarkStatus = { id: 'get-collection-getcollectionid-d25250', path: 'collection/GetCollectionId' };
const saves = [
  { id: 'post-collection-addcollectionberkas-d92664', path: 'Collection/AddCollectionBerkas', field: 'BerkasId', proof: 'c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573', source: 'collection-save-berkas' },
  { id: 'post-collection-addcollectionpersil-daae30', path: 'Collection/AddCollectionPersil', field: 'PersilId', proof: 'dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199', source: 'collection-save-persil' },
];
const proof = '6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80';
const token = { tokenType: 'Bearer', accessToken: 'fixture-activity-access', refreshToken: 'fixture-activity-refresh', expiredAt: 4_000_000_000 };
const configuration = { configured: true, reason: 'synthetic only', applicationAuthorization: () => 'AtrBpn fixture-activity-application' };
const session = () => ({ active: true, tokens: { ...token } });
const values = (id = ' fixture:activity + / & ') => ({ userActivityId: id });
const request = (action, input = action === read ? {} : values()) => { const prepared = prepareOperation(action.id, input, { authenticated: true }); return { ...prepared, base: prepared.service.baseUrl, session: session() }; };
const saveValues = (action, id = ' fixture:source / + & ') => ({ [action.field]: id, Title: ' raw automatic/title ', ...(action.field === 'BerkasId' ? { Subtitle: ' raw office name ' } : {}) });
const saveRequest = (action, input = saveValues(action), nik = 'fixture-stored-signin-nik') => {
  const user = { nomorIndukKependudukan: nik }, prepared = prepareOperation(action.id, input, { authenticated: true, user });
  return { ...prepared, base: prepared.service.baseUrl, session: { ...session(), user } };
};
const statusRequest = (id = ' source:id :2') => { const prepared = prepareOperation(bookmarkStatus.id, { id }, { authenticated: true }); return { ...prepared, base: prepared.service.baseUrl, session: session() }; };
const clientFor = response => new ApiClient(configuration, { log: () => {}, transport: async () => response });
const emptyRow = { userActivityId: '', activityType: '', platform: '', createdAt: null, contentId: null, title: '', subTitle: '', status: '' };
const row = { userActivityId: 'fixture:activity/id', activityType: 'berkas', platform: 'android', createdAt: ' raw date unchanged ', contentId: 'fixture:berkas/id', title: 'A title', subTitle: 'A subtitle', status: 'unused status' };
async function fixture(t, responder, profile = {}) {
  const calls = [], logs = [], sessions = new SessionStore();
  const server = createServer({ configuration, sessions, log: entry => logs.push(entry), transport: async (url, init) => {
    calls.push({ url: new URL(url), ...init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { username: 'fixture-activity-user', ...profile, token: { ...token } } });
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
    const result = await response.json(); if (result.csrfToken) state = result;
    return { response, result };
  }
  await send('/api/state');
  return { calls, logs, sessions, send, login: () => send('/api/login', { username: 'fixture-activity-user', password: 'fixture-activity-password' }),
    execute: (action, input = action === read ? {} : values(), confirm = true, headers) => send('/api/execute', { operationId: action.id, values: input, confirm }, headers) };
}

test('save/activity batch keeps original corpus, six prior ledgers and 225 historical JSON byte-identical', async () => {
  const baseline = JSON.parse(await readFile(new URL('../../analysis/webapp/collection-save-activity-baseline.json', import.meta.url)));
  assert.equal(baseline.requestCorpus.sha256, 'c731e68ec6bbf3525f7d6d74f8965c2e3cbf107e91eb38f2b4d605603379cf7f');
  assert.equal(baseline.native.length, 6); assert.equal(baseline.historical.length, 225);
  for (const entry of [baseline.requestCorpus, ...baseline.native, ...baseline.historical]) {
    const bytes = await readFile(new URL('../../' + entry.file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.file);
    if (entry === baseline.requestCorpus) assert.equal(JSON.parse(bytes).contracts.length, 170);
  }
  assert.equal(OPERATIONS.length, 176); assert.equal(OPERATIONS.filter(item => item.enabled).length, 94);
});

test('Activity registry retains two existing IDs with native evidence, read-only GET and confirmed String multipart POST', () => {
  for (const action of [read, remove]) {
    const operation = OPERATIONS.find(item => item.id === action.id);
    for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: action === read ? 'GET' : 'POST', path: action.path, encoding: action === read ? 'none' : 'multipart', effect: action === read ? 'read' : 'write', mutates: action !== read, requiresConfirmation: action !== read })) assert.equal(operation[key], value);
    assert.equal(operation.evidence.source, 'analysis/recovered/activity-delete/flow.json'); assert.equal(operation.evidence.nativeProofSha256, proof);
    assert.deepEqual(operation.fields.map(field => [field.path, field.type, field.strictString, field.location, field.clientRequired, field.allowEmpty]), action === read ? [] : [['userActivityId', 'string', true, 'body', true, true]]);
    assert.throws(() => prepareOperation(action.id, action === read ? {} : values(), {}), { code: 'LOGIN_REQUIRED' });
  }
  for (const id of ['', ' ', ' activity:id / + & ? # % ! é😀 ', '\ud800']) assert.deepEqual({ ...request(remove, values(id)).body }, values(id));
  for (const input of [{}, values(null), { userActivityId: undefined }]) assert.throws(() => prepareOperation(remove.id, input, { authenticated: true }), { code: 'FIELD_REQUIRED' });
  for (const id of [1, false, {}, [], 'nul\0value', 'x'.repeat(16001)]) assert.throws(() => prepareOperation(remove.id, values(id), { authenticated: true }), { code: 'INVALID_FIELD' });
  for (const action of [read, remove]) for (const key of ['contentId', 'activityId', 'id', 'userId', 'headers', 'url']) assert.throws(() => prepareOperation(action.id, { ...(action === read ? {} : values()), [key]: 'unexpected' }, { authenticated: true }), { code: 'UNKNOWN_FIELD' });
});

test('Activity decoder accepts data??message lists, one String decode, typed defaults and raw dates while discarding unknowns', () => {
  for (const value of [{ error: true, data: [{ ...row, secret: 'discard' }], message: 'ignored' }, { data: null, message: [row] }, { message: [row] }]) assert.deepEqual(decodeUserActivityEnvelope(value), { data: [row] });
  assert.deepEqual(decodeUserActivityEnvelope(JSON.stringify({ error: {}, data: [{}] })), { data: [emptyRow] });
  assert.deepEqual(decodeUserActivityEnvelope({ data: [{ ...Object.fromEntries(Object.keys(emptyRow).map(key => [key, null])) }] }), { data: [emptyRow] });
  assert.deepEqual(decodeUserActivityEnvelope({ data: [], message: [row] }), { data: [] }, 'present empty data never falls back');
  assert.deepEqual(decodeUserActivityEnvelope({ data: [{ ...row, createdAt: '', userActivityId: ' ', title: ' ' }] }).data[0], { ...row, createdAt: '', userActivityId: ' ', title: ' ' });
  for (const value of [null, [], {}, { data: null }, { data: {}, message: [row] }, { data: '' }, { data: [null] }, { data: [[]] }, JSON.stringify(JSON.stringify({ data: [] })), 'not JSON']) assert.throws(() => decodeUserActivityEnvelope(value), { code: 'ACTIVITY_RESPONSE_UNRECOGNIZED' });
  for (const field of Object.keys(emptyRow)) for (const value of [1, false, {}, [], undefined]) assert.throws(() => decodeUserActivityEnvelope({ data: [{ [field]: value }] }), { code: 'ACTIVITY_RESPONSE_UNRECOGNIZED' });
});

test('Activity wire sends exact bodyless GET and one-field POST multipart under the stored account token', async () => {
  const calls = [], client = new ApiClient(configuration, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return url.pathname.endsWith('GetUserActivity') ? Response.json({ error: true, data: [row] }) : Response.json({ error: true, data: { deliberately: 'not yEb' } }); } });
  const result = await client.request(request(read)); assert.deepEqual(result.data, { data: [row] });
  assert.equal(calls[0].url.href, 'https://sentuh.atrbpn.go.id/' + read.path); assert.equal(calls[0].init.method, 'GET'); assert.equal(calls[0].init.body, undefined); assert.equal(calls[0].init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  for (const id of ['', ' / ? # + & é😀 ']) {
    const output = await client.request(request(remove, values(id))), { url, init } = calls.at(-1);
    assert.equal(url.href, 'https://sentuh.atrbpn.go.id/' + remove.path); assert.equal(init.method, 'POST'); assert.ok(init.body instanceof FormData); assert.deepEqual([...init.body], [['userActivityId', id]]); assert.equal(init.headers['Content-Type'], undefined); assert.equal(output.data, true);
  }
  for (const { init } of calls) { assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers.Accept, 'application/json'); }
  assert.equal(calls.length, 3, 'No implicit refresh/list calls in these request helpers');
});

test('Activity native response exceptions require canonical main/session method encoding and exact caller parameters', async () => {
  let calls = 0;
  const client = new ApiClient(configuration, { log: () => {}, transport: async () => { calls++; return Response.json({ data: [] }); } });
  for (const action of [read, remove]) {
    const input = request(action), code = action === read ? 'ACTIVITY_READ_SCOPE' : 'ACTIVITY_DELETE_SCOPE';
    for (const patch of [{ method: 'PUT' }, { method: action === read ? 'POST' : 'GET' }, { encoding: 'form' }, { encoding: 'json' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + action.path }, { path: action.path + '?extra=1' }, { path: action.path + '#fragment' }, { query: { extra: undefined } }, { query: null }, { query: [] }, { body: null }, { body: [] }, { body: Object.create({ userActivityId: 'inherited' }) }, { body: { ...input.body, extra: 'unexpected' } }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code });
    if (action === remove) for (const body of [{}, { userActivityId: null }, { userActivityId: 1 }, { UserActivityId: '' }, { contentId: '' }]) await assert.rejects(client.request({ ...input, body }), { code });
    await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
    await assert.rejects(client.request({ ...input, session: { active: false, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
    await assert.rejects(client.request({ ...input, base: 'https://aplikasi.atrbpn.go.id/' }), { code: 'TOKEN_AUDIENCE_UNVERIFIED' });
  }
  assert.equal(calls, 0);
});

test('Activity GET accepts only HTTP200, one native String decode and a typed list despite body.error', async () => {
  for (const response of [Response.json({ error: true, data: [row] }), Response.json(JSON.stringify({ data: [row] })), new Response(JSON.stringify({ data: [row] }), { headers: { 'Content-Type': 'text/plain' } })]) assert.deepEqual((await clientFor(response).request(request(read))).data, { data: [row] });
  for (const body of [{ data: {} }, { data: [null] }, { data: [{ userActivityId: 2 }] }, JSON.stringify(JSON.stringify({ data: [] }))]) await assert.rejects(clientFor(Response.json(body)).request(request(read)), { code: 'ACTIVITY_RESPONSE_UNRECOGNIZED' });
  for (const status of [201, 204, 299, 400, 403, 500]) await assert.rejects(clientFor(status === 204 ? new Response(null, { status }) : Response.json({ data: [] }, { status })).request(request(read)), error => error.code === 'UPSTREAM_REJECTED' && error.details.upstreamStatus === status);
  await assert.rejects(clientFor(Response.json({ data: [] }, { status: 401 })).request(request(read)), { code: 'SESSION_EXPIRED' });
  await assert.rejects(clientFor(new Response(null, { status: 302 })).request(request(read)), { code: 'UPSTREAM_REDIRECT' });
});

test('Activity DELETE ignores arbitrary HTTP200 bodies, MIME, envelope types and body size headers', async () => {
  for (const response of [Response.json({ error: true, message: [], data: {} }), Response.json('not a native envelope'), new Response('<html>fixture</html>', { headers: { 'Content-Type': 'text/html' } }), new Response('{invalid JSON', { headers: { 'Content-Type': 'application/json' } }), new Response(null), new Response('discarded fixture', { headers: { 'Content-Length': String(50 * 1024 * 1024) } })]) {
    const output = await clientFor(response).request(request(remove)); assert.equal(output.status, 200); assert.equal(output.data, true); assert.equal(output.bytes, undefined);
  }
  let cancelled = false;
  const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'Content-Type': 'application/json' } });
  assert.equal((await clientFor(response).request(request(remove))).data, true); assert.equal(cancelled, true, 'Body is discarded rather than parsed/read');
});

test('Activity DELETE preserves non200 false and failure diagnostics while authentication and redirects keep shared gates', async () => {
  const logs = [];
  for (const status of [201, 204, 299, 400, 403, 500]) {
    const client = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => status === 204 ? new Response(null, { status }) : new Response('arbitrary body', { status }) });
    const output = await client.request(request(remove)); assert.equal(output.status, status); assert.equal(output.data, false); assert.equal(logs.at(-1).event, 'upstream_fail'); assert.equal(logs.at(-1).status, status);
  }
  await assert.rejects(clientFor(Response.json({ data: 'ignored' }, { status: 401 })).request(request(remove)), { code: 'SESSION_EXPIRED' });
  await assert.rejects(clientFor(new Response(null, { status: 302 })).request(request(remove)), { code: 'UPSTREAM_REDIRECT' });
  const client = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => { throw Object.assign(new Error('never expose fixture body'), { code: 'ECONNRESET' }); } });
  await assert.rejects(client.request(request(remove)), error => error.code === 'UPSTREAM_UNREACHABLE' && error.details.networkCode === 'ECONNRESET');
  assert.equal(logs.at(-1).event, 'upstream_fail'); assert.equal(logs.at(-1).status, null);
  for (const secret of [token.accessToken, token.refreshToken, values().userActivityId, 'never expose fixture body']) assert.ok(!JSON.stringify(logs).includes(secret));
});

test('Activity-specific status and body exceptions never widen unrelated operations', async () => {
  for (const action of [read, remove]) for (const patch of [{ path: action.path.toLowerCase() }, { path: 'activity/OtherActivity' }, { base: 'https://aplikasi.atrbpn.go.id/', auth: 'none', session: undefined }]) await assert.rejects(clientFor(Response.json({ error: true, data: [] })).request({ ...request(action), ...patch }), { code: 'UPSTREAM_REJECTED' });
  await assert.rejects(clientFor(Response.json({ error: true, data: '' })).request({ ...request(remove), path: 'Collection/OtherAction' }), { code: 'UPSTREAM_REJECTED' });
  const ordinary = await clientFor(Response.json({ data: [] }, { status: 201 })).request({ ...request(read), path: 'activity/OtherActivity' }); assert.equal(ordinary.status, 201);
});

test('Activity real HTTP execution retains login Origin CSRF strict fields and Boolean write confirmation', async t => {
  const f = await fixture(t, url => url.pathname.endsWith('GetUserActivity') ? Response.json({ error: true, data: [{}] }) : Response.json({ error: true, data: [] }));
  for (const action of [read, remove]) assert.equal((await f.execute(action)).response.status, 401);
  assert.equal(f.calls.length, 0); await f.login();
  for (const action of [read, remove]) {
    assert.equal((await f.execute(action, undefined, true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
    assert.equal((await f.execute(action, undefined, true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
    assert.equal((await f.execute(action, { ...(action === read ? {} : values()), contentId: 'unexpected' })).response.status, 400);
  }
  for (const confirm of [false, undefined, 'true']) {
    const output = await f.send('/api/execute', { operationId: remove.id, values: values(), ...(confirm === undefined ? {} : { confirm }) }); assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'CONFIRMATION_REQUIRED');
  }
  const list = await f.execute(read, {}, false); assert.equal(list.response.status, 200); assert.deepEqual(list.result.result.data, { data: [emptyRow] });
  const deleted = await f.execute(remove, values('')); assert.equal(deleted.response.status, 200); assert.equal(deleted.result.result.data, true);
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/' + read.path, '/' + remove.path]);
});

test('Activity HTTP false remains observable, refresh uses stored tokens, response/log credentials stay redacted', async t => {
  let deletes = 0;
  const f = await fixture(t, url => {
    if (url.pathname === '/auth/refresh_token') return Response.json({ data: { ...token, accessToken: 'fixture-activity-renewed' } });
    if (url.pathname.endsWith('GetUserActivity')) return Response.json({ error: true, data: [{ ...row, title: token.refreshToken + ' fixture-activity-renewed fixture-activity-application' }] });
    return ++deletes === 1 ? new Response('ignored private upstream reply', { status: 500 }) : Response.json({ data: token.accessToken });
  });
  await f.login(); [...f.sessions.sessions.values()][0].tokens.expiredAt = 1;
  const list = await f.execute(read); assert.equal(list.response.status, 200);
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-activity-renewed', 'fixture-activity-application']) assert.ok(!JSON.stringify(list.result).includes(secret));
  const no = await f.execute(remove); assert.equal(no.response.status, 200); assert.equal(no.result.result.status, 500); assert.equal(no.result.result.data, false); assert.equal(f.logs.at(-1).event, 'upstream_fail');
  const yes = await f.execute(remove); assert.equal(yes.result.result.data, true); assert.equal((await f.send('/api/state')).result.authenticated, true);
  for (const secret of [token.accessToken, token.refreshToken, 'fixture-activity-renewed', 'fixture-activity-password', values().userActivityId, 'ignored private upstream reply']) assert.ok(!JSON.stringify(f.logs).includes(secret));
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/auth/refresh_token', '/' + read.path, '/' + remove.path, '/' + remove.path]);
});

test('Activity HTTP 401 revokes state and delayed read/delete cannot publish after logout', async t => {
  for (const action of [read, remove]) {
    const rejected = await fixture(t, () => Response.json({ data: [] }, { status: 401 }));
    await rejected.login(); const current = [...rejected.sessions.sessions.values()][0]; current.downloads.set('fixture-download', {});
    const failure = await rejected.execute(action); assert.equal(failure.response.status, 401); assert.equal(failure.result.error.code, 'SESSION_EXPIRED'); assert.equal(current.tokens, null); assert.equal(current.user, null); assert.equal(current.downloads.size, 0);
    let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
    const f = await fixture(t, async () => { ready(); await pending; return Response.json({ data: [row] }); });
    await f.login(); const inFlight = f.execute(action); await started; await f.send('/api/logout', {}); release();
    const output = await inFlight; assert.equal(output.response.status, 401); assert.equal(output.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(output.result).includes(row.userActivityId));
  }
});

test('Activity delayed 401 cannot clear a concurrently refreshed token generation', async () => {
  for (const action of [read, remove]) {
    const current = session(), newer = { ...token, accessToken: 'fixture-activity-new-generation' };
    const client = new ApiClient(configuration, { log: () => {}, transport: async () => { current.tokens = newer; return Response.json({ data: [] }, { status: 401 }); } });
    await assert.rejects(client.request({ ...request(action), session: current }), { code: 'SESSION_CHANGED' }); assert.equal(current.tokens, newer);
  }
});

test('Collection save/status registry stays bound to canonical proofs and exact String field order', () => {
  for (const action of saves) {
    const operation = OPERATIONS.find(item => item.id === action.id);
    assert.equal(operation.evidence.nativeProofSha256, action.proof); assert.equal(operation.evidence.source, 'analysis/recovered/' + action.source + '/flow.json');
    for (const [key, value] of Object.entries({ enabled: true, serviceId: 'main', auth: 'session', method: 'POST', path: action.path, encoding: 'multipart', mutates: true, requiresConfirmation: true })) assert.equal(operation[key], value);
    assert.deepEqual(operation.fields.map(field => [field.path, field.strictString, field.allowEmpty, field.source]), [[action.field, true, true, 'input'], ['Title', true, true, 'input'], ['Subtitle', true, true, action.field === 'PersilId' ? 'constant' : 'input'], ['Nik', true, true, 'session']]);
    assert.equal(operation.fields.at(-1).sessionKey, 'storedSignInNik');
  }
  const status = OPERATIONS.find(item => item.id === bookmarkStatus.id);
  assert.equal(status.evidence.nativeProofSha256, saves[0].proof); assert.equal(status.requiresConfirmation, false); assert.equal(status.encoding, 'none');
  assert.deepEqual(status.fields.map(field => [field.path, field.strictString, field.source]), [['id', true, 'input'], ['type', true, 'constant']]);
});

test('Collection saves inject only the stored sign-in NIK, preserve empty Strings, reject browser NIK and every alias fallback', () => {
  for (const action of saves) {
    for (const nik of ['', ' ', ' fixture stored NIK ']) {
      const prepared = saveRequest(action, saveValues(action, ''), nik); assert.equal(prepared.body.Nik, nik); assert.equal(prepared.body[action.field], '');
      assert.deepEqual(Object.keys(prepared.body), [action.field, 'Title', 'Subtitle', 'Nik']);
      assert.equal(prepared.body.Subtitle, action.field === 'PersilId' ? 'Lokasi Bidang' : ' raw office name ');
      for (const supplied of [nik, 'different', null]) assert.throws(() => prepareOperation(action.id, { ...saveValues(action), Nik: supplied }, { authenticated: true, user: { nomorIndukKependudukan: nik } }), { code: 'SESSION_IDENTITY_MISMATCH' });
    }
    for (const user of [undefined, {}, { nomorIndukKependudukan: null }, { nik: 'alias' }, { Nik: 'alias' }, { nomorIdentitas: 'profile-identity' }]) assert.throws(() => prepareOperation(action.id, saveValues(action), { authenticated: true, user, nik: 'context-alias', profile: { nomorIdentitas: 'profile-alias' } }), { code: 'SESSION_PROFILE_REQUIRED' });
    const exact = prepareOperation(action.id, saveValues(action), { authenticated: true, nik: 'wrong-context', user: { nomorIndukKependudukan: 'stored-only', nik: 'wrong-alias', Nik: 'wrong-alias', nomorIdentitas: 'wrong-profile' } }); assert.equal(exact.body.Nik, 'stored-only');
    for (const field of [action.field, 'Title', ...(action.field === 'BerkasId' ? ['Subtitle'] : [])]) {
      for (const value of [null, undefined]) assert.throws(() => saveRequest(action, { ...saveValues(action), [field]: value }), { code: 'FIELD_REQUIRED' });
      for (const value of [1, false, {}, [], 'nul\0value', 'x'.repeat(16001)]) assert.throws(() => saveRequest(action, { ...saveValues(action), [field]: value }), { code: 'INVALID_FIELD' });
      assert.equal(saveRequest(action, { ...saveValues(action), [field]: '' }).body[field], '');
    }
    for (const nik of [1, false, {}, []]) assert.throws(() => saveRequest(action, saveValues(action), nik), { code: 'INVALID_FIELD' });
    for (const key of ['nik', 'nomorIdentitas', 'nomorIndukKependudukan', 'profile', 'collectionGroupId', 'checksum', 'Lat', 'Longi']) assert.throws(() => saveRequest(action, { ...saveValues(action), [key]: 'unexpected' }), { code: 'UNKNOWN_FIELD' });
  }
  assert.throws(() => saveRequest(saves[1], { ...saveValues(saves[1]), Subtitle: 'replacement' }), { code: 'FIXED_FIELD' });
});

test('Bookmark status sends ordered id/type query and keeps yEb.message distinct from data', async () => {
  const calls = [], client = new ApiClient(configuration, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: 'status-collection-id', data: 'different-data', extra: 'discard' }); } });
  for (const id of ['', 'null:', ' file:id + / & ? # é😀 :2']) {
    const input = statusRequest(id), output = await client.request(input), { url, init } = calls.at(-1);
    assert.deepEqual([...url.searchParams], [['id', id], ['type', 'BERKAS']]); assert.equal(url.pathname, '/' + bookmarkStatus.path); assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.deepEqual(output.data, { error: true, message: 'status-collection-id', data: 'different-data' });
  }
  for (const id of [null, undefined, 0, false, {}, []]) assert.throws(() => prepareOperation(bookmarkStatus.id, { id }, { authenticated: true }), { code: id == null ? 'FIELD_REQUIRED' : 'INVALID_FIELD' });
  assert.throws(() => prepareOperation(bookmarkStatus.id, { id: '', type: 'PERSIL' }, { authenticated: true }), { code: 'FIXED_FIELD' });
});

test('Both collection saves send exactly four ordered multipart Strings and return typed200 without caller policy reinterpretation', async () => {
  const calls = [], client = new ApiClient(configuration, { log: () => {}, transport: async (url, init) => { calls.push({ url, init }); return Response.json({ error: true, message: '', data: ' returned collection id ', extra: 'discard' }); } });
  for (const action of saves) for (const nik of ['', ' stored account NIK ']) {
    const input = saveRequest(action, saveValues(action, ' source / + & ? # 😀 '), nik), output = await client.request(input), { url, init } = calls.at(-1);
    assert.equal(url.href, 'https://sentuh.atrbpn.go.id/' + action.path); assert.equal(init.method, 'POST'); assert.deepEqual([...init.body], Object.entries(input.body));
    assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`); assert.equal(init.headers['Content-Type'], undefined);
    assert.deepEqual(output.data, { error: true, message: '', data: ' returned collection id ' });
  }
  assert.equal(calls.length, 4, 'Save transport does not add assignment, callback or refresh calls');
});

test('Bookmark scopes reject extra headers/body/query/files aliases, changed encoding and direct NIK substitutions before transport', async () => {
  let calls = 0;
  const client = new ApiClient(configuration, { log: () => {}, transport: async () => { calls++; return Response.json({ data: '' }); } });
  const status = statusRequest('');
  for (const patch of [{ method: 'POST' }, { encoding: 'form' }, { auth: 'none' }, { auth: 'optionalSession' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + bookmarkStatus.path }, { path: bookmarkStatus.path + '?id=extra' }, { path: bookmarkStatus.path + '#fragment' }, { body: { unexpected: '' } }, { body: null }, { query: { id: '' } }, { query: { id: '', type: 'PERSIL' } }, { query: { type: 'BERKAS', id: '' } }, { query: { id: '', type: 'BERKAS', extra: undefined } }, { query: { id: null, type: 'BERKAS' } }, { query: null }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...status, ...patch }), { code: 'COLLECTION_STATUS_SCOPE' });
  for (const action of saves) {
    const input = saveRequest(action);
    for (const patch of [{ method: 'PUT' }, { method: 'GET' }, { encoding: 'json' }, { encoding: 'form' }, { auth: 'none' }, { auth: 'optionalSession' }, { auth: 'application' }, { clientProfile: 'sps-document-viewer' }, { path: '/' + action.path }, { path: action.path + '?extra=1' }, { path: action.path + '#fragment' }, { query: { extra: undefined } }, { query: null }, { body: null }, { body: [] }, { body: { ...input.body, extra: '' } }, { body: { ...input.body, Nik: null } }, { body: { Title: input.body.Title, [action.field]: input.body[action.field], Subtitle: input.body.Subtitle, Nik: input.body.Nik } }, { files: [{ key: 'file', file: new Blob(['fixture']) }] }]) await assert.rejects(client.request({ ...input, ...patch }), { code: 'COLLECTION_SAVE_SCOPE' });
    await assert.rejects(client.request({ ...input, body: { ...input.body, Nik: 'browser substitute' } }), { code: 'SESSION_IDENTITY_MISMATCH' });
    for (const user of [undefined, {}, { nomorIndukKependudukan: null }, { nik: input.body.Nik }, { nomorIdentitas: input.body.Nik }]) await assert.rejects(client.request({ ...input, session: { ...input.session, user } }), { code: 'SESSION_PROFILE_REQUIRED' });
    await assert.rejects(client.request({ ...input, session: undefined }), { code: 'AUTH_REQUIRED' });
    await assert.rejects(client.request({ ...input, session: { ...input.session, active: false } }), { code: 'SESSION_EXPIRED' });
  }
  assert.equal(calls, 0);
});

test('Bookmark save/status typed exceptions stay HTTP200 yEb-only and preserve null/empty/error:true fields', async () => {
  for (const input of [statusRequest(''), ...saves.map(action => saveRequest(action))]) {
    for (const envelope of [{}, { error: false }, { error: true, message: '', data: '' }, { error: null, message: null, data: null }]) assert.deepEqual((await clientFor(Response.json(envelope)).request(input)).data, { error: envelope.error ?? null, message: envelope.message ?? null, data: envelope.data ?? null });
    for (const envelope of [[], null, JSON.stringify({ error: false, data: '' }), { error: 'false' }, { message: [] }, { data: [] }, { data: {} }, { data: false }]) await assert.rejects(clientFor(Response.json(envelope)).request(input), { code: 'COLLECTION_RESPONSE_UNRECOGNIZED' });
    for (const status of [201, 204, 299, 400, 403, 500]) await assert.rejects(clientFor(status === 204 ? new Response(null, { status }) : Response.json({ error: false, data: '' }, { status })).request(input), error => error.code === 'UPSTREAM_REJECTED' && error.details.upstreamStatus === status);
    await assert.rejects(clientFor(Response.json({ data: '' }, { status: 401 })).request({ ...input, session: { ...input.session, tokens: { ...token } } }), { code: 'SESSION_EXPIRED' });
    await assert.rejects(clientFor(new Response(null, { status: 302 })).request(input), { code: 'UPSTREAM_REDIRECT' });
  }
  await assert.rejects(clientFor(Response.json({ error: true, data: '' })).request({ ...saveRequest(saves[0]), path: 'Collection/UnauditedBookmark' }), { code: 'UPSTREAM_REJECTED' });
});

test('Bookmark HTTP saves require stored sign-in NIK and explicit confirmation; browser aliases cannot send a write', async t => {
  const f = await fixture(t, () => Response.json({ error: true, message: '', data: 'fixture-saved-id' }), { nomorIndukKependudukan: '' });
  for (const action of saves) assert.equal((await f.execute(action, saveValues(action))).response.status, 401);
  assert.equal(f.calls.length, 0); await f.login();
  for (const action of saves) {
    assert.equal((await f.execute(action, saveValues(action), true, { Origin: 'https://untrusted.example.invalid' })).response.status, 403);
    assert.equal((await f.execute(action, saveValues(action), true, { 'X-CSRF-Token': 'invalid' })).response.status, 403);
    for (const confirm of [false, undefined, 'true']) assert.equal((await f.send('/api/execute', { operationId: action.id, values: saveValues(action), ...(confirm === undefined ? {} : { confirm }) })).result.error.code, 'CONFIRMATION_REQUIRED');
    for (const supplied of ['', 'different']) assert.equal((await f.execute(action, { ...saveValues(action), Nik: supplied })).result.error.code, 'SESSION_IDENTITY_MISMATCH');
    const output = await f.execute(action, saveValues(action)); assert.equal(output.response.status, 200); assert.deepEqual(output.result.result.data, { error: true, message: '', data: 'fixture-saved-id' });
    assert.equal([...f.calls.at(-1).body].at(-1)[1], '', 'Stored empty String passes; no profile fetch or substitute');
  }
  assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', ...saves.map(action => '/' + action.path)]);
  const missing = await fixture(t, () => { throw new Error('must not send when NIK absent'); }, { nomorIndukKependudukan: null, nik: 'ignored alias', nomorIdentitas: 'ignored profile' });
  await missing.login();
  for (const action of saves) { const output = await missing.execute(action, saveValues(action)); assert.equal(output.response.status, 409); assert.equal(output.result.error.code, 'SESSION_PROFILE_REQUIRED'); }
  assert.deepEqual(missing.calls.map(call => call.url.pathname), ['/auth/signin']);
});

test('Bookmark HTTP refresh/redaction/authentication and delayed logout isolation remain intact', async t => {
  for (const action of saves) {
    const f = await fixture(t, url => url.pathname === '/auth/refresh_token' ? Response.json({ data: { ...token, accessToken: 'fixture-bookmark-renewed' } }) : Response.json({ error: true, message: token.refreshToken, data: 'fixture-bookmark-renewed' }), { nomorIndukKependudukan: 'fixture-stored-nik' });
    await f.login(); [...f.sessions.sessions.values()][0].tokens.expiredAt = 1;
    const output = await f.execute(action, saveValues(action)); assert.equal(output.response.status, 200);
    for (const secret of [token.accessToken, token.refreshToken, 'fixture-bookmark-renewed']) assert.ok(!JSON.stringify(output.result).includes(secret));
    for (const secret of [token.accessToken, token.refreshToken, 'fixture-bookmark-renewed', 'fixture-stored-nik', saveValues(action)[action.field]]) assert.ok(!JSON.stringify(f.logs).includes(secret));
    assert.deepEqual(f.calls.map(call => call.url.pathname), ['/auth/signin', '/auth/refresh_token', '/' + action.path]);
    let ready, release; const started = new Promise(resolve => { ready = resolve; }), pending = new Promise(resolve => { release = resolve; });
    const delayed = await fixture(t, async () => { ready(); await pending; return Response.json({ error: false, data: 'private delayed saved id' }); }, { nomorIndukKependudukan: 'fixture-stored-nik' });
    await delayed.login(); const inFlight = delayed.execute(action, saveValues(action)); await started; await delayed.send('/api/logout', {}); release();
    const result = await inFlight; assert.equal(result.response.status, 401); assert.equal(result.result.error.code, 'SESSION_EXPIRED'); assert.ok(!JSON.stringify(result.result).includes('private delayed saved id'));
    const rejected = await fixture(t, () => Response.json({ data: '' }, { status: 401 }), { nomorIndukKependudukan: 'fixture-stored-nik' });
    await rejected.login(); const active = [...rejected.sessions.sessions.values()][0];
    assert.equal((await rejected.execute(action, saveValues(action))).result.error.code, 'SESSION_EXPIRED'); assert.equal(active.tokens, null); assert.equal(active.user, null);
  }
});
