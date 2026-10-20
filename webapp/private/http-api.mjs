import { randomBytes } from 'node:crypto';
import { loadConfiguration, APP_VERSION } from './configuration.mjs';
import { SessionStore, readSessionId, cookieFor, csrfMatches } from './session.mjs';
import { ApiClient, ApiError, publicData } from './api-client.mjs';
import * as defaultRegistry from './operations.mjs';
import { publicOrigin, browserRequestOrigin } from './browser-origin.mjs';
import { QueueClient, QueueClientError } from './queue-client.mjs';
import { QueueSessionReader } from './queue-session.mjs';
import {BhumiMapClient,BhumiMapError} from './bhumi-map-client.mjs';
import {browserMapConfiguration} from './browser-map-configuration.mjs';

function json(res, status, value) {
  const data = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }); res.end(data);
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 200) throw new ApiError(400, 'INVALID_VALUES', 'Parameter harus berupa object.');
  for (const key of Object.keys(value)) if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new ApiError(400, 'INVALID_VALUES', 'Nama parameter tidak valid.');
  return value;
}
async function parseInput(req) {
  const type = req.headers['content-type'] || '';
  const limit = type.startsWith('multipart/') ? 25 * 1024 * 1024 : 256 * 1024;
  if (Number(req.headers['content-length']) > limit) throw new ApiError(413, 'BODY_TOO_LARGE', 'Ukuran kiriman melebihi batas.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > limit) throw new ApiError(413, 'BODY_TOO_LARGE', 'Ukuran kiriman melebihi batas.'); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks);
  if (type.startsWith('multipart/form-data')) {
    let form;
    try { form = await new Request('http://localhost/', { method: 'POST', headers: { 'Content-Type': type }, body: bytes }).formData(); }
    catch { throw new ApiError(400, 'INVALID_MULTIPART', 'Form unggahan tidak valid.'); }
    const files = []; const text = {};
    for (const [key, value] of form) {
      if (typeof value === 'string') {
        if (!['operationId', 'values', 'confirm'].includes(key) || Object.hasOwn(text, key)) throw new ApiError(400, 'INVALID_MULTIPART', 'Field form tidak valid atau berulang.');
        text[key] = value;
      } else { if (files.length >= 10) throw new ApiError(400, 'TOO_MANY_FILES', 'Terlalu banyak lampiran.'); files.push({ key, file: value }); }
    }
    try { return { operationId: text.operationId, values: object(JSON.parse(text.values || '{}')), confirm: text.confirm === 'true', files }; }
    catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'INVALID_JSON', 'Parameter form bukan JSON yang valid.'); }
  }
  if (!type.startsWith('application/json')) throw new ApiError(415, 'CONTENT_TYPE_REQUIRED', 'Gunakan JSON atau multipart/form-data.');
  try { return { ...object(JSON.parse(bytes.toString('utf8'))), files: [] }; }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'INVALID_JSON', 'JSON tidak valid.'); }
}
async function validateFiles(prepared, uploaded) {
  const definitions = prepared.files || [];
  const accepted = new Map(definitions.map(field => [field.name || field.path, field]));
  for (const { key, file } of uploaded) {
    const definition = accepted.get(key);
    if (!definition || uploaded.filter(item => item.key === key).length > 1) throw new ApiError(400, 'UNEXPECTED_FILE', 'Lampiran tidak sesuai field operasi.');
    if (file.size < 1 || file.size > Math.min(definition.maxBytes || 15 * 1024 * 1024, 20 * 1024 * 1024)) throw new ApiError(400, 'FILE_SIZE', 'Ukuran lampiran tidak sesuai batas operasi.');
    if (prepared.path === 'geotag/UploadGeotag') {
      const magic = Buffer.from(await file.slice(0, 8).arrayBuffer());
      if (!magic.equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new ApiError(400, 'FILE_TYPE', 'Geotag memerlukan file PNG asli.');
    }
  }
  for (const definition of definitions) if (definition.required && !uploaded.some(item => item.key === (definition.name || definition.path))) throw new ApiError(400, 'FILE_REQUIRED', `Lampiran ${definition.name || definition.path} belum dipilih.`);
}
export function createApiHandler(options = {}) {
  const origin = publicOrigin(options.publicOrigin || '');
  const sessions = options.sessions || new SessionStore();
  const sessionOrigins = new WeakMap();
  const bindSessionOrigin = (session, expectedOrigin) => {
    if (sessionOrigins.has(session) && sessionOrigins.get(session) !== expectedOrigin) throw new ApiError(403, 'SESSION_ORIGIN_REJECTED', 'Sesi ini berasal dari alamat browser lain. Muat ulang halaman.');
    sessionOrigins.set(session, expectedOrigin);
    return session;
  };
  const registry = options.registry || defaultRegistry;
  const configurationPromise = Promise.resolve(options.configuration || loadConfiguration());
  const clientPromise = configurationPromise.then(config => new ApiClient(config, { transport: options.transport, now: options.now, log: options.log }));
  const queueTransport = options.queueTransport || (options.transport ? (url, init) => options.transport(new URL(url), init) : undefined);
  const queueClientPromise = configurationPromise.then(config => new QueueClient(config, { transport: queueTransport, log: options.log, sleep: options.queueSleep }));
  const queueReader = new QueueSessionReader(clientPromise, queueClientPromise);
  const bhumiClientPromise=Promise.all([configurationPromise,clientPromise]).then(([config,mainClient])=>new BhumiMapClient(config,{mainClient,transport:options.bhumiTransport,now:options.now,log:options.log}));
  const stateFor = (session, config) => ({ csrfToken: session.csrfToken, authenticated: Boolean(session.user && session.tokens), user: session.user, connection: { configured: config.configured, origin: config.origin, reason: config.reason }, version: APP_VERSION, capabilities: { manualAccountLogin: config.configured, submissions: 'review-and-confirm', geotagSubmission: 'official-app-required', coordinateComparison: 'local-only', nativeAttestation: false, serverValidated: false } });
  const close = () => { queueReader.close(); void bhumiClientPromise.then(client=>client.close()); for (const id of sessions.sessions.keys()) sessions.delete(id); };
  async function handle(req, res, requestPath) {
    if (!requestPath.startsWith('/api/')) return false;
    res.setHeader('Cache-Control', 'no-store');
    try {
      const expectedOrigin = browserRequestOrigin(req.headers.host, req.socket.localPort, origin);
      if (!expectedOrigin) throw new ApiError(403, 'HOST_REJECTED', 'Alamat browser ditolak.');
      const sessionCookie = id => cookieFor(id, expectedOrigin.startsWith('https://'));
      if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== expectedOrigin)) throw new ApiError(403, 'ORIGIN_REJECTED', 'Permintaan lintas situs ditolak.');
      if (!['GET', 'POST'].includes(req.method)) throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Metode tidak diizinkan.');
      const config = await configurationPromise;
      let session = sessions.get(readSessionId(req.headers.cookie));
      if (session) bindSessionOrigin(session, expectedOrigin);
      if (!session && req.method !== 'GET') throw new ApiError(403, 'CSRF_REQUIRED', 'Muat ulang halaman sebelum mengirim.');
      if (req.method === 'POST' && (req.headers.origin !== expectedOrigin || !csrfMatches(req.headers['x-csrf-token'], session.csrfToken))) throw new ApiError(403, 'CSRF_REJECTED', 'Pemeriksaan keamanan sesi gagal. Muat ulang halaman.');
      if (requestPath === '/api/state' && req.method === 'GET') {
        // Public catalog/diagnostic requests must never race this session bootstrap.
        if (!session) { session = bindSessionOrigin(sessions.create(), expectedOrigin); res.setHeader('Set-Cookie', sessionCookie(session.id)); }
        json(res, 200, stateFor(session, config)); return true;
      }
      if (requestPath === '/api/catalog' && req.method === 'GET') { const catalog = registry.getPublicCatalog(); json(res, 200, Array.isArray(catalog) ? { operations: catalog } : catalog); return true; }
      if(requestPath==='/api/maps/config'&&req.method==='GET'){
        // Fixed public provider metadata only; no account or provider secrets.
        json(res,200,browserMapConfiguration());return true;
      }
      if(requestPath.startsWith('/api/maps/bhumi/')&&req.method==='GET'){
        if(!session?.tokens||!session.user)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk membaca layer pertanahan Bhumi.');
        const match=/^\/api\/maps\/bhumi\/(0|[1-9]\d?)\/(0|[1-9]\d{0,6})\/(0|[1-9]\d{0,6})\.png$/.exec(requestPath);
        if(!match||new URL(req.url,expectedOrigin).search)throw new ApiError(400,'BHUMI_TILE_INVALID','Koordinat tile peta tidak valid.');
        const requestController=new AbortController();
        const cancel=()=>requestController.abort();
        req.once('aborted',cancel);res.once('close',cancel);
        try{
          const tile=await (await bhumiClientPromise).tile({z:Number(match[1]),x:Number(match[2]),y:Number(match[3]),session,signal:requestController.signal});
          if(requestController.signal.aborted||res.destroyed)return true;
          if(!session.active||sessions.get(session.id)!==session||!session.tokens)throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');
          res.writeHead(200,{'Content-Type':'image/png','Content-Length':tile.bytes.length,'Cross-Origin-Resource-Policy':'same-origin'});res.end(tile.bytes);return true;
        }catch(error){if(error instanceof BhumiMapError)throw new ApiError(error.status,error.code,error.message);throw error;}
        finally{req.removeListener('aborted',cancel);res.removeListener('close',cancel);}
      }
      if (requestPath === '/api/diagnostics' && req.method === 'GET') {
        const catalog = registry.getPublicCatalog(); const operations = Array.isArray(catalog) ? catalog : catalog.operations;
        json(res, 200, { ok: true, scope: 'local-configuration-only', upstreamRequests: 0,
          checks: [{ name: 'Konfigurasi artefak', passed: config.configured, detail: config.reason }, { name: 'Catalog operasi', passed: operations.length > 0, detail: `${operations.length} kontrak termuat` }, { name: 'Batas akses browser', passed: true, detail: 'Origin + CSRF; sesi hanya di memori; upstream dibatasi registry' }],
          catalog: { total: operations.length, enabled: operations.filter(item => item.enabled).length, inspectOnly: operations.filter(item => item.inspectOnly).length }, serverValidated: false }); return true;
      }
      if ((requestPath.startsWith('/api/download/') || requestPath.startsWith('/api/preview/')) && req.method === 'GET') {
        const preview = requestPath.startsWith('/api/preview/');
        const download = session?.downloads.get(requestPath.slice(preview ? '/api/preview/'.length : '/api/download/'.length));
        if (!download || download.expires < Date.now() || (preview && download.previewable !== true)) throw new ApiError(404, 'DOWNLOAD_EXPIRED', 'Unduhan tidak tersedia atau kedaluwarsa.');
        res.writeHead(200, { 'Content-Type': download.contentType, 'Content-Disposition': `${preview ? 'inline' : 'attachment'}; filename="${download.name}"`, 'Content-Length': download.bytes.length }); res.end(download.bytes); return true;
      }
      if (requestPath === '/api/logout' && req.method === 'POST') {
        queueReader.discard(session);
        (await bhumiClientPromise).invalidateSession(session);
        session = bindSessionOrigin(sessions.rotate(session), expectedOrigin); res.setHeader('Set-Cookie', sessionCookie(session.id)); json(res, 200, stateFor(session, config)); return true;
      }
      if (requestPath === '/api/login' && req.method === 'POST') {
        const input = await parseInput(req);
        if (typeof input.username !== 'string' || !input.username.trim() || input.username.length > 254 || typeof input.password !== 'string' || !input.password || input.password.length > 1024) throw new ApiError(400, 'LOGIN_INPUT', 'Isi username dan kata sandi yang valid.');
        session.loginAttempts = session.loginAttempts.filter(time => Date.now() - time < 60_000);
        if (session.loginAttempts.length >= 5) throw new ApiError(429, 'LOGIN_RATE_LIMIT', 'Terlalu banyak percobaan. Tunggu satu menit.');
        session.loginAttempts.push(Date.now());
        const credentials = await (await clientPromise).signIn(input.username.trim(), input.password);
        input.password = '';
        // A logout or concurrent login may invalidate this session while the
        // upstream responds. Never recreate an authenticated session afterward.
        if (!session.active || sessions.get(session.id) !== session) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berubah saat proses masuk. Muat ulang halaman.');
        queueReader.discard(session);
        (await bhumiClientPromise).invalidateSession(session);
        session = bindSessionOrigin(sessions.rotate(session), expectedOrigin); Object.assign(session, credentials);
        res.setHeader('Set-Cookie', sessionCookie(session.id)); json(res, 200, stateFor(session, config)); return true;
      }
      if (requestPath === '/api/execute' && req.method === 'POST') {
        const input = await parseInput(req);
        const assertCurrentSession = () => {
          if (!session.active || sessions.get(session.id) !== session) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berubah saat permintaan berlangsung. Silakan masuk kembali.');
        };
        assertCurrentSession();
        if (typeof input.operationId !== 'string' || input.operationId.length > 180) throw new ApiError(400, 'OPERATION_REQUIRED', 'Pilih operasi yang tersedia.');
        const values = object(input.values || {});
        const context = { user: session.user, authenticated: Boolean(session.tokens), nik: session.user?.nomorIndukKependudukan, username: session.user?.username, tipeuser: session.user?.roleUser, appVersion: APP_VERSION, applicationConfigured: config.configured };
        let prepared;
        try { prepared = registry.prepareOperation(input.operationId, values, context); }
        catch (error) { throw new ApiError(error.status || 409, error.code || 'CONTRACT_NOT_READY', error.message || 'Operasi belum siap digunakan.'); }
        if (prepared.requiresConfirmation && input.confirm !== true) throw new ApiError(409, 'CONFIRMATION_REQUIRED', 'Tinjau parameter lalu konfirmasi pengiriman.');
        const client = await clientPromise;
        if (prepared.clientProfile === 'queue-read') {
          if (input.files.length) throw new ApiError(400, 'UNEXPECTED_FILE', 'Pembacaan antrean tidak menerima lampiran.');
          let result;
          try { result = await queueReader.read(prepared, session, assertCurrentSession); }
          catch (error) {
            if (error instanceof QueueClientError) throw new ApiError(error.status, error.code, error.message);
            throw error;
          }
          assertCurrentSession();
          json(res, 200, { ok: true, operationId: input.operationId, result: { ...result, data: publicData(result.data) } });
          return true;
        }
        // The audited SPS viewer reads the stored token directly and has no
        // main-client refresh interceptor. Preserve that distinction explicitly.
        if (prepared.clientProfile !== 'sps-document-viewer' && (prepared.auth === 'session' || (prepared.auth === 'optionalSession' && session.tokens))) await client.ensureFresh(session);
        await validateFiles(prepared, input.files);
        if (!prepared.service?.baseUrl) throw new ApiError(409, 'SERVICE_NOT_READY', 'Alamat layanan belum dibuktikan.');
        assertCurrentSession();
        const requestTokens = session.tokens;
        const requestSecrets = client.redactionValues(session, prepared.body);
        const result = await client.request({ base: prepared.service.baseUrl, path: prepared.path, query: prepared.query, method: prepared.method, encoding: prepared.encoding, body: prepared.body, files: input.files, auth: prepared.auth, session, clientProfile: prepared.clientProfile });
        assertCurrentSession();
        if (requestTokens && !session.tokens) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berubah saat permintaan berlangsung. Silakan masuk kembali.');
        queueReader.observe(prepared, result, session);
        if (result.bytes) {
          for (const [id, file] of session.downloads) if (file.expires < Date.now()) session.downloads.delete(id);
          if (session.downloads.size >= 3) session.downloads.delete(session.downloads.keys().next().value);
          const id = randomBytes(24).toString('base64url');
          const extension = result.contentType.includes('pdf') ? 'pdf' : result.contentType.includes('png') ? 'png' : result.contentType.includes('jpeg') ? 'jpg' : 'bin';
          session.downloads.set(id, { bytes: result.bytes, contentType: result.contentType, name: `sentuh-document.${extension}`, previewable: result.previewable === true, expires: Date.now() + 120_000 });
          json(res, 200, { ok: true, operationId: input.operationId, result: { status: result.status, contentType: result.contentType, downloadUrl: `/api/download/${id}`, ...(result.previewable === true ? { previewUrl: `/api/preview/${id}` } : {}), data: null } });
        } else {
          // A concurrent refresh can replace credentials while this request is
          // pending. Redact both generations from the returned document data.
          const responseSecrets = [...requestSecrets, ...client.redactionValues(session, prepared.body)].sort((a, b) => b.length - a.length);
          json(res, 200, { ok: true, operationId: input.operationId, result: { status: result.status, contentType: result.contentType, data: publicData(result.data, 0, responseSecrets) } });
        }
        return true;
      }
      throw new ApiError(404, 'NOT_FOUND', 'Endpoint tidak tersedia.');
    } catch (error) {
      if (res.headersSent) { res.end(); return true; }
      json(res, error instanceof ApiError ? error.status : 500, { ok: false, error: { code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR', message: error instanceof ApiError ? error.message : 'Permintaan tidak dapat diproses.', ...(error instanceof ApiError && error.details ? { details: publicData(error.details) } : {}) } });
      return true;
    }
  }
  return { handle, close, configurationPromise };
}
