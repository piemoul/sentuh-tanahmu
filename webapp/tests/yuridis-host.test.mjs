import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {createYuridisHost} from '../assets/yuridis/host.js';

// Use the existing browser API test adapter. Real production host/controllers
// are imported; execute is a deferred synthetic transport, never HTTP.
const source=fs.readFileSync(new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url),'utf8');
const dom=vm.runInNewContext('('+source.slice(source.indexOf('function dom(document){'),source.indexOf('function setup('))+')');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const ids={offices:'get-legacy-kantah-d10364',feed:'get-announcement-yuridis-bykantor-d0fb64',location:'get-lokasibidang-getbypersilid-dad6f4',boundary:'get-legacy-getparcelboundarybyid-dbaeb8',review:'post-review-last-user-review-dad1dc',post:'post-review-post-deb030'};
const operations=()=>[
 ['offices','GET','legacy/Kantah?nama={value}&tipeKantor={value}','optionalSession','none','read'],
 ['feed','GET','announcement/yuridis_byKantor?kantorId={value}','optionalSession','none','read'],
 ['location','GET','LokasiBidang/GetByPersilId','session','none','read'],
 ['boundary','GET','legacy/GetParcelBoundaryById?persilid={value}','session','none','read'],
 ['review','POST','review/last_user_review','session','form','read'],
 ['post','POST','review/post','session','multipart','write']
].map(([kind,method,endpoint,auth,encoding,effect])=>({id:ids[kind],method,endpoint,auth,encoding,effect,serviceId:'main',enabled:true,...(effect==='write'?{requiresConfirmation:true}:{})}));
const offices=[{KantorId:' returned-office ',Nama:'Synthetic Office'}];
const row=(id=' original-persil ',name='Synthetic Owner')=>({persilId:id,pemohon:name,nomorBerkas:'NOT-PERSIL',nomorPengumuman:'NOT-MAP-ID',nib:'NOT-CONTENT-ID',wilayah:'Synthetic Village',tanggalMulai:'2026-10-20',tanggalSelesai:'2026-11-20',luasPersil:125,kegiatan:'Rutin'});
const reviewRow=comment=>({reviewId:'never-use-review-id',rating:3,comment,createdAt:'2026-10-20',reviewPhotos:[]});
const geometry=()=>({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.1,-6],[106.1,-5.9],[106,-6]]]},properties:{}}]});

function setup({context:patch={},prepare=async()=>{}}={}){
 const {document}=harness();dom(document);
 const proto=Object.getPrototypeOf(document.body);if(!proto.setSelectionRange)proto.setSelectionRange=function(start,end,direction){this.selectionStart=start;this.selectionEnd=end;this.selectionDirection=direction;};if(!proto.hasAttribute)proto.hasAttribute=function(name){return this.getAttribute(name)!==null;};
 const main=document.body.appendChild(document.createElement('main'));main.setAttribute('id','main');
 const query=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):query(selector);
 document.defaultView={fetch(){assert.fail('No direct HTTP');},navigator:{geolocation:{getCurrentPosition(){assert.fail('No GPS');}},mediaDevices:{getUserMedia(){assert.fail('No camera');}}}};
 const context={epoch:3,route:'announcements',tab:'yuridis',logoutPending:false,authenticated:true,configured:true,loading:false,favoriteOfficeId:' returned-office ',operations:operations(),...patch};
 const calls=[],sessions=[],reads=[],maps=[],posts=new Map();let prepares=0;
 const host=createYuridisHost({document,getContext:()=>context,execute:payload=>{const wait=deferred();calls.push({payload,...wait});return wait.promise;},prepare:async()=>{prepares++;return prepare();},formatDate:value=>'DATE('+value+')',renderMap:value=>{maps.push(value);return '<p data-synthetic-map>Rendered boundary</p>';},onRead:(...args)=>reads.push(args),onSessionError:error=>sessions.push(error.code),posts});
 const slot=()=>main.querySelector('[data-yuridis-host]');main.innerHTML=host.html();
 const fire=async(type,target,root=slot())=>{assert.ok(target,'Existing '+type+' target');for(const listener of [...root?.listeners.get(type)??[]])await listener({target,preventDefault(){this.defaultPrevented=true;}});};
 const action=(name,index)=>fire('click',slot().querySelector(`[data-action="${name}"]${index===undefined?'':`[data-index="${index}"]`}`));
 const reply=async(index,data,status=200)=>{calls[index].resolve({result:{status,data}});await tick();};
 const dialog=()=>document.body.querySelector('dialog[aria-labelledby="lost-review-compose-title"]');
 async function composeReady(){await action('yuridis-review-compose');const d=dialog();assert.ok(d);await fire('click',d.querySelector('[data-review-rate="4"]'),d);const area=d.querySelector('#lost-review-comment');area.value=' raw <Yuridis> comment ';await fire('input',area,d);return d;}
 return{host,document,main,context,calls,sessions,reads,maps,posts,slot,fire,action,reply,dialog,composeReady,prepares:()=>prepares,dispose:()=>host.dispose()};
}
async function ready(h,{officeRows=offices,rows=[row()]}={}){
 await tick();assert.equal(h.calls.at(-1).payload.operationId,ids.offices);await h.reply(h.calls.length-1,officeRows);assert.equal(h.calls.at(-1).payload.operationId,ids.feed);await h.reply(h.calls.length-1,{data:rows});return h;
}
async function detail(h,index=0,{reviewReply={data:[]}}={}){
 await h.action('yuridis-detail',index);await tick();assert.equal(h.calls.at(-1).payload.operationId,ids.review);await h.reply(h.calls.length-1,reviewReply);return h;
}

