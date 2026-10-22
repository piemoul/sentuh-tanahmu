// Independent bounded review. Synthetic transports/local HTTP only; no upstream
// connection, credential inspection, runtime edit, deployment or old writer.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {decodeParcelLookupJson as parcel,decodeParcelRegionsJson as regions} from '../../webapp/private/parcel-search-response.mjs';
import {ApiClient} from '../../webapp/private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../../webapp/private/operations.mjs';
import {SessionStore} from '../../webapp/private/session.mjs';
import {createServer} from '../../webapp/server.mjs';
const target='analysis/webapp/parcel-search-backend-review.json';
assert.equal(existsSync(target),false,'Preserve review receipt');
const read=file=>readFileSync(file),sha=file=>createHash('sha256').update(read(file)).digest('hex'),pin=file=>({file,sha256:sha(file)}),json=file=>JSON.parse(read(file));
const baselineFile='analysis/webapp/parcel-search-baseline.json',baseline=json(baselineFile),authorFile='analysis/webapp/parcel-search-backend-verification.json',author=json(authorFile);
assert.equal(sha(baselineFile),'0fcfe2326e06ffc4b0be4dcdd07e1ecc77e63aee2453bb0755e31f1513c5d66c');
assert.equal(author.status,'PASS');
const files=['webapp/private/parcel-search-response.mjs','webapp/private/build-operations.py','webapp/private/operations-runtime.mjs','webapp/private/operations.mjs','webapp/private/api-client.mjs','webapp/private/http-api.mjs','webapp/private/session.mjs','webapp/server.mjs','webapp/tests/parcel-search-backend.test.mjs','Dockerfile','analysis/rea/review_parcel_search_backend.mjs'];
const inputs=files.map(pin),scope=new Set(files);
for(const row of author.inputFiles.filter(row=>scope.has(row.file)))assert.equal(sha(row.file),row.sha256,row.file);
const nativeFiles=['analysis/recovered/parcel-search-followup/flow.json','analysis/recovered/parcel-search-input-followup/flow.json','analysis/recovered/parcel-search-input-followup/verification.json'];
const native=nativeFiles.map(pin);assert.equal(native[0].sha256,'c110b2f22ecb811f063156ccc47e5708f31286d1ad0e4bab8492a6309077d2d7');assert.equal(native[1].sha256,'7ae1307678dbce9ea051cd1c4c7acc20f9615007cf0c307f179074c999b06b61');
const R='get-legacy-wilayah-d752bc',A='get-legacy-getpersilid-d74e4c',E='get-legacy-getpersilidbynibel-d74b90';
const cases=[[R,'legacy/Wilayah',{kantorid:' main &+%é '},['kantorid','nama']],[A,'legacy/GetPersilId',{jenishak:'1',nomorhak:' 00+&/%é ',kantorid:' office ',wilayahid:' wilayah-id '},['jenishak','nomorhak','kantorid','wilayahid']],[E,'legacy/GetPersilIdByNibel',{nibel:' 12.34 56789012345 '},['nibel','kodehat']]];
const model={Alamat:null,BatasPersil:null,BatasPersilLegal:null,Luas:null,NamaWilayah:null,NomorIndukBidang:null,PersilId:null,TipeWilayah:null};
const token={tokenType:'Bearer',accessToken:'synthetic-independent-access',refreshToken:'synthetic-independent-refresh',expiredAt:4_000_000_000};
const config={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-independent-application',reason:'synthetic only'};
const session=()=>({active:true,user:{username:'synthetic-independent-user'},tokens:{...token}});
const probes=[];async function probe(name,fn){await fn();probes.push({name,status:'PASS'});}
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};

