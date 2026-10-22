import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {decodeDaringIdentityEnvelope,daringIdentityStatusFallback,DARING_IDENTITY_FAILURE_MESSAGE} from '../private/daring-identity-response.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Synthetic identity fields, credentials and transport only. These tests never
// contact the official service, send OTP, open a camera or verify an account.
const operationId='post-perurilivenesssdk-validatektpdatav2-da9a78';
const path='PeruriLivenessSdk/ValidateKTPDataV2';
const fields=['Nik','Nama','Tempatlahir','TglLahir','NoHp'];
const values={Nik:' 0000000000000000 ',Nama:' Fixture Nama ',Tempatlahir:' Tempat Uji ',TglLahir:'01/08/2000',NoHp:' 080000000000 '};
const fallback='Maaf permintaan kamu belum dapat kami proses, cobalah beberapa saat lagi';
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=> 'AtrBpn fixture-daring-application'};
const token={tokenType:'Bearer',accessToken:'fixture-daring-access',refreshToken:'fixture-daring-refresh',expiredAt:4_000_000_000};
const user={username:'fixture-daring-user',userLevel:1,nomorIndukKependudukan:'1111111111111111'};
const session=()=>({active:true,user:{...user},tokens:{...token},downloads:new Map([['existing',{}]])});
const request=(overrides={})=>({path,method:'POST',encoding:'multipart',auth:'session',session:session(),body:{...values},...overrides});
const client=response=>new ApiClient(config,{log:()=>{},transport:async()=>typeof response==='function'?response():response});
const json=(value,status=200)=>Response.json(value,{status});
const shapeError='DARING_IDENTITY_RESPONSE_UNRECOGNIZED';

async function fixture(t,responder) {
  const calls=[],logs=[],sessions=new SessionStore();
  const server=createServer({configuration:config,sessions,log:entry=>logs.push(entry),transport:async(url,init)=>{
    calls.push({url:new URL(url),...init});
    if(url.pathname==='/auth/signin')return json({data:{...user,token:{...token}}});
    return responder(url,init);
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  let cookie='',state;
  async function send(route,data,headers={}) {
    const multipart=data instanceof FormData;
    const response=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'',...(multipart?{}:{'Content-Type':'application/json'})}),...headers},...(data===undefined?{}:{body:multipart?data:JSON.stringify(data)})});
    if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    const result=await response.json();if(result.csrfToken)state=result;
    return {status:response.status,result};
  }
  await send('/api/state');
  return {calls,logs,sessions,send,login:()=>send('/api/login',{username:user.username,password:'fixture-daring-password'}),execute:(input=values,confirm=true,headers)=>send('/api/execute',{operationId,values:input,confirm},headers)};
}

test('only the audited Daring five-field operation is enabled with explicit write confirmation',()=>{
  const op=OPERATIONS.find(item=>item.id===operationId);
  for(const[key,value]of Object.entries({enabled:true,method:'POST',encoding:'multipart',path,serviceId:'main',auth:'session',effect:'write',mutates:true,requiresConfirmation:true}))assert.equal(op[key],value);
  assert.deepEqual(op.fields.map(field=>field.path),fields);
  for(const field of op.fields){assert.equal(field.type,'string');assert.equal(field.strictString,true);assert.equal(field.source,'input');assert.equal(field.allowEmpty,true);}
  assert.deepEqual(OPERATIONS.filter(item=>item.enabled&&item.path.startsWith('Peruri')).map(item=>item.id),[operationId]);
  for(const endpoint of ['common/send_otp_wa','PeruriLivenessSdk/FaceValidation','geotag/UploadGeotag']){
    const candidate=OPERATIONS.find(item=>item.path===endpoint);
    if(candidate)assert.equal(candidate.enabled,false,endpoint);
  }
  assert.throws(()=>prepareOperation(operationId,values,{}),{code:'LOGIN_REQUIRED'});
});

test('form Strings preserve exact whitespace/order and do not substitute cached sign-in NIK',()=>{
  const prepared=prepareOperation(operationId,values,{authenticated:true,user});
  assert.deepEqual({...prepared.body},values);assert.deepEqual(Object.keys(prepared.body),fields);
  assert.notEqual(prepared.body.Nik,user.nomorIndukKependudukan);
  assert.deepEqual({...prepared.query},{});assert.deepEqual(prepared.files,[]);
  assert.equal(prepared.requiresConfirmation,true);assert.equal(prepared.service.baseUrl,'https://sentuh.atrbpn.go.id/');
});

