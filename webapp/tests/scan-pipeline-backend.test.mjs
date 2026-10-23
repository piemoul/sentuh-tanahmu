import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {decodeScanDocumentMetadata} from '../private/scan-response.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';

// Real private handler/registry/client, loopback browser requests, injected
// synthetic upstream transport only. No provider or real account is contacted.
const CLASSIFY='post-apis-scandocument-d42440',PDF='post-apis-getdocument-d41ee8',META='post-apis-getdocumenttype-d417d4',GEO='get-apis-getgeojsoninfo-d39f1c';
const token={tokenType:'Bearer',accessToken:'synthetic-scan-access',refreshToken:'synthetic-scan-refresh',expiredAt:4_000_000_000};
const configuration={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-scan-application',reason:'synthetic only'};
const profile=()=>({error:false,data:{nama:' Captured Scan Name ',email:'fallback@example.invalid',statusVerifikasi:-1}});
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return{promise,resolve};};
const nativeTuple={message:'Other',data:'synthetic-classification'};
const current=()=>({active:true,user:{username:'synthetic'},tokens:{...token}});
const direct=(path='apis/scanDocument',session=current())=>({path,method:'POST',encoding:'form',auth:'session',body:path.endsWith('scanDocument')?{q:' raw +%: / ',name:''}:{q:' raw +%: / '},session});
const defaultUpstream=(url)=>{
 if(url.pathname==='/account/account_summary')return Response.json(profile());
 if(url.pathname==='/apis/scanDocument')return Response.json({error:true,...nativeTuple});
 if(url.pathname==='/apis/GetDocument')return new Response('%PDF-synthetic-scan'.padEnd(256,' '),{headers:{'Content-Type':'application/octet-stream'}});
 if(url.pathname==='/apis/GetDocumentType')return Response.json({error:true,data:{showRoute:1,type:'KKPR'}});
 if(url.pathname==='/apis/getGeoJsonInfo')return Response.json({geometri:null});
 if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'synthetic-refreshed-access'}});
 throw new Error('Unexpected synthetic route');
};
async function fixture(t,responder=defaultUpstream,{now}={}){
 const calls=[],logs=[],sessions=new SessionStore();
 const server=createServer({configuration,sessions,...(now?{now}:{}),log:item=>logs.push(item),transport:async(url,init)=>{
  calls.push({url:new URL(url),...init});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-login-alias',email:'WRONG-LOGIN-EMAIL',token:{...token}}});
  return responder(url,init);
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
 async function send(path,body,headers={}){
  const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
  const result=await response.json();if(result.csrfToken)state=result;
  return{status:response.status,result};
 }
 await send('/api/state');
 const login=()=>send('/api/login',{username:'synthetic',password:'synthetic-password'});
 const execute=(operationId,values={q:' raw +%: / '},extra={})=>send('/api/execute',{operationId,values,...(operationId===CLASSIFY?{confirm:true}:{}),...extra});
 await login();
 return{calls,logs,sessions,send,login,execute,session:()=>[...sessions.sessions.values()].find(item=>item.user)};
}

test('classifier enables one existing shape with explicit confirmation and server-profile name source',()=>{
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,95);
 const op=OPERATIONS.find(op=>op.id===CLASSIFY);
 assert.equal(op.enabled,true);assert.equal(op.effect,'write');assert.equal(op.requiresConfirmation,true);assert.equal(op.serverEffects,'unknown');
 assert.equal(op.evidence.nativeProofSha256,'bfa3cdc5257b0ca57b3d9ee881a2cac4c9ecd243cf81c1493e9885fe4c823ab4');
 assert.deepEqual(op.fields.map(field=>[field.path,field.source]),[['q','input'],['name','server-profile']]);
 for(const q of ['', ' ', ' raw+%:/?é😀 '])assert.deepEqual(prepareOperation(CLASSIFY,{q},{authenticated:true}).body,{q});
 for(const name of ['', 'synthetic',null])assert.throws(()=>prepareOperation(CLASSIFY,{q:'q',name},{authenticated:true}),{code:'SCAN_PROFILE_OVERRIDE'});
 for(const q of [null,undefined,1,true,[],{}])assert.throws(()=>prepareOperation(CLASSIFY,{q},{authenticated:true}),{code:'FIELD_REQUIRED'});
 assert.throws(()=>prepareOperation(CLASSIFY,{q:''}),{code:'LOGIN_REQUIRED'});
});

test('empty downstream q is allowed only with trusted context while unrelated contracts retain their guards',()=>{
 for(const id of [PDF,META,GEO]){
  assert.throws(()=>prepareOperation(id,{q:''},{authenticated:true}),{code:'FIELD_REQUIRED'});
  const p=prepareOperation(id,{q:''},{authenticated:true,scanContext:{q:'',name:' captured '}});
  assert.deepEqual(id===GEO?p.query:p.body,id===PDF?{q:'',name:' captured '}:{q:''});
  assert.throws(()=>prepareOperation(id,{q:'mismatch'},{authenticated:true,scanContext:{q:'',name:' captured '}}),{code:'SCAN_CONTEXT_INVALID'});
 }
 assert.throws(()=>prepareOperation(PDF,{q:'',name:' forged '},{authenticated:true,scanContext:{q:'',name:' captured '}}),{code:'SCAN_PROFILE_OVERRIDE'});
 assert.equal(prepareOperation(PDF,{q:'ordinary',name:''},{authenticated:true}).body.name,'');
});

for(const encoded of [false,true])test(`classifier transport accepts typed200 error:true and ${encoded?'one transformed String':'Map'}`,async()=>{
 const body={error:true,message:'GetParcelBoundaryById',data:' raw:persil / + '};let wire;
 const client=new ApiClient(configuration,{log(){},transport:async(url,init)=>{wire={url,init};return Response.json(encoded?JSON.stringify(body):body);}});
 const result=await client.request(direct());assert.deepEqual(result.data,{message:body.message,data:body.data});
 assert.equal(result.status,200);assert.equal(wire.init.headers.Authorization,'Bearer synthetic-scan-access');
 assert.equal(wire.init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.deepEqual([...wire.init.body],[['q',' raw +%: / '],['name','']]);
});

test('classifier and metadata reject out-of-scope requests before any transport',async()=>{
 let calls=0;const client=new ApiClient(configuration,{log(){},transport:async()=>{calls++;return Response.json({});}});
 for(const path of ['apis/scanDocument','apis/GetDocumentType']){
  const base=direct(path),code=path.endsWith('scanDocument')?'SCAN_CLASSIFICATION_SCOPE':'SCAN_METADATA_SCOPE';
  for(const patch of [{method:'GET'},{encoding:'json'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{path:'/'+path},{path:path+'?extra=1'},{query:{extra:''}},{body:null},{body:{q:3}},{body:{...base.body,extra:''}},{files:[{key:'file',file:new Blob(['synthetic'])}]}])await assert.rejects(client.request({...base,...patch}),{code});
 }
 assert.equal(calls,0);
});

test('metadata accepts error:true/null with integer showRoute, null-only defaults and no String decode',async()=>{
 for(const error of [true,false,null])assert.deepEqual(decodeScanDocumentMetadata({error,data:{showRoute:1,type:null}}),{error:error??true,data:{showRoute:1,type:''}});
 for(const body of [null,{},'{}',{data:{showRoute:null}},{data:{showRoute:'1'}},{data:{showRoute:1.5}},{error:'false',data:{showRoute:1}},{data:{showRoute:1,type:2}}])assert.throws(()=>decodeScanDocumentMetadata(body),{code:'SCAN_METADATA_UNRECOGNIZED'});
 const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error:true,data:{showRoute:1,type:'KKPR'},privateExtra:'not retained'})});
 assert.deepEqual((await client.request(direct('apis/GetDocumentType'))).data,{error:true,data:{showRoute:1,type:'KKPR'}});
 const other=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error:true,data:{showRoute:1,type:'KKPR'}})});
 await assert.rejects(other.request({...direct(),path:'apis/GetParcelBoundaryById',body:{q:'ordinary'}}),{code:'UPSTREAM_REJECTED'});
});