test('host starts once, uses exact own office ID and never falls back to generic form execution',async t=>{
 const h=setup();t.after(h.dispose);await ready(h);h.host.attach();h.host.paint();h.main.innerHTML=h.host.html();await tick();
 assert.equal(h.prepares(),1);assert.deepEqual(h.calls.map(c=>c.payload),[{operationId:ids.offices,values:{nama:'',tipeKantor:''}},{operationId:ids.feed,values:{kantorId:' returned-office '}}]);assert.equal(h.main.querySelectorAll('[data-action="yuridis-detail"]').length,1);assert.equal(h.main.querySelector('script'),null);
});

test('full catalog contract gates menu reads; wrong identity/path/auth/effect cannot dispatch',async t=>{
 for(const field of ['id','method','endpoint','auth','encoding','effect','serviceId','enabled']){
  const rows=operations(),op=rows.find(o=>o.id===ids.feed);op[field]=field==='enabled'?false:'wrong';const h=setup({context:{operations:rows}});t.after(h.dispose);await tick();assert.equal(h.calls.length,0);assert.equal(h.prepares(),0);assert.match(h.main.textContent,/Pembacaan pengumuman belum tersedia/);
 }
});

test('ordinary optional profile-prepare failure still loads real offices; current auth failure stops and notifies',async t=>{
 const ordinary=setup({prepare:async()=>{throw new Error('Synthetic profile timeout');}});t.after(ordinary.dispose);await ready(ordinary);assert.equal(ordinary.calls.length,2);assert.deepEqual(ordinary.sessions,[]);
 const auth=setup({prepare:async()=>{throw Object.assign(new Error('Synthetic auth failure'),{code:'SESSION_EXPIRED'});}});t.after(auth.dispose);await tick();assert.equal(auth.calls.length,0);assert.deepEqual(auth.sessions,['SESSION_EXPIRED']);
});

test('empty/failed offices keep profile-favorite feed reachable and refresh never uses DOM office IDs',async t=>{
 for(const failed of [false,true]){
  const h=setup({context:{favoriteOfficeId:' profile-only '}});t.after(h.dispose);await tick();if(failed){h.calls[0].reject(new Error('Synthetic office timeout'));await tick();}else await h.reply(0,[]);
  assert.deepEqual(h.calls[1].payload.values,{kantorId:' profile-only '});await h.reply(1,{data:[row()]});const refresh=h.slot().querySelector('[data-action="yuridis-refresh"]');assert.equal(refresh.disabled,false);const work=h.action('yuridis-refresh');assert.deepEqual(h.calls.at(-1).payload.values,{kantorId:' profile-only '});await h.reply(h.calls.length-1,{data:[]});await work;
  const select=h.slot().querySelector('#yuridis-office');select.value='attacker-office';const count=h.calls.length;await h.fire('change',select);assert.equal(h.calls.length,count);assert.equal(h.host.controller.snapshot().officeIndex,null);
 }
});

