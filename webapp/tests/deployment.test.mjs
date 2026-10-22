import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.mjs';
import { publicOrigin, browserRequestOrigin } from '../private/browser-origin.mjs';

const config = { configured: false, origin: 'https://sentuh.atrbpn.go.id/', reason: 'local test only', applicationAuthorization: () => null };
test('public origin accepts only an explicit HTTPS origin', () => {
  assert.equal(publicOrigin('https://fixture.example.invalid/'), 'https://fixture.example.invalid');
  assert.equal(publicOrigin(''), '');
  for (const value of ['http://fixture.example.invalid', 'https://user:pass@fixture.example.invalid', 'https://fixture.example.invalid/path', 'https://fixture.example.invalid/?x=1', 'https://fixture.example.invalid/#part', 'not an origin']) assert.throws(() => publicOrigin(value));
});

test('browser origin resolution accepts only the configured public host and exact bound local hosts', () => {
  const origin = 'https://sentuh.davay.space';
  assert.equal(browserRequestOrigin('sentuh.davay.space', 4173, origin), origin);
  assert.equal(browserRequestOrigin('localhost:4173', 4173, origin), 'http://localhost:4173');
  assert.equal(browserRequestOrigin('127.0.0.1:4173', 4173, origin), 'http://127.0.0.1:4173');
  assert.equal(browserRequestOrigin('localhost:4173', 4173), 'http://localhost:4173');
  for (const host of [undefined, 'sentuh.davay.space.evil.invalid', 'sentuh.davay.space:444', 'localhost', 'localhost:4174', '127.0.0.1:4174', 'host.docker.internal:4173', 'evil.invalid']) assert.equal(browserRequestOrigin(host, 4173, origin), '');
  assert.equal(browserRequestOrigin('sentuh.davay.space', 4173), '');
});

test('configured HTTPS host uses Secure cookie and exact origin; proxy headers confer no trust', async t => {
  const origin = 'https://fixture.example.invalid';
  let upstream = 0;
  const server = createServer({ publicOrigin: origin, configuration: config, transport: async () => { upstream++; throw new Error('No upstream allowed'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  // Node fetch normalizes Host. Use raw local HTTP to simulate a reverse proxy.
  const proxyRequest = (route, options = {}) => new Promise((resolve, reject) => {
    const request = http.request(base + route, options, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: response.statusCode, headers: response.headers })));
    });
    request.on('error', reject); request.end(options.body);
  });
  assert.equal((await fetch(base + '/health')).status, 200);
  assert.equal((await proxyRequest('/api/state', { headers: { Host: 'evil.invalid', 'X-Forwarded-Host': 'fixture.example.invalid', 'X-Forwarded-Proto': 'https', Forwarded: 'host=fixture.example.invalid;proto=https' } })).status, 403);
  const stateResponse = await proxyRequest('/api/state', { headers: { Host: 'fixture.example.invalid' } });
  assert.equal(stateResponse.status, 200);
  const csp = stateResponse.headers.get('content-security-policy');
  assert.deepEqual(csp.split(';').map(value=>value.trim()).filter(value=>value.startsWith('img-src ')),["img-src 'self' data: blob: https://www.atrbpn.go.id https://sentuh.atrbpn.go.id https://i.ytimg.com https://img.youtube.com https://tile.openstreetmap.org"]);
  assert.deepEqual(csp.split(';').map(value=>value.trim()).filter(value=>value.startsWith('frame-src ')),['frame-src https://www.youtube-nocookie.com']);
  assert.match(csp, /(?:^|; )script-src 'self';/);
  assert.match(csp, /(?:^|; )connect-src 'self';/);
  assert.match(stateResponse.headers.get('set-cookie'), /; Secure$/);
  assert.ok(!/;\s*Domain=/i.test(stateResponse.headers.get('set-cookie')));
  const cookie = stateResponse.headers.get('set-cookie').split(';')[0];
  const state = await stateResponse.json();
  const headers = { Host: 'fixture.example.invalid', Cookie: cookie, 'X-CSRF-Token': state.csrfToken, 'Content-Type': 'application/json' };
  assert.equal((await proxyRequest('/api/logout', { method: 'POST', headers: { ...headers, Origin: 'http://fixture.example.invalid', 'X-Forwarded-Proto': 'https' }, body: '{}' })).status, 403);
  const logout = await proxyRequest('/api/logout', { method: 'POST', headers: { ...headers, Origin: origin }, body: '{}' });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /; Secure$/);
  assert.equal(upstream, 0);
});

