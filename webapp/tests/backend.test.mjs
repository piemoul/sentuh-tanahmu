import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';
import { ApiClient, upstreamUrl, publicData } from '../private/api-client.mjs';
import { SessionStore, csrfMatches } from '../private/session.mjs';
import { loadConfiguration } from '../private/configuration.mjs';
import { OPERATIONS } from '../private/operations.mjs';

const fixtureConfig = { configured: true, origin: 'https://sentuh.atrbpn.go.id/', reason: 'mock only', applicationAuthorization: () => 'AtrBpn fixture-application-value' };
const user = { username: 'fixture-user', email: 'fixture@example.invalid', nomorIndukKependudukan: '1234567890123456', roleUser: 'fixture-role' };
const token = { tokenType: 'Bearer', accessToken: 'fixture-access-value', refreshToken: 'fixture-refresh-value', expiredAt: 4_000_000_000 };
const spsOperation = 'get-dokumen-getdokumen-d3e240';
const spsValues = { id: 'fixture-id + &=?', tipe: 'fixture-alias + &=?' };
const spsRequest = session => ({ path: 'dokumen/GetDokumen', method: 'GET', encoding: 'none', auth: 'session', query: spsValues, session, clientProfile: 'sps-document-viewer' });
const documentOperation = 'post-apis-getdocument-d41ee8';
const documentRequest = session => ({ path: 'apis/GetDocument', method: 'POST', encoding: 'form', auth: 'session', body: {q: 'fixture-kkpr:KKPRKU', name: ''}, session });
const documentGeoOperation = 'get-apis-getgeojsoninfo-d39f1c';
const documentGeoRequest = (session, q = 'fixture-document') => ({path: '/apis/getGeoJsonInfo', method: 'GET', encoding: 'none', auth: 'session', query: {q}, session});
// Synthetic prefix/length fixture, not a structurally valid or authentic PDF.
const documentBytes = (size = 256) => { const bytes = Buffer.alloc(size, 0x20); bytes.write('%PDF-1.4\n% synthetic fixture'); return bytes; };
const jsonResponse = data => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
async function fixture(t, responder = () => jsonResponse({ error: false, data: { success: true } }), options = {}) {
  const calls = [];
  const sessions = new SessionStore();
  const server = createServer({ configuration: fixtureConfig, sessions, now: options.now, log: options.log || (() => {}), transport: async (url, init) => {
    calls.push({ url: String(url), ...init });
    if (url.pathname === '/auth/signin') return options.signIn ? options.signIn() : jsonResponse({ error: false, message: 'ok', data: { ...user, token } });
    return responder(url, init);
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = ''; let state;
  async function request(route, data, overrides = {}) {
    const isPost = data !== undefined;
    const response = await fetch(base + route, { method: isPost ? 'POST' : 'GET', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(isPost ? { Origin: base, 'X-CSRF-Token': state?.csrfToken || '', ...(data instanceof FormData ? {} : { 'Content-Type': 'application/json' }) } : {}), ...(overrides.headers || {}) }, ...(isPost ? { body: data instanceof FormData ? data : JSON.stringify(data) } : {}) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    const result = await response.json();
    if (result.csrfToken) state = result;
    return { response, result };
  }
  await request('/api/state');
  return { calls, request, base, sessions, get cookie() { return cookie; }, get state() { return state; } };
}
test('Cari Berkas office picker preserves the audited empty name and office types', async t => {
  const offices=[{KantorId:'fixture-office +&',Nama:'Kantor UJI',TipeKantorId:3}];
  const f=await fixture(t,()=>jsonResponse(offices));
  const operationId='get-legacy-kantah-d10364';
  const first=await f.request('/api/execute',{operationId,values:{nama:'',tipeKantor:'3,2,1'}});
  assert.equal(first.response.status,200);
  assert.deepEqual(first.result.result.data,offices);
  const url=new URL(f.calls[0].url);
  assert.equal(url.pathname,'/legacy/Kantah');
  assert.equal(url.searchParams.get('nama'),'');
  assert.equal(url.searchParams.get('tipeKantor'),'3,2,1');
  assert.equal(f.calls[0].method,'GET');
  assert.equal(f.calls[0].headers.Authorization,undefined);
  const missing=await f.request('/api/execute',{operationId,values:{nama:''}});
  assert.equal(missing.response.status,400);
  const extra=await f.request('/api/execute',{operationId,values:{nama:'',tipeKantor:'3,2,1',endpoint:'/unregistered'}});
  assert.equal(extra.response.status,400);
  assert.equal(f.calls.length,1,'Invalid requests never reach transport');
});

test('state/catalog are local only; session cookie is HttpOnly; private code stays inaccessible', async t => {
  const f = await fixture(t);
  assert.equal(f.calls.length, 0);
  const state = await fetch(f.base + '/api/state');
  assert.match(state.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await state.json()).authenticated, false);
  const catalog = await f.request('/api/catalog');
  assert.equal(catalog.result.operations.length, 176);
  assert.equal(f.calls.length, 0);
  for (const url of ['/private/configuration.mjs', '/private/operations.mjs', '/private/api-client.mjs', '/private/https-transport.mjs', '/server.mjs', '/analysis/recovered/blutter-unique/pp.txt']) assert.ok([403,404].includes((await fetch(f.base + url)).status));
});
test('login requires Origin+CSRF and unicode CSRF does not throw', async t => {
  const f = await fixture(t);
  const payload = { username: 'fixture-user', password: 'fixture-password' };
  assert.equal((await f.request('/api/login', payload, { headers: { Origin: 'http://evil.invalid' } })).response.status, 403);
  assert.equal((await f.request('/api/login', payload, { headers: { 'X-CSRF-Token': 'incorrect' } })).response.status, 403);
  assert.equal(f.calls.length, 0);
  assert.equal(csrfMatches('é'.repeat(43), 'a'.repeat(43)), false);
});

test('public catalog and diagnostics never bootstrap a session; anonymous download returns 404', async t => {
  const f = await fixture(t);
  const results = await Promise.all(['/api/catalog', '/api/diagnostics', '/api/download/missing'].map(route => fetch(f.base + route)));
  assert.deepEqual(results.map(response => response.status), [200, 200, 404]);
  for (const response of results) {
    assert.equal(response.headers.get('set-cookie'), null);
    await response.json();
  }
  const withSession = await f.request('/api/catalog');
  assert.equal(withSession.response.headers.get('set-cookie'), null);
  const state = await f.request('/api/state');
  assert.equal(state.response.headers.get('set-cookie'), null);
  assert.equal(f.calls.length, 0);
});

test('main-client GET and bodyless POST carry audited form content type without inventing a body', async () => {
  const calls = [];
  const client = new ApiClient(fixtureConfig, { transport: async (url, init) => { calls.push({ url, ...init }); return jsonResponse({ data: [] }); } });
  await client.request({ path: 'legacy/SertifikatTanahNew', query: { nik: user.nomorIndukKependudukan }, method: 'GET', encoding: 'none', auth: 'session', session: { tokens: token } });
  assert.equal(calls[0].headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[0].headers.Authorization, 'Bearer fixture-access-value');
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].url.searchParams.get('nik'), user.nomorIndukKependudukan);
  await client.request({ base: 'https://antre.atrbpn.go.id/be/api/', path: 'fixture', method: 'GET', encoding: 'none' });
  assert.equal(calls[1].headers['Content-Type'], undefined);
  await client.request({ path: 'PlotBidang/DaftarPlot', method: 'POST', encoding: 'none', auth: 'session', session: { tokens: token } });
  assert.equal(calls[2].headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(calls[2].headers.Authorization, 'Bearer fixture-access-value');
  assert.equal(calls[2].body, undefined);
});

test('retrieved document bytes stay behind the originating session and become unavailable after logout', async t => {
  const pdf = documentBytes();
  const f = await fixture(t, () => new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } }));
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const run = await f.request('/api/execute', { operationId: 'post-apis-getdocument-d41ee8', values: { q: 'fixture-code', name: 'fixture-document' } });
  assert.equal(run.response.status, 200);
  const link = run.result.result.downloadUrl;
  assert.match(link, /^\/api\/download\/[A-Za-z0-9_-]+$/);
  const download = await fetch(f.base + link, { headers: { Cookie: f.cookie } });
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/pdf');
  assert.match(download.headers.get('content-disposition'), /^attachment;/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  assert.equal(run.result.result.previewUrl, link.replace('/download/', '/preview/'));
  const preview = await fetch(f.base + run.result.result.previewUrl, { headers: { Cookie: f.cookie } });
  assert.equal(preview.status, 200); assert.match(preview.headers.get('content-disposition'), /^inline;/);
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), pdf);
  assert.equal((await fetch(f.base + link)).status, 404);
  const previousCookie = f.cookie;
  await f.request('/api/logout', {});
  assert.equal((await fetch(f.base + link, { headers: { Cookie: previousCookie } })).status, 404);
  assert.equal((await fetch(f.base + run.result.result.previewUrl, { headers: { Cookie: previousCookie } })).status, 404);
  assert.equal(f.calls.length, 2, 'Only mocked login and document retrieval reach transport');
});

