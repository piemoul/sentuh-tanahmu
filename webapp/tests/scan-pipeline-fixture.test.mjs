import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createScanPipelineFixture,scanFixtureIds as ids} from './scan-pipeline-browser-fixture.mjs';
import {createScanController} from '../scan-controller.js';
const digest=value=>createHash('sha256').update(value).digest('hex');
const value=reply=>{assert.equal(reply.status,200,JSON.stringify(reply.body));assert.equal(reply.body.ok,true,JSON.stringify(reply.body));return reply.body.result;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function waitPending(fixture){for(let i=0;i<200&&fixture.snapshot().pendingResponses.length===0;i++)await tick();assert.equal(fixture.snapshot().pendingResponses.length,1);}
async function harness(t){
 const fixture=createScanPipelineFixture({port:0,receiptFile:null}),{base}=await fixture.start();t.after(()=>fixture.stop());
 const initial=await fetch(base+'/api/state'),cookie=initial.headers.get('set-cookie').split(';')[0],state=await initial.json();
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const text=await response.text();let data;try{data=JSON.parse(text);}catch{data={text};}return{status:response.status,body:data};}
 const execute=(id,values={},extra={},headers)=>send('/api/execute',{operationId:id,values,...extra},headers);
 const control=(mode,action='mode',profile)=>send('/fixture/control',{action,...(mode===undefined?{}:{mode}),...(profile===undefined?{}:{profile})});
 const catalog=(await send('/api/catalog')).body.operations,documents=[],parcels=[],auth=[],notifications=[],changes=[],apiReplies=[];
 let current=true;
 const api=async(path,{body})=>{const reply=await send(path,body);apiReplies.push({id:body.operationId,reply:reply.body});if(reply.status!==200||reply.body.ok!==true)throw Object.assign(new Error(reply.body.error?.message||'Synthetic HTTP error'),{code:reply.body.error?.code,status:reply.status});return reply.body;};
 const controller=createScanController({api,getOperations:()=>catalog,getAccount:()=>({authenticated:true,configured:true,loading:false}),isCurrent:()=>current,onChange:state=>changes.push(state),onAuthError:error=>auth.push(error),notify:text=>notifications.push(text),onDocument:outcome=>documents.push(outcome),onParcel:outcome=>parcels.push(outcome),onLocation:async(outcome,_context,extra)=>(await api('/api/execute',{body:{operationId:ids.geo,values:{q:outcome.q},...extra}})).result});
 assert.equal(controller.open({fixture:true}),true);
 return{fixture,base,state,cookie,catalog,send,execute,control,controller,documents,parcels,auth,notifications,changes,apiReplies,setCurrent(value){current=value;}};
}
const paths=h=>h.fixture.snapshot().calls.map(call=>call.path);
async function classify(h,q='RAW-SCAN-SINTETIS'){return value(await h.execute(ids.classify,{q},{confirm:true}));}
async function read(h,id,q,scanContextId){return h.execute(id,{q},{scanContextId});}

