import {MIMEType} from 'node:util';
import {setTimeout as delay} from 'node:timers/promises';
import {createQueueHttpsTransport} from './https-transport.mjs';
import {parseQueueListJson, parseQueueDetailJson} from './queue-models.mjs';
import {parseQueueCallsJson} from './queue-calls-models.mjs';
import {parseQueueBookingOfficesJson,parseQueueBookingLocationsJson,parseQueueBookingAvailabilityJson,queuePrereadDate} from './queue-preread-models.mjs';

// This client cannot accept a base URL, main account session, custom headers,
// method or body. Identity/selected-ID ownership belongs to its HTTP caller.
const BASE = 'https://aplikasi.atrbpn.go.id/konsol/antrian/directus/';
const LIST_PATH = 'api/antrian/saya';
const RETRY_STATUS = new Set([408,429,500,502,503,504,440,499,460,598,599,520,521,522,523,524,525,527]);
const RETRY_DELAYS = [1000,3000,5000];
const REDIRECT_STATUS = new Set([301,302,303,307,308]);
const MAX_REDIRECTS = 5;
// Explicit Node mapping of recognized transient network failures. This is a
// bounded web mapping, not an asserted identity with every Dart exception CID.
const RETRY_NETWORK = new Set(['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ETIMEDOUT',
  'EHOSTUNREACH','ENETUNREACH','ECONNRESET','EPIPE','UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','UND_ERR_SOCKET','REQUEST_TIMEOUT']);
const NUMBER_ERRORS = new Set(['QUEUE_RAW_JSON_REQUIRED','UNSUPPORTED_QUEUE_NUMBER']);
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024; // Explicit decompressed web bound.
const queryComponent=value=>encodeURIComponent(value.toWellFormed()).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
const selectionId=value=>typeof value==='string'&&value.trim().length>0&&value.length<=1024&&value.isWellFormed()&&!/[\u0000-\u001f\u007f-\u009f]/.test(value);

export class QueueClientError extends Error {
  constructor(status, code, message) {super(message); this.status = status; this.code = code;}
}
const internalErrors = new WeakSet();
const failure = (status,code,message) => {const error=new QueueClientError(status,code,message); internalErrors.add(error); return error;};
const aborted = () => failure(499,'QUEUE_ABORTED','Pembacaan antrean dibatalkan.');
function checkSignal(signal) {
  if (signal !== undefined && !(signal instanceof AbortSignal)) throw failure(400,'QUEUE_SIGNAL_INVALID','Sinyal pembatalan tidak valid.');
  if (signal?.aborted) throw aborted();
}
function cancelBody(response) {try {response?.body?.cancel().catch(()=>{});} catch {}}
function withSignal(promise, signal, discard = ()=>{}) {
  if (!signal) return Promise.resolve(promise);
  return new Promise((resolve,reject) => {
    const cancel=()=>reject(aborted());
    signal.addEventListener('abort',cancel,{once:true});
    if (signal.aborted) cancel();
    Promise.resolve(promise).then(value=>{
      signal.removeEventListener('abort',cancel);
      if (signal.aborted) {discard(value); reject(aborted());} else resolve(value);
    },error=>{signal.removeEventListener('abort',cancel); reject(error);});
  });
}
function networkKind(error) {
  const pending=[error],seen=new Set(); let cancellation=false,timeout=false;
  for(let index=0;index<pending.length && index<8;index++) {
    const item=pending[index];
    if(!item || typeof item!=='object' || seen.has(item)) continue;
    seen.add(item);
    if(RETRY_NETWORK.has(item.code)) return item.code;
    cancellation ||= item.name==='AbortError' || ['REQUEST_ABORTED','ABORT_ERR'].includes(item.code);
    timeout ||= item.name==='TimeoutError';
    if(item.cause) pending.push(item.cause);
    if(Array.isArray(item.errors)) pending.push(...item.errors.slice(0,4));
  }
  return timeout?'REQUEST_TIMEOUT':cancellation?'REQUEST_ABORTED':null;
}
function jsonMime(value) {
  try {
    const mime=new MIMEType(value || '');
    return mime.essence==='application/json' || mime.essence==='text/json' || mime.subtype.endsWith('+json') ? mime.essence : '';
  } catch {return '';}
}
async function responseText(response, signal) {
  if(Number(response.headers.get('content-length'))>MAX_RESPONSE_BYTES) {
    cancelBody(response); throw failure(502,'QUEUE_RESPONSE_TOO_LARGE','Respons antrean melewati batas ukuran browser.');
  }
  if(!response.body) return '';
  const reader=response.body.getReader(),chunks=[]; let total=0;
  const cancel=()=>{reader.cancel().catch(()=>{});};
  signal?.addEventListener('abort',cancel,{once:true});
  try {
    while(true) {
      checkSignal(signal);
      const {value,done}=await reader.read();
      checkSignal(signal);
      if(done) break;
      total+=value.byteLength;
      if(total>MAX_RESPONSE_BYTES) {await reader.cancel(); throw failure(502,'QUEUE_RESPONSE_TOO_LARGE','Respons antrean melewati batas ukuran browser.');}
      chunks.push(value);
    }
  } finally {signal?.removeEventListener('abort',cancel); reader.releaseLock();}
  // Native malformed-byte codec details are not fully proved. Fatal UTF-8 is
  // an explicit web guard; never retry a decoding/format failure.
  try {return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,total));}
  catch {throw failure(502,'QUEUE_RESPONSE_UNRECOGNIZED','Respons antrean tidak sesuai format layanan.');}
}
function redact(value,secrets) {
  if(typeof value==='string') {for(const secret of secrets) value=value.split(secret).join('[REDACTED]'); return value;}
  if(Array.isArray(value)) return value.map(item=>redact(item,secrets));
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,redact(item,secrets)]));
  return value;
}

