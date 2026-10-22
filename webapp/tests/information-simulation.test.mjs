import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation,getPublicCatalog} from '../private/operations.mjs';
import {createServer} from '../server.mjs';

const operation=type=>OPERATIONS.find(op=>op.path===`InfoLayanan/SimulasiTipe${type}`);
const fields={1:['WilayahId','Luas','Penggunaan','Prosedur'],2:['WilayahId','data'],3:['WilayahId','Luas','Penggunaan','LayananId'],4:['NilaiPerMeter','Luas'],5:['WilayahId','Luas','Penggunaan','Kewenangan'],6:['WilayahId','Luas','Penggunaan','Prosedur']};
const values=type=>type===2?{WilayahId:' REGION + & / ',data:[{Jumlah:'001',Luas:' 0012.50 ',Penggunaan:' Non Pertanian '},{Jumlah:' 2 ',Luas:'03',Penggunaan:'Pertanian'}]}:Object.fromEntries(fields[type].map(key=>[key,key==='Luas'?' 0012.50 ':key==='NilaiPerMeter'?'001234.50':` ${key} + & / é 🙂 " `]));
const plain=value=>JSON.parse(JSON.stringify(value));
const config={configured:true,reason:'synthetic only',applicationAuthorization:()=> 'AtrBpn fixture-application'};
const token={tokenType:'Bearer',accessToken:'fixture-simulation-token',refreshToken:'fixture-simulation-refresh',expiredAt:4_000_000_000};
const prepared=type=>prepareOperation(operation(type).id,values(type),{});

test('six simulation adapters keep explicit JSON main-service read contracts and their bounded schema beside the separate Rating String list',()=>{
 for(const type of [1,2,3,4,5,6]){
  const op=operation(type);assert.ok(op.enabled);assert.equal(op.effect,'read');assert.equal(op.mutates,false);assert.equal(op.requiresConfirmation,false);assert.equal(op.auth,'optionalSession');assert.equal(op.encoding,'json');assert.equal(op.serviceId,'main');assert.equal(op.method,'POST');assert.equal(op.serverAcceptance,'untested');assert.deepEqual(op.fields.map(field=>field.path),fields[type]);
  for(const field of op.fields.filter(field=>field.type!=='array'))assert.equal(field.strictString,true);
 }
 const arrays=OPERATIONS.flatMap(op=>op.enabled?op.fields.filter(field=>field.type==='array').map(field=>({op,field})):[]);
 assert.equal(arrays.length,2);assert.deepEqual(arrays.map(({op,field})=>[op.id,field.path,field.arraySchema]).sort((a,b)=>a[0].localeCompare(b[0])),[[operation(2).id,'data','information-simulation-type2'],['post-ratingppat-postratingppat-d86e10','PertanyaanRatingPPATId','rating-ppat-selected-answer-ids']].sort((a,b)=>a[0].localeCompare(b[0])));const simulationArray=arrays.find(({op})=>op.id===operation(2).id),ratingArray=arrays.find(({op})=>op.id==='post-ratingppat-postratingppat-d86e10');assert.equal(ratingArray.field.minItems,0);assert.deepEqual(ratingArray.field.items,{type:'string',strictString:true});assert.equal(ratingArray.op.auth,'session');assert.equal(ratingArray.op.requiresConfirmation,true);assert.equal(simulationArray.op.id,operation(2).id);assert.equal(simulationArray.field.path,'data');assert.equal(simulationArray.field.arraySchema,'information-simulation-type2');assert.equal(simulationArray.field.minItems,1);assert.equal(simulationArray.field.maxItems,100);assert.equal(simulationArray.field.items.additionalProperties,false);assert.deepEqual(simulationArray.field.items.fields.map(field=>field.path),['Jumlah','Luas','Penggunaan']);
 assert.ok(OPERATIONS.filter(op=>op.enabled).every(op=>!op.fields.some(field=>field.type==='object'||field.path.includes('[]'))));
 const publicSchema=getPublicCatalog().find(op=>op.id===operation(2).id).fields.find(field=>field.path==='data');assert.equal(publicSchema.maxItems,100);assert.ok(Object.isFrozen(simulationArray.field.items.fields));
});