for(const status of [201,403,503])test(`classifier/metadata HTTP${status} remain failures, not successful native tuples`,async()=>{
 for(const path of ['apis/scanDocument','apis/GetDocumentType']){
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error:false,...nativeTuple,data:{showRoute:1,type:'KKPR'}},{status})});
  await assert.rejects(client.request(direct(path)),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status);
 }
});

test('HTTP handler checks login, CSRF, confirmation and browser name override before summary/classifier transport',async t=>{
 const f=await fixture(t),before=f.calls.length;
 for(const [body,code] of [[{operationId:CLASSIFY,values:{q:'q'}},'CONFIRMATION_REQUIRED'],[{operationId:CLASSIFY,values:{q:'q',name:'forged'},confirm:true},'SCAN_PROFILE_OVERRIDE'],[{operationId:CLASSIFY,values:{q:'q',profile:{nama:'forged'}},confirm:true},'UNKNOWN_FIELD']]){
  const reply=await f.send('/api/execute',body);assert.equal(reply.result.error.code,code);assert.equal(f.calls.length,before);
 }
 const csrf=await f.send('/api/execute',{operationId:CLASSIFY,values:{q:'q'},confirm:true},{'X-CSRF-Token':'wrong'});assert.equal(csrf.status,403);assert.equal(f.calls.length,before);
 await f.send('/api/logout',{});const loggedOut=await f.execute(CLASSIFY);assert.equal(loggedOut.result.error.code,'LOGIN_REQUIRED');assert.equal(f.calls.length,before);
});

