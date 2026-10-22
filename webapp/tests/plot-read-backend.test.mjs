import test from 'node:test';
import assert from 'node:assert/strict';
import {decodePlotListJson as plots,decodePlotDetailJson as detail} from '../private/plot-read-response.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {SessionStore} from '../private/session.mjs';

// Offline contract fixtures only: XQb reads are not personal Swaplotting uploads.
const L='post-plotbidang-daftarplot-ddbb60',D='post-plotbidang-getdetail-dd980c';
const row={plotId:' returned plot +& ',nup:' NUP ',wilayah:' Region ',statusVerifikasi:2,statusTerdaftar:1,tanggal:'raw date, no DateTime parse'};
const stringKeys=['nup','wilayahId','wilayah','kantorId','kantor','alamat','jenisHakId','jenisHak','nomorHak','keterangan','nib','nibel','penguasaan','pemilikan','pemanfaatan','penggunaan','permasalahan','reviu','rutr','batasUtara','batasTimur','batasSelatan','batasBarat'];
const nullModel={nup:null,jenisInstansi:null,wilayahId:null,wilayah:null,kantorId:null,kantor:null,alamat:null,jenisHakId:null,jenisHak:null,nomorHak:null,statusVerifikasi:null,keterangan:null,nib:null,nibel:null,penguasaan:null,pemilikan:null,pemanfaatan:null,penggunaan:null,permasalahan:null,luas:null,luasDelineasi:null,reviu:null,rutr:null,batasUtara:null,batasTimur:null,batasSelatan:null,batasBarat:null};
const contracts=[[L,'PlotBidang/DaftarPlot',{},'none'],[D,'PlotBidang/GetDetail',{id:' returned plot +&/%é😀 '},'multipart']];
const token={tokenType:'Bearer',accessToken:'synthetic-plot-access',refreshToken:'synthetic-plot-refresh',expiredAt:4_000_000_000};
const config={configured:true,applicationAuthorization:()=> 'AtrBpn synthetic-plot-application',reason:'synthetic only'};
const session=()=>({active:true,user:{username:'synthetic-plot-user'},tokens:{...token}});
const json=JSON.stringify;
const success=data=>json({error:false,data});
const defer=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};
const request=(path,body,encoding,patch={})=>({path,body,encoding,method:'POST',auth:'session',session:session(),...patch});

test('two existing read catalog records stay enabled with176 total entries and separately scoped personal uploads beside disabled institutional writers',()=>{
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(o=>o.enabled).length,94);
 for(const [id,path,,encoding]of contracts){const o=OPERATIONS.find(o=>o.id===id);assert.equal(o.path,path);assert.equal(o.method,'POST');assert.equal(o.serviceId,'main');assert.equal(o.auth,'session');assert.equal(o.encoding,encoding);assert.equal(o.effect,'read');assert.equal(o.enabled,true);assert.equal(o.serverAcceptance,'untested');assert.equal(o.requiresConfirmation,false);}
 for(const o of OPERATIONS.filter(o=>/Swaplotting(?:Terdaftar|BelumTerdaftar)|Instansi(?:Bersertipikat|BelumBersertipikat)/.test(o.path))){const personal=['post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8'].includes(o.id);assert.equal(o.enabled,personal,o.id);if(personal){assert.equal(o.clientProfile,'swaplotting-post');assert.equal(o.requiresConfirmation,true);assert.throws(()=>prepareOperation(o.id,{namapemilik:'forged',lat:'1',lon:'2'},{authenticated:true}),{code:'SWAPLOTTING_SUBMIT_SCOPE'});}}
 assert.equal(OPERATIONS.find(o=>o.id==='post-geotag-uploadgeotag-d96b98').enabled,false);
});