test('SPS viewer sends encoded selected ID/alias with stored authorization and no main-client content headers', async t => {
  const pdf = Buffer.from('%PDF-1.4\n% synthetic SPS fixture\n%%EOF');
  const f = await fixture(t, () => new Response(pdf, { headers: { 'Content-Type': 'application/json' } }));
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const run = await f.request('/api/execute', { operationId: spsOperation, values: spsValues });
  assert.equal(run.response.status, 200, JSON.stringify(run.result));
  const call = f.calls.at(-1); const url = new URL(call.url);
  assert.equal(url.origin, 'https://sentuh.atrbpn.go.id'); assert.equal(url.pathname, '/dokumen/GetDokumen');
  assert.deepEqual(Object.fromEntries(url.searchParams), spsValues);
  assert.equal(call.method, 'GET'); assert.equal(call.body, undefined);
  assert.equal(call.headers.Authorization, 'Bearer fixture-access-value');
  assert.equal(call.headers.Accept, undefined); assert.equal(call.headers['Content-Type'], undefined);
  assert.equal(run.result.result.contentType, 'application/pdf'); assert.equal(run.result.result.data, null);
  assert.match(run.result.result.previewUrl, /^\/api\/preview\/[A-Za-z0-9_-]+$/);
  assert.equal(run.result.result.downloadUrl.replace('/download/', '/preview/'), run.result.result.previewUrl);
  const preview = await fetch(f.base + run.result.result.previewUrl, { headers: { Cookie: f.cookie } });
  assert.equal(preview.status, 200); assert.equal(preview.headers.get('content-type'), 'application/pdf');
  assert.equal(preview.headers.get('content-disposition'), 'inline; filename="sentuh-document.pdf"');
  assert.equal(preview.headers.get('x-content-type-options'), 'nosniff'); assert.equal(preview.headers.get('cache-control'), 'no-store');
  assert.match(preview.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()), pdf);
  const download = await fetch(f.base + run.result.result.downloadUrl, { headers: { Cookie: f.cookie } });
  assert.equal(download.headers.get('content-disposition'), 'attachment; filename="sentuh-document.pdf"');
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  assert.equal(f.calls.length, 2);
});

test('GetDocument requires more than 200 bytes and a PDF prefix while ignoring upstream MIME', async () => {
  const session = {active: true, tokens: {...token}};
  for (const contentType of ['application/pdf', 'application/json', 'application/octet-stream', 'text/plain', null]) {
    const pdf = documentBytes(201);
    const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => new Response(pdf, {headers: contentType ? {'Content-Type': contentType} : {}})});
    const result = await client.request(documentRequest(session));
    assert.equal(result.status, 200); assert.equal(result.contentType, 'application/pdf'); assert.equal(result.previewable, true); assert.deepEqual(result.bytes, pdf);
  }
  for (const bytes of [documentBytes(0), documentBytes(199), documentBytes(200), Buffer.from(' %PDF'.padEnd(256, ' ')), Buffer.alloc(256, 0x41)]) {
    const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => new Response(bytes, {headers: {'Content-Type': 'application/pdf'}})});
    await assert.rejects(client.request(documentRequest(session)), {code: 'INVALID_UPSTREAM_PDF'});
  }
});

test('GetDocument rejects non-200 PDF responses and keeps redirects and session failures explicit', async () => {
  for (const status of [201, 204, 206, 302, 400, 401, 403, 500]) {
    const session = {active: true, user, tokens: {...token}, downloads: new Map([['fixture-existing', {}]])};
    const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => new Response(status === 204 ? null : documentBytes(), {status, headers: {'Content-Type': 'application/pdf', Location: 'https://example.invalid/'}})});
    await assert.rejects(client.request(documentRequest(session)), error => {
      const expected = status === 302 ? 'UPSTREAM_REDIRECT' : status === 401 ? 'SESSION_EXPIRED' : status >= 400 ? 'UPSTREAM_REJECTED' : 'INVALID_UPSTREAM_PDF';
      assert.equal(error.code, expected); return true;
    });
    assert.equal(Boolean(session.tokens), status !== 401); assert.equal(session.downloads.size, status === 401 ? 0 : 1);
  }
});

