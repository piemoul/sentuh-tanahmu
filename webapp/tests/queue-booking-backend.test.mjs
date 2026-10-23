import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {serializeQueueBookingLimit,parseQueueBookingLimitJson as parseLimit,decodeQueueBookingLimitBytes as decodeLimit,queueBookingLimitOutcome as outcome,prepareQueueBookingReview,queueBookingPreflight,queueBookingTimeZone,QUEUE_BOOKING_LIMIT_FULL,QUEUE_BOOKING_CLOSED} from '../private/queue-booking-models.mjs';
import {QueueBookingClient} from '../private/queue-booking-client.mjs';
import {QueueBookingSession} from '../private/queue-booking-session.mjs';
import {QueueSessionReader} from '../private/queue-session.mjs';
import {parseQueueBookingProfileResponse,queueBookingOwnApplicant} from '../private/queue-booking-profile.mjs';
import {OPERATIONS,getOperation,prepareOperation} from '../private/operations.mjs';
import {createServer} from '../server.mjs';

const successful=(is_available=true,message=null)=>({error:false,data:{is_available,jumlah_antrian:0},message});
const text=value=>JSON.stringify(value),bytes=value=>Buffer.from(typeof value==='string'?value:text(value));
const config={queueAuthorization:()=> 'Bearer fixture-standalone-queue'};
const limitValues={nik:'identity & + /',kantorid:'Directus ID',tanggal_booking:'2026-10-21'};
const reviewValues={contextId:'qb_'+'a'.repeat(32),rowIndex:0,documentCount:1,timeZone:'Asia/Jakarta'};
const row=(changes={})=>({id:'loket',nama:'Loket A',deskripsi:null,nomor:null,jumlah_antrian_total:4,jumlah_antrian:2,jam_buka:null,jam_tutup:null,status:1,estimasi:1,estimasi_message:null,is_available:1,...changes});

