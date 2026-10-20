import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { gzipSync, deflateSync, brotliCompressSync } from 'node:zlib';
import { createHttpsTransport, createQueueHttpsTransport } from '../private/https-transport.mjs';

function harness(responder) {
  const calls = [];
  const request = (url, options, callback) => {
    const outgoing = new EventEmitter(); outgoing.destroyed = false;
    outgoing.destroy = error => {
      if (outgoing.destroyed) return;
      outgoing.destroyed = true;
      if (error) queueMicrotask(() => outgoing.emit('error', error));
    };
    outgoing.end = body => {
      const call = { url, options, body, outgoing }; calls.push(call);
      queueMicrotask(() => responder(call, (status = 200, headers = {}, body = Buffer.from('ok')) => {
        const response = new PassThrough(); response.statusCode = status; response.headers = headers; call.incoming = response;
        callback(response);
        if (body !== null) queueMicrotask(() => response.end(body));
        return response;
      }));
    };
    return outgoing;
  };
  return { calls, request };
}

test('application TLS context is scoped to exact main origin; verification and hostname remain strict', async () => {
  const lookedUp = []; const secureContext = { private: 'fixture context only' };
  const fixture = harness((_call, respond) => respond());
  const transport = createHttpsTransport({ tlsOptions: origin => { lookedUp.push(origin); return { secureContext, rejectUnauthorized: false, checkServerIdentity: () => undefined }; } }, fixture);
  for (const url of ['https://sentuh.atrbpn.go.id/auth/signin', 'https://sentuh.atrbpn.go.id:443/common/provinsi', 'https://antre.atrbpn.go.id/be/api/fixture', 'https://sentuh.atrbpn.go.id:444/fixture']) await (await transport(url)).arrayBuffer();
  assert.deepEqual(lookedUp, ['https://sentuh.atrbpn.go.id', 'https://sentuh.atrbpn.go.id']);
  for (const [index, call] of fixture.calls.entries()) {
    assert.equal(call.options.rejectUnauthorized, true); assert.equal(call.options.agent, false);
    assert.equal(call.options.checkServerIdentity, undefined); assert.equal(call.options.servername, call.url.hostname);
    assert.equal(call.options.secureContext, index < 2 ? secureContext : undefined);
  }
  await assert.rejects(transport('http://sentuh.atrbpn.go.id/'), { code: 'INVALID_TRANSPORT_URL' });
});

test('queue TLS profile selects only its exact audience and cannot alter certificate checks', async () => {
  const lookedUp=[]; const context={private:'queue fixture only'};
  const fixture=harness((_call,respond)=>respond());
  const configuration={tlsOptions:()=>{throw Error('Main identity must not be requested');},queueTlsOptions:origin=>{lookedUp.push(origin);return {secureContext:context,rejectUnauthorized:false,checkServerIdentity:()=>undefined};}};
  const transport=createQueueHttpsTransport(configuration,fixture);
  for(const url of ['https://aplikasi.atrbpn.go.id/konsol/antrian/directus/api/antrian/saya','https://aplikasi.atrbpn.go.id:443/fixture','https://aplikasi.atrbpn.go.id:444/fixture','https://sentuh.atrbpn.go.id/fixture','https://aplikasi.atrbpn.go.id.evil.invalid/fixture'])await(await transport(url)).arrayBuffer();
  assert.deepEqual(lookedUp,['https://aplikasi.atrbpn.go.id','https://aplikasi.atrbpn.go.id']);
  for(const [index,call] of fixture.calls.entries()){assert.equal(call.options.secureContext,index<2?context:undefined);assert.equal(call.options.rejectUnauthorized,true);assert.equal(call.options.checkServerIdentity,undefined);assert.equal(call.options.servername,call.url.hostname);}
  const main=createHttpsTransport(configuration,fixture);await(await main('https://aplikasi.atrbpn.go.id/fixture')).arrayBuffer();assert.equal(fixture.calls.at(-1).options.secureContext,undefined);
});

test('FormData uses matching multipart boundary and exact file/form bytes without npm', async () => {
  const fixture = harness((_call, respond) => respond());
  const form = new FormData(); form.set('Lat', '-6.123456789'); form.set('IsOffline', 'false');
  const file = new Uint8Array([137,80,78,71,13,10,26,10,0,255]);
  form.set('file', new Blob([file], { type: 'image/png' }), 'survey.png');
  const transport = createHttpsTransport({}, fixture);
  await (await transport('https://sentuh.atrbpn.go.id/geotag/UploadGeotag', { method: 'POST', body: form })).arrayBuffer();
  const call = fixture.calls[0];
  assert.match(call.options.headers['content-type'], /^multipart\/form-data; boundary=/);
  assert.equal(Number(call.options.headers['content-length']), call.body.length);
  assert.equal(call.options.headers['accept-encoding'], 'identity');
  const decoded = await new Request('http://local.invalid', { method: 'POST', headers: call.options.headers, body: call.body }).formData();
  assert.equal(decoded.get('Lat'), '-6.123456789'); assert.equal(decoded.get('IsOffline'), 'false');
  assert.equal(decoded.get('file').name, 'survey.png'); assert.deepEqual(new Uint8Array(await decoded.get('file').arrayBuffer()), file);
});