test('GetDocument JSON errors keep redacted diagnostics while other long non-PDF bodies never become previews', async () => {
  const session = {active: true, tokens: {...token}};
  const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => Response.json({error: true, code: 'FIXTURE_DOCUMENT_REJECTED', message: `Denied ${token.accessToken}`, padding: 'x'.repeat(256)})});
  await assert.rejects(client.request(documentRequest(session)), error => {
    assert.equal(error.code, 'UPSTREAM_REJECTED'); assert.equal(error.details.code, 'FIXTURE_DOCUMENT_REJECTED'); assert.equal(error.details.message, 'Denied [REDACTED]'); return true;
  });
  for (const [body, contentType] of [[JSON.stringify({message: 'x'.repeat(256)}), 'application/json'], ['<html>fixture</html>'.padEnd(256, ' '), 'application/pdf']]) {
    const rejected = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => new Response(body, {headers: {'Content-Type': contentType}})});
    await assert.rejects(rejected.request(documentRequest(session)), {code: 'INVALID_UPSTREAM_PDF'});
  }
});

test('GetDocument enforces the shared 20 MiB declared and streamed limits', async () => {
  for (const declared of [true, false]) {
    let canceled = false;
    const body = new ReadableStream({start(controller) {if (!declared) controller.enqueue(documentBytes(20 * 1024 * 1024 + 1));}, cancel() {canceled = true;}});
    const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => new Response(body, {headers: declared ? {'Content-Length': String(20 * 1024 * 1024 + 1)} : {}})});
    await assert.rejects(client.request(documentRequest({tokens: {...token}})), {code: 'RESPONSE_TOO_LARGE'}); assert.equal(canceled, true);
  }
});

test('GetDocument keeps main-client refresh and exact form fields including an empty name', async t => {
  const f = await fixture(t, url => url.pathname === '/auth/refresh_token' ? jsonResponse({data: {...token, accessToken: 'fixture-renewed-document-token'}}) : new Response(documentBytes(), {headers: {'Content-Type': 'application/json'}}));
  await f.request('/api/login', {username: user.username, password: 'fixture-password'});
  const owner = [...f.sessions.sessions.values()].find(session => session.tokens); owner.tokens.expiredAt = 1;
  const q = 'fixture-ID + & = :KKPRKU', run = await f.request('/api/execute', {operationId: documentOperation, values: {q, name: ''}});
  assert.equal(run.response.status, 200, JSON.stringify(run.result));
  assert.deepEqual(f.calls.map(call => new URL(call.url).pathname), ['/auth/signin', '/auth/refresh_token', '/apis/GetDocument']);
  const call = f.calls.at(-1); assert.equal(call.method, 'POST'); assert.equal(call.headers.Authorization, 'Bearer fixture-renewed-document-token');
  assert.equal(call.headers.Accept, 'application/json'); assert.equal(call.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.deepEqual(Object.fromEntries(call.body), {q, name: ''}); assert.match(call.body.toString(), /&name=$/);
  assert.equal(run.result.result.contentType, 'application/pdf'); assert.ok(run.result.result.previewUrl);
});

test('document geometry applies both native encoders only to its q and leaves generic query encoding unchanged', async () => {
  const vectors = [
    ['abc-_.~012', '?q=abc-_.~012'],
    ['a:b +%', '?q=a%253Ab%2520%252B%2525'],
    ["!'()*~", '?q=%21%27%28%29%2A~'],
    ['é/文😀', '?q=%25C3%25A9%252F%25E6%2596%2587%25F0%259F%2598%2580'],
    ['\ud800', '?q=%25EF%25BF%25BD'],
    ['\udc00', '?q=%25EF%25BF%25BD'],
    ['%3A', '?q=%25253A'],
  ];
  const calls = [], logs = [];
  const client = new ApiClient(fixtureConfig, {log: entry => logs.push(entry), transport: async (url, init) => {calls.push({url, init}); return Response.json({geometri: null});}});
  for (const [q, expected] of vectors) {
    const input = documentGeoRequest({active: true, tokens: {...token}}, q);
    await client.request(input);
    const {url, init} = calls.at(-1);
    assert.equal(url.origin, 'https://sentuh.atrbpn.go.id'); assert.equal(url.pathname, '/apis/getGeoJsonInfo');
    assert.equal(url.search, expected); assert.equal(new Request(url).url, url.href);
    assert.deepEqual(input.query, {q}, 'Encoding must not mutate the caller parameter');
    assert.equal(init.method, 'GET'); assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, `Bearer ${token.accessToken}`);
    assert.equal(init.headers.Accept, 'application/json'); assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  }
  assert.equal(upstreamUrl('https://sentuh.atrbpn.go.id/', 'fixture', {q: 'a:b +%'}).search, '?q=a%3Ab+%2B%25');
  assert.equal(upstreamUrl('https://sentuh.atrbpn.go.id/', 'fixture', {q: "!'()*~"}).search, '?q=%21%27%28%29*%7E');
  assert.equal(logs.length, vectors.length); assert.ok(logs.every(entry => entry.path === '/apis/getGeoJsonInfo' && !Object.hasOwn(entry, 'query')));
  assert.ok(!JSON.stringify(logs).includes(token.accessToken)); assert.ok(!JSON.stringify(logs).includes('%253A'));
});

test('document geometry scope rejects unsupported transport and query overrides before any request', async () => {
  let calls = 0;
  const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => {calls++; return Response.json({geometri: null});}});
  for (const override of [
    {path: 'apis/getGeoJsonInfo'}, {path: '/apis/getGeoJsonInfo?ignored=yes'},
    {method: 'POST'}, {encoding: 'form'}, {auth: 'none'}, {auth: 'application'},
    {clientProfile: 'sps-document-viewer'}, {query: {}}, {query: {q: ''}}, {query: {q: 1}},
    {query: {q: 'fixture', persilid: 'other'}}, {body: {q: 'fixture'}}, {files: [{key: 'file'}]},
  ]) await assert.rejects(client.request({...documentGeoRequest({tokens: {...token}}), ...override}), error => error.code === 'DOCUMENT_GEO_SCOPE');
  await assert.rejects(client.request(documentGeoRequest({})), error => error.code === 'AUTH_REQUIRED');
  await assert.rejects(client.request({...documentGeoRequest({tokens: {...token}}), base: 'https://antre.atrbpn.go.id/'}), error => error.code === 'TOKEN_AUDIENCE_UNVERIFIED');
  assert.equal(calls, 0);
});

