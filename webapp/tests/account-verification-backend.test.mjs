import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// All upstream responses/credentials are synthetic; HTTP integration binds only
// to loopback and injects transport. No official account or service is contacted.
const operationId='get-account-checkverifstatusperorangan-da15dc';
const path='account/CheckVerifStatusPerorangan';
const shapeError='VERIFICATION_STATUS_RESPONSE_UNRECOGNIZED';
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=> 'AtrBpn fixture-verification-application'};
const token={tokenType:'Bearer',accessToken:'fixture-verification-access',refreshToken:'fixture-verification-refresh',expiredAt:4_000_000_000};
const user={username:'fixture-verification-user',userLevel:1};
const session=()=>({active:true,tokens:{...token},user:{...user},downloads:new Map([['fixture-download',{}]])});
const request=(overrides={})=>({path,method:'GET',encoding:'none',auth:'session',session:session(),...overrides});
const client=response=>new ApiClient(config,{log:()=>{},transport:async()=>typeof response==='function'?response():response});
const json=(value,status=200)=>Response.json(value,{status});

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
    const response=await fetch(base+route,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
    if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    const result=await response.json();if(result.csrfToken)state=result;
    return {status:response.status,result};
  }
  await send('/api/state');
  return {calls,logs,sessions,send,login:()=>send('/api/login',{username:user.username,password:'fixture-verification-password'}),execute:(values={},headers)=>send('/api/execute',{operationId,values},headers)};
}

test('verification registry keeps the audited fixed main-session GET parameter-free',()=>{
  const op=OPERATIONS.find(item=>item.id===operationId);
  for(const[key,value]of Object.entries({enabled:true,method:'GET',encoding:'none',path,serviceId:'main',auth:'session',effect:'read',mutates:false,requiresConfirmation:false}))assert.equal(op[key],value);
  const prepared=prepareOperation(operationId,{}, {authenticated:true});
  assert.deepEqual({...prepared.body},{});assert.deepEqual({...prepared.query},{});assert.deepEqual(prepared.files,[]);
  for(const key of ['userLevel','id','status','query','url','headers'])assert.throws(()=>prepareOperation(operationId,{[key]:'unexpected'},{authenticated:true}),{code:'UNKNOWN_FIELD'});
  assert.throws(()=>prepareOperation(operationId,{},{}),{code:'LOGIN_REQUIRED'});
});

test('status wire uses exact fixed URL/session headers without body or query',async()=>{
  const calls=[];
  const api=new ApiClient(config,{log:()=>{},transport:async(url,init)=>{calls.push({url,init});return json({error:true,message:'1',data:''});}});
  const prepared=prepareOperation(operationId,{}, {authenticated:true});
  const result=await api.request({...prepared,base:prepared.service.baseUrl,session:session()});
  assert.equal(calls.length,1);const {url,init}=calls[0];
  assert.equal(url.href,'https://sentuh.atrbpn.go.id/account/CheckVerifStatusPerorangan');
  assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.headers.Authorization,`Bearer ${token.accessToken}`);
  assert.equal(init.headers.Accept,'application/json');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');
  assert.deepEqual(result.data,{error:true,message:'1',data:''});
});

test('typed error true/false/null is retained independently of every exact or unknown message',async()=>{
  for(const error of [true,false,null])for(const message of ['-1','0','1','2','3','','unknown',' 1 ',null])for(const data of ['', ' raw reason\nsecond line ',null]){
    const envelope={error,message,data};
    const result=await client(json(envelope)).request(request());
    assert.deepEqual(result.data,envelope);assert.equal(result.status,200);
  }
});

test('missing fields become native null and ignored fields cannot leak into the status model',async()=>{
  for(const envelope of [{},{error:null},{message:''},{data:''},{error:true,ignored:'discard',accessToken:'discard'}]){
    const decoded=(await client(json(envelope)).request(request())).data;
    assert.deepEqual(decoded,{error:envelope.error??null,message:envelope.message??null,data:envelope.data??null});
    assert.deepEqual(Object.keys(decoded),['error','message','data']);
  }
  const dangerous=JSON.parse('{"message":"3","__proto__":{"error":true},"constructor":{"data":"hidden"}}');
  assert.deepEqual((await client(json(dangerous)).request(request())).data,{error:null,message:'3',data:null});
  assert.equal({}.error,undefined);
});

test('every nonnull wrong direct BCb field type fails instead of coercing',async()=>{
  for(const [key,values]of Object.entries({error:[0,1,'true',{},[]],message:[0,1,true,false,{},[]],data:[0,1,true,false,{},[]]}))for(const value of values){
    await assert.rejects(client(json({error:true,message:'1',data:'', [key]:value})).request(request()),error=>error.code===shapeError&&error.status===502&&error.details.upstreamStatus===200);
  }
});

