// Native da9928 consumes generic byb via 6bbe60 and callback 903b48.
// This is only the first explicit Daring identity-validation service result,
// not an OTP, liveness result, final verified account, or automatic next action.
export const DARING_IDENTITY_FAILURE_MESSAGE = 'Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi';
function invalid() {
  throw Object.assign(new Error('Respons validasi identitas belum sesuai kontrak layanan.'), {status:502, code:'DARING_IDENTITY_RESPONSE_UNRECOGNIZED'});
}
function field(body,key) {
  const descriptor=Object.getOwnPropertyDescriptor(body,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value'))invalid();
  return descriptor.value;
}
export function decodeDaringIdentityEnvelope(body) {
  if(body === null || typeof body !== 'object' || Array.isArray(body) || ![Object.prototype,null].includes(Object.getPrototypeOf(body)))invalid();
  const data=field(body,'data');
  // The native nonnull-data callback casts to byb; it does not parse a nested
  // JSON Map. No nonnull JSON value can satisfy that runtime object cast.
  if(data !== null)invalid();
  const error=field(body,'error'),message=field(body,'message');
  if(error !== null && typeof error !== 'boolean' || message !== null && typeof message !== 'string')invalid();
  return {error:error ?? true,message:message ?? DARING_IDENTITY_FAILURE_MESSAGE};
}
export function daringIdentityStatusFallback(status) {
  return {error:true,message:`Terjadi kesalahan saat memproses data (status ${status})`};
}