test('document geometry refreshes the main session and preserves a direct four-list body through the HTTP API', async t => {
  const coordinates = [[[[106, -6, 17], [106.01, -6], [106, -6.01], [106, -6]], [[106.001, -6.001], [106.002, -6.001], [106.001, -6.002], [106.001, -6.001]]], [[[107, -7], [107.01, -7], [107, -7.01], [107, -7]]]];
  const upstream = {geometri: {type: 'MultiPolygon', coordinates}, tipeHak: 'Hak Milik', token: 'fixture-hidden-token', note: 'fixture-renewed-geometry-token'};
  const f = await fixture(t, url => url.pathname === '/auth/refresh_token' ? jsonResponse({data: {...token, accessToken: 'fixture-renewed-geometry-token'}}) : jsonResponse(upstream));
  await f.request('/api/login', {username: user.username, password: 'fixture-password'});
  const owner = [...f.sessions.sessions.values()].find(session => session.tokens); owner.tokens.expiredAt = 1;
  const run = await f.request('/api/execute', {operationId: documentGeoOperation, values: {q: 'a:b +%'}});
  assert.equal(run.response.status, 200, JSON.stringify(run.result)); assert.equal(run.result.ok, true);
  assert.deepEqual(f.calls.map(call => new URL(call.url).pathname), ['/auth/signin', '/auth/refresh_token', '/apis/getGeoJsonInfo']);
  const call = f.calls.at(-1); assert.equal(new URL(call.url).search, '?q=a%253Ab%2520%252B%2525');
  assert.equal(call.method, 'GET'); assert.equal(call.body, undefined); assert.equal(call.headers.Authorization, 'Bearer fixture-renewed-geometry-token');
  assert.equal(run.result.result.status, 200); assert.deepEqual(run.result.result.data, {...upstream, token: '[REDACTED]', note: '[REDACTED]'});
  assert.equal(Object.hasOwn(run.result.result.data, 'data'), false, 'The server must not add an upstream envelope');
  assert.equal(Object.hasOwn(run.result.result, 'downloadUrl'), false); assert.equal(owner.downloads.size, 0);
});

test('document geometry requires HTTP 200 JSON without creating downloads and leaves model validation to the frontend', async t => {
  for (const body of [null, [], {data: {geometri: {type: 'MultiPolygon', coordinates: []}}}, {geometri: {type: 'Polygon', coordinates: [[[106, -6]]]}}]) {
    const client = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => Response.json(body)});
    const result = await client.request(documentGeoRequest({tokens: {...token}}));
    assert.equal(result.status, 200); assert.deepEqual(result.data, body); assert.equal(Object.hasOwn(result, 'bytes'), false);
  }
  let responseCase;
  const f = await fixture(t, () => responseCase());
  await f.request('/api/login', {username: user.username, password: 'fixture-password'});
  const owner = [...f.sessions.sessions.values()].find(session => session.tokens);
  for (const [responder, code, upstreamStatus] of [
    [() => Response.json({geometri: null}, {status: 201}), 'UPSTREAM_REJECTED', 201],
    [() => new Response(null, {status: 204}), 'UPSTREAM_REJECTED', 204],
    [() => new Response('fixture-text', {headers: {'Content-Type': 'text/plain'}}), 'INVALID_UPSTREAM_JSON'],
    [() => new Response(documentBytes(), {headers: {'Content-Type': 'application/pdf'}}), 'INVALID_UPSTREAM_JSON'],
    [() => new Response(new Uint8Array([0, 1, 2]), {headers: {'Content-Type': 'application/octet-stream'}}), 'INVALID_UPSTREAM_JSON'],
  ]) {
    responseCase = responder;
    const run = await f.request('/api/execute', {operationId: documentGeoOperation, values: {q: 'fixture-document'}});
    assert.equal(run.response.status, 502); assert.equal(run.result.error.code, code);
    if (upstreamStatus) assert.equal(run.result.error.details.upstreamStatus, upstreamStatus);
    assert.equal(Object.hasOwn(run.result, 'result'), false); assert.equal(owner.downloads.size, 0);
  }
  const commonErrorGuard = new ApiClient(fixtureConfig, {log: () => {}, transport: async () => Response.json({error: true, geometri: null, message: token.accessToken})});
  await assert.rejects(commonErrorGuard.request(documentGeoRequest({tokens: {...token}})), error => error.code === 'UPSTREAM_REJECTED' && error.details.upstreamStatus === 200 && !JSON.stringify(error).includes(token.accessToken));
});

test('GetDocument preview and download share session isolation, expiry and refresh invalidation', async t => {
  const f = await fixture(t, url => url.pathname === '/auth/refresh_token' ? Response.json({message: 'fixture refresh expired'}, {status: 401}) : new Response(documentBytes()));
  await f.request('/api/login', {username: user.username, password: 'fixture-password'});
  const values = {q: 'fixture-document:KKPRKU'}, first = await f.request('/api/execute', {operationId: documentOperation, values});
  assert.equal(first.response.status, 200); assert.equal(f.calls.at(-1).body.get('name'), '');
  const owner = [...f.sessions.sessions.values()].find(session => session.tokens), foreign = f.sessions.create();
  const links = [first.result.result.downloadUrl, first.result.result.previewUrl];
  for (const link of links) {
    assert.equal((await fetch(f.base + link)).status, 404);
    assert.equal((await fetch(f.base + link, {headers: {Cookie: `sentuh_local_session=${foreign.id}`}})).status, 404);
    const own = await fetch(f.base + link, {headers: {Cookie: f.cookie}}); assert.equal(own.status, 200); assert.equal(own.headers.get('cache-control'), 'no-store'); await own.arrayBuffer();
  }
  for (const document of owner.downloads.values()) document.expires = Date.now() - 1;
  for (const link of links) assert.equal((await fetch(f.base + link, {headers: {Cookie: f.cookie}})).status, 404);
  const renewed = await f.request('/api/execute', {operationId: documentOperation, values}); owner.tokens.expiredAt = 1;
  const expired = await f.request('/api/execute', {operationId: documentOperation, values}); assert.equal(expired.result.error.code, 'SESSION_EXPIRED');
  for (const link of [renewed.result.result.downloadUrl, renewed.result.result.previewUrl]) assert.equal((await fetch(f.base + link, {headers: {Cookie: f.cookie}})).status, 404);
  assert.equal(owner.downloads.size, 0); assert.equal(owner.tokens, null);
});

test('PDF MIME on unrelated main-client operations does not grant document preview', async t => {
  const f = await fixture(t, () => new Response(documentBytes(), {headers: {'Content-Type': 'application/pdf'}}));
  await f.request('/api/login', {username: user.username, password: 'fixture-password'});
  const run = await f.request('/api/execute', {operationId: 'post-account-account-summary-d2939c', values: {}});
  assert.equal(run.response.status, 200); assert.ok(run.result.result.downloadUrl); assert.equal(run.result.result.previewUrl, undefined);
  assert.equal((await fetch(f.base + run.result.result.downloadUrl.replace('/download/', '/preview/'), {headers: {Cookie: f.cookie}})).status, 404);
});