test('all six native JSON bodies retain exact key case and raw strings on anonymous and session transport',async()=>{
 const calls=[];const client=new ApiClient(config,{log:()=>{},transport:async(url,init)=>{calls.push({url,init});return Response.json({error:false,data:{pengukuran:null,pendaftaran:null,pemeriksaanTanah:null,totalBiaya:'Rp fixture'}})}});
 for(const session of [undefined,{tokens:{...token}}])for(const type of [1,2,3,4,5,6]){
  const request=prepared(type);const result=await client.request({...request,base:request.service.baseUrl,session});const {url,init}=calls.at(-1);
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,`/InfoLayanan/SimulasiTipe${type}`);assert.equal(url.search,'');assert.equal(init.method,'POST');assert.equal(init.headers['Content-Type'],'application/json');assert.equal(init.headers.Accept,'application/json');assert.equal(init.headers.Authorization,session?'Bearer fixture-simulation-token':undefined);assert.equal(typeof init.body,'string');assert.deepEqual(JSON.parse(init.body),values(type));assert.deepEqual(Object.keys(JSON.parse(init.body)),fields[type]);assert.equal(result.status,200);
 }
 assert.equal(calls.length,12);
});

test('non-null selection strings and empty single-parcel Luas preserve native distinctions',()=>{
 for(const type of [1,3,5,6]){
  const input=values(type);input.Luas='';assert.deepEqual(plain(prepareOperation(operation(type).id,input,{}).body),input);
  const omitted={...input};delete omitted.Luas;assert.equal(prepareOperation(operation(type).id,omitted,{}).body.Luas,'');
  for(const key of fields[type].filter(key=>key!=='Luas')){assert.equal(prepareOperation(operation(type).id,{...input,[key]:''},{}).body[key],'');for(const bad of [null,undefined])assert.throws(()=>prepareOperation(operation(type).id,{...input,[key]:bad},{}),e=>e.code==='FIELD_REQUIRED')}
  assert.throws(()=>prepareOperation(operation(type).id,{...input,Luas:null},{}),e=>e.code==='FIELD_REQUIRED');
 }
 for(const key of fields[4]){for(const bad of ['',null,undefined])assert.throws(()=>prepareOperation(operation(4).id,{...values(4),[key]:bad},{}),e=>e.code==='FIELD_REQUIRED');assert.equal(prepareOperation(operation(4).id,{...values(4),[key]:'  '},{}).body[key],'  ','Native checks String length, not numeric conversion or trimming')}
});

test('simulation scalar fields reject numeric coercion unknown keys oversized text and NUL',()=>{
 for(const type of [1,3,4,5,6])for(const key of fields[type])for(const bad of [12,false,{},[],'x'.repeat(16001),'bad\0value'])assert.throws(()=>prepareOperation(operation(type).id,{...values(type),[key]:bad},{}),e=>e.code==='INVALID_FIELD',`${type}/${key}`);
 for(const type of [1,2,3,4,5,6])for(const key of ['url','headers','Authorization','wilayahId','__proto__','constructor','prototype'])assert.throws(()=>prepareOperation(operation(type).id,{...values(type),...JSON.parse(JSON.stringify({[key]:'unexpected'}))},{}),e=>e.code==='UNKNOWN_FIELD');
 assert.throws(()=>prepareOperation(operation(2).id,{...values(2),WilayahId:42},{}),e=>e.code==='INVALID_FIELD');
});

test('type2 rows validate exact non-null String fields and preserve input without mutation',()=>{
 const input=values(2),snapshot=JSON.stringify(input),output=prepareOperation(operation(2).id,input,{}).body;
 assert.equal(JSON.stringify(input),snapshot);assert.deepEqual(plain(output),input);assert.notEqual(output.data,input.data);assert.notEqual(output.data[0],input.data[0]);output.data[0].Jumlah='modified';assert.equal(input.data[0].Jumlah,'001');
 const row=input.data[0];
 for(const key of ['Jumlah','Luas'])for(const bad of ['',null,undefined])assert.throws(()=>prepareOperation(operation(2).id,{WilayahId:'',data:[{...row,[key]:bad}]},{}),e=>e.code==='FIELD_REQUIRED');
 assert.equal(prepareOperation(operation(2).id,{WilayahId:'',data:[{Jumlah:'  ',Luas:'  ',Penggunaan:''}]},{}).body.data[0].Penggunaan,'');
 for(const key of ['Jumlah','Luas','Penggunaan'])for(const bad of [1,false,{},[],'x'.repeat(16001),'bad\0text'])assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[{...row,[key]:bad}]},{}),e=>e.code==='INVALID_FIELD');
 for(const bad of [null,undefined])assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[{...row,Penggunaan:bad}]},{}),e=>e.code==='FIELD_REQUIRED');
});

