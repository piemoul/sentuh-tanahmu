import {parseQueueProfileResponse} from './queue-profile.mjs';

function invalid(kind) {
  throw Object.assign(new Error(kind === 'profile'
    ? 'Profil akun belum sesuai format pemindaian dokumen.'
    : kind === 'metadata' ? 'Metadata dokumen belum sesuai format layanan.'
    : 'Respons pemindaian dokumen belum sesuai format layanan.'), {
    status:502,
    code:kind === 'profile' ? 'SCAN_PROFILE_UNRECOGNIZED' : kind === 'metadata' ? 'SCAN_METADATA_UNRECOGNIZED' : 'SCAN_CLASSIFICATION_UNRECOGNIZED',
  });
}

function record(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid('classification');
  return value;
}

function field(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return null;
  if (!Object.hasOwn(descriptor, 'value')) invalid('classification');
  return descriptor.value;
}

// Native helper 0xd4232c: direct Map or one JSON String decode. Both boolean
// error branches return the same message/data tuple. HTTP status and the
// native ('error', '1009') failure fallback belong to the caller.
export function decodeScanClassification(responseBody) {
  let body = responseBody;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { invalid('classification'); }
  }
  record(body);
  const error = field(body, 'error');
  const message = field(body, 'message');
  const data = field(body, 'data');
  if (error !== null && typeof error !== 'boolean') invalid('classification');
  if (message !== null && typeof message !== 'string') invalid('classification');
  if (typeof data !== 'string') invalid('classification');
  return {message:message ?? 'Unknown Error', data};
}

// Shared native GetDocumentType helper: unlike classification it does not
// decode a second String. Return its typed envelope for existing UI consumers;
// callers compute showRoute===1 and own the (true,false,'') failure fallback.
export function decodeScanDocumentMetadata(body) {
  try {
    record(body);
    const error = field(body, 'error'), data = record(field(body, 'data'));
    const showRoute = field(data, 'showRoute'), type = field(data, 'type');
    if (error !== null && typeof error !== 'boolean' || !Number.isSafeInteger(showRoute) || type !== null && typeof type !== 'string') invalid('metadata');
    return {error:error ?? true, data:{showRoute, type:type ?? ''}};
  } catch {
    invalid('metadata');
  }
}

// Server-owned, already decoded account_summary only. The shared validator
// checks its envelope and all 18 nullable ayb fields, including nama/email.
// This helper does not authenticate the source or accept a browser profile.
export function scanProfileName(responseResult) {
  try {
    parseQueueProfileResponse(responseResult);
    const profile = field(field(responseResult, 'data'), 'data');
    return field(profile, 'nama') ?? field(profile, 'email') ?? '-';
  } catch {
    invalid('profile');
  }
}
