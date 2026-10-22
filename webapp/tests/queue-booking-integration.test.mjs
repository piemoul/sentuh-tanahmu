import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness,plain} from './support/account-verification-ui-harness.mjs';
import {OPERATIONS} from '../private/operations.mjs';
import {createQueuePreread} from '../assets/queue/preread-controller.js';
import {createQueueBooking} from '../assets/queue/booking-controller.js';
import {queueBookingView} from '../assets/queue/booking-view.js';
import * as model from '../assets/queue/preread-model.js';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').split(/\r?\n/);
const helpers=source.filter(line=>/^(?:async )?function queuePreread\w+\(/.test(line)||/^(?:async )?function (?:queueOperation|queueObject|queueResponseBody|nativeResponseObject|nativeAccountSummary|officeCalendarRows|officeCalendarItem|nativeOfficeEnvelope)\(/.test(line)).join('\n');
const handlers=source.filter(line=>line.startsWith('document.addEventListener(')&&(line.includes("action==='queue-preread-start'")||line.startsWith("document.addEventListener('change',async event=>{if(!['queue-preread-office'"))).join('\n');
const envelope=data=>({status:200,data:{error:false,data}});
const office={id:'q-A',nama:'Kantor SINTETIS',kantor_id:'canonical-A'},location={id:'location-A',kantor:'q-A',nama:'Lokasi SINTETIS',alamat:'Alamat SINTETIS'};
const loket={id:'raw-loket',nama:'Loket <SINTETIS>',deskripsi:null,nomor:null,jumlah_antrian_total:7,jumlah_antrian:3,status:1,is_available:1,estimasi:1.5,jam_buka:null,jam_tutup:null,estimasi_message:'Estimasi SINTETIS'};
function setup(){
 const h=harness(),main=h.document.body.appendChild(h.document.createElement('main'));main.setAttribute('id','main');main.innerHTML='<button data-action="queue-preread-start">Mulai Mengantri</button>';
 h.c.route='queue';h.state.capabilities={queueBookingReview:true};h.state.operations=OPERATIONS.map(op=>({...op}));
 h.state.results.set(OPERATIONS.find(op=>op.endpoint==='account/account_summary').id,envelope({nama:'Pemohon SINTETIS',nomorIdentitas:'0000000000000000',userLevel:2,isIkd:false,kantorId:'canonical-A'}));
 const owner=()=>h.c.flowResults.get('queue:preread');
 Object.assign(h.c,model,{createQueuePreread,createQueueBooking,queueBookingView,Date,Intl,BigInt,$:selector=>selector==='#main [data-queue-preread]'?main.querySelector('[data-queue-preread]'):h.document.querySelector(selector),head:(_k,title)=>`<h1>${title}</h1>`,empty:(title,text)=>`<h3>${title}</h3><p>${text}</p>`,render:()=>{h.c.renderCount++;main.innerHTML=owner()?h.c.queuePrereadPage(owner()):'<button data-action="queue-preread-start">Mulai Mengantri</button>';}});
 vm.runInContext(helpers+'\n'+handlers,h.c);
 return {...h,main,owner,button:action=>main.querySelector(`[data-action="${action}"]`),click:node=>Promise.all((h.document.listeners.get('click')??[]).map(fn=>fn({target:node,preventDefault(){}}))),async change(id,value){const node=main.querySelector('#'+id);node.value=value;await Promise.all((h.document.listeners.get('change')??[]).map(fn=>fn({target:node})));}};
}
async function enter(h,{contextId='opaque-context',rows=[loket]}={}){
 let work=h.click(h.button('queue-preread-start'));await h.resolve(work,envelope([office]));
 work=h.change('queue-preread-office','0');await h.resolve(work,envelope([location]));await h.change('queue-preread-location','0');
 work=h.click(h.button('queue-preread-next'));await h.resolve(work,{...envelope(rows),bookingContextId:contextId});
 h.calls.at(-1).resolve({result:envelope([])});await new Promise(resolve=>setImmediate(resolve));
}
const reviewed=()=>({status:200,data:{error:false,message:'Batas booking tersedia',quotaAvailable:true,review:{},reviewId:'opaque-review',createAvailable:false}});
test('explicit row review sends only opaque server context, original index, count and browser zone',async()=>{
 const h=setup();await enter(h,{rows:[loket,{...loket,nama:'Second same ID'}]});await h.change('queue-preread-count','4');assert.equal(h.calls.length,4);
 const rows=h.main.querySelectorAll('[data-action="queue-preread-review"]'),work=h.click(rows[1]);
 const call=h.calls.at(-1),body=plain(call.options.body);assert.equal(call.path,'/api/execute');assert.equal(body.confirm,true);assert.equal(body.operationId,OPERATIONS.find(op=>op.path==='api/booking/limit/').id);
 assert.deepEqual(body.values,{contextId:'opaque-context',rowIndex:1,documentCount:4,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});assert.doesNotMatch(JSON.stringify(body),/0000000000000000|raw-loket|Pemohon/);
 await h.resolve(work,reviewed());assert.match(h.main.textContent,/Konfirmasi Antrian/);assert.match(h.main.textContent,/Second same ID/);assert.equal(h.button('queue-booking-confirm').disabled,true);assert.equal(h.owner().controller.bookingLocked(),true);
 const calls=h.calls.length;await h.click(h.button('queue-booking-cancel'));assert.equal(h.owner().controller.bookingLocked(),false);assert.equal(h.calls.length,calls);assert.equal(h.main.querySelector('[data-queue-booking]'),null);
});
test('quota locks current source controls and duplicate review cannot dispatch twice',async()=>{
 const h=setup();await enter(h);const row=h.button('queue-preread-review'),work=h.click(row),calls=h.calls.length;
 for(const id of ['queue-preread-count','queue-preread-date'])assert.equal(h.main.querySelector('#'+id).disabled,true);
 for(const action of ['queue-preread-back','queue-preread-refresh','queue-preread-close','queue-preread-review'])assert.equal(h.button(action).disabled,true);
 await h.click(row);assert.equal(h.calls.length,calls);assert.equal(h.owner().controller.setDocumentCount(5),false);assert.equal(h.owner().controller.back(),false);
 await h.resolve(work,reviewed());assert.match(h.main.textContent,/Layanan notifikasi/);assert.equal(h.main.querySelector('img'),null);
});
test('server full/closing verdict stays literal and cannot be overridden by local clock or create',async()=>{
 for(const message of ['Wah, kuota penuh SINTETIS','Kantor tutup SINTETIS','']){const h=setup();await enter(h);const work=h.click(h.button('queue-preread-review'));await h.resolve(work,{status:200,data:{error:true,message,quotaAvailable:true,review:null,reviewId:null,createAvailable:false}});assert.equal(h.main.querySelector('[data-queue-booking-message]').textContent,message);assert.equal(h.button('queue-booking-confirm'),null);assert.equal(h.owner().controller.bookingLocked(),false);assert.equal(h.calls.length,5);}
});
test('missing availability context cannot send identity or fabricated request and shows local failure',async()=>{
 const h=setup();await enter(h,{contextId:null});await h.click(h.button('queue-preread-review'));assert.equal(h.calls.length,4);assert.equal(h.owner().booking.snapshot().requiresReload,true);assert.equal(h.state.authenticated,true);
});
test('late quota result after route retirement has no visible result or authentication effect',async()=>{
 for(const rejected of [false,true]){const h=setup();await enter(h);const owner=h.owner(),work=h.click(h.button('queue-preread-review'));h.c.route='account';if(rejected)await h.reject(work,Object.assign(new Error('old'),{code:'SESSION_EXPIRED'}));else await h.resolve(work,reviewed());assert.equal(h.state.authenticated,true);assert.notEqual(owner.booking.snapshot().stage,'review');assert.equal(h.calls.length,5);}
});
test('new availability response replaces retired review host and context before another quota request',async()=>{
 const h=setup();await enter(h);let work=h.click(h.button('queue-preread-review'));await h.resolve(work,reviewed());await h.click(h.button('queue-booking-cancel'));const previous=h.owner().booking;
 work=h.click(h.button('queue-preread-refresh'));assert.equal(previous.snapshot().stage,'disposed');await h.resolve(work,{...envelope([loket]),bookingContextId:'new-context'});
 work=h.click(h.button('queue-preread-review'));assert.equal(h.calls.at(-1).options.body.values.contextId,'new-context');await h.resolve(work,reviewed());
});
test('no configured notification means browser controller cannot submit even if invoked directly',async()=>{
 const h=setup();await enter(h);const work=h.click(h.button('queue-preread-review'));await h.resolve(work,reviewed());const calls=h.calls.length;assert.equal(await h.owner().booking.confirm(),false);assert.equal(h.calls.length,calls);assert.equal(h.owner().booking.snapshot().stage,'review');
});
test('one render after trusted applicant change releases stale review controls for recovery',async()=>{
 const h=setup();await enter(h);const work=h.click(h.button('queue-preread-review'));await h.resolve(work,reviewed());
 const id=OPERATIONS.find(op=>op.endpoint==='account/account_summary').id,previous=h.state.results.get(id);
 h.state.results.set(id,envelope({...previous.data.data,nama:'Changed applicant SINTETIS',nomorIdentitas:'1111111111111111'}));h.c.render();
 assert.equal(h.owner().booking.snapshot().requiresReload,true);assert.equal(h.owner().controller.bookingLocked(),false);
 for(const action of ['queue-preread-back','queue-preread-refresh','queue-preread-close'])assert.equal(h.button(action).disabled,false);
 assert.equal(h.main.querySelector('#queue-preread-count').disabled,false);assert.equal(h.calls.length,5);
});
test('server capability absence preserves old explicit local review and sends no quota request',async()=>{
 const h=setup();h.state.capabilities.queueBookingReview=false;await enter(h);await h.click(h.button('queue-preread-review'));assert.ok(h.main.querySelector('[data-queue-preread-review]'));assert.equal(h.calls.length,4);
});
test('catalog review maps only the exact application-auth quota profile to its fixed Directus destination',()=>{
 const h=setup();vm.runInContext(source.find(line=>line.startsWith('function operationDestination(')),h.c);
 const op=OPERATIONS.find(op=>op.path==='api/booking/limit/');assert.equal(h.c.operationDestination(op),'https://aplikasi.atrbpn.go.id/konsol/antrian/directus/');
 for(const patch of [{id:'other'},{path:'api/booking/'},{method:'GET'},{auth:'none'},{upstreamAuthentication:'session'},{serviceId:'other'}])assert.equal(h.c.operationDestination({...op,...patch}),null);
 assert.equal(h.calls.length,0);
});
