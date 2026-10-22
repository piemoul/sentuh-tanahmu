// Independent review of root's registry/HTTP integration. This reviewer authored
// the separate guestbook client/models, not this registry/handler implementation.
// Only loopback HTTP and injected synthetic provider transports are used.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createServer} from '../../webapp/server.mjs';
import {SessionStore,COOKIE} from '../../webapp/private/session.mjs';
import {OPERATIONS,prepareOperation} from '../../webapp/private/operations.mjs';
import {OPERATIONS as prior} from '../../environment/guestbook/operations-before.mjs';
const root=new URL('../../',import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFile(new URL(path,root)),bind=async path=>({path,sha256:sha(await read(path))});
const files=['webapp/private/http-api.mjs','webapp/private/build-operations.py','webapp/private/operations-runtime.mjs','webapp/private/operations.mjs','webapp/private/guestbook-client.mjs','webapp/private/guestbook-response.mjs','webapp/private/https-transport.mjs','webapp/private/session.mjs','webapp/private/browser-origin.mjs','webapp/server.mjs','webapp/tests/guestbook-api.test.mjs','webapp/tests/catalog-integration.test.mjs','environment/guestbook/operations-before.json','environment/guestbook/operations-before.mjs','analysis/webapp/plot-read-baseline.json','analysis/recovered/guestbook-followup/flow.json','analysis/recovered/guestbook-service-followup/flow.json','analysis/webapp/guestbook-client-verification.json'];
const inputs=await Promise.all(files.map(bind)),checks=[];
const check=async(name,fn)=>{await fn();checks.push(name);};
const ID='get-bukutamu-d28bf4',POST='post-bukutamu-d99dd8';
const nativeModel={userId:'synthetic-qr-user',kantorId:'synthetic-office',unitKerjaId:'synthetic-unit',namaUnitKerja:'Synthetic Office'};
const response=(data=nativeModel,error=true,message=null)=>Response.json({error,message,data});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fixture(callback){
  const sessions=new SessionStore(),session=sessions.create(),mainCalls=[],guestCalls=[],logs=[];
  const oldTokens={tokenType:'Bearer',accessToken:'synthetic-account-old',refreshToken:'synthetic-refresh-old',expiredAt:1};
  session.user={username:'synthetic-account',email:'synthetic@example.invalid',nomorIndukKependudukan:'synthetic-own-NIK',roleUser:'PERORANGAN'};session.tokens={...oldTokens};
  let application='AtrBpn synthetic-application-old';
  const server=createServer({sessions,configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=>application},log:value=>logs.push(value),
    transport:async(url,init)=>{mainCalls.push({url,init});throw new Error('UNEXPECTED_SYNTHETIC_MAIN_CALL');},
    guestbookTransport:async(url,init)=>{guestCalls.push({url,init});return callback?callback(url,init):response();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port,cookie=`${COOKIE}=${session.id}`;
  let csrf;
  async function request(path,body,overrides={}){
    const post=body!==undefined,headers={Cookie:cookie,...(post?{Origin:base,'X-CSRF-Token':csrf,'Content-Type':'application/json'}:{}),...(overrides.headers??{})};
    for(const key of Object.keys(headers))if(headers[key]===null)delete headers[key];
    const result=await fetch(base+path,{method:post?'POST':'GET',headers,...(post?{body:JSON.stringify(body)}:{}),...(overrides.signal?{signal:overrides.signal}:{})});
    return{status:result.status,data:await result.json()};
  }
  csrf=(await request('/api/state')).data.csrfToken;
  return{session,sessions,mainCalls,guestCalls,logs,oldTokens,base,cookie,get csrf(){return csrf;},setApplication:value=>{application=value;},request,
    execute:(values={uid:'synthetic-kd',unid:'synthetic-id'},extra={},overrides={})=>request('/api/execute',{operationId:ID,values,...extra},overrides),
    close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})};
}
async function withFixture(callback,fn){const f=await fixture(callback);try{await fn(f);}finally{await f.close();}}

const baseline=JSON.parse(await read('analysis/webapp/plot-read-baseline.json'));
await check('old-container operations artifact matches frozen baseline and JSON export exactly',async()=>{
  const old=inputs.find(row=>row.path==='environment/guestbook/operations-before.mjs');assert.equal(old.sha256,baseline.runtime.find(row=>row.file==='webapp/private/operations.mjs').sha256);
  assert.deepEqual(JSON.parse(await read('environment/guestbook/operations-before.json')),prior);
});
await check('only one exact operation record changes;175 unrelated records including arrival POST are identical',()=>{
  assert.equal(OPERATIONS.length,176);assert.equal(prior.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,84);
  const diff=OPERATIONS.filter(op=>JSON.stringify(op)!==JSON.stringify(prior.find(old=>old.id===op.id))).map(op=>op.id);assert.deepEqual(diff,[ID]);
  const op=OPERATIONS.find(op=>op.id===ID);assert.equal(op.clientProfile,'guestbook-read');assert.equal(op.auth,'session');assert.equal(op.upstreamAuthentication,'application');assert.equal(op.effect,'read');assert.equal(op.requiresConfirmation,false);
  assert.equal(OPERATIONS.find(op=>op.id===POST).enabled,false);assert.throws(()=>prepareOperation(POST,{}, {authenticated:true,applicationConfigured:true}),{code:'OPERATION_INSPECT_ONLY'});
});
await check('registry rejects descriptors, aliases and all browser-injected query identity overrides',()=>{
  for(const value of [{uid:'x',unid:'y',userId:'forged'},{uid:'x',unid:'y',base:'https://example.invalid'}, {uid:1,unid:'y'},{uid:'x'},{uid:'x',unid:'y',[Symbol('extra')]:'z'}])assert.throws(()=>prepareOperation(ID,value,{authenticated:true}));
  const accessor={unid:'y'};let touched=0;Object.defineProperty(accessor,'uid',{enumerable:true,get(){touched++;return 'x';}});assert.throws(()=>prepareOperation(ID,accessor,{authenticated:true}));assert.equal(touched,0);
  assert.deepEqual(prepareOperation(ID,{unid:' raw-id +% ',uid:' raw-kd = '},{authenticated:true}).query,{uid:' raw-kd = ',unid:' raw-id +% '});
});
await check('actualHTTP expired local account needs no main request/refresh; query values do not become profile identifiers',()=>withFixture(null,async f=>{
  assert.equal(f.guestCalls.length,0);assert.equal(f.mainCalls.length,0);
  const values={uid:' qr-kd %2F+&= é😀 ',unid:' qr-id %2B=+ '},r=await f.execute(values,{base:'https://example.invalid',auth:'none',clientProfile:'main'});
  assert.equal(r.status,200);assert.deepEqual(r.data.result.data,{error:true,message:null,data:nativeModel});assert.equal(f.mainCalls.length,0);assert.equal(f.guestCalls.length,1);
  const {url,init}=f.guestCalls[0];assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/bukutamu');assert.deepEqual([...url.searchParams],[['uid',values.uid],['unid',values.unid]]);assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(new Headers(init.headers).get('Content-Type'),null);assert.equal(new Headers(init.headers).get('Authorization'),'AtrBpn synthetic-application-old');
  assert.equal((await f.request('/api/state')).data.authenticated,true);assert.deepEqual(f.logs,[]);
}));
await check('Origin and CSRF stay mandatory before the application-authorized metadata request',()=>withFixture(null,async f=>{
  for(const headers of [{Origin:null},{Origin:'https://evil.invalid'},{'X-CSRF-Token':null},{'X-CSRF-Token':'incorrect'},{'sec-fetch-site':'cross-site'}]){
    const r=await f.execute(undefined,{}, {headers});assert.equal(r.status,403);assert.ok(['CSRF_REJECTED','ORIGIN_REJECTED'].includes(r.data.error.code));
  }
  assert.equal(f.guestCalls.length,0);assert.equal(f.mainCalls.length,0);
}));
await check('actualHTTP query scope, files and arrival write cannot reach any provider',()=>withFixture(null,async f=>{
  for(const values of [{uid:'x'},{uid:'x',unid:1},{uid:'x',unid:'y',kantorId:'forged'}])assert.equal((await f.execute(values)).status,400);
  const write=await f.request('/api/execute',{operationId:POST,values:{kantorId:'forged'},confirm:true});assert.equal(write.status,422);assert.equal(write.data.error.code,'OPERATION_INSPECT_ONLY');
  const form=new FormData();form.set('operationId',ID);form.set('values',JSON.stringify({uid:'x',unid:'y'}));form.set('document',new Blob(['synthetic']),'fixture.txt');
  const uploaded=await fetch(f.base+'/api/execute',{method:'POST',headers:{Cookie:f.cookie,Origin:f.base,'X-CSRF-Token':f.csrf},body:form});assert.equal(uploaded.status,400);assert.equal((await uploaded.json()).error.code,'GUESTBOOK_READ_SCOPE');assert.equal(f.guestCalls.length,0);assert.equal(f.mainCalls.length,0);
}));
await check('server response redaction spans old/current application and account generations without refreshing',async()=>{
  const entered=deferred(),held=deferred();await withFixture(async()=>{entered.resolve();await held.promise;return response({...nativeModel,namaUnitKerja:'synthetic-application-old synthetic-application-new synthetic-account-old synthetic-account-new synthetic-refresh-old synthetic-refresh-new'},true,'AtrBpn synthetic-application-old');},async f=>{
    const pending=f.execute();await entered.promise;f.setApplication('AtrBpn synthetic-application-new');f.session.tokens={...f.session.tokens,accessToken:'synthetic-account-new',refreshToken:'synthetic-refresh-new'};held.resolve();
    const r=await pending;assert.equal(r.status,200);assert.equal(r.data.result.data.data.userId,nativeModel.userId);assert.doesNotMatch(JSON.stringify(r.data),/synthetic-(?:application|account|refresh)-(?:old|new)/);assert.match(r.data.result.data.data.namaUnitKerja,/REDACTED/);assert.equal(f.mainCalls.length,0);
  });
});
await check('replacing the session user during a read rejects late metadata even when token object remains',async()=>{
  const entered=deferred(),held=deferred();await withFixture(async()=>{entered.resolve();await held.promise;return response();},async f=>{
    const pending=f.execute();await entered.promise;f.session.user={...f.session.user,username:'synthetic-other-user'};held.resolve();const r=await pending;
    assert.equal(r.status,401);assert.equal(r.data.error.code,'SESSION_EXPIRED');assert.doesNotMatch(JSON.stringify(r.data),/synthetic-qr-user|synthetic-office|synthetic-unit/);
  });
});
await check('client disconnect aborts only its provider read and cancels the late body',async()=>{
  const entered=deferred(),held=deferred();let providerSignal,cancelled=0;
  await withFixture(async(_url,init)=>{providerSignal=init.signal;entered.resolve();return held.promise;},async f=>{
    const abort=new AbortController(),pending=f.execute(undefined,{}, {signal:abort.signal});await entered.promise;abort.abort();await assert.rejects(pending);
    for(let i=0;i<40&&!providerSignal.aborted;i++)await delay(5);assert.equal(providerSignal.aborted,true);
    held.resolve(new Response(new ReadableStream({cancel(){cancelled++;}}),{headers:{'content-type':'application/json'}}));
    for(let i=0;i<40&&!cancelled;i++)await delay(5);assert.equal(cancelled,1);assert.equal(f.mainCalls.length,0);assert.equal(f.guestCalls.length,1);
    assert.equal((await f.request('/api/state')).data.authenticated,true);
  });
});
await check('null/malformed metadata and provider errors remain read failures without logging identifiers or clearing account',async()=>{
  let mode='null';await withFixture(()=>mode==='null'?response(null):mode==='malformed'?response({userId:3}):Promise.reject(new Error('synthetic-secret-provider-message')),async f=>{
    const r=await f.execute();assert.equal(r.status,200);assert.equal(r.data.result.data.data,null);
    mode='malformed';const malformed=await f.execute();assert.equal(malformed.status,502);assert.equal(malformed.data.error.code,'GUESTBOOK_RESPONSE_UNRECOGNIZED');
    mode='provider';const failed=await f.execute();assert.equal(failed.status,502);assert.equal(failed.data.error.code,'GUESTBOOK_NETWORK_ERROR');assert.doesNotMatch(JSON.stringify(failed.data),/synthetic-secret-provider-message/);
    assert.equal((await f.request('/api/state')).data.authenticated,true);assert.equal(f.mainCalls.length,0);assert.deepEqual(f.logs,[]);
  });
});

// Root's focused checks are rerun once after its resolved catalog call-count fix.
const result=spawnSync(process.execPath,['--test','--test-reporter=tap','webapp/tests/guestbook-api.test.mjs','webapp/tests/catalog-integration.test.mjs'],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
assert.equal(result.status,0,result.stderr+'\n'+result.stdout);assert.match(result.stdout,/# tests 9\n/);assert.match(result.stdout,/# pass 9\n/);assert.match(result.stdout,/# fail 0\n/);
for(const row of inputs)assert.deepEqual(await bind(row.path),row,'Owned integration source changed during review');
const tapPath='analysis/webapp/guestbook-integration-review-tests.tap',reportPath='analysis/webapp/guestbook-integration-review.json';
for(const path of [tapPath,reportPath]){try{await read(path);throw new Error('Frozen output exists; create a successor review.');}catch(error){if(error.code!=='ENOENT')throw error;}}
await writeFile(new URL(tapPath,root),result.stdout);
const report={schema_version:1,status:'PASS',review_kind:'independent integration review; reviewer authored native boundary audit and separate guestbook client/model, not reviewed root handler/registry/test changes',inputs,writer:await bind('analysis/rea/review_guestbook_integration.mjs'),sourceDependenciesIntentionallyUnpinned:['webapp/private/api-client.mjs','webapp/private/plot-response.mjs: root/other worker changing; final full-input/fullsuite owned by root'],comparison:{baseline:inputs.find(row=>row.path==='analysis/webapp/plot-read-baseline.json'),oldContainerBytes:inputs.find(row=>row.path==='environment/guestbook/operations-before.mjs'),oldJson:inputs.find(row=>row.path==='environment/guestbook/operations-before.json'),baselineHashMatches:true,oldJsonMatchesOldModule:true,operations:176,enabled:84,exactChangedIds:[ID],unrelatedRecordsIdentical:175,arrivalPostEnabled:false},independentChecks:checks,focusedRootTests:{tests:9,apiTests:8,catalogTests:1,pass:9,fail:0,tap:await bind(tapPath)},resolvedFindings:[{kind:'test expectation',file:'webapp/tests/catalog-integration.test.mjs',line:125,firstObservation:{expectedCalls:87,actualCalls:88,pass:8,fail:1},resolution:'Root corrected count to88 for84 enabled operations plus mock login/two preparation calls/server-owned Scan profile read; independent rerun passed.'}],materialFindings:[],newActions:{productionRequests:0,externalNetworkRequests:0,realAccountOrQrValuesRead:false,credentialsDerivedOrExported:false,configurationExecuted:false,realCameraOrLocationActions:0,guestbookSubmissions:0,runtimeEdits:0,loopbackHttpUsed:true,providerTransports:'synthetic only'},limits:['Native full TLS/SDK/QR authenticity and current official server acceptance remain unproved.','Local account eligibility is separate from application authorization; expired local token does not trigger upstream main refresh for this read.','This review covers metadata only; arrival POST and whole-menu parity remain incomplete.','API-client/PlotBidang source was deliberately not frozen during concurrent work; root must bind final versions and fullsuite.'],goalComplete:false};
await writeFile(new URL(reportPath,root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',independentChecks:checks.length,rootTests:9,unrelatedRecordsIdentical:175,materialFindings:0,reportSha256:sha(await read(reportPath))}));
