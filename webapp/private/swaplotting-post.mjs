import {MIMEType} from 'node:util';
import {SWAPLOTTING_RIGHTS,SWAPLOTTING_BASIS,SWAPLOTTING_TAX} from '../assets/swaplotting/model.js';
import {swaplottingNativeTrim} from '../assets/swaplotting/review.js';

// Native service f5be0748..., multipart31e4d9bb..., shared finalizer8c141a63...
// These helpers perform no request. Browser coordinate formatting and random
// filename/boundary sources are declared adaptations, not Android byte oracles.
export const SWAPLOTTING_POST_LIMIT=25*1024*1024;
export const SWAPLOTTING_COORDINATE_FORMAT='browser-binary64-string-preserve-negative-zero; native-text-parity-unproven';
export const SWAPLOTTING_POSTS=Object.freeze({registered:Object.freeze({id:'post-apis-swaplottingterdaftar-d9f850',path:'/apis/SwaplottingTerdaftar'}),unregistered:Object.freeze({id:'post-apis-swaplottingbelumterdaftar-da0be8',path:'/apis/SwaplottingBelumTerdaftar'})});
export const SWAPLOTTING_POST_KEYS=Object.freeze({registered:Object.freeze(['id','kluster','namapemilik','kontaktelp','kontakemail','tipehakid','tipehak','kantorid','namakantor','wilayahid','namawilayah','nomorhak','reviu','lat','lon']),unregistered:Object.freeze(['id','kluster','namapemilik','kontaktelp','kontakemail','alamat','alashak','nomoralashak','keteranganalashak','buktipajak','nomorbuktipajak','keteranganbuktipajak','kantorid','namakantor','wilayahid','namawilayah','reviu','lat','lon'])});
const commonFields=['name','phone','email'];
const rawFields={registered:[...commonFields,'number','review'],unregistered:[...commonFields,'address','basisNumber','basisDescription','taxNumber','taxDescription','review']};
const attempts=new WeakMap();
export function swaplottingPostError(code='SWAPLOTTING_SUBMIT_SCOPE',message='Parameter pengiriman Swaplotting tidak sesuai kontrak.',status=400){return Object.assign(new Error(message),{code,status,statusCode:status});}
const fail=(...args)=>{throw swaplottingPostError(...args);};
export const swaplottingRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&!JSON.isRawJSON(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export function swaplottingOwn(value,key){const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!descriptor)return undefined;if(!Object.hasOwn(descriptor,'value'))fail();return descriptor.value;}
export function swaplottingExact(value,keys){if(!swaplottingRecord(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')))fail();return value;}
export function swaplottingDense(value){if(!Array.isArray(value)||![Array.prototype,null].includes(Object.getPrototypeOf(value))||Reflect.ownKeys(value).length!==value.length+1||Reflect.ownKeys(value).some(key=>key!=='length'&&(typeof key!=='string'||!/^(?:0|[1-9]\d*)$/.test(key)||Number(key)>=value.length||!Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value'))))fail();return value;}
const scalar=value=>value==null?'':typeof value==='string'?value:fail();
const trimmed=value=>swaplottingNativeTrim(scalar(value));
const sourceId=value=>typeof value==='string'&&/^ss_[A-Za-z0-9_-]{32}$/.test(value);
export function swaplottingCoordinate(value,axis){
 if(typeof value!=='string'||value.length>100||!value.length)fail('SWAPLOTTING_COORDINATE_INVALID');
 const number=Number(value),canonical=Object.is(number,-0)?'-0':String(number);
 if(!Number.isFinite(number)||canonical!==value||Math.abs(number)>(axis==='latitude'?85.0511287798066:180))fail('SWAPLOTTING_COORDINATE_INVALID');
 return value;
}
export function prepareSwaplottingReviewValues(value){
 swaplottingExact(value,['kind','sourceContexts','draft']);const kind=swaplottingOwn(value,'kind');if(!Object.hasOwn(SWAPLOTTING_POSTS,kind))fail();
 const contexts=swaplottingExact(swaplottingOwn(value,'sourceContexts'),['profile','disclaimer','offices','regions']);for(const key of Object.keys(contexts))if(!sourceId(swaplottingOwn(contexts,key)))fail('SWAPLOTTING_SOURCE_REQUIRED');
 const draft=swaplottingExact(swaplottingOwn(value,'draft'),['fields','officeIndex','regionIndex','right','basisIndex','taxIndex','latitude','longitude','disclaimerAcknowledged']);
 const fields=swaplottingExact(swaplottingOwn(draft,'fields'),rawFields[kind]);for(const key of rawFields[kind])if(typeof swaplottingOwn(fields,key)!=='string')fail();
 // Preserve the native aggregate's raw nonempty-before-trim semantics.
 if(rawFields[kind].some(key=>fields[key].length===0))fail('SWAPLOTTING_FORM_REQUIRED','Lengkapi semua isian formulir sebelum mengirim.');
 for(const key of ['officeIndex','regionIndex'])if(!Number.isSafeInteger(draft[key])||draft[key]<0)fail();
 if(typeof draft.disclaimerAcknowledged!=='boolean')fail();
 if(kind==='registered'){if(typeof draft.right!=='string'||!SWAPLOTTING_RIGHTS.some(value=>value.code===draft.right)||draft.basisIndex!==null||draft.taxIndex!==null)fail();}
 else if(draft.right!==null||!Number.isInteger(draft.basisIndex)||!Object.hasOwn(SWAPLOTTING_BASIS,draft.basisIndex)||draft.basisIndex<0||!Number.isInteger(draft.taxIndex)||!Object.hasOwn(SWAPLOTTING_TAX,draft.taxIndex)||draft.taxIndex<0)fail();
 swaplottingCoordinate(draft.latitude,'latitude');swaplottingCoordinate(draft.longitude,'longitude');return structuredClone(value);
}
export function buildSwaplottingPostValues(kind,{fields,office,region,right,basisIndex,taxIndex,latitude,longitude}){
 if(!Object.hasOwn(SWAPLOTTING_POSTS,kind)||!swaplottingRecord(fields)||!swaplottingRecord(office)||!swaplottingRecord(region))fail();
 const entries=[['id','id'],['kluster','K4'],['namapemilik',trimmed(fields.name)],['kontaktelp',trimmed(fields.phone)],['kontakemail',trimmed(fields.email)]];
 if(kind==='registered'){const selected=SWAPLOTTING_RIGHTS.find(value=>value.code===right);if(!selected)fail();entries.push(['tipehakid',selected.code],['tipehak',selected.label]);}
 else {if(!Number.isInteger(basisIndex)||!Object.hasOwn(SWAPLOTTING_BASIS,basisIndex)||!Number.isInteger(taxIndex)||!Object.hasOwn(SWAPLOTTING_TAX,taxIndex))fail();entries.push(['alamat',trimmed(fields.address)],['alashak',SWAPLOTTING_BASIS[basisIndex]],['nomoralashak',scalar(fields.basisNumber)],['keteranganalashak',trimmed(fields.basisDescription)],['buktipajak',SWAPLOTTING_TAX[taxIndex]],['nomorbuktipajak',scalar(fields.taxNumber)],['keteranganbuktipajak',trimmed(fields.taxDescription)]);}
 entries.push(['kantorid',scalar(office.KantorId)],['namakantor',scalar(office.Nama)],['wilayahid',scalar(region.code)],['namawilayah',scalar(region.name)]);
 if(kind==='registered')entries.push(['nomorhak',trimmed(fields.number)]);
 entries.push(['reviu',trimmed(fields.review)],['lat',swaplottingCoordinate(latitude,'latitude')],['lon',swaplottingCoordinate(longitude,'longitude')]);
 return prepareSwaplottingPostValues(kind,Object.fromEntries(entries));
}
export function prepareSwaplottingPostValues(kind,value){
 const keys=SWAPLOTTING_POST_KEYS[kind];if(!keys)fail();swaplottingExact(value,keys);
 const body=Object.create(null);for(const key of keys){const item=swaplottingOwn(value,key);if(typeof item!=='string')fail();body[key]=item;}
 if(body.id!=='id'||body.kluster!=='K4')fail();swaplottingCoordinate(body.lat,'latitude');swaplottingCoordinate(body.lon,'longitude');return body;
}
export function prepareSwaplottingUploadedFiles(uploaded){
 swaplottingDense(uploaded);return uploaded.map(entry=>{swaplottingExact(entry,['key','file']);const file=swaplottingOwn(entry,'file');if(entry.key!=='file'||!(file instanceof Blob))fail('SWAPLOTTING_PHOTO_INVALID');const size=Object.getOwnPropertyDescriptor(Blob.prototype,'size').get.call(file),type=Object.getOwnPropertyDescriptor(Blob.prototype,'type').get.call(file);if(!Number.isSafeInteger(size)||size<=0||size>SWAPLOTTING_POST_LIMIT||!['image/jpeg','image/png','image/webp'].includes(type))fail('SWAPLOTTING_PHOTO_INVALID');return {key:'file',file,size,type};});
}
function stagedFiles(files){
 swaplottingDense(files);return files.map(file=>{swaplottingExact(file,['key','filename','bytes']);if(file.key!=='file'||typeof file.filename!=='string'||!/^[0-9a-f]{32}$/.test(file.filename)||!(file.bytes instanceof Uint8Array))fail('SWAPLOTTING_PHOTO_INVALID');return file;});
}
export async function serializeSwaplottingPost(kind,values,files,boundary){return serializeParts(prepareSwaplottingPostValues(kind,values),stagedFiles(files),boundary);}
export function prepareSwaplottingActivityValues(value){
 const keys=['activityType','contentId','title','subtitle','status'];swaplottingExact(value,keys);const body=Object.create(null);for(const key of keys){if(typeof value[key]!=='string')fail();body[key]=value[key];}
 if(body.activityType!=='Swaplotting'||body.contentId!==''||body.status!=='sukses'||!['Swaplotting Tanah Bersertipikat','Swaplotting Tanah Belum Bersertipikat'].includes(body.title))fail();return body;
}
export async function serializeSwaplottingActivity(value,boundary){return serializeParts(prepareSwaplottingActivityValues(value),[],boundary);}
async function serializeParts(body,photos,boundary){
 if(typeof boundary!=='string'||!/^[A-Za-z0-9-]{1,120}$/.test(boundary))fail();
 const chunks=[];let size=0;const append=value=>{const chunk=typeof value==='string'?Buffer.from(value,'utf8'):Buffer.from(value);size+=chunk.length;if(size>SWAPLOTTING_POST_LIMIT)fail('BODY_TOO_LARGE','Ukuran kiriman melebihi batas browser.');chunks.push(chunk);};
 for(const [key,value]of Object.entries(body)){append(`--${boundary}\r\ncontent-disposition: form-data; name="${key}"\r\n\r\n`);append(value);append('\r\n');}
 for(const photo of photos){append(`--${boundary}\r\ncontent-disposition: form-data; name="file"; filename="${photo.filename}"\r\ncontent-type: application/octet-stream\r\n\r\n`);append(photo.bytes);append('\r\n');}
 append(`--${boundary}--\r\n`);return {body:Buffer.concat(chunks,size),contentType:`multipart/form-data; boundary=${boundary}`};
}
export function swaplottingPostOutcome(bytes,contentType,status){
 let json=false;try{const mime=new MIMEType(contentType||'');json=['application/json','text/json'].includes(mime.essence)||mime.subtype.endsWith('+json');}catch{}
 if(bytes.length)try{if(json)JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));else new TextDecoder('utf8').decode(bytes);}catch{fail('SWAPLOTTING_RESPONSE_INVALID','Respons pengiriman belum dapat dipastikan.',502);}
 return status===200;
}
export function createSwaplottingAttempt(){const token=Object.freeze(Object.create(null));attempts.set(token,{dispatched:false});return token;}
export const isSwaplottingAttempt=token=>attempts.has(token);
export const swaplottingWasDispatched=token=>attempts.get(token)?.dispatched===true;
export function markSwaplottingDispatched(token){const state=attempts.get(token);if(!state||state.dispatched)fail('SWAPLOTTING_ATTEMPT_USED','Pengiriman ini sudah dijalankan.',409);state.dispatched=true;}
