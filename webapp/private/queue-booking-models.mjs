import {MIMEType} from 'node:util';
import {queuePrereadDate} from './queue-preread-models.mjs';

// Native6.1.5 quota service/controller: queue-preflight-followup and the
// positively closed Directus JSON/UTF8 composer in queue-booking-wire-followup.
// This module neither performs requests nor grants authority to create bookings.
export const QUEUE_BOOKING_LIMIT_ID='post-api-booking-limit-d8bf80';
export const QUEUE_BOOKING_LIMIT_PATH='api/booking/limit/';
export const QUEUE_BOOKING_LIMIT_FAILURE='Terjadi Kesalahan';
export const QUEUE_BOOKING_CONTROLLER_FAILURE='Terjadi kesalahan';
export const QUEUE_BOOKING_LIMIT_FULL='Wah, maksimal cuma boleh ambil 4 antrian per hari di tiap kantor, nih! Ini biar semua kebagian ngantri dan pelayanan tetap lancar, ya.';
export const QUEUE_BOOKING_CLOSED='Gagal ambil antrian, nih! Kantor Pertanahan udah tutup hari ini.';
const numbers=new WeakMap(),MIN=-(1n<<63n),MAX=(1n<<63n)-1n;
const invalid=(code='QUEUE_BOOKING_UNRECOGNIZED',message='Respons pemeriksaan antrean belum sesuai format layanan.',status=502)=>{throw Object.assign(new Error(message),{code,status,statusCode:status});};
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&!numbers.has(value)&&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function field(value,key){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor)return null;if(!Object.hasOwn(descriptor,'value'))invalid();return descriptor.value;}
function exactRecord(value,keys,code){if(!record(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')))invalid(code,'Parameter pemeriksaan antrean tidak sesuai kontrak.',400);return value;}
function raw(text){if(typeof text!=='string')invalid();try{return JSON.parse(text,(_key,value,context)=>{if(typeof value!=='number')return value;if(typeof context?.source!=='string')invalid('QUEUE_RAW_JSON_REQUIRED');const marker=Object.freeze(Object.create(null));numbers.set(marker,context.source);return marker;});}catch(error){if(error?.code==='QUEUE_RAW_JSON_REQUIRED')throw error;invalid();}}
function requiredInt(value){const source=value&&typeof value==='object'&&numbers.get(value);if(typeof source!=='string'||!/^-?(?:0|[1-9]\d*)$/.test(source))invalid();if(source.replace(/^-/,'').length>19)invalid('UNSUPPORTED_QUEUE_NUMBER');const integer=BigInt(source);if(integer<MIN||integer>MAX)invalid('UNSUPPORTED_QUEUE_NUMBER');}

export function prepareQueueBookingLimitValues(value){
 exactRecord(value,['nik','kantorid','tanggal_booking'],'QUEUE_BOOKING_LIMIT_SCOPE');
 const body=Object.create(null);
 // Required Strings are copied without trimming, sorting, deduplication or
 // rejecting empty native model values. Session ownership is a separate layer.
 for(const key of ['nik','kantorid','tanggal_booking']){const text=field(value,key);if(typeof text!=='string')invalid('QUEUE_BOOKING_LIMIT_SCOPE');body[key]=text;}
 return body;
}
export function serializeQueueBookingLimit(value){return JSON.stringify(prepareQueueBookingLimitValues(value));}
export function queueBookingLimitFailure(){return {error:true,data:null,message:null};}
export function parseQueueBookingLimitJson(text){
 const body=raw(text);if(!record(body))invalid();
 const message=field(body,'message');if(message!==null&&typeof message!=='string')invalid();
 // Native compares dynamic error to false; it does not cast every error value
 // to bool. Other values take the error branch without parsing data.
 if(field(body,'error')!==false)return {error:true,data:null,message};
 const data=field(body,'data');if(!record(data))invalid();
 const available=field(data,'is_available');if(typeof available!=='boolean')invalid();
 requiredInt(field(data,'jumlah_antrian')); // Validated and discarded by fzb.
 return {error:false,data:{is_available:available},message};
}
export function decodeQueueBookingLimitBytes(bytes,contentType){
 try{
  const mime=new MIMEType(contentType||'');
  if(!['application/json','text/json'].includes(mime.essence)&&!mime.subtype.endsWith('+json'))return queueBookingLimitFailure();
  // Fatal UTF8 and the bounded response size are deliberate browser guards;
  // never unwrap an outer JSON String or perform a second JSON decode.
  return parseQueueBookingLimitJson(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }catch{return queueBookingLimitFailure();}
}
export function queueBookingRejectionMessage(bytes,contentType){
 // Bounded WO response-message parity only. Missing/null/nonString message
 // cannot safely reproduce Dio's exception.message; leave it a typed HTTP
 // error. Preserve original HTTP status and do not grant quota eligibility.
 try{const mime=new MIMEType(contentType||'');if(!['application/json','text/json'].includes(mime.essence)&&!mime.subtype.endsWith('+json'))return null;const body=raw(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!record(body))return null;const message=field(body,'message');return typeof message==='string'?{message}:null;}catch{return null;}
}
export function queueBookingLimitOutcome(tuple){
 if(tuple.error||tuple.data===null)return {error:true,message:tuple.message??QUEUE_BOOKING_LIMIT_FAILURE,quotaAvailable:false};
 if(!tuple.data.is_available)return {error:true,message:tuple.message??QUEUE_BOOKING_LIMIT_FULL,quotaAvailable:false};
 return {error:false,message:tuple.message??'Batas booking tersedia',quotaAvailable:true};
}

export function queueBookingTimeZone(value){
 if(typeof value!=='string'||!value.length||value.length>128||value.trim()!==value||/^[+-]/.test(value))invalid('QUEUE_BOOKING_TIME_ZONE');
 try{const zone=new Intl.DateTimeFormat('en-US',{timeZone:value}).resolvedOptions().timeZone;if(zone!=='UTC'&&!Intl.supportedValuesOf('timeZone').includes(zone))invalid('QUEUE_BOOKING_TIME_ZONE');return zone;}catch{invalid('QUEUE_BOOKING_TIME_ZONE');}
}
export function prepareQueueBookingReview(value){
 exactRecord(value,['contextId','rowIndex','documentCount','timeZone'],'QUEUE_BOOKING_REVIEW_SCOPE');
 const contextId=field(value,'contextId'),rowIndex=field(value,'rowIndex'),documentCount=field(value,'documentCount');
 if(typeof contextId!=='string'||!/^qb_[A-Za-z0-9_-]{32}$/.test(contextId)||!Number.isSafeInteger(rowIndex)||rowIndex<0||!Number.isInteger(documentCount)||documentCount<1||documentCount>5)invalid('QUEUE_BOOKING_REVIEW_SCOPE');
 return {contextId,rowIndex,documentCount,timeZone:queueBookingTimeZone(field(value,'timeZone'))};
}

function utc(parts){const date=new Date(0);date.setUTCFullYear(parts.year,parts.month-1,parts.day);date.setUTCHours(parts.hour??0,parts.minute??0,parts.second??0,0);return date.getTime();}
function zonedParts(instant,timeZone){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);
 return Object.fromEntries(parts.filter(part=>['year','month','day','hour','minute','second'].includes(part.type)).map(part=>[part.type,Number(part.value)]));
}
function localInstant(parts,timeZone){
 const civil=utc(parts),offsets=new Set();
 // Bound this browser adaptation to civil times with exactly one matching
 // instant. Ambiguous/nonexistent DST times are rejected rather than guessed.
 for(let delta=-36;delta<=36;delta+=6){const sample=civil+delta*3600000;offsets.add(utc(zonedParts(sample,timeZone))-sample);}
 const found=[];
 for(const offset of offsets){const candidate=civil-offset,actual=zonedParts(candidate,timeZone);if(['year','month','day','hour','minute','second'].every(key=>actual[key]===(parts[key]??0)))found.push(candidate);}
 if(found.length!==1)invalid('QUEUE_BOOKING_TIME_UNSUPPORTED');return found[0];
}
function closeParts(value,timeZone){
 if(value===null)return null;
 if(typeof value!=='string')invalid('QUEUE_BOOKING_TIME_UNSUPPORTED');
 const match=/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,6}))?)?(?: ?([zZ]|[+-]\d{2}:?\d{2}))?)?$/.exec(value);
 if(!match)invalid('QUEUE_BOOKING_TIME_UNSUPPORTED');queuePrereadDate(value.slice(0,10));
 const parts=Object.fromEntries(['year','month','day','hour','minute','second'].map((key,index)=>[key,Number(match[index+1]??0)]));
 if(parts.hour>23||parts.minute>59||parts.second>59)invalid('QUEUE_BOOKING_TIME_UNSUPPORTED');
 if(match[8]){const instant=Date.parse(value.replace(',','.'));if(!Number.isFinite(instant))invalid('QUEUE_BOOKING_TIME_UNSUPPORTED');return zonedParts(instant,timeZone);}
 localInstant(parts,timeZone);return parts;
}
function nowValue(now){const value=now();const instant=value instanceof Date?value.getTime():value;if(typeof instant!=='number'||!Number.isFinite(instant)||Math.abs(instant)>8.64e15)invalid('QUEUE_BOOKING_CLOCK_UNAVAILABLE');return instant;}
export function queueBookingPreflight({row,date,timeZone,now=()=>Date.now()}){
 queuePrereadDate(date);timeZone=queueBookingTimeZone(timeZone);
 if(row.estimasi_message!==null&&row.estimasi_message.includes('full'))return {error:true,message:row.estimasi_message};
 const close=closeParts(row.jam_tutup,timeZone);if(close===null)return {error:false,message:null};
 const first=nowValue(now),today=zonedParts(first,timeZone);
 const cutoff=localInstant({...today,hour:close.hour,minute:close.minute,second:close.second},timeZone);
 // Millisecond clock precision and explicit browser IANA zone are adaptations.
 // Keep native strict >, ignored close date/fractions, and a SECOND now sample
 // comparing only the selected day number (not selected month/year).
 if(first>cutoff&&Number(date.slice(8,10))===zonedParts(nowValue(now),timeZone).day)return {error:true,message:QUEUE_BOOKING_CLOSED};
 return {error:false,message:null};
}
