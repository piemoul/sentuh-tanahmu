// Native read-only identity selection. Enrollment/OTP and persistence are separate.
// Caller must supply the account_summary.data obtained by this backend using the
// current authenticated session and validated as ayb, never browser input or the
// sign-in user subset. This helper is not a full account_summary/ayb parser.
const invalid = () => {
  const error = new Error('Identitas pemohon antrean belum sesuai data akun.');
  error.code = 'QUEUE_IDENTITY_UNRECOGNIZED';
  throw error;
};
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));

export function queueManagedIdentity(value) {
  if (!record(value) || !Number.isSafeInteger(value.id)
      || !['nama', 'noHp', 'nik', 'tempatLahir', 'tglLahir'].every(key => typeof value[key] === 'string')
      || typeof value.fromUserData !== 'boolean') invalid();
  return value;
}

export function queueReadIdentityKeys(profile, verifiedManagedIdentities = []) {
  if (!Array.isArray(verifiedManagedIdentities)) invalid();
  // This array is server-owned state populated only after the verified enrollment
  // workflow. It is not accepted by any public HTTP endpoint in this component.
  const saved = Array.from(verifiedManagedIdentities, queueManagedIdentity);
  if (profile !== null && profile !== undefined && !record(profile)) invalid();
  const eligible = profile?.userLevel === 2 || profile?.userLevel === 3;
  if (!eligible) return saved.map(item => item.nik);

  // The native model allows null strings, but eligible isIkd=null asserts. Do not
  // turn unknown IKD state into an enrollment or profile-identity bypass.
  if (typeof profile.isIkd !== 'boolean') invalid();
  const candidates = [];
  if (profile.isIkd === false) {
    const key = profile.nomorIdentitas;
    if (key !== null && key !== undefined && typeof key !== 'string') invalid();
    candidates.push(key ?? '');
  }
  candidates.push(...saved.map(item => item.nik));
  // The audited merge keys records by nik. For the read query, only the key is
  // used, so later replacement of an equal record cannot change that key.
  return [...new Set(candidates)];
}

export function queueReadIdentityQuery(profile, verifiedManagedIdentities = []) {
  const keys = queueReadIdentityKeys(profile, verifiedManagedIdentities);
  // Both native empty guards are retained. No trim, fallback login NIK or value
  // substitution occurs; query percent-encoding belongs to the transport layer.
  if (keys.length === 0) return null;
  const nik = keys.join(',');
  return nik === '' ? null : nik;
}