await probe('Registry diff is exactly three existing main read records; remaining173 unchanged',()=>{
 const before=json('environment/parcel-search/operations-before.json');assert.equal(before.length,176);assert.equal(OPERATIONS.length,176);
 assert.deepEqual(OPERATIONS.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(before[i])).map(row=>row.id).sort(),[R,A,E].sort());
 for(const [id,path,values,keys]of cases){const op=OPERATIONS.find(row=>row.id===id),p=prepareOperation(id,values,{authenticated:true});assert.equal(op.path,path);assert.equal(op.auth,'session');assert.equal(op.effect,'read');assert.equal(op.method,'GET');assert.equal(op.requiresConfirmation,false);assert.equal(p.serviceId,'main');assert.deepEqual(Object.keys(p.query),keys);assert.deepEqual(p.body,{});}
 assert.equal(OPERATIONS.find(row=>row.id==='post-geotag-uploadgeotag-d96b98').enabled,false);
});
await probe('Null-specialized fields reject every nonnull JSON kind and accept missing/null',()=>{
 for(const key of ['Alamat','NamaWilayah','NomorIndukBidang','TipeWilayah']){assert.deepEqual(parcel(JSON.stringify({[key]:null})),model);for(const value of ['',0,1.0,false,[],{}])assert.throws(()=>parcel(JSON.stringify({[key]:value})));}
 assert.deepEqual(parcel('{}'),model);
});
await probe('Every int field preserves signed64 endpoints and rejects float lexemes/overflow',()=>{
 for(const key of ['BatasPersil','BatasPersilLegal','Luas']){
  for(const value of ['9223372036854775807','-9223372036854775808','9007199254740992','-9007199254740992'])assert.equal(parcel(`{"${key}":${value}}`)[key],value);
  for(const value of ['9223372036854775808','-9223372036854775809','1.0','0e0','1e0','1e999','"12"','true'])assert.throws(()=>parcel(`{"${key}":${value}}`));
 }
});
await probe('Direct parser ignores envelope/unknown/poison keys, retains exact returned ID, uses no geometry alias',()=>{
 assert.deepEqual(parcel('{"error":true,"data":{"PersilId":"nested"},"__proto__":{"polluted":true},"unknown":1e999,"PersilId":" raw-id ","Luas":2}'),{...model,PersilId:' raw-id ',Luas:2});
 assert.deepEqual(parcel('{"persilId":"alias","coordinates":[1,2]}'),model);assert.equal({}.polluted,undefined);
 for(const text of ['null','[]','"{}"'])assert.throws(()=>parcel(text));
});
await probe('Region list keeps raw nullable Strings and fails whole malformed list',()=>{
 assert.deepEqual(regions('[{"Kode":"not-choice","Nama":" raw ","WilayahId":" actual-choice ","extra":1e999},{}]'),[{Kode:'not-choice',Nama:' raw ',TipeWilayah:null,WilayahId:' actual-choice '},{Kode:null,Nama:null,TipeWilayah:null,WilayahId:null}]);
 for(const text of ['{"data":[]}','[{},null]','[{"WilayahId":4}]'])assert.throws(()=>regions(text));
});
await probe('Preparation keeps stored NIBEL, HGU/HPL empty region and raw empty number; rejects unowned fields',()=>{
 const e=prepareOperation(E,cases[2][2],{authenticated:true});assert.equal(e.query.nibel,cases[2][2].nibel);assert.equal(e.query.kodehat,'');
 for(const right of ['2','5'])assert.equal(prepareOperation(A,{jenishak:right,nomorhak:'',kantorid:'office',wilayahid:''},{authenticated:true}).query.wilayahid,'');
 assert.throws(()=>prepareOperation(A,{jenishak:'1',nomorhak:'',kantorid:'office',wilayahid:''},{authenticated:true}));
 for(const [id,,values]of cases)for(const key of ['Authorization','latitude','baseUrl','headers','nik'])assert.throws(()=>prepareOperation(id,{...values,[key]:'forged'},{authenticated:true}));
});
await probe('Actual client fixes three GET paths/main session, escapes components once, preserves raw Strings',async()=>{
 for(const [id,path,values]of cases){const p=prepareOperation(id,values,{authenticated:true});let count=0;
  const client=new ApiClient(config,{log(){},transport:async(url,init)=>{count++;assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/'+path);assert.deepEqual([...url.searchParams],Object.entries(p.query));assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.headers.Authorization,'Bearer synthetic-independent-access');return Response.json(id===R?[]:{PersilId:' exact-returned-id '});}});
  assert.equal((await client.request({...p,base:p.service.baseUrl,session:session()})).status,200);assert.equal(count,1);
 }
});
await probe('Lookup accepts only200; region accepts shared2xx; error bodies do not become models',async()=>{
 for(const [id,,values]of cases){const p=prepareOperation(id,values,{authenticated:true});const client=new ApiClient(config,{log(){},transport:async()=>new Response(id===R?'[]':'not-json',{status:201})});
  if(id===R)assert.deepEqual((await client.request({...p,session:session()})).data,[]);else await assert.rejects(client.request({...p,session:session()}),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===201);
 }
});
await probe('Late401 cannot clear a newer token generation; owned401 invalidates original generation',async()=>{
 const p=prepareOperation(E,cases[2][2],{authenticated:true}),current=session();const client=new ApiClient(config,{log(){},transport:async()=>{current.tokens={...token,accessToken:'synthetic-replacement'};return new Response('',{status:401});}});
 await assert.rejects(client.request({...p,session:current}),{code:'SESSION_CHANGED'});assert.equal(current.tokens.accessToken,'synthetic-replacement');
 const owned=session(),second=new ApiClient(config,{log(){},transport:async()=>new Response('',{status:401})});await assert.rejects(second.request({...p,session:owned}),{code:'SESSION_EXPIRED'});assert.equal(owned.tokens,null);
});
async function localRefreshFixture(fn){
 const calls=[],started=deferred(),release=deferred();const store=new SessionStore();const server=createServer({configuration:config,sessions:store,log(){},transport:async(url,init)=>{
  calls.push({path:url.pathname,authorization:init.headers.Authorization});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-independent-user',token:{...token,expiredAt:1}}});
  if(url.pathname==='/auth/refresh_token'){started.resolve();await release.promise;return Response.json({data:{...token,accessToken:'synthetic-refreshed-access'}});}
  return Response.json(url.pathname==='/legacy/Wilayah'?[]:{PersilId:'synthetic-owned-result'});
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let cookie='',csrf='';
 async function send(path,body){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':csrf,'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const data=await response.json();if(data.csrfToken)csrf=data.csrfToken;return {status:response.status,data};}
 try{await send('/api/state');assert.equal((await send('/api/login',{username:'synthetic-independent-user',password:'synthetic-only-password'})).status,200);await fn({calls,started,release,send});}
 finally{release.resolve();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
await probe('HTTP logout during pending refresh prevents subsequent parcel GET and late model publication',()=>localRefreshFixture(async({calls,started,release,send})=>{
 const pending=send('/api/execute',{operationId:E,values:cases[2][2]});await started.promise;assert.equal((await send('/api/logout',{})).status,200);release.resolve();const result=await pending;assert.equal(result.status,401);assert.equal(result.data.result,undefined);assert.deepEqual(calls.map(row=>row.path),['/auth/signin','/auth/refresh_token']);
}));
await probe('HTTP two simultaneous expired-session parcel reads share one refresh and both use refreshed token',()=>localRefreshFixture(async({calls,started,release,send})=>{
 const first=send('/api/execute',{operationId:E,values:cases[2][2]}),second=send('/api/execute',{operationId:R,values:cases[0][2]});await started.promise;release.resolve();const results=await Promise.all([first,second]);assert.ok(results.every(row=>row.status===200));assert.equal(calls.filter(row=>row.path==='/auth/refresh_token').length,1);const reads=calls.filter(row=>row.path.startsWith('/legacy/'));assert.equal(reads.length,2);assert.ok(reads.every(row=>row.authorization==='Bearer synthetic-refreshed-access'));
}));

const node='tools/runtime/node.exe',testFile='webapp/tests/parcel-search-backend.test.mjs';
const test=spawnSync(node,['--openssl-legacy-provider','--test','--test-reporter=tap',testFile],{encoding:'utf8',timeout:60_000});assert.equal(test.status,0,test.stderr||test.stdout);
for(const [key,value]of [['tests',29],['pass',29],['fail',0],['cancelled',0],['skipped',0]])assert.match(test.stdout,new RegExp('^# '+key+' '+value+'$','m'));
const tapFile='analysis/webapp/parcel-search-backend-review-tests.tap';assert.equal(existsSync(tapFile),false);writeFileSync(tapFile,test.stdout);
for(const row of inputs)assert.equal(sha(row.file),row.sha256,row.file);
const beforeByFile=new Map(baseline.runtime.map(row=>[row.file,row.sha256]));
const changedInputs=inputs.filter(row=>row.file.startsWith('webapp/private/')&&beforeByFile.get(row.file)!==row.sha256).map(row=>({...row,beforeSha256:beforeByFile.get(row.file)??null,change:beforeByFile.has(row.file)?'modified':'added'}));
const result={status:'PASS',scope:'Independent bounded review of three Cari Bidang main-session GET adapters, direct typed models and lifecycle',reviewerRelationship:'Reviewer authored the native evidence; did not implement backend/runtime or its29 tests. This review inspected fresh sources and added independent synthetic probes only.',baseline:pin(baselineFile),authorReceipt:pin(authorFile),inputFiles:inputs,changedInputs,native,operations:{total:176,changed:[R,A,E].sort(),unchanged:173},independentProbes:probes,focusedTests:{command:`${node} --openssl-legacy-provider --test --test-reporter=tap ${testFile}`,tests:29,pass:29,fail:0,tap:pin(tapFile)},materialFindings:[],reviewConclusions:['Exact original three paths and ordered queries remain fixed main/session GET; constants and raw source Strings preserved.','HTTP200 lookup and shared2xx region status gates precede direct typed parsing; body.error/data do not substitute the native service tuple.','Raw numeric lexemes enforce int-versus-double and signed64 bounds; safe numbers/wide decimal Strings are declared browser adaptation. Four specializedNull? fields remain null-only.','Session refresh precedes HTTP reads and is single-flight; pending logout suppresses refresh completion/read publication; late401 preserves newer tokens.','Unknown response fields are ignored, unknown request fields rejected; no geometry, identity override, telemetry write or geotag action added.'],limitations:['Synthetic-only, no production/server acceptance or Android execution.','URLSearchParams encoding, bounded input/body handling and output secret redaction remain browser safeguards; complete native shared transport escaping is not certified.','No runtime edits, old report overwrite, native expansion, deployment or container restart.'],inputsUnchangedDuringReview:true,network:{productionRequests:0,syntheticTransportOnly:true,localHttpOnly:true}};
writeFileSync(target,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:'PASS',receipt:pin(target),independentProbes:probes.length,focusedTests:29,changedInputs:changedInputs.length,materialFindings:0}));
