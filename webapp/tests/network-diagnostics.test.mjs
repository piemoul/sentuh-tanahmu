import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';

const configuration = { configured: true, applicationAuthorization: () => 'AtrBpn secret-application-fixture' };
const privateText = 'secret-password-fixture secret-username-fixture secret-access-fixture secret-query-fixture secret-application-fixture';
const session = { tokens: { tokenType: 'Bearer', accessToken: 'secret-access-fixture' } };
const options = { path: 'account/fixture', auth: 'session', session, query: { private: 'secret-query-fixture' }, body: { username: 'secret-username-fixture', password: 'secret-password-fixture' } };
const logKeys = ['elapsedMs','event','hostname','networkCode','path','requestId','stage','status'];

for (const [code, stage, message] of [
  ['ENOTFOUND', 'dns', /DNS/],
  ['EAI_AGAIN', 'dns', /DNS/],
  ['ECONNREFUSED', 'tcp', /TCP/],
  ['UND_ERR_CONNECT_TIMEOUT', 'tcp', /batas waktu/],
  ['SELF_SIGNED_CERT_IN_CHAIN', 'tls', /TLS/],
  ['CERT_HAS_EXPIRED', 'tls', /TLS/],
  ['ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC', 'tls', /TLS/],
  ['ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED', 'tls', /TLS/],
  ['INVALID_CA', 'tls', /TLS/],
  ['UND_ERR_HEADERS_TIMEOUT', 'response_headers', /header/],
]) test(`transport diagnostics classify ${code} without logging credentials or raw causes`, async () => {
  const logs = []; let time = 100;
  const cause = Object.assign(new Error(privateText), { code, password: privateText, headers: { Authorization: privateText } });
  const client = new ApiClient(configuration, { clock: () => time, log: entry => logs.push(entry), transport: async () => { time = 147; throw new TypeError(privateText, { cause }); } });
  await assert.rejects(client.request(options), error => {
    assert.equal(error.code, 'UPSTREAM_UNREACHABLE'); assert.match(error.message, message);
    assert.equal(error.details.stage, stage); assert.equal(error.details.networkCode, code); assert.equal(error.details.elapsedMs, 47);
    assert.match(error.details.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(logs[0].requestId, error.details.requestId);
    assert.ok(!JSON.stringify(error).includes('secret-')); return true;
  });
  assert.equal(logs.length, 1); assert.deepEqual(Object.keys(logs[0]).sort(), logKeys);
  assert.equal(logs[0].event, 'upstream_fail'); assert.equal(logs[0].status, null);
  assert.equal(logs[0].hostname, 'sentuh.atrbpn.go.id'); assert.equal(logs[0].path, '/account/fixture');
  assert.ok(!JSON.stringify(logs).includes('secret-')); assert.ok(!JSON.stringify(logs).includes('?'));
});

test('unknown error code and raw stack are discarded; total timeout does not invent a network phase', async () => {
  const logs = [];
  const unknown = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => { throw Object.assign(new Error(privateText), { code: privateText }); } });
  await assert.rejects(unknown.request(options), error => { assert.equal(error.details.networkCode, 'NETWORK_ERROR'); assert.equal(error.details.stage, 'request'); return true; });
  const timeout = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => { throw new DOMException(privateText, 'TimeoutError'); } });
  await assert.rejects(timeout.request(options), error => { assert.equal(error.details.networkCode, 'REQUEST_TIMEOUT'); assert.equal(error.details.stage, 'request'); assert.match(error.message, /belum diketahui/); return true; });
  assert.ok(!JSON.stringify(logs).includes('secret-'));
});

test('body timeout retains received HTTP status and reports response-body phase', async () => {
  const logs = [];
  const client = new ApiClient(configuration, { log: entry => logs.push(entry), transport: async () => new Response(new ReadableStream({ start(controller) { controller.error(Object.assign(new Error(privateText), { code: 'UND_ERR_BODY_TIMEOUT' })); } }), { status: 200 }) });
  await assert.rejects(client.request(options), error => { assert.equal(error.details.networkCode, 'UND_ERR_BODY_TIMEOUT'); assert.equal(error.details.stage, 'response_body'); return true; });
  assert.equal(logs[0].status, 200); assert.equal(logs[0].event, 'upstream_fail');
  assert.ok(!JSON.stringify(logs).includes('secret-'));
});

test('successful transport logs one safe finish without response body; logging failures do not fail requests', async () => {
  const logs = [];
  const transport = async () => new Response(JSON.stringify({ data: privateText }), { headers: { 'Content-Type': 'application/json' } });
  const client = new ApiClient(configuration, { log: entry => logs.push(entry), transport });
  assert.equal((await client.request(options)).status, 200);
  assert.equal(logs.length, 1); assert.equal(logs[0].event, 'upstream_finish'); assert.equal(logs[0].networkCode, null); assert.equal(logs[0].status, 200);
  assert.ok(!JSON.stringify(logs).includes('secret-'));
  const brokenLogger = new ApiClient(configuration, { log: () => { throw new Error('logger unavailable'); }, transport });
  assert.equal((await brokenLogger.request(options)).status, 200);
});
