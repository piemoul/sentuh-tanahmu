import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createScanSpecialMapsFixture,scanSpecialFixtureIds as ids} from './scan-special-maps-browser-fixture.mjs';
import {createScanLocationController,scanPbtMapModel,scanSpecialMapData,scanPbtRows} from '../scan-location.js';
const RAW='  PBT:SINTETIS /?+%2F é🚩  ',digest=value=>createHash('sha256').update(value).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function harness(t){
  const fixture=createScanSpecialMapsFixture({port:0,receiptFile:null}),{base}=await fixture.start();t.after(()=>fixture.stop());
  const initial=await fetch(base+'/api/state'),cookie=initial.headers.get('set-cookie').split(';')[0],state=await initial.json();
  async function send(path,body){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':state.csrfToken})},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:response.status,body:await response.json()};}
  const execute=(operationId,values={},extra={})=>send('/api/execute',{operationId,values,...extra});
  const mode=value=>send('/fixture/control',{action:'mode',mode:value});
  const classify=async(q=RAW)=>{const reply=await execute(ids.classify,{q},{confirm:true});assert.equal(reply.status,200);assert.equal(reply.body.ok,true);return reply.body.result.scanContextId;};
  const read=(id,q,scanContextId)=>execute(id,{q},{scanContextId});
  const api=async(path,{body})=>{const reply=await send(path,body);if(reply.status!==200||reply.body.ok!==true)throw Object.assign(Error(reply.body.error?.message??'Synthetic failure'),{code:reply.body.error?.code});return reply.body;};
  return{fixture,send,execute,mode,classify,read,api};
}
const result=reply=>{assert.equal(reply.status,200,JSON.stringify(reply.body));assert.equal(reply.body.ok,true);return reply.body.result;};
async function pending(h){for(let i=0;i<200&&!h.fixture.snapshot().pendingResponses.length;i++)await tick();assert.equal(h.fixture.snapshot().pendingResponses.length,1);}
test('special fixture restricts catalog to eight fixed operations and classifier is the sole write',async t=>{
  const h=await harness(t),ops=(await h.send('/api/catalog')).body.operations;assert.deepEqual(new Set(ops.map(op=>op.id)),new Set(Object.values(ids)));assert.deepEqual(ops.filter(op=>op.effect==='write').map(op=>op.id),[ids.classify]);
  assert.equal((await h.execute('post-geotag-uploadgeotag-unused',{}, {confirm:true})).body.error.code,'FIXTURE_REJECTED');assert.equal(h.fixture.snapshot().calls.length,0);
});
for(const q of ['',RAW])test(`real special context preserves raw q through typed PBT, PDF metadata and generic read (${JSON.stringify(q)})`,async t=>{
  const h=await harness(t);await h.mode('pbt-map');const context=await h.classify(q),pbt=result(await h.read(ids.pbt,q,context)),model=scanPbtMapModel(pbt);
  assert.equal(model.rows.length,4);assert.equal(model.centers.length,4);assert.equal(model.centers[2],null);assert.equal(model.initial.zoom,19);assert.equal(scanPbtRows(model,'duplikat')[0].index,0);
  const metadata=result(await h.read(ids.metadata,q,context));assert.equal(metadata.data.data.type,'PetaBidangElektronik');const geo=result(await h.read(ids.geo,q,context));assert.equal(geo.data.geometri.type,'MultiPolygon');
  const calls=h.fixture.snapshot().calls;assert.deepEqual(calls.find(call=>call.path==='/apis/GetPBTElDetail').fields,['q']);assert.equal(calls.find(call=>call.path==='/apis/GetPBTElDetail').qSha256,digest(q));assert.equal(calls.at(-1).qSha256,digest(encodeURIComponent(q)));assert.equal(h.fixture.snapshot().unexpected.length,0);
});
test('browser cannot override name, change captured q or attach context to another endpoint',async t=>{
  const h=await harness(t);await h.mode('pbt-map');const context=await h.classify(),before=h.fixture.snapshot().calls.length;
  assert.equal((await h.execute(ids.pbt,{q:RAW,name:'SYNTHETIC forged'},{scanContextId:context})).body.error.code,'UNKNOWN_FIELD');
  assert.equal((await h.read(ids.pbt,'changed',context)).body.error.code,'SCAN_CONTEXT_INVALID');
  assert.equal((await h.execute(ids.parcel,{persilid:'synthetic'},{scanContextId:context})).body.error.code,'SCAN_CONTEXT_SCOPE');assert.equal(h.fixture.snapshot().calls.length,before);
});
test('native error:true stays typed but never publishes a successful PBT map',async t=>{
  const h=await harness(t);await h.mode('pbt-error-true');const context=await h.classify(),pbt=result(await h.read(ids.pbt,RAW,context));assert.equal(pbt.data.error,true);assert.equal(pbt.data.data.daftarBidangTanah.length,4);assert.throws(()=>scanSpecialMapData(pbt),{code:'SCAN_MAP_UNAVAILABLE'});assert.equal((await h.send('/api/state')).body.authenticated,true);
});
for(const mode of ['pbt-201','pbt-503'])test(`${mode} remains a read failure without logout or automatic classifier retry`,async t=>{
  const h=await harness(t);await h.mode(mode);const context=await h.classify(),reply=await h.read(ids.pbt,RAW,context);assert.equal(reply.status,502);assert.equal(reply.body.ok,false);assert.equal((await h.send('/api/state')).body.authenticated,true);assert.equal(h.fixture.snapshot().calls.filter(call=>call.path==='/apis/scanDocument').length,1);
});
test('identity geometry model retains malformed numeric leaves for projection; source text is still available',async t=>{
  const h=await harness(t);await h.mode('pbt-malformed');const context=await h.classify(),pbt=result(await h.read(ids.pbt,RAW,context));assert.equal(pbt.data.data.daftarBidangTanah[0].batas.geometri.coordinates[0][0][0][0],'invalid coordinate SINTETIS');assert.equal(pbt.data.data.daftarBidangTanah[0].nib,'NIB SINTETIS 001');assert.throws(()=>scanPbtMapModel(pbt),{code:'SCAN_MAP_UNRECOGNIZED'});
});
test('empty typed source preserves null model list, then projects fallback camera with no feature center',async t=>{
  const h=await harness(t);await h.mode('pbt-empty');const context=await h.classify(),pbt=result(await h.read(ids.pbt,RAW,context));assert.equal(pbt.data.data.daftarBidangTanah,null);const model=scanPbtMapModel(pbt);assert.deepEqual(model.centers,[]);assert.deepEqual(model.initial,{center:{lat:-6.2,lng:106.816666},zoom:19});
});
for(const slow of ['slow-pbt','slow-geo-pbt'])test(`real HTTP branches start independently and retain other result while ${slow} is pending`,async t=>{
  const h=await harness(t);await h.mode(slow);const context=await h.classify(),catalog=(await h.send('/api/catalog')).body.operations,auth=[];
  const controller=createScanLocationController({api:h.api,getOperations:()=>catalog,isCurrent:()=>true,validate:(kind,res)=>kind==='pbt'?scanSpecialMapData(res):assert.equal(res.status,200),onAuthError:error=>auth.push(error)}),work=controller.open({type:'PetaBidangElektronik',q:RAW,scanContextId:context},{});
  await pending(h);for(let i=0;i<200&&!controller.snapshot().branches.some(branch=>branch.stage==='ready');i++)await tick();
  const branch=slow==='slow-pbt'?'pbt':'generic',state=controller.snapshot();assert.equal(state.active,'generic');assert.equal(state.branches.find(item=>item.kind===branch).stage,'loading');assert.equal(state.branches.find(item=>item.kind!==branch).stage,'ready');
  assert.deepEqual(h.fixture.snapshot().calls.slice(-2).map(call=>call.path),['/apis/GetPBTElDetail','/apis/getGeoJsonInfo']);await h.send('/fixture/control',{action:'release'});assert.equal(await work,true);assert.equal(auth.length,0);assert.equal(h.fixture.snapshot().unexpected.length,0);
});
test('closed location owner suppresses delayed model publication without provider or camera access',async t=>{
  const h=await harness(t);await h.mode('slow-pbt');const context=await h.classify(),catalog=(await h.send('/api/catalog')).body.operations,changes=[];
  const controller=createScanLocationController({api:h.api,getOperations:()=>catalog,isCurrent:()=>true,onChange:state=>changes.push(state)}),work=controller.open({type:'PetaBidangElektronik',q:RAW,scanContextId:context},{});await pending(h);controller.reset();const before=changes.length;await h.send('/fixture/control',{action:'release'});assert.equal(await work,false);assert.equal(changes.length,before);assert.equal(controller.snapshot(),null);const evidence=h.fixture.snapshot();assert.equal(evidence.pendingResponses.length,0);assert.equal(evidence.unexpected.length,0);assert.equal(evidence.providerRequests,0);assert.equal(evidence.productionRequests,0);assert.equal(evidence.cameraAccessed,false);
});
