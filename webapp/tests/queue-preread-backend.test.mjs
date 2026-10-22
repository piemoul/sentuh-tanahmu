import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQueueBookingOfficesJson as offices,parseQueueBookingLocationsJson as locations,parseQueueBookingAvailabilityJson as availability,queuePrereadDate} from '../private/queue-preread-models.mjs';
import {QueueClient} from '../private/queue-client.mjs';
import {ApiClient} from '../private/api-client.mjs';
import {OPERATIONS,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';
const O='get-items-kantor-d1fa00',L='get-items-lokasi-d8a0dc',A='get-api-antrian-d89cb4';
const config={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'fixture only',applicationAuthorization:()=> 'AtrBpn fixture-app',queueAuthorization:()=> 'Bearer fixture-queue',calendarOfficeId:()=>{throw Error('Nearby decoder must not run for queue office');}};
const decode=(parse,data)=>parse(JSON.stringify(data));

test('booking offices retain all nullable Strings and ignore error/message',()=>{
 assert.deepEqual(decode(offices,{error:123,message:{bad:true},data:[{id:null,nama:null,kantor_id:null,unknown:'discard'},{id:' queue & + ',nama:' Nama ',kantor_id:'direct-id'}]}),{error:false,data:[{id:null,nama:null,kantor_id:null},{id:' queue & + ',nama:' Nama ',kantor_id:'direct-id'}]});
});
test('booking locations default nullable Strings to empty and preserve exact values/order',()=>{
 assert.deepEqual(decode(locations,{error:true,data:[{}, {id:' L ',kantor:' O ',nama:'n',alamat:'a'}]}),{error:false,data:[{id:'',kantor:'',nama:'',alamat:''},{id:' L ',kantor:' O ',nama:'n',alamat:'a'}]});
});
test('office and location services require nonempty data and fail whole list on malformed row',()=>{
 for(const parse of [offices,locations]){assert.deepEqual(decode(parse,{data:[]}),{error:true,data:[]});for(const body of [{},{data:null},{data:{}},{data:[null]},{data:[{}, {id:1}]},'{}'])assert.throws(()=>decode(parse,body));}
});
test('availability defaults absent/null error to failure and skips malformed data on true',()=>{
 for(const body of [{data:'ignored'},{error:null,data:123},{error:true,data:{bad:true}}])assert.deepEqual(decode(availability,body),{error:true,data:[]});
 for(const error of [0,'false',[],{}])assert.throws(()=>decode(availability,{error,data:[]}));
 assert.deepEqual(decode(availability,{error:false,data:[]}),{error:false,data:[]});
 for(const data of [null,{},[{}],[{id:'a',nama:1}]])assert.throws(()=>decode(availability,{error:false,data}));
});
test('availability required Strings, nullable defaults and unrecognized fields are exact',()=>{
 const row=decode(availability,{error:false,message:1,data:[{id:'',nama:'',unknown:'discard'}]}).data[0];
 assert.deepEqual(row,{id:'',nama:'',deskripsi:null,nomor:null,jumlah_antrian_total:0,jumlah_antrian:0,jam_buka:null,jam_tutup:null,status:0,estimasi:0,estimasi_message:null,is_available:0});
});
test('availability keeps signed64 wide ints as decimal text and rejects double tokens in int fields',()=>{
 const row=availability('{"error":false,"data":[{"id":"a","nama":"n","jumlah_antrian_total":9223372036854775807,"jumlah_antrian":-9223372036854775808,"status":1,"is_available":0,"estimasi":1.25}]}').data[0];
 assert.equal(row.jumlah_antrian_total,'9223372036854775807');assert.equal(row.jumlah_antrian,'-9223372036854775808');assert.equal(row.estimasi,1.25);
 for(const key of ['jumlah_antrian_total','jumlah_antrian','status','is_available'])for(const raw of ['1.0','1e0','"1"','true','9223372036854775808'])assert.throws(()=>availability('{"error":false,"data":[{"id":"a","nama":"n","'+key+'":'+raw+'}]}'));
 for(const raw of ['1e999','9223372036854775808','"1"','{}'])assert.throws(()=>availability('{"error":false,"data":[{"id":"a","nama":"n","estimasi":'+raw+'}]}'));
});
test('availability date-time browser guard rejects malformed calendar/time without normalizing source Strings',()=>{
 for(const value of ['2026-10-20T08:15:00+07:00','2024-02-29 08:15:00.123456','2026-10-20'])assert.equal(decode(availability,{error:false,data:[{id:'a',nama:'n',jam_buka:value}]}).data[0].jam_buka,value);
 for(const value of ['2026-02-29T08:00:00','2026-10-20T25:00:00','08:00','2026-13-01',17])assert.throws(()=>decode(availability,{error:false,data:[{id:'a',nama:'n',jam_tutup:value}]}));
});
test('request date accepts valid four-digit civil dates only including leap boundaries',()=>{
 for(const date of ['0001-01-01','2024-02-29','9999-12-31'])assert.equal(queuePrereadDate(date),date);
 for(const date of ['0000-01-01','2026-02-29','2026-04-31','2026-1-01','2026-10-20T00:00:00Z',null])assert.throws(()=>queuePrereadDate(date));
});
test('registry enables exactly the three fixed read operations with no identity or extra fields',()=>{
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(o=>o.enabled).length,94);
 for(const [id,values,kind] of [[O,{},'offices'],[L,{'filter[kantor]':'office'},'locations'],[A,{lokasi:'location',tanggal:'2026-10-20'},'availability']]){
  const p=prepareOperation(id,values,{authenticated:true});assert.equal(p.queuePrerequisite,kind);assert.equal(p.clientProfile,'queue-read');assert.equal(p.serviceId,'directus');assert.equal(p.auth,'session');assert.equal(p.requiresConfirmation,false);
  for(const key of ['nik','profile','canonicalId','headers','base','method','queueCalendarDirect'])assert.throws(()=>prepareOperation(id,{...values,[key]:'other'},{authenticated:true}));
  assert.throws(()=>prepareOperation(id,values,{authenticated:false}));
 }
});
test('new Directus GETs use only bundle bearer Dart UA and native one-pass encoded queries',async()=>{
 const calls=[],client=new QueueClient(config,{log:()=>{},transport:async(url,init)=>{calls.push({url:new URL(url),init});return Response.json({error:false,data:url.includes('api/antrian')?[]:[{}]});}});
 await client.offices();await client.locations(' office & + / ');await client.availability(' location & + / ','2026-10-20');
 assert.deepEqual(calls.map(c=>c.url.pathname),['/konsol/antrian/directus/items/kantor','/konsol/antrian/directus/items/lokasi','/konsol/antrian/directus/api/antrian']);
 assert.equal(calls[0].url.search,'?limit=1000&sort=nama');assert.equal(calls[1].url.searchParams.get('filter[kantor]'),' office & + / ');assert.equal(calls[2].url.searchParams.get('lokasi'),' location & + / ');
 for(const {init} of calls){assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(init.redirect,'manual');assert.deepEqual(init.headers,{Authorization:'Bearer fixture-queue','User-Agent':'Dart/Flutter'});}
});
test('prerequisite methods retain canonical slash redirects and retry rules without broadening destinations',async()=>{
 let calls=0;const client=new QueueClient(config,{log:()=>{},sleep:async()=>{},transport:async(url)=>{calls++;const u=new URL(url);if(calls===1)return Response.json({error:true},{status:503});if(!u.pathname.endsWith('/'))return new Response(null,{status:308,headers:{Location:u.pathname+'/'+u.search}});return Response.json({data:[{}]});}});
 assert.equal((await client.offices()).data.length,1);assert.equal(calls,3);
 const bad=new QueueClient(config,{log:()=>{},transport:async()=>new Response(null,{status:302,headers:{Location:'https://other.invalid/items/kantor'}})});
 await assert.rejects(bad.offices(),{code:'QUEUE_REDIRECT_REJECTED'});
});
test('new model failures never retry business/empty/schema/MIME and validation rejects before transport',async()=>{
 for(const response of [Response.json({data:[]}),Response.json({data:[{id:1}]}),new Response('{"data":[{}]}',{headers:{'Content-Type':'text/plain'}})]){
  let calls=0;const c=new QueueClient(config,{log:()=>{},transport:async()=>{calls++;return response;}});await assert.rejects(c.offices());assert.equal(calls,1);
 }
 let calls=0;const c=new QueueClient(config,{log:()=>{},transport:async()=>{calls++;return Response.json({error:false,data:[]});}});
 await assert.rejects(c.locations(' '));await assert.rejects(c.availability('id','2026-02-29'));assert.equal(calls,0);
});

