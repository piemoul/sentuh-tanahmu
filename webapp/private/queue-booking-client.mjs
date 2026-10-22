import {createQueueHttpsTransport} from './https-transport.mjs';
import {QueueClientError} from './queue-client.mjs';
import {QUEUE_BOOKING_LIMIT_PATH,serializeQueueBookingLimit,decodeQueueBookingLimitBytes,queueBookingRejectionMessage} from './queue-booking-models.mjs';

const BASE='https://aplikasi.atrbpn.go.id/konsol/antrian/directus/';
const MAX_RESPONSE_BYTES=20*1024*1024; // Explicit bounded browser policy.
const fail=(status,code,message)=>new QueueClientError(status,code,message);
const aborted=()=>fail(499,'QUEUE_BOOKING_ABORTED','Pemeriksaan antrean dibatalkan.');
function check(signal){if(signal!==undefined&&!(signal instanceof AbortSignal))throw fail(400,'QUEUE_BOOKING_SIGNAL_INVALID','Sinyal pembatalan tidak valid.');if(signal?.aborted)throw aborted();}
function cancel(response){try{response?.body?.cancel().catch(()=>{});}catch{}}
function withSignal(promise,signal){
 if(!signal)return Promise.resolve(promise);
 return new Promise((resolve,reject)=>{const abort=()=>reject(aborted());signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();Promise.resolve(promise).then(value=>{signal.removeEventListener('abort',abort);if(signal.aborted){cancel(value);reject(aborted());}else resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});
}
async function responseBytes(response,signal){
 if(Number(response.headers.get('content-length'))>MAX_RESPONSE_BYTES){cancel(response);throw fail(502,'QUEUE_BOOKING_RESPONSE_TOO_LARGE','Respons pemeriksaan antrean melewati batas ukuran browser.');}
 if(!response.body)return new Uint8Array();
 const reader=response.body.getReader(),chunks=[];let total=0;
 const abort=()=>{reader.cancel().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
 try{while(true){check(signal);const part=await reader.read();check(signal);if(part.done)break;total+=part.value.byteLength;if(total>MAX_RESPONSE_BYTES){await reader.cancel();throw fail(502,'QUEUE_BOOKING_RESPONSE_TOO_LARGE','Respons pemeriksaan antrean melewati batas ukuran browser.');}chunks.push(part.value);}}
 finally{signal?.removeEventListener('abort',abort);reader.releaseLock();}
 return Buffer.concat(chunks,total);
}

// This separate POST client reuses the positively identified FRb+0xb TLS/auth
// audience. It does NOT inherit QueueClient's GET retries or canonical redirects.
// A quota POST is not assumed side-effect-free/idempotent. No create method,
// custom URL/headers, account bearer or caller-controlled FCM token is exposed.
export class QueueBookingClient {
 #configuration;#transport;#log;
 constructor(configuration,{transport,log=entry=>process.stdout.write(JSON.stringify(entry)+'\n')}={}){this.#configuration=configuration;this.#transport=transport||createQueueHttpsTransport(configuration);this.#log=log;}
 async limit(values,{signal}={}){
  check(signal);let body;
  try{body=serializeQueueBookingLimit(values);}catch{throw fail(400,'QUEUE_BOOKING_LIMIT_SCOPE','Parameter pemeriksaan antrean tidak sesuai kontrak.');}
  let authorization;try{authorization=this.#configuration.queueAuthorization?.();}catch{}
  if(typeof authorization!=='string'||!/^Bearer [^\s\u0000-\u001f\u007f]+$/.test(authorization))throw fail(503,'QUEUE_CONFIGURATION_REQUIRED','Konfigurasi antrean belum tersedia.');
  const url=BASE+QUEUE_BOOKING_LIMIT_PATH;
  const headers=Object.freeze({Authorization:authorization,'User-Agent':'Dart/Flutter','Content-Type':'application/json'});
  const init=Object.freeze({method:'POST',headers,body,redirect:'manual',signal});
  let status=null;
  try{
   const response=await withSignal(this.#transport(url,init),signal);check(signal);
   if(!(response instanceof Response))throw fail(502,'QUEUE_BOOKING_RESPONSE_UNRECOGNIZED','Respons pemeriksaan antrean tidak sesuai format layanan.');
   status=response.status;
   if(response.redirected||(response.url&&response.url!==url)||status>=300&&status<400){cancel(response);throw fail(502,'QUEUE_BOOKING_REDIRECT_REJECTED','Pengalihan pemeriksaan antrean ditolak.');}
   const bytes=await responseBytes(response,signal);check(signal);
   let data;
   if(status<200||status>=300){const rejection=queueBookingRejectionMessage(bytes,response.headers.get('content-type'));if(!rejection)throw fail(502,'QUEUE_BOOKING_HTTP_STATUS','Server antrean belum menyelesaikan pemeriksaan.');data={error:true,data:null,message:rejection.message};}
   else data=decodeQueueBookingLimitBytes(bytes,response.headers.get('content-type'));
   // Provider text is returned only to the owning browser session, and the
   // standalone application bearer must never be reflected into that text.
   if(typeof data.message==='string')for(const secret of [authorization,authorization.slice(7)].sort((a,b)=>b.length-a.length))data.message=data.message.split(secret).join('[REDACTED]');
   this.#emit(status,status>=200&&status<300?'success':'service-rejection');return {status,contentType:'application/json',data};
  }catch(error){
   const result=signal?.aborted?aborted():error instanceof QueueClientError?error:fail(502,'QUEUE_BOOKING_NETWORK_ERROR','Koneksi pemeriksaan antrean belum berhasil.');
   this.#emit(status,'failure',result.code);throw result;
  }
 }
 #emit(status,outcome,code){try{this.#log({event:'queue_booking_request',service:'queue-directus',method:'POST',path:'/konsol/antrian/directus/'+QUEUE_BOOKING_LIMIT_PATH,attempt:1,status,outcome,...(code?{code}:{})});}catch{}}
}
