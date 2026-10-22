import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createScanKkprFixture,scanKkprFixtureIds as ids} from './scan-kkpr-browser-fixture.mjs';
import {createScanLocationController,scanSpecialMapData} from '../scan-location.js';
const RAW='  KKPR:SINTETIS /?+%2F é🚩  ',digest=value=>createHash('sha256').update(value).digest('hex');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function harness(t){
 const fixture=createScanKkprFixture({port:0,receiptFile:null}),{base}=await fixture.start();t.after(()=>fixture.stop());
 const initial=await fetch(base+'/api/state'),cookie=initial.headers.get('set-cookie').split(';')[0],state=await initial.json();
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{Origin:base,'Content-Type':'application/json','X-CSRF-Token':state.csrfToken}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:response.status,body:await response.json()};}
 const execute=(operationId,values={},extra={})=>send('/api/execute',{operationId,values,...extra});
 const mode=value=>send('/fixture/control',{action:'mode',mode:value});
 const classify=async(q=RAW)=>{const reply=await execute(ids.classify,{q},{confirm:true});assert.equal(reply.status,200);assert.equal(reply.body.ok,true);return reply.body.result.scanContextId;};
 const read=(id,q,scanContextId)=>execute(id,{q},{scanContextId});
 const api=async(path,{body})=>{const reply=await send(path,body);if(reply.status!==200||reply.body.ok!==true)throw Object.assign(Error(reply.body.error?.message??'Synthetic failure'),{code:reply.body.error?.code});return reply.body;};
 return{fixture,base,send,execute,mode,classify,read,api,cookie,csrf:state.csrfToken};
}
const result=reply=>{assert.equal(reply.status,200,JSON.stringify(reply.body));assert.equal(reply.body.ok,true);return reply.body.result;};
async function pending(h){for(let i=0;i<200&&!h.fixture.snapshot().pendingResponses.length;i++)await tick();assert.equal(h.fixture.snapshot().pendingResponses.length,1);}
function noRemote(h){const evidence=h.fixture.snapshot();assert.equal(evidence.unexpected.length,0);assert.equal(evidence.productionRequests,0);assert.equal(evidence.providerRequests,0);assert.equal(evidence.cameraAccessed,false);assert.equal(evidence.calls.filter(call=>['/apis/getGeoJsonInfo','/apis/GetPBTElDetail','/legacy/GetParcelBoundaryById'].includes(call.path)).length,0);}

