import test from 'node:test';
import assert from 'node:assert/strict';
import {BhumiMapClient,BhumiMapError} from '../private/bhumi-map-client.mjs';
import {SessionStore,clearAuthentication} from '../private/session.mjs';

const AUTHKEY='synthetic-private-bhumi-authkey';
const TOKEN='synthetic-dedicated-wms-token';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const tile=(overrides={})=>({x:1,y:1,z:1,...overrides});
const image=(bytes=PNG,status=200,type='image/png')=>new Response(bytes,{status,headers:type?{'Content-Type':type}:{}});
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function session() {
  const value=new SessionStore().create();
  value.tokens={accessToken:'synthetic-main-access',refreshToken:'synthetic-main-refresh',expiredAt:null};
  value.user={username:'synthetic-own-account'};
  return value;
}
function fixture({tokenReply,respond,ensureFresh,now,timeoutMs,authkey=()=>AUTHKEY,log}={}) {
  const mainCalls=[],freshCalls=[],calls=[],logs=[];let keyCalls=0;
  const configuration={bhumiAuthKey(){keyCalls++;return authkey();},tlsOptions(){throw Error('main TLS must not be used');},queueTlsOptions(){throw Error('queue TLS must not be used');},applicationAuthorization(){throw Error('main application auth must not be read');}};
  const mainClient={
    ensureFresh(s){freshCalls.push(s);return ensureFresh?.(s,freshCalls.length);},
    request(options){mainCalls.push(options);return tokenReply?tokenReply(options,mainCalls.length):{status:200,data:{error:false,message:TOKEN}};}
  };
  const client=new BhumiMapClient(configuration,{mainClient,transport:(url,init)=>{const call={url:new URL(url),rawUrl:url,init};calls.push(call);return respond?respond(call,calls.length):image();},now,timeoutMs,log:entry=>{logs.push(entry);log?.(entry);}});
  return{client,mainClient,configuration,calls,mainCalls,freshCalls,logs,get keyCalls(){return keyCalls;}};
}
const rejects=(promise,code,status=502)=>assert.rejects(promise,error=>error instanceof BhumiMapError && error.code===code && error.status===status);

test('Bhumi constructor is lazy and malformed XYZ cannot derive keys or call main/tile transport',async()=>{
  const f=fixture();new BhumiMapClient({});
  for(const input of [undefined,{},tile({x:'1'}),tile({y:1.2}),tile({z:NaN}),tile({z:22}),tile({z:-1}),tile({x:-1}),tile({y:-1}),tile({x:2}),tile({y:2}),tile({x:Infinity}),tile({x:2**53}),tile({z:0})]) {
    await rejects(f.client.tile(input),'BHUMI_TILE_INVALID',400);
  }
  await rejects(f.client.tile(tile({session:session(),signal:{}})),'BHUMI_SIGNAL_INVALID',400);
  assert.equal(f.mainCalls.length,0);assert.equal(f.calls.length,0);assert.equal(f.keyCalls,0);
});

test('XYZ web guards allow world and maximum zoom edges without coercion',async()=>{
  const f=fixture(),s=session();
  for(const input of [{x:0,y:0,z:0},{x:2**21-1,y:2**21-1,z:21}]) assert.equal((await f.client.tile({...input,session:s})).status,200);
  for(const input of [{x:2**21,y:0,z:21},{x:0,y:2**21,z:21},{x:0n,y:0,z:0},{x:0,y:0,z:'0'}]) await rejects(f.client.tile({...input,session:s}),'BHUMI_TILE_INVALID',400);
  assert.equal(f.calls.length,2);
});

test('missing inactive or revoked main session stops before all private configuration',async()=>{
  const f=fixture(),inactive=session(),revoked=session();inactive.active=false;revoked.authenticationController.abort();
  for(const s of [null,{}, {tokens:{}},inactive,revoked]) await rejects(f.client.tile(tile({session:s})),'BHUMI_AUTH_REQUIRED',401);
  const aborted=new AbortController();aborted.abort(new Error(AUTHKEY));
  await rejects(f.client.tile(tile({session:session(),signal:aborted.signal})),'BHUMI_ABORTED',499);
  assert.equal(f.keyCalls,0);assert.equal(f.mainCalls.length,0);assert.equal(f.calls.length,0);
});