for(const [source,expected] of [[{nama:' Name ',email:'wrong'},' Name '],[{nama:'',email:'wrong'},''],[{nama:'  ',email:'wrong'},'  '],[{nama:null,email:' mail '},' mail '],[{nama:null,email:null},'-']])test(`server Scan profile selection preserves ${JSON.stringify(expected)}`,async t=>{
 const f=await fixture(t,(url,init)=>url.pathname==='/account/account_summary'?Response.json({error:false,data:source}):defaultUpstream(url,init));
 const reply=await f.execute(CLASSIFY,{q:' raw +%: / '});assert.equal(reply.status,200);assert.deepEqual(reply.result.result.data,nativeTuple);assert.match(reply.result.result.scanContextId,/^[A-Za-z0-9_-]{32}$/);
 const calls=f.calls.slice(1);assert.deepEqual(calls.map(call=>call.url.pathname),['/account/account_summary','/apis/scanDocument']);
 assert.deepEqual([...calls[0].body],[['appVersion','6.1.5']]);assert.deepEqual([...calls[1].body],[['q',' raw +%: / '],['name',expected]]);
 assert.equal(Object.hasOwn(reply.result.result,'name'),false);
});

test('one captured name survives profile changes and is shared by PDF/metadata/geo with the exact raw q',async t=>{
 let captured=profile();const f=await fixture(t,(url,init)=>url.pathname==='/account/account_summary'?Response.json(captured):defaultUpstream(url,init));
 const q=' raw+%: /é😀 ',classified=await f.execute(CLASSIFY,{q}),scanContextId=classified.result.result.scanContextId;
 captured={error:false,data:{nama:'CHANGED-PROFILE'}};
 const pdf=await f.execute(PDF,{q},{scanContextId});assert.equal(pdf.status,200);assert.equal(pdf.result.result.contentType,'application/pdf');assert.match(pdf.result.result.previewUrl,/^\/api\/preview\//);
 const meta=await f.execute(META,{q},{scanContextId});assert.deepEqual(meta.result.result.data,{error:true,data:{showRoute:1,type:'KKPR'}});
 const geo=await f.execute(GEO,{q},{scanContextId});assert.equal(geo.status,200);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/account/account_summary').length,1);
 const wire=f.calls.find(call=>call.url.pathname==='/apis/GetDocument');assert.deepEqual([...wire.body],[['q',q],['name',' Captured Scan Name ']]);
 assert.equal(f.calls.find(call=>call.url.pathname==='/apis/getGeoJsonInfo').url.search,'?q=%2520raw%252B%2525%253A%2520%252F%25C3%25A9%25F0%259F%2598%2580%2520');
});

test('raw empty Scan q reaches classifier, PDF, metadata and geo only through its validated opaque context',async t=>{
 const f=await fixture(t),reply=await f.execute(CLASSIFY,{q:''}),scanContextId=reply.result.result.scanContextId;
 for(const id of [PDF,META,GEO])assert.equal((await f.execute(id,{q:''},{scanContextId})).status,200);
 assert.deepEqual([...f.calls.find(call=>call.url.pathname==='/apis/scanDocument').body],[['q',''],['name',' Captured Scan Name ']]);
 assert.equal(f.calls.find(call=>call.url.pathname==='/apis/getGeoJsonInfo').url.search,'?q=');
 for(const id of [PDF,META,GEO])assert.equal((await f.execute(id,{q:''})).result.error.code,'FIELD_REQUIRED');
});

for(const mode of ['503','201','redirect','malformed','bad-data','network'])test(`ordinary classifier ${mode} yields native fallback with truthful status and usable captured context`,async t=>{
 const f=await fixture(t,(url,init)=>{
  if(url.pathname!=='/apis/scanDocument')return defaultUpstream(url,init);
  if(mode==='network')throw Object.assign(new Error('SYNTHETIC private body must not leak'),{code:'ECONNRESET'});
  if(mode==='redirect')return new Response(null,{status:302,headers:{Location:'https://unrelated.invalid/'}});
  if(mode==='malformed')return new Response('{',{headers:{'Content-Type':'application/json'}});
  if(mode==='bad-data')return Response.json({error:false,message:'Other',data:{bad:true}});
  return Response.json({error:false,...nativeTuple},{status:Number(mode)});
 });
 const q='original',reply=await f.execute(CLASSIFY,{q}),result=reply.result.result;
 assert.equal(reply.status,200);assert.deepEqual(result.data,{message:'error',data:'1009'});assert.equal(result.nativeFallback,true);
 assert.equal(result.status,mode==='network'?null:mode==='redirect'?302:['malformed','bad-data'].includes(mode)?200:Number(mode));
 assert.equal((await f.execute(PDF,{q},{scanContextId:result.scanContextId})).status,200);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/scanDocument').length,1);
 assert.doesNotMatch(JSON.stringify(result)+JSON.stringify(f.logs),/SYNTHETIC private body|synthetic-scan-access|Captured Scan Name/);
});

for(const invalid of [null,{nama:7},{nama:'plausible',statusVerifikasi:'0'}])test(`invalid profile ${JSON.stringify(invalid)} stops without classifier request/context`,async t=>{
 const f=await fixture(t,(url,init)=>url.pathname==='/account/account_summary'?Response.json({error:false,data:invalid}):defaultUpstream(url,init));
 const reply=await f.execute(CLASSIFY);assert.equal(reply.status,502);assert.equal(reply.result.error.code,'SCAN_PROFILE_UNRECOGNIZED');assert.equal(reply.result.result,undefined);
 assert.equal(f.calls.some(call=>call.url.pathname==='/apis/scanDocument'),false);
});

test('opaque context rejects wrong q, forged/missing name, unsupported operation and another session without transport',async t=>{
 const a=await fixture(t),b=await fixture(t),q='owned',reply=await a.execute(CLASSIFY,{q}),scanContextId=reply.result.result.scanContextId,before=a.calls.length;
 for(const [id,values,extra,code] of [[PDF,{q:'wrong'},{scanContextId},'SCAN_CONTEXT_INVALID'],[PDF,{q,name:''},{scanContextId},'SCAN_PROFILE_OVERRIDE'],[META,{q},{scanContextId:'forged'},'SCAN_CONTEXT_INVALID'],[CLASSIFY,{q},{scanContextId},'SCAN_CONTEXT_SCOPE']])assert.equal((await a.execute(id,values,extra)).result.error.code,code);
 assert.equal(a.calls.length,before);const beforeB=b.calls.length;assert.equal((await b.execute(PDF,{q},{scanContextId})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(b.calls.length,beforeB);
});

test('context reuse is manual, bounded to five attempts and expires at120seconds',async t=>{
 let clock=1_800_000_000_000;const f=await fixture(t,defaultUpstream,{now:()=>clock}),ids=[];
 for(let index=0;index<6;index++)ids.push((await f.execute(CLASSIFY,{q:'same'})).result.result.scanContextId);
 assert.equal((await f.execute(PDF,{q:'same'},{scanContextId:ids[0]})).result.error.code,'SCAN_CONTEXT_INVALID');
 for(let count=0;count<2;count++)assert.equal((await f.execute(PDF,{q:'same'},{scanContextId:ids[5]})).status,200);
 const before=f.calls.length;clock+=120_000;assert.equal((await f.execute(META,{q:'same'},{scanContextId:ids[5]})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(f.calls.length,before);
});

test('logout/new login invalidate prior context; same-account token refresh retains captured name for intentional document use',async t=>{
 const f=await fixture(t),q='owned',context=(await f.execute(CLASSIFY,{q})).result.result.scanContextId;
 f.session().tokens={...token,expiredAt:0};assert.equal((await f.execute(PDF,{q},{scanContextId:context})).status,200);
 const document=f.calls.find(call=>call.url.pathname==='/apis/GetDocument');assert.equal(document.headers.Authorization,'Bearer synthetic-refreshed-access');assert.equal(document.body.get('name'),' Captured Scan Name ');
 await f.send('/api/logout',{});await f.login();const before=f.calls.length;assert.equal((await f.execute(PDF,{q},{scanContextId:context})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(f.calls.length,before);
});

for(const phase of ['profile','classifier'])test(`logout during pending ${phase} cannot publish context or start a later request`,async t=>{
 const start=deferred(),release=deferred();const held=phase==='profile'?'/account/account_summary':'/apis/scanDocument';
 const f=await fixture(t,async(url,init)=>{if(url.pathname===held){start.resolve();await release.promise;}return defaultUpstream(url,init);});
 const pending=f.execute(CLASSIFY);await start.promise;await f.send('/api/logout',{});release.resolve();const reply=await pending;
 assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/scanDocument').length,phase==='profile'?0:1);
});

test('delayed classifier401 after concurrent refresh preserves newer session and issues no context or automatic retry',async t=>{
 const start=deferred(),release=deferred();let attempts=0;
 const f=await fixture(t,async(url,init)=>{if(url.pathname==='/apis/scanDocument'&&++attempts===1){start.resolve();await release.promise;return Response.json({}, {status:401});}return defaultUpstream(url,init);});
 const pending=f.execute(CLASSIFY);await start.promise;const session=f.session(),newer={...token,accessToken:'synthetic-concurrent-new'};session.tokens=newer;release.resolve();const reply=await pending;
 assert.equal(reply.status,409);assert.equal(reply.result.error.code,'SESSION_CHANGED');assert.equal(reply.result.result,undefined);assert.equal(attempts,1);assert.equal(session.tokens,newer);assert.equal(session.active,true);
 assert.equal((await f.send('/api/state')).result.authenticated,true);
 const retry=await f.execute(CLASSIFY);assert.equal(retry.status,200);assert.match(retry.result.result.scanContextId,/^[A-Za-z0-9_-]{32}$/);assert.equal(attempts,2);assert.equal(f.calls.at(-1).headers.Authorization,'Bearer synthetic-concurrent-new');
});

test('genuine classifier401 expires the old session and never produces fallback/context',async t=>{
 const f=await fixture(t,(url,init)=>url.pathname==='/apis/scanDocument'?Response.json({}, {status:401}):defaultUpstream(url,init));
 const reply=await f.execute(CLASSIFY);assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);assert.equal((await f.send('/api/state')).result.authenticated,false);
});

test('classification response delayed by concurrent refresh redacts both token generations',async t=>{
 const start=deferred(),release=deferred();
 const f=await fixture(t,async(url,init)=>{if(url.pathname==='/apis/scanDocument'){start.resolve();await release.promise;return Response.json({error:false,message:'Other',data:'synthetic-scan-access synthetic-concurrent-secret'});}return defaultUpstream(url,init);});
 const pending=f.execute(CLASSIFY);await start.promise;f.session().tokens={...token,accessToken:'synthetic-concurrent-secret'};release.resolve();const reply=await pending;
 assert.equal(reply.status,200);assert.equal(reply.result.result.data.data,'[REDACTED] [REDACTED]');assert.doesNotMatch(JSON.stringify(reply.result)+JSON.stringify(f.logs),/synthetic-scan-access|synthetic-concurrent-secret/);
});

test('profile wait crossing token expiry refreshes before the classifier without changing captured name',async t=>{
 let clock=1_800_000_000_000;const f=await fixture(t,(url,init)=>{if(url.pathname==='/account/account_summary'){clock+=25_000;return Response.json(profile());}return defaultUpstream(url,init);},{now:()=>clock});
 f.session().tokens={...token,expiredAt:clock+30_000};const reply=await f.execute(CLASSIFY);assert.equal(reply.status,200);
 assert.deepEqual(f.calls.slice(1).map(call=>call.url.pathname),['/account/account_summary','/auth/refresh_token','/apis/scanDocument']);
 assert.equal(f.calls.at(-1).headers.Authorization,'Bearer synthetic-refreshed-access');assert.equal(f.calls.at(-1).body.get('name'),' Captured Scan Name ');
});
