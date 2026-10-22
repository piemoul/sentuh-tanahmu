// Native Buku Tamu GET: guestbook-service-followup/flow.json 9bceab7d…676f10dc.
// The wire JSON is decoded once by the transport adapter. The service consumes
// a Map directly: do not decode a returned String again or veto error:true.
function invalid() {
  throw Object.assign(new Error('Respons Buku Tamu belum sesuai format layanan.'), {
    status: 502, code: 'GUESTBOOK_RESPONSE_UNRECOGNIZED',
  });
}
function record(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid();
  return value;
}
function own(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return null;
  if (!Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}
function nullable(value, key, type) {
  const field = own(value, key);
  if (field == null) return null;
  if (typeof field !== type) invalid();
  return field;
}
export function decodeGuestbookEnvelope(value) {
  try {
    const envelope = record(value), rawData = own(envelope, 'data');
    // Generic wyb<kBb> invokes its data callback before checking these flags.
    const data = rawData == null ? null : Object.fromEntries(
      ['userId', 'kantorId', 'unitKerjaId', 'namaUnitKerja']
        .map(key => [key, nullable(record(rawData), key, 'string')]),
    );
    const error = nullable(envelope, 'error', 'boolean');
    const message = nullable(envelope, 'message', 'string');
    return {error, message, data};
  } catch {
    invalid();
  }
}
export function decodeGuestbookJson(text) {
  try {
    if (typeof text !== 'string') invalid();
    return decodeGuestbookEnvelope(JSON.parse(text));
  } catch {
    invalid();
  }
}