test('token uses main client exact GET; tile uses only fixed Bhumi URL Referer and no main credentials',async()=>{
  const f=fixture(),s=session();const out=await f.client.tile(tile({session:s}));
  assert.deepEqual(Object.keys(out).sort(),['bytes','contentType','status']);assert.equal(out.contentType,'image/png');assert.deepEqual(out.bytes,PNG);
  assert.equal(f.freshCalls[0],s);assert.equal(f.mainCalls.length,1);
  const main=f.mainCalls[0];
  assert.deepEqual(Object.keys(main).sort(),['auth','body','encoding','method','path','query','session','signal']);
  assert.equal(main.path,'Bhumi/haiiizzzzzzz');assert.equal(main.method,'GET');assert.equal(main.encoding,'none');assert.equal(main.auth,'session');assert.equal(main.session,s);assert.deepEqual(main.query,{});assert.deepEqual(main.body,{});assert.ok(main.signal instanceof AbortSignal);
  const {url,init}=f.calls[0];assert.equal(url.origin,'https://bhumi.atrbpn.go.id');assert.equal(url.pathname,'/expapi/live-bhumi-wms');
  assert.deepEqual(init.headers,{Referer:'https://bhumi.atrbpn.go.id/'});assert.equal(init.method,'GET');assert.equal(init.redirect,'manual');assert.equal(init.credentials,'omit');assert.ok(init.signal instanceof AbortSignal);
  for(const key of ['body','session','dispatcher','agent','ca','pfx','cert','key'])assert.equal(init[key],undefined);
  assert.ok(!f.calls[0].rawUrl.includes(s.tokens.accessToken));assert.ok(!f.calls[0].rawUrl.includes(s.tokens.refreshToken));
  assert.deepEqual([...url.searchParams.keys()],['token','service','version','request','layers','bbox','width','height','srs','format','transparent','authkey']);
  assert.deepEqual(Object.fromEntries(url.searchParams),{token:TOKEN,service:'WMS',version:'1.1.1',request:'GetMap',layers:'petabpn:PersilBerdasarkanJenisHakStroke',bbox:'0.0,-20037508.34789244,20037508.34789244,0.0',width:'256',height:'256',srs:'EPSG:900913',format:'image/png',transparent:'true',authkey:AUTHKEY});
});

test('native WMS query is stable one-pass escaping and bbox keeps double zero and axis order',async()=>{
  const special="opaque +/%~!'()*é",f=fixture({tokenReply:()=>({status:200,data:{message:special}}),authkey:()=>special+'-key'}),s=session();
  await f.client.tile({x:0,y:0,z:1,session:s});
  const call=f.calls[0];assert.ok(call.rawUrl.includes('token=opaque+%2B%2F%25~%21%27%28%29%2A%C3%A9&'));
  assert.equal(call.url.searchParams.get('token'),special);assert.equal(call.url.searchParams.get('authkey'),special+'-key');
  assert.equal(call.url.searchParams.get('bbox'),'-20037508.34789244,0.0,0.0,20037508.34789244');
  await f.client.tile({x:0,y:0,z:0,session:s});
  assert.equal(f.calls[1].url.searchParams.get('bbox'),'-20037508.34789244,-20037508.34789244,20037508.34789244,20037508.34789244');
});

test('ensureFresh may replace main tokens in same authentication generation before token GET',async()=>{
  const s=session(),replacement={accessToken:'synthetic-refreshed-access',refreshToken:'synthetic-refreshed-refresh'};
  const f=fixture({ensureFresh:async value=>{assert.equal(value,s);value.tokens=replacement;},tokenReply:options=>{assert.equal(options.session.tokens,replacement);return{status:200,data:{message:TOKEN}};}});
  assert.equal((await f.client.tile(tile({session:s}))).status,200);assert.equal(s.tokens,replacement);
});

