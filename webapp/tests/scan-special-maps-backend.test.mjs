import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';
import {createServer} from '../server.mjs';
import {decodeScanPbtEnvelope,decodeScanKkprEnvelope} from '../private/scan-map-response.mjs';

// Actual registry/client/HTTP handler, with loopback browser requests and an
// injected synthetic upstream. No real classification or provider is called.
const PBT='post-apis-getpbteldetail-d3d134',KKPR='post-apis-getkkprdetail-d311e8',CLASSIFY='post-apis-scandocument-d42440',GEO='get-apis-getgeojsoninfo-d39f1c';
const special=[['pbt',PBT,'apis/GetPBTElDetail'],['kkpr',KKPR,'apis/GetKKPRDetail']];
const token={tokenType:'Bearer',accessToken:'synthetic-map-access',refreshToken:'synthetic-map-refresh',expiredAt:4_000_000_000};
const configuration={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-map-application',reason:'synthetic only'};
const freshSession=()=>({active:true,user:{username:'synthetic-map-user'},tokens:{...token}});
const request=(path,patch={})=>({path,method:'POST',encoding:'form',auth:'session',body:{q:' original map +%:/ '},session:freshSession(),...patch});
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return{promise,resolve};};

async function fixture(t,responder=()=>Response.json({error:false,data:{}}),{now}={}){
 const calls=[],logs=[],sessions=new SessionStore();
 const server=createServer({configuration,sessions,...(now?{now}:{}),log:item=>logs.push(item),transport:async(url,init)=>{
  calls.push({url:new URL(url),...init});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-map-user',token:{...token}}});
  if(url.pathname==='/account/account_summary')return Response.json({error:false,data:{nama:'Captured Map Name',email:'fallback@example.invalid'}});
  if(url.pathname==='/apis/scanDocument')return Response.json({error:false,message:'Other',data:'not-the-original-map-q'});
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
 const login=()=>send('/api/login',{username:'synthetic-map-user',password:'synthetic-map-password'});
 const execute=(operationId,values,extra={})=>send('/api/execute',{operationId,values,...(operationId===CLASSIFY?{confirm:true}:{}),...extra});
 await login();
 const context=async q=>(await execute(CLASSIFY,{q})).result.result.scanContextId;
 return{calls,logs,send,execute,context,login,session:()=>[...sessions.sessions.values()].find(item=>item.user)};
}

test('existing special operations retain read contracts and permit empty q only through a validated Scan context',()=>{
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(op=>op.enabled).length,94);
 for(const [,id,path] of special){
  const op=OPERATIONS.find(item=>item.id===id);
  assert.equal(op.enabled,true);assert.equal(op.effect,'read');assert.equal(op.requiresConfirmation,false);
  assert.equal(op.path,path);assert.equal(op.auth,'session');assert.equal(op.encoding,'form');
  assert.throws(()=>prepareOperation(id,{q:''},{authenticated:true}),{code:'FIELD_REQUIRED'});
  const ordinary=prepareOperation(id,{q:'original'},{authenticated:true});
  assert.equal(ordinary.scanMapContextValidated,undefined);
  for(const q of ['', ' ', ' original +%:/?é😀 ']){
   const prepared=prepareOperation(id,{q},{authenticated:true,scanContext:{q,name:'captured'}});
   assert.deepEqual(prepared.body,{q});assert.deepEqual(prepared.query,{});
   assert.equal(prepared.scanMapContextValidated,true);assert.equal(prepared.scanContextValidated,undefined);
  }
  assert.throws(()=>prepareOperation(id,{q:'wrong'},{authenticated:true,scanContext:{q:'original',name:'captured'}}),{code:'SCAN_CONTEXT_INVALID'});
  for(const q of [null,1,[],{}])assert.throws(()=>prepareOperation(id,{q},{authenticated:true,scanContext:{q,name:'captured'}}),{code:'FIELD_REQUIRED'});
  assert.throws(()=>prepareOperation(id,{q:'original',name:'browser override'},{authenticated:true,scanContext:{q:'original',name:'captured'}}),{code:'UNKNOWN_FIELD'});
 }
 const geo=prepareOperation(GEO,{q:''},{authenticated:true,scanContext:{q:'',name:'captured'}});
 assert.equal(geo.scanContextValidated,true);assert.equal(geo.scanMapContextValidated,undefined);
});

for(const [kind,,path] of special)test(`${kind} exact client scope rejects extra fields, alternate clients and forged trusted scopes before transport`,async()=>{
 let count=0;const client=new ApiClient(configuration,{log(){},transport:async()=>{count++;return Response.json({error:false,data:{}});}});
 for(const patch of [{method:'GET'},{encoding:'json'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{path:'/'+path},{path:path+'?extra=1'},{path:path+'#fragment'},{query:{extra:''}},{query:[]},{body:null},{body:{q:3}},{body:{q:'original',name:'forged'}},{body:{q:'original',extra:''}},{body:{q:''}},{files:[{key:'file',file:new Blob(['synthetic'])}]}])await assert.rejects(client.request(request(path,patch)),{code:'SCAN_MAP_SCOPE'});
 await assert.rejects(client.request(request(path,{body:{get q(){throw new Error('must not invoke getter');}}})),{code:'SCAN_MAP_SCOPE'});
 for(const scanMapContextValidated of [null,1,'true'])await assert.rejects(client.request(request(path,{scanMapContextValidated})),{code:'SCAN_CONTEXT_SCOPE'});
 await assert.rejects(client.request(request(path,{scanContextValidated:true})),{code:'SCAN_CONTEXT_SCOPE'});
 await assert.rejects(client.request(request('apis/GetDocumentType',{scanMapContextValidated:true})),{code:'SCAN_CONTEXT_SCOPE'});
 assert.equal(count,0);
});

for(const [kind,id,path] of special)test(`${kind} handler preserves original q, carries no profile name and never reclassifies a special read`,async t=>{
 const f=await fixture(t);
 for(const q of ['', ' ', ' original +%:/?é😀 ']){
  const scanContextId=await f.context(q),before=f.calls.length;
  const reply=await f.execute(id,{q},{scanContextId});
  assert.equal(reply.status,200);assert.equal(reply.result.result.status,200);
  const calls=f.calls.slice(before);assert.equal(calls.length,1);
  assert.equal(calls[0].url.pathname,'/'+path);assert.equal(calls[0].url.search,'');
  assert.equal(calls[0].method,'POST');assert.deepEqual([...calls[0].body],[['q',q]]);
  assert.equal(calls[0].headers['Content-Type'],'application/x-www-form-urlencoded');
  assert.equal(calls[0].headers.Authorization,'Bearer synthetic-map-access');
 }
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/scanDocument').length,3);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/account/account_summary').length,3);
 for(const text of ['original','Captured Map Name','synthetic-map-access','synthetic-map-refresh'])assert.equal(JSON.stringify(f.logs).includes(text),false);
});

test('browser flags cannot forge an empty special-q context; mismatches, foreign contexts and CSRF fail before upstream',async t=>{
 const a=await fixture(t),b=await fixture(t),q='original',scanContextId=await a.context(q),before=a.calls.length;
 for(const [values,extra,code] of [[{q:''},{scanMapContextValidated:true},'FIELD_REQUIRED'],[{q:'wrong'},{scanContextId},'SCAN_CONTEXT_INVALID'],[{q},{scanContextId:'forged'},'SCAN_CONTEXT_INVALID'],[{q,name:'forged'},{scanContextId},'UNKNOWN_FIELD']])assert.equal((await a.execute(PBT,values,extra)).result.error.code,code);
 assert.equal(a.calls.length,before);
 const beforeB=b.calls.length;assert.equal((await b.execute(KKPR,{q},{scanContextId})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(b.calls.length,beforeB);
 assert.equal((await a.send('/api/execute',{operationId:PBT,values:{q},scanContextId},{'X-CSRF-Token':'wrong'})).status,403);
 assert.equal(a.calls.length,before);
});

test('special context reuse is bounded by TTL and logout without starting another classifier',async t=>{
 let clock=1_700_000_000_000;const f=await fixture(t,undefined,{now:()=>clock}),q='',scanContextId=await f.context(q);
 assert.equal((await f.execute(PBT,{q},{scanContextId})).status,200);
 assert.equal((await f.execute(KKPR,{q},{scanContextId})).status,200);
 const before=f.calls.length;clock+=120_000;
 assert.equal((await f.execute(PBT,{q},{scanContextId})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(f.calls.length,before);
 const renewed=await f.context(q);await f.send('/api/logout',{});await f.login();const afterLogin=f.calls.length;
 assert.equal((await f.execute(KKPR,{q},{scanContextId:renewed})).result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(f.calls.length,afterLogin);
});

for(const [kind,id,path] of special)test(`${kind} pending logout prevents a late typed model from publishing`,async t=>{
 const started=deferred(),release=deferred();
 const f=await fixture(t,async url=>{assert.equal(url.pathname,'/'+path);started.resolve();await release.promise;return Response.json({error:false,data:{}});});
 const q='original',scanContextId=await f.context(q),pending=f.execute(id,{q},{scanContextId});
 await started.promise;await f.send('/api/logout',{});release.resolve();
 const reply=await pending;assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/' + path).length,1);
});

test('delayed special 401 after a same-account refresh preserves login and context, never retries automatically',async t=>{
 const started=deferred(),release=deferred();let fail=true;
 const f=await fixture(t,async()=>{if(fail){started.resolve();await release.promise;return Response.json({error:true},{status:401});}return Response.json({error:false,data:{}});});
 const q='original',scanContextId=await f.context(q),session=f.session(),user=session.user,pending=f.execute(PBT,{q},{scanContextId});
 await started.promise;const newer={...token,accessToken:'synthetic-map-new-generation'};session.tokens=newer;release.resolve();
 const reply=await pending;assert.equal(reply.status,409);assert.equal(reply.result.error.code,'SESSION_CHANGED');
 assert.equal(session.tokens,newer);assert.equal(session.user,user);assert.equal(session.active,true);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/GetPBTElDetail').length,1);
 fail=false;assert.equal((await f.execute(PBT,{q},{scanContextId})).status,200);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/GetPBTElDetail').length,2);
 assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/scanDocument').length,1);
});

test('PBT typed nullable models discard unknown fields and preserve empty values and identity-coordinate children',()=>{
 const coordinates=[[[['not-yet-numeric',null,7]]],{notGeoJson:true},null,42],parcel={nib:'',lokasi:'',luas:'000.25',noBerkas:null,batas:{id:'',tipeHak:null,geometri:{type:'Unused',coordinates,ignored:'private'}}};
 const actual=decodeScanPbtEnvelope({error:false,message:'ignored',unknown:'discard',data:{nomor:'',kantor:null,daftarBidangTanah:[parcel],extra:true}});
 assert.deepEqual(actual,{error:false,data:{nomor:'',kantor:null,daftarBidangTanah:[{nib:'',lokasi:'',luas:'000.25',noBerkas:null,batas:{id:'',tipeHak:null,geometri:{type:'Unused',coordinates}}}]}});
 assert.equal(Object.hasOwn(actual.data.daftarBidangTanah[0].batas.geometri,'ignored'),false);
 assert.notEqual(actual.data.daftarBidangTanah[0].batas.geometri.coordinates,coordinates);
 assert.equal(actual.data.daftarBidangTanah[0].batas.geometri.coordinates[0],coordinates[0]);
 assert.equal(actual.data.daftarBidangTanah[0].batas.geometri.coordinates[1],coordinates[1]);
 for(const body of [{}, {error:null}, {data:null}, {error:true,data:{}}, {error:false,data:{}}]){
  assert.deepEqual(decodeScanPbtEnvelope(body),{error:body.error??true,data:{nomor:null,kantor:null,daftarBidangTanah:null}});
 }
 assert.deepEqual(decodeScanPbtEnvelope({error:false,data:{daftarBidangTanah:[{}]}}).data.daftarBidangTanah,[{nib:null,lokasi:null,luas:null,noBerkas:null,batas:null}]);
});

test('PBT decoder validates only proved model boundaries without coercing String area or deep geometry leaves',()=>{
 const malformed=[null,[],false,'{}',{error:'false'},{data:[]},{data:'{}'},{data:{nomor:1}},{data:{kantor:false}},{data:{daftarBidangTanah:{}}},{data:{daftarBidangTanah:[null]}},{data:{daftarBidangTanah:[{luas:1}]}},{data:{daftarBidangTanah:[{batas:[]}]}},{data:{daftarBidangTanah:[{batas:{id:3}}]}},{data:{daftarBidangTanah:[{batas:{geometri:{type:1}}}]}},{data:{daftarBidangTanah:[{batas:{geometri:{coordinates:{}}}}]}}];
 for(const body of malformed)assert.throws(()=>decodeScanPbtEnvelope(body),{code:'SCAN_PBT_UNRECOGNIZED'});
 let getterCalled=false;assert.throws(()=>decodeScanPbtEnvelope({error:false,get data(){getterCalled=true;return{};}}),{code:'SCAN_PBT_UNRECOGNIZED'});assert.equal(getterCalled,false);
 for(const type of ['MultiPolygon','Polygon','Other','']){
  const body={error:false,data:{daftarBidangTanah:[{batas:{geometri:{type,coordinates:[false,'bad',{},null]}}}]}};
  assert.deepEqual(decodeScanPbtEnvelope(body).data.daftarBidangTanah[0].batas.geometri,{type,coordinates:[false,'bad',{},null]});
 }
});

test('all nine nullable PBT String slots reject numeric values at their own nested boundary',()=>{
 const body={error:false,data:{nomor:'N',kantor:'K',daftarBidangTanah:[{nib:'NIB',lokasi:'L',luas:'1',noBerkas:'B',batas:{id:'ID',tipeHak:'HAK',geometri:{type:'MultiPolygon',coordinates:null}}}]}};
 const paths=[['nomor'],['kantor'],...['nib','lokasi','luas','noBerkas'].map(key=>['daftarBidangTanah',0,key]),...['id','tipeHak'].map(key=>['daftarBidangTanah',0,'batas',key]),['daftarBidangTanah',0,'batas','geometri','type']];
 for(const path of paths){
  const changed=structuredClone(body);let target=changed.data;
  for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=1;
  assert.throws(()=>decodeScanPbtEnvelope(changed),{code:'SCAN_PBT_UNRECOGNIZED'});
 }
});

test('PBT client returns typed error:true as a native tuple, never as a generic model or second-decoded String',async()=>{
 for(const error of [true,false,null]){
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error,data:{nomor:'raw number'},message:'ignored',privateUnknown:true})});
  const reply=await client.request(request('apis/GetPBTElDetail'));
  assert.deepEqual(reply.data,{error:error??true,data:{nomor:'raw number',kantor:null,daftarBidangTanah:null}});assert.equal(reply.status,200);
 }
 for(const body of [JSON.stringify({error:false,data:{}}),null,{error:false,data:{nomor:1}}]){
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json(body)});
  await assert.rejects(client.request(request('apis/GetPBTElDetail')),{code:'SCAN_PBT_UNRECOGNIZED'});
 }
});