for(const [name,parse,good]of [['list',plots,[]],['detail',detail,{}]]){
 test(`${name} requires one JSON Map with a nonnull error bool and never unwraps another JSON String`,()=>{
  for(const text of ['null','[]','"{}"','not-json','{}','{"Error":false,"data":{}}',...['null','0','1','"false"','[]','{}'].map(v=>' {"error":'+v+',"data":'+json(good)+'}')])assert.throws(()=>parse(text),{code:'PLOT_READ_RESPONSE_UNRECOGNIZED'});
  for(const text of ['{"error":true}','{"error":true,"data":null}','{"error":true,"data":[false],"message":{"invalid":"ignored"}}'])assert.deepEqual(parse(text),{error:true,data:null});
  assert.throws(()=>parse('{"error":false}'));
  assert.throws(()=>parse(json({error:false,data:json(good)})));
  for(const value of [undefined,null,{},[],1,true])assert.throws(()=>parse(value));
 });
}
test('WQb materializes all six required fields, preserves raw Strings and allows an empty list',()=>{
 assert.deepEqual(plots(success([])),{error:false,data:[]});
 assert.deepEqual(plots(success([{...row,unknown:'discard',message:23,data:'discard'},{...row,plotId:'',tanggal:''}])),{error:false,data:[row,{...row,plotId:'',tanggal:''}]});
 for(const value of [null,{},1,'[]'])assert.throws(()=>plots(success(value)));
 for(const value of [null,[],true,'row'])assert.throws(()=>plots(success([row,value])));
});
test('WQb missing/null or wrong types reject the entire list, without aliases or coercion',()=>{
 for(const key of Object.keys(row)){
  const missing={...row};delete missing[key];assert.throws(()=>plots(success([missing])));
  for(const value of [null,true,{},[]])assert.throws(()=>plots(success([{...row,[key]:value}])));
 }
 for(const key of ['plotId','nup','wilayah','tanggal'])assert.throws(()=>plots(success([{...row,[key]:1}])));
 for(const key of ['statusVerifikasi','statusTerdaftar'])for(const value of ['1',false])assert.throws(()=>plots(success([{...row,[key]:value}])));
 assert.throws(()=>plots(success([{...row,plotId:undefined,PlotId:'wrong case'}])));
});
test('WQb signed64 ints retain exact values and reject JSON double tokens in required int fields',()=>{
 const base=success([row]);
 for(const key of ['statusVerifikasi','statusTerdaftar']){
  for(const value of ['0','-0','9007199254740991','-9007199254740991','9007199254740992','-9007199254740992','9223372036854775807','-9223372036854775808']){
   const result=plots(base.replace('"'+key+'":'+row[key],'"'+key+'":'+value)).data[0][key];
   assert.equal(result,BigInt(value)<BigInt(Number.MIN_SAFE_INTEGER)||BigInt(value)>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(value).toString():Number(BigInt(value)));
  }
  for(const value of ['1.0','1e0','1.25','9223372036854775808','-9223372036854775809','123456789012345678901234567890'])assert.throws(()=>plots(base.replace('"'+key+'":'+row[key],'"'+key+'":'+value)));
 }
});
test('UQb returns exactly27 nullable metadata fields, retaining missing/null and ignoring unrelated keys',()=>{
 assert.deepEqual(detail(success({})),{error:false,data:nullModel});assert.equal(Object.keys(nullModel).length,27);
 const values=Object.fromEntries(stringKeys.map(key=>[key,' raw '+key+' ']));Object.assign(values,{jenisInstansi:3,statusVerifikasi:0,luas:123.5,luasDelineasi:0});
 assert.deepEqual(detail(success({...values,unknown:'discard',error:true,data:{},message:'ignored',geometry:{type:'fake'}})),{error:false,data:{...nullModel,...values}});
 assert.deepEqual(detail(success(nullModel)),{error:false,data:nullModel});
 for(const value of [null,[],true,1,'{}'])assert.throws(()=>detail(success(value)));
});
test('UQb nullable Strings are strict, case-sensitive and never converted from identifiers or booleans',()=>{
 for(const key of stringKeys)for(const value of [1,false,[],{}])assert.throws(()=>detail(success({[key]:value})));
 assert.deepEqual(detail(success({Nup:'wrong case',StatusVerifikasi:1,Luas:10})),{error:false,data:nullModel});
});
test('UQb nullable int fields reject double tokens while num fields accept finite doubles and safe signed64 adaptation',()=>{
 for(const key of ['jenisInstansi','statusVerifikasi','luas','luasDelineasi']){
  for(const value of ['9223372036854775807','-9223372036854775808','9007199254740992'])assert.equal(detail('{"error":false,"data":{"'+key+'":'+value+'}}').data[key],value);
  for(const value of ['"1"','true','[]','{}'])assert.throws(()=>detail('{"error":false,"data":{"'+key+'":'+value+'}}'));
 }
 for(const key of ['jenisInstansi','statusVerifikasi'])for(const value of ['1.0','1e0','1.25','9223372036854775808','-9223372036854775809'])assert.throws(()=>detail('{"error":false,"data":{"'+key+'":'+value+'}}'));
 for(const key of ['luas','luasDelineasi']){
  for(const value of ['1.0','1e0','-1.25','1e100','-0.0'])assert.equal(detail('{"error":false,"data":{"'+key+'":'+value+'}}').data[key],Number(value));
  // Official Dart3.12.2 source corroborates JSON signed64 overflow→double.
  for(const value of ['9223372036854775808','-9223372036854775809','123456789012345678901234567890'])assert.equal(detail('{"error":false,"data":{"'+key+'":'+value+'}}').data[key],Number(value));
  for(const value of ['1e999','-1e999'])assert.throws(()=>detail('{"error":false,"data":{"'+key+'":'+value+'}}'),{code:'UNSUPPORTED_PLOT_NUMBER'});
 }
});
test('delineasi validation is optional but discarded, never promoted to a retained polygon or metadata geometry',()=>{
 for(const delineasi of [undefined,null,{type:'Polygon',coordinates:[]},{type:' arbitrary native String ',coordinates:[[],[[]],[[1,2,' +.5e2 ', '-0.0']]],unrelated:{invalid:true}}]){
  const parsed=detail(success({delineasi}));assert.deepEqual(parsed,{error:false,data:nullModel});assert.equal(Object.hasOwn(parsed.data,'delineasi'),false);assert.equal(Object.hasOwn(parsed.data,'coordinates'),false);
 }
 // No geographic range, ring closure, coordinate order or nonempty rule is invented.
 assert.deepEqual(detail(success({delineasi:{type:'not-a-GeoJSON-type',coordinates:[[[1000,-2000,1]]],crs:null}})),{error:false,data:nullModel});
});
test('nonnull delineasi requires native Map/String/three list levels; a malformed discarded geometry still rejects detail',()=>{
 for(const delineasi of [[],true,'{}',{}, {type:null,coordinates:[]},{type:1,coordinates:[]},{type:'Polygon'},{type:'Polygon',coordinates:null},{type:'Polygon',coordinates:[1]},{type:'Polygon',coordinates:[[1]]},{type:'Polygon',coordinates:[[[[1]]]]}])assert.throws(()=>detail(success({delineasi})));
 for(const value of [null,false,{},[],'','  ','bad','0x10','1,5','nan','infinity','NaNx','Infinityx'])assert.throws(()=>detail(success({delineasi:{type:'Polygon',coordinates:[[[value]]]}})));
 for(const value of ['1e999','-1e999'])assert.deepEqual(detail('{"error":false,"data":{"delineasi":{"type":"Polygon","coordinates":[[['+value+']]]}}}'),{error:false,data:nullModel});
 assert.deepEqual(detail('{"error":true,"data":{"delineasi":false}}'),{error:true,data:null});
});
test('discarded delineasi accepts native Unicode edge whitespace and explicit nonfinite parse successes',()=>{
 const whitespace=['\u0009','\u000a','\u000b','\u000c','\u000d',' ','\u0085','\u00a0','\u1680',...Array.from({length:11},(_,i)=>String.fromCharCode(0x2000+i)),'\u2028','\u2029','\u202f','\u205f','\u3000','\ufeff'];
 for(const edge of whitespace)for(const leaf of ['1.5','Infinity','-Infinity','NaN','-NaN','1e999'])assert.deepEqual(detail(success({delineasi:{type:'Polygon',coordinates:[[[edge+leaf+edge]]]}})),{error:false,data:nullModel});
 for(const leaf of ['1\u00852','\u180e1','1\u200b','+NaN','+Infinity'])assert.throws(()=>detail(success({delineasi:{type:'Polygon',coordinates:[[[leaf]]]}})));
});

