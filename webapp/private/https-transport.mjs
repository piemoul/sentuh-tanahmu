import https from 'node:https';
import { Readable, PassThrough, pipeline } from 'node:stream';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import { MAIN_ORIGIN } from './configuration.mjs';

const mainOrigin = new URL(MAIN_ORIGIN).origin;
const MAX_REQUEST_BYTES = 25 * 1024 * 1024;
function transportError(code) { return Object.assign(new Error(code), { code }); }

async function serialize(request, signal, limit) {
  if (!request.body) return undefined;
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) return Buffer.concat(chunks, size);
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw transportError('REQUEST_BODY_TOO_LARGE'); }
      chunks.push(value);
    }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

// Per-request HTTPS options keep application trust/client identity away from
// other origins and global agents. Nothing in this module disables TLS checks.
export function createHttpsTransport(configuration, { request = https.request, timeoutMs = 30_000, maxRequestBytes = MAX_REQUEST_BYTES } = {}) {
  return scopedHttpsTransport(configuration, { request, timeoutMs, maxRequestBytes }, mainOrigin, 'tlsOptions');
}

// Separate audited client profile. The default main transport above never gains
// access to queue TLS material, and callers cannot select an arbitrary audience.
export function createQueueHttpsTransport(configuration, { request = https.request, timeoutMs = 30_000, maxRequestBytes = MAX_REQUEST_BYTES } = {}) {
  return scopedHttpsTransport(configuration, { request, timeoutMs, maxRequestBytes }, 'https://aplikasi.atrbpn.go.id', 'queueTlsOptions');
}

function scopedHttpsTransport(configuration, { request, timeoutMs, maxRequestBytes }, tlsOrigin, tlsMethod) {
  return async function httpsTransport(input, init = {}) {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password) throw transportError('INVALID_TRANSPORT_URL');
    const controller = new AbortController();
    const signal = init.signal ? AbortSignal.any([controller.signal, init.signal]) : controller.signal;
    const timer = setTimeout(() => controller.abort(transportError('REQUEST_TIMEOUT')), timeoutMs);
    timer.unref?.();
    let nativeRequest; let incoming; let output;
    const abort = () => {
      const error = signal.reason instanceof Error ? signal.reason : transportError('REQUEST_ABORTED');
      output?.destroy(error); incoming?.destroy(error); nativeRequest?.destroy(error);
    };
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); };
    signal.addEventListener('abort', abort, { once: true });
    try {
      signal.throwIfAborted();
      const normalized = new Request(url, { method: init.method || 'GET', headers: init.headers, ...(init.body === undefined ? {} : { body: init.body, duplex: 'half' }) });
      const bytes = await serialize(normalized, signal, maxRequestBytes);
      const headers = Object.fromEntries(normalized.headers);
      headers['accept-encoding'] = 'identity';
      if (bytes !== undefined) headers['content-length'] = String(bytes.length);
      else delete headers['content-length'];
      const tls = {};
      if (url.origin === tlsOrigin && typeof configuration[tlsMethod] === 'function') {
        const scoped = configuration[tlsMethod](url.origin);
        for (const key of ['secureContext', 'ca', 'pfx', 'passphrase', 'cert', 'key']) if (scoped?.[key] !== undefined) tls[key] = scoped[key];
      }
      signal.throwIfAborted();
      return await new Promise((resolve, reject) => {
        nativeRequest = request(url, { method: normalized.method, headers, ...tls, servername: url.hostname,
          rejectUnauthorized: true, agent: false, signal }, response => {
          incoming = response;
          // HEAD/bodyless responses do not enter pipeline(), so attach an error
          // handler before either branch. Late socket errors must stay handled
          // even after the response promise has already resolved.
          incoming.once('error', error => { output?.destroy(error); cleanup(); reject(error); });
          try {
            const responseHeaders = new Headers();
            for (const [key, value] of Object.entries(response.headers)) {
              if (Array.isArray(value)) for (const item of value) responseHeaders.append(key, item);
              else if (value !== undefined) responseHeaders.set(key, value);
            }
            if (normalized.method === 'HEAD' || [204, 205, 304].includes(response.statusCode)) {
              response.resume(); response.once('end', cleanup); response.once('close', cleanup);
              resolve(new Response(null, { status: response.statusCode, headers: responseHeaders })); return;
            }
            const encodings = (response.headers['content-encoding'] || '').split(',').map(item => item.trim().toLowerCase()).filter(item => item && item !== 'identity');
            if (encodings.length > 3) throw transportError('UNSUPPORTED_CONTENT_ENCODING');
            const decoders = encodings.reverse().map(encoding => {
              if (encoding === 'gzip' || encoding === 'x-gzip') return createGunzip();
              if (encoding === 'deflate') return createInflate();
              if (encoding === 'br') return createBrotliDecompress();
              throw transportError('UNSUPPORTED_CONTENT_ENCODING');
            });
            output = new PassThrough();
            // Pipeline teardown propagates cancellation/body errors to the socket.
            // The ApiClient limits bytes after decompression, not just wire bytes.
            pipeline(response, ...decoders, output, () => { cleanup(); });
            if (decoders.length) { responseHeaders.delete('content-encoding'); responseHeaders.delete('content-length'); }
            resolve(new Response(Readable.toWeb(output), { status: response.statusCode, headers: responseHeaders }));
          } catch (error) { incoming.destroy(); cleanup(); reject(error); }
        });
        nativeRequest.once('error', error => { output?.destroy(error); incoming?.destroy(error); cleanup(); reject(error); });
        nativeRequest.end(bytes);
      });
    } catch (error) { cleanup(); throw error; }
  };
}
