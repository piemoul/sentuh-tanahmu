import test from 'node:test';
import assert from 'node:assert/strict';
import {createQueuePreread} from '../assets/queue/preread-controller.js';
import {createQueueBooking} from '../assets/queue/booking-controller.js';
import {QUEUE_BOOKING_COPY as COPY} from '../assets/queue/booking-model.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const goodLimit=()=>({error:false,available:true,message:null,contextId:'synthetic-review'});
const goodCreate=(id='created ID ')=>( {error:false,message:null,data:{id,nomor:'SYNTHETIC-01',nama:'Loket sintetis'}} );
async function fixture({notification=true,row={},preflight,clock=()=>new Date(2026,9,21,12)}={}){
 let active=true,applicant={id:0,nama:'Pemohon sintetis',nik:'0000000000000000'},notify=notification;
 const calls=[],changes=[],auth=[],created=[],reconciles=[];
 const office={id:'queue-office',kantor_id:'main-office',nama:'Kantor sintetis'},location={id:'location',kantor:'queue-office',nama:'Lokasi sintetis',alamat:'Alamat sintetis'},loket={id:'raw loket ',nama:'Loket sintetis',is_available:1,jumlah_antrian:7,estimasi_message:null,jam_tutup:null,...row};
 const read=kind=>async()=>{calls.push({kind});return kind==='offices'?[office]:kind==='locations'?[location]:kind==='availability'?[loket]:[];};
 const p=createQueuePreread({readOffices:read('offices'),readLocations:read('locations'),readAvailability:read('availability'),readCalendar:read('calendar'),getApplicant:()=>applicant,isCurrent:()=>active,now:()=>new Date(2026,9,21,12)});
 await p.start();await p.selectOffice(0);p.selectLocation(0);await p.next();await tick();
 const operation=kind=>(...args)=>{const wait=deferred();calls.push({kind,args,...wait});return wait.promise;};
 const b=createQueueBooking({captureContext:p.captureBooking,isContextCurrent:p.bookingContextCurrent,lockContext:p.lockBooking,unlockContext:p.unlockBooking,checkLimit:operation('limit'),createBooking:operation('create'),notificationAvailable:()=>notify,isCurrent:()=>active,onChange:value=>changes.push(value),onAuthError:error=>auth.push(error.code),onCreated:value=>created.push(value),onReconcile:async()=>{reconciles.push('read');},now:clock,...(preflight?{preflight}:{})});
 return {p,b,calls,changes,auth,created,reconciles,office,location,loket,generation:()=>p.state.availabilityGeneration,setActive:value=>active=value,setApplicant:value=>applicant=value,setNotification:value=>notify=value,async begin(){const work=b.begin(0,p.state.availabilityGeneration);calls.at(-1).resolve(goodLimit());return work;},async reject(work,error){calls.at(-1).reject(error);return work;}};
}