for(const [id,path,values,encoding]of contracts){
 test(`${path} preparation keeps its original read contract and accepts no new identity, location or destination input`,()=>{
  const p=prepareOperation(id,values,{authenticated:true});assert.equal(p.path,path);assert.equal(p.encoding,encoding);assert.equal(p.auth,'session');assert.deepEqual({...p.body},values);assert.deepEqual({...p.query},{});assert.deepEqual(p.files,[]);
  assert.throws(()=>prepareOperation(id,values,{}),{code:'LOGIN_REQUIRED'});
  for(const key of ['nik','latitude','longitude','IsOffline','base','url','headers','Authorization'])assert.throws(()=>prepareOperation(id,{...values,[key]:'forged'},{authenticated:true}),{code:'UNKNOWN_FIELD'});
 });
 test(`${path} transport uses fixed main POST and shared account auth with exact native body shape`,async()=>{
  let count=0;const client=new ApiClient(config,{log(){},transport:async(url,init)=>{count++;assert.equal(url.href,'https://sentuh.atrbpn.go.id/'+path);assert.equal(init.method,'POST');assert.equal(init.headers.Authorization,'Bearer synthetic-plot-access');assert.equal(init.headers.Accept,'application/json');
   if(id===L){assert.equal(init.body,undefined);assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');}
   else {assert.ok(init.body instanceof FormData);assert.deepEqual([...init.body],[['id',values.id]]);assert.equal(init.headers['Content-Type'],undefined);}
   return new Response(success(id===L?[row]:{}),{headers:{'Content-Type':'application/json'}});
  }});const result=await client.request(request(path,values,encoding));assert.equal(count,1);assert.equal(result.status,200);assert.deepEqual(result.data,{error:false,data:id===L?[row]:nullModel});
 });
 test(`${path} scope rejects alternate origin/path/query/body/files/client/auth before any transport`,async()=>{
  let count=0;const client=new ApiClient(config,{log(){},transport:async()=>{count++;return Response.json({});}});
  for(const patch of [{base:'https://aplikasi.atrbpn.go.id/'},{base:'https://sentuh.atrbpn.go.id/alternate/'},{path:'/'+path},{path:path+'?injected=1'},{path:path+'#fragment'},{method:'GET'},{encoding:'form'},{auth:'none'},{auth:'optionalSession'},{clientProfile:'sps-document-viewer'},{body:null},{body:[]},{body:{...values,extra:''}},{files:[{}]},{files:null},{query:null},{query:[]},{query:{nik:'forged'}}])await assert.rejects(client.request(request(path,values,encoding,patch)),{code:'PLOT_READ_SCOPE'});
  const body={...values};Object.defineProperty(body,'id',{get(){throw Error('body getter invoked');}});await assert.rejects(client.request(request(path,body,encoding)),{code:'PLOT_READ_SCOPE'});
  const query={};Object.defineProperty(query,'unexpected',{get(){throw Error('query getter invoked');}});await assert.rejects(client.request(request(path,values,encoding,{query})),{code:'PLOT_READ_SCOPE'});
  await assert.rejects(client.request(request(path,{...values,[Symbol('hidden')]:'extra'},encoding)),{code:'PLOT_READ_SCOPE'});
  if(id===D)for(const body of [{},{id:null},{id:1},{id:{}},{id:[]}])await assert.rejects(client.request(request(path,body,encoding)),{code:'PLOT_READ_SCOPE'});
  assert.equal(count,0);
 });
 test(`${path} accepts HTTP200 native error:true without requiring data and rejects every non200 success status`,async()=>{
  const nativeError=new ApiClient(config,{log(){},transport:async()=>Response.json({error:true,data:false,message:'not published'})});assert.deepEqual((await nativeError.request(request(path,values,encoding))).data,{error:true,data:null});
  for(const status of [201,202,204,206,400,403,500]){
   const client=new ApiClient(config,{log(){},transport:async()=>new Response(status===204?null:'malformed private body',{status})});
   await assert.rejects(client.request(request(path,values,encoding)),error=>error.code==='UPSTREAM_REJECTED'&&error.details.upstreamStatus===status);
  }
 });
 test(`${path} malformed200 and binary content never fall back to untyped generic data`,async()=>{
  for(const body of ['not-json','%PDF-private','{"data":[]}','{"error":false,"data":null}','"{\\"error\\":true}"']){
   const client=new ApiClient(config,{log(){},transport:async()=>new Response(body,{headers:{'Content-Type':'application/octet-stream'}})});await assert.rejects(client.request(request(path,values,encoding)),{code:'PLOT_READ_RESPONSE_UNRECOGNIZED'});
  }
 });
}

test('read redirects/network errors preserve shared transport and exclude identifiers, credentials and arbitrary error text from logs',async()=>{
 const logs=[];for(const responder of [()=>new Response(null,{status:302,headers:{Location:'https://private.invalid/plot'}}),()=>{throw Object.assign(Error('synthetic-plot-access private-id raw error'),{code:'ENOTFOUND'});}]){
  const client=new ApiClient(config,{log:e=>logs.push(e),transport:responder});await assert.rejects(client.request(request(contracts[1][1],contracts[1][2],'multipart')),error=>['UPSTREAM_REDIRECT','UPSTREAM_UNREACHABLE'].includes(error.code));
 }
 for(const value of [contracts[1][2].id,'synthetic-plot-access','synthetic-plot-refresh','private.invalid','raw error'])assert.equal(json(logs).includes(value),false);
});
test('HTTP401 clears only the credential generation owned by the read',async()=>{
 const owned=session(),old=session();const client=new ApiClient(config,{log(){},transport:async()=>new Response('private malformed401',{status:401})});await assert.rejects(client.request(request(contracts[0][1],{},'none',{session:owned})),{code:'SESSION_EXPIRED'});assert.equal(owned.tokens,null);
 const newer=new ApiClient(config,{log(){},transport:async()=>{old.tokens={...token,accessToken:'new-generation'};return new Response('',{status:401});}});await assert.rejects(newer.request(request(contracts[1][1],contracts[1][2],'multipart',{session:old})),{code:'SESSION_CHANGED'});assert.equal(old.tokens.accessToken,'new-generation');
});

async function fixture(t,responder=url=>Response.json({error:false,data:url.pathname.endsWith('/DaftarPlot')?[row]:{}}),{expired=false}={}){
 const {createServer}=await import('../server.mjs');
 const calls=[],logs=[],sessions=new SessionStore();const server=createServer({configuration:config,sessions,log:e=>logs.push(e),transport:async(url,init)=>{
  calls.push({url:new URL(url),init});if(url.pathname==='/auth/signin')return Response.json({data:{username:'synthetic-plot-user',token:{...token,expiredAt:expired?1:token.expiredAt}}});
  if(url.pathname==='/auth/refresh_token')return Response.json({data:{...token,accessToken:'synthetic-plot-refreshed'}});return responder(url,init);
 }});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='',state;
 async function send(path,body,headers={}){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:base,'X-CSRF-Token':state?.csrfToken??'','Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:json(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const result=await response.json();if(result.csrfToken)state=result;return {status:response.status,result};}
 await send('/api/state');return {calls,logs,send,login:()=>send('/api/login',{username:'synthetic-plot-user',password:'synthetic-plot-password'}),run:(id,values)=>send('/api/execute',{operationId:id,values})};
}
test('HTTP execution requires session, Origin and CSRF; forged identity/location or origin fields never reach upstream',async t=>{
 const f=await fixture(t);assert.equal((await f.run(L,{})).status,401);await f.login();const before=f.calls.length;
 for(const [id,,values]of contracts)for(const key of ['nik','latitude','longitude','IsOffline','headers','base'])assert.equal((await f.run(id,{...values,[key]:'forged'})).status,400);
 for(const headers of [{Origin:'https://other.invalid'},{'X-CSRF-Token':'wrong'}])assert.equal((await f.send('/api/execute',{operationId:L,values:{}},headers)).status,403);
 assert.equal(f.calls.length,before);
});
test('HTTP reads deliver only typed WQb/UQb data and retain the original returned plot ID for multipart detail',async t=>{
 const f=await fixture(t,url=>Response.json({error:false,data:url.pathname.endsWith('/DaftarPlot')?[{...row,unknown:'discard'}]:{nup:' own detail ',delineasi:{type:'Polygon',coordinates:[[[1,2]]]}}}));await f.login();
 const list=await f.run(L,{});assert.equal(list.status,200);assert.deepEqual(list.result.result.data,{error:false,data:[row]});
 const found=await f.run(D,{id:list.result.result.data.data[0].plotId});assert.equal(found.status,200);assert.deepEqual(found.result.result.data,{error:false,data:{...nullModel,nup:' own detail '}});assert.deepEqual([...f.calls.at(-1).init.body],[['id',row.plotId]]);
 assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/PlotBidang/DaftarPlot','/PlotBidang/GetDetail']);
});
test('HTTP main refresh precedes a read; current request credentials never appear in typed results or diagnostic logs',async t=>{
 const f=await fixture(t,()=>new Response('{"error":false,"data":{"nup":"synthetic-plot-refreshed synthetic-plot-refresh","jenisInstansi":9223372036854775807,"accessToken":"discard"}}'),{expired:true});await f.login();const result=await f.run(D,{id:'opaque-id'});assert.equal(result.status,200);assert.equal(result.result.result.data.data.nup,'[REDACTED] [REDACTED]');assert.equal(result.result.result.data.data.jenisInstansi,'9223372036854775807');assert.equal(Object.hasOwn(result.result.result.data.data,'accessToken'),false);
 assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/auth/refresh_token','/PlotBidang/GetDetail']);assert.equal(f.calls.at(-1).init.headers.Authorization,'Bearer synthetic-plot-refreshed');
 for(const value of ['synthetic-plot-access','synthetic-plot-refresh','synthetic-plot-refreshed','opaque-id'])assert.equal(json(f.logs).includes(value),false);
});
test('HTTP unrefreshed read redacts both original request access and refresh credentials',async t=>{
 const f=await fixture(t,()=>Response.json({error:false,data:{nup:'synthetic-plot-access synthetic-plot-refresh'}}));await f.login();const result=await f.run(D,{id:'opaque-original'});assert.equal(result.status,200);assert.equal(result.result.result.data.data.nup,'[REDACTED] [REDACTED]');assert.deepEqual(f.calls.map(c=>c.url.pathname),['/auth/signin','/PlotBidang/GetDetail']);
});
for(const [id,path,values]of contracts)test(`${path} pending logout suppresses a late typed model`,async t=>{
 const started=defer(),release=defer();const f=await fixture(t,async()=>{started.resolve();await release.promise;return Response.json({error:false,data:id===L?[row]:{nup:'late-private-model'}});});await f.login();const pending=f.run(id,values);await started.promise;await f.send('/api/logout',{});release.resolve();const reply=await pending;assert.equal(reply.status,401);assert.equal(reply.result.error.code,'SESSION_EXPIRED');assert.equal(reply.result.result,undefined);
});
