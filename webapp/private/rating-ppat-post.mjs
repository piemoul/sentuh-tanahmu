import {MIMEType} from 'node:util';

// Native6.1.5: RATING-PPAT-WRITE-FINAL-FOLLOWUP-20261021.md. This module
// prepares one selected Akta submission; it never performs a request/retry.
export const RATING_PPAT_POST_ID='post-ratingppat-postratingppat-d86e10';
export const RATING_PPAT_POST_PATH='RatingPPAT/PostRatingPPAT';
export const RATING_PPAT_POST_MESSAGE='Gagal Mengirimkan Rating PPAT';
export const RATING_PPAT_POST_FAILURE='Terjadi kesalahan saat Mengirimkan Rating PPAT';
const fields=['aktaId','PertanyaanRatingPPATId'];
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
 &&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const fail=()=>{throw Object.assign(new Error('Parameter pengiriman Rating PPAT tidak sesuai kontrak.'),{code:'RATING_PPAT_POST_SCOPE',status:400,statusCode:400});};

export function prepareRatingPpatPostValues(params){
 if(!record(params)||Reflect.ownKeys(params).length!==2||Reflect.ownKeys(params).some(key=>typeof key!=='string'||!fields.includes(key)))fail();
 const id=Object.getOwnPropertyDescriptor(params,'aktaId'),answers=Object.getOwnPropertyDescriptor(params,'PertanyaanRatingPPATId');
 if(!id||!answers||!Object.hasOwn(id,'value')||!Object.hasOwn(answers,'value')||typeof id.value!=='string'||!Array.isArray(answers.value))fail();
 const values=answers.value,keys=Reflect.ownKeys(values);
 // Reject holes, getters and extra properties before allocating. Empty Strings,
 // empty Lists, duplicates, Unicode and source insertion order remain intact.
 if(![Array.prototype,null].includes(Object.getPrototypeOf(values))||keys.length!==values.length+1||keys.some(key=>key!=='length'&&(typeof key!=='string'||!/^(0|[1-9]\d*)$/.test(key)||Number(key)>=values.length)))fail();
 const selected=Array.from({length:values.length},(_,index)=>{
  const descriptor=Object.getOwnPropertyDescriptor(values,String(index));
  if(!descriptor||!Object.hasOwn(descriptor,'value')||typeof descriptor.value!=='string')fail();
  return descriptor.value;
 });
 const body=Object.create(null);body.aktaId=id.value;body.PertanyaanRatingPPATId=selected;return body;
}

export function serializeRatingPpatPost(params){return JSON.stringify(prepareRatingPpatPostValues(params));}
export function ratingPpatPostFailure(){return {success:false,message:RATING_PPAT_POST_FAILURE};}

export function decodeRatingPpatPostValue(value){
 try{
  if(!record(value))return ratingPpatPostFailure();
  const error=Object.getOwnPropertyDescriptor(value,'error'),message=Object.getOwnPropertyDescriptor(value,'message');
  if(error&&!Object.hasOwn(error,'value')||message&&!Object.hasOwn(message,'value'))return ratingPpatPostFailure();
  const flag=!error||error.value===null?true:error.value;
  const text=!message||message.value===null?RATING_PPAT_POST_MESSAGE:message.value;
  if(typeof flag!=='boolean'||typeof text!=='string')return ratingPpatPostFailure();
  return {success:!flag,message:text};
 }catch{return ratingPpatPostFailure();}
}

export function decodeRatingPpatPostBytes(bytes,contentType,status=200){
 // Browser ApiClient keeps transport/non2xx/auth failures explicit. The
 // frontend service boundary maps ordinary errors to the native catch tuple.
 // A returned2xx body uses native catch semantics here; never unwrap a String.
 if(!Number.isInteger(status)||status<200||status>=300)return ratingPpatPostFailure();
 let jsonMime=false;
 try{const mime=new MIMEType(contentType||'');jsonMime=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{/* Shared replacement-UTF8 text path. */}
 try{
  const value=jsonMime?(bytes.length?JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)):null):new TextDecoder('utf-8').decode(bytes);
  return decodeRatingPpatPostValue(value);
 }catch{return ratingPpatPostFailure();}
}
