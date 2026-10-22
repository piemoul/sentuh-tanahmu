import {MIMEType} from 'node:util';

// Native6.1.5: analysis/RATING-PPAT-READ-FOLLOWUP.md. Questionnaire read only;
// the separate confirmed writer is scoped in rating-ppat-post.mjs.
export const RATING_PPAT_READ_PATH='RatingPPAT/GetRatingQuestions';
export const RATING_PPAT_READ_ID='get-ratingppat-getratingquestions-d1d6bc';
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail=(message,code='RATING_PPAT_RESPONSE_UNRECOGNIZED')=>{throw Object.assign(new Error(message),{code,status:400});};
export function prepareRatingPpatRead(params={}) {
  if(!record(params)||Reflect.ownKeys(params).length)fail('Pembacaan pertanyaan Rating PPAT tidak menerima parameter.','RATING_PPAT_READ_SCOPE');
  return {};
}
function nullableString(object,key) {
  const descriptor=Object.getOwnPropertyDescriptor(object,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value')||descriptor.value!==null&&typeof descriptor.value!=='string')fail('Format pertanyaan Rating PPAT belum dikenali.');
  return descriptor.value;
}
function typedList(rows,project) {
  return Array.from({length:rows.length},(_,index)=>{
    const descriptor=Object.getOwnPropertyDescriptor(rows,String(index));
    if(!descriptor||!Object.hasOwn(descriptor,'value')||!record(descriptor.value))fail('Format pertanyaan Rating PPAT belum dikenali.');
    return project(descriptor.value);
  });
}
function answer(row) {
  const pertanyaanRatingPPATId=nullableString(row,'pertanyaanRatingPPATId');
  const pertanyaan=nullableString(row,'pertanyaan'),jawaban=nullableString(row,'jawaban');
  // These nullable Strings are checked by Hyb, then discarded. Numeric scores
  // are not accepted merely because these two values are not displayed.
  nullableString(row,'bobot');nullableString(row,'nilai');
  return {pertanyaanRatingPPATId,pertanyaan,jawaban};
}
function group(row) {
  const pertanyaanRatingPPATId=nullableString(row,'pertanyaanRatingPPATId');
  nullableString(row,'kategori');
  const indikator=nullableString(row,'indikator');
  const descriptor=Object.getOwnPropertyDescriptor(row,'jawabanRatingPPAT');
  let jawabanRatingPPAT=null;
  if(descriptor){
    if(!Object.hasOwn(descriptor,'value'))fail('Format pertanyaan Rating PPAT belum dikenali.');
    if(descriptor.value!==null){
      if(!Array.isArray(descriptor.value))fail('Format pertanyaan Rating PPAT belum dikenali.');
      jawabanRatingPPAT=typedList(descriptor.value,answer);
    }
  }
  return {pertanyaanRatingPPATId,indikator,jawabanRatingPPAT};
}
export function decodeRatingPpatValue(value) {
  // One optional service String decode AFTER the ordinary main byte transform.
  // Direct lists/message fallbacks/recursive unwrapping have no native binding.
  if(typeof value==='string'){try{value=JSON.parse(value);}catch{fail('Format pertanyaan Rating PPAT belum dikenali.');}}
  if(!record(value))fail('Format pertanyaan Rating PPAT belum dikenali.');
  const descriptor=Object.getOwnPropertyDescriptor(value,'data');
  if(!descriptor||!Object.hasOwn(descriptor,'value')||!Array.isArray(descriptor.value))fail('Respons Rating PPAT belum memuat daftar pertanyaan.');
  // The native service does not consult error/message. Keep that exception
  // scoped to this exact GET rather than changing the generic client guard.
  return {data:typedList(descriptor.value,group)};
}
export function decodeRatingPpatBytes(bytes,contentType) {
  let jsonMime=false;
  try{const mime=new MIMEType(contentType||'');jsonMime=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{/* Ordinary shared text path. */}
  let value;
  try{
    value=jsonMime?(bytes.length?JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)):null):new TextDecoder('utf-8').decode(bytes);
  }catch{fail('Respons pertanyaan Rating PPAT tidak dapat diproses.');}
  // MIME grammar, String-BOM edges and full Dart JSON grammar remain the
  // explicit bounded browser adaptations documented by the retained proof.
  return decodeRatingPpatValue(value);
}
