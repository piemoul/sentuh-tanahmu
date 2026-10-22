import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeParcelRegionsJson as regions,decodeParcelLookupJson as parcel} from '../private/parcel-search-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Synthetic upstream only. The official server, personal IDs and locations are
// never used; this checks actual registry/client/HTTP contracts, not acceptance.
const R='get-legacy-wilayah-d752bc',A='get-legacy-getpersilid-d74e4c',E='get-legacy-getpersilidbynibel-d74b90';
const contracts=[
 [R,'legacy/Wilayah',{kantorid:' main office + & '},{kantorid:' main office + & ',nama:''},'[]'],
 [A,'legacy/GetPersilId',{jenishak:'1',nomorhak:' 00012 +&/%é😀 ',kantorid:' main office + & ',wilayahid:' WilayahId +& '},{jenishak:'1',nomorhak:' 00012 +&/%é😀 ',kantorid:' main office + & ',wilayahid:' WilayahId +& '},'{"PersilId":" returned parcel +& "}'],
 [E,'legacy/GetPersilIdByNibel',{nibel:' 12.34 56789012345+& '},{nibel:' 12.34 56789012345+& ',kodehat:''},'{"PersilId":" returned parcel +& "}'],
];
const token={tokenType:'Bearer',accessToken:'synthetic-parcel-access',refreshToken:'synthetic-parcel-refresh',expiredAt:4_000_000_000};
const config={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-parcel-application',reason:'synthetic only'};
const session=()=>({active:true,user:{username:'synthetic-parcel-user'},tokens:{...token}});
const model={Alamat:null,BatasPersil:null,BatasPersilLegal:null,Luas:null,NamaWilayah:null,NomorIndukBidang:null,PersilId:null,TipeWilayah:null};
const json=value=>JSON.stringify(value);
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};
const request=(path,query,patch={})=>({path,query,method:'GET',encoding:'none',auth:'session',session:session(),...patch});

test('three existing parcel reads retain176 catalog entries and explicit read-only main-session boundaries',()=>{
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,94);
 for(const [id,path] of contracts){const op=OPERATIONS.find(item=>item.id===id);assert.equal(op.path,path);assert.equal(op.serviceId,'main');assert.equal(op.auth,'session');assert.equal(op.effect,'read');assert.equal(op.encoding,'none');assert.equal(op.requiresConfirmation,false);assert.equal(op.serverAcceptance,'untested');}
 assert.equal(OPERATIONS.find(op=>op.id==='get-legacy-kantah-d10364').auth,'optionalSession');assert.equal(OPERATIONS.find(op=>op.id==='post-geotag-uploadgeotag-d96b98').enabled,false);
});

