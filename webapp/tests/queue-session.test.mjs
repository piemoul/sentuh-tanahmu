import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';
const LIST='get-api-antrian-saya-d1eb1c',DETAIL='get-api-antrian-path-argument-1-d1e130',CALLS='get-api-notifikasi-d22468';
const SUMMARY='post-account-account-summary-d2939c';
const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'fixture only',applicationAuthorization:()=> 'AtrBpn fixture-app',queueAuthorization:()=> 'Bearer fixture-queue'};
const profile={userLevel:2,isIkd:false,nomorIdentitas:'fixture-summary-nik'};
async function fixture(t,{summary=profile,queue,main,queueSleep=async()=>{}}={}) {
  const calls=[];
  const server=createServer({configuration,log:()=>{},queueSleep,transport:async(url,init)=>{
    calls.push({url:String(url),init});
    if(url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'fixture-user',nomorIndukKependudukan:'fixture-signin-nik',token:{tokenType:'Bearer',accessToken:'fixture-main',expiredAt:4e9}}});
    if(url.hostname==='aplikasi.atrbpn.go.id')return queue?queue(url,init):url.pathname.endsWith('/notifikasi')?Response.json({data:[{id:'notification-only',tipe:'call',pesan:'Pesan fixture',pengirim:'Loket',penerima:'Pemohon',tanggal_dikirim:'2026-10-19T00:00:00Z'}]}):Response.json({error:false,data:url.pathname.endsWith('/saya')?[{id:'owned:full-id'}]:{id:'owned:full-id',booking:[],pemohon:{token:'applicant-private'}}});
    if(url.pathname==='/account/account_summary')return typeof summary==='function'?summary(url,init):Response.json({error:false,data:summary});
    return main?main(url,init):Response.json({error:false,data:[]});
  }});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  let cookie='',csrf='';
  async function request(path,data){
    const r=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':csrf,'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});
    if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];
    const body=await r.json();if(body.csrfToken)csrf=body.csrfToken;
    return {status:r.status,body};
  }
  await request('/api/state');
  const login=()=>request('/api/login',{username:'fixture-user',password:'fixture-only'});
  return {request,login,calls,run:(operationId,values={})=>request('/api/execute',{operationId,values})};
}
test('queue reads require own login and reject browser NIK/profile before transport',async t=>{
  const f=await fixture(t);
  assert.equal((await f.run(LIST)).status,401);
  assert.equal(f.calls.length,0);
  await f.login();
  for(const values of [{nik:'another'},{profile},{url:'https://other.invalid'}])assert.equal((await f.run(LIST,values)).status,400);
  assert.equal(f.calls.length,1);
});
test('queue list uses backend summary identity and separate application bearer, then authorizes exact full ID',async t=>{
  const f=await fixture(t);await f.login();
  assert.equal((await f.run(DETAIL,{path_argument_1:'owned:full-id'})).status,403);
  const list=await f.run(LIST);assert.equal(list.status,200);assert.equal(list.body.result.skipped,undefined);assert.ok(Array.isArray(list.body.result.data.data),JSON.stringify(list.body));assert.equal(list.body.result.data.data[0].id,'owned:full-id');
  const summary=f.calls.find(c=>new URL(c.url).pathname==='/account/account_summary');
  assert.equal(summary.init.headers.Authorization,'Bearer fixture-main');
  const call=f.calls.find(c=>new URL(c.url).hostname==='aplikasi.atrbpn.go.id');
  assert.equal(new URL(call.url).searchParams.get('nik'),'fixture-summary-nik');
  assert.equal(call.init.method,'GET');assert.equal(call.init.headers.Authorization,'Bearer fixture-queue');
  assert.equal(call.init.headers['Content-Type'],undefined);assert.equal(call.init.body,undefined);
  assert.ok(!call.url.includes('fixture-signin-nik'));
  const detail=await f.run(DETAIL,{path_argument_1:'owned:full-id'});assert.equal(detail.status,200);
  assert.equal(detail.body.result.data.data.id,'owned:full-id');assert.ok(!JSON.stringify(detail.body).includes('applicant-private'));
  assert.equal(new URL(f.calls.at(-1).url).pathname,'/konsol/antrian/directus/api/antrian/owned:full-id');
  const before=f.calls.length;
  assert.equal((await f.run(DETAIL,{path_argument_1:'unowned-id'})).status,403);assert.equal(f.calls.length,before);
});
test('verified summary cache is reused and browser aliases cannot override it',async t=>{
  const f=await fixture(t);await f.login();await f.run(SUMMARY);
  const before=f.calls.length;assert.equal((await f.run(LIST)).status,200);assert.equal(f.calls.length,before+1);
  assert.equal((await f.run(DETAIL,{path_argument_1:'owned:full-id',nik:'other'})).status,400);
});
test('native profile branches without managed identities stop before queue transport',async t=>{
  for(const summary of [{userLevel:1,isIkd:false,nomorIdentitas:'fixture'},{...profile,isIkd:true},{...profile,nomorIdentitas:''}]){
    const f=await fixture(t,{summary});await f.login();const r=await f.run(LIST);
    assert.equal(r.status,200);assert.deepEqual(r.body.result.data.data,[]);assert.equal(r.body.result.skipped,true);
    assert.equal(f.calls.filter(c=>new URL(c.url).hostname==='aplikasi.atrbpn.go.id').length,0);
  }
});
test('unknown IKD and malformed summary fail without queue authorization',async t=>{
  for(const [summary,status] of [[{...profile,isIkd:null},409],[{...profile,nomorIdentitas:123},502]]){
    const f=await fixture(t,{summary});await f.login();assert.equal((await f.run(LIST)).status,status);
    assert.equal(f.calls.filter(c=>new URL(c.url).hostname==='aplikasi.atrbpn.go.id').length,0);
  }
});
test('own server activity can authorize queue detail with full content ID and router precedence',async t=>{
  const f=await fixture(t,{main:()=>Response.json({data:[{activityType:'AntrianOnline',contentId:'from:activity'},{activityType:'BerkasAntrian',contentId:'not-queue'}]})});await f.login();
  const catalog=(await f.request('/api/catalog')).body.operations;
  await f.run(catalog.find(o=>o.endpoint==='activity/GetUserActivity').id);
  assert.equal((await f.run(DETAIL,{path_argument_1:'from:activity'})).status,200);
  assert.equal((await f.run(DETAIL,{path_argument_1:'not-queue'})).status,403);
});
test('queue service unauthorized response does not expire main login',async t=>{
  const f=await fixture(t,{queue:()=>Response.json({error:true},{status:401})});await f.login();
  assert.equal((await f.run(LIST)).status,502);
  assert.equal((await f.request('/api/state')).body.authenticated,true);
});
test('logout and fresh login discard all queue ID authorization',async t=>{
  const f=await fixture(t);await f.login();await f.run(LIST);await f.request('/api/logout',{});await f.login();
  const before=f.calls.length;assert.equal((await f.run(DETAIL,{path_argument_1:'owned:full-id'})).status,403);assert.equal(f.calls.length,before);
});
test('logout cancels a live queue GET and prevents late result publication',async t=>{
  let started;const ready=new Promise(resolve=>started=resolve);
  const f=await fixture(t,{queue:(_url,init)=>new Promise((_resolve,reject)=>{started();init.signal.addEventListener('abort',()=>reject(Object.assign(new Error('fixture only'),{name:'AbortError'})),{once:true});})});
  await f.login();const pending=f.run(LIST);await ready;await f.request('/api/logout',{});
  const result=await pending;assert.ok([401,499].includes(result.status));assert.equal((await f.request('/api/state')).body.authenticated,false);
  assert.equal(f.calls.filter(c=>new URL(c.url).hostname==='aplikasi.atrbpn.go.id').length,1);
});
test('a changed backend profile invalidates old list ownership before another detail GET',async t=>{
  const summary={...profile};const f=await fixture(t,{summary});await f.login();await f.run(LIST);
  summary.nomorIdentitas='fixture-updated-profile';await f.run(SUMMARY);
  const before=f.calls.length;assert.equal((await f.run(DETAIL,{path_argument_1:'owned:full-id'})).status,403);assert.equal(f.calls.length,before);
  await f.run(LIST);assert.equal(new URL(f.calls.at(-1).url).searchParams.get('nik'),'fixture-updated-profile');
});
test('overlapping list requests cannot let an older response overwrite the latest authorized IDs',async t=>{
  let releaseFirst,started;const ready=new Promise(resolve=>started=resolve);let count=0;
  const f=await fixture(t,{queue:url=>{if(!url.pathname.endsWith('/saya'))return Response.json({error:false,data:{id:'latest-id'}});count++;if(count===1){started();return new Promise(resolve=>releaseFirst=()=>resolve(Response.json({error:false,data:[{id:'older-id'}]})));}return Response.json({error:false,data:[{id:'latest-id'}]});}});
  await f.login();const first=f.run(LIST);await ready;const second=await f.run(LIST);assert.equal(second.status,200);
  releaseFirst();assert.equal((await first).status,200);
  assert.equal((await f.run(DETAIL,{path_argument_1:'older-id'})).status,403);
  const before=f.calls.length;assert.equal((await f.run(DETAIL,{path_argument_1:'latest-id'})).status,200);assert.equal(f.calls.length,before+1);
});
test('pending internal summary cannot overwrite a newer backend profile observation',async t=>{
  let release,started;const ready=new Promise(resolve=>started=resolve);let count=0;
  const f=await fixture(t,{summary:()=>{if(++count===1){started();return new Promise(resolve=>release=()=>resolve(Response.json({error:false,data:profile})));}return Response.json({error:false,data:{...profile,nomorIdentitas:'new-observed-profile'}});}});
  await f.login();const pending=f.run(LIST);await ready;assert.equal((await f.run(SUMMARY)).status,200);release();assert.equal((await pending).status,200);
  assert.equal(new URL(f.calls.at(-1).url).searchParams.get('nik'),'new-observed-profile');
});
test('pending detail is rejected after a profile change revokes its list authorization',async t=>{
  let release,started;const ready=new Promise(resolve=>started=resolve);const summary={...profile};
  const f=await fixture(t,{summary,queue:url=>url.pathname.endsWith('/saya')?Response.json({error:false,data:[{id:'owned-id'}]}):new Promise(resolve=>{started();release=()=>resolve(Response.json({error:false,data:{id:'owned-id'}}));})});
  await f.login();await f.run(LIST);const pending=f.run(DETAIL,{path_argument_1:'owned-id'});await ready;
  summary.nomorIdentitas='profile-changed';await f.run(SUMMARY);release();assert.equal((await pending).status,403);
});
test('main account rejection aborts a pending queue retry without another queue GET',async t=>{
  let sleeping;const ready=new Promise(resolve=>sleeping=resolve);let observedSignal;
  const f=await fixture(t,{main:()=>Response.json({error:true},{status:401}),queue:()=>Response.json({error:true},{status:503}),queueSleep:(_ms,{signal})=>{observedSignal=signal;sleeping();return new Promise(()=>{});}});
  await f.login();const pending=f.run(LIST);await ready;
  const catalog=(await f.request('/api/catalog')).body.operations;
  assert.equal((await f.run(catalog.find(o=>o.endpoint==='activity/GetUserActivity').id)).status,401);
  assert.equal(observedSignal.aborted,true);assert.equal((await pending).status,499);
  assert.equal(f.calls.filter(c=>new URL(c.url).hostname==='aplikasi.atrbpn.go.id').length,1);
});
test('Panggilan derives its own account query without accepting browser identity or changing detail ownership',async t=>{
  const f=await fixture(t);assert.equal((await f.run(CALLS)).status,401);await f.login();
  assert.equal((await f.run(CALLS,{nik:'other'})).status,400);await f.run(LIST);
  const before=f.calls.length;const r=await f.run(CALLS);assert.equal(r.status,200);assert.equal(f.calls.length,before+1);assert.equal(Object.hasOwn(r.body.result.data,'error'),false);
  assert.equal(r.body.result.data.data[0].pesan,'Pesan fixture');assert.equal(Object.hasOwn(r.body.result.data.data[0],'id'),false);
  const call=f.calls.at(-1);assert.equal(new URL(call.url).searchParams.get('nik'),'fixture-summary-nik');assert.equal(call.init.headers.Authorization,'Bearer fixture-queue');
  assert.equal((await f.run(DETAIL,{path_argument_1:'notification-only'})).status,403);
  assert.equal((await f.run(DETAIL,{path_argument_1:'owned:full-id'})).status,200);
});
test('Panggilan empty account identity stops before remote query as a documented web ownership guard',async t=>{
  const f=await fixture(t,{summary:{...profile,nomorIdentitas:''}});await f.login();const r=await f.run(CALLS);
  assert.equal(r.status,200);assert.equal(r.body.result.skipped,true);assert.deepEqual(r.body.result.data,{data:[]});assert.equal(f.calls.length,2);
});