async function fixture(t,{queue,main}={}){
 const calls=[],server=createServer({configuration:config,log:()=>{},queueSleep:async()=>{},transport:async(url,init)=>{
  calls.push({url:new URL(url),init});
  if(url.pathname==='/auth/signin')return Response.json({error:false,data:{username:'fixture-user',token:{tokenType:'Bearer',accessToken:'fixture-main',expiredAt:4e9}}});
  if(url.hostname==='aplikasi.atrbpn.go.id'){
   if(queue)return queue(url,init);
   if(url.pathname.endsWith('/items/kantor'))return Response.json({error:true,data:[{id:'office-A',nama:'Office A',kantor_id:'canonical-direct-A'},{id:'office-B',nama:'Office B',kantor_id:'canonical-direct-B'}]});
   if(url.pathname.endsWith('/items/lokasi'))return Response.json({error:123,data:[{id:'location-'+url.searchParams.get('filter[kantor]'),nama:'Location',kantor:'unused',alamat:'Address'}]});
   return Response.json({error:false,data:[]});
  }
  return main?main(url,init):Response.json({error:false,message:null,data:[]});
 }});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 const base='http://127.0.0.1:'+server.address().port;let cookie='',csrf='';
 const request=async(path,data,headers={})=>{const response=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{Origin:base,'X-CSRF-Token':csrf,'Content-Type':'application/json'}),...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const body=await response.json();if(body.csrfToken)csrf=body.csrfToken;return {status:response.status,body};};
 await request('/api/state');return {request,calls,login:()=>request('/api/login',{username:'fixture-user',password:'fixture-only'}),run:(id,values={})=>request('/api/execute',{operationId:id,values})};
}
test('HTTP prerequisites require own session,Origin and CSRF and never accept browser identity',async t=>{
 const f=await fixture(t);assert.equal((await f.run(O)).status,401);await f.login();const n=f.calls.length;
 assert.equal((await f.run(O,{nik:'other'})).status,400);assert.equal((await f.request('/api/execute',{operationId:O,values:{}},{Origin:'https://other.invalid'})).status,403);
 assert.equal((await f.request('/api/execute',{operationId:O,values:{}},{'X-CSRF-Token':'wrong'})).status,403);assert.equal(f.calls.length,n);
});
test('HTTP ownership binds returned office→location→availability and keeps main token off Directus',async t=>{
 const f=await fixture(t);await f.login();const n=f.calls.length;
 assert.equal((await f.run(L,{'filter[kantor]':'office-A'})).status,403);assert.equal((await f.run(A,{lokasi:'location-office-A',tanggal:'2026-10-20'})).status,403);assert.equal(f.calls.length,n);
 assert.equal((await f.run(O)).status,200);assert.equal((await f.run(L,{'filter[kantor]':'office-A'})).status,200);
 assert.equal((await f.run(A,{lokasi:'location-office-B',tanggal:'2026-10-20'})).status,403);
 const a=await f.run(A,{lokasi:'location-office-A',tanggal:'2026-10-20'});assert.equal(a.status,200);assert.deepEqual(a.body.result.data,{error:false,data:[]});
 const q=f.calls.filter(c=>c.url.hostname==='aplikasi.atrbpn.go.id');assert.equal(q.length,3);for(const c of q){assert.equal(c.init.headers.Authorization,'Bearer fixture-queue');assert.ok(!c.url.searchParams.has('nik'));}
 assert.equal(f.calls.filter(c=>c.url.pathname==='/account/account_summary').length,0);
});
test('trusted calendar derives canonical kantor_id without nearby decoder and returns existing envelope',async t=>{
 const f=await fixture(t);await f.login();await f.run(O);await f.run(L,{'filter[kantor]':'office-A'});
 const c=await f.request('/api/queue/booking/calendar',{officeId:'office-A',year:'2026'});assert.equal(c.status,200);assert.deepEqual(c.body.result.data,{error:false,message:null,data:[]});
 const call=f.calls.at(-1);assert.equal(call.url.href,'https://sentuh.atrbpn.go.id/KantorNearby/GetCalendar');assert.equal(call.init.headers.Authorization,'Bearer fixture-main');assert.deepEqual([...call.init.body],[['kantorId','canonical-direct-A'],['tahun','2026']]);
 const n=f.calls.length;for(const body of [{officeId:'other',year:'2026'},{officeId:'office-A',year:2026},{officeId:'office-A',year:'20x6'},{officeId:'office-A',year:'2026',kantorId:'forged'},{officeId:'office-A',year:'2026',queueCalendarDirect:true}])assert.ok((await f.request('/api/queue/booking/calendar',body)).status>=400);assert.equal(f.calls.length,n);
});
test('calendar direct flag is constrained to the exact main optional-session form and unrelated calendar still decrypts',async()=>{
 let calls=0,decodes=0;const client=new ApiClient({...config,calendarOfficeId:()=>{decodes++;return 'decoded-nearby';}},{log:()=>{},transport:async(_u,init)=>{calls++;assert.equal(init.body.get('kantorId'),calls===1?'direct':'decoded-nearby');return Response.json({error:false,data:[]});}});
 const p={path:'KantorNearby/GetCalendar',method:'POST',encoding:'form',auth:'optionalSession',body:{kantorId:'direct',tahun:'2026'},query:{},queueCalendarDirect:true};
 await client.request(p);assert.equal(decodes,0);await client.request({...p,queueCalendarDirect:false});assert.equal(decodes,1);
 for(const bad of [{path:'elsewhere'},{method:'GET'},{auth:'none'},{encoding:'json'},{query:{extra:'x'}},{body:{kantorId:'direct',tahun:'2026',extra:'x'}},{queueCalendarDirect:'true'}])await assert.rejects(client.request({...p,...bad}));assert.equal(calls,2);
});
test('switching offices invalidates old location authorization before any availability call',async t=>{
 const f=await fixture(t);await f.login();await f.run(O);await f.run(L,{'filter[kantor]':'office-A'});await f.run(L,{'filter[kantor]':'office-B'});const n=f.calls.length;
 assert.equal((await f.run(A,{lokasi:'location-office-A',tanggal:'2026-10-20'})).status,403);assert.equal((await f.request('/api/queue/booking/calendar',{officeId:'office-A',year:'2026'})).status,403);assert.equal(f.calls.length,n);
 assert.equal((await f.run(A,{lokasi:'location-office-B',tanggal:'2026-10-20'})).status,200);
});
test('office refresh and logout both revoke cached child IDs',async t=>{
 const f=await fixture(t);await f.login();await f.run(O);await f.run(L,{'filter[kantor]':'office-A'});await f.run(O);const n=f.calls.length;
 assert.equal((await f.run(A,{lokasi:'location-office-A',tanggal:'2026-10-20'})).status,403);assert.equal(f.calls.length,n);
 await f.request('/api/logout',{});await f.login();const n2=f.calls.length;assert.equal((await f.run(L,{'filter[kantor]':'office-A'})).status,403);assert.equal(f.calls.length,n2);
});
test('ambiguous duplicate office/location IDs cannot acquire child request ownership',async t=>{
 let duplicateOffice=true;
 const f=await fixture(t,{queue:url=>Response.json({data:url.pathname.endsWith('/items/kantor')?(duplicateOffice?[{id:'same',kantor_id:'A'},{id:'same',kantor_id:'B'}]:[{id:'same',kantor_id:'A'}]):[{id:'same-location'},{id:'same-location'}]})});await f.login();await f.run(O);assert.equal((await f.run(L,{'filter[kantor]':'same'})).status,403);duplicateOffice=false;await f.run(O);await f.run(L,{'filter[kantor]':'same'});const n=f.calls.length;assert.equal((await f.run(A,{lokasi:'same-location',tanggal:'2026-10-20'})).status,403);assert.equal(f.calls.length,n);
});
test('overlapping office refresh suppresses older completion and never authorizes its references',async t=>{
 let resolveFirst,started;const ready=new Promise(r=>started=r);let count=0;
 const f=await fixture(t,{queue:()=>{if(++count===1){started();return new Promise(r=>resolveFirst=()=>r(Response.json({data:[{id:'old',kantor_id:'old'}]})));}return Response.json({data:[{id:'new',kantor_id:'new'}]});}});await f.login();const first=f.run(O);await ready;assert.equal((await f.run(O)).status,200);resolveFirst();assert.equal((await first).status,409);const n=f.calls.length;assert.equal((await f.run(L,{'filter[kantor]':'old'})).status,403);assert.equal(f.calls.length,n);
});
test('logout aborts pending prerequisite GET and prevents cache repopulation',async t=>{
 let started;const ready=new Promise(r=>started=r);
 const f=await fixture(t,{queue:(_url,init)=>new Promise((_r,reject)=>{started();init.signal.addEventListener('abort',()=>reject(Object.assign(new Error('fixture'),{name:'AbortError'})),{once:true});})});await f.login();const pending=f.run(O);await ready;await f.request('/api/logout',{});assert.ok([401,499].includes((await pending).status));
});
test('location switch suppresses an older location-list completion before authorizing IDs',async t=>{
 let release,started;const ready=new Promise(r=>started=r);
 const f=await fixture(t,{queue:url=>{
  if(url.pathname.endsWith('/items/kantor'))return Response.json({data:[{id:'office-A',kantor_id:'A'},{id:'office-B',kantor_id:'B'}]});
  if(url.searchParams.get('filter[kantor]')==='office-A'){started();return new Promise(r=>release=()=>r(Response.json({data:[{id:'old-location'}]})));}
  return Response.json({data:[{id:'new-location'}]});
 }});await f.login();await f.run(O);const first=f.run(L,{'filter[kantor]':'office-A'});await ready;assert.equal((await f.run(L,{'filter[kantor]':'office-B'})).status,200);release();assert.equal((await first).status,409);const n=f.calls.length;assert.equal((await f.run(A,{lokasi:'old-location',tanggal:'2026-10-20'})).status,403);assert.equal(f.calls.length,n);
});
test('new availability date supersedes an older pending date result',async t=>{
 let release,started;const ready=new Promise(r=>started=r);
 const f=await fixture(t,{queue:url=>{
  if(url.pathname.endsWith('/items/kantor'))return Response.json({data:[{id:'office-A',kantor_id:'A'}]});
  if(url.pathname.endsWith('/items/lokasi'))return Response.json({data:[{id:'location'}]});
  if(url.searchParams.get('tanggal')==='2026-10-20'){started();return new Promise(r=>release=()=>r(Response.json({error:false,data:[]})));}
  return Response.json({error:false,data:[]});
 }});await f.login();await f.run(O);await f.run(L,{'filter[kantor]':'office-A'});const first=f.run(A,{lokasi:'location',tanggal:'2026-10-20'});await ready;assert.equal((await f.run(A,{lokasi:'location',tanggal:'2026-10-21'})).status,200);release();assert.equal((await first).status,409);
});
test('office switch suppresses pending main-calendar result and does not reuse old canonical ID',async t=>{
 let release,started;const ready=new Promise(r=>started=r);
 const f=await fixture(t,{main:()=>{started();return new Promise(r=>release=()=>r(Response.json({error:false,data:[]})));}});await f.login();await f.run(O);await f.run(L,{'filter[kantor]':'office-A'});const first=f.request('/api/queue/booking/calendar',{officeId:'office-A',year:'2026'});await ready;await f.run(L,{'filter[kantor]':'office-B'});release();assert.equal((await first).status,409);
});
test('failed office refresh leaves old office references revoked and does not retry schema failures',async t=>{
 let count=0;
 const f=await fixture(t,{queue:()=>Response.json({data:++count===1?[{id:'office-A',kantor_id:'A'}]:[]})});await f.login();await f.run(O);assert.equal((await f.run(O)).status,502);const n=f.calls.length;assert.equal((await f.run(L,{'filter[kantor]':'office-A'})).status,403);assert.equal(f.calls.length,n);assert.equal(count,2);
});