test('KKPR fixture exposes exactly eight known operations, classifier is sole write, and out-of-scope mutation never reaches transport',async t=>{
 const h=await harness(t),ops=(await h.send('/api/catalog')).body.operations;assert.deepEqual(new Set(ops.map(op=>op.id)),new Set(Object.values(ids)));assert.deepEqual(ops.filter(op=>op.effect==='write').map(op=>op.id),[ids.classify]);assert.equal((await h.execute('post-geotag-uploadgeotag-unused',{}, {confirm:true})).body.error.code,'FIXTURE_REJECTED');assert.equal(h.fixture.snapshot().calls.length,0);noRemote(h);
});
for(const q of ['', '   ',RAW])test(`real HTTP context preserves original q, profile snapshot, PDF/metadata and KKPR-only form (${JSON.stringify(q)})`,async t=>{
 const h=await harness(t),context=await h.classify(q),pdf=result(await h.read(ids.document,q,context)),metadata=result(await h.read(ids.metadata,q,context)),response=result(await h.read(ids.kkpr,q,context)),model=scanSpecialMapData(response);
 assert.equal(pdf.contentType,'application/pdf');assert.match(pdf.previewUrl,/^\/api\/preview\//);assert.equal(metadata.data.data.type,'KKPR');assert.equal(model.status,true);assert.equal(model.geometryData.features.length,5);assert.deepEqual(model.geometryData.features.map(item=>item.properties.id),[990,901,802,902,803]);
 assert.deepEqual([Object.keys(model.textualData.pemohon).length,Object.keys(model.textualData.berkas).length,Object.keys(model.textualData.kkpr).length,Object.keys(model.geometryData.features[1].properties).length],[7,22,51,14]);assert.equal(model.textualData.kkpr.pertimbangan,null);assert.equal(model.textualData.kkpr.edisi,1.5);
 const calls=h.fixture.snapshot().calls,special=calls.find(call=>call.path==='/apis/GetKKPRDetail');assert.deepEqual(special.fields,['q']);assert.deepEqual(special.queryKeys,[]);assert.equal(special.qSha256,digest(q));assert.equal(special.qCharacters,q.length);assert.deepEqual(calls.map(call=>call.path),['/account/account_summary','/apis/scanDocument','/apis/GetDocument','/apis/GetDocumentType','/apis/GetKKPRDetail']);noRemote(h);
});
test('browser cannot override captured name/q, forge map context, or attach a context to an unrelated operation',async t=>{
 const h=await harness(t),context=await h.classify(),before=h.fixture.snapshot().calls.length;assert.equal((await h.execute(ids.kkpr,{q:RAW,name:'forged'},{scanContextId:context})).body.error.code,'UNKNOWN_FIELD');assert.equal((await h.read(ids.kkpr,'changed',context)).body.error.code,'SCAN_CONTEXT_INVALID');assert.equal((await h.read(ids.kkpr,RAW,'forged-context')).body.error.code,'SCAN_CONTEXT_INVALID');assert.equal((await h.execute(ids.parcel,{persilid:'synthetic'},{scanContextId:context})).body.error.code,'SCAN_CONTEXT_SCOPE');assert.equal(h.fixture.snapshot().calls.length,before);noRemote(h);
});
test('real local Origin, CSRF and explicit classifier confirmation gates remain active',async t=>{
 const h=await harness(t);assert.equal((await h.execute(ids.classify,{q:RAW})).body.error.code,'CONFIRMATION_REQUIRED');assert.equal((await h.send('/api/execute',{operationId:ids.classify,values:{q:RAW},confirm:true},{'X-CSRF-Token':'invalid'})).status,403);assert.equal((await h.send('/api/execute',{operationId:ids.classify,values:{q:RAW},confirm:true},{Origin:'https://outside.invalid'})).status,403);assert.equal(h.fixture.snapshot().calls.length,0);noRemote(h);
});
test('KKPR native status:false is preserved and publishable when envelope error is false',async t=>{
 const h=await harness(t);await h.mode('kkpr-status-false');const context=await h.classify(),response=result(await h.read(ids.kkpr,RAW,context));assert.equal(scanSpecialMapData(response).status,false);assert.equal(response.data.error,false);noRemote(h);
});
test('envelope error:true stays typed but is rejected for map publication without logout',async t=>{
 const h=await harness(t);await h.mode('kkpr-error-true');const context=await h.classify(),response=result(await h.read(ids.kkpr,RAW,context));assert.equal(response.data.error,true);assert.equal(response.data.data.geometryData.features.length,5);assert.throws(()=>scanSpecialMapData(response),{code:'SCAN_MAP_UNAVAILABLE'});assert.equal((await h.send('/api/state')).body.authenticated,true);noRemote(h);
});
for(const mode of ['kkpr-201','kkpr-503'])test(`${mode} fails exact200 without logout, classifier retry, or generic fallback`,async t=>{
 const h=await harness(t);await h.mode(mode);const context=await h.classify(),response=await h.read(ids.kkpr,RAW,context);assert.equal(response.status,502);assert.equal(response.body.ok,false);assert.equal((await h.send('/api/state')).body.authenticated,true);assert.equal(h.fixture.snapshot().calls.filter(call=>call.path==='/apis/scanDocument').length,1);noRemote(h);
});
for(const mode of ['kkpr-null','kkpr-empty'])test(`${mode} preserves null/empty typed geometry rather than inventing a feature`,async t=>{
 const h=await harness(t);await h.mode(mode);const context=await h.classify(),model=scanSpecialMapData(result(await h.read(ids.kkpr,RAW,context)));if(mode==='kkpr-null'){assert.equal(model.geometryData,null);assert.equal(model.textualData,null);}else assert.deepEqual(model.geometryData.features,[]);noRemote(h);
});
test('active malformed numeric leaves survive typed decoding with textual/source data available for partial publication',async t=>{
 const h=await harness(t);await h.mode('kkpr-malformed');const context=await h.classify(),model=scanSpecialMapData(result(await h.read(ids.kkpr,RAW,context)));assert.equal(model.geometryData.features[2].geometry.coordinates[0][0][0],'MALFORMED ACTIVE COORDINATE SINTETIS');assert.equal(model.textualData.kkpr.nomor,'KKPR SINTETIS 001');assert.equal(model.geometryData.features[2].properties.id,802);assert.equal(model.geometryData.features[2].properties.alashak_index,73);noRemote(h);
});
test('first-batas MultiPolygon mode keeps mixed declared types/nesting and ignored izin data intact',async t=>{
 const h=await harness(t);await h.mode('kkpr-multipolygon');const context=await h.classify(),features=scanSpecialMapData(result(await h.read(ids.kkpr,RAW,context))).geometryData.features;assert.equal(features[0].geometry.type,'MultiPolygon');assert.equal(features[0].geometry.coordinates.length,2);assert.equal(features[1].geometry.type,'Polygon');assert.equal(typeof features[1].geometry.coordinates[0][0][0][0],'number');assert.equal(features[2].properties.geom_type,'batasizin');assert.equal(features[2].geometry.coordinates[0][0][0],'IGNORED IZIN MULTI BRANCH');noRemote(h);
});
test('case-mismatched and unclassified malformed coordinates are preserved independently of active geometry',async t=>{
 const h=await harness(t);await h.mode('kkpr-inactive-malformed');const context=await h.classify(),features=scanSpecialMapData(result(await h.read(ids.kkpr,RAW,context))).geometryData.features;assert.equal(features.length,6);assert.equal(features[5].properties.geom_type,'Batas');assert.deepEqual(features[5].geometry.coordinates,[{ignored:true}]);noRemote(h);
});
for(const [mode,success] of [['slow-kkpr',true],['slow-kkpr-error',false]])test(`${mode} captures its mode and starts only KKPR; explicit release determines isolated result`,async t=>{
 const h=await harness(t);await h.mode(mode);const context=await h.classify(),catalog=(await h.send('/api/catalog')).body.operations,controller=createScanLocationController({api:h.api,getOperations:()=>catalog,isCurrent:()=>true,validate:(_kind,res)=>scanSpecialMapData(res)}),work=controller.open({type:'KKPR',q:RAW,scanContextId:context},{});await pending(h);assert.deepEqual(controller.snapshot().branches.map(branch=>[branch.kind,branch.stage]),[['kkpr','loading']]);assert.equal(controller.snapshot().active,'kkpr');await h.mode('kkpr-error-true');await h.send('/fixture/control',{action:'release'});assert.equal(await work,success);assert.equal(controller.snapshot().branches[0].stage,success?'ready':'error');assert.equal(h.fixture.snapshot().pendingResponses.length,0);noRemote(h);
});
test('reset location owner ignores delayed KKPR publication while captured PDF and authenticated session survive',async t=>{
 const h=await harness(t);await h.mode('slow-kkpr');const context=await h.classify();const pdf=result(await h.read(ids.document,RAW,context)),catalog=(await h.send('/api/catalog')).body.operations,changes=[];const controller=createScanLocationController({api:h.api,getOperations:()=>catalog,isCurrent:()=>true,onChange:state=>changes.push(state)}),work=controller.open({type:'KKPR',q:RAW,scanContextId:context},{});await pending(h);controller.reset();const before=changes.length;await h.send('/fixture/control',{action:'release'});assert.equal(await work,false);assert.equal(controller.snapshot(),null);assert.equal(changes.length,before);assert.equal((await fetch(h.base+pdf.previewUrl,{headers:{Cookie:h.cookie}})).status,200);assert.equal((await h.send('/api/state')).body.authenticated,true);noRemote(h);
});
test('replaced session identity prevents delayed special map data from crossing the captured account boundary',async t=>{
 const h=await harness(t);await h.mode('slow-kkpr');const context=await h.classify(),work=h.read(ids.kkpr,RAW,context);await pending(h);await h.send('/fixture/control',{action:'replace-user'});await h.send('/fixture/control',{action:'release'});const reply=await work;assert.equal(reply.status,409);assert.equal(reply.body.error.code,'SCAN_CONTEXT_INVALID');assert.equal(reply.body.result,undefined);assert.equal((await h.send('/api/state')).body.authenticated,true);noRemote(h);
});
test('metadata error:true keeps typed KKPR destination; no-route and ordinary metadata failure remain distinct',async t=>{
 const h=await harness(t),context=await h.classify();await h.mode('metadata-error-true');const meta=result(await h.read(ids.metadata,RAW,context));assert.equal(meta.data.error,true);assert.deepEqual(meta.data.data,{showRoute:1,type:'KKPR'});await h.mode('metadata-no-route');assert.equal(result(await h.read(ids.metadata,RAW,context)).data.data.showRoute,0);await h.mode('metadata-503');assert.equal((await h.read(ids.metadata,RAW,context)).status,502);noRemote(h);
});
test('fixture receipt excludes raw code, context, credentials and synthetic profile identity while keeping code hash',async t=>{
 const h=await harness(t),context=await h.classify();result(await h.read(ids.kkpr,RAW,context));const snapshot=h.fixture.snapshot(),text=JSON.stringify(snapshot);for(const secret of [RAW,context,h.cookie,h.csrf,'scan-fixture-token-never-real','scan-signin-nik-synthetic','scan-user-synthetic','Pemindai A SINTETIS','scan-a@example.invalid'])assert.equal(text.includes(secret),false,secret);assert.equal(snapshot.calls.find(call=>call.path==='/apis/GetKKPRDetail').qSha256,digest(RAW));noRemote(h);
});
function crc32(bytes){let n=0xffffffff;for(const byte of bytes){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
test('browser controls are local, camera/GPS blocked, and both raster paths return valid PNG bytes without altering production module',async t=>{
 const h=await harness(t),html=await fetch(h.base+'/');assert.match(html.headers.get('permissions-policy'),/camera=\(\).*geolocation=\(\)/);assert.equal(html.headers.get('content-security-policy').includes('connect-src \'self\''),true);assert.match(await html.text(),/fixture\/controls.js/);const script=await(await fetch(h.base+'/fixture/controls.js')).text(),css=await(await fetch(h.base+'/fixture/controls.css')).text();assert.match(script,/KKPR · SINTETIS LOKAL/);assert.match(script,/kkpr-multipolygon/);assert.match(css,/body>#fixture-controls\{margin-left:calc\(var\(--sidebar,252px\) \+ 12px\)\}/);
 const original=fs.readFileSync(new URL('../assets/maps/official-map.js',import.meta.url),'utf8'),served=await(await fetch(h.base+'/assets/maps/official-map.js')).text();assert.equal(served,original.replace('https://tile.openstreetmap.org/{z}/{x}/{y}.png','/fixture/osm/{z}/{x}/{y}.png'));
 for(const path of ['/fixture/osm/19/1/2.png','/api/maps/bhumi/19/1/2.png']){const response=await fetch(h.base+path),bytes=Buffer.from(await response.arrayBuffer());assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);const compressed=[];for(let offset=8;offset<bytes.length;){const length=bytes.readUInt32BE(offset),type=bytes.subarray(offset+4,offset+8),data=bytes.subarray(offset+8,offset+8+length);assert.equal(bytes.readUInt32BE(offset+8+length),crc32(Buffer.concat([type,data])));if(type.toString()==='IDAT')compressed.push(data);offset+=length+12;}assert.deepEqual([...zlib.inflateSync(Buffer.concat(compressed))],[0,214,225,212,255]);}noRemote(h);
});