test('local query focus/caret and original source indices survive paint without another read',async t=>{
 const h=setup();t.after(h.dispose);await ready(h,{rows:[row('A','First'),row('B','<Match>'),row('B','<Match>')]});const input=h.slot().querySelector('#yuridis-query');input.value='MATCH';input.focus();input.selectionStart=1;input.selectionEnd=4;input.selectionDirection='forward';await h.fire('input',input);
 assert.equal(h.document.activeElement.id,'yuridis-query');assert.equal(h.document.activeElement.selectionStart,1);assert.equal(h.document.activeElement.selectionEnd,4);assert.equal(h.calls.length,2);assert.deepEqual(h.host.controller.snapshot().entries.map(x=>x.index),[1,2]);assert.equal(h.main.querySelector('Match'),null);
 await h.action('yuridis-detail',2);await tick();assert.deepEqual(h.calls.at(-1).payload,{operationId:ids.review,values:{reviewType:'sertipikatSaya',contentId:'B'}});
});

test('detail autoloads exactly last-user review once and map completion never restarts the review loop',async t=>{
 const h=setup();t.after(h.dispose);await detail(await ready(h),0,{reviewReply:{error:true,data:[reviewRow('Current review')]}});const count=h.calls.length;assert.match(h.main.textContent,/Current review/);h.host.paint();h.host.paint();await tick();assert.equal(h.calls.length,count);
 const map=h.action('yuridis-map');assert.deepEqual(h.calls.at(-1).payload,{operationId:ids.location,values:{persilId:' original-persil '}});await h.reply(h.calls.length-1,{error:false,data:{persilId:' returned-map-persil '}});assert.deepEqual(h.calls.at(-1).payload,{operationId:ids.boundary,values:{persilid:' returned-map-persil '}});await h.reply(h.calls.length-1,geometry());await map;assert.match(h.main.textContent,/Rendered boundary/);assert.equal(h.calls.filter(c=>c.payload.operationId===ids.review).length,1);assert.ok(h.maps.length);
});

test('duplicate pending review retry is blocked and read failure keeps explicit retry in current detail',async t=>{
 const h=setup();t.after(h.dispose);await ready(h);await h.action('yuridis-detail',0);await tick();const index=h.calls.length-1;h.host.paint();h.host.attach();await tick();assert.equal(h.calls.filter(c=>c.payload.operationId===ids.review).length,1);
 h.calls[index].reject(new Error('<Synthetic review timeout>'));await tick();assert.match(h.main.textContent,/<Synthetic review timeout>/);assert.equal(h.main.querySelector('Synthetic'),null);const button=h.slot().querySelector('[data-action="yuridis-review-retry"]'),retry=h.fire('click',button);const count=h.calls.length;await h.fire('click',button);assert.equal(h.calls.length,count);await h.reply(count-1,{data:[]});await retry;assert.equal(h.calls.filter(c=>c.payload.operationId===ids.review).length,2);
});

test('switching detail retires pending old review success/401 without changing current detail or session',async t=>{
 for(const outcome of ['success','auth']){
  const h=setup();t.after(h.dispose);await ready(h,{rows:[row('A','First'),row('B','Second')]});await h.action('yuridis-detail',0);await tick();const old=h.calls.length-1;await h.action('yuridis-back');await h.action('yuridis-detail',1);await tick();const current=h.calls.length-1;await h.reply(current,{data:[reviewRow('Second review')]});
  if(outcome==='auth')h.calls[old].reject(Object.assign(new Error('Old expiry'),{code:'SESSION_EXPIRED'}));else h.calls[old].resolve({result:{status:200,data:{data:[reviewRow('Stale review')]}}});await tick();assert.match(h.main.textContent,/Second review/);assert.doesNotMatch(h.main.textContent,/Stale review/);assert.deepEqual(h.sessions,[]);assert.equal(h.host.controller.snapshot().detail.item.persilId,'B');
 }
});