test('missing/null model fields fall back to five present empty Strings without coercion',()=>{
  const blank=Object.fromEntries(fields.map(field=>[field,'']));
  for(const input of [{},Object.fromEntries(fields.map(field=>[field,null])),Object.fromEntries(fields.map(field=>[field,undefined])),blank])assert.deepEqual({...prepareOperation(operationId,input,{authenticated:true}).body},blank);
  for(const field of fields)for(const value of [0,1,false,true,{},[],new String('boxed')])assert.throws(()=>prepareOperation(operationId,{...values,[field]:value},{authenticated:true}),{code:'INVALID_FIELD'});
  for(const field of fields)for(const value of ['contains\0nul','x'.repeat(16001)])assert.throws(()=>prepareOperation(operationId,{...values,[field]:value},{authenticated:true}),{code:'INVALID_FIELD'});
});

test('operation rejects unknown, inherited and accessor input rather than widening identity scope',()=>{
  for(const key of ['nik','Email','email','OTP','deviceId','url','headers'])assert.throws(()=>prepareOperation(operationId,{...values,[key]:'unexpected'},{authenticated:true}),{code:'UNKNOWN_FIELD'});
  assert.throws(()=>prepareOperation(operationId,Object.create({Nik:'hidden'}),{authenticated:true}),{code:'INVALID_PARAMETERS'});
  const accessor={...values};let invoked=false;Object.defineProperty(accessor,'Nik',{get(){invoked=true;return values.Nik;},enumerable:true});
  assert.throws(()=>prepareOperation(operationId,accessor,{authenticated:true}),{code:'INVALID_FIELD'});assert.equal(invoked,false);
  assert.throws(()=>prepareOperation(operationId,{...values,[Symbol('unexpected')]:'hidden'},{authenticated:true}),{code:'INVALID_PARAMETERS'});
});

test('native effective tuple preserves bool/message semantics and fallback literals',()=>{
  assert.equal(DARING_IDENTITY_FAILURE_MESSAGE,fallback);
  for(const error of [true,false,null])for(const message of ['',' accepted ','unknown',null]){
    const input={error,message,data:null,ignored:'discard'};
    assert.deepEqual(decodeDaringIdentityEnvelope(input),{error:error??true,message:message??fallback});
    assert.deepEqual(input,{error,message,data:null,ignored:'discard'});
  }
  assert.deepEqual(decodeDaringIdentityEnvelope({}),{error:true,message:fallback});
  assert.deepEqual(decodeDaringIdentityEnvelope(Object.create(null)),{error:true,message:fallback});
  assert.deepEqual(decodeDaringIdentityEnvelope({error:false,message:''}),{error:false,message:''});
  assert.deepEqual(daringIdentityStatusFallback(201),{error:true,message:'Terjadi kesalahan saat memproses data (status 201)'});
});

test('generic byb callback rejects every nonnull JSON data value rather than silently dropping it',()=>{
  for(const error of [false,true,null])for(const data of [{},[],true,false,0,1,'','{}',undefined])assert.throws(()=>decodeDaringIdentityEnvelope({error,message:'ok',data}),{code:shapeError});
});

test('typed direct model rejects malformed roots/fields and does not JSON-decode a second String',()=>{
  for(const root of [null,undefined,true,false,0,[],'{}',JSON.stringify({error:false,message:'ok'})])assert.throws(()=>decodeDaringIdentityEnvelope(root),{code:shapeError});
  for(const error of [0,1,'true',{},[],undefined])assert.throws(()=>decodeDaringIdentityEnvelope({error}),{code:shapeError});
  for(const message of [0,1,true,false,{},[],undefined])assert.throws(()=>decodeDaringIdentityEnvelope({message}),{code:shapeError});
  assert.throws(()=>decodeDaringIdentityEnvelope(Object.create({error:false})),{code:shapeError});
  const body={};let invoked=false;Object.defineProperty(body,'data',{get(){invoked=true;return null;}});
  assert.throws(()=>decodeDaringIdentityEnvelope(body),{code:shapeError});assert.equal(invoked,false);
});