test('native token envelope accepts error != true and a nonempty String without second JSON decode',async()=>{
  for(const error of [undefined,false,null,0,1,'true','false',{},[]]) {
    const f=fixture({tokenReply:()=>({status:200,data:{error,message:TOKEN}})});
    assert.equal((await f.client.tile(tile({session:session()}))).status,200);
  }
  const nullPrototype=Object.assign(Object.create(null),{message:TOKEN});
  assert.equal((await fixture({tokenReply:()=>({status:200,data:nullPrototype})}).client.tile(tile({session:session()}))).status,200);
  const blank=fixture({tokenReply:()=>({status:200,data:{message:' '}}),respond:()=>image(SIGNATURE)});
  assert.equal((await blank.client.tile(tile({session:session()}))).status,200);
});

test('malformed token envelope and non200 reject before authkey or tile without aliases/coercion',async()=>{
  const bodies=[null,[],7,'{"error":false,"message":"'+TOKEN+'"}',{error:true,message:TOKEN},{token:TOKEN},{message:''},{message:7},{message:new String(TOKEN)},{message:null},{message:'bad\nvalue'},{message:'\ud800'},{message:'x'.repeat(32769)},Object.create({message:TOKEN})];
  for(const data of bodies) {
    const f=fixture({tokenReply:()=>({status:200,data})});await rejects(f.client.tile(tile({session:session()})),'BHUMI_TOKEN_UNAVAILABLE');
    assert.equal(f.calls.length,0);assert.equal(f.keyCalls,0);assert.equal(f.mainCalls.length,1);
  }
  for(const status of [201,204,299,401,403,503]) {
    const f=fixture({tokenReply:()=>({status,data:{message:TOKEN}})});await rejects(f.client.tile(tile({session:session()})),'BHUMI_TOKEN_UNAVAILABLE');assert.equal(f.calls.length,0);
  }
});

test('token parser rejects accessors and echoed main credentials without evaluating getters',async()=>{
  let invoked=0;
  const body={};Object.defineProperty(body,'message',{get(){invoked++;throw Error(AUTHKEY);}});
  const accessor=fixture({tokenReply:()=>({status:200,data:body})});await rejects(accessor.client.tile(tile({session:session()})),'BHUMI_TOKEN_UNAVAILABLE');assert.equal(invoked,0);
  const s=session();
  for(const message of [s.tokens.accessToken,`Bearer ${s.tokens.accessToken}`,s.tokens.refreshToken]) {
    const f=fixture({tokenReply:()=>({status:200,data:{message}})});await rejects(f.client.tile(tile({session:s})),'BHUMI_TOKEN_UNAVAILABLE');assert.equal(f.calls.length,0);
  }
});

test('private authkey is lazy bounded String and all configuration exceptions are sanitized',async()=>{
  for(const bad of [null,undefined,'',3,{},Promise.resolve(AUTHKEY),'bad\r\nvalue','\ud800','x'.repeat(32769)]) {
    const f=fixture({authkey:()=>bad});await rejects(f.client.tile(tile({session:session()})),'BHUMI_CONFIGURATION_REQUIRED',503);assert.equal(f.keyCalls,1);assert.equal(f.calls.length,0);
  }
  const f=fixture({authkey:()=>{throw Object.assign(Error(AUTHKEY),{code:TOKEN});}});
  await rejects(f.client.tile(tile({session:session()})),'BHUMI_CONFIGURATION_REQUIRED',503);assert.ok(!JSON.stringify(f.logs).includes(AUTHKEY));assert.ok(!JSON.stringify(f.logs).includes(TOKEN));
});

test('token cache is per session and expires at the native 240-second boundary',async()=>{
  let now=1000;const f=fixture({now:()=>now}),a=session(),b=session();
  await f.client.tile(tile({session:a}));now+=239999;await f.client.tile({x:0,y:0,z:0,session:a});assert.equal(f.mainCalls.length,1);
  now++;await f.client.tile(tile({session:a}));assert.equal(f.mainCalls.length,2);
  await f.client.tile(tile({session:b}));assert.equal(f.mainCalls.length,3);assert.equal(f.freshCalls.length,3);
});

