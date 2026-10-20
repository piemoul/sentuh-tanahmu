// Bounded native azb/bzb/czb/dzb/ezb models. See QUEUE-MODEL-FOLLOWUP.md.
// Raw JSON is required for numeric fields: JSON.parse normally loses the
// native int/double distinction and rounds integers above 2^53.
const rawNumbers = new WeakMap();
const MIN_INT64 = -(1n << 63n);
const MAX_INT64 = (1n << 63n) - 1n;
const invalid = (code = 'INVALID_QUEUE_RESPONSE') => {
  throw Object.assign(new Error('Respons antrean tidak sesuai format yang didukung.'), {code});
};

function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  if (rawNumbers.has(value)) invalid();
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) invalid();
  return value;
}

// Own data properties only; never execute getters or use inherited schema keys.
function field(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return undefined;
  if (!Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}

function stringField(value, key) {
  const item = field(value, key);
  if (item == null) return '';
  if (typeof item !== 'string') invalid();
  return item;
}

function strings(value, keys) {
  record(value);
  return Object.fromEntries(keys.map(key => [key, stringField(value, key)]));
}

function list(value, parse) {
  if (!Array.isArray(value)) invalid();
  // A hole is not a JSON item. Reject it instead of silently omitting a row.
  return Array.from({length:value.length}, (_, index) => {
    if (!Object.hasOwn(value, index)) invalid();
    return parse(field(value, String(index)));
  });
}

function rawJson(text) {
  if (typeof text !== 'string') invalid();
  try {
    return JSON.parse(text, (_key, value, context) => {
      if (typeof value !== 'number') return value;
      if (typeof context?.source !== 'string') invalid('QUEUE_RAW_JSON_REQUIRED');
      const marker = Object.freeze(Object.create(null));
      rawNumbers.set(marker, {source:context.source, value});
      return marker;
    });
  } catch (error) {
    if (error?.code === 'QUEUE_RAW_JSON_REQUIRED') throw error;
    invalid();
  }
}

function rawNumber(value) {
  if (typeof value === 'number') invalid('QUEUE_RAW_JSON_REQUIRED');
  return value && typeof value === 'object' ? rawNumbers.get(value) : undefined;
}

function int64(number) {
  if (!/^-?(?:0|[1-9][0-9]*)$/.test(number.source)) invalid();
  // No large BigInt allocation is needed for a value outside signed64.
  if (number.source.replace(/^-/, '').length > 19) invalid('UNSUPPORTED_QUEUE_NUMBER');
  const integer = BigInt(number.source);
  if (integer < MIN_INT64 || integer > MAX_INT64) invalid('UNSUPPORTED_QUEUE_NUMBER');
  return integer;
}

// The bundled Dart converter and its EcmaScriptConverter share the shortest
// algorithm and (-6,21) thresholds. Dart additionally retains signed zero and
// emits .0 for decimal integers. See the pinned C++ source and oracle vectors;
// the shortest halfway implementation uses even, despite its stale header.
function doubleString(value) {
  if (!Number.isFinite(value)) invalid('UNSUPPORTED_QUEUE_NUMBER');
  if (Object.is(value, -0)) return '-0.0';
  const text = Number.prototype.toString.call(value, 10);
  return text.includes('.') || text.includes('e') ? text : text + '.0';
}

function bookingCode(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const numeric = rawNumber(value);
  if (numeric) {
    return /[.eE]/.test(numeric.source)
      ? doubleString(numeric.value)
      : int64(numeric).toString(10);
  }
  // Native dynamic dispatch can reach non-scalar objects; their printed
  // representations are deliberately outside this wire scalar contract.
  invalid();
}

function fileCount(value) {
  if (value == null) return 0;
  // Parsed-body callers may provide an already typed, safe native int. The raw
  // entrypoint still rejects a JSON double such as 7.0 in this int-only field.
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) invalid('UNSUPPORTED_QUEUE_NUMBER');
    return value === 0 ? 0 : value;
  }
  const numeric = rawNumber(value);
  if (!numeric) invalid();
  const integer = int64(numeric);
  // JSON-safe web normalization: wide native int64 counts remain decimal text.
  if (integer < BigInt(Number.MIN_SAFE_INTEGER) || integer > BigInt(Number.MAX_SAFE_INTEGER)) return integer.toString(10);
  return Number(integer);
}

export function parseQueueLocation(value) {
  return strings(value, ['id', 'nama', 'alamat']);
}

export function parseQueueOffice(value) {
  return strings(value, ['id', 'nama']);
}

export function parseQueueApplicant(value) {
  const result = strings(value, ['nik', 'nama', 'tempat_lahir', 'tanggal_lahir']);
  stringField(value, 'token'); // Validate native schema, never publish the token.
  return result;
}

export function parseQueueListItem(value) {
  const result = strings(value, ['id', 'nomor', 'tanggal_antrian', 'waktu_booking', 'status', 'lokasi', 'loket', 'pemohon', 'estimasi_message']);
  const codes = field(value, 'kode_booking');
  result.kode_booking = codes == null ? [] : list(codes, code => {
    if (typeof code !== 'string') invalid();
    return code;
  });
  return result;
}

export function parseQueueDetailItem(value) {
  const result = strings(value, ['id', 'nomor', 'nama', 'kode', 'tanggal_antrian']);
  result.jumlah_berkas = fileCount(field(value, 'jumlah_berkas'));
  const booking = field(value, 'booking');
  result.booking = booking == null ? [] : list(booking, item => bookingCode(field(record(item), 'kode')));
  result.lokasi = parseQueueLocation(field(value, 'lokasi') ?? {});
  result.kantor = parseQueueOffice(field(value, 'kantor') ?? {});
  result.pemohon = parseQueueApplicant(field(value, 'pemohon') ?? {});
  return result;
}

function envelope(body, detail) {
  record(body);
  const error = field(body, 'error');
  const empty = () => ({error:true, data:detail ? null : []});
  if (error == null || error === true) return empty();
  if (error !== false) invalid();
  const data = field(body, 'data');
  if (data == null) return empty();
  return {error:false, data:detail ? parseQueueDetailItem(data) : list(data, parseQueueListItem)};
}

export const parseQueueListEnvelope = body => envelope(body, false);
export const parseQueueDetailEnvelope = body => envelope(body, true);
export const parseQueueListJson = text => parseQueueListEnvelope(rawJson(text));
export const parseQueueDetailJson = text => parseQueueDetailEnvelope(rawJson(text));