test('type2 cannot become an opaque-object or prototype payload channel',()=>{
 const input=values(2),row=input.data[0];
 for(const key of ['extra','url','headers','data','data[].Jumlah','__proto__','constructor','prototype'])assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[{...row,...JSON.parse(JSON.stringify({[key]:{nested:'forbidden'}}))}]},{}),e=>e.code==='UNKNOWN_FIELD');
 for(const bad of [null,'row',1,true,[],Object.create({Jumlah:'1',Luas:'1',Penggunaan:'P'})])assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[bad]},{}),e=>e.code==='INVALID_FIELD');
 const symbolRow={...row,[Symbol('opaque')]:'forbidden'};assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[symbolRow]},{}),e=>e.code==='UNKNOWN_FIELD');
 for(const key of ['Jumlah','Luas','Penggunaan']){const missing={...row};delete missing[key];assert.throws(()=>prepareOperation(operation(2).id,{...input,data:[missing]},{}),e=>e.code==='FIELD_REQUIRED')}
 const other=OPERATIONS.find(op=>!op.enabled&&op.fields.some(field=>['array','object'].includes(field.type)));assert.ok(other);assert.throws(()=>prepareOperation(other.id,{},{}),e=>e.code==='OPERATION_INSPECT_ONLY');
});

test('type2 array bounds are explicit browser guards and sparse rows cannot serialize as null',()=>{
 const input=values(2),row=input.data[0];
 for(const data of [[],{},'[]',1,Array(1),Array.from({length:101},()=>({...row}))])assert.throws(()=>prepareOperation(operation(2).id,{...input,data},{}),e=>e.code==='INVALID_FIELD');
 assert.equal(prepareOperation(operation(2).id,{...input,data:Array.from({length:100},()=>({...row}))},{}).body.data.length,100);
 for(const data of [undefined,null,''])assert.throws(()=>prepareOperation(operation(2).id,{...input,data},{}),e=>e.code==='FIELD_REQUIRED');
});

test('simulation execution retains local Origin CSRF allowlist and validation before transport',async t=>{
 const calls=[];const server=createServer({configuration:config,log:()=>{},transport:async(url,init)=>{calls.push({url,init});return Response.json({error:false,data:{totalBiaya:'fixture estimate'}})}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve)}));
 const base=`http://127.0.0.1:${server.address().port}`;const bootstrap=await fetch(base+'/api/state'),cookie=bootstrap.headers.get('set-cookie').split(';')[0],state=await bootstrap.json();
 const post=(value,headers={})=>fetch(base+'/api/execute',{method:'POST',headers:{Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,'Content-Type':'application/json',...headers},body:JSON.stringify({operationId:operation(2).id,values:value})});
 assert.equal((await post(values(2),{Origin:'https://untrusted.example.invalid'})).status,403);assert.equal((await post(values(2),{'X-CSRF-Token':'invalid'})).status,403);assert.equal(calls.length,0);
 for(const value of [{...values(2),url:'https://untrusted.example.invalid/'},{...values(2),data:[{Jumlah:'1',Luas:'2',Penggunaan:'P',headers:{Authorization:'forbidden'}}]},{...values(2),data:[{Jumlah:1,Luas:'2',Penggunaan:'P'}]}]){assert.equal((await post(value)).status,400);assert.equal(calls.length,0)}
 const accepted=await post(values(2));assert.equal(accepted.status,200);assert.equal((await accepted.json()).result.data.data.totalBiaya,'fixture estimate');assert.equal(calls.length,1);assert.equal(calls[0].init.headers.Authorization,undefined);assert.equal(calls[0].init.headers['Content-Type'],'application/json');assert.deepEqual(JSON.parse(calls[0].init.body),values(2));
});
