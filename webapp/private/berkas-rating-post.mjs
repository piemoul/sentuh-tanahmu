import {MIMEType} from 'node:util';

// Native6.1.5: BERKAS-RATING-FOLLOWUP-20261021.md, additive catch ledger and
// BERKAS-RATING-ENTRY-REFINEMENT-20261021.md (readyToRating true,not isPPAT).
// Source ownership and one-attempt policy live in berkas-rating-session.mjs.
export const BERKAS_RATING_ID='post-berkas-postratingberkas-d915c4';
export const BERKAS_RATING_PATH='berkas/postratingberkas';
export const BERKAS_RATING_MESSAGE='Terjadi kesalahan';
export const BERKAS_RATING_FAILURE='Terjadi kesalahan saat mengirimkan Rating Berkas';
const fields=['Berkasid','rating','userComment'],attempts=new WeakSet(),dispatched=new WeakSet();
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function fail(message='Parameter Rating Berkas tidak sesuai kontrak.',code='BERKAS_RATING_SCOPE'){
 throw Object.assign(new Error(message),{code,status:400,statusCode:400});
}
export function exactBerkasRatingRecord(value,keys){
 if(!record(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))fail();
 for(const key of keys){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor||!Object.hasOwn(descriptor,'value'))fail();}
 return value;
}
export function trimBerkasRatingComment(value){
 if(typeof value!=='string')fail('Komentar penilaian harus berupa teks.');
 // Dart String.trim Unicode whitespace, including U+0085. This SDK table is
 // an explicit browser adaptation; native trim itself is positively bound.
 return value.replace(/^[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+|[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+$/g,'');
}
function ratingValues(value){
 if(!Number.isSafeInteger(value.rating)||value.rating<1||value.rating>5)fail('Pilih satu sampai lima bintang.','INVALID_BERKAS_RATING');
 const comment=trimBerkasRatingComment(value.userComment);
 if(!comment.length)fail('Komentar penilaian tidak boleh kosong.','INVALID_BERKAS_RATING_COMMENT');
 return {rating:value.rating,userComment:comment};
}
export function prepareBerkasRatingInput(value){
 exactBerkasRatingRecord(value,['contextId','rating','userComment']);
 if(typeof value.contextId!=='string'||!/^brc_[A-Za-z0-9_-]{32}$/.test(value.contextId))fail('Pilih penilaian dari detail Berkasku sesi ini.');
 return {contextId:value.contextId,...ratingValues(value)};
}
export function prepareBerkasRatingPost(value){
 exactBerkasRatingRecord(value,fields);
 if(typeof value.Berkasid!=='string'||!value.Berkasid.length)fail('ID asli Berkasku belum tersedia.');
 const selected=ratingValues(value),body=Object.create(null);
 body.Berkasid=value.Berkasid;body.rating=selected.rating;body.userComment=selected.userComment;return body;
}
export function serializeBerkasRatingPost(value,boundary){
 if(typeof boundary!=='string'||!/^[A-Za-z0-9-]{1,120}$/.test(boundary))fail('Boundary Rating Berkas tidak valid.');
 const body=prepareBerkasRatingPost(value),chunks=[];
 for(const key of fields)chunks.push(Buffer.from(`--${boundary}\r\ncontent-disposition: form-data; name="${key}"\r\n\r\n${body[key]}\r\n`,'utf8'));
 chunks.push(Buffer.from(`--${boundary}--\r\n`,'utf8'));
 return {body:Buffer.concat(chunks),contentType:`multipart/form-data; boundary=${boundary}`};
}
export function decodeBerkasRatingValue(value){
 if(!record(value))fail('Respons Rating Berkas belum dapat dikenali.','INVALID_BERKAS_RATING_RESPONSE');
 const error=Object.getOwnPropertyDescriptor(value,'error'),message=Object.getOwnPropertyDescriptor(value,'message');
 if(error&&!Object.hasOwn(error,'value')||message&&!Object.hasOwn(message,'value'))fail('Respons Rating Berkas belum dapat dikenali.','INVALID_BERKAS_RATING_RESPONSE');
 const flag=!error||error.value===null?true:error.value,text=!message||message.value===null?BERKAS_RATING_MESSAGE:message.value;
 if(typeof flag!=='boolean'||typeof text!=='string')fail('Respons Rating Berkas belum dapat dikenali.','INVALID_BERKAS_RATING_RESPONSE');
 return {error:flag,message:text};
}
export function decodeBerkasRatingBytes(bytes,contentType,status=200){
 if(!Number.isInteger(status)||status<200||status>=300)fail('Server belum mengonfirmasi Rating Berkas.','INVALID_BERKAS_RATING_RESPONSE');
 let jsonMime=false;
 try{const mime=new MIMEType(contentType||'');jsonMime=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{}
 try{return decodeBerkasRatingValue(jsonMime?(bytes.length?JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)):null):new TextDecoder('utf-8').decode(bytes));}
 catch{fail('Respons Rating Berkas belum dapat dikenali.','INVALID_BERKAS_RATING_RESPONSE');}
}
export function createBerkasRatingAttempt(){const attempt=Object.freeze({});attempts.add(attempt);return attempt;}
export const isBerkasRatingAttempt=attempt=>attempts.has(attempt);
export function markBerkasRatingDispatched(attempt){if(!attempts.has(attempt))fail();if(dispatched.has(attempt))fail('Pengiriman Rating Berkas ini sudah dijalankan.','BERKAS_RATING_ATTEMPT_USED');dispatched.add(attempt);}
export const berkasRatingWasDispatched=attempt=>dispatched.has(attempt);
