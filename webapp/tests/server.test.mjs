import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.mjs';

const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => new Promise(resolve => server.close(resolve)));

test('health explicitly distinguishes local reconstruction from official backend', async () => {
  const r = await fetch(`${base}/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).officialBackend, false);
});
test('source, raw artifact evidence, and environment files are not public', async () => {
  for (const p of ['/server.mjs', '/package.json', '/analysis/extraction-manifest.json', '/environment/webapp.pid', '/.env']) {
    assert.ok([403, 404].includes((await fetch(base + p)).status), p);
  }
});
test('rejects traversal, malformed URL and mutating requests', async () => {
  for (const p of ['/assets/%2e%2e/%2e%2e/.env', '/assets/%5c..%5c.env', '/assets/%00.png']) {
    const status = await new Promise(resolve => http.get(base + p, r => { r.resume(); resolve(r.statusCode); }));
    assert.ok([403, 404].includes(status), p);
  }
  assert.equal((await fetch(base + '/%', {})).status, 400);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});
test('local browser app and modules have correct response types and isolation', async () => {
  for (const [p, mime] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/domain.js', 'text/javascript'], ['/parcel-map.js', 'text/javascript'], ['/styles.css', 'text/css']]) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
    assert.match(r.headers.get('content-type'), new RegExp(mime));
    assert.match(r.headers.get('content-security-policy'), /connect-src 'self'/);
    assert.ok((await r.text()).length > 0);
  }
  const head = await fetch(base + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