test('quota serializer preserves native JSON key order and original required Strings including empty values',()=>{
 assert.equal(serializeQueueBookingLimit({tanggal_booking:'',kantorid:' \u0000+ / ',nik:''}),'{"nik":"","kantorid":" \\u0000+ / ","tanggal_booking":""}');
 assert.equal(Buffer.from(serializeQueueBookingLimit({nik:'測量🙂',kantorid:'é',tanggal_booking:'d'})).toString('utf8'),'{"nik":"測量🙂","kantorid":"é","tanggal_booking":"d"}');
});
test('quota serializer rejects missing/extra/inherited/accessor/nonstring fields before transport',()=>{
 for(const value of [null,[],{},Object.create(limitValues),{...limitValues,nik:1},{...limitValues,nik:null},{...limitValues,url:'https://other.invalid'},Object.defineProperty({...limitValues},'nik',{get(){throw Error('never');}}),{...limitValues,[Symbol('x')]:1}])assert.throws(()=>serializeQueueBookingLimit(value));
});
test('quota service checks nullable message first and accepts only literal false for eligibility',()=>{
 for(const error of [null,true,'false',0,[],{}])assert.deepEqual(parseLimit(text({error,message:'',data:'ignored'})),{error:true,data:null,message:''});
 assert.deepEqual(parseLimit('{"message":null}'),{error:true,data:null,message:null});
 for(const message of [0,false,{},[]])assert.throws(()=>parseLimit(text({error:true,message})));
 assert.deepEqual(parseLimit(text(successful(true,'provider message'))),{error:false,data:{is_available:true},message:'provider message'});
});
test('quota bool is required and discarded quota count remains required exact signed64 int',()=>{
 for(const value of [null,0,1,'true',{},[]])assert.throws(()=>parseLimit(text({error:false,data:{is_available:value,jumlah_antrian:0}})));
 for(const token of ['-9223372036854775808','9223372036854775807','-1','0','-0'])assert.deepEqual(parseLimit('{"error":false,"data":{"is_available":false,"jumlah_antrian":'+token+'}}').data,{is_available:false});
 for(const token of ['null','1.0','1e0','"1"','true','9223372036854775808','-9223372036854775809'])assert.throws(()=>parseLimit('{"error":false,"data":{"is_available":true,"jumlah_antrian":'+token+'}}'));
 for(const data of [null,[],{}, {is_available:true}])assert.throws(()=>parseLimit(text({error:false,data})));
});
test('quota response codec applies JSON MIME transform once and converts typed parse catches into native failure tuple',()=>{
 for(const mime of ['application/json; charset=utf-8','text/json','application/vnd.fixture+json'])assert.equal(decodeLimit(bytes(successful()),mime).data.is_available,true);
 for(const [body,mime] of [[text(successful()),'text/plain'],[text(text(successful())),'application/json'],['{bad','application/json'],['','application/json'],['[]','application/json'],['null','application/json'],[text(successful()),'invalid MIME']])assert.deepEqual(decodeLimit(bytes(body),mime),{error:true,data:null,message:null});
 assert.deepEqual(decodeLimit(Uint8Array.from([0xc3,0x28]),'application/json'),{error:true,data:null,message:null});
});
test('quota controller preserves empty server message and native null-only fallback variants',()=>{
 assert.deepEqual(outcome({error:true,data:null,message:null}),{error:true,message:'Terjadi Kesalahan',quotaAvailable:false});
 assert.equal(outcome({error:false,data:{is_available:false},message:null}).message,QUEUE_BOOKING_LIMIT_FULL);
 assert.equal(outcome({error:false,data:{is_available:true},message:null}).message,'Batas booking tersedia');
 for(const tuple of [{error:true,data:null,message:''},{error:false,data:{is_available:false},message:''},{error:false,data:{is_available:true},message:''}])assert.equal(outcome(tuple).message,'');
});
test('review inputs require exactly opaque context/source row/count1–5/browser IANA zone',()=>{
 assert.deepEqual(prepareQueueBookingReview(reviewValues),reviewValues);
 for(const patch of [{contextId:'raw-office'},{rowIndex:1.5},{rowIndex:-1},{documentCount:0},{documentCount:6},{documentCount:'1'},{timeZone:'+07:00'},{timeZone:'bad/zone'},{timeZone:''},{nik:'browser identity'},{fcm_token:'manual'}])assert.throws(()=>prepareQueueBookingReview({...reviewValues,...patch}));
 assert.throws(()=>prepareQueueBookingReview(Object.create(reviewValues)));
 assert.equal(queueBookingTimeZone('UTC'),'UTC');
});
test('native full substring gate is case-sensitive and takes priority before closing/clock',()=>{
 for(const message of ['full','not full','fully booked','xfullx'])assert.deepEqual(queueBookingPreflight({row:row({estimasi_message:message,jam_tutup:'invalid'}),date:'2026-10-21',timeZone:'UTC',now:()=>{throw Error('clock must not run');}}),{error:true,message});
 for(const message of ['FULL','FulL','',null])assert.deepEqual(queueBookingPreflight({row:row({estimasi_message:message}),date:'2026-10-21',timeZone:'UTC',now:()=>{throw Error('null close does not need clock');}}),{error:false,message:null});
});
test('closing uses current browser-zone day and close time only, zero fractions and strict greater-than',()=>{
 const close=row({jam_tutup:'2020-05-03T17:00:00.999999'}),base={row:close,date:'2026-10-21',timeZone:'Asia/Jakarta'};
 assert.equal(queueBookingPreflight({...base,now:()=>Date.parse('2026-10-21T10:00:00Z')}).error,false);
 assert.deepEqual(queueBookingPreflight({...base,now:()=>Date.parse('2026-10-21T10:00:00.001Z')}),{error:true,message:QUEUE_BOOKING_CLOSED});
 assert.equal(queueBookingPreflight({...base,row:row({jam_tutup:'2020-05-03T12:00:00Z'}),now:()=>Date.parse('2026-10-21T11:00:00Z')}).error,false);
});
test('closing preserves native day-number-only quirk and separate now sample crossing midnight',()=>{
 const base={row:row({jam_tutup:'2020-05-03T17:00:00'}),timeZone:'UTC'};
 assert.equal(queueBookingPreflight({...base,date:'2026-11-21',now:()=>Date.parse('2026-10-21T18:00:00Z')}).error,true);
 assert.equal(queueBookingPreflight({...base,date:'2026-10-22',now:()=>Date.parse('2026-10-21T18:00:00Z')}).error,false);
 const samples=[Date.parse('2026-10-21T23:59:59Z'),Date.parse('2026-10-22T00:00:00Z')];
 assert.equal(queueBookingPreflight({...base,date:'2026-10-21',now:()=>samples.shift()}).error,false);assert.equal(samples.length,0);
});
test('browser civil-time adapter rejects ambiguous/nonexistent DST times instead of silently normalizing',()=>{
 for(const close of ['2026-11-01T01:30:00','2026-03-08T02:30:00'])assert.throws(()=>queueBookingPreflight({row:row({jam_tutup:close}),date:'2026-10-21',timeZone:'America/Los_Angeles',now:()=>Date.parse('2026-10-21T18:00:00Z')}),{code:'QUEUE_BOOKING_TIME_UNSUPPORTED'});
});
test('quota client fixed Directus POST has native headers/JSON/UTF8 and accepts201 without GET retries',async()=>{
 const calls=[],logs=[],client=new QueueBookingClient(config,{log:e=>logs.push(e),transport:async(url,init)=>{calls.push({url,init});return Response.json(successful(true,'ok'),{status:201});}});
 const result=await client.limit(limitValues);assert.equal(result.status,201);assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://aplikasi.atrbpn.go.id/konsol/antrian/directus/api/booking/limit/');
 assert.deepEqual(calls[0].init.headers,{Authorization:'Bearer fixture-standalone-queue','User-Agent':'Dart/Flutter','Content-Type':'application/json'});
 assert.equal(calls[0].init.method,'POST');assert.equal(calls[0].init.redirect,'manual');assert.equal(calls[0].init.body,'{"nik":"identity & + /","kantorid":"Directus ID","tanggal_booking":"2026-10-21"}');
 assert.doesNotMatch(text(logs),/identity|fixture-standalone-queue|Directus ID/);
});
test('quota provider failures are observable, single-attempt and never redirect/retry or enter create',async()=>{
 for(const response of [()=>Response.json({message:null},{status:503}),()=>new Response(null,{status:307,headers:{Location:'https://other.invalid/'}}),()=>{throw Object.assign(Error('Bearer fixture-standalone-queue secret'),{code:'ECONNRESET'});}]){
  let count=0;const logs=[],client=new QueueBookingClient(config,{log:e=>logs.push(e),transport:async()=>{count++;return response();}});
  await assert.rejects(client.limit(limitValues));assert.equal(count,1);assert.doesNotMatch(text(logs),/secret|fixture-standalone-queue/);
 }
 const missing=new QueueBookingClient({},{transport:()=>{throw Error('must not request');},log:()=>{}});await assert.rejects(missing.limit(limitValues),{code:'QUEUE_CONFIGURATION_REQUIRED'});
});
test('typed non2xx quota rejection preserves original status and empty/String message without creating eligibility or clearing main auth',async()=>{
 for(const status of [400,401,503])for(const message of ['', 'Native service rejection', 'Bearer fixture-standalone-queue']){
  let calls=0;const client=new QueueBookingClient(config,{log:()=>{},transport:async()=>{calls++;return Response.json({error:true,message},{status});}}),result=await client.limit(limitValues);
  assert.equal(calls,1);assert.equal(result.status,status);assert.deepEqual(result.data,{error:true,data:null,message:message.includes('Bearer')?'[REDACTED]':message});assert.equal(outcome(result.data).quotaAvailable,false);
 }
 for(const response of [()=>Response.json({message:123},{status:503}),()=>Response.json(text({message:'outer'}),{status:503}),()=>new Response('{"message":"plain"}',{status:503,headers:{'Content-Type':'text/plain'}}),()=>new Response(Uint8Array.from([0xc3,0x28]),{status:503,headers:{'Content-Type':'application/json'}})]){const client=new QueueBookingClient(config,{log:()=>{},transport:async()=>response()});await assert.rejects(client.limit(limitValues),{code:'QUEUE_BOOKING_HTTP_STATUS'});}
});
test('quota client treats successful malformed MIME/body as native parse-failure tuple and redacts bearer echoes',async()=>{
 for(const response of [()=>new Response(text(successful()),{headers:{'Content-Type':'text/plain'}}),()=>Response.json(text(successful())),()=>new Response(Uint8Array.from([0xc3,0x28]),{headers:{'Content-Type':'application/json'}})]){
  const client=new QueueBookingClient(config,{log:()=>{},transport:async()=>response()});assert.deepEqual((await client.limit(limitValues)).data,{error:true,data:null,message:null});
 }
 const client=new QueueBookingClient(config,{log:()=>{},transport:async()=>Response.json(successful(false,'Bearer fixture-standalone-queue fixture-standalone-queue'))});assert.equal((await client.limit(limitValues)).data.message,'[REDACTED] [REDACTED]');
});
test('quota client abort cannot dispatch when already canceled and discards late pending result',async()=>{
 let count=0,finish;const controller=new AbortController(),client=new QueueBookingClient(config,{log:()=>{},transport:()=>{count++;return new Promise(resolve=>{finish=resolve;});}});
 controller.abort();await assert.rejects(client.limit(limitValues,{signal:controller.signal}),{code:'QUEUE_BOOKING_ABORTED'});assert.equal(count,0);
 const pendingController=new AbortController(),pending=client.limit(limitValues,{signal:pendingController.signal});await new Promise(resolve=>setImmediate(resolve));pendingController.abort();await assert.rejects(pending,{code:'QUEUE_BOOKING_ABORTED'});finish(Response.json(successful()));assert.equal(count,1);
});

