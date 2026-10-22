import {createHttpsTransport} from './https-transport.mjs';
import {decodeGuestbookJson} from './guestbook-response.mjs';

// Standalone uBb+b, not FRb main/Directus. Static source proves this initial URL
// and TRb.oYi provenance; it does not prove current server acceptance or a visit.
const ENDPOINT = 'https://sentuh.atrbpn.go.id/bukutamu';
const DEFAULT_MAX_BYTES = 256 * 1024;
const ownedErrors = new WeakSet();
// Server-only immutable lookup provenance. Public redaction must never become
// the source of a later native ID; this metadata is not serialized to JSON.
const readLookups = new WeakMap();
export function guestbookLookupFromRead(result, query) {
  const source = readLookups.get(result);
  return source && query && query.uid === source.query.uid && query.unid === source.query.unid
    ? structuredClone(source.lookup) : null;
}
export class GuestbookClientError extends Error {
  constructor(status, code, message, details) {
    super(message); this.name = 'GuestbookClientError';
    this.status = status; this.code = code;
    if (details !== undefined) this.details = details;
  }
}
function failure(status, code, message, details) {
  const error = new GuestbookClientError(status, code, message, details);
  ownedErrors.add(error); return error;
}
const invalidInput = () => failure(400, 'GUESTBOOK_INVALID_INPUT', 'Parameter pembacaan Buku Tamu tidak sesuai kontrak.');
const invalidResponse = () => failure(502, 'GUESTBOOK_RESPONSE_UNRECOGNIZED', 'Respons Buku Tamu belum sesuai format layanan.');
function jsonMime(header) {
  // The frozen native service consumes a transformed Map. The full shared Dio
  // transformer was not re-audited here: this JSON MIME/strict UTF8 guard is an
  // explicit browser adaptation, not a claim of exact SDK MIME behavior.
  if (typeof header !== 'string' || header.length > 256) throw invalidResponse();
  const mime = header.split(';', 1)[0].trim().toLowerCase();
  if (!/^(?:application\/json|text\/json|[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+\+json)$/.test(mime)) throw invalidResponse();
  return mime;
}
function redactEnvelope(envelope, authorization) {
  // Bind redaction to the exact header generation used by this read. A later
  // configuration change must not expose an echoed prior application value.
  const secrets = [authorization, authorization.slice('AtrBpn '.length)];
  const clean = value => typeof value === 'string'
    ? secrets.reduce((text, secret) => text.split(secret).join('[REDACTED]'), value) : value;
  return {error: envelope.error, message: clean(envelope.message), data: envelope.data === null
    ? null : Object.fromEntries(Object.entries(envelope.data).map(([key, value]) => [key, clean(value)]))};
}
function input(values) {
  try {
    if (!values || typeof values !== 'object' || Array.isArray(values)
        || ![Object.prototype, null].includes(Object.getPrototypeOf(values))) throw invalidInput();
    const keys = Reflect.ownKeys(values);
    if (keys.length !== 2 || keys.some(key => key !== 'uid' && key !== 'unid')) throw invalidInput();
    const result = {};
    for (const key of ['uid', 'unid']) {
      const descriptor = Object.getOwnPropertyDescriptor(values, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'string'
          || descriptor.value.length > 4096) throw invalidInput();
      // URLSearchParams replaces lone UTF16 surrogates. Reject rather than
      // silently changing an opaque QR identifier. Empty Strings stay empty.
      encodeURIComponent(descriptor.value);
      result[key] = descriptor.value;
    }
    return result;
  } catch {
    throw invalidInput();
  }
}
function cancelBody(response) {
  try { void Promise.resolve(response?.body?.cancel()).catch(() => {}); } catch {}
}

export class GuestbookClient {
  #configuration; #transport; #timeoutMs; #maxBytes;
  constructor(configuration, {transport, timeoutMs = 30_000, maxResponseBytes = DEFAULT_MAX_BYTES} = {}) {
    if (transport !== undefined && typeof transport !== 'function'
        || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000
        || !Number.isInteger(maxResponseBytes) || maxResponseBytes < 1 || maxResponseBytes > 4 * 1024 * 1024) {
      throw new TypeError('Konfigurasi adapter Buku Tamu tidak valid.');
    }
    this.#configuration = configuration;
    // Native uBb constructor installs the default standalone adapter. The main
    // transport's client identity is not inherited just because the host is the
    // same. Standard TLS roots/hostname verification remain enabled. Node/Dart
    // roots, compression and packet bytes are declared transport adaptations.
    this.#transport = transport ?? createHttpsTransport(Object.freeze({}), {timeoutMs, maxRequestBytes: 0});
    this.#timeoutMs = timeoutMs; this.#maxBytes = maxResponseBytes;
  }
  async read(values, {signal} = {}) {
    const query = input(values);
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw invalidInput();
    let timedOut = false;
    const controller = new AbortController();
    const cancelled = () => failure(timedOut ? 504 : 499,
      timedOut ? 'GUESTBOOK_TIMEOUT' : 'GUESTBOOK_REQUEST_ABORTED',
      timedOut ? 'Waktu tunggu Buku Tamu terlampaui.' : 'Pembacaan Buku Tamu dibatalkan.');
    if (signal?.aborted) throw cancelled();
    const forwardAbort = () => controller.abort();
    signal?.addEventListener('abort', forwardAbort, {once: true});
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.#timeoutMs);
    timer.unref?.();
    let onAbort;
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(cancelled());
      controller.signal.addEventListener('abort', onAbort, {once: true});
    });
    // A trusted configuration getter can synchronously observe cancellation
    // before the first race is attached. Keep that rejection handled as well.
    void aborted.catch(() => {});
    let response, reader, complete = false;
    try {
      let authorization;
      try {
        if (this.#configuration?.configured !== true || typeof this.#configuration.applicationAuthorization !== 'function') throw new Error();
        authorization = this.#configuration.applicationAuthorization();
        if (typeof authorization !== 'string' || !/^AtrBpn [\x21-\x7e]{1,4096}$/.test(authorization)) throw new Error();
      } catch {
        throw failure(503, 'GUESTBOOK_CONFIGURATION_UNAVAILABLE', 'Konfigurasi Buku Tamu belum tersedia.');
      }
      if (controller.signal.aborted) throw cancelled();
      const url = new URL(ENDPOINT);
      for (const key of ['uid', 'unid']) url.searchParams.append(key, query[key]);
      // Only this fixed GET may receive the already configured app header.
      // No account token, refresh, retry, body, file or Content-Type is added.
      const pending = Promise.resolve().then(() => this.#transport(url, {
        method: 'GET', headers: {Authorization: authorization}, redirect: 'manual', signal: controller.signal,
      }));
      void pending.then(late => {if (controller.signal.aborted) cancelBody(late);}, () => {});
      try { response = await Promise.race([pending, aborted]); }
      catch {
        if (controller.signal.aborted) throw cancelled();
        throw failure(502, 'GUESTBOOK_NETWORK_ERROR', 'Koneksi ke layanan Buku Tamu belum berhasil.');
      }
      if (controller.signal.aborted) throw cancelled();
      if (!(response instanceof Response)) throw invalidResponse();
      // Never follow an app-authorized redirect, including a transport that
      // reports it already followed one. Location values are never exposed.
      if (response.redirected || response.status >= 300 && response.status < 400) {
        throw failure(502, 'GUESTBOOK_REDIRECT_REJECTED', 'Pengalihan layanan Buku Tamu belum didukung.');
      }
      if (response.url && response.url !== url.href) throw invalidResponse();
      if (response.status !== 200) throw failure(502, 'GUESTBOOK_HTTP_STATUS', 'Pembacaan Buku Tamu belum berhasil.', {upstreamStatus: response.status});
      // Drop all parameters rather than reflecting arbitrary server header
      // text. JSON-looking text/plain is not treated as a transformed Map.
      const contentType = jsonMime(response.headers.get('content-type'));
      if ([authorization, authorization.slice('AtrBpn '.length)].some(secret => contentType.includes(secret))) throw invalidResponse();
      const declared = response.headers.get('content-length');
      if (declared !== null && /^\d+$/.test(declared) && (declared.length > 12 || Number(declared) > this.#maxBytes)) {
        throw failure(502, 'GUESTBOOK_RESPONSE_TOO_LARGE', 'Respons Buku Tamu terlalu besar.');
      }
      if (!response.body) throw invalidResponse();
      reader = response.body.getReader();
      const chunks = []; let total = 0;
      while (true) {
        const {done, value} = await Promise.race([reader.read(), aborted]);
        if (controller.signal.aborted) throw cancelled();
        if (done) { complete = true; break; }
        if (!(value instanceof Uint8Array)) throw invalidResponse();
        total += value.byteLength;
        if (total > this.#maxBytes) throw failure(502, 'GUESTBOOK_RESPONSE_TOO_LARGE', 'Respons Buku Tamu terlalu besar.');
        // Keep only counted bytes, not an oversized view's backing buffer.
        chunks.push(Buffer.from(value));
      }
      let data;
      try {
        const text = new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks, total));
        data = decodeGuestbookJson(text);
      } catch { throw invalidResponse(); }
      if (controller.signal.aborted) throw cancelled();
      // Even a typed String can echo a secret. Keep both the configured scheme
      // form and raw suffix out of returned metadata, not only errors/logs.
      const result = {status: 200, contentType, data: redactEnvelope(data, authorization)};
      if (data.data !== null) readLookups.set(result, Object.freeze({query:Object.freeze({...query}),lookup:Object.freeze({...data.data})}));
      return result;
    } catch (error) {
      if (controller.signal.aborted) throw cancelled();
      // No upstream message, URL/query, headers, abort reason, body or cause is
      // copied to an error. A fixture/provider cannot forge a trusted error.
      if (ownedErrors.has(error)) throw error;
      throw failure(502, 'GUESTBOOK_NETWORK_ERROR', 'Koneksi ke layanan Buku Tamu belum berhasil.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forwardAbort);
      controller.signal.removeEventListener('abort', onAbort);
      if (!complete) {
        if (reader) {try {void Promise.resolve(reader.cancel()).catch(() => {});} catch {}}
        else cancelBody(response);
      }
      try {reader?.releaseLock();} catch {}
      controller.abort();
    }
  }
}