test('SPS PDF detection ignores MIME but requires the exact nonempty leading bytes', async () => {
  for (const contentType of ['application/pdf', 'application/octet-stream', 'text/plain', 'application/json']) {
    const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response('%PDF-fixture', { headers: { 'Content-Type': contentType } }) });
    const result = await client.request(spsRequest({ tokens: { ...token } }));
    assert.equal(result.contentType, 'application/pdf'); assert.equal(result.previewable, true);
  }
  for (const body of ['', '%PD', ' %PDF-fixture', '{"error":true,"message":"fixture-sensitive-value"}', '<html>fixture</html>', Buffer.from([0xa5, 0xd0, 0xc4, 0xc6])]) {
    const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response(body, { headers: { 'Content-Type': 'application/pdf' } }) });
    await assert.rejects(client.request(spsRequest({ tokens: { ...token } })), error => error.code === 'INVALID_UPSTREAM_PDF' && !JSON.stringify(error).includes('fixture-sensitive-value'));
  }
});

test('SPS viewer rejects statuses other than 200 and redirects without reading or exposing error bodies', async () => {
  for (const status of [201, 204, 206, 302, 400, 401, 403, 500]) {
    let canceled = false;
    const body = status === 204 ? null : new ReadableStream({ cancel() { canceled = true; } });
    const session = { tokens: { ...token }, user: { ...user }, downloads: new Map([['old', {}]]) };
    const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response(body, { status, headers: { Location: 'https://example.invalid/', 'Content-Type': 'application/pdf' } }) });
    await assert.rejects(client.request(spsRequest(session)), error => error.code === (status === 302 ? 'UPSTREAM_REDIRECT' : status === 401 ? 'SESSION_EXPIRED' : 'UPSTREAM_REJECTED'));
    if (status !== 204) assert.equal(canceled, true);
    assert.equal(Boolean(session.tokens), status !== 401);
  }
});

test('SPS viewer enforces the 20 MiB byte limit for declared and streamed response sizes', async () => {
  for (const declared of [true, false]) {
    let canceled = false;
    const body = new ReadableStream({ start(controller) { if (!declared) controller.enqueue(Buffer.alloc(20 * 1024 * 1024 + 1, 0x20)); }, cancel() { canceled = true; } });
    const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response(body, { headers: declared ? { 'Content-Length': String(20 * 1024 * 1024 + 1) } : {} }) });
    await assert.rejects(client.request(spsRequest({ tokens: { ...token } })), error => error.code === 'RESPONSE_TOO_LARGE');
    assert.equal(canceled, true);
  }
});

test('SPS transport profile cannot widen paths, methods, origins, fields or authentication', async () => {
  let calls = 0;
  const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => { calls++; return new Response('%PDF-fixture'); } });
  for (const override of [{ path: 'legacy/GetInfoSertifikat' }, { method: 'POST' }, { encoding: 'form' }, { base: 'https://antre.atrbpn.go.id/' }, { auth: 'application' }, { query: { ...spsValues, url: 'https://example.invalid/' } }, { body: { arbitrary: true } }, { clientProfile: 'invented-profile' }]) {
    await assert.rejects(client.request({ ...spsRequest({ tokens: { ...token } }), ...override }), error => error.code === 'CLIENT_PROFILE_SCOPE');
  }
  assert.equal(calls, 0);
});

test('SPS preview and download remain private to their session and expire together', async t => {
  const f = await fixture(t, () => new Response('%PDF-fixture'));
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const run = await f.request('/api/execute', { operationId: spsOperation, values: spsValues });
  const links = [run.result.result.previewUrl, run.result.result.downloadUrl];
  const foreign = f.sessions.create(); const foreignCookie = f.cookie.replace(/=.*/, '=' + foreign.id);
  for (const link of links) {
    assert.equal((await fetch(f.base + link)).status, 404);
    assert.equal((await fetch(f.base + link, { headers: { Cookie: foreignCookie } })).status, 404);
    assert.equal((await fetch(f.base + link, { headers: { Cookie: f.cookie, Origin: 'https://example.invalid' } })).status, 403);
  }
  const owner = [...f.sessions.sessions.values()].find(session => session.tokens);
  for (const download of owner.downloads.values()) download.expires = Date.now() - 1;
  for (const link of links) assert.equal((await fetch(f.base + link, { headers: { Cookie: f.cookie } })).status, 404);
  const fresh = await f.request('/api/execute', { operationId: spsOperation, values: spsValues });
  const oldCookie = f.cookie; await f.request('/api/logout', {});
  for (const link of [fresh.result.result.previewUrl, fresh.result.result.downloadUrl]) assert.equal((await fetch(f.base + link, { headers: { Cookie: oldCookie } })).status, 404);
  assert.equal(f.calls.length, 3);
});

test('SPS uses the stored expired token without main-client refresh and clears documents on upstream 401', async t => {
  let documentCalls = 0;
  const f = await fixture(t, () => ++documentCalls === 1 ? new Response('%PDF-fixture') : new Response('private upstream body', { status: 401 }));
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const session = [...f.sessions.sessions.values()][0]; session.tokens.expiredAt = 1;
  const first = await f.request('/api/execute', { operationId: spsOperation, values: spsValues });
  assert.equal(first.response.status, 200); assert.equal(documentCalls, 1);
  assert.equal(f.calls.at(-1).headers.Authorization, 'Bearer fixture-access-value');
  const second = await f.request('/api/execute', { operationId: spsOperation, values: spsValues });
  assert.equal(second.response.status, 401); assert.equal(second.result.error.code, 'SESSION_EXPIRED');
  assert.equal(session.tokens, null); assert.equal(session.downloads.size, 0);
  assert.equal((await fetch(f.base + first.result.result.previewUrl, { headers: { Cookie: f.cookie } })).status, 404);
  assert.equal(f.calls.length, 3); assert.ok(f.calls.every(call => new URL(call.url).pathname !== '/auth/refresh_token'));
});