for(const status of [201,403,503])test(`special HTTP${status} fails before typed publication`,async()=>{
 for(const [, ,path] of special){
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error:false,data:{}},{status})});
  await assert.rejects(client.request(request(path)),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status);
 }
});

test('special ordinary transport/parse failures are recoverable errors without fallback classification or automatic retry',async t=>{
 for(const failure of ['transport','malformed']){
  const f=await fixture(t,()=>{if(failure==='transport')throw Object.assign(new Error('must not leak raw network text'),{code:'ECONNRESET'});return new Response('{bad-json',{headers:{'Content-Type':'application/json'}});});
  const q='original',scanContextId=await f.context(q),before=f.calls.length,reply=await f.execute(PBT,{q},{scanContextId});
  assert.equal(reply.status,502);assert.equal(reply.result.error.code,failure==='transport'?'UPSTREAM_UNREACHABLE':'INVALID_UPSTREAM_JSON');
  assert.equal(reply.result.result,undefined);assert.equal(f.calls.length,before+1);assert.equal(f.session().user.username,'synthetic-map-user');
  assert.equal(JSON.stringify(reply).includes('must not leak raw network text'),false);
 }
});

test('genuine special 401 expires the session without returning a fallback model or retry',async t=>{
 const f=await fixture(t,()=>Response.json({error:false,data:{}},{status:401})),q='original',scanContextId=await f.context(q),session=f.session(),before=f.calls.length;
 const reply=await f.execute(KKPR,{q},{scanContextId});
 assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
 assert.equal(session.tokens,null);assert.equal(session.user,null);assert.equal(f.calls.length,before+1);
});

