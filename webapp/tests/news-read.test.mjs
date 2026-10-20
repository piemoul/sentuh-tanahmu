import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../private/api-client.mjs';
import { decodeNewsEnvelope } from '../private/news-response.mjs';
import { OPERATIONS, prepareOperation } from '../private/operations.mjs';
import { SessionStore } from '../private/session.mjs';
import { createServer } from '../server.mjs';

// Upstream transport is synthetic and in process in every test.
const cases = [
  {id:'get-berita-getberita-d2cb24', path:'Berita/GetBerita', limit:'8'},
  {id:'get-pengumuman-getpengumuman-d2cf54', path:'Pengumuman/GetPengumuman', limit:'5'},
];
const fields = ['id','title','category','banner','url'];
const blank = Object.fromEntries(fields.map(key=>[key,null]));
const row = {id:' fixture id ',title:'Judul <img src=x onerror=fixture()> é',category:' kategori ',banner:'https://image.example.invalid/fixture.png',url:'https://article.example.invalid/read?x=1&y=2'};
const token = {tokenType:'Bearer',accessToken:'fixture-news-access',refreshToken:'fixture-news-refresh',expiredAt:4_000_000_000};
const config = {configured:true,reason:'synthetic only',applicationAuthorization:()=> 'AtrBpn fixture-news-application'};
const make = entry=>{const prepared=prepareOperation(entry.id,{},{});return {...prepared,base:prepared.service.baseUrl}};
const clientFor = response=>new ApiClient(config,{log:()=>{},transport:async()=>typeof response==='function'?response():response});

