import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {createCollectionSaveActivityFixture} from './collection-save-activity-browser-fixture.mjs';
const ids={activity:'get-activity-getuseractivity-d1dc68',removeActivity:'post-activity-deleteuseractivity-de6c94',profile:'post-account-account-summary-d2939c',rows:'get-collection-getusercollection-d31a50',groups:'get-collection-getpersilcollectiongroup-d31fbc',status:'get-collection-getcollectionid-d25250',file:'post-berkas-cariberkas-d88218',sop:'post-berkas-berkassop-d87ea8',print:'post-berkas-getstatuscetak-d87ca8',parcel:'get-legacy-getparcelboundarybyid-dbaeb8',saveFile:'post-collection-addcollectionberkas-d92664',saveParcel:'post-collection-addcollectionpersil-daae30',create:'post-collection-addpersilcollectiongroup-da8f20',assign:'post-collection-addpersilcollectiontogroup-da897c',removeFile:'delete-collection-deletecollectionberkas-path-argument-1-d92888',removeParcel:'delete-collection-deletecollectionpersil-path-argument-1-da7530'};
async function harness(t){
 const fixture=createCollectionSaveActivityFixture({port:0,receiptFile:null}),{base}=await fixture.start();t.after(()=>fixture.stop());
 const initial=await fetch(base+'/api/state'),cookie=initial.headers.get('set-cookie').split(';')[0],state=await initial.json();
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:response.status,body:await response.json()};}
 const execute=(id,values={},confirm=true,headers)=>send('/api/execute',{operationId:id,values,confirm},headers);
 const control=(mode,action='mode')=>send('/fixture/control',{action,mode});
 return{fixture,base,state,send,execute,control};
}
const value=reply=>{assert.equal(reply.status,200,JSON.stringify(reply.body));assert.equal(reply.body.ok,true,JSON.stringify(reply.body));return reply.body.result;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function waitPending(fixture){for(let i=0;i<100&&fixture.snapshot().pendingResponses.length===0;i++)await tick();assert.equal(fixture.snapshot().pendingResponses.length,1);}
test('browser fixture uses real restricted registry/API and retains Origin CSRF confirmation and stored-NIK gates',async t=>{
 const h=await harness(t),catalog=await h.send('/api/catalog');assert.equal(h.state.authenticated,true);assert.equal(catalog.body.operations.length,16);assert.deepEqual(new Set(catalog.body.operations.map(item=>item.id)),new Set(Object.values(ids)));
 const profile=value(await h.execute(ids.profile));assert.equal(profile.data.data.statusVerifikasi,1);assert.equal(profile.data.data.nomorIdentitas,'different-summary-identity');
 const before=h.fixture.snapshot().calls.length;
 assert.equal((await h.execute(ids.saveParcel,{PersilId:'fixture-parcel',Title:'Caption'},false)).body.error.code,'CONFIRMATION_REQUIRED');
 for(const Nik of ['fixture-login-nik','different-summary-identity'])assert.equal((await h.execute(ids.saveParcel,{PersilId:'fixture-parcel',Title:'Caption',Nik})).body.error.code,'SESSION_IDENTITY_MISMATCH');
 assert.equal((await h.execute(ids.activity,{},true,{Origin:'https://untrusted.example.invalid'})).status,403);
 assert.equal((await h.execute(ids.activity,{},true,{'X-CSRF-Token':'invalid'})).status,403);
 assert.equal(h.fixture.snapshot().calls.length,before);
 const outside=await h.execute('get-berita-getberita-d2cb24');assert.equal(outside.status,403);assert.equal(outside.body.error.code,'FIXTURE_REJECTED');assert.equal(h.fixture.snapshot().calls.length,before);
});
test('fixture read replies cross real typed adapters for Activity, groups, BERKAS detail/status and PERSIL map',async t=>{
 const h=await harness(t),activity=value(await h.execute(ids.activity)).data.data;assert.equal(activity.length,5);assert.equal(activity[3].contentId,null);assert.equal(activity[3].platform,'');assert.equal(activity[3].createdAt,null);
 assert.equal(value(await h.execute(ids.groups)).data.data.length,2);assert.equal(value(await h.execute(ids.rows)).data.data.length,2);
 const detail=value(await h.execute(ids.file,{berkasId:'fixture-file'})).data;assert.equal(detail.berkasId,'fixture-primary-file');assert.equal(detail.nomor,12);assert.equal(detail.kantor.tipeKantorId,3.9);assert.ok(Array.isArray(detail.parapihak));
 assert.equal(value(await h.execute(ids.sop,{berkasid:'fixture-file'})).data.tipeProduk,'SINTETIS');assert.equal(value(await h.execute(ids.print,{berkasid:'fixture-file'})).data.message,'SINTETIS');
 const status=value(await h.execute(ids.status,{id:'fixture-primary-file:3'})).data;assert.equal(status.message,null);assert.equal(status.data,'must-not-be-status-id');
 const map=value(await h.execute(ids.parcel,{persilid:'fixture-parcel'})).data;assert.equal(map.type,'FeatureCollection');assert.notEqual(map.features[0].id,'fixture-parcel');assert.equal(map.features[0].properties.NIB,'SINTETIS-NIB');assert.equal(h.fixture.snapshot().unexpected.length,0);
});
test('fixture models BERKAS save/status/removal and PERSIL primary/nested-group/assignment/saved-map removal with stored NIK only',async t=>{
 const h=await harness(t),file={BerkasId:'fixture-primary-file:3',Title:'Berkas No 12/2026',Subtitle:'Kantor SINTETIS'};
 const savedFile=value(await h.execute(ids.saveFile,file)).data.data;assert.ok(savedFile.startsWith('fixture-new-collection-'));
 assert.equal(value(await h.execute(ids.status,{id:file.BerkasId})).data.message,savedFile);value(await h.execute(ids.removeFile,{path_argument_1:savedFile}));assert.equal(value(await h.execute(ids.status,{id:file.BerkasId})).data.message,null);
 const created=value(await h.execute(ids.create,{GroupName:'Grup Baru SINTETIS'})).data.data;assert.ok(value(await h.execute(ids.groups)).data.data.some(item=>item.collectionGroupId===created));
 const savedParcel=value(await h.execute(ids.saveParcel,{PersilId:'fixture-parcel',Title:'Caption SINTETIS'})).data.data;
 value(await h.execute(ids.assign,{collectionGroupId:created,collectionId:savedParcel}));assert.equal(h.fixture.snapshot().serverState.collections.find(item=>item.id===savedParcel).groupId,created);
 value(await h.execute(ids.removeParcel,{path_argument_1:'fixture-saved-parcel'}));assert.ok(!h.fixture.snapshot().serverState.collections.some(item=>item.id==='fixture-saved-parcel'));
 const calls=h.fixture.snapshot().calls;for(const call of calls.filter(item=>['/Collection/AddCollectionBerkas','/Collection/AddCollectionPersil'].includes(item.path))){assert.equal(call.fields.at(-1),'Nik');assert.equal(call.values.Nik,'[synthetic sign-in NIK]');assert.notEqual(call.values.Nik,'different-summary-identity');}
 assert.equal(h.fixture.snapshot().unexpected.length,0);assert.ok(!JSON.stringify(h.fixture.snapshot()).includes('fixture-token-never-real'));assert.ok(!JSON.stringify(h.fixture.snapshot()).includes('fixture-login-nik'));
});
test('fixture modes never mutate synthetic server rows on ordinary Activity failure even though native local deletion will continue',async t=>{
 const h=await harness(t),id='fixture-activity-login',original=h.fixture.snapshot().serverState.rows;
 for(const mode of ['http-503','http-201','malformed']){
  await h.control(mode);const result=value(await h.execute(ids.removeActivity,{userActivityId:id}));assert.equal(result.status,mode==='http-503'?503:mode==='http-201'?201:200);assert.equal(result.data,mode==='malformed');assert.deepEqual(h.fixture.snapshot().serverState.rows,original);assert.equal(h.fixture.snapshot().actions.at(-1).acceptedSynthetic,false);
 }
 await h.control('error-true');assert.equal(value(await h.execute(ids.removeActivity,{userActivityId:id})).data,true);assert.ok(!h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId===id));
 const before=h.fixture.snapshot().serverState.collections.length;assert.equal(value(await h.execute(ids.saveParcel,{PersilId:'fixture-parcel',Title:'Caption'})).data.error,true);assert.equal(h.fixture.snapshot().serverState.collections.length,before,'PERSIL synthetic policy follows strict body-error-false caller acceptance');
 value(await h.execute(ids.saveFile,{BerkasId:'fixture-primary-file:3',Title:'Berkas No 12/2026',Subtitle:'Kantor SINTETIS'}));assert.equal(h.fixture.snapshot().serverState.collections.length,before+1,'BERKAS typed error:true is an ordinary accepted service result');
});
test('slow mode captures outcome and allows controlled release, failure and reset without spurious server mutations',async t=>{
 const h=await harness(t),id='fixture-activity-login';await h.control('slow-error');const pending=h.execute(ids.removeActivity,{userActivityId:id});await waitPending(h.fixture);assert.ok(h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId===id));await h.control('ready');await h.control('ready','release');assert.equal(value(await pending).data,false);assert.ok(h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId===id));
 await h.control('slow-success');const success=h.execute(ids.removeActivity,{userActivityId:'fixture-duplicate'});await waitPending(h.fixture);await h.control('ready','release');assert.equal(value(await success).data,true);assert.ok(!h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId==='fixture-duplicate'));
 await h.control('slow-success');const reset=h.execute(ids.removeActivity,{userActivityId:id});await waitPending(h.fixture);await h.control('ready','reset');const result=await reset;assert.equal(result.status,502);assert.equal(result.body.error.code,'UPSTREAM_UNREACHABLE');assert.equal(result.body.result,undefined);assert.equal(h.fixture.snapshot().pendingResponses.length,0);assert.ok(h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId===id));assert.equal(h.fixture.snapshot().actions.at(-1).aborted,true);
});
test('stopping the fixture cancels pending synthetic success instead of committing it during cleanup',async t=>{
 const h=await harness(t);await h.control('slow-success');const pending=h.execute(ids.removeActivity,{userActivityId:'fixture-activity-login'}).catch(error=>({disconnected:error.name}));await waitPending(h.fixture);await h.fixture.stop();await pending;assert.equal(h.fixture.snapshot().pendingResponses.length,0);assert.equal(h.fixture.snapshot().actions.at(-1).aborted,true);assert.ok(h.fixture.snapshot().serverState.rows.some(item=>item.userActivityId==='fixture-activity-login'));
});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function verifyPng(bytes){assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);const chunks=[];for(let i=8;i<bytes.length;){const size=bytes.readUInt32BE(i),type=bytes.subarray(i+4,i+8),data=bytes.subarray(i+8,i+8+size);assert.equal(bytes.readUInt32BE(i+8+size),crc32(Buffer.concat([type,data])));chunks.push({type:type.toString(),data});i+=12+size;}assert.deepEqual(chunks.map(item=>item.type),['IHDR','IDAT','IEND']);assert.equal(chunks[0].data.readUInt32BE(0),1);assert.equal(chunks[0].data.readUInt32BE(4),1);assert.deepEqual([...zlib.inflateSync(chunks[1].data)],[0,214,225,212,255]);}
test('fixture serves unchanged app/modules and rewrites only the fixed map template to CRC-valid local PNGs',async t=>{
 const h=await harness(t),files=['webapp/app.js','webapp/collection-save-persil.js','webapp/assets/maps/official-map.js'],hashes=files.map(file=>createHash('sha256').update(fs.readFileSync(new URL('../../'+file,import.meta.url))).digest('hex'));
 for(const [url,file] of [['/app.js','webapp/app.js'],['/collection-save-persil.js','webapp/collection-save-persil.js']])assert.equal(await(await fetch(h.base+url)).text(),fs.readFileSync(new URL('../../'+file,import.meta.url),'utf8'));
 const original=fs.readFileSync(new URL('../assets/maps/official-map.js',import.meta.url),'utf8'),map=await(await fetch(h.base+'/assets/maps/official-map.js')).text();assert.equal(map,original.replace('https://tile.openstreetmap.org/{z}/{x}/{y}.png','/fixture/osm/{z}/{x}/{y}.png'));
 const page=await fetch(h.base+'/');assert.ok(!page.headers.get('content-security-policy').includes('tile.openstreetmap.org'));assert.match(await page.text(),/fixture\/controls.js/);
 for(const url of ['/fixture/osm/18/12/15.png','/api/maps/bhumi/18/12/15.png']){const response=await fetch(h.base+url);assert.equal(response.status,200);verifyPng(Buffer.from(await response.arrayBuffer()));}
 assert.equal((await fetch(h.base+'/api/maps/config')).status,200);assert.equal(h.fixture.snapshot().calls.length,0);assert.equal(h.fixture.snapshot().providerRequests,0);
 assert.deepEqual(files.map(file=>createHash('sha256').update(fs.readFileSync(new URL('../../'+file,import.meta.url))).digest('hex')),hashes);
});