test('context expiry during a pending special read suppresses its late model while keeping login',async t=>{
 let clock=1_700_000_000_000;const started=deferred(),release=deferred();
 const f=await fixture(t,async()=>{started.resolve();await release.promise;return Response.json({error:false,data:{}});},{now:()=>clock});
 const q='original',scanContextId=await f.context(q),pending=f.execute(PBT,{q},{scanContextId});
 await started.promise;clock+=120_000;release.resolve();const reply=await pending;
 assert.equal(reply.status,409);assert.equal(reply.result.error.code,'SCAN_CONTEXT_INVALID');assert.equal(reply.result.result,undefined);
 assert.equal(f.session().user.username,'synthetic-map-user');assert.equal(f.calls.filter(call=>call.url.pathname==='/apis/scanDocument').length,1);
});

const namedValues=keys=>Object.fromEntries(keys.split(' ').map(key=>[key,`raw:${key}`]));
function kkprLeaves(){return{
 properties:{id:-1,total_polygons:0,total_area_m2:1.5,total_area_formatted:'001.50 m²',individual_areas:'not an array',area_m2:2,area_formatted:'002',created_at:'not parsed as date',polygon_label:'',itbx_status:'raw',geom_type:'batas',alashak_index:0,alashak_nomor:'0001',syarat:''},
 berkas:{rNumber:0.25,...namedValues('berkasId taskNodeId pemilikId'),nomor:-1,tahun:0,seq:2,statusBerkas:0,...namedValues('nomorTahun namaProsedur namaKantor namaProfile namaPegawai namaPemohon namaKuasa alamatPemohon keteranganStatusBerkas namaKabupaten namaProvinsi tanggalFlow statusJatuhTempo kategoriKKPR')},
 kkpr:{...namedValues('kkprId nomor jenisKKPR berkasId pemilikId namaPemohon npwpPemohon alamatPemohon teleponPemohon emailPemohon tanggalTerbit tanggalCetak pembuatDokumen jabatanTTD nipttd statusPM kodeKBLI judulKBLI skalaUsaha alamatUsaha provinsiId kabupatenId kecamatanId wilayahId namaDesa namaKecamatan namaKabupaten namaProvinsi hasilKKPR luasDimohon luasDisetujui jenisManfaatRuang koefDasar koefLantai koefDasarHijau indikasiUtama garisSempadan jarakBangunan koefTapak ketinggianBangunan jaringanUtilitas judulDelineasiKKPR indikasiZonasi layerBackground kategoriKKPR'),edisi:0.5,jenisEdisi:'',kodeUnik:'000',rNumber:2.5,total:3,pertimbangan:null},
 pemohon:namedValues('namaPemohon npwp alamatPemohon telepon email namaKuasa alamatKuasa'),
};}
function kkprBody(){
 const {properties,berkas,kkpr,pemohon}=kkprLeaves();
 return {error:false,data:{status:false,pesan:'',kkprId:'outer-kkpr',berkasId:'outer-berkas',kantorId:'',encryptedId:null,textualData:{pemohon,kkpr,berkas},geometryData:{type:'FeatureCollection',features:[{type:'Feature',properties,geometry:{type:'Other',coordinates:[[[['not numeric',null]]],{unchanged:true}]}}]}}};
}