test('form encoding remains exact and request byte limit fails before network request', async () => {
  const fixture = harness((_call, respond) => respond());
  const transport = createHttpsTransport({}, { ...fixture, maxRequestBytes: 40 });
  await (await transport('https://sentuh.atrbpn.go.id/fixture', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ a: 'a b+é' }) })).arrayBuffer();
  assert.equal(fixture.calls[0].body.toString(), 'a=a+b%2B%C3%A9');
  await assert.rejects(transport('https://sentuh.atrbpn.go.id/fixture', { method: 'POST', body: 'x'.repeat(41) }), { code: 'REQUEST_BODY_TOO_LARGE' });
  assert.equal(fixture.calls.length, 1);
});

for (const [encoding, encode] of [['gzip', gzipSync], ['deflate', deflateSync], ['br', brotliCompressSync]]) test(`compressed ${encoding} response is decoded even when identity requested`, async () => {
  const bytes = encode(Buffer.from('{"data":"fixture"}'));
  const fixture = harness((_call, respond) => respond(200, { 'content-type': 'application/json', 'content-encoding': encoding, 'content-length': String(bytes.length) }, bytes));
  const response = await createHttpsTransport({}, fixture)('https://sentuh.atrbpn.go.id/fixture');
  assert.deepEqual(await response.json(), { data: 'fixture' });
  assert.equal(response.headers.has('content-encoding'), false); assert.equal(response.headers.has('content-length'), false);
});

test('redirect remains a single response; cancellation tears down incoming stream', async () => {
  const fixture = harness((_call, respond) => respond(302, { location: 'https://elsewhere.invalid' }, null));
  const response = await createHttpsTransport({}, fixture)('https://sentuh.atrbpn.go.id/fixture');
  assert.equal(response.status, 302); assert.equal(fixture.calls.length, 1);
  await response.body.cancel();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.calls[0].incoming.destroyed, true);
});

test('absolute deadline covers response body, not only receipt of headers', async () => {
  const fixture = harness((_call, respond) => respond(200, {}, null));
  const response = await createHttpsTransport({}, { ...fixture, timeoutMs: 25 })('https://sentuh.atrbpn.go.id/fixture');
  // A real socket keeps the event loop alive; the injected stream does not.
  const keepAlive = setTimeout(() => {}, 1000);
  try { await assert.rejects(response.arrayBuffer(), { code: 'REQUEST_TIMEOUT' }); }
  finally { clearTimeout(keepAlive); }
  assert.equal(fixture.calls[0].outgoing.destroyed, true); assert.equal(fixture.calls[0].incoming.destroyed, true);
});

test('caller abort after headers cancels the stream and native request', async () => {
  const fixture = harness((_call, respond) => respond(200, {}, null)); const controller = new AbortController();
  const response = await createHttpsTransport({}, fixture)('https://sentuh.atrbpn.go.id/fixture', { signal: controller.signal });
  controller.abort(Object.assign(new Error('fixture cancellation'), { code: 'REQUEST_ABORTED' }));
  await assert.rejects(response.arrayBuffer(), { code: 'REQUEST_ABORTED' });
  assert.equal(fixture.calls[0].outgoing.destroyed, true);
});

test('received body errors propagate without being converted to a successful truncated response', async () => {
  const fixture = harness((_call, respond) => { const response = respond(200, {}, null); setImmediate(() => response.destroy(Object.assign(new Error('fixture socket error'), { code: 'ECONNRESET' }))); });
  const response = await createHttpsTransport({}, fixture)('https://sentuh.atrbpn.go.id/fixture');
  await assert.rejects(response.arrayBuffer(), { code: 'ECONNRESET' });
});

test('late HEAD stream and request errors are handled after the bodyless response resolves', async () => {
  const fixture = harness((_call, respond) => respond(200, {}, null));
  const transport = createHttpsTransport({}, fixture);
  for (const source of ['incoming', 'outgoing']) {
    const response = await transport('https://sentuh.atrbpn.go.id/fixture', { method: 'HEAD' });
    assert.equal(response.status, 200); assert.equal(response.body, null);
    const call = fixture.calls.at(-1);
    call[source].destroy(Object.assign(new Error('fixture late HEAD reset'), { code: 'ECONNRESET' }));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(call.incoming.destroyed, true);
  }
});