test('concurrent tiles deduplicate only their session token future',async()=>{
  const pending=deferred(),f=fixture({tokenReply:()=>pending.promise}),s=session();
  const reads=Array.from({length:12},()=>f.client.tile(tile({session:s})));await tick();
  assert.equal(f.mainCalls.length,1);assert.equal(f.freshCalls.length,1);assert.equal(f.keyCalls,0);
  pending.resolve({status:200,data:{message:TOKEN}});const results=await Promise.all(reads);
  assert.equal(results.length,12);assert.equal(f.calls.length,12);assert.ok(results.every(r=>r.bytes.equals(PNG)));
});

test('failed shared token load is released so a later tile can recover',async()=>{
  const f=fixture({tokenReply:(_o,n)=>({status:200,data:n===1?{error:true,message:TOKEN}:{message:TOKEN+'recovered'}})}),s=session();
  await rejects(f.client.tile(tile({session:s})),'BHUMI_TOKEN_UNAVAILABLE');
  assert.equal((await f.client.tile(tile({session:s}))).status,200);assert.equal(f.mainCalls.length,2);assert.equal(f.calls.length,1);assert.equal(f.calls[0].url.searchParams.get('token'),TOKEN+'recovered');
});

test('401 and 403 retry once with a new WMS token while keeping main session intact',async()=>{
  for(const status of [401,403]) {
    const s=session(),tokens=s.tokens,user=s.user;
    const f=fixture({tokenReply:(_o,n)=>({status:200,data:{message:TOKEN+n}}),respond:(_c,n)=>image(PNG,n===1?status:200)});
    assert.equal((await f.client.tile(tile({session:s}))).status,200);
    assert.equal(f.calls.length,2);assert.equal(f.mainCalls.length,2);assert.equal(f.calls[0].url.searchParams.get('token'),TOKEN+'1');assert.equal(f.calls[1].url.searchParams.get('token'),TOKEN+'2');assert.equal(s.tokens,tokens);assert.equal(s.user,user);assert.equal(s.authenticationSignal.aborted,false);
    assert.deepEqual(f.logs.map(r=>r.outcome),['retry','success']);
  }
});

test('a second 401/403 stops with local 502 and never clears main login',async()=>{
  for(const status of [401,403]) {
    const s=session(),before=s.tokens,f=fixture({respond:()=>image(PNG,status)});
    await rejects(f.client.tile(tile({session:s})),'BHUMI_HTTP_STATUS',502);assert.equal(f.calls.length,2);assert.equal(f.mainCalls.length,2);assert.equal(s.tokens,before);assert.equal(s.authenticationSignal.aborted,false);
  }
});

test('late failure of old T1 cannot evict T2 or start a third token request',async()=>{
  const a=deferred(),b=deferred(),f=fixture({tokenReply:(_o,n)=>({status:200,data:{message:TOKEN+n}}),respond:(_call,n)=>n===1?a.promise:n===2?b.promise:image()}),s=session();
  const first=f.client.tile(tile({session:s})),second=f.client.tile(tile({session:s}));await tick();assert.equal(f.calls.length,2);
  a.resolve(image(PNG,401));await first;assert.equal(f.mainCalls.length,2);
  b.resolve(image(PNG,403));await second;assert.equal(f.mainCalls.length,2);assert.equal(f.calls.length,4);
  assert.deepEqual(f.calls.map(c=>c.url.searchParams.get('token')),[TOKEN+'1',TOKEN+'1',TOKEN+'2',TOKEN+'2']);
});

test('simultaneous old-token failures share one replacement request',async()=>{
  const replacement=deferred(),f=fixture({tokenReply:(_o,n)=>n===1?{status:200,data:{message:TOKEN+'1'}}:replacement.promise,respond:(_call,n)=>image(PNG,n<=2?401:200)}),s=session();
  const first=f.client.tile(tile({session:s})),second=f.client.tile(tile({session:s}));await tick();assert.equal(f.mainCalls.length,2);assert.equal(f.calls.length,2);
  replacement.resolve({status:200,data:{message:TOKEN+'2'}});await Promise.all([first,second]);assert.equal(f.mainCalls.length,2);assert.equal(f.calls.length,4);
});

