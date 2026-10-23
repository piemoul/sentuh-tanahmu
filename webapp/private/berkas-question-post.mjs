import {MIMEType} from 'node:util';
export const BERKAS_QUESTION_POST_ID='post-tanyajawab-submitpertanyaan-d994f4';
export const BERKAS_QUESTION_POST_PATH='TanyaJawab/SubmitPertanyaan';
export const BERKAS_QUESTION_READ_ID='get-tanyajawab-gettanyajawabberkas-d2826c';
export const BERKAS_QUESTION_READ_PATH='TanyaJawab/GetTanyaJawabBerkas';
const attempts=new WeakSet(),dispatched=new WeakSet();
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function fail(message='Parameter Tanya Berkas tidak sesuai kontrak.',code='BERKAS_QUESTION_SCOPE'){throw Object.assign(new Error(message),{code,status:400,statusCode:400});}
export function exactQuestionRecord(value,keys){
 if(!record(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')))fail();
 return value;
}
// Explicit browser ID domain: unchanged interpolation is proved for these
// ordinary IDs; arbitrary Dart URI parser normalization remains outside proof.
export const ordinaryQuestionId=value=>typeof value==='string'&&/^[A-Za-z0-9-]{1,1024}$/.test(value);
export function questionHistoryPath(id){if(!ordinaryQuestionId(id))fail('Format ID berkas belum didukung oleh pembacaan percakapan.');return BERKAS_QUESTION_READ_PATH+'?berkasid='+id;}
export function questionText(value){
 if(typeof value!=='string')fail('Pesan harus berupa teks.');
 const copy=value.replace(/^[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+|[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+$/g,'');
 if(!copy.length)fail('Pesan tidak boleh kosong.','BERKAS_QUESTION_EMPTY');
 return value;
}
export function prepareBerkasQuestionInput(value){exactQuestionRecord(value,['contextId','content']);if(typeof value.contextId!=='string'||!/^bqc_[A-Za-z0-9_-]{32}$/.test(value.contextId))fail('Buka percakapan dari detail berkas sesi ini.');return {contextId:value.contextId,content:questionText(value.content)};}
export function prepareBerkasQuestionPost(value){exactQuestionRecord(value,['berkasid','content']);if(!ordinaryQuestionId(value.berkasid))fail();return {berkasid:value.berkasid,content:questionText(value.content)};}
export function serializeBerkasQuestionPost(value){
 const body=prepareBerkasQuestionPost(value);
 // Native mask1, UTF8 replacement, spaceToPlus=true; raw LF is preserved.
 const component=text=>encodeURIComponent(text.toWellFormed()).replace(/[!'()*]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
 return ['berkasid','content'].map(key=>component(key)+'='+component(body[key])).join('&');
}
function transformed(bytes,contentType){
 let json=false;try{const mime=new MIMEType(contentType||'');json=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{}
 const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 return json?(text.length?JSON.parse(text):null):text;
}
export function decodeBerkasQuestionOutcome(bytes,contentType,status){
 // Native false is distinct from a browser delivery receipt. A typed error
 // flag is the only explicit business result; ambiguous results stay unknown.
 let value;try{value=transformed(bytes,contentType);}catch{return {success:false,recognized:false};}
 if(status!==200||!record(value))return {success:false,recognized:false};
 const error=Object.getOwnPropertyDescriptor(value,'error');
 if(!error||!Object.hasOwn(error,'value')||typeof error.value!=='boolean')return {success:false,recognized:false};
 return {success:error.value===false,recognized:true};
}
export function decodeBerkasQuestionHistory(bytes,contentType,status){
 if(!Number.isInteger(status)||status<200||status>=300)fail('Riwayat percakapan belum dapat dimuat.','BERKAS_QUESTION_HISTORY_INVALID');
 let value;try{value=transformed(bytes,contentType);}catch{fail('Riwayat percakapan belum dapat dibaca.','BERKAS_QUESTION_HISTORY_INVALID');}
 if(!record(value)||!Array.isArray(value.data))fail('Riwayat percakapan belum memuat daftar.','BERKAS_QUESTION_HISTORY_INVALID');
 const keys=['berkasId','nik','content','isTanya','tanggal','waktu','namaKantor'];
 return Array.from(value.data,row=>{if(!record(row))fail('Bentuk pesan belum dikenali.','BERKAS_QUESTION_HISTORY_INVALID');const result={};for(const key of keys){const d=Object.getOwnPropertyDescriptor(row,key);if(!d||!Object.hasOwn(d,'value')||typeof d.value!=='string')fail('Bentuk pesan belum dikenali.','BERKAS_QUESTION_HISTORY_INVALID');result[key]=d.value;}return result;});
}
export function createBerkasQuestionAttempt(){const value=Object.freeze({});attempts.add(value);return value;}
export const isBerkasQuestionAttempt=value=>attempts.has(value);
export const berkasQuestionWasDispatched=value=>dispatched.has(value);
export function markBerkasQuestionDispatched(value){if(!attempts.has(value)||dispatched.has(value))fail('Permintaan pesan ini sudah dijalankan.','BERKAS_QUESTION_ATTEMPT_USED');dispatched.add(value);}