test('public and local browser sessions retain exact origins, cookie flags and separate audiences', async t => {
  const origin = 'https://sentuh.davay.space';
  let upstream = 0;
  const server = createServer({ publicOrigin: origin, configuration: config, transport: async () => { upstream++; throw new Error('No upstream allowed'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const request = (host, route, options = {}) => new Promise((resolve, reject) => {
    const req = http.request(base + route, { ...options, headers: { ...options.headers, Host: host } }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })));
    });
    req.on('error', reject); req.end(options.body);
  });
  const publicHost = 'sentuh.davay.space';
  const localHost = `localhost:${port}`;
  const localOrigin = `http://${localHost}`;
  const forwarded = { 'X-Forwarded-Host': publicHost, 'X-Forwarded-Proto': 'https', Forwarded: `host=${publicHost};proto=https`, 'CF-Visitor': '{"scheme":"https"}' };
  for (const host of [publicHost, localHost, `127.0.0.1:${port}`]) assert.equal((await request(host, '/')).status, 200);
  for (const host of [`localhost:${port + 1}`, `127.0.0.1:${port + 1}`, 'sentuh.davay.space.evil.invalid', 'host.docker.internal:4173']) assert.equal((await request(host, '/api/state', { headers: forwarded })).status, 403);

  const publicResponse = await request(publicHost, '/api/state', { headers: { 'X-Forwarded-Host': localHost, 'X-Forwarded-Proto': 'http' } });
  assert.equal(publicResponse.status, 200);
  const publicCookieHeader = publicResponse.headers.get('set-cookie');
  assert.match(publicCookieHeader, /; Secure$/);
  assert.match(publicCookieHeader, /; HttpOnly; SameSite=Strict;/);
  assert.ok(!/;\s*Domain=/i.test(publicCookieHeader));
  const publicCookie = publicCookieHeader.split(';')[0];
  const publicState = await publicResponse.json();

  const localResponse = await request(localHost, '/api/state', { headers: forwarded });
  assert.equal(localResponse.status, 200);
  const localCookieHeader = localResponse.headers.get('set-cookie');
  assert.ok(!/;\s*Secure(?:;|$)/i.test(localCookieHeader));
  assert.match(localCookieHeader, /; HttpOnly; SameSite=Strict;/);
  assert.ok(!/;\s*Domain=/i.test(localCookieHeader));
  const localCookie = localCookieHeader.split(';')[0];
  const localState = await localResponse.json();
  assert.notEqual(localCookie, publicCookie);
  const post = (host, browserOrigin, cookie, csrfToken) => request(host, '/api/logout', { method: 'POST', headers: { ...forwarded, Cookie: cookie, Origin: browserOrigin, 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal((await post(localHost, origin, localCookie, localState.csrfToken)).status, 403);
  assert.equal((await post(publicHost, localOrigin, publicCookie, publicState.csrfToken)).status, 403);
  assert.equal((await post(publicHost, 'http://sentuh.davay.space', publicCookie, publicState.csrfToken)).status, 403);
  assert.equal((await request(localHost, '/api/state', { headers: { Cookie: publicCookie } })).status, 403);
  assert.equal((await request(publicHost, '/api/state', { headers: { Cookie: localCookie } })).status, 403);
  assert.equal((await request(`127.0.0.1:${port}`, '/api/state', { headers: { Cookie: localCookie } })).status, 403);
  assert.equal((await post(publicHost, origin, publicCookie, localState.csrfToken)).status, 403);

  const localLogout = await post(localHost, localOrigin, localCookie, localState.csrfToken);
  assert.equal(localLogout.status, 200);
  assert.ok(!/;\s*Secure(?:;|$)/i.test(localLogout.headers.get('set-cookie')));
  const publicLogout = await post(publicHost, origin, publicCookie, publicState.csrfToken);
  assert.equal(publicLogout.status, 200);
  assert.match(publicLogout.headers.get('set-cookie'), /; Secure$/);
  const rotatedCookie = publicLogout.headers.get('set-cookie').split(';')[0];
  assert.equal((await request(localHost, '/api/state', { headers: { Cookie: rotatedCookie } })).status, 403);
  assert.equal(upstream, 0);
});