test('individual tile cancellation never aborts another waiter shared token future',async()=>{
  const pending=deferred(),abort=new AbortController(),f=fixture({tokenReply:()=>pending.promise}),s=session();
  const first=f.client.tile(tile({session:s,signal:abort.signal})),second=f.client.tile(tile({session:s}));const rejection=rejects(first,'BHUMI_ABORTED',499);await tick();
  abort.abort(new Error(AUTHKEY));await rejection;assert.equal(f.mainCalls[0].signal.aborted,false);
  pending.resolve({status:200,data:{message:TOKEN}});assert.equal((await second).status,200);assert.equal(f.calls.length,1);
  await f.client.tile(tile({session:s}));assert.equal(f.mainCalls.length,1);
});

test('explicit session invalidation rejects late token publish but a new owner can proceed',async()=>{
  const old=deferred(),f=fixture({tokenReply:(_o,n)=>n===1?old.promise:{status:200,data:{message:TOKEN+'new'}}}),s=session();
  const first=f.client.tile(tile({session:s}));const rejected=rejects(first,'BHUMI_SESSION_CHANGED',409);await tick();f.client.invalidateSession(s);await rejected;
  await f.client.tile(tile({session:s}));old.resolve({status:200,data:{message:TOKEN+'old'}});await tick();await f.client.tile(tile({session:s}));
  assert.equal(f.mainCalls.length,2);assert.ok(f.calls.every(c=>c.url.searchParams.get('token')===TOKEN+'new'));
  f.client.invalidateSession(null);f.client.invalidateSession({});
});

test('logout aborts pending token owner and cannot repopulate cache after a new login generation',async()=>{
  const old=deferred(),f=fixture({tokenReply:(_o,n)=>n===1?old.promise:{status:200,data:{message:TOKEN+'new'}}}),s=session();
  const first=f.client.tile(tile({session:s}));const rejected=rejects(first,'BHUMI_AUTH_REQUIRED',401);await tick();clearAuthentication(s);await rejected;
  assert.equal(f.mainCalls[0].signal.aborted,true);assert.equal(f.keyCalls,0);assert.equal(f.calls.length,0);
  s.authenticationController=new AbortController();s.authenticationSignal=s.authenticationController.signal;s.tokens={accessToken:'new-main-fixture'};
  await f.client.tile(tile({session:s}));old.reject(Object.assign(Error(AUTHKEY),{status:401,code:TOKEN}));await tick();
  await f.client.tile(tile({session:s}));assert.equal(f.mainCalls.length,2);assert.ok(f.calls.every(c=>c.url.searchParams.get('token')===TOKEN+'new'));assert.equal(s.tokens.accessToken,'new-main-fixture');
});

test('changing authenticationSignal without abort still replaces cache ownership',async()=>{
  const f=fixture({tokenReply:(_o,n)=>({status:200,data:{message:TOKEN+n}})}),s=session();
  await f.client.tile(tile({session:s}));s.authenticationController=new AbortController();s.authenticationSignal=s.authenticationController.signal;
  await f.client.tile(tile({session:s}));assert.equal(f.mainCalls.length,2);assert.equal(f.calls[1].url.searchParams.get('token'),TOKEN+'2');
});

test('close rejects in-flight read and future calls without retaining a global session list',async()=>{
  const pending=deferred(),f=fixture({respond:()=>pending.promise}),s=session();
  const read=f.client.tile(tile({session:s}));const rejected=rejects(read,'BHUMI_CLIENT_CLOSED',503);await tick();f.client.close();await rejected;
  pending.resolve(image());await tick();await rejects(f.client.tile(tile({session:s})),'BHUMI_CLIENT_CLOSED',503);assert.equal(f.calls.length,1);
});

test('abort while ensureFresh pending prevents the token GET and tile request',async()=>{
  const fresh=deferred(),f=fixture({ensureFresh:()=>fresh.promise}),s=session();
  const read=f.client.tile(tile({session:s}));const rejected=rejects(read,'BHUMI_AUTH_REQUIRED',401);await tick();clearAuthentication(s);await rejected;fresh.resolve();await tick();
  assert.equal(f.mainCalls.length,0);assert.equal(f.calls.length,0);assert.equal(f.keyCalls,0);
});

