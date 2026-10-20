// Appended to generated operationData/serviceData by build-operations.py.
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
  const allowed = new Map(operation.fields.map(field => [field.path, field]));
  for (const key of Object.keys(params)) {
    if (!allowed.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('UNKNOWN_FIELD', `Parameter ${key} tidak termasuk kontrak operasi.`);
    if (allowed.get(key).type === 'file') fail('FILE_TRANSPORT_REQUIRED', 'Kirim file melalui multipart, bukan nilai JSON.');
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