async function fixture(t,responder) {
  const calls=[],logs=[],sessions=new SessionStore();
  const server=createServer({configuration:config,sessions,log:entry=>logs.push(entry),transport:async(url,init)=>{
    calls.push({url:new URL(url),...init});
    if(url.pathname==='/auth/signin')return Response.json({data:{username:'fixture-news-user',token:{...token}}});
    return responder(url,init);
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
  const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
  async function send(path,data,headers={}) {
    const response=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
    if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    const result=await response.json();if(result.csrfToken)state=result;return {response,result};
  }
  await send('/api/state');
  return {calls,logs,sessions,send,execute:(entry,values={},headers)=>send('/api/execute',{operationId:entry.id,values},headers)};
}

test('news registry retains exact native GET limits and optional-session read classification',()=>{
  for(const entry of cases){
    const operation=OPERATIONS.find(op=>op.id===entry.id);
    for(const [key,value] of Object.entries({enabled:true,serviceId:'main',auth:'optionalSession',method:'GET',path:entry.path,encoding:'none',effect:'read',mutates:false,requiresConfirmation:false,serverAcceptance:'untested'}))assert.equal(operation[key],value);
    assert.equal(operation.evidence.source,'analysis/recovered/news-flow/flow.json');
    assert.equal(operation.evidence.nativeProofSha256,'9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9');
    assert.deepEqual(operation.fields.map(field=>[field.path,field.source,field.default]),[['limit','constant',entry.limit]]);
    const p=make(entry);assert.deepEqual({...p.query},{limit:entry.limit});assert.deepEqual({...p.body},{});assert.deepEqual(p.files,[]);
    for(const limit of ['',null,'999','1&url=https://elsewhere.invalid'])assert.throws(()=>prepareOperation(entry.id,{limit},{}),{code:'FIXED_FIELD'});
    for(const key of ['url','headers','page','category','__proto__','constructor','prototype'])assert.throws(()=>prepareOperation(entry.id,{...JSON.parse(JSON.stringify({[key]:'unexpected'}))},{}),{code:'UNKNOWN_FIELD'});
  }
});

test('native news model preserves five nullable raw strings and discards unused envelope and record fields',()=>{
  const input={error:true,message:[row,{},blank,{id:'',title:'',category:'',banner:'',url:'',html:'<script>fixture()</script>',accessToken:'discard'}],data:[{wrong:'source'}],secret:'discard'};
  const before=JSON.stringify(input),output=decodeNewsEnvelope(input);
  assert.deepEqual(output,{message:[row,blank,blank,Object.fromEntries(fields.map(key=>[key,'']))]});
  assert.equal(JSON.stringify(input),before);assert.notEqual(output.message[0],row);
  output.message[0].title='local edit';assert.equal(JSON.stringify(input),before);
  assert.deepEqual(decodeNewsEnvelope({message:[]}),{message:[]});
  assert.deepEqual(decodeNewsEnvelope(JSON.stringify({message:[{}]})),{message:[blank]});
  assert.deepEqual(decodeNewsEnvelope(JSON.parse('{"message":[{"__proto__":{"url":"https://untrusted.invalid"},"constructor":{"title":"hidden"}}]}')),{message:[blank]});
  assert.equal(decodeNewsEnvelope({message:Array.from({length:26},()=>row)}).message.length,26,'Native URL limit does not authorize truncating a longer server list');
});

test('news model rejects non-list message, malformed records and every non-null non-String field without coercion',()=>{
  for(const input of [null,undefined,[],{},'invalid json','"still a string"',{data:[]},{message:null},{message:{}},{message:'[]'},{message:1},{message:[null]},{message:[[]]},{message:[1]},{message:['row']},{message:Array(1)}])assert.throws(()=>decodeNewsEnvelope(input),{code:'NEWS_RESPONSE_UNRECOGNIZED'});
  for(const field of fields)for(const value of [0,1,true,false,{},[],undefined])assert.throws(()=>decodeNewsEnvelope({error:true,message:[{...row,[field]:value}]}),{code:'NEWS_RESPONSE_UNRECOGNIZED'});
  const inherited=Object.create({title:'not a JSON map'});assert.throws(()=>decodeNewsEnvelope({message:[inherited]}),{code:'NEWS_RESPONSE_UNRECOGNIZED'});
});

test('news wire requests use only fixed main GET URLs and retain existing form header and stored-session behavior',async()=>{
  const calls=[];const client=new ApiClient(config,{log:()=>{},transport:async(url,init)=>{calls.push({url,init});return Response.json({message:[row]})}});
  for(const session of [undefined,{active:true,tokens:{...token}}])for(const entry of cases){
    const result=await client.request({...make(entry),session});const {url,init}=calls.at(-1);
    assert.equal(url.href,`https://sentuh.atrbpn.go.id/${entry.path}?limit=${entry.limit}`);assert.equal(init.method,'GET');assert.equal(init.body,undefined);
    assert.equal(init.headers.Accept,'application/json');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(init.headers.Authorization,session?'Bearer '+token.accessToken:undefined);
    assert.deepEqual(result.data,{message:[row]});assert.equal(result.status,200);
  }
  assert.equal(calls.length,4);
});

test('news transport scope rejects changed method auth profile path or query before forwarding',async()=>{
  let calls=0;const client=new ApiClient(config,{log:()=>{},transport:async()=>{calls++;return Response.json({message:[]})}});
  for(const entry of cases){
    const original=make(entry);
    for(const patch of [{method:'POST'},{method:'HEAD'},{encoding:'form'},{auth:'none'},{auth:'session'},{auth:'application'},{clientProfile:'sps-document-viewer'},{query:{}},{query:{limit:Number(entry.limit)}},{query:{limit:'9'}},{query:{limit:entry.limit,page:'2'}},{path:entry.path+'?limit='+entry.limit},{path:entry.path+'#fragment'},{path:'/'+entry.path},{body:{url:row.url}},{files:[{key:'file',file:new Blob(['fixture'])}]}])await assert.rejects(client.request({...original,...patch}),{code:'NEWS_READ_SCOPE'});
    await assert.rejects(client.request({...original,base:'https://untrusted.example.invalid'}),{code:'SERVICE_NOT_READY'});
  }
  assert.equal(calls,0);
});

test('news successful JSON and String bodies use message and ignore error flag while preserving native field types',async()=>{
  for(const entry of cases)for(const error of [true,false,null,1,'true',{nested:'ignored'}]){
    const envelope={error,message:[row,{}],data:[{ignored:'alternate list'}]};
    for(const response of [Response.json(envelope),Response.json(JSON.stringify(envelope)),new Response(JSON.stringify(envelope),{headers:{'Content-Type':'text/plain'}}),new Response(JSON.stringify(envelope),{headers:{'Content-Type':'application/octet-stream'}})]){
      const result=await clientFor(response).request(make(entry));assert.deepEqual(result.data,{message:[row,blank]});
    }
  }
  const plainQuoted=new Response(JSON.stringify(JSON.stringify({message:[]})),{headers:{'Content-Type':'text/plain'}});
  await assert.rejects(clientFor(plainQuoted).request(make(cases[0])),{code:'NEWS_RESPONSE_UNRECOGNIZED'},'Native plain text body is decoded once, not recursively');
});

test('news accepts only HTTP200 and cannot turn other endpoints into message-envelope exceptions',async()=>{
  for(const entry of cases){
    for(const status of [201,202,204,206,299,400,401,403,404,500]){
      const response=status===204?new Response(null,{status}):Response.json({error:false,message:[]},{status});
      await assert.rejects(clientFor(response).request(make(entry)),error=>error.code==='UPSTREAM_REJECTED'&&error.status===(status===401?401:status===403?403:502)&&error.details.upstreamStatus===status);
    }
    await assert.rejects(clientFor(new Response(null,{status:302,headers:{Location:row.url}})).request(make(entry)),{code:'UPSTREAM_REDIRECT'});
  }
  for(const request of [{path:'account/fixture',auth:'none'},{base:'https://aplikasi.atrbpn.go.id/',path:'Berita/GetBerita',method:'GET',encoding:'none',query:{limit:'8'},auth:'none'},{path:'berita/getberita',method:'GET',encoding:'none',auth:'none'}])await assert.rejects(clientFor(Response.json({error:true,message:[row]})).request(request),{code:'UPSTREAM_REJECTED'});
});

test('invalid success responses fail generically without reflecting model values or HTML',async()=>{
  const sentinel='fixture-do-not-echo-sensitive-value';
  for(const entry of cases)for(const response of [Response.json({message:[{title:{secret:sentinel}}]}),Response.json({message:sentinel}),Response.json({data:[row]}),new Response('<html>'+sentinel+'</html>',{headers:{'Content-Type':'text/html'}}),new Response('',{headers:{'Content-Type':'application/octet-stream'}})]){
    await assert.rejects(clientFor(response).request(make(entry)),error=>error.code==='NEWS_RESPONSE_UNRECOGNIZED'&&!JSON.stringify(error).includes(sentinel)&&!error.cause);
  }
  await assert.rejects(clientFor(new Response('{bad',{headers:{'Content-Type':'application/json'}})).request(make(cases[0])),{code:'INVALID_UPSTREAM_JSON'});
});

test('news HTTP adapters preserve Origin CSRF and fixed parameter validation before optional-session requests',async t=>{
  const f=await fixture(t,()=>Response.json({error:true,message:[row,{}],data:[{unused:true}]}));
  for(const entry of cases){
    assert.equal((await f.execute(entry,{}, {Origin:'https://untrusted.example.invalid'})).response.status,403);
    assert.equal((await f.execute(entry,{}, {'X-CSRF-Token':'invalid'})).response.status,403);
    assert.equal((await f.execute(entry,{limit:'999'})).response.status,400);
    assert.equal((await f.execute(entry,{url:row.url})).response.status,400);
  }
  assert.equal(f.calls.length,0);
  for(const entry of cases){const out=await f.execute(entry);assert.equal(out.response.status,200);assert.deepEqual(out.result.result.data,{message:[row,blank]})}
  assert.equal(f.calls.length,2);assert.ok(f.calls.every(call=>call.headers.Authorization===undefined));
});

test('news execution refreshes existing sessions and failures remain retryable without reclassifying them as empty success',async t=>{
  let attempts=0;
  const f=await fixture(t,url=>{
    if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'fixture-news-renewed'}});
    if(++attempts===1)throw Object.assign(new Error('fixture transient'),{code:'ECONNRESET'});
    return Response.json({message:[]});
  });
  await f.send('/api/login',{username:'fixture-news-user',password:'fixture-news-password'});
  const session=[...f.sessions.sessions.values()][0];session.tokens.expiredAt=1;
  const failed=await f.execute(cases[0]);assert.equal(failed.result.error.code,'UPSTREAM_UNREACHABLE');assert.equal((await f.send('/api/state')).result.authenticated,true);
  const success=await f.execute(cases[0]);assert.equal(success.response.status,200);assert.deepEqual(success.result.result.data,{message:[]});
  assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/auth/refresh_token','/Berita/GetBerita','/Berita/GetBerita']);
  assert.ok(f.calls.slice(2).every(call=>call.headers.Authorization==='Bearer fixture-news-renewed'));
});