test('SPS transport logs omit query values, authorization, headers and rejected bytes', async () => {
  const logs = [];
  const client = new ApiClient(fixtureConfig, { log: entry => logs.push(entry), transport: async () => new Response('fixture-private-document-body', { headers: { 'Content-Type': 'application/pdf', 'X-Private-Value': 'fixture-private-header' } }) });
  await assert.rejects(client.request(spsRequest({ tokens: { ...token } })), error => error.code === 'INVALID_UPSTREAM_PDF');
  assert.equal(logs.length, 1); assert.equal(logs[0].path, '/dokumen/GetDokumen');
  assert.deepEqual(Object.keys(logs[0]).sort(), ['elapsedMs', 'event', 'hostname', 'networkCode', 'path', 'requestId', 'stage', 'status']);
  const output = JSON.stringify(logs);
  for (const sensitive of [spsValues.id, spsValues.tipe, token.accessToken, 'fixture-private-document-body', 'fixture-private-header']) assert.ok(!output.includes(sensitive));
});
test('login sends exact audited form to mock only, rotates session, never returns tokens', async t => {
  const f = await fixture(t); const oldCookie = f.cookie; const oldCsrf = f.state.csrfToken;
  const login = await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  assert.equal(login.response.status, 200); assert.equal(login.result.authenticated, true);
  assert.notEqual(f.cookie, oldCookie); assert.notEqual(f.state.csrfToken, oldCsrf);
  const call = f.calls[0];
  assert.equal(call.url, 'https://sentuh.atrbpn.go.id/auth/signin');
  assert.equal(call.headers.Authorization, 'AtrBpn fixture-application-value');
  assert.equal(call.headers['User-Agent'], 'Sentuh-Browser-Reconstruction/0.1');
  assert.deepEqual(Object.fromEntries(call.body), { devicePlatform: 'android', username: 'fixture-user', password: 'fixture-password' });
  assert.ok(!JSON.stringify(login.result).includes('fixture-access-value'));
  const oldState = await fetch(f.base + '/api/state', { headers: { Cookie: oldCookie } });
  assert.equal((await oldState.json()).authenticated, false);
});
test('authenticated account summary uses bearer and appVersion; own identity cannot be overridden', async t => {
  const f = await fixture(t);
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const run = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(run.response.status, 200, JSON.stringify(run.result));
  const call = f.calls.at(-1);
  assert.equal(call.headers.Authorization, 'Bearer fixture-access-value');
  assert.equal(call.body.get('appVersion'), '6.1.5');
  const before = f.calls.length;
  const foreign = await f.request('/api/execute', { operationId: 'get-legacy-sertifikattanahnew-d44dc0', values: { nik: '0000000000000000' } });
  assert.ok([400,403].includes(foreign.response.status)); assert.equal(f.calls.length, before);
});
test('unsupported and arbitrary operations never contact upstream; protected reads need login', async t => {
  const f = await fixture(t);
  for (const id of ['https://evil.invalid/', 'post-auth-signin-d8e744']) assert.ok((await f.request('/api/execute', { operationId: id, values: {} })).response.status >= 400);
  assert.equal((await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} })).response.status, 401);
  assert.equal(f.calls.length, 0);
});
test('geotag rejects coordinate substitution before upstream access, including confirmed offline multipart', async t => {
  const f = await fixture(t);
  await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const values = { BerkasId: 'fixture-file', Lat: '-6.123456789', Longi: '106.123456789', Lokasi: 'Survey GNSS fixture', IsOffline: false };
  let result = await f.request('/api/execute', { operationId: 'post-geotag-uploadgeotag-d96b98', values });
  assert.equal(result.result.error.code, 'OPERATION_INSPECT_ONLY');
  result = await f.request('/api/execute', { operationId: 'post-geotag-uploadgeotag-d96b98', values, confirm: true });
  assert.equal(result.result.error.code, 'OPERATION_INSPECT_ONLY');
  const form = new FormData(); form.set('operationId', 'post-geotag-uploadgeotag-d96b98'); form.set('values', JSON.stringify(values)); form.set('confirm', 'true');
  form.set('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'fixture.png');
  result = await f.request('/api/execute', form);
  assert.equal(result.response.status, 422, JSON.stringify(result.result));
  assert.equal(result.result.error.code, 'OPERATION_INSPECT_ONLY');
  values.IsOffline = true; form.set('values', JSON.stringify(values));
  result = await f.request('/api/execute', form);
  assert.equal(result.response.status, 422); assert.equal(f.calls.length, 1);
});
test('logout invalidates server tokens and old cookie', async t => {
  const f = await fixture(t); await f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  const oldCookie = f.cookie;
  assert.equal((await f.request('/api/logout', {})).result.authenticated, false);
  const oldState = await fetch(f.base + '/api/state', { headers: { Cookie: oldCookie } }); assert.equal((await oldState.json()).authenticated, false);
  assert.equal(f.calls.length, 1);
});

test('a delayed successful login cannot resurrect a session invalidated by logout', async t => {
  let started; const start = new Promise(resolve => { started = resolve; });
  let release; const pending = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, undefined, { signIn: async () => { started(); await pending; return jsonResponse({ data: { ...user, token } }); } });
  const login = f.request('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  await start;
  const logout = await f.request('/api/logout', {});
  assert.equal(logout.result.authenticated, false);
  release();
  const result = await login;
  assert.equal(result.response.status, 401);
  assert.equal(result.result.error.code, 'SESSION_EXPIRED');
  assert.equal(result.response.headers.get('set-cookie'), null);
  assert.equal((await f.request('/api/state')).result.authenticated, false);
});
test('upstream redirects are not followed and errors never expose application secrets', async () => {
  let calls = 0;
  const client = new ApiClient(fixtureConfig, { transport: async () => { calls++; return new Response('', { status: 302, headers: { Location: 'https://evil.invalid/' } }); } });
  await assert.rejects(client.signIn('fixture-user', 'fixture-password'), { code: 'UPSTREAM_REDIRECT' });
  assert.equal(calls, 1);
  assert.throws(() => upstreamUrl('https://evil.invalid/', 'auth/signin'), { code: 'SERVICE_NOT_READY' });
  await assert.rejects(client.request({ path: 'auth/delete_user', auth: 'application' }), { code: 'APPLICATION_AUTH_SCOPE' });
  assert.deepEqual(publicData({ token: 'fake', nested: { accessToken: 'fake', title: 'Hello' } }), { token: '[REDACTED]', nested: { accessToken: '[REDACTED]', title: 'Hello' } });
});
test('refresh is exact normal old-token authorization, single-flight, server tokens stay private', async () => {
  let calls = 0;
  const client = new ApiClient(fixtureConfig, { transport: async (url, init) => {
    calls++; assert.equal(url.pathname, '/auth/refresh_token'); assert.equal(init.headers.Authorization, 'AtrBpn fixture-access-value');
    assert.equal(init.body.get('refreshToken'), 'fixture-refresh-value'); return jsonResponse({ data: token });
  } });
  const session = { active: true, user, tokens: { ...token, expiredAt: 1 } };
  await Promise.all([client.ensureFresh(session), client.ensureFresh(session)]);
  assert.equal(calls, 1); assert.equal(session.tokens.expiredAt, token.expiredAt);
});
test('sessions expire in memory, invalid artifact configuration fails closed', async () => {
  let now = 1000; const store = new SessionStore({ now: () => now, idleMs: 10 }); const session = store.create(); session.tokens = token; now += 11;
  assert.equal(store.get(session.id), null); assert.equal(session.tokens, null);
  const config = await loadConfiguration('/path/that/does/not/exist'); assert.equal(config.configured, false); assert.equal(config.applicationAuthorization(), null);
});
test('rejection diagnostics preserve safe code/message but remove echoed password and authorization', async () => {
  const client = new ApiClient(fixtureConfig, { transport: async () => new Response(JSON.stringify({ code: 'CLIENT_VERSION_REJECTED', message: 'Update needed. Echo fixture-password fixture-application-value fixture-access-value fixture-refresh-value', stack: 'internal stack', headers: { Authorization: 'sensitive' } }), { status: 403, headers: { 'Content-Type': 'application/json' } }) });
  await assert.rejects(client.request({ path: 'account/example', auth: 'session', session: { tokens: token }, body: { password: 'fixture-password' } }), error => {
    assert.equal(error.details.code, 'CLIENT_VERSION_REJECTED');
    assert.match(error.details.message, /Update needed/);
    for (const secret of ['fixture-password', 'fixture-application-value', 'fixture-access-value', 'fixture-refresh-value', 'internal stack', 'sensitive']) assert.ok(!JSON.stringify(error.details).includes(secret));
    assert.deepEqual(Object.keys(error.details).sort(), ['code','elapsedMs','message','networkCode','requestId','stage','upstreamStatus']); return true;
  });
  const htmlClient = new ApiClient(fixtureConfig, { transport: async () => new Response(JSON.stringify({ message: '<html>secret diagnostic</html>' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) });
  await assert.rejects(htmlClient.signIn('fixture-user', 'fixture-password'), error => { assert.equal(error.details.message, undefined); return true; });
});

test('protected upstream 401 expires authentication and existing downloads without rotating the browser cookie', async t => {
  const f = await fixture(t, url => url.pathname === '/apis/GetDocument'
    ? new Response(documentBytes(), { headers: { 'Content-Type': 'application/pdf' } })
    : Response.json({ message: 'fixture-access-value no longer valid' }, { status: 401 }));
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const previousCookie = f.cookie;
  const document = await f.request('/api/execute', { operationId: 'post-apis-getdocument-d41ee8', values: { q: 'fixture-code', name: 'fixture-document' } });
  const rejected = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(rejected.response.status, 401);
  assert.equal(rejected.result.error.code, 'SESSION_EXPIRED');
  assert.equal(rejected.result.error.details.upstreamStatus, 401);
  assert.ok(!JSON.stringify(rejected.result).includes(token.accessToken));
  assert.equal(rejected.response.headers.get('set-cookie'), null);
  assert.equal(f.cookie, previousCookie);
  const state = await f.request('/api/state');
  assert.equal(state.result.authenticated, false); assert.equal(state.result.user, null);
  assert.equal((await fetch(f.base + document.result.result.downloadUrl, { headers: { Cookie: previousCookie } })).status, 404);
  const calls = f.calls.length;
  assert.equal((await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} })).response.status, 401);
  assert.equal(f.calls.length, calls, 'An expired session never retries the protected operation upstream');
});

