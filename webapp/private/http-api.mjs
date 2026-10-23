import { randomBytes } from 'node:crypto';
import { loadConfiguration, APP_VERSION } from './configuration.mjs';
import { SessionStore, readSessionId, cookieFor, csrfMatches } from './session.mjs';
import { ApiClient, ApiError, publicData } from './api-client.mjs';
import * as defaultRegistry from './operations.mjs';
import { publicOrigin, browserRequestOrigin } from './browser-origin.mjs';
import { QueueClient, QueueClientError } from './queue-client.mjs';
import { QueueSessionReader } from './queue-session.mjs';
import {QueueBookingClient} from './queue-booking-client.mjs';
import {QueueBookingSession} from './queue-booking-session.mjs';
import {BhumiMapClient,BhumiMapError} from './bhumi-map-client.mjs';
import {browserMapConfiguration} from './browser-map-configuration.mjs';
import {scanProfileName} from './scan-response.mjs';
import {GuestbookClient,GuestbookClientError} from './guestbook-client.mjs';
import {reviewPostFileDefinitions} from './lost-review-post.mjs';
import {SwaplottingSubmissionSession} from './swaplotting-submit-session.mjs';
import {SWAPLOTTING_POSTS} from './swaplotting-post.mjs';
import {BerkasQuestionSession} from './berkas-question-session.mjs';
import {BERKAS_QUESTION_POST_ID,BERKAS_QUESTION_POST_PATH} from './berkas-question-post.mjs';
import {BerkasRatingSession} from './berkas-rating-session.mjs';
import {BERKAS_RATING_ID,BERKAS_RATING_PATH} from './berkas-rating-post.mjs';
import {GuestbookPostClient,GuestbookPostError,GUESTBOOK_POST_ID,GUESTBOOK_POST_PATH} from './guestbook-post.mjs';
import {GuestbookSubmissionSession} from './guestbook-submit-session.mjs';