const summary=(patch={})=>({status:201,data:{error:false,data:{userLevel:2,isIkd:false,nomorIdentitas:'private-own-nik',nama:'Own Name',nomorHp:'private-phone',tempatLahir:'private-place',tanggalLahir:'private-dob',...patch}}});
function fixture({rows=[row()],profile=summary(),observeProfile=true,limit=async()=>({status:201,contentType:'application/json',data:{error:false,data:{is_available:true},message:null}}),request}={}){
 const requests=[],posts=[],session={active:true,tokens:{accessToken:'fixture-main-token'},authenticationSignal:new AbortController().signal};
 const main={ensureFresh:async()=>{},request:async value=>{requests.push(value);return request?request(value):profile;}};
 const reader=new QueueSessionReader(Promise.resolve(main),Promise.resolve({})),source=reader.state(session);
 Object.assign(source.booking,{offices:[{id:'native-office',nama:'Office',kantor_id:'different-calendar-id'}],officeId:'native-office',locations:[{id:'native-location',kantor:'native-office',nama:'Location',alamat:'Address'}],officeSequence:1,locationSequence:1,availabilitySequence:1});
 const booking=new QueueBookingSession({mainClientPromise:Promise.resolve(main),bookingClientPromise:Promise.resolve({limit:async(...args)=>{posts.push(args);return limit(...args);}}),queueReader:reader,now:()=>Date.parse('2026-10-21T08:00:00Z')});
 if(observeProfile){booking.observe({operation:{endpoint:'account/account_summary'}},profile,session);reader.observe({operation:{endpoint:'account/account_summary'}},profile,session);}
 const result=booking.observePreread({queuePrerequisite:'availability',queueLocationId:'native-location',queueDate:'2026-10-21'},{status:200,contentType:'application/json',data:{error:false,data:rows}},session);
 return {booking,reader,session,source,requests,posts,contextId:result.bookingContextId,input:{...reviewValues,contextId:result.bookingContextId},result};
}
test('own booking projection validates existing full native profile and never substitutes sign-in NIK or IKD authority',()=>{
 assert.equal(queueBookingOwnApplicant(parseQueueBookingProfileResponse(summary({nomorIdentitas:null}))).nik,'');
 for(const patch of [{email:1},{readyToReview:'true'},{userLevel:1},{isIkd:null},{isIkd:true}])assert.throws(()=>queueBookingOwnApplicant(parseQueueBookingProfileResponse(summary(patch))));
});
test('availability context is opaque and quota body derives own NIK + Directus office ID + selected day server-side',async()=>{
 const f=fixture(),result=await f.booking.review({...f.input,documentCount:5},f.session,()=>{});
 assert.match(f.contextId,/^qb_[A-Za-z0-9_-]{32}$/);assert.equal(f.posts.length,1);assert.deepEqual(f.posts[0][0],{nik:'private-own-nik',kantorid:'native-office',tanggal_booking:'2026-10-21'});
 assert.equal(result.status,201);assert.equal(result.data.quotaAvailable,true);assert.equal(result.data.createAvailable,false);assert.match(result.data.reviewId,/^qr_[A-Za-z0-9_-]{32}$/);assert.equal(result.data.review.documentCount,5);assert.equal(result.data.review.bookingCreated,false);
 assert.doesNotMatch(text(result),/private-own-nik|private-phone|private-place|private-dob|fixture-main-token/);
 assert.equal(f.requests.length,1);assert.equal(f.requests[0].path,'account/account_summary');
});
test('duplicate provider IDs retain source row ownership and never collapse selected row by ID',async()=>{
 const f=fixture({rows:[row({nama:'First duplicate'}),row({nama:'Second duplicate'})]});const result=await f.booking.review({...f.input,rowIndex:1},f.session,()=>{});assert.equal(result.data.review.loket.nama,'Second duplicate');assert.equal(result.data.review.rowIndex,1);
});
test('missing/changed full profile fails before quota rather than silently reviewing a different applicant',async()=>{
 const missing=fixture({observeProfile:false});await assert.rejects(missing.booking.review(missing.input,missing.session,()=>{}),{code:'QUEUE_BOOKING_PROFILE_REQUIRED'});assert.equal(missing.posts.length,0);
 for(const patch of [{nomorIdentitas:'changed'},{nama:'Changed Name'},{nomorHp:'changed'},{tempatLahir:'changed'},{tanggalLahir:'changed'}]){
  const f=fixture({request:async()=>summary(patch)});await assert.rejects(f.booking.review(f.input,f.session,()=>{}),{code:'SESSION_CHANGED'});assert.equal(f.posts.length,0);
 }
});
test('pending summary rotation, missing own identity level and cross-session context cannot issue quota',async()=>{
 let finish;const f=fixture({request:()=>new Promise(resolve=>{finish=resolve;})});const pending=f.booking.review(f.input,f.session,()=>{});await new Promise(resolve=>setImmediate(resolve));f.booking.observe({operation:{endpoint:'account/account_summary'}},summary({nomorIdentitas:'new identity'}),f.session);finish(summary());await assert.rejects(pending);assert.equal(f.posts.length,0);
 const other=fixture();await assert.rejects(other.booking.review(other.input,{active:true,tokens:{}},()=>{}));assert.equal(other.posts.length,0);
 const unavailable=fixture({profile:summary({userLevel:1})});await assert.rejects(unavailable.booking.review(unavailable.input,unavailable.session,()=>{}),{code:'QUEUE_BOOKING_IDENTITY_UNAVAILABLE'});assert.equal(unavailable.posts.length,0);
});
test('new availability/office/location state and unavailable rows reject stale review before POST',async()=>{
 for(const key of ['officeSequence','locationSequence','availabilitySequence']){const f=fixture();f.source.booking[key]++;await assert.rejects(f.booking.review(f.input,f.session,()=>{}),{code:'QUEUE_SELECTION_CHANGED'});assert.equal(f.posts.length,0);}
 for(const is_available of [0,'1',null]){const f=fixture({rows:[row({is_available})]});await assert.rejects(f.booking.review(f.input,f.session,()=>{}),{code:'QUEUE_BOOKING_ROW_UNAVAILABLE'});assert.equal(f.posts.length,0);}
 const out=fixture();await assert.rejects(out.booking.review({...out.input,rowIndex:1},out.session,()=>{}),{code:'QUEUE_BOOKING_ROW_NOT_OWNED'});assert.equal(out.posts.length,0);
});
test('calendar after availability is supported; pending quota duplicate/selection/profile/session changes cannot publish review',async()=>{
 const initial=fixture();initial.source.booking.calendarSequence++;assert.equal((await initial.booking.review(initial.input,initial.session,()=>{})).data.quotaAvailable,true);
 for(const change of [f=>f.source.booking.calendarSequence++,f=>f.source.booking.availabilitySequence++,f=>f.booking.observe({operation:{endpoint:'account/account_summary'}},summary({nama:'new name'}),f.session),f=>{f.session.active=false;f.booking.discard(f.session);}]){
  let finish;const f=fixture({limit:()=>new Promise(resolve=>{finish=resolve;})});const pending=f.booking.review(f.input,f.session,()=>{});await new Promise(resolve=>setImmediate(resolve));await assert.rejects(f.booking.review(f.input,f.session,()=>{}),{code:'QUEUE_BOOKING_BUSY'});change(f);finish({status:200,contentType:'application/json',data:{error:false,data:{is_available:true},message:null}});await assert.rejects(pending);assert.equal(f.booking.states.get(f.session)?.review??null,null);
 }
});
test('quota denial prevents closing/review and full/closing gates keep successful quota distinct from booking creation',async()=>{
 const denied=fixture({rows:[row({estimasi_message:'full'})],limit:async()=>({status:200,contentType:'application/json',data:{error:false,data:{is_available:false},message:''}})});const denial=await denied.booking.review(denied.input,denied.session,()=>{});assert.equal(denial.data.message,'');assert.equal(denial.data.quotaAvailable,false);assert.equal(denial.data.review,null);
 const full=fixture({rows:[row({estimasi_message:'not full'})]});const blocked=await full.booking.review(full.input,full.session,()=>{});assert.equal(blocked.data.quotaAvailable,true);assert.equal(blocked.data.error,true);assert.equal(blocked.data.message,'not full');assert.equal(blocked.data.reviewId,null);assert.equal(blocked.data.createAvailable,false);
});
test('quota registry changes only its existing record and retains all169 other records including disabled create beside later personal Swaplotting, Berkas Rating, Buku Tamu and Tanya records',()=>{
 const baseline=JSON.parse(fs.readFileSync(new URL('../../analysis/webapp/queue-booking-runtime-baseline.json',import.meta.url))),old=new Map(baseline.catalog.operations.map(value=>[value.id,value.sha256]));
 assert.deepEqual(OPERATIONS.filter(value=>createHash('sha256').update(text(value)).digest('hex')!==old.get(value.id)).map(value=>value.id).sort(),['post-api-booking-limit-d8bf80','post-apis-swaplottingterdaftar-d9f850','post-apis-swaplottingbelumterdaftar-da0be8','post-berkas-postratingberkas-d915c4','post-bukutamu-d99dd8','post-tanyajawab-submitpertanyaan-d994f4','get-tanyajawab-gettanyajawabberkas-d2826c'].sort());
 assert.equal(OPERATIONS.length,176);assert.equal(OPERATIONS.filter(value=>value.enabled).length,95);assert.equal(OPERATIONS.filter(value=>value.enabled&&value.effect==='read').length,74);assert.equal(OPERATIONS.filter(value=>value.enabled&&value.effect==='write').length,21);
 const operation=getOperation('post-api-booking-limit-d8bf80');for(const [key,value]of Object.entries({enabled:true,clientProfile:'queue-booking',serviceId:'directus',auth:'session',method:'POST',encoding:'json',path:'api/booking/limit/',effect:'write',requiresConfirmation:true,serverAcceptance:'untested'}))assert.equal(operation[key],value,key);
 assert.equal(operation.evidence.wireNativeProofSha256,'95e3bc41929c7e2f7a854a7ae28f8a0045383320cfe4920b7ed1cbf7f585b067');assert.deepEqual(operation.nativeFields.map(value=>value.path),['nik','kantorid','tanggal_booking']);
 assert.equal(getOperation('post-api-booking-d8b640').enabled,false);
});
test('registry exposes only the local owned-review recipe and never accepts raw native identity/body/query/token overrides',()=>{
 const id='post-api-booking-limit-d8bf80',prepared=prepareOperation(id,reviewValues,{authenticated:true});assert.equal(prepared.clientProfile,'queue-booking');assert.deepEqual(prepared.body,{});assert.deepEqual(prepared.query,{});assert.deepEqual(prepared.files,[]);assert.deepEqual(prepared.queueBookingReview,reviewValues);
 assert.throws(()=>prepareOperation(id,reviewValues,{authenticated:false}),{code:'LOGIN_REQUIRED'});
 for(const key of ['nik','kantorid','tanggal_booking','pemohon','token','fcm_token','path','url','headers','files'])assert.throws(()=>prepareOperation(id,{...reviewValues,[key]:'caller'},{authenticated:true}),{code:'QUEUE_BOOKING_REVIEW_SCOPE'});
 assert.throws(()=>prepareOperation('post-api-booking-d8b640',{}, {authenticated:true}),{code:'OPERATION_INSPECT_ONLY'});
});