test('multipart wire sends exact ordered fields and stored session authorization',async()=>{
  const calls=[];
  const api=new ApiClient(config,{log:()=>{},transport:async(url,init)=>{calls.push({url,init});return json({error:false,message:''});}});
  const result=await api.request(request());
  const {url,init}=calls[0];assert.equal(url.href,'https://sentuh.atrbpn.go.id/'+path);
  assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,`Bearer ${token.accessToken}`);assert.equal(init.headers.Accept,'application/json');
  assert.equal(init.headers['Content-Type'],undefined,'Request determines the multipart boundary');
  assert.ok(init.body instanceof FormData);assert.deepEqual([...init.body],Object.entries(values));
  const normalized=new Request(url,{method:init.method,headers:init.headers,body:init.body});
  assert.match(normalized.headers.get('content-type'),/^multipart\/form-data; boundary=/);
  assert.deepEqual([...await normalized.formData()],Object.entries(values));
  assert.deepEqual(result.data,{error:false,message:''});assert.equal(result.status,200);
});

test('HTTP200 normalizes only the native tuple and never produces downloads or an OTP request',async()=>{
  for(const envelope of [{error:false,message:'accepted',data:null},{error:true,message:'denied'},{}]){
    const result=await client(json({...envelope,unknown:'discard'})).request(request());
    assert.deepEqual(result.data,decodeDaringIdentityEnvelope(envelope));assert.equal(result.bytes,undefined);assert.equal(result.previewable,undefined);
  }
  for(const envelope of [{error:false,data:{}},{error:1},{message:{}},'{}',null,[]])await assert.rejects(client(json(envelope)).request(request()),{code:shapeError});
});

test('accepted non200 statuses discard malformed bodies and return the native failure-status tuple',async()=>{
  for(const status of [201,202,204,205,206,299]){
    let canceled=false;
    const body=[204,205].includes(status)?null:new ReadableStream({cancel(){canceled=true;}});
    const result=await client(new Response(body,{status,headers:{'Content-Type':'application/json','Content-Length':String(25*1024*1024)}})).request(request());
    assert.equal(result.status,status);assert.deepEqual(result.data,{error:true,message:`Terjadi kesalahan saat memproses data (status ${status})`});
    assert.equal(canceled,body!==null);assert.equal(result.bytes,undefined);
  }
});

test('direct scope cannot change path, client, auth, method, keys, encoding or String types',async()=>{
  let calls=0;const api=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;return json({error:false});}});
  const reordered=Object.fromEntries(Object.entries(values).reverse());
  const accessor={...values};Object.defineProperty(accessor,'Nik',{get(){throw new Error('getter must not run');},enumerable:true});
  for(const override of [
    {method:'GET'},{method:'PUT'},{encoding:'form'},{encoding:'json'},{auth:'none'},{auth:'application'},{auth:'optionalSession'},
    {clientProfile:'sps-document-viewer'},{body:null},{body:[]},{body:Object.create(values)},{body:{}},{body:{...values,email:''}},{body:reordered},{body:accessor},{body:{...values,[Symbol('extra')]:''}},
    {query:{q:'override'}},{query:null},{query:[]},{files:[{}]},{files:null},{files:{}},
    {path:'/'+path},{path:path+'?q=override'},{path:path+'#fragment'},
    ...fields.flatMap(field=>[null,undefined,0,true,{},[]].map(value=>({body:{...values,[field]:value}}))),
  ])await assert.rejects(api.request(request(override)),{code:'DARING_IDENTITY_SCOPE'});
  assert.equal(calls,0);
});

test('other endpoints/origins retain generic business rejection and token-audience checks',async()=>{
  for(const override of [{path:'PeruriLivenessSdk/Other'},{path:path.toLowerCase()},{path:path+'/'},{base:'https://antre.atrbpn.go.id/',auth:'none'}])await assert.rejects(client(json({error:true,message:'rejected'})).request(request(override)),{code:'UPSTREAM_REJECTED'});
  await assert.rejects(client(json({error:false})).request(request({base:'https://antre.atrbpn.go.id/'})),{code:'TOKEN_AUDIENCE_UNVERIFIED'});
});