test('protected upstream 403 preserves authentication and downloads as a permission rejection', async t => {
  const f = await fixture(t, url => url.pathname === '/apis/GetDocument'
    ? new Response(documentBytes(), { headers: { 'Content-Type': 'application/pdf' } })
    : Response.json({ message: 'Permission denied' }, { status: 403 }));
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const document = await f.request('/api/execute', { operationId: 'post-apis-getdocument-d41ee8', values: { q: 'fixture-code', name: 'fixture-document' } });
  const rejected = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(rejected.response.status, 403); assert.equal(rejected.result.error.code, 'UPSTREAM_REJECTED');
  assert.equal((await f.request('/api/state')).result.authenticated, true);
  assert.equal((await fetch(f.base + document.result.result.downloadUrl, { headers: { Cookie: f.cookie } })).status, 200);
});

test('401 invalidation follows the transmitted auth mode, including malformed response bodies', async () => {
  for (const auth of ['session', 'optionalSession', 'refresh']) {
    for (const body of ['<html>denied</html>', '{bad JSON']) {
      const session = { active: true, user, tokens: { ...token }, downloads: new Map([['fixture-download', {}]]) };
      const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response(body, { status: 401, headers: { 'Content-Type': 'application/json' } }) });
      await assert.rejects(client.request({ path: auth === 'refresh' ? 'auth/refresh_token' : 'account/fixture', auth, session }), { status: 401, code: 'SESSION_EXPIRED' });
      assert.equal(session.tokens, null); assert.equal(session.user, null); assert.equal(session.downloads.size, 0);
    }
  }
  const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => Response.json({ message: 'Rejected' }, { status: 401 }) });
  await assert.rejects(client.request({ path: 'banner', auth: 'optionalSession', session: { active: true, tokens: null } }), { status: 401, code: 'UPSTREAM_REJECTED' });
  await assert.rejects(client.signIn(user.username, 'fixture-password'), { status: 401, code: 'UPSTREAM_REJECTED' });
});

test('protected 401 remains a session failure even when reading its body fails', async () => {
  const session = { active: true, user, tokens: { ...token }, downloads: new Map([['fixture-download', {}]]) };
  const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('fixture body failure')); } }), { status: 401 }) });
  await assert.rejects(client.request({ path: 'account/fixture', auth: 'session', session }), error => {
    assert.equal(error.code, 'SESSION_EXPIRED'); assert.equal(error.status, 401); assert.equal(error.details.upstreamStatus, 401); return true;
  });
  assert.equal(session.tokens, null); assert.equal(session.user, null); assert.equal(session.downloads.size, 0);
});

test('expired credentials without a refresh token clear private state before protected transport', async t => {
  const f = await fixture(t);
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const session = [...f.sessions.sessions.values()][0];
  session.tokens.expiredAt = 1; session.tokens.refreshToken = null; session.downloads.set('fixture-download', {});
  const rejected = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(rejected.result.error.code, 'SESSION_EXPIRED');
  assert.equal(session.user, null); assert.equal(session.tokens, null); assert.equal(session.downloads.size, 0);
  assert.equal((await f.request('/api/state')).result.authenticated, false);
  assert.equal(f.calls.length, 1, 'Only mocked login reaches transport');
});

test('refresh 401 clears the session and never forwards the protected operation', async t => {
  const f = await fixture(t, () => Response.json({ message: 'Refresh rejected' }, { status: 401 }));
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const session = [...f.sessions.sessions.values()][0]; session.tokens.expiredAt = 1; session.downloads.set('fixture-download', {});
  const rejected = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(rejected.result.error.code, 'SESSION_EXPIRED');
  assert.equal(session.user, null); assert.equal(session.tokens, null); assert.equal(session.downloads.size, 0);
  assert.deepEqual(f.calls.map(call => new URL(call.url).pathname), ['/auth/signin', '/auth/refresh_token']);
});