export class QueueClient {
  #configuration; #transport; #log; #sleep;
  constructor(configuration,{transport,log=entry=>process.stdout.write(JSON.stringify(entry)+'\n'),sleep=(ms,{signal}={})=>delay(ms,undefined,{signal})}={}) {
    this.#configuration=configuration;
    this.#transport=transport || createQueueHttpsTransport(configuration);
    this.#log=log;
    this.#sleep=sleep;
  }
  list(rawCommaJoinedNik,{signal}={}) {
    if(typeof rawCommaJoinedNik!=='string' || !rawCommaJoinedNik.length) return Promise.reject(failure(400,'QUEUE_IDENTITY_REQUIRED','Identitas antrean belum tersedia.'));
    const encoded=encodeURIComponent(rawCommaJoinedNik.toWellFormed()).replace(/[!'()*]/g,char=>'%'+char.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
    return this.#read(new URL(BASE+LIST_PATH+'?nik='+encoded),'list',signal);
  }
  calls(rawCommaJoinedNik,{signal}={}) {
    // Empty-identity calls are deliberately stopped by this browser adapter,
    // including the native Panggilan edge case whose joined key can be empty.
    if(typeof rawCommaJoinedNik!=='string' || !rawCommaJoinedNik.length) return Promise.reject(failure(400,'QUEUE_IDENTITY_REQUIRED','Identitas antrean belum tersedia.'));
    const encoded=encodeURIComponent(rawCommaJoinedNik.toWellFormed()).replace(/[!'()*]/g,char=>'%'+char.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
    return this.#read(new URL(BASE+'api/notifikasi?nik='+encoded),'calls',signal);
  }
  detail(fullId,{signal}={}) {
    // Reserved path/URL separators and pre-encoded percent forms have no closed
    // native parity proof. Reject them instead of changing path ownership.
    if(typeof fullId!=='string' || !fullId.length || fullId.length>1024 || !fullId.isWellFormed() || /[\\/?#%\u0000-\u001f\u007f-\u009f]/.test(fullId) || ['.','..'].includes(fullId)) return Promise.reject(failure(400,'QUEUE_DETAIL_ID_INVALID','Referensi antrean tidak didukung.'));
    const encoded=encodeURIComponent(fullId).replace(/%3A/gi,':');
    return this.#read(new URL(BASE+'api/antrian/'+encoded),'detail',signal);
  }
  offices({signal}={}) {return this.#read(new URL(BASE+'items/kantor?limit=1000&sort=nama'),'offices',signal);}
  locations(officeId,{signal}={}) {
    if(!selectionId(officeId))return Promise.reject(failure(400,'QUEUE_OFFICE_ID_INVALID','Pilih Kantor Pertanahan yang tersedia.'));
    return this.#read(new URL(BASE+'items/lokasi?filter%5Bkantor%5D='+queryComponent(officeId)),'locations',signal);
  }
  availability(locationId,date,{signal}={}) {
    if(!selectionId(locationId))return Promise.reject(failure(400,'QUEUE_LOCATION_ID_INVALID','Pilih Lokasi Kerja yang tersedia.'));
    try {queuePrereadDate(date);}catch{return Promise.reject(failure(400,'QUEUE_DATE_INVALID','Tanggal antrean harus berupa tanggal kalender yyyy-MM-dd.'));}
    return this.#read(new URL(BASE+'api/antrian?lokasi='+queryComponent(locationId)+'&tanggal='+queryComponent(date)),'availability',signal);
  }
  #emit(operation,attempt,fields) {
    const path={offices:'items/kantor',locations:'items/lokasi',availability:'api/antrian',calls:'api/notifikasi',list:'api/antrian/saya',detail:'api/antrian/:id'}[operation];
    try {this.#log({event:'queue_request',service:'queue-directus',method:'GET',path:'/konsol/antrian/directus/'+path,attempt,...fields});} catch {}
  }
  async #response(original,init,operation,attempt,signal) {
    let current=original;
    const visited=new Set([current.href]);
    for(let hop=0;hop<=MAX_REDIRECTS;hop++) {
      checkSignal(signal);
      const response=await withSignal(this.#transport(current.href,init),signal,cancelBody);
      if(signal?.aborted) {cancelBody(response);throw aborted();}
      if(!(response instanceof Response)) throw failure(502,'QUEUE_RESPONSE_UNRECOGNIZED','Respons antrean tidak sesuai format layanan.');
      // The supplied transport must remain manual: do not trust a previously
      // followed response whose credential destinations cannot be inspected.
      if(response.redirected || (response.url && response.url!==current.href)) {
        cancelBody(response);throw failure(502,'QUEUE_REDIRECT_REJECTED','Pengalihan layanan antrean ditolak.');
      }
      if(response.status<300 || response.status>=400) return response;
      cancelBody(response);
      let target;
      try {const location=response.headers.get('location');if(!location || /[\u0000-\u001f\u007f]/.test(location))throw Error();target=new URL(location,current);} catch {throw failure(502,'QUEUE_REDIRECT_REJECTED','Pengalihan layanan antrean ditolak.');}
      // The live service canonicalizes these GETs by appending '/'. Accept only
      // that same endpoint (or its original spelling), exact HTTPS audience and
      // identical decoded query entries. No other path or identity is allowed.
      const sameQuery=JSON.stringify([...target.searchParams])===JSON.stringify([...original.searchParams]);
      if(!REDIRECT_STATUS.has(response.status) || target.origin!==original.origin || target.username || target.password || target.hash || ![original.pathname,original.pathname+'/'].includes(target.pathname) || !sameQuery)throw failure(502,'QUEUE_REDIRECT_REJECTED','Pengalihan layanan antrean ditolak.');
      if(visited.has(target.href))throw failure(502,'QUEUE_REDIRECT_LOOP','Pengalihan layanan antrean berulang.');
      if(hop===MAX_REDIRECTS)throw failure(502,'QUEUE_REDIRECT_LIMIT','Pengalihan layanan antrean melewati batas.');
      visited.add(target.href);
      this.#emit(operation,attempt,{status:response.status,outcome:'redirect',redirect:hop+1});
      current=target;
    }
  }
  async #read(url,operation,signal) {
    checkSignal(signal);
    let authorization;
    try {authorization=this.#configuration.queueAuthorization?.();} catch {}
    if(typeof authorization!=='string' || !/^Bearer [^\s\u0000-\u001f\u007f]+$/.test(authorization)) throw failure(503,'QUEUE_CONFIGURATION_REQUIRED','Konfigurasi antrean belum tersedia.');
    const secrets=[authorization,authorization.slice(7)].sort((a,b)=>b.length-a.length);
    const headers=Object.freeze({Authorization:authorization,'User-Agent':'Dart/Flutter'});
    // Same headers/credential generation for every retry of this logical GET.
    const init=Object.freeze({method:'GET',headers,redirect:'manual',signal});
    for(let index=0;index<4;index++) {
      checkSignal(signal);
      let status=null, retry=false, networkCode=null, error;
      try {
        const response=await this.#response(url,init,operation,index+1,signal);
        status=response.status;
        const contentType=jsonMime(response.headers.get('content-type'));
        const text=await responseText(response,signal);
        // Dio awaits transformation before creating badResponse. A JSON format
        // error must therefore stop even an otherwise retryable HTTP 503.
        if(status<200 || status>=300) {
          if(contentType && text.length) {
            try {JSON.parse(text);} catch {throw failure(502,'QUEUE_RESPONSE_UNRECOGNIZED','Respons antrean tidak sesuai format layanan.');}
          }
          retry=RETRY_STATUS.has(status);
          error=failure(502,'QUEUE_HTTP_STATUS','Server antrean belum menyelesaikan pembacaan.');
        } else {
          if(!text.length) throw failure(502,'QUEUE_SERVICE_ERROR','Data antrean belum tersedia dari layanan.');
          if(!contentType) throw failure(502,'QUEUE_RESPONSE_UNRECOGNIZED','Respons antrean tidak sesuai format layanan.');
          let normalized;
          try {normalized=({list:parseQueueListJson,calls:parseQueueCallsJson,detail:parseQueueDetailJson,offices:parseQueueBookingOfficesJson,locations:parseQueueBookingLocationsJson,availability:parseQueueBookingAvailabilityJson}[operation])(text);}
          catch(cause) {throw failure(502,NUMBER_ERRORS.has(cause?.code)?cause.code:'QUEUE_RESPONSE_UNRECOGNIZED','Respons antrean tidak sesuai format layanan.');}
          if(normalized.error) throw failure(502,'QUEUE_SERVICE_ERROR','Data antrean belum tersedia dari layanan.');
          checkSignal(signal);
          this.#emit(operation,index+1,{status,outcome:'success'});
          return {status,contentType:redact(contentType,secrets),data:redact(normalized.data,secrets)};
        }
      } catch(cause) {
        if(signal?.aborted) error=aborted();
        else if(internalErrors.has(cause)) error=cause;
        else {
          networkCode=networkKind(cause);
          error=networkCode==='REQUEST_ABORTED'?aborted():failure(502,'QUEUE_NETWORK_ERROR','Koneksi ke layanan antrean belum berhasil.');
          retry=networkCode!==null && RETRY_NETWORK.has(networkCode);
        }
      }
      const willRetry=retry && index<3 && !signal?.aborted;
      this.#emit(operation,index+1,{status,outcome:willRetry?'retry':'failure',code:error.code,...(networkCode && RETRY_NETWORK.has(networkCode)?{networkCode}:{})});
      if(!willRetry) throw error;
      try {await withSignal(this.#sleep(RETRY_DELAYS[index],{signal}),signal); checkSignal(signal);}
      catch {throw signal?.aborted?aborted():failure(502,'QUEUE_RETRY_FAILED','Pengulangan pembacaan antrean dihentikan.');}
    }
  }
}