test('non2xx failures preserve the browser transport policy instead of becoming an identity success tuple',async()=>{
  for(const status of [400,403,404,429,500,503]){
    const owner=session();
    await assert.rejects(client(json({error:false,message:`denied ${token.accessToken}`},status)).request(request({session:owner})),error=>{
      assert.equal(error.code,'UPSTREAM_REJECTED');assert.equal(error.status,status===403?403:502);assert.equal(error.details.upstreamStatus,status);assert.equal(error.details.message,'denied [REDACTED]');return true;
    });assert.ok(owner.tokens);
  }
});

test('identity HTTP401 clears owning session while stale HTTP401 preserves renewed tokens',async()=>{
  const owner=session();
  await assert.rejects(client(json({error:false},401)).request(request({session:owner})),{code:'SESSION_EXPIRED'});
  assert.equal(owner.tokens,null);assert.equal(owner.user,null);assert.equal(owner.downloads.size,0);
  const renewed=session(),newTokens={...token,accessToken:'fixture-new-access'};
  const api=new ApiClient(config,{log:()=>{},transport:async()=>{renewed.tokens=newTokens;return json({error:false},401);}});
  await assert.rejects(api.request(request({session:renewed})),{code:'SESSION_CHANGED'});assert.equal(renewed.tokens,newTokens);
});

test('redirect/parse/network failures remain explicit and never auto-retry identity validation',async()=>{
  for(const status of [300,302,307])await assert.rejects(client(new Response(null,{status,headers:{Location:'https://example.invalid/'}})).request(request()),{code:'UPSTREAM_REDIRECT'});
  await assert.rejects(client(new Response('{',{headers:{'Content-Type':'application/json'}})).request(request()),{code:'INVALID_UPSTREAM_JSON'});
  let calls=0;const api=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;throw Object.assign(new Error('do not expose'),{code:'ECONNRESET'});}});
  await assert.rejects(api.request(request()),{code:'UPSTREAM_UNREACHABLE'});assert.equal(calls,1);
});

test('HTTP200 still observes shared declared and streaming byte limits',async()=>{
  for(const declared of [true,false]){
    let canceled=false;const stream=new ReadableStream({start(controller){if(!declared)controller.enqueue(new Uint8Array(20*1024*1024+1));},cancel(){canceled=true;}});
    await assert.rejects(client(new Response(stream,{headers:declared?{'Content-Length':String(20*1024*1024+1)}:{}})).request(request()),{code:'RESPONSE_TOO_LARGE'});assert.equal(canceled,true);
  }
});

test('inactive/missing sessions cannot contact the identity service',async()=>{
  let calls=0;const api=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;return json({error:false});}});
  await assert.rejects(api.request(request({session:undefined})),{code:'AUTH_REQUIRED'});
  await assert.rejects(api.request(request({session:{active:false,tokens:{...token}}})),{code:'SESSION_EXPIRED'});assert.equal(calls,0);
});