test('normal flow is explicit quota then confirmation then one create; same captured source and context receipt survive',async()=>{
 const h=await fixture();assert.equal(h.calls.length,4);assert.equal(h.b.snapshot().stage,'idle');
 const work=h.b.begin(0,h.generation()),call=h.calls.at(-1);assert.equal(call.kind,'limit');assert.equal(h.b.snapshot().pending,true);assert.equal(await h.b.confirm(),false);
 assert.equal(call.args[0].office.id,'queue-office');assert.notEqual(call.args[0].office.id,call.args[0].office.kantor_id);assert.equal(call.args[0].row.id,'raw loket ');assert.equal(call.args[0].rowIndex,0);assert.deepEqual(call.args[0].applicant,{id:0,nama:'Pemohon sintetis',nik:'0000000000000000'});
 call.resolve(goodLimit());assert.equal(await work,true);assert.equal(h.b.snapshot().stage,'review');assert.equal(h.calls.length,5);assert.equal(h.b.snapshot().canConfirm,true);
 const submit=h.b.confirm(),create=h.calls.at(-1);assert.equal(create.kind,'create');assert.equal(create.args[0],call.args[0]);assert.equal(create.args[1].contextId,'synthetic-review');assert.equal(h.b.snapshot().stage,'creating');
 create.resolve(goodCreate());assert.equal(await submit,true);assert.deepEqual(h.created,[goodCreate().data]);assert.equal(h.b.snapshot().stage,'created');assert.equal(h.p.bookingLocked(),false);
 assert.equal(await h.b.confirm(),false);assert.equal(await h.b.begin(0,h.generation()),false);assert.deepEqual(h.calls.map(v=>v.kind),['offices','locations','availability','calendar','limit','create']);
});
test('pending quota/review/create locks actual preread controls and rejects duplicate actions',async()=>{
 const h=await fixture();const work=h.b.begin(0,h.generation());
 const assertLocked=async()=>{assert.equal(h.p.bookingLocked(),true);for(const action of [()=>h.p.setDocumentCount(2),()=>h.p.setDateDraft('2026-10-22'),()=>h.p.openDate(),()=>h.p.selectLocation(0),()=>h.p.back(),()=>h.p.closeReview(),()=>h.p.reviewLoket(0,h.generation())])assert.equal(action(),false);for(const action of [()=>h.p.refresh(),()=>h.p.reloadOffices(),()=>h.p.selectOffice(0),()=>h.p.selectDate('2026-10-22'),()=>h.p.loadCalendar(2027),()=>h.p.next()])assert.equal(await action(),false);assert.equal(h.p.captureBooking(0,h.generation()),null);};
 await assertLocked();assert.equal(await h.b.begin(0,h.generation()),false);assert.equal(h.b.cancel(),false);h.calls.at(-1).resolve(goodLimit());await work;await assertLocked();
 const submit=h.b.confirm();await assertLocked();assert.equal(await h.b.confirm(),false);assert.equal(h.b.cancel(),false);h.calls.at(-1).resolve(goodCreate());await submit;assert.equal(h.calls.length,6);
});
test('cancel unlocks review and sends no create; fresh count requires a new explicit limit',async()=>{
 const h=await fixture();await h.begin();assert.equal(h.b.cancel(),true);assert.equal(h.p.bookingLocked(),false);assert.equal(h.b.snapshot().stage,'idle');assert.equal(h.p.setDocumentCount(5),true);
 await h.begin();assert.equal(h.calls.at(-1).args[0].documentCount,5);assert.equal(h.b.snapshot().review.documentCount,5);assert.equal(h.calls.filter(v=>v.kind==='create').length,0);assert.equal(h.calls.filter(v=>v.kind==='limit').length,2);
});
test('preflight applies quota failure before full and closing; empty rejection remains literal',async()=>{
 for(const response of [{error:true,available:null,message:''},{error:false,available:false,message:null}]){
  const h=await fixture({row:{estimasi_message:'full',jam_tutup:'bad'}}),work=h.b.begin(0,h.generation());h.calls.at(-1).resolve(response);assert.equal(await work,false);assert.equal(h.b.snapshot().stage,'error');assert.equal(h.b.snapshot().message,response.message===null?COPY.quotaFull:'');assert.equal(h.p.bookingLocked(),false);assert.equal(h.calls.length,5);
 }
});
test('full and closing stop after successful limit without automatic availability read or create',async()=>{
 for(const [row,message] of [[{estimasi_message:'not full'},'not full'],[{jam_tutup:'2000-01-01 11:59:59'},COPY.closed]]){const h=await fixture({row});assert.equal(await h.begin(),false);assert.equal(h.b.snapshot().message,message);assert.equal(h.p.bookingLocked(),false);assert.equal(h.calls.length,5);}
});
test('malformed quota and thrown quota request use catch fallback, never authorize review',async()=>{
 for(const reject of [false,true]){const h=await fixture(),work=h.b.begin(0,h.generation());if(reject)h.calls.at(-1).reject(new Error('synthetic timeout'));else h.calls.at(-1).resolve({error:false,available:1,message:null});assert.equal(await work,false);assert.equal(h.b.snapshot().message,COPY.quotaCatch);assert.equal(h.p.bookingLocked(),false);assert.equal(h.created.length,0);}
});
test('no available notification capability means no create; actual capability change still needs explicit confirmation',async()=>{
 const h=await fixture({notification:false});await h.begin();assert.equal(h.b.snapshot().canConfirm,false);assert.equal(await h.b.confirm(),false);assert.equal(h.calls.length,5);assert.equal(h.b.snapshot().message,COPY.notification);
 h.setNotification(true);assert.equal(h.b.snapshot().canConfirm,true);const work=h.b.confirm();assert.equal(h.calls.at(-1).kind,'create');h.calls.at(-1).resolve(goodCreate(''));assert.equal(await work,true);assert.equal(h.created[0].id,'');
});
test('notification rejection before dispatch keeps confirmation without fabricating token or result',async()=>{
 const h=await fixture();await h.begin();const work=h.b.confirm();await h.reject(work,Object.assign(new Error('no provider'),{code:'NOTIFICATION_UNAVAILABLE'}));assert.equal(h.b.snapshot().stage,'review');assert.equal(h.b.snapshot().pending,false);assert.equal(h.b.snapshot().message,COPY.notification);assert.equal(h.created.length,0);assert.equal(h.p.bookingLocked(),true);assert.equal(h.calls.filter(v=>v.kind==='create').length,1);assert.equal(h.b.cancel(),true);
});
test('definite create rejection displays literal empty message and never calls onCreated',async()=>{
 const h=await fixture();await h.begin();const work=h.b.confirm();h.calls.at(-1).resolve({error:true,message:'',data:null});assert.equal(await work,false);assert.equal(h.b.snapshot().stage,'error');assert.equal(h.b.snapshot().message,'');assert.equal(h.created.length,0);assert.equal(h.p.bookingLocked(),false);
});
test('ambiguous timeout and malformed create response stay unknown; manual reconciliation is read only and does not enable repost',async()=>{
 for(const kind of ['timeout','malformed']){const h=await fixture();await h.begin();const work=h.b.confirm();if(kind==='timeout')h.calls.at(-1).reject(Object.assign(new Error('timeout'),{code:'UPSTREAM_TIMEOUT'}));else h.calls.at(-1).resolve({error:false,message:null,data:{id:42}});assert.equal(await work,false);assert.equal(h.b.snapshot().stage,'unknown');assert.equal(h.b.snapshot().message,COPY.unknown);assert.equal(h.p.bookingLocked(),false);assert.equal(h.created.length,0);assert.equal(await h.b.confirm(),false);assert.equal(await h.b.begin(0,h.generation()),false);assert.equal(h.b.cancel(),false);assert.equal(await h.b.reconcile(),true);assert.deepEqual(h.reconciles,['read']);assert.equal(h.b.snapshot().stage,'unknown');assert.equal(h.calls.length,6);}
});
test('explicit pre-dispatch create error is distinct from ambiguous delivery and may show its message',async()=>{
 const h=await fixture();await h.begin();const work=h.b.confirm();await h.reject(work,Object.assign(new Error('Synthetic local validation'),{dispatched:false}));assert.equal(h.b.snapshot().stage,'error');assert.equal(h.b.snapshot().message,'Synthetic local validation');assert.equal(h.created.length,0);
});
test('SESSION_CHANGED requires reload without clearing newer session; only actual auth codes notify session owner',async()=>{
 for(const phase of ['limit','create'])for(const code of ['SESSION_CHANGED','AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){const h=await fixture();if(phase==='create')await h.begin();const work=phase==='limit'?h.b.begin(0,h.generation()):h.b.confirm();await h.reject(work,Object.assign(new Error('synthetic session'),{code}));assert.deepEqual(h.auth,code==='SESSION_CHANGED'?[]:[code]);assert.equal(h.b.snapshot().requiresReload,true);assert.equal(h.p.bookingLocked(),false);assert.equal(await h.b.begin(0,h.generation()),false);assert.equal(h.created.length,0);}
});
test('retired route, changed applicant, and disposal ignore late quota/create success and auth failure',async()=>{
 for(const phase of ['limit','create'])for(const retire of ['route','applicant','dispose'])for(const reject of [false,true]){const h=await fixture();if(phase==='create')await h.begin();const work=phase==='limit'?h.b.begin(0,h.generation()):h.b.confirm(),call=h.calls.at(-1);if(retire==='route')h.setActive(false);if(retire==='applicant')h.setApplicant({id:0,nama:'Other synthetic',nik:'1111'});if(retire==='dispose')h.b.dispose();if(reject)call.reject(Object.assign(new Error('late'),{code:'SESSION_EXPIRED'}));else call.resolve(phase==='limit'?goodLimit():goodCreate());assert.equal(await work,false);assert.equal(h.auth.length,0);assert.equal(h.created.length,0);assert.equal(h.p.bookingLocked(),false);assert.equal(h.b.snapshot().pending,false);}
});
test('source mutation during confirmation revokes ownership and stops create before HTTP',async()=>{
 for(const mutate of [h=>h.loket.id='changed',h=>h.loket.estimasi_message='full',h=>h.office.nama='changed',h=>h.location.id='changed',h=>h.p.state.documentCount=2,h=>h.p.state.date.setDate(22),h=>h.p.state.calendar.push({tanggal:'2026-10-22',tipeLiburId:'1'})]){const h=await fixture();await h.begin();mutate(h);assert.equal(await h.b.confirm(),false);assert.equal(h.b.snapshot().requiresReload,true);assert.equal(h.p.bookingLocked(),false);assert.equal(h.calls.length,5);}
});
test('captured source cannot be forged or reacquired after count/date/calendar revision, and pure rendering does not retire it',async()=>{
 const h=await fixture(),capture=h.p.captureBooking(0,h.generation());assert.equal(Object.isFrozen(capture.row),true);assert.equal(h.p.bookingContextCurrent(capture),true);assert.equal(h.p.bookingContextCurrent(structuredClone(capture)),false);assert.equal(h.p.lockBooking(structuredClone(capture)),false);
 for(let i=0;i<3;i++){assert.equal(h.p.currentReview(),null);h.p.syncApplicant();assert.equal(h.p.bookingContextCurrent(capture),true);}
 h.p.setDocumentCount(2);h.p.setDocumentCount(1);assert.equal(h.p.bookingContextCurrent(capture),false);
 const dateCapture=h.p.captureBooking(0,h.generation());h.p.setDateDraft(h.p.state.availabilityDate);h.p.setDateDraft(null);assert.equal(h.p.bookingContextCurrent(dateCapture),false);
 const calendarCapture=h.p.captureBooking(0,h.generation());await h.p.loadCalendar(2026);assert.equal(h.p.bookingContextCurrent(calendarCapture),false);
});
test('dispose releases snapshots/private values and an unrelated caller cannot unlock another captured source',async()=>{
 const h=await fixture(),first=h.p.captureBooking(0,h.generation()),other=h.p.captureBooking(0,h.generation());assert.equal(h.p.lockBooking(first),true);assert.equal(h.p.unlockBooking(other),false);assert.equal(h.p.bookingLocked(),true);h.p.unlockBooking(first);
 await h.begin();h.b.dispose();assert.deepEqual(h.b.snapshot(),{stage:'disposed',review:null,message:'',pending:false,requiresReload:false,reconciling:false,canConfirm:false,notificationAvailable:true});assert.equal(h.p.bookingLocked(),false);assert.equal(await h.b.confirm(),false);
});
test('server-reviewed preflight injection consumes the decoded verdict without sampling browser clock again',async()=>{
 let calls=0;const h=await fixture({row:{jam_tutup:'2000-01-01 00:00:00'},clock:()=>{throw new Error('Second preflight clock must not run');},preflight:({limit,context})=>{calls++;assert.equal(context.row.id,'raw loket ');return {stage:limit.error?'error':'review',message:limit.message};}});
 assert.equal(await h.begin(),true);assert.equal(calls,1);assert.equal(h.b.snapshot().stage,'review');assert.equal(h.calls.length,5);h.b.cancel();
 const work=h.b.begin(0,h.generation());h.calls.at(-1).resolve({error:true,available:null,message:'Server-reviewed closed'});assert.equal(await work,false);assert.equal(calls,2);assert.equal(h.b.snapshot().message,'Server-reviewed closed');assert.equal(h.calls.length,6);
});
