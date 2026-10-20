import { MAIN_ORIGIN } from './configuration.mjs';
import { randomUUID } from 'node:crypto';
import { createHttpsTransport } from './https-transport.mjs';
import { clearAuthentication } from './session.mjs';
import { decodeNewsEnvelope } from './news-response.mjs';
import { decodeUserCollectionEnvelope, decodePersilCollectionGroupEnvelope, decodeCollectionMutationEnvelope } from './collection-response.mjs';
import { decodeUserActivityEnvelope } from './activity-response.mjs';

const collectionDeletePrefixes = ['Collection/DeletePersilCollectionGroup/', 'Collection/DeletePersilCollectionFromGroup/', 'Collection/DeleteCollectionPersil/', 'Collection/DeleteCollectionBerkas/'];
const idSegment = value => encodeURIComponent(value.toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());

export class ApiError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}
export const ALLOWED_ORIGINS = new Set([
  'https://sentuh.atrbpn.go.id', 'https://aplikasi.atrbpn.go.id',
  'https://antre.atrbpn.go.id', 'https://sipenta.atrbpn.go.id',
  'https://sentuhnotif.atrbpn.go.id', 'https://bhumi.atrbpn.go.id',
]);
const secretKey = /(?:password|authorization|access.?token|refresh.?token|fcm.?token|^token$|auth.?key|secret|credential)/i;
export function publicData(value, depth = 0, secrets = []) {
  if (depth > 15) return '[kedalaman data dibatasi]';
  if (typeof value === 'string') {
    for (const secret of secrets) if (typeof secret === 'string' && secret.length) value = value.split(secret).join('[REDACTED]');
    return value.replace(/\b(?:Bearer|AtrBpn|Basic)\s+\S+/gi, '[REDACTED]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]');
  }
  if (Array.isArray(value)) return value.map(item => publicData(item, depth + 1, secrets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['__proto__', 'prototype', 'constructor'].includes(key)).map(([key, item]) => [key, secretKey.test(key) ? '[REDACTED]' : publicData(item, depth + 1, secrets)]));
  return value;
}
export function upstreamUrl(base, relative, query = {}) {
  const baseUrl = new URL(base);
  if (!ALLOWED_ORIGINS.has(baseUrl.origin) || baseUrl.username || baseUrl.password || baseUrl.protocol !== 'https:') throw new ApiError(409, 'SERVICE_NOT_READY', 'Layanan ini belum memiliki konfigurasi yang didukung.');
  if (typeof relative !== 'string' || relative.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(relative) || relative.includes('\\') || relative.split(/[/?#]/).includes('..')) throw new ApiError(400, 'INVALID_PATH', 'Path operasi tidak valid.');
  const url = new URL(relative.replace(/^\/+/, ''), baseUrl.href.endsWith('/') ? baseUrl : new URL(`${baseUrl.href}/`));
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(baseUrl.pathname)) throw new ApiError(400, 'INVALID_PATH', 'Path operasi tidak valid.');
  for (const [key, value] of Object.entries(query || {})) {
    if (Array.isArray(value) || (value !== null && typeof value === 'object')) throw new ApiError(409, 'QUERY_SHAPE_UNSUPPORTED', 'Bentuk query bersarang belum didukung.');
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url;
}
export async function fetchTransport(url, init) {
  return fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
}
const networkStages = new Map([
  ...['ENOTFOUND', 'EAI_AGAIN'].map(code => [code, 'dns']),
  ...['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].map(code => [code, 'tcp']),
  ...['CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'INVALID_CA', 'ERR_TLS_CERT_ALTNAME_INVALID', 'ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED', 'ERR_SSL_WRONG_VERSION_NUMBER', 'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE', 'ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION', 'ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC', 'ERR_SSL_TLSV13_ALERT_CERTIFICATE_REQUIRED', 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA'].map(code => [code, 'tls']),
  ['UND_ERR_HEADERS_TIMEOUT', 'response_headers'], ['UND_ERR_BODY_TIMEOUT', 'response_body'],
  ['ECONNRESET', null], ['EPIPE', null], ['UND_ERR_SOCKET', null], ['EPROTO', null], ['REQUEST_TIMEOUT', null], ['REQUEST_ABORTED', null],
]);
function networkFailure(error, currentStage) {
  // Only known symbolic codes survive. Never inspect/log error.message, stack,
  // request options, TLS certificate contents or arbitrary cause properties.
  const pending = [error]; const seen = new Set(); let timedOut = false; let aborted = false;
  for (let index = 0; index < pending.length && index < 8; index++) {
    const item = pending[index];
    if (!item || typeof item !== 'object' || seen.has(item)) continue;
    seen.add(item);
    if (networkStages.has(item.code)) return { networkCode: item.code, stage: networkStages.get(item.code) || currentStage };
    timedOut ||= item.name === 'TimeoutError'; aborted ||= item.name === 'AbortError';
    if (item.cause) pending.push(item.cause);
    if (Array.isArray(item.errors)) pending.push(...item.errors.slice(0, 4));
  }
  return { networkCode: timedOut ? 'REQUEST_TIMEOUT' : aborted ? 'REQUEST_ABORTED' : 'NETWORK_ERROR', stage: currentStage };
}
function networkMessage({ stage, networkCode }) {
  if (stage === 'dns') return 'Nama server tidak dapat ditemukan (DNS). Periksa koneksi dan DNS komputer/container.';
  if (stage === 'tls') return 'Verifikasi koneksi TLS ke server gagal. Sertifikat tetap diverifikasi; koneksi tidak dilanjutkan.';
  if (stage === 'tcp') return networkCode.includes('TIME') ? 'Koneksi TCP ke server melewati batas waktu.' : 'Koneksi TCP ke server gagal. Periksa jaringan atau ketersediaan server.';
  if (networkCode.includes('TIMEOUT')) return stage === 'response_body' ? 'Waktu tunggu terlampaui saat menerima isi respons server.' : stage === 'response_headers' ? 'Waktu tunggu terlampaui sebelum header respons server diterima.' : 'Batas waktu permintaan terlampaui sebelum respons diterima; tahap jaringan belum diketahui.';
  if (stage === 'response_body') return 'Koneksi terputus saat menerima isi respons server.';
  return 'Permintaan jaringan ke server gagal. Gunakan ID permintaan pada log untuk pemeriksaan.';
}
async function responseBytes(response, limit = 20 * 1024 * 1024) {
  if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new ApiError(502, 'RESPONSE_TOO_LARGE', 'Respons server terlalu besar.'); }
  const chunks = []; let total = 0;
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  try { while (true) { const { value, done } = await reader.read(); if (done) break; total += value.byteLength; if (total > limit) { await reader.cancel(); throw new ApiError(502, 'RESPONSE_TOO_LARGE', 'Respons server terlalu besar.'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
export function tokensFrom(value) {
  if (!value || typeof value !== 'object' || typeof value.accessToken !== 'string' || value.accessToken.length < 1 || value.accessToken.length > 32_768 || /[\r\n]/.test(value.accessToken)) throw new ApiError(502, 'LOGIN_RESPONSE_UNRECOGNIZED', 'Respons sesi server belum sesuai kontrak yang dipulihkan.');
  const tokenType = value.tokenType;
  if (typeof tokenType !== 'string' || !/^[A-Za-z][A-Za-z0-9._-]{0,30}$/.test(tokenType)) throw new ApiError(502, 'LOGIN_RESPONSE_UNRECOGNIZED', 'Jenis token sesi belum dikenali.');
  return { tokenType, accessToken: value.accessToken,
    refreshToken: typeof value.refreshToken === 'string' && value.refreshToken.length <= 32_768 ? value.refreshToken : null,
    expiredAt: Number.isFinite(value.expiredAt) ? value.expiredAt : null };
}
export class ApiClient {
  constructor(configuration, { transport, now = Date.now, log = entry => process.stdout.write(`${JSON.stringify(entry)}\n`), clock = () => performance.now() } = {}) { this.configuration = configuration; this.transport = transport || createHttpsTransport(configuration); this.now = now; this.log = log; this.clock = clock; }
  redactionValues(session, body = {}) {
    const application = this.configuration.applicationAuthorization?.();
    return [application, application?.replace(/^\S+\s+/, ''), session?.tokens?.accessToken, session?.tokens?.refreshToken,
      ...Object.entries(body || {}).filter(([key]) => secretKey.test(key)).map(([, value]) => typeof value === 'string' ? value : null)].filter(Boolean).sort((a,b) => b.length-a.length);
  }
  async request({ base = MAIN_ORIGIN, path, query, method = 'POST', encoding = 'form', body = {}, files = [], auth = 'none', session, clientProfile = 'main' }) {
    const url = upstreamUrl(base, path, query);
    // The document map first encodes q as a URI component, then its query map
    // applies an RFC3986 encoder. Keep this endpoint-specific double encoding;
    // URLSearchParams alone also differs for '*' and '~'. See DOCUMENT-GEO-FLOW.md.
    const documentGeo = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/apis/getGeoJsonInfo';
    if (documentGeo) {
      if (path !== '/apis/getGeoJsonInfo' || clientProfile !== 'main' || method !== 'GET' || encoding !== 'none' || auth !== 'session' || files.length || Object.keys(body || {}).length || Object.keys(query || {}).length !== 1 || typeof query?.q !== 'string' || !query.q.length) throw new ApiError(409, 'DOCUMENT_GEO_SCOPE', 'Parameter lokasi dokumen tidak sesuai kontrak pembacaan.');
      const innerQ = encodeURIComponent(query.q.toWellFormed());
      url.search = 'q=' + encodeURIComponent(innerQ).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
    }
    const documentViewer = clientProfile === 'sps-document-viewer';
    const scannedDocument = clientProfile === 'main' && url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/apis/GetDocument';
    // These native read helpers consume their own envelopes. CariBerkas ignores
    // body.error; getStatusCetak returns its String message even for error:true.
    // Keep CariBerkas at HTTP200; getStatusCetak uses the shared 2xx guard.
    // Both exceptions remain limited to these audited session/form reads.
    const berkasReadForm = clientProfile === 'main' && url.origin === new URL(MAIN_ORIGIN).origin && method === 'POST' && encoding === 'form' && auth === 'session' && files.length === 0 && Object.keys(query || {}).length === 0;
    const berkasSearch = berkasReadForm && url.pathname === '/berkas/CariBerkas';
    const berkasPrintStatus = berkasReadForm && url.pathname === '/berkas/getStatusCetak';
    const collectionDecoder = url.origin === new URL(MAIN_ORIGIN).origin
      ? ({ '/collection/GetUserCollection': decodeUserCollectionEnvelope, '/collection/GetPersilCollectionGroup': decodePersilCollectionGroupEnvelope })[url.pathname]
      : undefined;
    if (collectionDecoder && (clientProfile !== 'main' || method !== 'GET' || encoding !== 'none' || auth !== 'session' || files.length || Object.keys(body || {}).length || Object.keys(query || {}).length || path !== url.pathname.slice(1) || url.search || url.hash)) throw new ApiError(409, 'COLLECTION_READ_SCOPE', 'Parameter pembacaan koleksi tidak sesuai kontrak.');
    const collectionCreate = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/Collection/AddPersilCollectionGroup';
    if (collectionCreate && (clientProfile !== 'main' || method !== 'POST' || encoding !== 'multipart' || auth !== 'session' || files.length || !body || typeof body !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(body)) || Object.keys(body).join(',') !== 'GroupName' || typeof body.GroupName !== 'string' || Object.keys(query || {}).length || path !== 'Collection/AddPersilCollectionGroup' || url.search || url.hash)) throw new ApiError(409, 'COLLECTION_CREATE_SCOPE', 'Parameter pembuatan grup tidak sesuai kontrak.');
    const collectionMove = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/Collection/AddPersilCollectionToGroup';
    if (collectionMove && (clientProfile !== 'main' || method !== 'POST' || encoding !== 'multipart' || auth !== 'session' || files.length || !body || typeof body !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(body)) || Object.keys(body).join(',') !== 'collectionGroupId,collectionId' || typeof body.collectionGroupId !== 'string' || !body.collectionGroupId.length || typeof body.collectionId !== 'string' || Object.keys(query || {}).length || path !== 'Collection/AddPersilCollectionToGroup' || url.search || url.hash)) throw new ApiError(409, 'COLLECTION_MOVE_SCOPE', 'Parameter penambahan koleksi ke grup tidak sesuai kontrak.');
    const collectionEdit = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/Collection/EditCollectionPersil';
    if (collectionEdit && (clientProfile !== 'main' || method !== 'PUT' || encoding !== 'multipart' || auth !== 'session' || files.length || !body || typeof body !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(body)) || Object.keys(body).join(',') !== 'id,caption' || typeof body.id !== 'string' || typeof body.caption !== 'string' || Object.keys(query || {}).length || path !== 'Collection/EditCollectionPersil' || url.search || url.hash)) throw new ApiError(409, 'COLLECTION_EDIT_SCOPE', 'Parameter edit caption tidak sesuai kontrak.');
    const collectionSave = url.origin === new URL(MAIN_ORIGIN).origin && ['/Collection/AddCollectionBerkas','/Collection/AddCollectionPersil'].includes(url.pathname);
    const collectionStatus = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/collection/GetCollectionId';
    if (collectionSave || collectionStatus) {
      const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
      const bodyKeys = record(body) ? Reflect.ownKeys(body) : null, queryKeys = record(query) ? Reflect.ownKeys(query) : query === undefined ? [] : null;
      const idField = url.pathname === '/Collection/AddCollectionBerkas' ? 'BerkasId' : 'PersilId';
      if (clientProfile !== 'main' || auth !== 'session' || files.length || !bodyKeys || !queryKeys || path !== url.pathname.slice(1) || (!collectionStatus && url.search) || url.hash ||
        (collectionStatus ? method !== 'GET' || encoding !== 'none' || bodyKeys.length || queryKeys.length !== 2 || queryKeys[0] !== 'id' || queryKeys[1] !== 'type' || typeof query.id !== 'string' || query.type !== 'BERKAS' : method !== 'POST' || encoding !== 'multipart' || queryKeys.length || bodyKeys.length !== 4 || bodyKeys.some((key,index) => key !== [idField,'Title','Subtitle','Nik'][index]) || ![idField,'Title','Subtitle','Nik'].every(key => typeof body[key] === 'string') || idField === 'PersilId' && body.Subtitle !== 'Lokasi Bidang')) throw new ApiError(409, collectionStatus ? 'COLLECTION_STATUS_SCOPE' : 'COLLECTION_SAVE_SCOPE', 'Parameter bookmark koleksi tidak sesuai kontrak.');
    }
    const collectionDeletePrefix = url.origin === new URL(MAIN_ORIGIN).origin && collectionDeletePrefixes.find(prefix => url.pathname.startsWith('/' + prefix) || path.startsWith(prefix) || path.startsWith('/' + prefix));
    if (collectionDeletePrefix) {
      let canonicalSegment = false;
      try {
        const segment = path.slice(collectionDeletePrefix.length), suppliedId = decodeURIComponent(segment);
        canonicalSegment = suppliedId !== '.' && suppliedId !== '..' && idSegment(suppliedId) === segment;
      } catch { /* Invalid URI components never reach the transport. */ }
      if (clientProfile !== 'main' || method !== 'DELETE' || encoding !== 'none' || auth !== 'session' || files.length || !body || typeof body !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(body)) || Object.keys(body).length || Object.keys(query || {}).length || path !== url.pathname.slice(1) || url.search || url.hash || !canonicalSegment) throw new ApiError(409, 'COLLECTION_DELETE_SCOPE', 'Parameter penghapusan koleksi tidak sesuai kontrak.');
    }
    const collectionMutation = collectionCreate || collectionMove || collectionEdit || collectionSave || Boolean(collectionDeletePrefix);
    const activityRead = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/activity/GetUserActivity';
    const activityDelete = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/activity/deleteUserActivity';
    if (activityRead || activityDelete) {
      const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
      const keys = record(body) ? Reflect.ownKeys(body) : null;
      if (clientProfile !== 'main' || auth !== 'session' || files.length || !keys || query !== undefined && (!record(query) || Reflect.ownKeys(query).length) || url.search || url.hash || path !== url.pathname.slice(1) ||
        (activityRead ? method !== 'GET' || encoding !== 'none' || keys.length : method !== 'POST' || encoding !== 'multipart' || keys.length !== 1 || keys[0] !== 'userActivityId' || typeof body.userActivityId !== 'string')) throw new ApiError(409, activityRead ? 'ACTIVITY_READ_SCOPE' : 'ACTIVITY_DELETE_SCOPE', 'Parameter aktivitas tidak sesuai kontrak layanan.');
    }
    // Dynamic group/collection IDs must not appear in connection diagnostics.
    const collectionDeleteLogPrefix = collectionDeletePrefixes.find(prefix => url.pathname.startsWith('/' + prefix));
    const diagnosticPath = collectionDeleteLogPrefix ? '/' + collectionDeleteLogPrefix + '{path_argument_1}' : url.pathname;
    const nearbyOffice = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/kantornearby/getkantornearby';
    const officeCalendar = url.origin === new URL(MAIN_ORIGIN).origin && url.pathname === '/KantorNearby/GetCalendar';
    const newsLimit = url.origin === new URL(MAIN_ORIGIN).origin ? ({ '/Berita/GetBerita': '8', '/Pengumuman/GetPengumuman': '5' })[url.pathname] : undefined;
    const newsFeed = newsLimit !== undefined;
    if (newsFeed && (clientProfile !== 'main' || method !== 'GET' || encoding !== 'none' || auth !== 'optionalSession' || files.length || Object.keys(body || {}).length || Object.keys(query || {}).length !== 1 || query?.limit !== newsLimit || path !== url.pathname.slice(1) || url.search !== `?limit=${newsLimit}` || url.hash)) throw new ApiError(409, 'NEWS_READ_SCOPE', 'Parameter pembacaan berita atau pengumuman tidak sesuai kontrak.');
    let formBody = body;
    if (nearbyOffice || officeCalendar) {
      const keys = Object.keys(body || {}).sort().join(',');
      if (clientProfile !== 'main' || method !== 'POST' || auth !== 'optionalSession' || files.length || Object.keys(query || {}).length || (nearbyOffice ? encoding !== 'json' || keys !== 'isKalender,latitude,limit,longitude,radius' || !Number.isFinite(body.latitude) || Math.abs(body.latitude) > 90 || !Number.isFinite(body.longitude) || Math.abs(body.longitude) > 180 || body.radius !== 0.1 || body.isKalender !== 1 || body.limit !== null : encoding !== 'form' || keys !== 'kantorId,tahun' || typeof body.kantorId !== 'string' || typeof body.tahun !== 'string')) throw new ApiError(409, 'OFFICE_READ_SCOPE', 'Parameter pembacaan kantor tidak sesuai kontrak.');
      if (officeCalendar) {
        if (typeof this.configuration.calendarOfficeId !== 'function') throw new ApiError(503, 'OFFICE_REFERENCE_CONFIGURATION', 'Konfigurasi referensi kalender belum tersedia.');
        try { formBody = { ...body, kantorId: this.configuration.calendarOfficeId(body.kantorId) }; }
        catch { throw new ApiError(400, 'OFFICE_REFERENCE_INVALID', 'Referensi kantor dari layanan belum dapat dibaca. Muat ulang daftar kantor.'); }
        if (typeof formBody.kantorId !== 'string' || !formBody.kantorId.length) throw new ApiError(400, 'OFFICE_REFERENCE_INVALID', 'Referensi kantor dari layanan belum dapat dibaca. Muat ulang daftar kantor.');
      }
    }
    if (!['main', 'sps-document-viewer'].includes(clientProfile) || (documentViewer && (url.origin !== new URL(MAIN_ORIGIN).origin || path !== 'dokumen/GetDokumen' || method !== 'GET' || encoding !== 'none' || auth !== 'session' || files.length || Object.keys(body || {}).length || Object.keys(query || {}).length !== 2 || !['id', 'tipe'].every(key => typeof query?.[key] === 'string' && query[key].length > 0)))) throw new ApiError(409, 'CLIENT_PROFILE_SCOPE', 'Profil transport tidak sesuai dengan kontrak operasi.');
    // SPS uses a separate HttpClient viewer, without the main LRb interceptor.
    // Keep its request free of the main client's JSON Accept/form Content-Type.
    const headers = { ...(!documentViewer ? { Accept: 'application/json' } : {}), 'User-Agent': 'Sentuh-Browser-Reconstruction/0.1' };
    const requestTokens = session?.tokens;
    let sessionAuthorized = false;
    if (auth === 'application' || auth === 'app') {
      const normalApplicationPath = url.origin === new URL(MAIN_ORIGIN).origin && !url.search && (url.pathname === '/auth/signin' || /^\/common\/[A-Za-z]+$/.test(url.pathname));
      if (!normalApplicationPath) throw new ApiError(409, 'APPLICATION_AUTH_SCOPE', 'Konfigurasi aplikasi tidak tersedia untuk operasi ini.');
      if (!this.configuration.configured) throw new ApiError(503, 'CONFIGURATION_UNAVAILABLE', this.configuration.reason);
      headers.Authorization = this.configuration.applicationAuthorization();
    } else if (auth === 'refresh') {
      if (url.origin !== new URL(MAIN_ORIGIN).origin || url.pathname !== '/auth/refresh_token' || !session?.tokens) throw new ApiError(401, 'AUTH_REQUIRED', 'Sesi tidak tersedia.');
      if (session.active === false) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi sudah ditutup.');
      headers.Authorization = `AtrBpn ${session.tokens.accessToken}`;
      sessionAuthorized = true;
    } else if (auth === 'session' || (auth === 'optionalSession' && session?.tokens)) {
      if (!session?.tokens) throw new ApiError(401, 'AUTH_REQUIRED', 'Silakan masuk dengan akun Anda.');
      if (session.active === false) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi sudah ditutup.');
      if (url.origin !== new URL(MAIN_ORIGIN).origin) throw new ApiError(409, 'TOKEN_AUDIENCE_UNVERIFIED', 'Penggunaan sesi untuk layanan ini belum dibuktikan.');
      headers.Authorization = `${session.tokens.tokenType} ${session.tokens.accessToken}`;
      sessionAuthorized = true;
    } else if (auth !== 'none' && auth !== 'optionalSession') throw new ApiError(409, 'AUTH_MODE_UNSUPPORTED', 'Autentikasi layanan ini belum didukung.');
    if (collectionSave) {
      const storedNik = session?.user?.nomorIndukKependudukan;
      if (typeof storedNik !== 'string') throw new ApiError(409, 'SESSION_PROFILE_REQUIRED', 'NIK tidak ditemukan. Silakan login kembali.');
      if (body.Nik !== storedNik) throw new ApiError(403, 'SESSION_IDENTITY_MISMATCH', 'NIK simpan harus berasal dari sesi masuk yang aktif.');
    }
    let payload;
    if (method === 'GET' && body && Object.keys(body).length) throw new ApiError(409, 'GET_BODY_UNSUPPORTED', 'Operasi GET dengan body belum didukung; parameter tidak diubah menjadi query.');
    // Main-client LRb selects form content type for a null body without a method
    // check (0xd0d9f0..0xd0da6c). Do not extend that rule to other service clients.
    if (!documentViewer && (method === 'GET' || encoding === 'none') && url.origin === new URL(MAIN_ORIGIN).origin) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (method !== 'GET' && method !== 'HEAD') {
      if (encoding === 'json') { payload = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
      else if (encoding === 'multipart') {
        payload = new FormData();
        for (const [key, value] of Object.entries(body || {})) { if (value !== undefined && value !== null) { if (typeof value === 'object') throw new ApiError(409, 'FORM_SHAPE_UNSUPPORTED', 'Field multipart bersarang belum didukung.'); payload.append(key, String(value)); } }
        for (const { key, file } of files) {
          // This is a request filename, not the time the measurement was taken.
          const filename = url.pathname === '/geotag/UploadGeotag' && key === 'file' ? `geotag_${this.now()}.png` : file.name.replace(/[\r\n/\\]/g, '_').slice(0, 180);
          payload.append(key, file, filename);
        }
      } else if (encoding === 'form' || encoding === 'urlencoded') {
        if (berkasSearch) {
          // Dio's audited form transformer emits a present null as a bare key,
          // while an empty String has '='. URLSearchParams conflates the two.
          // Its query-component encoder also preserves '~', encodes '*', and
          // maps spaces to '+'. Keep this bounded correction on CariBerkas.
          const component = value => encodeURIComponent(String(value).toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, '+');
          const fields = [];
          for (const [key, value] of Object.entries(body || {})) {
            if (value === undefined) continue;
            if (value !== null && typeof value === 'object') throw new ApiError(409, 'FORM_SHAPE_UNSUPPORTED', 'Field form bersarang belum didukung.');
            fields.push(component(key) + (value === null ? '' : '=' + component(value)));
          }
          payload = fields.join('&');
        } else {
          payload = new URLSearchParams();
          for (const [key, value] of Object.entries(formBody || {})) { if (value !== undefined && value !== null) { if (typeof value === 'object') throw new ApiError(409, 'FORM_SHAPE_UNSUPPORTED', 'Field form bersarang belum didukung.'); payload.append(key, String(value)); } }
        }
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (encoding !== 'none') throw new ApiError(409, 'ENCODING_UNSUPPORTED', 'Encoding operasi belum didukung.');
    }
    const requestId = randomUUID(); const started = this.clock();
    // Snapshot redaction values while this request owns the credentials. A later
    // logout/refresh must not remove protection from a delayed error response.
    const requestSecrets = this.redactionValues(session, body);
    let response; let stage = 'request'; let networkCode = null; let failed = false; let authenticationError = null;
    const diagnostics = () => ({ requestId, stage, networkCode, elapsedMs: Math.max(0, Math.round(this.clock() - started)) });
    try {
    response = await this.transport(url, { method, headers, body: payload });
    if (response.status === 401 && sessionAuthorized) {
      const newerTokens = session.tokens !== requestTokens && session.active !== false && session.tokens;
      if (!newerTokens) clearAuthentication(session, requestTokens);
      authenticationError = newerTokens
        ? new ApiError(409, 'SESSION_CHANGED', 'Sesi diperbarui saat permintaan berlangsung. Silakan ulangi layanan.', { upstreamStatus: 401 })
        : new ApiError(401, 'SESSION_EXPIRED', 'Sesi ditolak oleh server. Silakan masuk kembali.', { upstreamStatus: 401 });
    }
    stage = 'response_body';
    if (response.status >= 300 && response.status < 400) { await response.body?.cancel(); throw new ApiError(502, 'UPSTREAM_REDIRECT', 'Server mengarahkan permintaan ke lokasi lain; pengalihan otomatis dinonaktifkan.'); }
    if (activityDelete) {
      // Native de6bf0 reads status only (200→true), not a typed envelope/body.
      // Discard raw browser response bytes without JSON/business-error parsing.
      // Dio's earlier transport transformation can still fail in the APK; exact
      // parity for that transformer is unproved. Network errors remain existing
      // recoverable ApiErrors; the UI controller removes locally on either normal
      // bool or non-auth failure. Never swallow 401/session ownership safeguards.
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      failed = response.status !== 200;
      return { status: response.status, data: response.status === 200, contentType: 'application/json' };
    }
    if (activityRead && response.status !== 200) {
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      throw new ApiError(response.status === 403 ? 403 : 502, 'UPSTREAM_REJECTED', 'Server belum mengembalikan daftar aktivitas.', { upstreamStatus: response.status });
    }
    if (documentViewer && response.status !== 200) {
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      throw new ApiError(response.status === 403 ? 403 : 502, 'UPSTREAM_REJECTED', 'Server menolak pengambilan dokumen.', { upstreamStatus: response.status });
    }
    if (newsFeed && response.status !== 200) {
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      throw new ApiError(response.status === 401 ? 401 : response.status === 403 ? 403 : 502, 'UPSTREAM_REJECTED', 'Server belum mengembalikan daftar berita atau pengumuman.', { upstreamStatus: response.status });
    }
    if (collectionDecoder && response.status !== 200) {
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      throw new ApiError(response.status === 401 ? 401 : response.status === 403 ? 403 : 502, 'UPSTREAM_REJECTED', 'Server belum mengembalikan koleksi.', { upstreamStatus: response.status });
    }
    if ((collectionMutation || collectionStatus) && response.status !== 200) {
      await response.body?.cancel(); stage = 'response';
      if (authenticationError) throw authenticationError;
      const message = collectionStatus ? 'Gagal memeriksa status koleksi' : collectionSave ? 'Gagal menyimpan ke koleksi' : collectionCreate ? 'Gagal menambah grup koleksi' : collectionMove ? 'Gagal menambah koleksi ke grup' : collectionEdit ? 'Gagal Memperbarui Caption' : collectionDeletePrefix === collectionDeletePrefixes[0] ? 'Gagal menghapus grup koleksi' : collectionDeletePrefix === collectionDeletePrefixes[1] ? 'Gagal menghapus koleksi dari grup' : 'Gagal menghapus koleksi';
      throw new ApiError(response.status === 403 ? 403 : 502, 'UPSTREAM_REJECTED', message, { upstreamStatus: response.status });
    }
    const bytes = await responseBytes(response);
    stage = 'response_parse';
    if (documentViewer) {
      if (bytes.length < 4 || !bytes.subarray(0, 4).equals(Buffer.from('%PDF'))) throw new ApiError(502, 'INVALID_UPSTREAM_PDF', 'Server belum mengembalikan dokumen PDF yang valid.');
      stage = 'response';
      return { status: 200, bytes, contentType: 'application/pdf', previewable: true };
    }
    // Native GetDocument accepts HTTP 200 and >200 bytes, then opens a .pdf.
    // Check the PDF prefix before MIME/JSON handling: the native byte response
    // ignores MIME. The signature check and shared 20 MiB limit are web guards,
    // not proof that the document is authentic or digitally signed.
    if (scannedDocument && response.status === 200 && bytes.length > 200 && bytes.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      stage = 'response';
      return { status: 200, bytes, contentType: 'application/pdf', previewable: true };
    }
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    let data;
    if (contentType.includes('json') || /^[\s]*[\[{]/.test(bytes.subarray(0, 100).toString('utf8'))) {
      try { data = JSON.parse(bytes.toString('utf8')); } catch { if (response.ok) throw new ApiError(502, 'INVALID_UPSTREAM_JSON', 'Format respons server belum dikenali.'); }
    }
    stage = 'response';
    if (activityRead) {
      try { data = decodeUserActivityEnvelope(data === undefined ? bytes.toString('utf8') : data); }
      catch { throw new ApiError(502, 'ACTIVITY_RESPONSE_UNRECOGNIZED', 'Respons aktivitas belum sesuai kontrak layanan.'); }
      return { status: 200, data, contentType };
    }
    if (newsFeed) {
      // Decode the String body once after the usual HTTP JSON transformation,
      // then keep only the five nullable String fields consumed by the APK.
      // Unknown envelope flags and extras do not change native list acceptance.
      try { data = decodeNewsEnvelope(data === undefined ? bytes.toString('utf8') : data); }
      catch { throw new ApiError(502, 'NEWS_RESPONSE_UNRECOGNIZED', 'Respons berita atau pengumuman belum sesuai kontrak layanan.'); }
      return { status: 200, data, contentType };
    }
    if (collectionDecoder || collectionMutation || collectionStatus) {
      // These services use the tuple transport flag, not envelope.error.
      // Only a typed HTTP200 Map may bypass the generic business-error guard.
      try { data = (collectionDecoder || decodeCollectionMutationEnvelope)(data); }
      catch { throw new ApiError(502, 'COLLECTION_RESPONSE_UNRECOGNIZED', 'Respons koleksi belum sesuai kontrak layanan.'); }
      return { status: 200, data, contentType };
    }
    const nativeBerkasEnvelope = (berkasSearch && response.status === 200) || (berkasPrintStatus && response.ok);
    if (!response.ok || (data?.error === true && !nativeBerkasEnvelope && !nearbyOffice && !officeCalendar)) {
      const status = response.status === 401 ? 401 : response.status === 403 ? 403 : 502;
      const details = { upstreamStatus: response.status };
      const candidate = data && typeof data === 'object' ? { code: data.code ?? data.error?.code, message: data.message ?? data.error?.message } : {};
      for (const key of ['code', 'message']) {
        const raw = candidate[key];
        if (!['string', 'number'].includes(typeof raw)) continue;
        const text = String(raw);
        // JSON diagnostic fields only; never return HTML, stack traces or headers.
        if (/<[^>]*>|\n\s*at\s|Traceback|StackTrace/i.test(text)) continue;
        details[key] = publicData(text, 0, requestSecrets).replace(/[\r\n\t]+/g, ' ').slice(0, key === 'code' ? 100 : 400);
      }
      if (authenticationError) { authenticationError.details = details; throw authenticationError; }
      throw new ApiError(status, 'UPSTREAM_REJECTED', 'Server menolak permintaan. Periksa akun, izin, dan ketentuan layanan.', details);
    }
    if (documentGeo) {
      if (response.status !== 200) throw new ApiError(502, 'UPSTREAM_REJECTED', 'Server belum mengembalikan lokasi dokumen.', { upstreamStatus: response.status });
      if (data === undefined) throw new ApiError(502, 'INVALID_UPSTREAM_JSON', 'Format respons lokasi dokumen belum dikenali.');
    }
    if (scannedDocument) throw new ApiError(502, 'INVALID_UPSTREAM_PDF', 'Server belum mengembalikan dokumen PDF yang valid.');
    if (data !== undefined) return { status: response.status, data, contentType };
    if (/^(application\/pdf|image\/(png|jpeg|webp)|application\/octet-stream)(;|$)/i.test(contentType)) return { status: response.status, bytes, contentType };
    return { status: response.status, data: { text: publicData(bytes.toString('utf8').slice(0, 50_000)) }, contentType };
    } catch (error) {
      failed = true;
      if (authenticationError) { authenticationError.details = { ...authenticationError.details, ...diagnostics() }; throw authenticationError; }
      if (error instanceof ApiError) { error.details = { ...error.details, ...diagnostics() }; throw error; }
      if (error?.code === 'REQUEST_BODY_TOO_LARGE') throw new ApiError(413, 'REQUEST_BODY_TOO_LARGE', 'Ukuran kiriman melebihi batas transport.', diagnostics());
      const failure = networkFailure(error, stage); stage = failure.stage; networkCode = failure.networkCode;
      throw new ApiError(502, 'UPSTREAM_UNREACHABLE', networkMessage(failure), diagnostics());
    } finally {
      // One structured transport result. URL search/hash, headers, body, profile,
      // credentials and arbitrary error text are intentionally never logged.
      const status = Number.isInteger(response?.status) && response.status >= 100 && response.status <= 599 ? response.status : null;
      try { this.log({ event: failed ? 'upstream_fail' : 'upstream_finish', ...diagnostics(), status, hostname: url.hostname, path: diagnosticPath }); } catch { /* Logging must not change request outcome. */ }
    }
  }
  async signIn(username, password) {
    const result = await this.request({ path: 'auth/signin', auth: 'application', body: { devicePlatform: 'android', username, password } });
    const profile = result.data?.data;
    if (!profile || typeof profile !== 'object' || typeof profile.username !== 'string') throw new ApiError(502, 'LOGIN_RESPONSE_UNRECOGNIZED', 'Respons login server belum sesuai kontrak yang dipulihkan.');
    const tokens = tokensFrom(profile.token);
    const user = Object.fromEntries(['username', 'email', 'nomorIndukKependudukan', 'userLevel', 'isParticipatoryMapper', 'roleUser'].filter(key => ['string', 'number', 'boolean'].includes(typeof profile[key])).map(key => [key, profile[key]]));
    return { user, tokens };
  }
  async ensureFresh(session) {
    if (session?.active === false) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi sudah ditutup.');
    if (!session?.tokens) throw new ApiError(401, 'AUTH_REQUIRED', 'Silakan masuk dengan akun Anda.');
    const expires = session.tokens.expiredAt;
    if (expires === null || (expires > 1e12 ? expires : expires * 1000) > this.now() + 15_000) return;
    if (!session.tokens.refreshToken) { clearAuthentication(session); throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi berakhir. Silakan masuk kembali.'); }
    if (!session.refreshing) {
      const refreshTokens = session.tokens;
      session.refreshing = (async () => {
        const result = await this.request({ path: 'auth/refresh_token', auth: 'refresh', session, body: { refreshToken: refreshTokens.refreshToken } });
        if (session.active === false || !session.tokens) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi sudah ditutup.');
        if (session.tokens !== refreshTokens) throw new ApiError(409, 'SESSION_CHANGED', 'Sesi diperbarui saat permintaan berlangsung. Silakan ulangi layanan.');
        session.tokens = tokensFrom(result.data?.data);
      })().finally(() => { session.refreshing = null; });
    }
    await session.refreshing;
  }
}