test('a transient refresh failure keeps the session recoverable and blocks protected forwarding until refresh succeeds', async t => {
  let refreshCalls = 0;
  const f = await fixture(t, url => {
    if (url.pathname === '/auth/refresh_token') {
      if (++refreshCalls === 1) throw Object.assign(new Error('fixture transient connection error'), { code: 'ECONNRESET' });
      return jsonResponse({ data: { ...token, accessToken: 'fixture-renewed-token' } });
    }
    return jsonResponse({ data: { status: 'fixture recovered' } });
  });
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const session = [...f.sessions.sessions.values()][0]; session.tokens.expiredAt = 1; session.downloads.set('fixture-download', {});
  const rejected = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(rejected.result.error.code, 'UPSTREAM_UNREACHABLE');
  assert.equal((await f.request('/api/state')).result.authenticated, true);
  assert.equal(session.downloads.size, 1); assert.equal(f.calls.length, 2);
  const recovered = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  assert.equal(recovered.response.status, 200); assert.equal(refreshCalls, 2);
  assert.equal(f.calls.at(-1).headers.Authorization, 'Bearer fixture-renewed-token');
  assert.equal(f.calls.length, 4);
});

test('delayed JSON, ordinary document and SPS preview responses cannot return or populate downloads after logout and relogin', async t => {
  for (const kind of ['application/json', 'application/pdf', 'sps-viewer']) {
    const contentType = kind === 'sps-viewer' ? 'application/pdf' : kind;
    let started; const start = new Promise(resolve => { started = resolve; });
    let release; const pending = new Promise(resolve => { release = resolve; });
    const f = await fixture(t, async () => { started(); await pending; return new Response(contentType === 'application/json' ? JSON.stringify({ data: { private: 'fixture-old-session-data' } }) : '%PDF-fixture-old-session-data'.padEnd(256, ' '), { headers: { 'Content-Type': contentType } }); });
    await f.request('/api/login', { username: user.username, password: 'fixture-password' });
    const oldSession = [...f.sessions.sessions.values()][0];
    const request = f.request('/api/execute', kind === 'sps-viewer' ? { operationId: spsOperation, values: spsValues } : kind === 'application/pdf' ? {operationId: documentOperation, values: {q: 'fixture-code', name: ''}} : { operationId: 'post-account-account-summary-d2939c', values: {} });
    await start;
    await f.request('/api/logout', {});
    await f.request('/api/login', { username: user.username, password: 'fixture-password' });
    release();
    const result = await request;
    assert.equal(result.response.status, 401); assert.equal(result.result.error.code, 'SESSION_EXPIRED');
    assert.equal(result.response.headers.get('set-cookie'), null);
    assert.ok(!JSON.stringify(result.result).includes('fixture-old-session-data'));
    assert.equal(oldSession.downloads.size, 0);
    const current = [...f.sessions.sessions.values()][0];
    assert.equal(current.downloads.size, 0); assert.notEqual(current, oldSession);
    assert.equal((await f.request('/api/state')).result.authenticated, true);
  }
});

test('a delayed 401 cannot clear a newer login or expose the old token in diagnostic text', async t => {
  let started; const start = new Promise(resolve => { started = resolve; });
  let release; const pending = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, async () => { started(); await pending; return Response.json({ message: `Rejected ${token.accessToken} ${token.refreshToken}` }, { status: 401 }); });
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const request = f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  await start; await f.request('/api/logout', {}); await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const current = [...f.sessions.sessions.values()][0]; const currentTokens = current.tokens;
  release();
  const result = await request;
  assert.equal(result.result.error.code, 'SESSION_EXPIRED'); assert.equal(result.response.headers.get('set-cookie'), null);
  assert.equal(current.tokens, currentTokens); assert.equal((await f.request('/api/state')).result.authenticated, true);
  for (const secret of [token.accessToken, token.refreshToken]) assert.ok(!JSON.stringify(result.result).includes(secret));
});

test('a stale request 401 preserves tokens renewed by a concurrent refresh', async () => {
  let started; const start = new Promise(resolve => { started = resolve; });
  let release; const pending = new Promise(resolve => { release = resolve; });
  const session = { active: true, user, tokens: { ...token, expiredAt: 1 }, downloads: new Map([['fixture-download', {}]]) };
  const client = new ApiClient(fixtureConfig, { log: () => {}, transport: async url => {
    if (url.pathname === '/auth/refresh_token') return jsonResponse({ data: { ...token, accessToken: 'fixture-renewed-token' } });
    started(); await pending;
    return Response.json({ message: `Rejected ${token.accessToken}` }, { status: 401 });
  } });
  const request = client.request({ path: 'account/fixture', auth: 'session', session });
  await start; await client.ensureFresh(session); release();
  await assert.rejects(request, error => {
    assert.equal(error.code, 'SESSION_CHANGED'); assert.equal(error.status, 409);
    assert.ok(!JSON.stringify(error.details).includes(token.accessToken)); return true;
  });
  assert.equal(session.tokens.accessToken, 'fixture-renewed-token'); assert.equal(session.user, user); assert.equal(session.downloads.size, 1);
});

test('a successful response delayed by concurrent refresh redacts both original and renewed credentials', async t => {
  let started; const start = new Promise(resolve => { started = resolve; });
  let release; const pending = new Promise(resolve => { release = resolve; });
  const renewed = { ...token, accessToken: 'fixture-new-access-secret', refreshToken: 'fixture-new-refresh-secret' };
  let reads = 0;
  const f = await fixture(t, async url => {
    if (url.pathname === '/auth/refresh_token') return jsonResponse({ data: renewed });
    if (++reads === 1) {
      started(); await pending;
      return jsonResponse({ data: { message: `Echo ${token.accessToken} ${token.refreshToken} ${renewed.accessToken} ${renewed.refreshToken}` } });
    }
    return jsonResponse({ data: [] });
  });
  await f.request('/api/login', { username: user.username, password: 'fixture-password' });
  const session = [...f.sessions.sessions.values()][0];
  const delayed = f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  await start; session.tokens.expiredAt = 1;
  const refreshed = await f.request('/api/execute', { operationId: 'post-account-account-summary-d2939c', values: {} });
  release(); const result = await delayed;
  assert.equal(refreshed.response.status, 200); assert.equal(result.response.status, 200);
  assert.equal(result.result.result.data.data.message, 'Echo [REDACTED] [REDACTED] [REDACTED] [REDACTED]');
  assert.equal(session.tokens.accessToken, renewed.accessToken);
  assert.equal((await f.request('/api/state')).result.authenticated, true);
  assert.deepEqual(f.calls.map(call => new URL(call.url).pathname), ['/auth/signin', '/account/account_summary', '/auth/refresh_token', '/account/account_summary']);
});