function json(res, status, value) {
  const data = JSON.stringify(value);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }); res.end(data);
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 200) throw new ApiError(400, 'INVALID_VALUES', 'Parameter harus berupa object.');
  for (const key of Object.keys(value)) if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new ApiError(400, 'INVALID_VALUES', 'Nama parameter tidak valid.');
  return value;
}
function swaplottingError(error) {
  const scoped=error instanceof ApiError?error:new ApiError(500,'SWAPLOTTING_INTERNAL_ERROR','Pengiriman Swaplotting belum dapat diproses.');
  const details={...(scoped.details||{})};
  if(['not_sent','unknown','confirmed'].includes(error?.delivery))details.delivery=error.delivery;
  if(error?.uploadAccepted===true)details.uploadAccepted=true;
  if(['not_sent','unknown','confirmed'].includes(error?.activityDelivery))details.activityDelivery=error.activityDelivery;
  if(Object.keys(details).length)scoped.details=details;
  return scoped;
}
function swaplottingSource(result) {
  const source=result?.swaplottingSourceContext;
  return source&&['profile','disclaimer','offices','regions'].includes(source.kind)&&/^ss_[A-Za-z0-9_-]{32}$/.test(source.id)?{swaplottingSourceContext:{kind:source.kind,id:source.id}}:{};
}
function berkasRatingError(error){
  const scoped=error instanceof ApiError?error:new ApiError(500,'BERKAS_RATING_INTERNAL_ERROR','Pengiriman Rating Berkas belum dapat diproses.');
  if(['not_sent','unknown'].includes(error?.delivery))scoped.details={...(scoped.details||{}),delivery:error.delivery};
  return scoped;
}
function berkasRatingSources(result){
  const sources=result?.berkasRatingSources,contextId=result?.berkasRatingContextId;
  return {...(Array.isArray(sources)?{berkasRatingSources:sources}:{}),...(typeof contextId==='string'&&/^brc_[A-Za-z0-9_-]{32}$/.test(contextId)?{berkasRatingContextId:contextId}:{})};
}
function guestbookSubmitError(error){
  const scoped=error instanceof ApiError?error:error instanceof GuestbookPostError?new ApiError(error.status,error.code,error.message,error.details):new ApiError(500,'GUESTBOOK_POST_INTERNAL_ERROR','Pengiriman Buku Tamu belum dapat diproses.');
  if(['not_sent','unknown'].includes(error?.delivery))scoped.details={...(scoped.details||{}),delivery:error.delivery};
  return scoped;
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
      } else { files.push({ key, file: value }); }
    }
    // Review's audited gallery has no ten-file cap. Keep the existing whole
    // multipart byte limit and preserve the ten-file guard for every other op.
    if(files.length>10&&text.operationId!=='post-review-post-deb030')throw new ApiError(400,'TOO_MANY_FILES','Terlalu banyak lampiran.');
    try { return { operationId: text.operationId, values: object(JSON.parse(text.values || '{}')), confirm: text.confirm === 'true', files }; }
    catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'INVALID_JSON', 'Parameter form bukan JSON yang valid.'); }
  }
  if (!type.startsWith('application/json')) throw new ApiError(415, 'CONTENT_TYPE_REQUIRED', 'Gunakan JSON atau multipart/form-data.');
  try { return { ...object(JSON.parse(bytes.toString('utf8'))), files: [] }; }
  catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'INVALID_JSON', 'JSON tidak valid.'); }
}
async function validateFiles(prepared, uploaded) {
  const reviewPost=prepared.operation.id==='post-review-post-deb030'&&prepared.path==='review/post'&&prepared.method==='POST'&&prepared.encoding==='multipart'&&prepared.auth==='session';
  let definitions=prepared.files||[];
  if(reviewPost){try{definitions=reviewPostFileDefinitions(uploaded);}catch(error){throw new ApiError(400,error.code,error.message);}}
  const accepted = new Map(definitions.map(field => [field.name || field.path, field]));
  for (const { key, file } of uploaded) {
    const definition = accepted.get(key);
    if (!definition || !reviewPost&&uploaded.filter(item => item.key === key).length > 1) throw new ApiError(400, 'UNEXPECTED_FILE', 'Lampiran tidak sesuai field operasi.');
    if (file.size < (reviewPost?0:1) || file.size > (reviewPost?25*1024*1024:Math.min(definition.maxBytes || 15 * 1024 * 1024, 20 * 1024 * 1024))) throw new ApiError(400, 'FILE_SIZE', 'Ukuran lampiran tidak sesuai batas operasi.');
    if (prepared.path === 'geotag/UploadGeotag') {
      const magic = Buffer.from(await file.slice(0, 8).arrayBuffer());
      if (!magic.equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new ApiError(400, 'FILE_TYPE', 'Geotag memerlukan file PNG asli.');
    }
  }
  if(!reviewPost)for (const definition of definitions) if (definition.required && !uploaded.some(item => item.key === (definition.name || definition.path))) throw new ApiError(400, 'FILE_REQUIRED', `Lampiran ${definition.name || definition.path} belum dipilih.`);
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
  const bookingClientPromise=configurationPromise.then(config=>new QueueBookingClient(config,{transport:queueTransport,log:options.log}));
  const bookingSession=new QueueBookingSession({mainClientPromise:clientPromise,bookingClientPromise,queueReader,now:options.queueBookingNow});
  const swaplottingSession=new SwaplottingSubmissionSession({clientPromise,now:options.swaplottingNow||options.now||Date.now});
  const berkasQuestionSession=new BerkasQuestionSession({clientPromise});
  const berkasRatingSession=new BerkasRatingSession({clientPromise,now:options.berkasRatingNow||options.now||Date.now});
  const guestbookClientPromise=configurationPromise.then(config=>new GuestbookClient(config,{transport:options.guestbookTransport||options.transport,log:options.log}));
  const guestbookPostClientPromise=configurationPromise.then(config=>new GuestbookPostClient(config,{transport:options.guestbookPostTransport||options.guestbookTransport||options.transport}));
  const guestbookSubmission=new GuestbookSubmissionSession({postClientPromise:guestbookPostClientPromise,now:options.guestbookNow||options.now||Date.now});
  // A Scan attempt captures one server-owned name. The opaque reference is
  // usable only by this session/user and exact raw q for two minutes; token
  // refresh of the same account does not change its identity or replay writes.
  const scanAttempts = new WeakMap(), scanNow = options.now || Date.now;
  const scanDocumentIds = new Set(['post-apis-getdocument-d41ee8','post-apis-getdocumenttype-d417d4','get-apis-getgeojsoninfo-d39f1c','post-apis-getpbteldetail-d3d134','post-apis-getkkprdetail-d311e8']);
  function scanState(session) {
    let state = scanAttempts.get(session);
    if (!state || state.user !== session.user) { state = {user:session.user,contexts:new Map()}; scanAttempts.set(session,state); }
    for (const [id, context] of state.contexts) if (context.expires <= scanNow()) state.contexts.delete(id);
    return state;
  }
  function resolveScanContext(session, input, values) {
    if (!scanDocumentIds.has(input.operationId)) throw new ApiError(409,'SCAN_CONTEXT_SCOPE','Konteks Scan hanya berlaku untuk dokumen, metadata dan lokasi dokumen.');
    if (!session.tokens || !session.user) throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk melanjutkan pemindaian.');
    const id = input.scanContextId;
    const context = typeof id === 'string' && /^[A-Za-z0-9_-]{32}$/.test(id) && scanState(session).contexts.get(id);
    if (!context || typeof values.q !== 'string' || values.q !== context.q) throw new ApiError(409,'SCAN_CONTEXT_INVALID','Konteks Scan tidak cocok atau sudah kedaluwarsa. Pindai ulang kode.');
    return context;
  }
  const bhumiClientPromise=Promise.all([configurationPromise,clientPromise]).then(([config,mainClient])=>new BhumiMapClient(config,{mainClient,transport:options.bhumiTransport,now:options.now,log:options.log}));
  const stateFor = (session, config) => ({ csrfToken: session.csrfToken, authenticated: Boolean(session.user && session.tokens), user: session.user, connection: { configured: config.configured, origin: config.origin, reason: config.reason }, version: APP_VERSION, capabilities: { manualAccountLogin: config.configured, submissions: 'review-and-confirm', geotagSubmission: 'official-app-required', coordinateComparison: 'local-only', personalSwaplottingSubmission:config.configured, queueBookingReview: config.configured, queueBookingCreate: false, nativeAttestation: false, serverValidated: false } });
  const close = () => { berkasQuestionSession.close(); guestbookSubmission.close(); berkasRatingSession.close(); swaplottingSession.close(); bookingSession.close(); queueReader.close(); void bhumiClientPromise.then(client=>client.close()); for (const id of sessions.sessions.keys()) sessions.delete(id); };
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
        scanAttempts.delete(session);
        queueReader.discard(session);
        bookingSession.discard(session);
        swaplottingSession.discard(session);
        berkasRatingSession.discard(session);
        berkasQuestionSession.discard(session);
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
        scanAttempts.delete(session);
        queueReader.discard(session);
        bookingSession.discard(session);
        swaplottingSession.discard(session);
        berkasRatingSession.discard(session);
        berkasQuestionSession.discard(session);
        (await bhumiClientPromise).invalidateSession(session);
        session = bindSessionOrigin(sessions.rotate(session), expectedOrigin); Object.assign(session, credentials);
        res.setHeader('Set-Cookie', sessionCookie(session.id)); json(res, 200, stateFor(session, config)); return true;
      }
      if(['/api/swaplotting/review','/api/swaplotting/complete','/api/swaplotting/discard','/api/swaplotting/status'].includes(requestPath)&&req.method==='POST'){
        if(!session?.tokens||!session.user)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk menggunakan formulir Swaplotting.');
        const input=await parseInput(req);
        const assertCurrentSession=()=>{if(!session.active||sessions.get(session.id)!==session)throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');};
        try{
          assertCurrentSession();
          if(requestPath==='/api/swaplotting/review'){
            if(!(req.headers['content-type']||'').startsWith('multipart/form-data')||input.operationId!=='swaplotting-review'||input.confirm!==false||Object.keys(input).sort().join(',')!=='confirm,files,operationId,values')throw new ApiError(400,'SWAPLOTTING_REVIEW_SCOPE','Gunakan formulir Swaplotting yang sedang ditampilkan.');
            const result=await swaplottingSession.prepareReview(object(input.values),input.files,session,assertCurrentSession);
            assertCurrentSession();json(res,200,{ok:true,...result});return true;
          }
          const complete=requestPath==='/api/swaplotting/complete';
          if(!(req.headers['content-type']||'').startsWith('application/json')||input.files.length||Object.keys(input).filter(key=>key!=='files').sort().join(',')!==(complete?'confirm,reviewId':'reviewId')||typeof input.reviewId!=='string'||!/^sr_[A-Za-z0-9_-]{32}$/.test(input.reviewId)||complete&&input.confirm!==true)throw new ApiError(400,'SWAPLOTTING_RESULT_SCOPE','Pilih hasil pengiriman formulir sesi ini.');
          if(complete){
            const client=await clientPromise,secrets=client.redactionValues(session);
            const result=await swaplottingSession.complete({reviewId:input.reviewId},session,assertCurrentSession);
            assertCurrentSession();
            json(res,200,{ok:true,...result,refresh:{success:result.refresh.success,result:result.refresh.result?{status:result.refresh.result.status,contentType:result.refresh.result.contentType,data:publicData(result.refresh.result.data,0,[...secrets,...client.redactionValues(session)].sort((a,b)=>b.length-a.length))}:null}});return true;
          }
          if(requestPath==='/api/swaplotting/status'){json(res,200,{ok:true,...swaplottingSession.status(input.reviewId,session,assertCurrentSession)});return true;}
          json(res,200,{ok:true,discarded:swaplottingSession.discardReview(input.reviewId,session)});return true;
        }catch(error){throw swaplottingError(error);}
      }
      if(requestPath==='/api/queue/booking/calendar'&&req.method==='POST'){
        if(!session?.tokens||!session.user)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk membaca kalender antrean.');
        const input=await parseInput(req);
        if(input.files.length||Object.keys(input).filter(key=>key!=='files').sort().join(',')!=='officeId,year'||typeof input.officeId!=='string'||typeof input.year!=='string')throw new ApiError(400,'QUEUE_CALENDAR_INPUT','Pilih kantor dan tahun kalender yang tersedia.');
        const assertCurrentSession=()=>{if(!session.active||sessions.get(session.id)!==session)throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');};
        const result=await queueReader.calendar(input,session,assertCurrentSession);
        assertCurrentSession();
        json(res,200,{ok:true,result:{status:result.status,contentType:result.contentType,data:publicData(result.data)}});return true;
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
        if (Object.hasOwn(input,'scanContextId')) context.scanContext = resolveScanContext(session,input,values);
        let prepared;
        try { prepared = registry.prepareOperation(input.operationId, values, context); }
        catch (error) { throw new ApiError(error.status || 409, error.code || 'CONTRACT_NOT_READY', error.message || 'Operasi belum siap digunakan.',input.operationId===GUESTBOOK_POST_ID?{delivery:'not_sent'}:undefined); }
        if (prepared.requiresConfirmation && input.confirm !== true) throw new ApiError(409, 'CONFIRMATION_REQUIRED', 'Tinjau parameter lalu konfirmasi pengiriman.',input.operationId===GUESTBOOK_POST_ID?{delivery:'not_sent'}:undefined);
        const client = await clientPromise;
        if(prepared.clientProfile==='berkas-question-post'){
          if(input.operationId!==BERKAS_QUESTION_POST_ID||prepared.path!==BERKAS_QUESTION_POST_PATH||prepared.method!=='POST'||prepared.encoding!=='form'||prepared.auth!=='session'||prepared.serviceId!=='main'||prepared.service?.baseUrl!=='https://sentuh.atrbpn.go.id/'||input.files.length||Object.keys(input).sort().join(',')!=='confirm,files,operationId,values')throw new ApiError(400,'BERKAS_QUESTION_SCOPE','Buka percakapan dari detail Koleksi atau Cari Berkas.',{delivery:'not_sent'});
          try{
            const secrets=client.redactionValues(session),result=await berkasQuestionSession.submit(prepared.berkasQuestionInput,session,assertCurrentSession);
            assertCurrentSession();const responseSecrets=[...secrets,...client.redactionValues(session)].sort((a,b)=>b.length-a.length);
            json(res,200,{ok:true,operationId:input.operationId,result:{status:result.status,contentType:result.contentType,data:result.data,delivery:result.delivery,refresh:result.refresh?{success:result.refresh.success,...(result.refresh.result?{result:{status:result.refresh.result.status,contentType:result.refresh.result.contentType,data:publicData(result.refresh.result.data,0,responseSecrets)}}:{code:result.refresh.code})}:null}});return true;
          }catch(error){const scoped=error instanceof ApiError?error:new ApiError(500,'BERKAS_QUESTION_INTERNAL_ERROR','Pesan belum dapat diproses.');scoped.details={...(scoped.details||{}),delivery:['not_sent','unknown'].includes(error.delivery)?error.delivery:'unknown'};throw scoped;}
        }
        if(prepared.clientProfile==='berkas-rating-post'){
          if(!session.user||!session.tokens)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk memberi penilaian Berkas.');
          if(input.operationId!==BERKAS_RATING_ID||prepared.path!==BERKAS_RATING_PATH||prepared.method!=='POST'||prepared.encoding!=='multipart'||prepared.auth!=='session'||prepared.serviceId!=='main'||prepared.service?.baseUrl!=='https://sentuh.atrbpn.go.id/'||input.files.length||Object.keys(input).sort().join(',')!=='confirm,files,operationId,values')throw new ApiError(400,'BERKAS_RATING_SCOPE','Pengiriman penilaian harus berasal dari detail Berkasku.');
          try{
            const requestSecrets=client.redactionValues(session);
            const result=await berkasRatingSession.submit(prepared.berkasRatingInput,session,assertCurrentSession);
            assertCurrentSession();const responseSecrets=[...requestSecrets,...client.redactionValues(session)].sort((a,b)=>b.length-a.length);
            json(res,200,{ok:true,operationId:input.operationId,result:{status:result.status,contentType:result.contentType,data:publicData(result.data,0,responseSecrets),delivery:result.delivery}});return true;
          }catch(error){throw berkasRatingError(error);}
        }
        if(prepared.clientProfile==='swaplotting-post'){
          const definition=SWAPLOTTING_POSTS[prepared.swaplottingKind];
          if(!session.user||!session.tokens)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk mengirim formulir Swaplotting.');
          if(!definition||input.operationId!==definition.id||prepared.path!==definition.path||prepared.method!=='POST'||prepared.encoding!=='multipart'||prepared.auth!=='session'||prepared.serviceId!=='main'||prepared.service?.baseUrl!=='https://sentuh.atrbpn.go.id/'||input.files.length||Object.keys(input).sort().join(',')!=='confirm,files,operationId,values')throw new ApiError(400,'SWAPLOTTING_SUBMIT_SCOPE','Pengiriman Swaplotting tidak sesuai kontrak formulir.');
          try{
            const result=await swaplottingSession.submit({reviewId:prepared.swaplottingReviewId,kind:prepared.swaplottingKind},session,assertCurrentSession);
            assertCurrentSession();
            json(res,200,{ok:true,operationId:input.operationId,result:{status:result.status,contentType:result.contentType,data:result.data,reviewId:result.reviewId,delivery:result.delivery}});return true;
          }catch(error){throw swaplottingError(error);}
        }
        if(prepared.clientProfile==='guestbook-post'){
          if(!session.user||!session.tokens)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk mengisi Buku Tamu.',{delivery:'not_sent'});
          if(input.operationId!==GUESTBOOK_POST_ID||prepared.path!==GUESTBOOK_POST_PATH||prepared.method!=='POST'||prepared.encoding!=='multipart'||prepared.auth!=='session'||prepared.serviceId!=='main'||prepared.service?.baseUrl!=='https://sentuh.atrbpn.go.id/'||prepared.operation.upstreamAuthentication!=='application'||input.files.length||Object.keys(input).sort().join(',')!=='confirm,files,operationId,values')throw new ApiError(400,'GUESTBOOK_POST_SCOPE','Pengiriman Buku Tamu hanya tersedia dari formulir unit yang dibaca pada sesi ini.',{delivery:'not_sent'});
          const requestController=new AbortController(),cancel=()=>requestController.abort();req.once('aborted',cancel);res.once('close',cancel);
          try{
            const result=await guestbookSubmission.submit(prepared.guestbookPostInput,session,assertCurrentSession,requestController.signal);
            if(requestController.signal.aborted||res.destroyed)return true;assertCurrentSession();
            json(res,200,{ok:true,operationId:input.operationId,result:{status:result.status,data:result.data,delivery:result.delivery}});return true;
          }catch(error){if(requestController.signal.aborted||res.destroyed)return true;throw guestbookSubmitError(error);}
          finally{req.removeListener('aborted',cancel);res.removeListener('close',cancel);}
        }
        if (prepared.clientProfile === 'guestbook-read') {
          if (!session.user || !session.tokens) throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk membuka Buku Tamu.');
          if (input.operationId!=='get-bukutamu-d28bf4'||prepared.method!=='GET'||prepared.path!=='bukutamu'||prepared.auth!=='session'||prepared.service?.baseUrl!=='https://sentuh.atrbpn.go.id/'||input.files.length) throw new ApiError(400,'GUESTBOOK_READ_SCOPE','Pembacaan Buku Tamu tidak sesuai kontrak.');
          // Native uBb uses application authorization in its own Dio, without
          // main-account refresh, user bearer or Directus retry/interceptors.
          const visitorOwner=session.user,guestbookSecrets=client.redactionValues(session),ticket=guestbookSubmission.beginRead(prepared.query,session),requestController=new AbortController(),cancel=()=>requestController.abort();
          req.once('aborted',cancel);res.once('close',cancel);
          try {
            const result=await(await guestbookClientPromise).read(prepared.query,{signal:requestController.signal});
            if(requestController.signal.aborted||res.destroyed)return true;
            assertCurrentSession();
            if(!session.tokens||session.user!==visitorOwner)throw new ApiError(401,'SESSION_EXPIRED','Sesi berubah saat membaca Buku Tamu. Silakan buka kembali.');
            const observed=guestbookSubmission.observeRead(result,session,ticket);
            json(res,200,{ok:true,operationId:input.operationId,result:{status:result.status,contentType:result.contentType,data:publicData(result.data,0,[...guestbookSecrets,...client.redactionValues(session)].sort((a,b)=>b.length-a.length)),...(observed.guestbookContextId?{guestbookContextId:observed.guestbookContextId}:{})}});return true;
          }catch(error){if(error instanceof GuestbookClientError)throw new ApiError(error.status,error.code,error.message);throw error;}
          finally{req.removeListener('aborted',cancel);res.removeListener('close',cancel);}
        }
        if (prepared.clientProfile === 'queue-read') {
          if (input.files.length) throw new ApiError(400, 'UNEXPECTED_FILE', 'Pembacaan antrean tidak menerima lampiran.');
          let result;
          try { result = bookingSession.observePreread(prepared,await queueReader.read(prepared, session, assertCurrentSession),session); }
          catch (error) {
            if (error instanceof QueueClientError) throw new ApiError(error.status, error.code, error.message);
            throw error;
          }
          assertCurrentSession();
          json(res, 200, { ok: true, operationId: input.operationId, result: { ...result, data: publicData(result.data) } });
          return true;
        }
        if(prepared.clientProfile==='queue-booking'){
          if(!session.user||!session.tokens)throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk meninjau antrean.');
          if(input.operationId!=='post-api-booking-limit-d8bf80'||prepared.path!=='api/booking/limit/'||prepared.method!=='POST'||prepared.encoding!=='json'||prepared.auth!=='session'||prepared.service?.baseUrl!=='https://aplikasi.atrbpn.go.id/konsol/antrian/directus/')throw new ApiError(400,'QUEUE_BOOKING_REVIEW_SCOPE','Tinjauan antrean tidak sesuai kontrak.');
          if(input.files.length)throw new ApiError(400,'UNEXPECTED_FILE','Tinjauan antrean tidak menerima lampiran.');
          let result;
          try{result=await bookingSession.review(prepared.queueBookingReview,session,assertCurrentSession);}
          catch(error){if(error instanceof QueueClientError)throw new ApiError(error.status,error.code,error.message);throw error;}
          assertCurrentSession();
          json(res,200,{ok:true,operationId:input.operationId,result:{...result,data:publicData(result.data)}});return true;
        }
        // The audited SPS viewer reads the stored token directly and has no
        // main-client refresh interceptor. Preserve that distinction explicitly.
        if (prepared.clientProfile !== 'sps-document-viewer' && (prepared.auth === 'session' || (prepared.auth === 'optionalSession' && session.tokens))) await client.ensureFresh(session);
        await validateFiles(prepared, input.files);
        if (!prepared.service?.baseUrl) throw new ApiError(409, 'SERVICE_NOT_READY', 'Alamat layanan belum dibuktikan.');
        assertCurrentSession();
        if (context.scanContext && resolveScanContext(session,input,values) !== context.scanContext) throw new ApiError(409,'SCAN_CONTEXT_INVALID','Konteks Scan berubah. Pindai ulang kode.');
        if (prepared.operation.id === 'post-apis-scandocument-d42440') {
          if (!session.user) throw new ApiError(401,'LOGIN_REQUIRED','Masuk untuk memindai dokumen.');
          const profileOwner = session.user;
          const summary = await client.request({path:'account/account_summary',method:'POST',encoding:'form',auth:'session',session,body:{appVersion:APP_VERSION},query:{}});
          assertCurrentSession();
          if (!session.tokens) throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');
          if (session.user !== profileOwner) throw new ApiError(409,'SESSION_CHANGED','Profil sesi berubah saat pemindaian. Silakan ulangi.');
          let name;
          try { name = scanProfileName(summary); }
          catch { throw new ApiError(502,'SCAN_PROFILE_UNRECOGNIZED','Profil akun belum sesuai format pemindaian dokumen.'); }
          const q = prepared.body.q;
          await client.ensureFresh(session);
          assertCurrentSession();
          if (session.user !== profileOwner) throw new ApiError(409,'SESSION_CHANGED','Profil sesi berubah saat pemindaian. Silakan ulangi.');
          const requestSecrets = client.redactionValues(session,{q,name});
          let classified;
          try {
            classified = await client.request({base:prepared.service.baseUrl,path:prepared.path,query:{},method:'POST',encoding:'form',body:{q,name},files:[],auth:'session',session,clientProfile:'main'});
          } catch (error) {
            const ordinary = ['UPSTREAM_REJECTED','UPSTREAM_UNREACHABLE','UPSTREAM_REDIRECT','INVALID_UPSTREAM_JSON','SCAN_CLASSIFICATION_UNRECOGNIZED','RESPONSE_TOO_LARGE'];
            if (!(error instanceof ApiError) || !ordinary.includes(error.code)) throw error;
            classified = {status:Number.isInteger(error.details?.upstreamStatus)?error.details.upstreamStatus:null,contentType:'application/json',data:{message:'error',data:'1009'},nativeFallback:true};
          }
          assertCurrentSession();
          if (!session.tokens) throw new ApiError(401,'SESSION_EXPIRED','Sesi sudah berakhir. Silakan masuk kembali.');
          if (session.user !== profileOwner) throw new ApiError(409,'SESSION_CHANGED','Profil sesi berubah saat pemindaian. Silakan ulangi.');
          const state = scanState(session), id = randomBytes(24).toString('base64url');
          while (state.contexts.size >= 5) state.contexts.delete(state.contexts.keys().next().value);
          state.contexts.set(id,{q,name,expires:scanNow()+120_000});
          json(res,200,{ok:true,operationId:input.operationId,result:{...classified,data:publicData(classified.data,0,[...requestSecrets,...client.redactionValues(session,{q,name})].sort((a,b)=>b.length-a.length)),scanContextId:id}});
          return true;
        }
        const requestTokens = session.tokens;
        const requestSecrets = client.redactionValues(session, prepared.body);
        const swaplottingTicket=swaplottingSession.beginRead(prepared,session);
        const berkasRatingTicket=berkasRatingSession.beginRead(prepared,session);
        const berkasQuestionTicket=berkasQuestionSession.beginRead(prepared,session);
        const berkasRatingDetailTicket=Object.hasOwn(input,'berkasRatingSourceId')?berkasRatingSession.beginDetail(prepared,input.berkasRatingSourceId,session):null;
        let result = await client.request({ base: prepared.service.baseUrl, path: prepared.path, query: prepared.query, method: prepared.method, encoding: prepared.encoding, body: prepared.body, files: input.files, auth: prepared.auth, session, clientProfile: prepared.clientProfile, scanContextValidated:prepared.scanContextValidated, scanMapContextValidated:prepared.scanMapContextValidated });
        assertCurrentSession();
        if (context.scanContext && resolveScanContext(session,input,values) !== context.scanContext) throw new ApiError(409,'SCAN_CONTEXT_INVALID','Konteks Scan berubah. Pindai ulang kode.');
        if (requestTokens && !session.tokens) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berubah saat permintaan berlangsung. Silakan masuk kembali.');
        queueReader.observe(prepared, result, session);
        bookingSession.observe(prepared,result,session);
        result=swaplottingSession.observe(prepared,result,session,swaplottingTicket);
        result=berkasQuestionSession.observe(result,session,berkasQuestionTicket);
        result=berkasRatingSession.observeList(prepared,result,session,berkasRatingTicket);
        if(berkasRatingDetailTicket)result=berkasRatingSession.observeDetail(result,session,berkasRatingDetailTicket);
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
          json(res, 200, { ok: true, operationId: input.operationId, result: { status: result.status, contentType: result.contentType, data: publicData(result.data, 0, responseSecrets),...swaplottingSource(result),...berkasRatingSources(result),...(result.berkasQuestionContext?{berkasQuestionContext:result.berkasQuestionContext}:{}) } });
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
