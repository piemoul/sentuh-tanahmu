import {MIMEType} from 'node:util';

// A separate public-TLS read transport; no main/queue TLS configuration, bearer,
// cookie, arbitrary URL, header, or request body is accepted by this interface.
const TILE_URL = 'https://bhumi.atrbpn.go.id/expapi/live-bhumi-wms';
const REFERER = 'https://bhumi.atrbpn.go.id/';
const TOKEN_PATH = 'Bhumi/haiiizzzzzzz';
const MAX_BYTES = 5 * 1024 * 1024;
const TOKEN_TTL_MS = 240_000;
const WORLD = 40075016.69578488;
const HALF = 20037508.34789244;
const PNG = Buffer.from([137,80,78,71,13,10,26,10]);
const internalErrors = new WeakSet();

export class BhumiMapError extends Error {
  constructor(status, code, message) { super(message); this.status=status; this.code=code; }
}
function failure(status,code,message) {
  const error=new BhumiMapError(status,code,message); internalErrors.add(error); return error;
}
const cancelled=()=>failure(499,'BHUMI_ABORTED','Pembacaan peta dibatalkan.');
const unavailable=()=>failure(502,'BHUMI_TOKEN_UNAVAILABLE','Token pembacaan peta belum tersedia.');
const invalidImage=()=>failure(502,'BHUMI_IMAGE_INVALID','Layanan peta belum mengembalikan gambar PNG yang valid.');
function throwIfAborted(signal) {
  if(signal?.aborted) throw internalErrors.has(signal.reason)?signal.reason:cancelled();
}
function cancelBody(response) { try { response?.body?.cancel().catch(()=>{}); } catch {} }
function wait(promise,signal,discard=()=>{}) {
  return new Promise((resolve,reject)=>{
    let done=false;
    const finish=(handler,value)=>{ if(done)return; done=true; signal?.removeEventListener('abort',abort); handler(value); };
    const abort=()=>finish(reject,internalErrors.has(signal?.reason)?signal.reason:cancelled());
    signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted) abort();
    Promise.resolve(promise).then(value=>{
      if(done || signal?.aborted) {try {discard(value);} catch {} if(!done)abort();}
      else finish(resolve,value);
    },error=>finish(reject,error));
  });
}
function deadline(timeoutMs,signals) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(failure(504,'BHUMI_TIMEOUT','Waktu tunggu pembacaan peta habis.')),timeoutMs);
  timer.unref?.();
  return {signal:AbortSignal.any([...signals,controller.signal]),clear:()=>clearTimeout(timer)};
}
function secretString(value) {
  // Length, Unicode and control-byte limits are web guards, not native casts.
  return typeof value==='string' && value.length>0 && value.length<=32_768 && value.isWellFormed() && !/[\u0000-\u001f\u007f-\u009f]/.test(value);
}
function field(record,key) {
  const descriptor=Object.getOwnPropertyDescriptor(record,key);
  if(!descriptor) return undefined;
  if(!Object.hasOwn(descriptor,'value')) throw unavailable();
  return descriptor.value;
}
function tokenFrom(result,session) {
  if(result?.status!==200) throw unavailable();
  const body=result.data;
  if(!body || typeof body!=='object' || Array.isArray(body) || ![Object.prototype,null].includes(Object.getPrototypeOf(body))) throw unavailable();
  if(field(body,'error')===true) throw unavailable();
  const token=field(body,'message');
  if(!secretString(token)) throw unavailable();
  // Never forward an echoed main-session credential as a dedicated WMS token.
  for(const secret of [session.tokens?.accessToken,session.tokens?.refreshToken]) {
    if(typeof secret==='string' && secret.length && token.includes(secret)) throw unavailable();
  }
  return token;
}
function component(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g,char=>'%'+char.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
}
function doubleString(value) {
  // Same bounded Dart shortest-double formatting proven in queue-model-followup.
  if(Object.is(value,-0)) return '-0.0';
  const text=Number.prototype.toString.call(value,10);
  return text.includes('.') || text.includes('e') ? text : text+'.0';
}
function tileUrl(x,y,z,token,authkey) {
  const span=WORLD / 2**z;
  const bbox=[-HALF+x*span,HALF-(y+1)*span,-HALF+(x+1)*span,HALF-y*span].map(doubleString).join(',');
  const query=[['token',token],['service','WMS'],['version','1.1.1'],['request','GetMap'],
    ['layers','petabpn:PersilBerdasarkanJenisHakStroke'],['bbox',bbox],['width','256'],['height','256'],
    ['srs','EPSG:900913'],['format','image/png'],['transparent','true'],['authkey',authkey]];
  return TILE_URL+'?'+query.map(([key,value])=>component(key)+'='+component(value)).join('&');
}
function pngMime(value) {
  try {return new MIMEType(value || '').essence==='image/png';} catch {return false;}
}
async function imageBytes(response,signal,secrets) {
  const declared=response.headers.get('content-length');
  if(declared!==null && (!/^\d+$/.test(declared) || Number(declared)>MAX_BYTES)) {
    cancelBody(response); throw failure(502,'BHUMI_IMAGE_TOO_LARGE','Gambar peta melewati batas ukuran.');
  }
  if(!pngMime(response.headers.get('content-type')) || !response.body) {cancelBody(response);throw invalidImage();}
  const reader=response.body.getReader(),chunks=[]; let total=0;
  const cancel=()=>{try {reader.cancel().catch(()=>{});} catch {}};
  signal.addEventListener('abort',cancel,{once:true});
  try {
    while(true) {
      throwIfAborted(signal);
      const {value,done}=await wait(reader.read(),signal);
      throwIfAborted(signal);
      if(done) break;
      if(!(value instanceof Uint8Array)) throw invalidImage();
      total+=value.byteLength;
      if(total>MAX_BYTES) {cancel();throw failure(502,'BHUMI_IMAGE_TOO_LARGE','Gambar peta melewati batas ukuran.');}
      chunks.push(value);
    }
  } catch(error) {cancel();throw error;}
  finally {signal.removeEventListener('abort',cancel);try {reader.releaseLock();} catch {}}
  const bytes=Buffer.concat(chunks,total);
  if(bytes.length<PNG.length || !bytes.subarray(0,PNG.length).equals(PNG)) throw invalidImage();
  // A server that merely prepends a PNG signature to echoed credentials must
  // not turn those values into browser-visible bytes. No image content is logged.
  if(secrets.some(secret=>bytes.includes(Buffer.from(secret,'utf8')))) throw invalidImage();
  return bytes;
}