test('KKPR preserves all94 native leaf slots, nullable payload status and raw coordinate children, dropping only unknown model fields',()=>{
 const input=kkprBody(),expected=structuredClone(input);
 input.unknown='discard';input.data.unknown=true;input.data.textualData.kkpr.unknown='discard';input.data.geometryData.features[0].properties.unknown='discard';
 const actual=decodeScanKkprEnvelope(input);assert.deepEqual(actual,expected);
 assert.deepEqual(Object.values(kkprLeaves()).map(model=>Object.keys(model).length),[14,22,51,7]);
 assert.equal(actual.data.status,false);assert.equal(actual.error,false);
 assert.equal(actual.data.geometryData.features[0].geometry.coordinates[1],input.data.geometryData.features[0].geometry.coordinates[1]);
});

test('KKPR defaults missing/null error and data while preserving null nested models and empty containers',()=>{
 const emptyModel={status:null,pesan:null,kkprId:null,berkasId:null,kantorId:null,encryptedId:null,textualData:null,geometryData:null};
 for(const input of [{}, {error:null}, {error:true,data:null}, {error:false,data:{}}])assert.deepEqual(decodeScanKkprEnvelope(input),{error:input.error??true,data:emptyModel});
 const actual=decodeScanKkprEnvelope({error:false,data:{textualData:{pemohon:{},kkpr:{},berkas:{}},geometryData:{features:[{properties:{},geometry:{}}]}}}).data;
 for(const model of Object.values(actual.textualData))assert.equal(Object.values(model).every(value=>value===null),true);
 assert.deepEqual(Object.keys(actual.textualData).map(key=>Object.keys(actual.textualData[key]).length),[7,51,22]);
 assert.equal(Object.keys(actual.geometryData.features[0].properties).length,14);
 assert.deepEqual(actual.geometryData.features[0].geometry,{type:null,coordinates:null});
 assert.deepEqual(decodeScanKkprEnvelope({error:false,data:{geometryData:{features:[]}}}).data.geometryData,{type:null,features:[]});
});

