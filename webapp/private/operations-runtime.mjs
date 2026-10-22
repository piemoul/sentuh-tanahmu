// Appended to generated operationData/serviceData by build-operations.py.
import {prepareSelectedReviewPostValues} from './lost-review-post.mjs';
import {MITRA_READS,prepareMitraQuery} from './mitra-response.mjs';
import {RATING_PPAT_READ_ID,RATING_PPAT_READ_PATH,prepareRatingPpatRead} from './rating-ppat-response.mjs';
import {RATING_PPAT_POST_ID,RATING_PPAT_POST_PATH,prepareRatingPpatPostValues} from './rating-ppat-post.mjs';
import {QUEUE_BOOKING_LIMIT_ID,QUEUE_BOOKING_LIMIT_PATH,prepareQueueBookingReview} from './queue-booking-models.mjs';
import {SWAPLOTTING_POSTS,swaplottingExact} from './swaplotting-post.mjs';
import {BERKAS_RATING_ID,BERKAS_RATING_PATH,prepareBerkasRatingInput} from './berkas-rating-post.mjs';
import {GUESTBOOK_POST_ID,GUESTBOOK_POST_PATH,prepareGuestbookPostInput} from './guestbook-post.mjs';
import {YURIDIS_READ_ID,YURIDIS_PATH,YURIDIS_REVIEW_ID,YURIDIS_REVIEW_PATH,prepareYuridisFeed,prepareYuridisLastReview} from './yuridis-response.mjs';
function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}
export const SERVICES = freezeDeep(serviceData);
export const OPERATIONS = freezeDeep(operationData);
const byId = new Map(OPERATIONS.map(operation => [operation.id, operation]));
const collectionDeletePaths = Object.freeze({
  'delete-collection-deletepersilcollectiongroup-path-argument-1-da9450': 'Collection/DeletePersilCollectionGroup/',
  'delete-collection-deletepersilcollectionfromgroup-path-argument-1-da7d60': 'Collection/DeletePersilCollectionFromGroup/',
  'delete-collection-deletecollectionpersil-path-argument-1-da7530': 'Collection/DeleteCollectionPersil/',
  'delete-collection-deletecollectionberkas-path-argument-1-d92888': 'Collection/DeleteCollectionBerkas/',
});
export function getOperation(id) { return byId.get(id) ?? null; }
export function getPublicCatalog() {
  return OPERATIONS.map(({ evidence, recoveredTransport, serviceMapping, ...operation }) => structuredClone({
    ...operation,
    fields: operation.fields.map(({ sessionEvidence, ...field }) => field),
  }));
}
function fail(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.statusCode = status;
  throw error;
}
function sessionValue(context, key) {
  const user = context.user ?? {};
  if (key === 'nik') return context.nik ?? user.nomorIndukKependudukan ?? user.nik ?? user.Nik;
  if (key === 'username') return context.username ?? user.username;
  if (key === 'tipeuser') return context.tipeuser ?? user.roleUser ?? user.tipeuser;
  return undefined;
}
function validateValue(field, value, operationId) {
  if (field.type === 'array') {
    // This is the only executable nested model. Do not turn the registry into
    // a generic JSON passthrough for unrecovered objects or other operations.
    if (operationId !== 'post-infolayanan-simulasitipe2-da3490' || field.path !== 'data' || field.arraySchema !== 'information-simulation-type2') fail('FIELD_SHAPE_UNSUPPORTED', 'Model bertingkat ini belum didukung oleh adapter.');
    if (!Array.isArray(value) || value.length < field.minItems || value.length > field.maxItems) fail('INVALID_FIELD', `${field.label} harus berisi ${field.minItems} sampai ${field.maxItems} baris.`);
    const fields = field.items.fields;
    const keys = new Set(fields.map(item => item.path));
    return Array.from({ length: value.length }, (_, index) => {
      if (!Object.hasOwn(value, index)) fail('INVALID_FIELD', `${field.label} tidak boleh memiliki baris kosong.`);
      const row = value[index];
      if (!row || typeof row !== 'object' || Array.isArray(row) || ![Object.prototype, null].includes(Object.getPrototypeOf(row))) fail('INVALID_FIELD', `${field.label} baris ${index + 1} harus berbentuk objek.`);
      if (Reflect.ownKeys(row).some(key => typeof key !== 'string' || !keys.has(key))) fail('UNKNOWN_FIELD', `${field.label} baris ${index + 1} mengandung field di luar kontrak.`);
      const prepared = Object.create(null);
      for (const child of fields) {
        if (!Object.hasOwn(row, child.path) || row[child.path] == null || row[child.path] === '' && !child.allowEmpty) fail('FIELD_REQUIRED', `${child.label} pada baris ${index + 1} diperlukan.`);
        prepared[child.path] = validateValue(child, row[child.path], operationId);
      }
      return prepared;
    });
  }
  if (field.strictString && typeof value !== 'string') fail('INVALID_FIELD', `${field.label} harus berupa teks.`);
  if (field.type === 'boolean') {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    fail('INVALID_FIELD', `${field.label} harus bernilai benar atau salah.`);
  }
  if (field.type === 'number' || field.type === 'integer') {
    if (field.strictNumber && typeof value !== 'number') fail('INVALID_FIELD', `${field.label} harus berupa angka JSON.`);
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') fail('INVALID_FIELD', `${field.label} harus berupa angka.`);
    const n = Number(value);
    if (!Number.isFinite(n) || (field.type === 'integer' && !Number.isInteger(n))) fail('INVALID_FIELD', `${field.label} bukan angka yang valid.`);
    if (field.minimum != null && n < field.minimum || field.maximum != null && n > field.maximum) fail('INVALID_FIELD', `${field.label} berada di luar rentang yang didukung.`);
    return n;
  }
  if (typeof value !== 'string' && typeof value !== 'number') fail('INVALID_FIELD', `${field.label} harus berupa teks.`);
  const text = String(value);
  if (text.length > 16000 || text.includes('\0')) fail('INVALID_FIELD', `${field.label} terlalu panjang atau mengandung karakter yang tidak didukung.`);
  if (field.format === 'decimal-coordinate') {
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) fail('INVALID_COORDINATE', `${field.label} harus berupa angka desimal tanpa pemisah ribuan.`);
    const max = field.path === 'Lat' ? 90 : 180;
    if (Math.abs(Number(text)) > max) fail('INVALID_COORDINATE', `${field.label} berada di luar rentang koordinat.`);
  }
  return text;
}
/** Prepare only allowlisted values. No network access or credentials belong here.
 * Actual multipart file objects are separately validated/attached by the backend.
 */