test('Cyb region list retains every nullable PascalCase String in native order and ignores extras',()=>{
 assert.deepEqual(regions('[{}, {"Kode":"raw-code","Nama":" Nama ","TipeWilayah":" D ","WilayahId":"actual-choice-id","error":true,"data":{}}]'),[
  {Kode:null,Nama:null,TipeWilayah:null,WilayahId:null},{Kode:'raw-code',Nama:' Nama ',TipeWilayah:' D ',WilayahId:'actual-choice-id'},
 ]);assert.deepEqual(regions('[]'),[]);
});
test('Cyb rejects a malformed list or any row; no nested envelope or lower-case alias substitutes data',()=>{
 for(const input of ['null','{}','{"data":[]}','"[]"','[null]','[{},3]','[[],{}]','not-json'])assert.throws(()=>regions(input),{code:'PARCEL_REGION_RESPONSE_UNRECOGNIZED'});
 for(const key of ['Kode','Nama','TipeWilayah','WilayahId'])for(const value of [0,1.0,true,{},[]])assert.throws(()=>regions(json([{}, {[key]:value}])));
 assert.deepEqual(regions('[{"kode":"ignored","wilayahId":"ignored"}]'),[{Kode:null,Nama:null,TipeWilayah:null,WilayahId:null}]);
});
test('tyb direct lookup keeps all eight nullable fields and ignores unknown envelope flags',()=>{
 assert.deepEqual(parcel('{}'),model);
 assert.deepEqual(parcel('{"error":true,"data":{"PersilId":"must-not-unwrap"},"message":false,"PersilId":" original parcel ","unknown":1e999}'),{...model,PersilId:' original parcel '});
 assert.deepEqual(parcel('{"persilId":"wrong-case","luas":1}'),model);
 for(const input of ['null','[]','"{}"','not-json'])assert.throws(()=>parcel(input));
 for(const value of [0,true,[],{}])assert.throws(()=>parcel(json({PersilId:value})));
});
test('four specialized Null? fields accept missing/null only, never guessed Strings or other types',()=>{
 for(const key of ['Alamat','NamaWilayah','NomorIndukBidang','TipeWilayah']){
  assert.deepEqual(parcel(json({[key]:null})),model);
  for(const value of ['', 'text',0,false,{},[]])assert.throws(()=>parcel(json({[key]:value})),{code:'PARCEL_LOOKUP_RESPONSE_UNRECOGNIZED'});
 }
});
test('int? values preserve safe numbers and full signed64 text, including native null defaults',()=>{
 assert.deepEqual(parcel('{"BatasPersil":9223372036854775807,"BatasPersilLegal":-9223372036854775808,"Luas":42}'),{...model,BatasPersil:'9223372036854775807',BatasPersilLegal:'-9223372036854775808',Luas:42});
 for(const key of ['BatasPersil','BatasPersilLegal','Luas']){
  for(const value of ['0','-0','9007199254740991','-9007199254740991'])assert.equal(parcel('{"'+key+'":'+value+'}')[key],value==='-0'?0:Number(value));
  for(const value of ['9007199254740992','-9007199254740992'])assert.equal(parcel('{"'+key+'":'+value+'}')[key],value);
  for(const value of ['1.0','1e0','1.5','"1"','true','{}','[]','9223372036854775808','-9223372036854775809','123456789012345678901234567890'])assert.throws(()=>parcel('{"'+key+'":'+value+'}'));
 }
});

