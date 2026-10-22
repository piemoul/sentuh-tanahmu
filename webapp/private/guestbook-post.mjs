import {randomInt} from 'node:crypto';
import {createHttpsTransport} from './https-transport.mjs';
import {lostReviewPostOutcome} from './lost-review-post.mjs';

// uBb+b standalone client; native d99af8/d99dd8, not main FRb or Directus.
// The shared Dio finalizer/response converter is composed separately in the
// guestbook submit evidence. This adapter never certifies a physical arrival.
export const GUESTBOOK_POST_ID='post-bukutamu-d99dd8';
export const GUESTBOOK_POST_PATH='bukutamu';
export const GUESTBOOK_POST_URL='https://sentuh.atrbpn.go.id/bukutamu';
export const GUESTBOOK_VALUE_KEYS=Object.freeze(['name','nik','phone','birthDate','birthPlace','address','email','institution','purpose']);
export const GUESTBOOK_POST_FIELDS=Object.freeze(['kantorId','unitKerjaId','userId','nik','alamat','namaLengkap','tempatLahir','tanggalLahir','noTelp','email','instansi','keperluan']);
const attempts=new WeakSet(),dispatched=new WeakSet(),ownedErrors=new WeakSet();
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export class GuestbookPostError extends Error{constructor(status,code,message,details){super(message);this.name='GuestbookPostError';this.status=status;this.code=code;if(details)this.details=details;}}
function fail(status=400,code='GUESTBOOK_POST_INPUT_INVALID',message='Isian Buku Tamu belum sesuai kontrak.',details){const error=new GuestbookPostError(status,code,message,details);ownedErrors.add(error);return error;}
export function guestbookExact(value,keys){if(!plain(value)||Reflect.ownKeys(value).length!==keys.length||Reflect.ownKeys(value).some(key=>typeof key!=='string'||!keys.includes(key)))throw fail();for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!Object.hasOwn(d,'value'))throw fail();}return value;}
function text(value){if(typeof value!=='string')throw fail();try{encodeURIComponent(value);}catch{throw fail();}return value;}
export function prepareGuestbookPostInput(value){
 guestbookExact(value,['contextId',...GUESTBOOK_VALUE_KEYS]);
 if(typeof value.contextId!=='string'||!/^gbc_[A-Za-z0-9_-]{32}$/.test(value.contextId))throw fail();
 const fields={};for(const key of GUESTBOOK_VALUE_KEYS){fields[key]=text(value[key]);if(fields[key].length===0)throw fail();}
 // Native aggregate validator: no trim, exact-digit condition, full email
 // regex, date parsing or date formatting. Widget formatters are separate.
 if(fields.nik.length<16||!fields.email.includes('@'))throw fail();
 return Object.freeze({contextId:value.contextId,fields:Object.freeze(fields)});
}
export function guestbookPostBody(lookup,fields){
 guestbookExact(lookup,['userId','kantorId','unitKerjaId','namaUnitKerja']);
 for(const key of Object.keys(lookup))if(lookup[key]!==null&&typeof lookup[key]!=='string')throw fail();
 guestbookExact(fields,GUESTBOOK_VALUE_KEYS);for(const key of GUESTBOOK_VALUE_KEYS)text(fields[key]);
 return Object.freeze({kantorId:lookup.kantorId,unitKerjaId:lookup.unitKerjaId,userId:lookup.userId,nik:fields.nik,alamat:fields.address,namaLengkap:fields.name,tempatLahir:fields.birthPlace,tanggalLahir:fields.birthDate,noTelp:fields.phone,email:fields.email,instansi:fields.institution,keperluan:fields.purpose});
}
export function serializeGuestbookPost(body,boundary){
 guestbookExact(body,GUESTBOOK_POST_FIELDS);if(typeof boundary!=='string'||!/^--dio-boundary-\d{10}$/.test(boundary)||Number(boundary.slice(-10))>=0x100000000)throw fail();
 const chunks=[];let length=0;const add=value=>{const bytes=Buffer.from(value,'utf8');length+=bytes.length;if(length>25*1024*1024)throw fail(413,'GUESTBOOK_POST_TOO_LARGE','Ukuran kiriman Buku Tamu melebihi batas browser.');chunks.push(bytes);};
 for(const key of GUESTBOOK_POST_FIELDS){const value=body[key];if(value!==null)text(value);add(`--${boundary}\r\ncontent-disposition: form-data; name="${key}"\r\n\r\n${value??''}\r\n`);}add(`--${boundary}--\r\n`);
 return {body:Buffer.concat(chunks,length),contentType:`multipart/form-data; boundary=${boundary}`};
}
export function guestbookPostOutcome(bytes,type,status){try{return lostReviewPostOutcome(bytes,type,status);}catch{throw fail(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum dapat diproses.');}}
export function createGuestbookPostAttempt(){const attempt=Object.freeze({});attempts.add(attempt);return attempt;}
export const guestbookPostWasDispatched=attempt=>dispatched.has(attempt);
function cancelBody(response){try{void Promise.resolve(response?.body?.cancel()).catch(()=>{});}catch{}}

export class GuestbookPostClient{
 #configuration;#transport;#timeoutMs;#maxBytes;
 constructor(configuration,{transport,timeoutMs=30_000,maxResponseBytes=20*1024*1024}={}){
  if(transport!==undefined&&typeof transport!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>120_000||!Number.isInteger(maxResponseBytes)||maxResponseBytes<1||maxResponseBytes>20*1024*1024)throw new TypeError('Konfigurasi pengiriman Buku Tamu tidak valid.');
  this.#configuration=configuration;this.#transport=transport??createHttpsTransport(Object.freeze({}),{timeoutMs,maxRequestBytes:25*1024*1024});this.#timeoutMs=timeoutMs;this.#maxBytes=maxResponseBytes;
 }
 async submit(body,{signal,attempt=createGuestbookPostAttempt()}={}){
  if(!attempts.has(attempt)||dispatched.has(attempt))throw fail(409,'GUESTBOOK_POST_ATTEMPT_USED','Pengiriman Buku Tamu ini sudah dijalankan.');
  if(signal!==undefined&&!(signal instanceof AbortSignal))throw fail();
  const encoded=serializeGuestbookPost(body,'--dio-boundary-'+String(randomInt(0,0x100000000)).padStart(10,'0'));
  const controller=new AbortController();let timedOut=false,response,reader,complete=false,onAbort;
  const cancelled=()=>fail(timedOut?504:499,timedOut?'GUESTBOOK_POST_TIMEOUT':'GUESTBOOK_POST_ABORTED',timedOut?'Waktu tunggu pengiriman Buku Tamu terlampaui.':'Pengiriman Buku Tamu dibatalkan.');
  if(signal?.aborted)throw cancelled();const forward=()=>controller.abort();signal?.addEventListener('abort',forward,{once:true});
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},this.#timeoutMs);timer.unref?.();
  const aborted=new Promise((_,reject)=>{onAbort=()=>reject(cancelled());controller.signal.addEventListener('abort',onAbort,{once:true});});void aborted.catch(()=>{});
  try{
   let authorization;try{if(this.#configuration?.configured!==true||typeof this.#configuration.applicationAuthorization!=='function')throw Error();authorization=this.#configuration.applicationAuthorization();if(typeof authorization!=='string'||!/^AtrBpn [\x21-\x7e]{1,4096}$/.test(authorization))throw Error();}catch{throw fail(503,'GUESTBOOK_POST_CONFIGURATION_UNAVAILABLE','Konfigurasi pengiriman Buku Tamu belum tersedia.');}
   if(controller.signal.aborted)throw cancelled();
   const pending=Promise.resolve().then(()=>{if(controller.signal.aborted)throw cancelled();dispatched.add(attempt);return this.#transport(new URL(GUESTBOOK_POST_URL),{method:'POST',headers:{Authorization:authorization,'Content-Type':encoded.contentType},body:encoded.body,redirect:'manual',signal:controller.signal});});
   void pending.then(late=>{if(controller.signal.aborted)cancelBody(late);},()=>{});
   try{response=await Promise.race([pending,aborted]);}catch(error){if(controller.signal.aborted)throw cancelled();if(ownedErrors.has(error))throw error;throw fail(502,'GUESTBOOK_POST_NETWORK_ERROR','Koneksi pengiriman Buku Tamu belum berhasil.');}
   if(controller.signal.aborted)throw cancelled();
   if(!(response instanceof Response))throw fail(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum dapat diproses.');
   if(response.redirected||response.status>=300&&response.status<400)throw fail(502,'GUESTBOOK_POST_REDIRECT_REJECTED','Pengalihan pengiriman Buku Tamu belum didukung.');
   if(response.url&&response.url!==GUESTBOOK_POST_URL)throw fail(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum dapat diproses.');
   if(response.status<200||response.status>=300)throw fail(502,'GUESTBOOK_POST_HTTP_STATUS','Pengiriman Buku Tamu belum berhasil.',{upstreamStatus:response.status});
   const declared=response.headers.get('content-length');if(declared!==null&&(!/^\d+$/.test(declared)||declared.length>12||Number(declared)>this.#maxBytes))throw fail(502,'GUESTBOOK_POST_RESPONSE_TOO_LARGE','Respons pengiriman Buku Tamu terlalu besar.');
   const chunks=[];let length=0;
   if(response.body){reader=response.body.getReader();while(true){const {done,value}=await Promise.race([reader.read(),aborted]);if(controller.signal.aborted)throw cancelled();if(done){complete=true;break;}if(!(value instanceof Uint8Array))throw fail(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum dapat diproses.');length+=value.byteLength;if(length>this.#maxBytes)throw fail(502,'GUESTBOOK_POST_RESPONSE_TOO_LARGE','Respons pengiriman Buku Tamu terlalu besar.');chunks.push(Buffer.from(value));}}
   else complete=true;
   if(declared!==null&&Number(declared)!==length)throw fail(502,'GUESTBOOK_POST_RESPONSE_INVALID','Respons pengiriman Buku Tamu belum diterima lengkap.');
   const error=guestbookPostOutcome(Buffer.concat(chunks,length),response.headers.get('content-type'),response.status);if(controller.signal.aborted)throw cancelled();
   // No response body, office identity, app header or server text is exposed.
   // The status-only native bool is not a receipt or officer verification.
   return {status:response.status,data:{error},delivery:'received'};
  }catch(error){if(controller.signal.aborted)throw cancelled();if(ownedErrors.has(error))throw error;throw fail(502,'GUESTBOOK_POST_NETWORK_ERROR','Koneksi pengiriman Buku Tamu belum berhasil.');}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',forward);controller.signal.removeEventListener('abort',onAbort);if(!complete){if(reader){try{void Promise.resolve(reader.cancel()).catch(()=>{});}catch{}}else cancelBody(response);}try{reader?.releaseLock();}catch{}controller.abort();}
 }
}