export function prepareOperation(id, params = {}, context = {}) {
  const operation = getOperation(id);
  if (!operation) fail('UNKNOWN_OPERATION', 'Operasi tidak ditemukan.', 404);
  if (operation.readiness === 'dedicated_login') fail('DEDICATED_LOGIN_REQUIRED', operation.reason, 422);
  if (!operation.enabled) fail('OPERATION_INSPECT_ONLY', operation.reason, 422);
  if (operation.auth === 'session' && !context.authenticated) fail('LOGIN_REQUIRED', 'Masuk dengan akun Anda untuk menjalankan operasi ini.', 401);
  if (operation.auth === 'application' && !context.applicationConfigured) fail('APPLICATION_AUTH_UNAVAILABLE', 'Konfigurasi autentikasi layanan wilayah belum tersedia di server lokal.', 503);
  if (!params || typeof params !== 'object' || Array.isArray(params)) fail('INVALID_PARAMETERS', 'Parameter harus berbentuk objek.');
  if(operation.id===GUESTBOOK_POST_ID){
    const input=prepareGuestbookPostInput(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:GUESTBOOK_POST_PATH,query:{},body:{},guestbookPostInput:Object.freeze({contextId:input.contextId,...input.fields}),encoding:'multipart',auth:'session',clientProfile:'guestbook-post',effect:'write',files:[],requiresConfirmation:true};
  }
  const swaplottingKind=Object.keys(SWAPLOTTING_POSTS).find(kind=>SWAPLOTTING_POSTS[kind].id===operation.id);
  if(operation.id===BERKAS_RATING_ID){
    const berkasRatingInput=prepareBerkasRatingInput(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:BERKAS_RATING_PATH,query:{},body:{},berkasRatingInput,encoding:'multipart',auth:'session',clientProfile:'berkas-rating-post',effect:'write',files:[],requiresConfirmation:true};
  }
  if(swaplottingKind){
    try{swaplottingExact(params,['reviewId']);}catch{fail('SWAPLOTTING_SUBMIT_SCOPE','Pengiriman hanya menerima ringkasan formulir sesi ini.');}
    if(typeof params.reviewId!=='string'||!/^sr_[A-Za-z0-9_-]{32}$/.test(params.reviewId))fail('SWAPLOTTING_SUBMIT_SCOPE','Ringkasan formulir sesi belum tersedia.');
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:SWAPLOTTING_POSTS[swaplottingKind].path,query:{},body:{},swaplottingKind,swaplottingReviewId:params.reviewId,encoding:'multipart',auth:'session',clientProfile:'swaplotting-post',effect:'write',files:[],requiresConfirmation:true};
  }
  if(operation.id===QUEUE_BOOKING_LIMIT_ID){
    let queueBookingReview;
    try{queueBookingReview=prepareQueueBookingReview(params);}catch{fail('QUEUE_BOOKING_REVIEW_SCOPE','Pilih konteks ketersediaan sesi, loket, jumlah berkas dan zona waktu browser yang didukung.');}
    return {operation,service:SERVICES.directus,serviceId:'directus',method:'POST',path:QUEUE_BOOKING_LIMIT_PATH,query:{},body:{},queueBookingReview,encoding:'json',auth:'session',clientProfile:'queue-booking',effect:'write',files:[],requiresConfirmation:true};
  }
  if(operation.id===RATING_PPAT_READ_ID){
    prepareRatingPpatRead(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:RATING_PPAT_READ_PATH,query:{},body:{},encoding:'none',auth:'session',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  if(operation.id===RATING_PPAT_POST_ID){
    const body=prepareRatingPpatPostValues(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:RATING_PPAT_POST_PATH,query:{},body,encoding:'json',auth:'session',clientProfile:'main',effect:'write',files:[],requiresConfirmation:true};
  }
  if(operation.id===YURIDIS_READ_ID){
    const query=prepareYuridisFeed(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:YURIDIS_PATH,query,body:{},encoding:'none',auth:'optionalSession',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  if(operation.id===YURIDIS_REVIEW_ID){
    const body=prepareYuridisLastReview(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:YURIDIS_REVIEW_PATH,query:{},body,encoding:'form',auth:'session',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  const allowed = new Map(operation.fields.map(field => [field.path, field]));
  for (const key of Object.keys(params)) {
    if (!allowed.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('UNKNOWN_FIELD', `Parameter ${key} tidak termasuk kontrak operasi.`);
    if (allowed.get(key).type === 'file') fail('FILE_TRANSPORT_REQUIRED', 'Kirim file melalui multipart, bukan nilai JSON.');
  }
  if (Object.hasOwn(MITRA_READS,operation.path)) {
    const query=prepareMitraQuery(operation.path,params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:operation.path,query,body:{},encoding:'none',auth:'optionalSession',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  if (operation.id === 'post-review-post-deb030') {
    const body=prepareSelectedReviewPostValues(params);
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:'review/post',query:{},body,encoding:'multipart',auth:'session',clientProfile:'main',effect:'write',files:[],requiresConfirmation:true};
  }
  if (operation.id === 'post-review-all-dace58') {
    if (![Object.prototype,null].includes(Object.getPrototypeOf(params)) || Reflect.ownKeys(params).some(key=>typeof key!=='string'||!allowed.has(key))) fail('LOST_REVIEW_READ_SCOPE','Parameter ulasan pengumuman tidak sesuai kontrak pembacaan.');
    const body=Object.create(null);
    for (const field of operation.fields) {
      const descriptor=Object.getOwnPropertyDescriptor(params,field.path);
      if (descriptor && !Object.hasOwn(descriptor,'value')) fail('INVALID_FIELD',`${field.label} harus berupa nilai teks langsung.`);
      if (field.source==='constant') {
        if (descriptor && descriptor.value!==field.default) fail('FIXED_FIELD',`${field.label} ditetapkan oleh kontrak yang diaudit.`);
        body[field.path]=field.default;
      } else {
        if (!descriptor || descriptor.value===null || descriptor.value===undefined) fail('FIELD_REQUIRED','ID konten ulasan harus berasal dari record pengumuman terpilih.');
        body[field.path]=validateValue(field,descriptor.value,operation.id);
      }
    }
    return {operation,service:SERVICES.main,serviceId:'main',method:'POST',path:'review/all',query:{},body,encoding:'form',auth:'session',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  if (operation.id === 'get-bukutamu-d28bf4') {
    // Local session eligibility is separate from the standalone upstream
    // application's Authorization header. Neither query value is an account ID
    // inferred from sign-in; both come from the office QR caller.
    if (![Object.prototype,null].includes(Object.getPrototypeOf(params)) || Reflect.ownKeys(params).length!==2 || !['uid','unid'].every(key=>Object.hasOwn(params,key)&&Object.hasOwn(Object.getOwnPropertyDescriptor(params,key),'value')&&typeof params[key]==='string')) fail('GUESTBOOK_READ_SCOPE','Parameter QR Buku Tamu harus berupa dua nilai teks.',400);
    const query=Object.fromEntries(operation.fields.map(field=>[field.path,validateValue(field,params[field.path],operation.id)]));
    return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:'bukutamu',query,body:{},encoding:'none',auth:'session',clientProfile:'guestbook-read',effect:'read',files:[],requiresConfirmation:false};
  }
  if (operation.id === 'post-perurilivenesssdk-validatektpdatav2-da9a78') {
    // OEb's five nullable Strings are copied in this fixed order. The native
    // service substitutes '' for null without trimming or reading sign-in NIK.
    if (![Object.prototype, null].includes(Object.getPrototypeOf(params)) || Reflect.ownKeys(params).some(key => typeof key !== 'string' || !allowed.has(key))) fail('INVALID_PARAMETERS', 'Parameter identitas harus berupa objek dengan lima field yang didukung.');
    const body = Object.create(null);
    for (const field of operation.fields) {
      const descriptor = Object.getOwnPropertyDescriptor(params, field.path);
      if (descriptor && !Object.hasOwn(descriptor, 'value')) fail('INVALID_FIELD', `${field.label} harus berupa nilai teks langsung.`);
      body[field.path] = validateValue(field, descriptor?.value ?? '', operation.id);
    }
    return {operation, service:SERVICES.main, serviceId:'main', method:'POST', path:operation.path, query:{}, body, encoding:'multipart', auth:'session', clientProfile:'main', effect:'write', files:[], requiresConfirmation:true};
  }
  if (['get-legacy-wilayah-d752bc','get-legacy-getpersilid-d74e4c','get-legacy-getpersilidbynibel-d74b90'].includes(operation.id)) {
    if (![Object.prototype,null].includes(Object.getPrototypeOf(params)) || Reflect.ownKeys(params).some(key => typeof key !== 'string' || !allowed.has(key))) fail('INVALID_PARAMETERS','Parameter pencarian bidang harus berupa objek dengan field yang didukung.');
    const query=Object.create(null);
    for (const field of operation.fields) {
      const descriptor=Object.getOwnPropertyDescriptor(params,field.path);
      if (descriptor && !Object.hasOwn(descriptor,'value')) fail('INVALID_FIELD',`${field.label} harus berupa nilai teks langsung.`);
      const value=field.source==='constant'?field.default:descriptor?.value;
      if (field.source==='constant' && descriptor && descriptor.value!==field.default) fail('FIXED_FIELD',`${field.label} ditetapkan oleh kontrak yang diaudit.`);
      if (value==null || value==='' && !field.allowEmpty) fail('FIELD_REQUIRED',`${field.label} diperlukan oleh adapter pencarian bidang.`);
      query[field.path]=validateValue(field,value,operation.id);
    }
    if (operation.id==='get-legacy-getpersilid-d74e4c' && (!['1','2','3','4','5','8'].includes(query.jenishak) || !['2','5'].includes(query.jenishak) && query.wilayahid==='')) fail('INVALID_PARCEL_SELECTION','Pilih jenis hak dan wilayah sesuai form pencarian bidang.');
    if (operation.id==='get-legacy-getpersilidbynibel-d74b90' && query.nibel.length<14) fail('INVALID_PARCEL_SELECTION','NIBEL harus berisi minimal 14 karakter sesuai form native.');
    return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:operation.path,query,body:{},encoding:'none',auth:'session',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false};
  }
  const scanClassification = operation.id === 'post-apis-scandocument-d42440';
  const scanMap = ['post-apis-getpbteldetail-d3d134','post-apis-getkkprdetail-d311e8'].includes(operation.id);
  const scanDocument = scanMap || ['post-apis-getdocument-d41ee8','post-apis-getdocumenttype-d417d4','get-apis-getgeojsoninfo-d39f1c'].includes(operation.id);
  if (scanClassification || context.scanContext) {
    if (!scanClassification && !scanDocument) fail('SCAN_CONTEXT_SCOPE', 'Konteks Scan hanya berlaku untuk pembacaan dokumen, metadata dan lokasi dokumen.', 409);
    if (Object.hasOwn(params, 'name')) fail('SCAN_PROFILE_OVERRIDE', 'Nama Scan berasal dari profil sesi dan tidak menerima input browser.', 403);
    if (!Object.hasOwn(params, 'q') || typeof params.q !== 'string') fail('FIELD_REQUIRED', 'Kode Scan harus disediakan sebagai String, termasuk bila kosong.');
    const q = validateValue({ ...allowed.get('q'), strictString:true, allowEmpty:true }, params.q, operation.id);
    const body = {q};
    if (context.scanContext) {
      if (context.scanContext.q !== q || typeof context.scanContext.name !== 'string') fail('SCAN_CONTEXT_INVALID', 'Kode tidak cocok dengan konteks Scan sesi ini.', 409);
      if (operation.id === 'post-apis-getdocument-d41ee8') body.name = context.scanContext.name;
    }
    if (operation.id === 'get-apis-getgeojsoninfo-d39f1c') return {operation,service:SERVICES.main,serviceId:'main',method:'GET',path:operation.path,query:{q},body:{},encoding:'none',auth:'session',clientProfile:'main',effect:'read',files:[],requiresConfirmation:false,scanContextValidated:true};
    return { operation, service:SERVICES.main, serviceId:'main', method:'POST', path:operation.path, query:{}, body, encoding:'form', auth:'session', clientProfile:'main', effect:operation.effect, files:[], requiresConfirmation:operation.requiresConfirmation, ...(scanMap ? {scanMapContextValidated:true} : {}) };
  }
  if (Object.hasOwn(collectionDeletePaths, operation.id)) {
    if (!Object.hasOwn(params, 'path_argument_1') || params.path_argument_1 == null) fail('FIELD_REQUIRED', 'ID untuk aksi koleksi harus disediakan secara eksplisit.');
    const suppliedId = validateValue(operation.fields[0], params.path_argument_1, operation.id);
    if (suppliedId === '.' || suppliedId === '..') fail('INVALID_FIELD', 'ID tidak boleh berupa segmen dot-path.');
    // A browser adapter guard: keep every supplied ID inside one path segment.
    // The APK interpolates the raw ID; final native transport escaping is unproved.
    const segment = encodeURIComponent(suppliedId.toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
    return { operation, service: SERVICES.main, serviceId: 'main', method: 'DELETE', path: collectionDeletePaths[operation.id] + segment, query: {}, body: {}, encoding: 'none', auth: 'session', clientProfile: 'main', effect: 'write', files: [], requiresConfirmation: true };
  }
  if (operation.clientProfile === 'queue-read') {
    const prerequisite={'get-items-kantor-d1fa00':'offices','get-items-lokasi-d8a0dc':'locations','get-api-antrian-d89cb4':'availability'}[operation.id];
    if(prerequisite){
      const expected=prerequisite==='offices'?[]:prerequisite==='locations'?['filter[kantor]']:['lokasi','tanggal'];
      if(Reflect.ownKeys(params).length!==expected.length||expected.some(key=>!Object.hasOwn(params,key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(params,key),'value')||typeof params[key]!=='string'||!params[key].trim()||params[key].length>1024||!params[key].isWellFormed()||/[\u0000-\u001f\u007f-\u009f]/.test(params[key])))fail('QUEUE_PREREAD_INPUT','Pilih referensi antrean yang tersedia dan tanggal yang valid.',400);
      if(prerequisite==='availability'&&!/^\d{4}-\d{2}-\d{2}$/.test(params.tanggal))fail('QUEUE_DATE_INVALID','Tanggal antrean harus memakai yyyy-MM-dd.',400);
      return {operation,service:SERVICES.directus,serviceId:'directus',method:'GET',path:operation.path,queuePrerequisite:prerequisite,queueOfficeId:params['filter[kantor]'],queueLocationId:params.lokasi,queueDate:params.tanggal,query:{},body:{},encoding:'none',auth:'session',clientProfile:'queue-read',effect:'read',files:[],requiresConfirmation:false};
    }
    const detail = operation.id === 'get-api-antrian-path-argument-1-d1e130';
    if (!detail && !['get-api-antrian-saya-d1eb1c','get-api-notifikasi-d22468'].includes(operation.id)) fail('QUEUE_READ_SCOPE', 'Operasi antrean tidak sesuai kontrak.', 409);
    const queueId = detail ? params.path_argument_1 : undefined;
    if (detail && (typeof queueId !== 'string' || !queueId.length || queueId.length > 1024)) fail('INVALID_FIELD', 'ID antrean terpilih harus berupa teks yang tersedia.');
    const path = detail ? 'api/antrian/' + encodeURIComponent(queueId.toWellFormed()).replace(/%3A/gi, ':') : operation.path;
    return { operation, service: SERVICES.directus, serviceId: 'directus', method: 'GET', path, queueId, query: {}, body: {}, encoding: 'none', auth: 'session', clientProfile: 'queue-read', effect: 'read', files: [], requiresConfirmation: false };
  }
  const body = Object.create(null);
  const query = Object.create(null);
  const files = operation.fields.filter(field => field.type === 'file').map(field => ({ name: field.path, required: field.clientRequired, accept: field.accept, maxBytes: field.maxBytes }));
  for (const field of operation.fields) {
    if (field.type === 'file') continue;
    let value;
    if (field.source === 'session') {
      const storedSignInNik = field.path === 'Nik' && ['post-collection-addcollectionberkas-d92664','post-collection-addcollectionpersil-daae30'].includes(operation.id);
      if (storedSignInNik) {
        // Native cached user gyb+f, not profile ayb.nomorIdentitas or a browser
        // identity alias. Empty but nonnull String passes the native guard.
        if (Object.hasOwn(params, field.path)) fail('SESSION_IDENTITY_MISMATCH', 'NIK simpan berasal dari sesi masuk dan tidak menerima input browser.', 403);
        value = context.user?.nomorIndukKependudukan;
        if (value === undefined || value === null) fail('SESSION_PROFILE_REQUIRED', 'NIK tidak ditemukan. Silakan login kembali.', 409);
      } else {
        value = sessionValue(context, field.sessionKey);
        if (value === undefined || value === null || String(value).trim() === '') fail('SESSION_PROFILE_REQUIRED', `Profil akun belum menyediakan ${field.label}. Muat ringkasan akun terlebih dahulu.`, 409);
        if (Object.hasOwn(params, field.path) && String(params[field.path]) !== String(value)) fail('SESSION_IDENTITY_MISMATCH', `${field.label} harus berasal dari akun yang sedang masuk.`, 403);
      }
    } else if (field.source === 'constant') {
      value = field.default;
      if (Object.hasOwn(params, field.path) && String(params[field.path]) !== String(value)) fail('FIXED_FIELD', `${field.label} ditetapkan oleh kontrak yang diaudit.`);
    } else value = Object.hasOwn(params, field.path) ? params[field.path] : field.default;
    if (value === undefined || value === null || value === '') {
      if (field.clientRequired && !(value === '' && field.allowEmpty === true)) fail('FIELD_REQUIRED', `${field.label} diperlukan oleh adapter pengujian. Kewajiban server belum diketahui.`);
      if (value === '') (field.location === 'query' ? query : body)[field.path] = '';
      else if (field.preserveNull && field.location === 'body') body[field.path] = null;
      continue;
    }
    const validated = validateValue(field, value, operation.id);
    if (field.location === 'path') fail('PATH_ADAPTER_MISSING', 'Adapter segmen path belum tersedia.', 422);
    (field.location === 'query' ? query : body)[field.path] = validated;
  }
  const service = SERVICES[operation.serviceId];
  if (!service) fail('SERVICE_NOT_MAPPED', 'Layanan operasi belum dipetakan.', 422);
  if (/^[a-z]+:|^\/\/|[?#{}]/i.test(operation.path)) fail('INVALID_REGISTERED_PATH', 'Path registry tidak valid.', 500);
  return { operation, service, serviceId: service.id, method: operation.method, path: operation.path, query, body, encoding: operation.encoding, auth: operation.auth, clientProfile: operation.clientProfile || 'main', effect: operation.effect, files, requiresConfirmation: operation.requiresConfirmation };
}