test('all redirects and followed/wrong-audience responses are rejected without a second destination',async()=>{
  for(const status of [300,301,302,303,304,307,308,399]) {
    const f=fixture({respond:()=>new Response(null,{status,headers:{Location:'https://elsewhere.invalid/?token='+TOKEN}})});
    await rejects(f.client.tile(tile({session:session()})),'BHUMI_REDIRECT_REJECTED');assert.equal(f.calls.length,1);assert.equal(f.mainCalls.length,1);
  }
  for(const patch of [{redirected:true},{url:'https://elsewhere.invalid/'},{url:'https://bhumi.atrbpn.go.id/other'}]) {
    const f=fixture({respond:()=>{const response=image();for(const [key,value] of Object.entries(patch))Object.defineProperty(response,key,{value});return response;}});
    await rejects(f.client.tile(tile({session:session()})),'BHUMI_REDIRECT_REJECTED');assert.equal(f.calls.length,1);
  }
});

test('only HTTP200 is an image success; no network or other HTTP retry is invented',async()=>{
  for(const status of [201,202,206,299,400,404,408,429,500,502,503]) {
    const f=fixture({respond:()=>image(PNG,status)});await rejects(f.client.tile(tile({session:session()})),'BHUMI_HTTP_STATUS');assert.equal(f.calls.length,1);assert.equal(f.mainCalls.length,1);
  }
  const f=fixture({respond:()=>{throw Object.assign(Error(TOKEN),{code:'ECONNRESET'});}});await rejects(f.client.tile(tile({session:session()})),'BHUMI_NETWORK_ERROR');assert.equal(f.calls.length,1);
});

test('PNG MIME and signature guards return a fixed safe MIME instead of upstream header text',async()=>{
  for(const type of ['image/png','IMAGE/PNG; charset="utf-8"','image/png; fixture='+TOKEN]) {
    const f=fixture({respond:()=>image(PNG,200,type)});assert.equal((await f.client.tile(tile({session:session()}))).contentType,'image/png');
  }
  for(const type of [null,'text/html','image/jpeg','application/octet-stream','image/svg+xml','image/png invalid']) {
    const f=fixture({respond:()=>image(PNG,200,type)});await rejects(f.client.tile(tile({session:session()})),'BHUMI_IMAGE_INVALID');assert.equal(f.calls.length,1);
  }
  for(const bytes of [Buffer.alloc(0),Buffer.from('<html>'+TOKEN),SIGNATURE.subarray(0,7),Buffer.from('PNG')]) {
    const f=fixture({respond:()=>image(bytes)});await rejects(f.client.tile(tile({session:session()})),'BHUMI_IMAGE_INVALID');
  }
});

test('plaintext credential echoes never become image bytes even after a PNG signature',async()=>{
  for(const secret of [TOKEN,AUTHKEY]) {
    const f=fixture({respond:()=>image(Buffer.concat([SIGNATURE,Buffer.from(secret)]))});await rejects(f.client.tile(tile({session:session()})),'BHUMI_IMAGE_INVALID');assert.ok(!JSON.stringify(f.logs).includes(secret));
  }
});

test('image byte bound applies to declared and streamed length, allowing exactly five MiB',async()=>{
  for(const length of ['5242881','9007199254740993','-1','not-a-number']) {
    const f=fixture({respond:()=>new Response(PNG,{headers:{'Content-Type':'image/png','Content-Length':length}})});await rejects(f.client.tile(tile({session:session()})),'BHUMI_IMAGE_TOO_LARGE');
  }
  const over=fixture({respond:()=>new Response(new ReadableStream({start(c){c.enqueue(SIGNATURE);c.enqueue(new Uint8Array(5*1024*1024));c.close();}}),{headers:{'Content-Type':'image/png','Content-Length':'8'}})});
  await rejects(over.client.tile(tile({session:session()})),'BHUMI_IMAGE_TOO_LARGE');
  const exact=Buffer.alloc(5*1024*1024);SIGNATURE.copy(exact);
  const allowed=fixture({respond:()=>image(exact)});assert.equal((await allowed.client.tile(tile({session:session()}))).bytes.length,exact.length);
});