test('status rejects non-Map roots and never decodes a JSON String a second time',async()=>{
  for(const value of [null,[],true,false,0,1,'','{}',JSON.stringify({error:true,message:'1',data:''})])await assert.rejects(client(json(value)).request(request()),{code:shapeError});
  for(const text of ['', 'plain text', '<html>not a status</html>'])await assert.rejects(client(new Response(text,{headers:{'Content-Type':'text/plain'}})).request(request()),{code:shapeError});
  assert.deepEqual((await client(new Response('{"message":"2","data":""}',{headers:{'Content-Type':'text/plain'}})).request(request())).data,{error:null,message:'2',data:''},'Existing shared transport JSON transformation remains; the BCb model receives only its transformed Map');
});

test('status preserves the existing successful 2xx range without inventing a helper HTTP200 check',async()=>{
  for(const status of [200,201,202,206,299]){
    const result=await client(json({error:true,message:'unknown'},status)).request(request());
    assert.equal(result.status,status);assert.deepEqual(result.data,{error:true,message:'unknown',data:null});
  }
  for(const status of [204,205])await assert.rejects(client(new Response(null,{status})).request(request()),{code:shapeError},'An empty accepted transport body still fails the native Map cast');
});

test('status scope rejects deviations before any transport',async()=>{
  let calls=0;
  const api=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;return json({error:true,message:'1'});}});
  const symbol=Symbol('unexpected');
  for(const overrides of [
    {method:'POST'},{method:'HEAD'},{encoding:'json'},{encoding:'form'},{auth:'none'},{auth:'optionalSession'},
    {clientProfile:'sps-document-viewer'},{body:{id:'x'}},{body:null},{body:[]},{body:Object.create({hidden:true})},{body:{[symbol]:true}},
    {query:{id:'x'}},{query:null},{query:[]},{query:Object.create({hidden:true})},{query:{[symbol]:true}},
    {files:[{}]},{files:null},{files:{}},{path:'/'+path},{path:path+'?extra=x'},{path:path+'#fragment'},
  ])await assert.rejects(api.request(request(overrides)),{code:'VERIFICATION_STATUS_SCOPE'});
  await assert.rejects(api.request(request({path:'account/../account/CheckVerifStatusPerorangan'})),{code:'INVALID_PATH'},'The existing earlier path-traversal guard retains precedence');
  assert.equal(calls,0);
  assert.deepEqual((await api.request(request({body:Object.create(null),query:Object.create(null)}))).data,{error:true,message:'1',data:null});
  assert.equal(calls,1);
});

test('same path on another origin and neighboring/case-variant endpoints keep generic business-error rejection',async()=>{
  for(const overrides of [
    {path:'account/account_summary'},{path:'account/OtherStatus'},{path:path.toLowerCase()},{path:path+'/'},
    {base:'https://antre.atrbpn.go.id/',auth:'none'},
  ])await assert.rejects(client(json({error:true,message:'1',data:''})).request(request(overrides)),{code:'UPSTREAM_REJECTED'});
  await assert.rejects(client(json({error:true,message:'1'})).request(request({base:'https://antre.atrbpn.go.id/'})),{code:'TOKEN_AUDIENCE_UNVERIFIED'});
});

test('HTTP failures retain generic diagnostic redaction rather than entering the successful status model',async()=>{
  for(const status of [400,403,404,429,500,503]){
    const owner=session();
    await assert.rejects(client(json({error:true,message:`denied ${token.accessToken}`,data:{}},status)).request(request({session:owner})),error=>{
      assert.equal(error.code,'UPSTREAM_REJECTED');assert.equal(error.status,status===403?403:502);
      assert.equal(error.details.upstreamStatus,status);assert.equal(error.details.message,'denied [REDACTED]');return true;
    });
    assert.ok(owner.tokens);assert.deepEqual(owner.user,user);
  }
});

test('redirect and invalid transport JSON guards remain unchanged',async()=>{
  for(const status of [300,301,302,307,308])await assert.rejects(client(new Response(null,{status,headers:{Location:'https://example.invalid/'}})).request(request()),{code:'UPSTREAM_REDIRECT'});
  await assert.rejects(client(new Response('{',{headers:{'Content-Type':'application/json'}})).request(request()),{code:'INVALID_UPSTREAM_JSON'});
});

test('status still observes declared and streaming response size limits',async()=>{
  for(const declared of [true,false]){
    let canceled=false;
    const stream=new ReadableStream({start(controller){if(!declared)controller.enqueue(new Uint8Array(20*1024*1024+1));},cancel(){canceled=true;}});
    await assert.rejects(client(new Response(stream,{headers:declared?{'Content-Length':String(20*1024*1024+1)}:{}})).request(request()),{code:'RESPONSE_TOO_LARGE'});
    assert.equal(canceled,true);
  }
});