export class BhumiMapClient {
  #configuration; #mainClient; #transport; #log; #now; #timeoutMs;
  #states=new WeakMap(); #closed=new AbortController();
  constructor(configuration,{mainClient,transport=(url,init)=>globalThis.fetch(url,init),log=()=>{},now=Date.now,timeoutMs=30_000}={}) {
    if(!Number.isSafeInteger(timeoutMs) || timeoutMs<1 || timeoutMs>30_000) throw failure(400,'BHUMI_TIMEOUT_INVALID','Batas waktu peta tidak valid.');
    this.#configuration=configuration; this.#mainClient=mainClient; this.#transport=transport;
    this.#log=log; this.#now=now; this.#timeoutMs=timeoutMs;
  }
  #authenticated(session) {
    if(this.#closed.signal.aborted) throw failure(503,'BHUMI_CLIENT_CLOSED','Pembacaan peta sudah ditutup.');
    if(!session || typeof session!=='object' || session.active===false || !session.tokens || !(session.authenticationSignal instanceof AbortSignal) || session.authenticationSignal.aborted) {
      throw failure(401,'BHUMI_AUTH_REQUIRED','Silakan masuk kembali untuk membaca peta.');
    }
  }
  #state(session) {
    this.#authenticated(session);
    let state=this.#states.get(session);
    if(state && state.authenticationSignal!==session.authenticationSignal) {this.invalidateSession(session);state=null;}
    if(!state) {
      state={authenticationSignal:session.authenticationSignal,controller:new AbortController(),token:null,inflight:null,sequence:0};
      // This listener is owned by the session's own signal, not a global strong
      // session set. Invalidating an older generation never deletes a new one.
      state.onLogout=()=>{if(this.#states.get(session)===state)this.invalidateSession(session);};
      this.#states.set(session,state);
      state.authenticationSignal.addEventListener('abort',state.onLogout,{once:true});
    }
    return state;
  }
  #current(session,state,signal) {
    this.#authenticated(session);
    if(this.#states.get(session)!==state || session.authenticationSignal!==state.authenticationSignal || state.controller.signal.aborted) throw failure(409,'BHUMI_SESSION_CHANGED','Sesi berubah saat peta dimuat. Muat ulang peta.');
    throwIfAborted(signal);
  }
  invalidateSession(session) {
    if(!session || typeof session!=='object') return;
    const state=this.#states.get(session);
    if(!state) return;
    this.#states.delete(session);
    state.token=null;state.sequence++;
    state.authenticationSignal.removeEventListener('abort',state.onLogout);
    state.controller.abort();
  }
  close() {this.#closed.abort();}
  #emit(attempt,fields) {
    try {this.#log({event:'bhumi_tile_request',service:'bhumi-wms',method:'GET',path:'/expapi/live-bhumi-wms',attempt,...fields});} catch {}
  }
  #token(session,state) {
    this.#current(session,state);
    if(state.token && this.#now()<state.token.expiresAt) return Promise.resolve(state.token);
    if(state.inflight) return state.inflight.promise;
    const owner={sequence:++state.sequence,promise:null};
    state.inflight=owner;
    // Defer start until owner is installed; all concurrent tiles share it.
    owner.promise=Promise.resolve().then(()=>this.#loadToken(session,state,owner)).finally(()=>{if(state.inflight===owner)state.inflight=null;});
    return owner.promise;
  }
  async #loadToken(session,state,owner) {
    const scope=deadline(this.#timeoutMs,[state.controller.signal,state.authenticationSignal,this.#closed.signal]);
    try {
      this.#current(session,state,scope.signal);
      if(typeof this.#mainClient?.ensureFresh!=='function' || typeof this.#mainClient?.request!=='function') throw failure(503,'BHUMI_CONFIGURATION_REQUIRED','Konfigurasi pembacaan peta belum tersedia.');
      await wait(this.#mainClient.ensureFresh(session),scope.signal);
      this.#current(session,state,scope.signal);
      const result=await wait(this.#mainClient.request({path:TOKEN_PATH,method:'GET',encoding:'none',query:{},body:{},auth:'session',session,signal:scope.signal}),scope.signal);
      this.#current(session,state,scope.signal);
      const value=tokenFrom(result,session);
      if(state.inflight!==owner) throw failure(409,'BHUMI_SESSION_CHANGED','Sesi berubah saat peta dimuat. Muat ulang peta.');
      const token={value,sequence:owner.sequence,expiresAt:this.#now()+TOKEN_TTL_MS};
      state.token=token;
      return token;
    } catch(error) {
      this.#current(session,state,scope.signal);
      if(internalErrors.has(error)) throw error;
      // Only these status decisions survive trusted main-client failures; no
      // upstream message, details, code, stack, response or cause is exposed.
      if(error?.status===401) throw failure(401,'BHUMI_AUTH_REQUIRED','Silakan masuk kembali untuk membaca peta.');
      if(error?.status===409) throw failure(409,'BHUMI_SESSION_CHANGED','Sesi berubah saat peta dimuat. Muat ulang peta.');
      throw unavailable();
    } finally {scope.clear();}
  }
  async tile({x,y,z,session,signal}={}) {
    if(![x,y,z].every(Number.isSafeInteger) || z<0 || z>21 || x<0 || y<0 || x>=2**z || y>=2**z) throw failure(400,'BHUMI_TILE_INVALID','Koordinat tile peta tidak valid.');
    if(signal!==undefined && !(signal instanceof AbortSignal)) throw failure(400,'BHUMI_SIGNAL_INVALID','Sinyal pembatalan tidak valid.');
    throwIfAborted(signal);
    const state=this.#state(session);
    const scope=deadline(this.#timeoutMs,[state.controller.signal,state.authenticationSignal,this.#closed.signal,...(signal?[signal]:[])]);
    let attempt=0,status=null;
    try {
      this.#current(session,state,scope.signal);
      let token=await wait(this.#token(session,state),scope.signal);
      this.#current(session,state,scope.signal);
      let authkey;
      try {authkey=this.#configuration?.bhumiAuthKey?.();} catch {}
      if(!secretString(authkey)) throw failure(503,'BHUMI_CONFIGURATION_REQUIRED','Konfigurasi pembacaan peta belum tersedia.');
      for(attempt=1;attempt<=2;attempt++) {
        this.#current(session,state,scope.signal);
        const url=tileUrl(x,y,z,token.value,authkey);
        const init={method:'GET',headers:{Referer:REFERER},redirect:'manual',credentials:'omit',signal:scope.signal};
        const response=await wait(this.#transport(url,init),scope.signal,cancelBody);
        try {this.#current(session,state,scope.signal);} catch(error) {cancelBody(response);throw error;}
        if(!(response instanceof Response)) throw invalidImage();
        status=response.status;
        if(response.redirected || (response.url && response.url!==url) || (status>=300 && status<400)) {cancelBody(response);throw failure(502,'BHUMI_REDIRECT_REJECTED','Pengalihan layanan peta ditolak.');}
        if(attempt===1 && [401,403].includes(status)) {
          cancelBody(response);
          // Object identity is an additional web generation guard: a late T1
          // failure cannot clear a newly published T2, even if strings repeat.
          if(state.token===token) state.token=null;
          this.#emit(attempt,{status,outcome:'retry'});
          token=await wait(this.#token(session,state),scope.signal);
          this.#current(session,state,scope.signal);
          continue;
        }
        if(status!==200) {cancelBody(response);throw failure(502,'BHUMI_HTTP_STATUS','Layanan peta belum menyelesaikan pembacaan gambar.');}
        const bytes=await imageBytes(response,scope.signal,[token.value,authkey]);
        this.#current(session,state,scope.signal);
        this.#emit(attempt,{status,outcome:'success'});
        return {status:200,contentType:'image/png',bytes};
      }
    } catch(error) {
      let safe;
      try {this.#current(session,state,scope.signal);safe=internalErrors.has(error)?error:failure(502,'BHUMI_NETWORK_ERROR','Koneksi ke layanan peta belum berhasil.');}
      catch(currentError) {safe=internalErrors.has(currentError)?currentError:cancelled();}
      this.#emit(attempt,{status,outcome:'failure',code:safe.code});
      throw safe;
    } finally {scope.clear();}
  }
}