test('news output redaction and transport logging do not disclose session data or returned URL contents',async t=>{
  const reflected={...row,title:`${token.accessToken} ${token.refreshToken} fixture-news-application`,url:row.url+'#'+token.accessToken};
  const f=await fixture(t,()=>Response.json({message:[{...reflected,password:'discarded'}],accessToken:'discarded-extra'}));
  await f.send('/api/login',{username:'fixture-news-user',password:'fixture-news-password'});
  for(const entry of cases){const out=await f.execute(entry);assert.equal(out.response.status,200);for(const secret of [token.accessToken,token.refreshToken,'fixture-news-application','discarded-extra','discarded'])assert.ok(!JSON.stringify(out.result).includes(secret))}
  const logs=JSON.stringify(f.logs);for(const value of [token.accessToken,token.refreshToken,'fixture-news-password','fixture-news-application',row.url,row.banner,row.title])assert.ok(!logs.includes(value));
  assert.ok(f.logs.every(entry=>!Object.hasOwn(entry,'body')&&!Object.hasOwn(entry,'headers')));
});

test('news 401 and delayed results keep existing session revocation and logout isolation',async t=>{
  for(const entry of cases){
    const f=await fixture(t,()=>Response.json({message:[]},{status:401}));
    await f.send('/api/login',{username:'fixture-news-user',password:'fixture-news-password'});
    const session=[...f.sessions.sessions.values()][0];session.downloads.set('fixture-download',{});
    const result=await f.execute(entry);assert.equal(result.response.status,401);assert.equal(result.result.error.code,'SESSION_EXPIRED');assert.equal(session.tokens,null);assert.equal(session.user,null);assert.equal(session.downloads.size,0);
  }
  let ready,release;const started=new Promise(resolve=>{ready=resolve}),pending=new Promise(resolve=>{release=resolve});
  const f=await fixture(t,async()=>{ready();await pending;return Response.json({message:[{...row,title:'fixture old session article'}]})});
  await f.send('/api/login',{username:'fixture-news-user',password:'fixture-news-password'});
  const request=f.execute(cases[0]);await started;await f.send('/api/logout',{});release();
  const result=await request;assert.equal(result.response.status,401);assert.equal(result.result.error.code,'SESSION_EXPIRED');assert.ok(!JSON.stringify(result.result).includes('fixture old session article'));
});