test('every KKPR nullable leaf rejects a wrong nonnull native type, including individual_areas String and all51 shuffled KKPR slots',()=>{
 const models=kkprLeaves();let checked=0;
 for(const [kind,model] of Object.entries(models))for(const [key,value] of Object.entries(model)){
  const body=kkprBody(),target=kind==='properties'?body.data.geometryData.features[0].properties:body.data.textualData[kind];
  target[key]=value===null?[]:typeof value==='string'?42:'1';
  assert.throws(()=>decodeScanKkprEnvelope(body),{code:'SCAN_KKPR_UNRECOGNIZED'},`${kind}.${key}`);checked++;
 }
 assert.equal(checked,94);
});

test('KKPR nested containers and top-level scalars have exact nullable boundaries without date/geometry coercion',()=>{
 const malformed=[null,[],false,'{}',{error:1},{data:[]},{data:{status:1}},{data:{pesan:1}},{data:{kkprId:1}},{data:{berkasId:1}},{data:{kantorId:1}},{data:{encryptedId:1}},{data:{textualData:[]}},{data:{textualData:{pemohon:[]}}},{data:{textualData:{kkpr:[]}}},{data:{textualData:{berkas:[]}}},{data:{geometryData:[]}},{data:{geometryData:{type:1}}},{data:{geometryData:{features:{}}}},{data:{geometryData:{features:[null]}}},{data:{geometryData:{features:[{type:1}]}}},{data:{geometryData:{features:[{properties:[]}]}}},{data:{geometryData:{features:[{geometry:[]}]}}},{data:{geometryData:{features:[{geometry:{type:false}}]}}},{data:{geometryData:{features:[{geometry:{coordinates:{}}}]}}}];
 for(const body of malformed)assert.throws(()=>decodeScanKkprEnvelope(body),{code:'SCAN_KKPR_UNRECOGNIZED'});
 let called=false;const body=kkprBody();Object.defineProperty(body.data.textualData.kkpr,'nomor',{get(){called=true;return'unsafe';}});
 assert.throws(()=>decodeScanKkprEnvelope(body),{code:'SCAN_KKPR_UNRECOGNIZED'});assert.equal(called,false);
});

