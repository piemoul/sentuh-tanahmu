// Server-only projection of the current session's decoded account_summary.
// Validate all 18 fields consumed by native ayb before retaining three keys.
// This does not authenticate the source: the caller must fetch it with its own
// main-client session, never accept a browser profile or sign-in NIK fallback.
const strings = [
  'userId', 'username', 'email', 'roleName', 'roleUser', 'nama',
  'nomorIdentitas', 'tempatLahir', 'tanggalLahir', 'nomorHp',
  'namaKantor', 'alamatKantor', 'kantorId', 'linkedEmailIkd',
];
const integers = ['userLevel', 'statusVerifikasi'];
const booleans = ['isIkd', 'readyToReview'];

function invalid() {
  throw Object.assign(new Error('Respons profil akun belum sesuai format layanan antrean.'), {
    status: 502, code: 'QUEUE_PROFILE_UNRECOGNIZED',
  });
}

function record(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid();
  return value;
}

// Missing JSON map keys are null in the native parser. Own data properties
// avoid inherited schema keys and never execute an accessor during validation.
function field(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) return null;
  if (!Object.hasOwn(descriptor, 'value')) invalid();
  return descriptor.value;
}

export function parseQueueProfileResponse(result) {
  record(result);
  const status = field(result, 'status');
  // account_summary has no additional HTTP200 predicate; the shared main
  // transport accepts 2xx. The body is already decoded by ApiClient.
  if (!Number.isInteger(status) || status < 200 || status >= 300) invalid();
  const body = record(field(result, 'data'));
  // Preserve ApiClient's successful-envelope contract. Native's two error
  // branches can return a typed profile; accepting error:true is not enabled.
  if (field(body, 'error') !== false) invalid();
  const message = field(body, 'message');
  if (message !== null && typeof message !== 'string') invalid();
  const profile = record(field(body, 'data'));
  const values = Object.create(null);
  for (const key of strings) {
    const value = field(profile, key);
    if (value !== null && typeof value !== 'string') invalid();
    values[key] = value;
  }
  for (const key of integers) {
    const value = field(profile, key);
    // Every safe JS integer is inside signed64; reject values whose exact
    // integer identity could have been lost in ApiClient's JSON decoding.
    if (value !== null && !Number.isSafeInteger(value)) invalid();
    values[key] = value;
  }
  for (const key of booleans) {
    const value = field(profile, key);
    if (value !== null && typeof value !== 'boolean') invalid();
    values[key] = value;
  }
  return {
    userLevel: values.userLevel,
    isIkd: values.isIkd,
    nomorIdentitas: values.nomorIdentitas,
  };
}
