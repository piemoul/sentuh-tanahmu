import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';

const readId='get-bukutamu-d28bf4',writeId='post-bukutamu-d99dd8';
const query={uid:'fixture-kd %2F+&=',unid:'fixture-id %2B=+'};
const office={userId:'fixture-qr-user',kantorId:'fixture-office',unitKerjaId:'fixture-unit',namaUnitKerja:'Unit Uji'};
const envelope=(data=office,error=false)=>({data,error,message:null});
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
async function fixture(t,{read=()=>response(envelope()),expired=false}={}){
 const calls=[],config={configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=> 'AtrBpn fixture-app-value'};
 const server=createServer({configuration:config,log:()=>{},transport:async(url,init)=>{
  calls.push({url:new URL(url),...init});
  if(url.pathname==='/auth/signin')return response({error:false,data:{username:'fixture-user',email:'fixture@example.invalid',nomorIndukKependudukan:'fixture-identity',roleUser:'PERORANGAN',token:{tokenType:'Bearer',accessToken:'fixture-account-value',refreshToken:'fixture-refresh-value',expiredAt:expired?1:4_000_000_000}}});
  if(url.pathname==='/bukutamu')return read(url,init);
  throw new Error('Unexpected fixture route');
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 async function request(path,body){
  const post=body!==undefined,r=await fetch(base+path,{method:post?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(post?{Origin:base,'X-CSRF-Token':csrf,'Content-Type':'application/json'}:{})},...(post?{body:JSON.stringify(body)}:{})});
  if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
  const data=await r.json();if(data.csrfToken)csrf=data.csrfToken;return {status:r.status,data};
 }
 await request('/api/state');
 const login=()=>request('/api/login',{username:'fixture-user',password:'fixture-password'});
 const execute=(values=query,extra={})=>request('/api/execute',{operationId:readId,values,...extra});
 return {calls,request,login,execute};
}

test('guestbook read requires local sign-in and preserves exactly two raw QR query values',()=>{
 const op=OPERATIONS.find(row=>row.id===readId);assert.equal(op.enabled,true);assert.equal(op.clientProfile,'guestbook-read');assert.equal(op.upstreamAuthentication,'application');assert.equal(op.effect,'read');
 assert.throws(()=>prepareOperation(readId,query,{authenticated:false}),error=>error.code==='LOGIN_REQUIRED');
 const prepared=prepareOperation(readId,query,{authenticated:true});assert.deepEqual(prepared.query,query);assert.equal(prepared.method,'GET');assert.equal(prepared.encoding,'none');assert.deepEqual(prepared.body,{});
 for(const values of [{uid:query.uid},{uid:null,unid:''},{uid:1,unid:''},{...query,nik:'arbitrary'},Object.assign(Object.create({uid:'inherited'}),{unid:''})])assert.throws(()=>prepareOperation(readId,values,{authenticated:true}));
 const accessor={unid:''};Object.defineProperty(accessor,'uid',{enumerable:true,get(){throw new Error('getter evaluated');}});assert.throws(()=>prepareOperation(readId,accessor,{authenticated:true}),error=>error.code==='GUESTBOOK_READ_SCOPE');
 assert.deepEqual(prepareOperation(readId,{uid:'',unid:''},{authenticated:true}).query,{uid:'',unid:''});
});

test('anonymous execute is rejected before application-authorized upstream read',async t=>{
 const f=await fixture(t),r=await f.execute();assert.equal(r.status,401);assert.equal(r.data.error.code,'LOGIN_REQUIRED');assert.equal(f.calls.length,0);
});

test('expired account token does not refresh or leak into standalone guestbook GET',async t=>{
 const f=await fixture(t,{expired:true});assert.equal((await f.login()).status,200);const r=await f.execute();assert.equal(r.status,200);assert.deepEqual(r.data.result.data,envelope());
 assert.deepEqual(f.calls.map(row=>row.url.pathname),['/auth/signin','/bukutamu']);const sent=f.calls[1];
 assert.equal(sent.method,'GET');assert.equal(new Headers(sent.headers).get('Authorization'),'AtrBpn fixture-app-value');assert.equal(new Headers(sent.headers).get('Content-Type'),null);assert.equal(sent.body,undefined);
 assert.deepEqual([...sent.url.searchParams],[['uid',query.uid],['unid',query.unid]]);assert.doesNotMatch(JSON.stringify(r.data),/fixture-app-value|fixture-account-value|fixture-refresh-value/);
});

test('guestbook typed envelope error true remains readable metadata, not arrival success',async t=>{
 const f=await fixture(t,{read:()=>response(envelope(office,true))});await f.login();const r=await f.execute();assert.equal(r.status,200);assert.deepEqual(r.data.result.data,envelope(office,true));assert.equal(r.data.result.status,200);
 assert.doesNotMatch(JSON.stringify(r.data),/Buku Tamu Sudah Terisi|arrivalRegistered|visitorCard|verifiedAttendance/);
});

test('typed public fields cannot echo application or local account credentials to the browser',async t=>{
 const raw={...office,namaUnitKerja:'fixture-app-value / fixture-account-value / fixture-refresh-value'};
 const f=await fixture(t,{read:()=>response({error:false,message:'AtrBpn fixture-app-value',data:raw})});await f.login();const r=await f.execute();
 assert.equal(r.status,200);assert.equal(r.data.result.data.data.userId,office.userId);assert.doesNotMatch(JSON.stringify(r.data),/fixture-app-value|fixture-account-value|fixture-refresh-value/);assert.match(r.data.result.data.data.namaUnitKerja,/REDACTED/);
});

test('null metadata remains null, while malformed metadata fails without clearing account',async t=>{
 let malformed=false;const f=await fixture(t,{read:()=>response(malformed?envelope({userId:123}):envelope(null))});await f.login();const first=await f.execute();assert.equal(first.status,200);assert.equal(first.data.result.data.data,null);
 malformed=true;const second=await f.execute();assert.equal(second.status,502);assert.match(second.data.error.code,/GUESTBOOK/);assert.equal((await f.request('/api/state')).data.authenticated,true);
});

test('unknown query fields and forged visitor arrival fields are blocked before upstream',async t=>{
 const f=await fixture(t);await f.login();const count=f.calls.length;
 const unknown=await f.execute({...query,Authorization:'injected'});assert.equal(unknown.status,400);
 const write=await f.request('/api/execute',{operationId:writeId,values:{kantorId:'forged-office'},confirm:true});assert.equal(write.status,400);assert.equal(write.data.error.code,'GUESTBOOK_POST_INPUT_INVALID');assert.equal(write.data.error.details.delivery,'not_sent');assert.equal(f.calls.length,count);
});

test('logout while QR metadata is in flight suppresses the late private response',async t=>{
 let release,entered;const ready=new Promise(resolve=>{entered=resolve;}),held=new Promise(resolve=>{release=resolve;});
 const f=await fixture(t,{read:async()=>{entered();await held;return response(envelope());}});await f.login();const pending=f.execute();await ready;
 const logout=await f.request('/api/logout',{});assert.equal(logout.status,200);release();const late=await pending;
 assert.equal(late.status,401);assert.equal(late.data.error.code,'SESSION_EXPIRED');assert.doesNotMatch(JSON.stringify(late.data),/fixture-qr-user|fixture-office|fixture-unit/);assert.equal((await f.request('/api/state')).data.authenticated,false);
});