test('KKPR pertimbangan has no JSON child mapping or empty-list exemption',()=>{
 for(const pertimbangan of [[],[{}],[null],{},'',false,1]){
  const body=kkprBody();body.data.textualData.kkpr.pertimbangan=pertimbangan;
  assert.throws(()=>decodeScanKkprEnvelope(body),{code:'SCAN_KKPR_UNRECOGNIZED'});
 }
 const body=kkprBody();body.data.textualData.kkpr.pertimbangan=null;
 assert.equal(decodeScanKkprEnvelope(body).data.textualData.kkpr.pertimbangan,null);
});

test('KKPR JSON numeric representation guards reject rounded integers and nonfinite numbers without String conversion',()=>{
 const body=kkprBody();body.data.geometryData.features[0].properties.id=Number.MAX_SAFE_INTEGER;
 assert.equal(decodeScanKkprEnvelope(body).data.geometryData.features[0].properties.id,Number.MAX_SAFE_INTEGER);
 for(const value of [1.5,Number.MAX_SAFE_INTEGER+1,'1',true]){
  const input=kkprBody();input.data.geometryData.features[0].properties.id=value;
  assert.throws(()=>decodeScanKkprEnvelope(input),{code:'SCAN_KKPR_UNRECOGNIZED'});
 }
 for(const value of [NaN,Infinity,-Infinity,'1',true]){
  const input=kkprBody();input.data.textualData.kkpr.total=value;
  assert.throws(()=>decodeScanKkprEnvelope(input),{code:'SCAN_KKPR_UNRECOGNIZED'});
 }
});

test('KKPR client accepts typed200 error:true as a tuple and rejects second-decoded Strings, unlike unrelated generic reads',async()=>{
 for(const error of [true,false,null]){
  const body=kkprBody();body.error=error;
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json(body)});
  const reply=await client.request(request('apis/GetKKPRDetail'));assert.equal(reply.status,200);assert.deepEqual(reply.data,{...body,error:error??true});
 }
 for(const body of [JSON.stringify(kkprBody()),null,{error:false,data:{textualData:{kkpr:{pertimbangan:[]}}}}]){
  const client=new ApiClient(configuration,{log(){},transport:async()=>Response.json(body)});
  await assert.rejects(client.request(request('apis/GetKKPRDetail')),{code:'SCAN_KKPR_UNRECOGNIZED'});
 }
 const other=new ApiClient(configuration,{log(){},transport:async()=>Response.json({error:true,data:{}})});
 await assert.rejects(other.request(request('apis/GetParcelBoundaryById')),{code:'UPSTREAM_REJECTED'});
});