test('body cancellation aborts pending reader and suppresses all image output',async()=>{
  const abort=new AbortController();let bodyCancelled=0;
  const f=fixture({respond:()=>new Response(new ReadableStream({start(c){c.enqueue(SIGNATURE);},cancel(){bodyCancelled++;}}),{headers:{'Content-Type':'image/png'}})});
  const read=f.client.tile(tile({session:session(),signal:abort.signal}));const rejected=rejects(read,'BHUMI_ABORTED',499);await tick();abort.abort(Error(TOKEN));await rejected;assert.equal(bodyCancelled,1);assert.equal(f.logs.at(-1).outcome,'failure');
});

test('logout during tile body read cancels it and returns only local main-auth error',async()=>{
  const s=session();let bodyCancelled=0;
  const f=fixture({respond:()=>new Response(new ReadableStream({start(c){c.enqueue(SIGNATURE);},cancel(){bodyCancelled++;}}),{headers:{'Content-Type':'image/png'}})});
  const read=f.client.tile(tile({session:s}));const rejected=rejects(read,'BHUMI_AUTH_REQUIRED',401);await tick();clearAuthentication(s);await rejected;assert.equal(bodyCancelled,1);
});

test('late transport response after individual abort is cancelled instead of leaking resources',async()=>{
  const pending=deferred(),abort=new AbortController();let cancelledBody=0;
  const f=fixture({respond:()=>pending.promise});const read=f.client.tile(tile({session:session(),signal:abort.signal}));const rejected=rejects(read,'BHUMI_ABORTED',499);await tick();abort.abort();await rejected;
  pending.resolve(new Response(new ReadableStream({cancel(){cancelledBody++;}}),{headers:{'Content-Type':'image/png'}}));await tick();assert.equal(cancelledBody,1);
});

test('bounded timeout terminates a noncooperative transport wait and discards late response',async()=>{
  const pending=deferred();let cancelledBody=0;
  const f=fixture({respond:()=>pending.promise,timeoutMs:15});
  const hold=setTimeout(()=>{},100);
  try {await rejects(f.client.tile(tile({session:session()})),'BHUMI_TIMEOUT',504);} finally {clearTimeout(hold);}
  assert.equal(f.calls[0].init.signal.aborted,true);
  pending.resolve(new Response(new ReadableStream({cancel(){cancelledBody++;}}),{headers:{'Content-Type':'image/png'}}));await tick();assert.equal(cancelledBody,1);
});

test('shared token timeout cannot publish late and a later attempt gets a fresh owner',async()=>{
  const pending=deferred(),f=fixture({tokenReply:(_o,n)=>n===1?pending.promise:{status:200,data:{message:TOKEN+'new'}},timeoutMs:15}),s=session();
  const hold=setTimeout(()=>{},100);
  try {await rejects(f.client.tile(tile({session:s})),'BHUMI_TIMEOUT',504);await new Promise(resolve=>setTimeout(resolve,20));} finally {clearTimeout(hold);}
  assert.equal(f.mainCalls[0].signal.aborted,true);pending.resolve({status:200,data:{message:TOKEN+'old'}});await tick();
  await f.client.tile(tile({session:s}));assert.equal(f.mainCalls.length,2);assert.equal(f.calls[0].url.searchParams.get('token'),TOKEN+'new');
});

test('network/body/main errors and malicious codes never expose values in errors or fixed logs',async()=>{
  const secret=`${TOKEN}:${AUTHKEY}:synthetic-main-access`;
  for(const factory of [()=>fixture({respond:()=>{throw Object.assign(Error(secret),{code:secret,cause:{url:secret}});}}),()=>fixture({respond:()=>new Response(new ReadableStream({start(c){c.error(Error(secret));}}),{headers:{'Content-Type':'image/png'}})}),()=>fixture({tokenReply:()=>{throw Object.assign(Error(secret),{code:secret,status:503,details:{token:secret}});}})]) {
    const f=factory();let caught;
    try {await f.client.tile(tile({session:session()}));assert.fail('expected rejection');} catch(error){caught=error;}
    assert.ok(caught instanceof BhumiMapError);assert.equal(caught.status,502);
    for(const value of [TOKEN,AUTHKEY,'synthetic-main-access']) {assert.ok(!String(caught.stack).includes(value));assert.ok(!JSON.stringify(caught).includes(value));assert.ok(!JSON.stringify(f.logs).includes(value));}
    assert.equal(caught.cause,undefined);assert.equal(caught.details,undefined);
    assert.ok(f.logs.every(entry=>Object.keys(entry).every(key=>['event','service','method','path','attempt','status','outcome','code'].includes(key))));
  }
});

