// Native6.1.5 GGb feed and JTb's yJj=true last-user-review branch.
// Separate from Sertipikat Hilang: original persilId, sertipikatSaya, no pages.
import {decodeLostReviewJson} from './lost-review-response.mjs';
export const YURIDIS_PATH='announcement/yuridis_byKantor';
export const YURIDIS_READ_ID='get-announcement-yuridis-bykantor-d0fb64';
export const YURIDIS_REVIEW_PATH='review/last_user_review';
export const YURIDIS_REVIEW_ID='post-review-last-user-review-dad1dc';
export const YURIDIS_REVIEW_TYPE='sertipikatSaya';
const numericTokens=new WeakMap(),MIN=-(1n<<63n),MAX=(1n<<63n)-1n;
const fields=['persilId','nomorBerkas','nomorPengumuman','tanggalMulai','tanggalSelesai','nib','wilayah','pemohon','permohonan','kegiatan'];
function fail(code='YURIDIS_RESPONSE_UNRECOGNIZED'){throw Object.assign(new Error('Respons pengumuman yuridis belum sesuai kontrak layanan.'),{code});}
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&!numericTokens.has(value)&&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function own(row,key){const d=Object.getOwnPropertyDescriptor(row,key);if(!d)return null;if(!Object.hasOwn(d,'value'))fail();return d.value;}
function parse(text){if(typeof text!=='string')fail();try{return JSON.parse(text,(_key,value,context)=>{if(typeof value!=='number')return value;if(typeof context?.source!=='string')fail('YURIDIS_RAW_JSON_REQUIRED');const marker=Object.freeze(Object.create(null));numericTokens.set(marker,context.source);return marker;});}catch(error){if(error?.code==='YURIDIS_RAW_JSON_REQUIRED')throw error;fail();}}
function string(row,key){const value=own(row,key);if(value==null)return null;if(typeof value!=='string')fail();return value;}
function integer(row,key){const value=own(row,key);if(value==null)return null;const source=typeof value==='object'&&numericTokens.get(value);if(typeof source!=='string'||! /^-?(?:0|[1-9]\d*)$/.test(source))fail();if(source.replace(/^-/, '').length>19)fail('UNSUPPORTED_YURIDIS_NUMBER');const n=BigInt(source);if(n<MIN||n>MAX)fail('UNSUPPORTED_YURIDIS_NUMBER');return n<BigInt(Number.MIN_SAFE_INTEGER)||n>BigInt(Number.MAX_SAFE_INTEGER)?n.toString():Number(n);}
export function decodeYuridisJson(text,{jsonTransformed=false}={}){let envelope=parse(text);if(typeof envelope==='string'&&jsonTransformed===true)envelope=parse(envelope);if(!object(envelope))fail();const rows=own(envelope,'data');if(!Array.isArray(rows))fail();return {data:Array.from({length:rows.length},(_,index)=>{const row=own(rows,String(index));if(!object(row))fail();return {...Object.fromEntries(fields.map(key=>[key,string(row,key)])),luasPersil:integer(row,'luasPersil')};})};}
export function prepareYuridisFeed(params){
 if(!object(params)||Reflect.ownKeys(params).length!==1||Reflect.ownKeys(params)[0]!=='kantorId')fail('YURIDIS_READ_SCOPE');
 const id=Object.getOwnPropertyDescriptor(params,'kantorId');
 if(!id||!Object.hasOwn(id,'value')||typeof id.value!=='string')fail('YURIDIS_READ_SCOPE');
 return {kantorId:id.value};
}
export function prepareYuridisLastReview(params){
 if(!object(params)||Reflect.ownKeys(params).some(key=>!['reviewType','contentId'].includes(key)))fail('YURIDIS_REVIEW_SCOPE');
 const type=Object.getOwnPropertyDescriptor(params,'reviewType'),id=Object.getOwnPropertyDescriptor(params,'contentId');
 if(type&&(!Object.hasOwn(type,'value')||type.value!==YURIDIS_REVIEW_TYPE)||!id||!Object.hasOwn(id,'value')||typeof id.value!=='string')fail('YURIDIS_REVIEW_SCOPE');
 return {reviewType:YURIDIS_REVIEW_TYPE,contentId:id.value};
}
export function decodeYuridisLastReviewJson(text){
 // Preserve numeric lexemes while reproducing native singleton wrapping before
 // the existing yyb/zyb/Ayb parser. Do not coerce a rounded JS Number back.
 if(typeof text!=='string')fail('YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED');
 let body;
 try{body=JSON.parse(text,(_key,value,context)=>typeof value==='number'?JSON.rawJSON(context.source):value);}catch{fail('YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED');}
 if(!object(body))fail('YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED');
 const data=own(body,'data');
 // Native returns immediately here; unrelated malformed metadata is ignored.
 if(data==null)return {data:[]};
 if(!object(data)||JSON.isRawJSON(data))fail('YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED');
 body.data=[data];
 let decoded;try{decoded=decodeLostReviewJson(JSON.stringify(body));}catch{fail('YURIDIS_REVIEW_RESPONSE_UNRECOGNIZED');}
 return {data:decoded.data};
}