test('Scan fixture crosses real six-operation registry and preserves confirmation, Origin, CSRF and server-owned profile gates',async t=>{
 const h=await harness(t);assert.equal(h.state.authenticated,true);assert.deepEqual(new Set(h.catalog.map(op=>op.id)),new Set(Object.values(ids)));assert.equal(h.catalog.filter(op=>op.effect==='write').length,1);
 assert.equal((await h.execute(ids.classify,{q:'SINTETIS'})).body.error.code,'CONFIRMATION_REQUIRED');
 for(const [values,code] of [[{q:'SINTETIS',name:'forged'},'SCAN_PROFILE_OVERRIDE'],[{q:'SINTETIS',profile:{nama:'forged'}},'UNKNOWN_FIELD'],[{q:1},'FIELD_REQUIRED']])assert.equal((await h.execute(ids.classify,values,{confirm:true})).body.error.code,code);
 assert.equal((await h.execute(ids.classify,{q:'SINTETIS'},{confirm:true},{Origin:'https://untrusted.example.invalid'})).status,403);
 assert.equal((await h.execute(ids.classify,{q:'SINTETIS'},{confirm:true},{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal((await h.execute('post-geotag-uploadgeotag-unused',{}, {confirm:true})).body.error.code,'FIXTURE_REJECTED');
 assert.equal(h.fixture.snapshot().calls.length,0);assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('real API captures synthetic profile once, retains exact raw q, serves a paired valid PDF and uses double-encoded document geo',async t=>{
 const h=await harness(t),q='  QR:SINTETIS /?%+&=é🚩\n';
 const classified=await classify(h,q);assert.equal(classified.status,200);assert.match(classified.scanContextId,/^[A-Za-z0-9_-]{32}$/);
 await h.control(undefined,'profile','profile-b');
 const document=value(await read(h,ids.document,q,classified.scanContextId));assert.equal(document.contentType,'application/pdf');assert.match(document.previewUrl,/^\/api\/preview\/[\w-]+$/);assert.equal(document.downloadUrl.replace('/download/','/preview/'),document.previewUrl);
 const preview=await fetch(h.base+document.previewUrl,{headers:{Cookie:h.cookie}});assert.equal(preview.status,200);const bytes=Buffer.from(await preview.arrayBuffer());assert.ok(bytes.length>200);assert.equal(bytes.subarray(0,4).toString(),'%PDF');assert.match(bytes.toString(),/startxref\n\d+\n%%EOF/);
 const anon=await fetch(h.base+document.previewUrl);assert.notEqual(anon.status,200);
 const metadata=value(await read(h,ids.metadata,q,classified.scanContextId));assert.deepEqual(metadata.data,{error:false,data:{showRoute:1,type:'DokumenSINTETIS'}});
 const geo=value(await read(h,ids.geo,q,classified.scanContextId));assert.equal(geo.data.geometri.type,'MultiPolygon');assert.equal(geo.data.geometri.coordinates[0][0][0].length,2);
 assert.deepEqual(paths(h),['/account/account_summary','/apis/scanDocument','/apis/GetDocument','/apis/GetDocumentType','/apis/getGeoJsonInfo']);
 const calls=h.fixture.snapshot().calls;assert.equal(calls[1].name,'Pemindai A SINTETIS');assert.equal(calls[2].name,'Pemindai A SINTETIS');assert.equal(calls[2].qSha256,digest(q));assert.equal(calls[4].qSha256,digest(encodeURIComponent(q)));
 const receipt=JSON.stringify(h.fixture.snapshot());for(const secret of [q,classified.scanContextId,h.cookie,h.state.csrfToken,'scan-fixture-token-never-real','scan-signin-nik-synthetic'])assert.ok(!receipt.includes(secret));assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('native null-only profile fallback and empty raw q cross the real context and form adapters',async t=>{
 const h=await harness(t);
 for(const [profile,name] of [['profile-empty',''],['profile-email','scan-email@example.invalid'],['profile-none','-']]){
  await h.control(undefined,'profile',profile);const result=await classify(h,'');assert.equal(h.fixture.snapshot().calls.at(-1).name,name);assert.equal(value(await read(h,ids.document,'',result.scanContextId)).status,200);assert.equal(value(await read(h,ids.metadata,'',result.scanContextId)).status,200);assert.equal(value(await read(h,ids.geo,'',result.scanContextId)).status,200);
 }
 await h.control(undefined,'profile','profile-invalid');const before=h.fixture.snapshot().calls.length;const rejected=await h.execute(ids.classify,{q:'SINTETIS'},{confirm:true});assert.equal(rejected.body.error.code,'SCAN_PROFILE_UNRECOGNIZED');assert.equal(h.fixture.snapshot().calls.length,before+1);assert.equal(paths(h).at(-1),'/account/account_summary');
 assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('controller follows typed map, one-JSON and error:true classifiers; parcel target differs from feature ID and activation has no downstream action',async t=>{
 const h=await harness(t);
 for(const mode of ['document-map','classifier-json','classifier-error-true']){await h.control(mode);h.controller.setRawQ('SINTETIS '+mode);assert.equal(await h.controller.submit(),true);assert.equal(h.controller.snapshot().outcome.kind,'document');assert.equal(h.controller.snapshot().outcome.showRoute,true);}
 await h.control('parcel');const start=h.fixture.snapshot().calls.length;h.controller.setRawQ('SINTETIS PARCEL');assert.equal(await h.controller.submit(),true);assert.equal(h.parcels.length,1);const parcel=h.parcels[0];assert.equal(parcel.persilId,'scan-target-not-feature-synthetic');assert.notEqual(parcel.persilId,parcel.response.data.features[0].id);assert.deepEqual(paths(h).slice(start),['/account/account_summary','/apis/scanDocument','/legacy/GetParcelBoundaryById']);
 await h.control('activation');const before=h.fixture.snapshot().calls.length;h.controller.setRawQ('SINTETIS AKTIVASI');assert.equal(await h.controller.submit(),true);assert.equal(h.controller.snapshot().outcome.kind,'activation-unavailable');assert.deepEqual(paths(h).slice(before),['/account/account_summary','/apis/scanDocument']);assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('ordinary classifier failures use the native 1009 fallback but still fetch PDF and metadata with original q',async t=>{
 const h=await harness(t);
 for(const mode of ['classifier-503','classifier-malformed']){await h.control(mode);const before=h.fixture.snapshot().calls.length,q='SINTETIS '+mode;h.controller.setRawQ(q);assert.equal(await h.controller.submit(),true);const classified=h.apiReplies.findLast(item=>item.id===ids.classify).reply.result;assert.equal(classified.nativeFallback,true);assert.deepEqual(classified.data,{message:'error',data:'1009'});assert.equal(h.controller.snapshot().outcome.q,q);assert.deepEqual(paths(h).slice(before),['/account/account_summary','/apis/scanDocument','/apis/GetDocument','/apis/GetDocumentType']);assert.equal(h.fixture.snapshot().calls.at(-2).qSha256,digest(q));}
 assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('PDF guards abort before metadata; metadata ordinary failures retain PDF and use the complete fallback',async t=>{
 const h=await harness(t);
 for(const mode of ['pdf-invalid','pdf-short','pdf-503']){await h.control(mode);const before=h.fixture.snapshot().calls.length;h.controller.setRawQ('SINTETIS '+mode);assert.equal(await h.controller.submit(),false);assert.equal(h.controller.snapshot().outcome,null);assert.deepEqual(paths(h).slice(before),['/account/account_summary','/apis/scanDocument','/apis/GetDocument']);}
 for(const mode of ['metadata-503','metadata-malformed','metadata-string']){await h.control(mode);h.controller.setRawQ('SINTETIS '+mode);assert.equal(await h.controller.submit(),true);const result=h.controller.snapshot().outcome;assert.equal(result.kind,'document');assert.equal(result.showRoute,false);assert.equal(result.type,'');assert.ok(result.pdf.previewUrl);}
 for(const [mode,type,route] of [['metadata-error-true','DokumenSINTETIS',true],['metadata-no-route','DokumenSINTETIS',false],['type-pbt','PetaBidangElektronik',true],['type-kkpr','KKPR',true]]){await h.control(mode);h.controller.setRawQ('SINTETIS '+mode);assert.equal(await h.controller.submit(),true);assert.equal(h.controller.snapshot().outcome.type,type);assert.equal(h.controller.snapshot().outcome.showRoute,route);}
 assert.ok(!h.catalog.some(op=>/GetPBTElDetail|GetKKPRDetail/.test(op.endpoint)),'Special locations intentionally absent from this fixture registry');assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('opaque Scan context is tied to exact q, session user, TTL and only document/metadata/generic-location operations',async t=>{
 const h=await harness(t),q='SINTETIS KONTEXT',classified=await classify(h,q),before=h.fixture.snapshot().calls.length;
 assert.equal((await read(h,ids.document,q+' ',classified.scanContextId)).body.error.code,'SCAN_CONTEXT_INVALID');
 assert.equal((await read(h,ids.metadata,q,'bad')).body.error.code,'SCAN_CONTEXT_INVALID');
 assert.equal((await h.execute(ids.parcel,{persilid:'scan-target-not-feature-synthetic'},{scanContextId:classified.scanContextId})).body.error.code,'SCAN_CONTEXT_SCOPE');
 assert.equal((await h.execute(ids.document,{q,name:'Pemindai B SINTETIS'},{scanContextId:classified.scanContextId})).body.error.code,'SCAN_PROFILE_OVERRIDE');
 const second=await fetch(h.base+'/api/state'),otherCookie=second.headers.get('set-cookie').split(';')[0],other=await second.json();const denied=await fetch(h.base+'/api/execute',{method:'POST',headers:{Cookie:otherCookie,Origin:h.base,'X-CSRF-Token':other.csrfToken,'Content-Type':'application/json'},body:JSON.stringify({operationId:ids.metadata,values:{q},scanContextId:classified.scanContextId})});assert.equal(denied.status,401);
 await h.control(undefined,'expire-context');assert.equal((await read(h,ids.geo,q,classified.scanContextId)).body.error.code,'SCAN_CONTEXT_INVALID');assert.equal(h.fixture.snapshot().calls.length,before);
});

test('pending classifier cancellation/stale ownership suppress downstream reads and newer results remain owned',async t=>{
 const h=await harness(t);await h.control('slow-classifier-success');h.controller.setRawQ('SINTETIS OLD');const old=h.controller.submit();await waitPending(h.fixture);assert.equal(h.controller.cancel(),true);assert.equal(h.controller.snapshot().busy,false);
 await h.control('document-map');h.controller.setRawQ('SINTETIS NEW');assert.equal(await h.controller.submit(),true);assert.equal(h.controller.snapshot().outcome.q,'SINTETIS NEW');await h.control(undefined,'release');assert.equal(await old,false);assert.equal(h.controller.snapshot().outcome.q,'SINTETIS NEW');assert.equal(paths(h).filter(p=>p==='/apis/GetDocument').length,1);
 await h.control('slow-classifier-error');h.controller.setRawQ('SINTETIS STALE');const stale=h.controller.submit();await waitPending(h.fixture);h.setCurrent(false);await h.control(undefined,'release');assert.equal(await stale,false);assert.equal(paths(h).filter(p=>p==='/apis/GetDocument').length,1);assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('delayed logout and same-session user replacement cannot publish contexts; token replacement alone keeps the same-account owner',async t=>{
 const h=await harness(t);await h.control('slow-classifier-success');const pending=h.execute(ids.classify,{q:'SINTETIS USER'},{confirm:true});await waitPending(h.fixture);await h.control(undefined,'replace-user');await h.control(undefined,'release');const changed=await pending;assert.equal(changed.body.error.code,'SESSION_CHANGED');assert.equal(changed.body.result,undefined);
 const same=classify(h,'SINTETIS TOKEN');await waitPending(h.fixture);await h.control(undefined,'replace-tokens');await h.control(undefined,'release');assert.match((await same).scanContextId,/^[A-Za-z0-9_-]{32}$/);
 const logout=h.execute(ids.classify,{q:'SINTETIS LOGOUT'},{confirm:true});await waitPending(h.fixture);assert.equal((await h.send('/api/logout',{})).status,200);await h.control(undefined,'release');assert.equal((await logout).body.error.code,'SESSION_EXPIRED');assert.equal(paths(h).filter(p=>p==='/apis/GetDocument').length,0);assert.equal(h.fixture.snapshot().pendingResponses.length,0);
});

test('slow PDF, metadata and generic-map responses capture their mode, release independently and cleanup cancels outstanding responses',async t=>{
 const h=await harness(t);
 for(const mode of ['slow-pdf','slow-metadata']){await h.control(mode);h.controller.setRawQ('SINTETIS '+mode);const pending=h.controller.submit();await waitPending(h.fixture);assert.equal(h.controller.snapshot().busy,true);await h.control('document-map');await h.control(undefined,'release');assert.equal(await pending,true);assert.equal(h.controller.snapshot().outcome.kind,'document');}
 await h.control('slow-geo');const geo=h.controller.openLocation();await waitPending(h.fixture);assert.equal(h.controller.snapshot().locationBusy,true);await h.control(undefined,'release');assert.equal(await geo,true);assert.equal(h.controller.snapshot().locationBusy,false);
 await h.control('slow-classifier-success');const cleanup=h.execute(ids.classify,{q:'SINTETIS CLEANUP'},{confirm:true}).catch(error=>({disconnected:error.name}));await waitPending(h.fixture);await h.fixture.stop();await cleanup;assert.equal(h.fixture.snapshot().pendingResponses.length,0);assert.equal(h.fixture.snapshot().calls.at(-1).aborted,true);assert.equal(h.fixture.snapshot().unexpected.length,0);
});

test('profile failure issues no classifier; real 401 remains authentication failure and ordinary geo failure retains the owned PDF',async t=>{
 for(const mode of ['profile-503','classifier-401','metadata-401']){
  const h=await harness(t);await h.control(mode);h.controller.setRawQ('SINTETIS '+mode);assert.equal(await h.controller.submit(),false);
  assert.deepEqual(paths(h),mode==='profile-503'?['/account/account_summary']:mode==='classifier-401'?['/account/account_summary','/apis/scanDocument']:['/account/account_summary','/apis/scanDocument','/apis/GetDocument','/apis/GetDocumentType']);
  if(mode==='profile-503'){assert.equal(h.auth.length,0);assert.equal(h.controller.snapshot().outcome,null);}else{assert.equal(h.auth.length,1);assert.equal(h.auth[0].code,'SESSION_EXPIRED');assert.equal(h.controller.snapshot(),null);assert.equal((await h.send('/api/state')).body.authenticated,false);}
  assert.equal(h.fixture.snapshot().unexpected.length,0);
 }
 const h=await harness(t);h.controller.setRawQ('SINTETIS GEO GAGAL');assert.equal(await h.controller.submit(),true);const pdf=h.controller.snapshot().outcome.pdf;await h.control('geo-503');assert.equal(await h.controller.openLocation(),false);assert.deepEqual(h.controller.snapshot().outcome.pdf,pdf);assert.equal(h.controller.snapshot().locationBusy,false);assert.equal(h.notifications.length,1);assert.equal(h.auth.length,0);assert.equal(h.fixture.snapshot().unexpected.length,0);
});

function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function verifyPng(bytes){assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);const chunks=[];for(let i=8;i<bytes.length;){const size=bytes.readUInt32BE(i),type=bytes.subarray(i+4,i+8),data=bytes.subarray(i+8,i+8+size);assert.equal(bytes.readUInt32BE(i+8+size),crc32(Buffer.concat([type,data])));chunks.push({type:type.toString(),data});i+=12+size;}assert.deepEqual(chunks.map(item=>item.type),['IHDR','IDAT','IEND']);assert.equal(chunks[0].data.readUInt32BE(0),1);assert.equal(chunks[0].data.readUInt32BE(4),1);assert.deepEqual([...zlib.inflateSync(chunks[1].data)],[0,214,225,212,255]);}
test('fixture serves unchanged real Scan source and only rewrites fixed map tiles; CSP and camera policy stay local',async t=>{
 const h=await harness(t),files=['app.js','scan-controller.js','styles.css'],hashes=files.map(file=>digest(fs.readFileSync(new URL('../'+file,import.meta.url))));
 for(const file of files){const response=await fetch(h.base+'/'+file);assert.equal(response.status,200,file+' must be served by the real app server');assert.equal(await response.text(),fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));}
 const page=await fetch(h.base+'/');assert.equal(page.headers.get('permissions-policy'),'camera=(), microphone=(), geolocation=()');assert.ok(!page.headers.get('content-security-policy').includes('tile.openstreetmap.org'));assert.match(await page.text(),/fixture\/controls.js/);
 const original=fs.readFileSync(new URL('../assets/maps/official-map.js',import.meta.url),'utf8'),served=await(await fetch(h.base+'/assets/maps/official-map.js')).text();assert.equal(served,original.replace('https://tile.openstreetmap.org/{z}/{x}/{y}.png','/fixture/osm/{z}/{x}/{y}.png'));
 for(const url of ['/fixture/osm/18/12/15.png','/api/maps/bhumi/18/12/15.png']){const response=await fetch(h.base+url);assert.equal(response.status,200);verifyPng(Buffer.from(await response.arrayBuffer()));}
 assert.equal((await fetch(h.base+'/api/maps/config')).status,200);assert.equal(h.fixture.snapshot().calls.length,0);assert.equal(h.fixture.snapshot().providerRequests,0);assert.deepEqual(files.map(file=>digest(fs.readFileSync(new URL('../'+file,import.meta.url)))),hashes);
});