async function httpFixture(t,{quota=()=>Response.json(successful()),profilePatch=()=>({})}={}){
 const calls=[],configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',applicationAuthorization:()=> 'AtrBpn fixture-main-app',queueAuthorization:()=> 'Bearer fixture-directus-app',reason:'synthetic only'};
 const server=createServer({configuration,log:()=>{},queueBookingNow:()=>Date.parse('2026-10-21T08:00:00Z'),transport:async(url,init)=>{
  calls.push({url,init});
  if(url.pathname==='/auth/signin')return Response.json({data:{username:'fixture-user',nomorIndukKependudukan:'wrong-login-nik',token:{accessToken:'fixture-http-main',refreshToken:'fixture-http-refresh',tokenType:'Bearer',expiredAt:4_000_000_000}}});
  if(url.pathname==='/account/account_summary')return Response.json(summary(profilePatch()).data);
  if(url.pathname==='/konsol/antrian/directus/items/kantor')return Response.json({data:[{id:'original-queue-office',kantor_id:'other-calendar-id',nama:'Office'}]});
  if(url.pathname==='/konsol/antrian/directus/items/lokasi')return Response.json({data:[{id:'owned-location',kantor:'original-queue-office',nama:'Location'}]});
  if(url.pathname==='/konsol/antrian/directus/api/antrian')return Response.json({error:false,data:[row()]});
  if(url.pathname==='/konsol/antrian/directus/api/booking/limit/')return quota(url,init);
  throw Error('Unexpected synthetic request '+url.pathname);
 }});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const base='http://127.0.0.1:'+server.address().port;
 async function browser(){let response=await fetch(base+'/api/state'),cookie=response.headers.get('set-cookie').split(';')[0],state=await response.json();
  const request=async(path,data,options={})=>{const headers={Cookie:cookie,Origin:base,'X-CSRF-Token':state.csrfToken,...(data instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers};const response=await fetch(base+path,{method:options.method??'POST',headers,body:data===undefined?undefined:data instanceof FormData?data:text(data)});const body=await response.json();if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];if(body.csrfToken)state=body;return {status:response.status,body};};
  assert.equal((await request('/api/login',{username:'fixture-user',password:'fixture-only-password'})).status,200);
  return {request,execute:(id,values={},confirm=true)=>request('/api/execute',{operationId:id,values,confirm}),state:()=>state};
 }
 const user=await browser();
 async function walk(){assert.equal((await user.execute('post-account-account-summary-d2939c',{})).status,200);assert.equal((await user.execute('get-items-kantor-d1fa00')).status,200);assert.equal((await user.execute('get-items-lokasi-d8a0dc',{'filter[kantor]':'original-queue-office'})).status,200);const availability=await user.execute('get-api-antrian-d89cb4',{lokasi:'owned-location',tanggal:'2026-10-21'});assert.equal(availability.status,200);return {...reviewValues,contextId:availability.body.result.bookingContextId};}
 return {calls,user,walk,browser,quotaCalls:()=>calls.filter(value=>value.url.pathname.endsWith('/api/booking/limit/'))};
}
test('HTTP quota endpoint enforces CSRF/origin/confirmation and exact local scope before any provider operation',async t=>{
 const f=await httpFixture(t),input=await f.walk(),id='post-api-booking-limit-d8bf80',before=f.calls.length;
 for(const [options,code]of [[{headers:{'X-CSRF-Token':'wrong'}},'CSRF_REJECTED'],[{headers:{Origin:'https://other.invalid'}},'ORIGIN_REJECTED']]){const result=await f.user.request('/api/execute',{operationId:id,values:input,confirm:true},options);assert.equal(result.status,403);assert.equal(result.body.error.code,code);}
 const confirmation=await f.user.execute(id,input,false);assert.equal(confirmation.status,409);assert.equal(confirmation.body.error.code,'CONFIRMATION_REQUIRED');
 const forged=await f.user.execute(id,{...input,nik:'forged'});assert.equal(forged.status,400);assert.equal(forged.body.error.code,'QUEUE_BOOKING_REVIEW_SCOPE');assert.equal(f.calls.length,before);assert.equal(f.quotaCalls().length,0);
});
test('HTTP quota uses same-session server source chain and redacts full identity while preserving typed201/no-create',async t=>{
 const f=await httpFixture(t,{quota:()=>Response.json(successful(true,''),{status:201})}),input=await f.walk(),result=await f.user.execute('post-api-booking-limit-d8bf80',input);
 assert.equal(result.status,200);assert.equal(result.body.result.status,201);assert.equal(result.body.result.data.message,'');assert.equal(result.body.result.data.quotaAvailable,true);assert.equal(result.body.result.data.createAvailable,false);assert.match(result.body.result.data.reviewId,/^qr_[A-Za-z0-9_-]{32}$/);
 assert.equal(f.quotaCalls().length,1);const {url,init}=f.quotaCalls()[0];assert.equal(url.search,'');assert.equal(init.headers.Authorization,'Bearer fixture-directus-app');assert.equal(init.headers.Accept,undefined);assert.equal(init.body,'{"nik":"private-own-nik","kantorid":"original-queue-office","tanggal_booking":"2026-10-21"}');assert.doesNotMatch(text(result),/wrong-login-nik|private-own-nik|private-phone|private-dob|private-place|fixture-http-main|fixture-directus-app/);
 assert.equal(f.calls.filter(value=>value.url.pathname.endsWith('/api/booking/')).length,0);
});
test('HTTP cross-session, changed profile and multipart files cannot turn a selected-row review into a direct quota caller',async t=>{
 let patch={};const f=await httpFixture(t,{profilePatch:()=>patch}),input=await f.walk(),id='post-api-booking-limit-d8bf80',other=await f.browser();
 const crossSession=await other.execute(id,input);assert.equal(crossSession.status,409);assert.equal(crossSession.body.error.code,'QUEUE_SELECTION_CHANGED');
 const form=new FormData();form.set('operationId',id);form.set('values',text(input));form.set('confirm','true');form.set('file',new File(['fixture'],'fixture.txt'));
 const attachment=await f.user.request('/api/execute',form);assert.equal(attachment.status,400);assert.equal(attachment.body.error.code,'UNEXPECTED_FILE');
 patch={nomorIdentitas:'different-current-own-id'};const changed=await f.user.execute(id,input);assert.equal(changed.status,409);assert.equal(changed.body.error.code,'SESSION_CHANGED');assert.equal(f.quotaCalls().length,0);
});
test('HTTP typed upstream401 quota rejection does not clear owning main account and preserves empty message',async t=>{
 const f=await httpFixture(t,{quota:()=>Response.json({message:''},{status:401})}),input=await f.walk(),result=await f.user.execute('post-api-booking-limit-d8bf80',input);
 assert.equal(result.status,200);assert.equal(result.body.result.status,401);assert.deepEqual(result.body.result.data,{error:true,message:'',quotaAvailable:false,review:null,reviewId:null,createAvailable:false});
 const state=await f.user.request('/api/state',undefined,{method:'GET'});assert.equal(state.body.authenticated,true);assert.equal(f.quotaCalls().length,1);
});