test('route/tab/epoch/logout changes retire pending reads and old detached handlers',async t=>{
 for(const reason of ['route','tab','epoch','logout'])for(const outcome of ['success','auth']){
  const h=setup();t.after(h.dispose);await ready(h);const oldSlot=h.slot(),target=oldSlot.querySelector('[data-action="yuridis-detail"]'),listeners=[...oldSlot.listeners.get('click')];const work=h.host.controller.refresh(),index=h.calls.length-1;
  if(reason==='route')h.context.route='account';if(reason==='tab')h.context.tab='hilang';if(reason==='epoch')h.context.epoch++;if(reason==='logout')h.context.logoutPending=true;
  h.main.innerHTML='<p data-new-owner>New owner</p>';const before=h.main.innerHTML,count=h.calls.length;
  if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('Retired expiry'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve({result:{status:200,data:{data:[row('stale')]}}});assert.equal(await work,false);
  for(const listener of listeners)await listener({target,preventDefault(){}});assert.equal(h.main.innerHTML,before);assert.equal(h.calls.length,count);assert.deepEqual(h.sessions,[]);h.dispose();assert.equal(h.main.innerHTML,before);
 }
});

test('replaced slot can rebind once; detached old handlers cannot refresh or select records',async t=>{
 const h=setup();t.after(h.dispose);await ready(h);const old=h.slot(),target=old.querySelector('[data-action="yuridis-refresh"]'),listeners=[...old.listeners.get('click')];h.main.innerHTML=h.host.html();await tick();assert.notEqual(h.slot(),old);assert.equal((old.listeners.get('click')??[]).length,0);const count=h.calls.length;for(const listener of listeners)await listener({target,preventDefault(){}});assert.equal(h.calls.length,count);
});

test('compose binds exact selected persil and sertipikatSaya, confirms explicitly, then rereads same last-user endpoint',async t=>{
 const h=setup();t.after(h.dispose);await detail(await ready(h));const d=await h.composeReady(),count=h.calls.length;assert.equal(h.posts.size,0);const form=d.querySelector('[data-review-compose-form]');await h.fire('submit',form,d);assert.equal(h.calls.length,count+1);const write=h.calls.at(-1);assert.deepEqual(write.payload,{operationId:ids.post,values:{contentId:' original-persil ',reviewType:'sertipikatSaya',comment:' raw <Yuridis> comment ',rating:4},files:[],confirm:true});assert.equal(h.posts.size,1);await h.fire('submit',form,d);assert.equal(h.calls.length,count+1);
 write.resolve({result:{status:200,data:false}});await tick();await tick();assert.equal(h.posts.size,0);assert.equal(h.dialog(),null);assert.deepEqual(h.calls.at(-1).payload,{operationId:ids.review,values:{reviewType:'sertipikatSaya',contentId:' original-persil '}});await h.reply(h.calls.length-1,{data:[reviewRow('New review')]});assert.match(h.main.textContent,/New review/);
});

test('unconfirmed compose outcome never triggers reread or a second automatic write',async t=>{
 for(const reply of [{result:{status:200,data:true}},{result:{status:200,data:null}},{result:{status:202,data:false}}]){
  const h=setup();t.after(h.dispose);await detail(await ready(h));const d=await h.composeReady();await h.fire('submit',d.querySelector('[data-review-compose-form]'),d);const count=h.calls.length;h.calls.at(-1).resolve(reply);await tick();assert.equal(h.calls.length,count);assert.equal(h.calls.filter(c=>c.payload.operationId===ids.post).length,1);assert.ok(h.dialog());assert.match(h.dialog().textContent,/belum terkonfirmasi/);assert.equal(h.posts.size,0);
 }
});

test('retired compose completion cannot reread another detail or log out a replacement session',async t=>{
 for(const outcome of ['success','auth']){
  const h=setup();t.after(h.dispose);await detail(await ready(h));const d=await h.composeReady();await h.fire('submit',d.querySelector('[data-review-compose-form]'),d);const index=h.calls.length-1;h.context.epoch++;h.main.innerHTML='<p>Replacement session</p>';h.dispose();const count=h.calls.length;
  if(outcome==='auth')h.calls[index].reject(Object.assign(new Error('Old expiry'),{code:'SESSION_EXPIRED'}));else h.calls[index].resolve({result:{status:200,data:false}});await tick();await tick();assert.equal(h.calls.length,count);assert.deepEqual(h.sessions,[]);assert.equal(h.dialog(),null);assert.match(h.main.textContent,/Replacement session/);assert.equal(h.posts.size,0);
 }
});

test('compose submission revalidates current post capability and connection before transport',async t=>{
 for(const change of ['post-disabled','post-auth','configured','loading']){
  const h=setup();t.after(h.dispose);await detail(await ready(h));const d=await h.composeReady(),count=h.calls.length;
  if(change==='post-disabled')h.context.operations.find(o=>o.id===ids.post).enabled=false;if(change==='post-auth')h.context.operations.find(o=>o.id===ids.post).auth='none';if(change==='configured')h.context.configured=false;if(change==='loading')h.context.loading=true;
  await h.fire('submit',d.querySelector('[data-review-compose-form]'),d);await tick();assert.equal(h.calls.length,count,change);assert.equal(h.posts.size,0);
 }
});
