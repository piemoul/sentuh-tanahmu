// Sentuh Tanahku 6.1.5: service d10a04 (GET d10a9c) consumes body.data
// and materializes the kIb model at702164.
// Its service decodes a String once after the shared response transformer.
// Keep numeric JSON lexemes: native int? must not accept a rounded JS Number,
// a numeric String, or a floating-point token. Wide signed64 values travel to
// the browser as exact decimal Strings, as in the existing parcel adapter.
const numericTokens = new WeakMap();
const MIN_INT64 = -(1n << 63n), MAX_INT64 = (1n << 63n) - 1n;
const stringFields = ['dI304Id', 'persilId', 'berkasId', 'nomor', 'tanggalMulai', 'tanggalSelesai', 'nib', 'wilayah', 'pemohon', 'nomorBerkas', 'tanggalBerkas', 'tipe'];

function invalid(code = 'LOST_CERTIFICATE_RESPONSE_UNRECOGNIZED') {
  throw Object.assign(new Error('Respons sertipikat hilang belum sesuai kontrak layanan.'), {code});
}
function record(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || numericTokens.has(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid();
  return value;
}
function own(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return undefined;
  if (!Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}
function parse(text) {
  if (typeof text !== 'string') invalid();
  try {
    return JSON.parse(text, (_key, value, context) => {
      if (typeof value !== 'number') return value;
      if (typeof context?.source !== 'string') invalid('LOST_CERTIFICATE_RAW_JSON_REQUIRED');
      const marker = Object.freeze(Object.create(null));
      numericTokens.set(marker, context.source);
      return marker;
    });
  } catch (error) {
    if (error?.code === 'LOST_CERTIFICATE_RAW_JSON_REQUIRED') throw error;
    invalid();
  }
}
function nullableString(row, key) {
  const value = own(row, key);
  if (value == null) return null;
  if (typeof value !== 'string') invalid();
  return value;
}
function nullableInteger(row, key) {
  const value = own(row, key);
  if (value == null) return null;
  const source = value && typeof value === 'object' && numericTokens.get(value);
  if (typeof source !== 'string' || !/^-?(?:0|[1-9]\d*)$/.test(source)) invalid();
  if (source.replace(/^-/, '').length > 19) invalid('UNSUPPORTED_LOST_CERTIFICATE_NUMBER');
  const integer = BigInt(source);
  if (integer < MIN_INT64 || integer > MAX_INT64) invalid('UNSUPPORTED_LOST_CERTIFICATE_NUMBER');
  return integer < BigInt(Number.MIN_SAFE_INTEGER) || integer > BigInt(Number.MAX_SAFE_INTEGER) ? integer.toString() : Number(integer);
}

export function decodeLostCertificatesJson(text, {jsonTransformed = false} = {}) {
  let envelope = parse(text);
  // A JSON-MIME response may have been transformed into a String by the main
  // client. For a plain-text body the service only gets one JSON decode; do not
  // recursively unwrap Strings or silently accept a quoted plain-text envelope.
  if (typeof envelope === 'string' && jsonTransformed === true) envelope = parse(envelope);
  const rows = own(record(envelope), 'data');
  if (!Array.isArray(rows)) invalid();
  return {data: Array.from({length: rows.length}, (_, index) => {
    if (!Object.hasOwn(rows, index)) invalid();
    const row = record(own(rows, String(index)));
    const result = Object.fromEntries(stringFields.map(key => [key, nullableString(row, key)]));
    result.luas = nullableInteger(row, 'luas');
    return result;
  })};
}