test('main-client auth/ownership statuses use fixed local messages and do not mutate session',async()=>{
  for(const [status,code] of [[401,'BHUMI_AUTH_REQUIRED'],[409,'BHUMI_SESSION_CHANGED']]) {
    const s=session(),tokens=s.tokens,f=fixture({tokenReply:()=>{throw Object.assign(Error(TOKEN),{status,code:AUTHKEY});}});
    await rejects(f.client.tile(tile({session:s})),code,status);assert.equal(s.tokens,tokens);assert.equal(s.authenticationSignal.aborted,false);assert.equal(f.calls.length,0);
  }
});

test('throwing log sink cannot change result or introduce upstream diagnostics',async()=>{
  const f=fixture({log:()=>{throw Error(TOKEN);}});assert.equal((await f.client.tile(tile({session:session()}))).status,200);
  assert.deepEqual(f.logs,[{event:'bhumi_tile_request',service:'bhumi-wms',method:'GET',path:'/expapi/live-bhumi-wms',attempt:1,status:200,outcome:'success'}]);
});

test('default production sink records fixed Bhumi outcomes without tile coordinates or secrets',async()=>{
  const lines=[],original=process.stdout.write;
  process.stdout.write=(line)=>{lines.push(String(line));return true;};
  let client;
  try {
    let calls=0;
    client=new BhumiMapClient({bhumiAuthKey:()=>AUTHKEY},{
      mainClient:{ensureFresh(){},request(){return{status:200,data:{message:TOKEN}};}},
      transport:async()=>++calls===1?image():image('private upstream text',502,'text/plain'),
    });
    const active=session();
    assert.equal((await client.tile(tile({session:active}))).status,200);
    await rejects(client.tile(tile({session:active})),'BHUMI_HTTP_STATUS');
  } finally {client?.close();process.stdout.write=original;}
  assert.deepEqual(lines.map(line=>JSON.parse(line)),[
    {event:'bhumi_tile_request',service:'bhumi-wms',method:'GET',path:'/expapi/live-bhumi-wms',attempt:1,status:200,outcome:'success'},
    {event:'bhumi_tile_request',service:'bhumi-wms',method:'GET',path:'/expapi/live-bhumi-wms',attempt:1,status:502,outcome:'failure',code:'BHUMI_HTTP_STATUS'},
  ]);
  assert.doesNotMatch(lines.join(''),new RegExp(`${TOKEN}|${AUTHKEY}|synthetic-main-access|private upstream text|bbox|authkey|token|longitude|latitude`));
});

test('default transport uses fetch with standard verified TLS and no custom identity options',async()=>{
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,init)=>{calls.push({url,init});return image();};
  try {
    const s=session();const client=new BhumiMapClient({bhumiAuthKey:()=>AUTHKEY},{mainClient:{ensureFresh(){},request(){return{status:200,data:{message:TOKEN}};}}});
    assert.equal((await client.tile(tile({session:s}))).status,200);assert.equal(calls.length,1);assert.deepEqual(calls[0].init.headers,{Referer:'https://bhumi.atrbpn.go.id/'});assert.equal(calls[0].init.dispatcher,undefined);assert.equal(calls[0].init.rejectUnauthorized,undefined);
  } finally {globalThis.fetch=original;}
});

test('timeout configuration cannot remove or exceed the web maximum',()=>{
  for(const value of [0,-1,1.5,30_001,Infinity,'30000']) assert.throws(()=>new BhumiMapClient({}, {timeoutMs:value}),error=>error instanceof BhumiMapError && error.code==='BHUMI_TIMEOUT_INVALID');
});
