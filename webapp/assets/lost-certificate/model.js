// Native 6.1.5 nIb/jIb/kIb read flow: analysis/LOST-CERTIFICATE-FLOW.md.
// Nullable display guards and lossless wide-int Strings are browser adaptations.
import {swaplottingOffices} from '../swaplotting/model.js';
import {parcelSearchBoundary} from '../parcel/search-model.js';

export const LOST_CERTIFICATE_COPY = Object.freeze({
  search: 'Cari nama atau no berkas',
  noOffice: 'Kamu belum punya kantor favorit, nih! Yuk, pilih kantor yang pengumuman yuridisnya pengen kamu lihat.',
  error: 'Gagal Mengambil Data',
  empty: 'Belum ada Laporan Sertipikat Hilang',
  mapNotFound: 'Lokasi Peta Bidang tidak ditemukan.',
});
const stringFields = ['dI304Id','persilId','berkasId','nomor','tanggalMulai','tanggalSelesai','nib','wilayah','pemohon','nomorBerkas','tanggalBerkas','tipe'];
const metadataFields = ['persilId','kantorId','namaKantor','wilayahId','namaWilayah','jenisHak','nomorSertipikat'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const invalid = kind => Object.assign(new TypeError('Data sertipikat hilang belum sesuai kontrak layanan.'), {code:'LOST_CERTIFICATE_'+kind+'_MODEL'});
function own(row,key,kind) {
  const descriptor = Object.getOwnPropertyDescriptor(row,key);
  if (!descriptor) return null;
  if (!Object.hasOwn(descriptor,'value')) throw invalid(kind);
  return descriptor.value;
}
function string(row,key,kind) {
  const value = own(row,key,kind);
  if (value != null && typeof value !== 'string') throw invalid(kind);
  return value ?? null;
}
function integer(value) {
  if (value == null) return null;
  if (Number.isSafeInteger(value)) return value;
  // The backend emits a String only when an exact native integer cannot travel
  // losslessly as a JavaScript Number. Do not accept small numeric Strings as
  // raw wire aliases or silently round an unsafe Number.
  if (typeof value !== 'string' || !/^-?(?:0|[1-9]\d{0,18})$/.test(value)) throw invalid('FEED');
  const number = BigInt(value);
  if (number < -(1n << 63n) || number >= (1n << 63n) || number >= BigInt(Number.MIN_SAFE_INTEGER) && number <= BigInt(Number.MAX_SAFE_INTEGER)) throw invalid('FEED');
  return value;
}
export function lostCertificateOffices(value) { return swaplottingOffices(value); }
export function lostCertificateRows(value) {
  if (!object(value)) throw invalid('FEED');
  const rows = own(value,'data','FEED');
  if (!Array.isArray(rows)) throw invalid('FEED');
  return Array.from(rows,row => {
    if (!object(row)) throw invalid('FEED');
    const result = Object.fromEntries(stringFields.map(key => [key,string(row,key,'FEED')]));
    result.luas = integer(own(row,'luas','FEED'));
    return result;
  });
}
export function lostCertificateEntries(rows,query) {
  if (!Array.isArray(rows) || typeof query !== 'string') throw invalid('SEARCH');
  const text = query.toLowerCase();
  // Native toString on null produces the literal "null", not an empty value.
  return rows.map((item,index) => ({item,index})).filter(({item}) => ['nomorBerkas','pemohon','wilayah'].some(key => String(item[key]).toLowerCase().includes(text)));
}
export function lostCertificateOfficeIndex(offices,favoriteId) {
  if (!offices.length) return null;
  const index = typeof favoriteId === 'string' ? offices.findIndex(row => row.KantorId === favoriteId) : -1;
  return index < 0 ? 0 : index;
}
export function lostCertificateUsableId(value) {
  // Browser guard only: keep the original exact String when a request is sent.
  return typeof value === 'string' && value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu,'') !== '';
}
export function lostCertificateLocation(value) {
  if (!object(value)) throw invalid('LOCATION');
  const error = own(value,'error','LOCATION'),message = string(value,'message','LOCATION'),data = own(value,'data','LOCATION');
  if (error != null && typeof error !== 'boolean') throw invalid('LOCATION');
  if (data == null) return {error:error ?? null,message,data:null};
  if (!object(data)) throw invalid('LOCATION');
  return {error:error ?? null,message,data:Object.fromEntries(metadataFields.map(key => [key,string(data,key,'LOCATION')]))};
}
export function lostCertificateBoundary(value) { return parcelSearchBoundary(value); }