test('HTTP execute requires login/Origin/CSRF/confirmation before identity transport',async t=>{
  const f=await fixture(t,()=>json({error:false,message:'accepted'}));
  assert.equal((await f.execute()).status,401);assert.equal(f.calls.length,0);
  await f.login();
  for(const confirm of [false,undefined,'true',1])assert.equal((await f.send('/api/execute',{operationId,values,confirm})).status,409);
  assert.equal((await f.execute(values,true,{'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await f.execute(values,true,{Origin:'https://example.invalid'})).status,403);
  assert.equal(f.calls.length,1);
});

test('confirmed HTTP execute sends only five raw form values and redacts returned credentials',async t=>{
  const f=await fixture(t,()=>json({error:false,message:`accepted ${token.accessToken}`,data:null,unknown:'discard'}));
  await f.login();const response=await f.execute();
  assert.equal(response.status,200);assert.deepEqual(response.result.result.data,{error:false,message:'accepted [REDACTED]'});
  assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/'+path]);assert.deepEqual([...f.calls.at(-1).body],Object.entries(values));
  assert.equal(f.calls.at(-1).headers.Authorization,`Bearer ${token.accessToken}`);
  assert.equal((await f.send('/api/state')).result.authenticated,true);
  const text=JSON.stringify(f.logs);assert.ok(!text.includes(token.accessToken));assert.ok(!text.includes(token.refreshToken));assert.ok(!text.includes(values.Nik));
  assert.equal(f.calls.length,2,'No OTP/profile/camera/liveness/final verification request follows the tuple');
});

test('HTTP execute preserves info failure tuples and rejects malformed data without identity-state mutation',async t=>{
  let malformed=false;const f=await fixture(t,()=>json(malformed?{error:false,data:{identity:'must not expose'}}:{error:true,message:''}));
  await f.login();const denied=await f.execute();assert.equal(denied.status,200);assert.deepEqual(denied.result.result.data,{error:true,message:''});
  malformed=true;const failed=await f.execute();assert.equal(failed.status,502);assert.equal(failed.result.error.code,shapeError);assert.ok(!JSON.stringify(failed.result).includes('must not expose'));
  assert.equal((await f.send('/api/state')).result.authenticated,true);
});

test('HTTP execute rejects extra/malformed fields and attachments before transport',async t=>{
  const f=await fixture(t,()=>json({error:false}));await f.login();
  for(const input of [{...values,Email:'unexpected'},{...values,Nik:123}])assert.equal((await f.execute(input)).status,400);
  const form=new FormData();form.append('operationId',operationId);form.append('values',JSON.stringify(values));form.append('confirm','true');form.append('file',new Blob(['fixture-only']),'fixture.txt');
  const rejected=await f.send('/api/execute',form);assert.equal(rejected.status,400);assert.equal(f.calls.length,1);
});

test('HTTP identity401 expires authentication rather than continuing toward OTP',async t=>{
  const f=await fixture(t,()=>json({error:false,message:'accepted'},401));await f.login();const response=await f.execute();
  assert.equal(response.status,401);assert.equal(response.result.error.code,'SESSION_EXPIRED');assert.equal((await f.send('/api/state')).result.authenticated,false);assert.equal(f.calls.length,2);
});

test('identity execute retains the existing main-session refresh before one explicitly confirmed request',async t=>{
  const refreshed={...token,accessToken:'fixture-refreshed-daring-access'};
  const f=await fixture(t,url=>url.pathname==='/auth/refresh_token'?json({data:refreshed}):json({error:false,message:'accepted'}));
  await f.login();const owner=[...f.sessions.sessions.values()].find(item=>item.tokens);owner.tokens.expiredAt=1;
  const response=await f.execute();assert.equal(response.status,200);
  assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/auth/refresh_token','/'+path]);
  assert.equal(f.calls.at(-1).headers.Authorization,`Bearer ${refreshed.accessToken}`);assert.deepEqual([...f.calls.at(-1).body],Object.entries(values));
  assert.equal(response.result.result.data.error,false);
});

test('a rejected refresh expires authentication and never forwards identity fields',async t=>{
  const f=await fixture(t,()=>json({error:true,message:'rejected'},401));
  await f.login();const owner=[...f.sessions.sessions.values()].find(item=>item.tokens);owner.tokens.expiredAt=1;
  const response=await f.execute();assert.equal(response.status,401);assert.equal(response.result.error.code,'SESSION_EXPIRED');
  assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/auth/refresh_token']);
  assert.equal((await f.send('/api/state')).result.authenticated,false);
});

test('delayed identity response cannot resurrect or return private data after explicit logout',async t=>{
  let started,release;const ready=new Promise(resolve=>{started=resolve;});const f=await fixture(t,async()=>{started();return new Promise(resolve=>{release=resolve;});});
  await f.login();const pending=f.execute();let timeout;
  try {await Promise.race([ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Identity transport did not start')),1000);})]);}
  finally {clearTimeout(timeout);}
  assert.equal((await f.send('/api/logout',{})).status,200);
  release(json({error:false,message:'accepted'}));const response=await pending;
  assert.equal(response.status,401);assert.equal(response.result.error.code,'SESSION_EXPIRED');assert.equal((await f.send('/api/state')).result.authenticated,false);assert.equal(f.calls.length,2);
});
