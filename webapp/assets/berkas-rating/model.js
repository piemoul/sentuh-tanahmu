// Native 6.1.5 Berkas Rating is distinct from the Rating PPAT questionnaire.
// Only display values enter this public model. The selected Berkas ID and its
// session-bound source capability remain in the parent/server-owned context.
export const BERKAS_RATING_COPY=Object.freeze({
 title:'Berikan Rating untuk Berkas ini',
 comment:'Berikan komentar',
 sending:'Mengirim Rating Berkas…',
 fallback:'Terjadi kesalahan saat mengirimkan Rating Berkas',
 invalid:'Pilih rating dan isi komentar sebelum mengirim.',
 notSent:'Permintaan belum dikirim. Periksa sesi atau koneksi, lalu coba kembali.',
 sessionChanged:'Sesi atau halaman telah berubah. Buka kembali detail Berkas sebelum mengirim.'
});
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
// Dart String.trim includes U+0085 in addition to JavaScript whitespace.
export const berkasRatingTrim=value=>typeof value==='string'?value.replace(/^[\s\u0085]+|[\s\u0085]+$/g,''):null;
export function berkasRatingEntry(value){
 if(!object(value)||typeof value.numberYear!=='string'||typeof value.officeName!=='string')throw new TypeError('BERKAS_RATING_ENTRY');
 return {numberYear:value.numberYear,officeName:value.officeName};
}
export function berkasRatingPrompt(entry){const value=berkasRatingEntry(entry);return `Berikan rating kamu untuk Berkas no. ${value.numberYear} Kantor Pertanahan ${value.officeName}`;}
export function berkasRatingValid(rating,comment){return Number.isInteger(rating)&&rating>=1&&rating<=5&&typeof comment==='string'&&berkasRatingTrim(comment).length>0;}
export function berkasRatingValues(rating,comment){
 if(!berkasRatingValid(rating,comment))throw new TypeError('BERKAS_RATING_VALUES');
 return {rating,userComment:berkasRatingTrim(comment)};
}
// No second JSON decode or truthy coercion. A normal error=false is the
// native application flag; it is not a land document or legal receipt.
export function berkasRatingResult(value){
 if(!object(value)||typeof value.error!=='boolean'||typeof value.message!=='string'||Object.hasOwn(value,'exceptional')&&value.exceptional!==false)throw new TypeError('BERKAS_RATING_RESULT');
 return {error:value.error,message:value.message};
}