for(const [id,path,values,query] of contracts)test(`${path} preparation fixes ordered query, uses main session and preserves raw Strings`,()=>{
 const p=prepareOperation(id,values,{authenticated:true});assert.deepEqual({...p.query},query);assert.deepEqual(Object.keys(p.query),Object.keys(query));assert.deepEqual(p.body,{});assert.equal(p.path,path);assert.equal(p.serviceId,'main');assert.equal(p.method,'GET');assert.equal(p.auth,'session');assert.equal(p.requiresConfirmation,false);assert.deepEqual(p.files,[]);
 assert.throws(()=>prepareOperation(id,values,{}),{code:'LOGIN_REQUIRED'});
 for(const key of ['nik','Authorization','headers','base','url','latitude','longitude','IsOffline','__proto__'])assert.throws(()=>prepareOperation(id,{...values,[key]:'forged'},{authenticated:true}),{code:'UNKNOWN_FIELD'});
 for(const [key] of Object.entries(values))for(const value of [null,1,true,[],{}])assert.throws(()=>prepareOperation(id,{...values,[key]:value},{authenticated:true}));
 const getter={...values};Object.defineProperty(getter,Object.keys(values)[0],{enumerable:true,get(){throw Error('must not invoke');}});assert.throws(()=>prepareOperation(id,getter,{authenticated:true}),{code:'INVALID_FIELD'});
 const symbol={...values,[Symbol('hidden')]:'not allowed'};assert.throws(()=>prepareOperation(id,symbol,{authenticated:true}),{code:'INVALID_PARAMETERS'});
 for(const key of Object.keys(values))assert.throws(()=>prepareOperation(id,{...values,[key]:'x'.repeat(16001)},{authenticated:true}),{code:'INVALID_FIELD'});
});
test('analog native rights and region requirements preserve HGU/HPL empty or retained region and empty raw number',()=>{
 for(const jenishak of ['1','2','3','4','5','8']){
  assert.equal(prepareOperation(A,{jenishak,nomorhak:'',kantorid:'main-office',wilayahid:'actual-WilayahId'},{authenticated:true}).query.nomorhak,'');
  if(['2','5'].includes(jenishak))assert.equal(prepareOperation(A,{jenishak,nomorhak:'',kantorid:'main-office',wilayahid:''},{authenticated:true}).query.wilayahid,'');
  else assert.throws(()=>prepareOperation(A,{jenishak,nomorhak:'',kantorid:'main-office',wilayahid:''},{authenticated:true}),{code:'INVALID_PARCEL_SELECTION'});
 }
 for(const jenishak of ['0','6','01',' 1 ',1])assert.throws(()=>prepareOperation(A,{jenishak,nomorhak:'1',kantorid:'main-office',wilayahid:'actual-WilayahId'},{authenticated:true}));
});
test('empty native query constants cannot be changed and NIBEL guard never normalizes dotted/spaced Strings',()=>{
 assert.throws(()=>prepareOperation(R,{kantorid:'main-office',nama:'changed'},{authenticated:true}),{code:'FIXED_FIELD'});
 assert.throws(()=>prepareOperation(E,{nibel:'12345678901234',kodehat:'changed'},{authenticated:true}),{code:'FIXED_FIELD'});
 for(const nibel of ['12345678901234','12.34 56789012345','              ','😀😀😀😀😀😀😀'])assert.equal(prepareOperation(E,{nibel},{authenticated:true}).query.nibel,nibel);
 for(const nibel of ['', '1234567890123'])assert.throws(()=>prepareOperation(E,{nibel},{authenticated:true}));
});
for(const [,path,,query,reply] of contracts)test(`${path} transport uses exact fixed GET, main Authorization and single query-component escaping`,async()=>{
 let count=0;const client=new ApiClient(config,{log(){},transport:async(url,init)=>{count++;assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/'+path);assert.deepEqual([...url.searchParams],Object.entries(query));assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.deepEqual(Object.keys(init.headers).sort(),['Accept','Authorization','Content-Type','User-Agent']);assert.equal(init.headers.Authorization,'Bearer synthetic-parcel-access');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');return new Response(reply,{headers:{'Content-Type':'application/json'}});}});
 const result=await client.request(request(path,query));assert.equal(result.status,200);assert.equal(count,1);
 assert.deepEqual(result.data,path==='legacy/Wilayah'?[]:{...model,PersilId:' returned parcel +& '});
});
for(const [,path,,query] of contracts)test(`${path} client scope rejects alternate origins, methods, bodies, fields or getter query before transport`,async()=>{
 let count=0;const client=new ApiClient(config,{log(){},transport:async()=>{count++;return Response.json({});}});
 for(const patch of [{base:'https://aplikasi.atrbpn.go.id/'},{base:'https://sentuh.atrbpn.go.id/alternate/'},{path:'/'+path},{path:path+'?injected=1'},{path:path+'#fragment'},{method:'POST'},{encoding:'form'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{body:null},{body:[]},{body:{extra:''}},{files:[{}]},{query:null},{query:[]},{query:{...query,extra:''}},{query:Object.fromEntries(Object.entries(query).reverse())}])await assert.rejects(client.request(request(path,query,patch)),{code:'PARCEL_SEARCH_SCOPE'});
 const getter={...query};Object.defineProperty(getter,Object.keys(query)[0],{enumerable:true,get(){throw Error('must not invoke');}});await assert.rejects(client.request(request(path,getter)),{code:'PARCEL_SEARCH_SCOPE'});
 assert.equal(count,0);
});
for(const [name,parse] of [['regions',regions],['lookup',parcel]])test(`${name} parser accepts JSON text only and never silently substitutes a second decoded string`,()=>{
 for(const input of [undefined,null,{},[],42,true])assert.throws(()=>parse(input));
});
test('lookup accepts HTTP200 only while regions retain shared2xx range; non200 bodies are not parsed',async()=>{
 for(const status of [201,202,204,206,400,403,500]){
  const lookup=new ApiClient(config,{log(){},transport:async()=>new Response(status===204?null:'malformed private error text',{status})});
  await assert.rejects(lookup.request(request(contracts[1][1],contracts[1][3])),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status);
 }
 for(const status of [200,201,202,206]){const client=new ApiClient(config,{log(){},transport:async()=>new Response('[]',{status,headers:{'Content-Type':'application/json'}})});const result=await client.request(request(contracts[0][1],contracts[0][3]));assert.equal(result.status,status);assert.deepEqual(result.data,[]);}
 const noRows=new ApiClient(config,{log(){},transport:async()=>new Response(null,{status:204})});await assert.rejects(noRows.request(request(contracts[0][1],contracts[0][3])),{code:'PARCEL_REGION_RESPONSE_UNRECOGNIZED'});
});
test('redirects and network failures retain existing transport policy without exposing query, IDs or credentials',async()=>{
 const logs=[],query=contracts[1][3];
 for(const responder of [()=>new Response(null,{status:302,headers:{Location:'https://other.invalid/private'}}),()=>{throw Object.assign(new Error('private token and query'),{code:'ENOTFOUND'});}]){
  const client=new ApiClient(config,{log:e=>logs.push(e),transport:responder});await assert.rejects(client.request(request(contracts[1][1],query)),error=>['UPSTREAM_REDIRECT','UPSTREAM_UNREACHABLE'].includes(error.code));
 }
 const out=json(logs);for(const value of [...Object.values(query),'synthetic-parcel-access','synthetic-parcel-refresh','other.invalid','private token'])if(value.length>2)assert.equal(out.includes(value),false);
});
test('HTTP401 clears only the owned session token generation',async()=>{
 const owned=session();const client=new ApiClient(config,{log(){},transport:async()=>new Response('private-not-json',{status:401})});await assert.rejects(client.request(request(contracts[1][1],contracts[1][3],{session:owned})),{code:'SESSION_EXPIRED'});assert.equal(owned.tokens,null);
 const current=session(),older=current.tokens;const concurrent=new ApiClient(config,{log(){},transport:async()=>{current.tokens={...token,accessToken:'new-generation'};return new Response('',{status:401});}});await assert.rejects(concurrent.request(request(contracts[2][1],contracts[2][3],{session:current})),{code:'SESSION_CHANGED'});assert.notEqual(current.tokens,older);assert.equal(current.tokens.accessToken,'new-generation');
});

async function fixture(t,responder=()=>Response.json({PersilId:' synthetic-returned-id '}),{expired=false}={}){
 const calls=[],logs=[],sessions=new SessionStore();
 const server=createServer({configuration:config,sessions,log:e=>logs.push(e),transport:async(url,init)=>{
  calls.push({url:new URL(url),init});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-parcel-user',token:{...token,expiredAt:expired?1:token.expiredAt}}});
  if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'synthetic-parcel-refreshed'}});
  return responder(url,init);
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:json(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const result=await response.json();if(result.csrfToken)state=result;return {status:response.status,result};}
 await send('/api/state');return {calls,logs,send,login:()=>send('/api/login',{username:'synthetic-parcel-user',password:'synthetic-parcel-password'}),run:(id,values)=>send('/api/execute',{operationId:id,values})};
}
test('HTTP execution requires login, same Origin and CSRF; extra identity/origin/query inputs never reach upstream',async t=>{
 const f=await fixture(t);assert.equal((await f.run(R,{kantorid:'main-office'})).status,401);await f.login();const before=f.calls.length;
 for(const [id,,values] of contracts){for(const key of ['nik','url','headers','Authorization','longitude','latitude'])assert.equal((await f.run(id,{...values,[key]:'forged'})).status,400);}
 for(const headers of [{Origin:'https://other.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await f.send('/api/execute',{operationId:R,values:{kantorid:'main-office'}},headers)).status,403);
 assert.equal(f.calls.length,before);
});
test('HTTP read handoff uses direct typed shapes and original returned PersilId for existing boundary query',async t=>{
 const f=await fixture(t,url=>url.pathname==='/legacy/Wilayah'?Response.json([{Kode:'different-region-code',WilayahId:' actual-WilayahId ',Nama:' Region '}]) : url.pathname==='/legacy/GetParcelBoundaryById'?Response.json({type:'FeatureCollection',features:[]}) : Response.json({error:true,PersilId:' synthetic-returned-id ',Luas:12}));await f.login();
 const regional=await f.run(R,{kantorid:' main-KantorId '});assert.equal(regional.status,200);assert.deepEqual(regional.result.result.data,[{Kode:'different-region-code',Nama:' Region ',TipeWilayah:null,WilayahId:' actual-WilayahId '}]);
 const analog=await f.run(A,{jenishak:'1',nomorhak:'00012',kantorid:' main-KantorId ',wilayahid:regional.result.result.data[0].WilayahId});assert.equal(analog.status,200);assert.deepEqual(analog.result.result.data,{...model,PersilId:' synthetic-returned-id ',Luas:12});assert.equal(f.calls.at(-1).url.searchParams.get('wilayahid'),' actual-WilayahId ');
 const boundary=OPERATIONS.find(op=>op.path==='legacy/GetParcelBoundaryById'&&op.enabled);assert.ok(boundary);assert.equal((await f.run(boundary.id,{persilid:analog.result.result.data.PersilId})).status,200);assert.equal(f.calls.at(-1).url.searchParams.get('persilid'),' synthetic-returned-id ');
 const electronic=await f.run(E,contracts[2][2]);assert.equal(electronic.status,200);assert.equal(electronic.result.result.data.PersilId,' synthetic-returned-id ');
 assert.deepEqual(f.calls.map(call=>call.url.pathname),['/auth/signin','/legacy/Wilayah','/legacy/GetPersilId','/legacy/GetParcelBoundaryById','/legacy/GetPersilIdByNibel']);
});
test('HTTP refresh precedes read and only main refreshed token is sent to lookup',async t=>{
 const f=await fixture(t,undefined,{expired:true});await f.login();assert.equal((await f.run(E,contracts[2][2])).status,200);assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/auth/refresh_token','/legacy/GetPersilIdByNibel']);assert.equal(f.calls.at(-1).init.headers.Authorization,'Bearer synthetic-parcel-refreshed');
});
test('HTTP result redacts secret echoes and excludes unknown fields while retaining int64 precision',async t=>{
 const f=await fixture(t,()=>new Response('{"PersilId":"synthetic-parcel-access + synthetic-parcel-refresh","Luas":9223372036854775807,"accessToken":"unknown-discarded"}',{headers:{'Content-Type':'application/json'}}));await f.login();const reply=await f.run(E,contracts[2][2]);assert.equal(reply.status,200);assert.equal(reply.result.result.data.PersilId,'[REDACTED] + [REDACTED]');assert.equal(reply.result.result.data.Luas,'9223372036854775807');assert.equal(Object.hasOwn(reply.result.result.data,'accessToken'),false);
 const logs=json(f.logs);for(const value of ['synthetic-parcel-access','synthetic-parcel-refresh',contracts[2][2].nibel])assert.equal(logs.includes(value),false);
});
for(const [id,path,values] of contracts)test(`${path} pending logout suppresses a late read and publishes no returned model`,async t=>{
 const started=deferred(),release=deferred();const f=await fixture(t,async()=>{started.resolve();await release.promise;return Response.json(path==='legacy/Wilayah'?[]:{PersilId:'late-private-model'});});await f.login();const pending=f.run(id,values);await started.promise;await f.send('/api/logout',{});release.resolve();const reply=await pending;assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
});