test('status preserves network and body-stream failures as transport errors',async()=>{
  const api=new ApiClient(config,{log:()=>{},transport:async()=>{throw Object.assign(new Error('never expose fixture secret'),{code:'ECONNREFUSED'});}});
  await assert.rejects(api.request(request()),error=>error.code==='UPSTREAM_UNREACHABLE'&&error.details.networkCode==='ECONNREFUSED'&&!error.message.includes('secret'));
  const stream=new ReadableStream({start(controller){controller.error(Object.assign(new Error('never expose'),{code:'ECONNRESET'}));}});
  await assert.rejects(client(new Response(stream)).request(request()),error=>error.code==='UPSTREAM_UNREACHABLE'&&error.details.stage==='response_body');
});

test('status cannot run without an active authenticated session',async()=>{
  let calls=0;const api=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;return json({message:'1'});}});
  await assert.rejects(api.request(request({session:undefined})),{code:'AUTH_REQUIRED'});
  await assert.rejects(api.request(request({session:{tokens:{...token},active:false}})),{code:'SESSION_EXPIRED'});
  assert.equal(calls,0);
});

test('HTTP401 clears only the rejected owning session and never delivers an error:true status',async()=>{
  for(const body of [{error:true,message:'1',data:''},{error:true,message:1},null]){
    const owner=session();
    await assert.rejects(client(json(body,401)).request(request({session:owner})),{code:'SESSION_EXPIRED'});
    assert.equal(owner.tokens,null);assert.equal(owner.user,null);assert.equal(owner.downloads.size,0);
  }
});

test('a stale HTTP401 cannot clear newer session tokens',async()=>{
  const owner=session(),newTokens={...token,accessToken:'fixture-newer-access'};
  const api=new ApiClient(config,{log:()=>{},transport:async()=>{owner.tokens=newTokens;return json({error:true,message:'1'},401);}});
  await assert.rejects(api.request(request({session:owner})),{code:'SESSION_CHANGED'});
  assert.equal(owner.tokens,newTokens);assert.deepEqual(owner.user,user);assert.equal(owner.downloads.size,1);
});

test('execute returns a typed error:true/unknown status with existing secret redaction',async t=>{
  const f=await fixture(t,()=>json({error:true,message:'unknown-code',data:`reason ${token.accessToken}`,ignored:'discard'}));
  assert.equal((await f.login()).status,200);
  const response=await f.execute();
  assert.equal(response.status,200);assert.deepEqual(response.result.result.data,{error:true,message:'unknown-code',data:'reason [REDACTED]'});
  assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/account/CheckVerifStatusPerorangan']);
  assert.equal(f.calls.at(-1).body,undefined);assert.equal(f.calls.at(-1).url.search,'');
  assert.equal((await f.send('/api/state')).result.authenticated,true);
  assert.ok(!JSON.stringify(f.logs).includes(token.accessToken));assert.ok(!JSON.stringify(f.logs).includes(token.refreshToken));
});

test('execute rejects malformed direct model types without exposing raw payload or changing session',async t=>{
  const f=await fixture(t,()=>json({error:true,message:'2',data:{accessToken:'must not expose'}}));
  await f.login();const response=await f.execute();
  assert.equal(response.status,502);assert.equal(response.result.error.code,shapeError);
  assert.ok(!JSON.stringify(response.result).includes('must not expose'));
  assert.equal((await f.send('/api/state')).result.authenticated,true);
});

test('execute keeps authentication, unknown-field, origin and CSRF checks before transport',async t=>{
  const f=await fixture(t,()=>json({error:true,message:'1'}));
  assert.equal((await f.execute()).status,401);assert.equal(f.calls.length,0);
  await f.login();
  assert.equal((await f.execute({userLevel:2})).status,400);
  assert.equal((await f.execute({}, {'X-CSRF-Token':'wrong'})).status,403);
  assert.equal((await f.execute({}, {Origin:'https://example.invalid'})).status,403);
  assert.equal(f.calls.length,1);
});

test('execute HTTP401 expires the browser session instead of returning a business status',async t=>{
  const f=await fixture(t,()=>json({error:true,message:'1',data:''},401));
  await f.login();const response=await f.execute();
  assert.equal(response.status,401);assert.equal(response.result.error.code,'SESSION_EXPIRED');
  assert.equal((await f.send('/api/state')).result.authenticated,false);
});

test('logout during a delayed successful status prevents delivery and session resurrection',async t=>{
  let started,release;const ready=new Promise(resolve=>{started=resolve;});
  const f=await fixture(t,async()=>{started();return new Promise(resolve=>{release=resolve;});});
  await f.login();const pending=f.execute();await ready;
  assert.equal((await f.send('/api/logout',{})).status,200);
  release(json({error:true,message:'1',data:''}));
  const response=await pending;assert.equal(response.status,401);assert.equal(response.result.error.code,'SESSION_EXPIRED');
  assert.equal((await f.send('/api/state')).result.authenticated,false);
  assert.equal(f.calls.length,2,'Status read never initiates logout, login, or an identity/verification request');
});
