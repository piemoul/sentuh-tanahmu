import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplotting} from '../assets/swaplotting/controller.js';
import {SWAPLOTTING_INITIAL_CAMERA} from '../assets/swaplotting/model.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const profile={userLevel:2,isIkd:false,nama:' Raw Name ',nomorHp:'00 raw',email:'mail raw'};
function fixture(options={}){const calls=[],changes=[],auth=[],reads=options.read??(async kind=>kind==='disclaimer'?{}:[]);let active=true;const c=createSwaplotting({...options,read:(kind,values)=>{calls.push({kind,values:structuredClone(values)});return reads(kind,values);},changed:s=>changes.push(s),isCurrent:()=>active,onSessionError:e=>auth.push(e)});return {c,calls,changes,auth,retire:()=>active=false};}
async function form(h,kind='registered'){await h.c.loadDisclaimer();await h.c.openForm(kind);}

test('construction has no traffic or device action; only explicit declared reads are exposed',async()=>{
 const h=fixture();assert.deepEqual(h.calls,[]);for(const key of ['submit','sendOtp','upload','getCurrentPosition','camera','save'])assert.equal(h.c[key],undefined);
 assert.equal(await h.c.openForm('registered'),false);assert.deepEqual(h.calls,[]);await form(h);
 assert.deepEqual(h.calls,[{kind:'disclaimer',values:{}},{kind:'offices',values:{nama:'',tipeKantor:''}}]);
 assert.deepEqual(h.c.snapshot().point,{lat:-0.792918,lng:116.482347,source:'initial-viewport'});assert.equal(h.c.snapshot().disclaimerAcknowledged,false);
});

test('nonempty raw disclaimer needs actual local accept, while successful null/empty skips without fabricated acknowledgment',async()=>{
 for(const message of [null,'']){const h=fixture({read:async kind=>kind==='disclaimer'?{message}:[]});await form(h);assert.equal(h.c.snapshot().screen,'registered');assert.equal(h.c.snapshot().disclaimerAcknowledged,false);assert.equal(h.c.acceptDisclaimer(),false);}
 const h=fixture({read:async kind=>kind==='disclaimer'?{message:' ',message2:'remote terms'}:[]});await h.c.loadDisclaimer();assert.equal(h.c.snapshot().disclaimerVisible,true);assert.equal(await h.c.openForm('registered'),false);assert.equal(h.c.acceptDisclaimer(),true);assert.equal(h.c.acceptDisclaimer(),false);await h.c.openForm('registered');assert.equal(h.calls.length,2);
});

test('failed and malformed disclaimer hold forms with retry; decline only invokes local exit',async()=>{
 let tries=0,declined=0;const h=fixture({read:async()=>++tries===1?Promise.reject(new Error('retryable')):tries===2?{message:3}:{message:'terms'},onDecline:()=>declined++});
 assert.equal(await h.c.loadDisclaimer(),false);assert.equal(h.c.snapshot().errors.disclaimer,'retryable');assert.equal(await h.c.openForm('registered'),false);
 assert.equal(await h.c.loadDisclaimer(),false);assert.equal(h.c.snapshot().disclaimerStatus,'error');await h.c.loadDisclaimer();assert.equal(h.c.declineDisclaimer(),true);assert.equal(declined,1);assert.equal(h.c.snapshot().canOpenForm,false);assert.equal(h.calls.length,3);assert.equal(h.c.declineDisclaimer(),false);
});

test('camera selection is map-only and form handoff keeps the raw camera target independent of references',async()=>{
 const h=fixture();assert.equal(h.c.setCameraTarget({lat:-6.123456789,lng:106.23456789,zoom:17.25}),true);assert.equal(h.c.setCameraTarget({lat:-6,lng:106}),true);assert.equal(h.c.snapshot().cameraTarget.zoom,17.25);await form(h);
 assert.deepEqual(h.c.snapshot().point,{lat:-6,lng:106,source:'map-camera'});assert.equal(h.c.setCameraTarget({lat:0,lng:0}),false);
 h.c.backToMap();assert.equal(h.c.snapshot().point,null);assert.deepEqual(h.c.snapshot().cameraTarget,{lat:-6,lng:106,zoom:17.25});assert.deepEqual(h.c.snapshot().initialCamera,SWAPLOTTING_INITIAL_CAMERA);
});

test('office/desa uses original IDs and clears dependent choices before the new read completes',async()=>{
 const second=deferred(),h=fixture({read:async(kind,values)=>kind==='disclaimer'?{}:kind==='offices'?[{KantorId:' raw-A ',Nama:'A'},{KantorId:'B',Nama:'B'},{KantorId:null}]:values.kantorid===' raw-A '?[{Kode:'wrong',WilayahId:' original-region ',Nama:'R'}]:second.promise});await form(h);
 await h.c.selectOffice(0);assert.deepEqual(h.calls.at(-1),{kind:'regions',values:{kantorid:' raw-A '}});assert.equal(h.c.selectRegion(0),true);assert.equal(h.c.snapshot().region.code,' original-region ');
 const waiting=h.c.selectOffice(1),pending=h.c.snapshot();assert.equal(pending.region,null);assert.deepEqual(pending.regions,[]);assert.equal(pending.pending.regions,true);assert.equal(h.c.selectRegion(0),false);
 second.resolve([{WilayahId:'B-region'}]);await waiting;assert.equal(h.c.selectRegion(0),true);assert.equal(h.c.snapshot().region.code,'B-region');assert.equal(await h.c.selectOffice(2),false);
});

test('office reads do not erase typed land fields and snapshots cannot mutate controller state',async()=>{
 const office=deferred(),h=fixture({read:async kind=>kind==='disclaimer'?{}:office.promise});await h.c.loadDisclaimer();const opening=h.c.openForm('registered');assert.equal(h.c.setField('number',' 000? raw '),true);assert.equal(h.c.setField('review','draft <&>'),true);assert.equal(await h.c.loadOffices(),false);assert.equal(h.calls.length,2);office.resolve([{KantorId:'a'}]);await opening;
 const snap=h.c.snapshot();assert.equal(snap.fields.number,' 000? raw ');snap.fields.number='tampered';snap.offices[0].KantorId='tampered';assert.equal(h.c.snapshot().fields.number,' 000? raw ');assert.equal(h.c.snapshot().offices[0].KantorId,'a');
});

test('stale office requests after switching form never overwrite a new form or signal stale auth',async()=>{
 const first=deferred();let offices=0;const h=fixture({read:async kind=>kind==='disclaimer'?{}:++offices===1?first.promise:[{KantorId:'new'}]});await h.c.loadDisclaimer();const old=h.c.openForm('registered');await h.c.openForm('unregistered');first.reject(Object.assign(new Error('old auth'),{code:'SESSION_EXPIRED'}));await old;
 assert.equal(h.c.snapshot().screen,'unregistered');assert.deepEqual(h.c.snapshot().offices,[{KantorId:'new',Nama:null}]);assert.deepEqual(h.auth,[]);assert.equal(h.c.snapshot().errors.offices,'');
});

test('out-of-order desa success and failure cannot overwrite the currently selected office',async()=>{
 const a=deferred(),b=deferred();const h=fixture({read:async(kind,v)=>kind==='disclaimer'?{}:kind==='offices'?[{KantorId:'A'},{KantorId:'B'}]:v.kantorid==='A'?a.promise:b.promise});await form(h);const pa=h.c.selectOffice(0),pb=h.c.selectOffice(1);b.resolve([{WilayahId:'B'}]);await pb;a.reject(Object.assign(new Error('stale'),{code:'AUTH_REQUIRED'}));await pa;
 assert.equal(h.c.snapshot().office.KantorId,'B');assert.equal(h.c.snapshot().regions[0].code,'B');assert.equal(h.c.snapshot().errors.regions,'');assert.deepEqual(h.auth,[]);
});

test('route/session retirement and explicit disposal suppress late state and private data',async()=>{
 for(const dispose of [false,true]){const request=deferred(),h=fixture({profile,read:async kind=>kind==='disclaimer'?{}:request.promise});await h.c.loadDisclaimer();const pending=h.c.openForm('registered');h.c.setField('number','private draft');const count=h.changes.length;if(dispose)h.c.dispose();else h.retire();request.reject(Object.assign(new Error('late'),{code:'SESSION_EXPIRED'}));await pending;assert.equal(h.changes.length,count);assert.deepEqual(h.auth,[]);if(dispose){assert.equal(h.c.snapshot().screen,'disposed');assert.equal(h.c.snapshot().fields.number,null);assert.equal(h.c.snapshot().owner.data,null);assert.equal(h.c.snapshot().point,null);assert.equal(h.c.snapshot().disclaimer,null);}assert.equal(h.c.setField('number','late'),false);}
});

test('current auth failure reaches the host once and is not reinterpreted as a successful empty reference',async()=>{
 const h=fixture({read:async kind=>kind==='disclaimer'?{}:Promise.reject(Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}))});await form(h);assert.equal(h.auth.length,1);assert.equal(h.c.snapshot().errors.offices,'expired');assert.equal(h.c.snapshot().pending.offices,false);assert.deepEqual(h.c.snapshot().offices,[]);
});

test('trusted late account-summary getter is refreshed at form entry and cannot be replaced by sign-in fields',async()=>{
 let cache=null,reads=0;const h=fixture({profile:()=>{reads++;return cache;}});assert.equal(reads,0);await h.c.loadDisclaimer();cache=profile;await h.c.openForm('registered');assert.equal(reads,1);assert.deepEqual(h.c.snapshot().owner.data,{name:' Raw Name ',phone:'00 raw',email:'mail raw'});assert.equal(h.c.snapshot().fields.name,' Raw Name ');assert.equal(h.c.setField('name','forged'),false);
 h.c.backToMap();cache={userLevel:3,isIkd:false,nama:null,nomorHp:null,email:null};await h.c.openForm('unregistered');assert.equal(reads,2);assert.equal(h.c.snapshot().fields.name,'');assert.equal(h.c.snapshot().fields.phone,'');assert.equal(h.c.snapshot().fields.email,'');
 h.c.setField('address','land draft');h.c.setProfile({name:'sign-in',email:'sign-in'});assert.equal(h.c.snapshot().owner.status,'unresolved');assert.equal(h.c.snapshot().fields.name,null);assert.equal(h.c.snapshot().fields.address,'land draft');
});

test('owner reentry revocation/getter error fail closed and disposal releases the getter',async()=>{
 let cache=profile,getterCalls=0;const h=fixture({profile:()=>{getterCalls++;if(cache==='throw')throw Error('private cache error');return cache;}});await form(h);h.c.validate();h.c.setProfile(()=>({userLevel:2,isIkd:true,nama:'not eligible'}));assert.equal(h.c.snapshot().owner.status,'unresolved');assert.equal(h.c.snapshot().validation.flags.name,true);h.c.backToMap();cache='throw';h.c.setProfile(()=>{getterCalls++;throw Error('cache');});await h.c.openForm('registered');assert.equal(h.c.snapshot().owner.status,'unresolved');const count=getterCalls;h.c.dispose();assert.equal(h.c.setProfile(profile),false);assert.equal(await h.c.openForm('registered'),false);assert.equal(getterCalls,count);
});

test('fixed choices and raw predicates remain local; missing capture keeps Kirim boundary unresolved',async()=>{
 const h=fixture({profile});await form(h);assert.equal(h.c.selectRight('8'),true);assert.equal(h.c.selectRight(8),false);assert.equal(h.c.selectRight('6'),false);h.c.setField('number',' ');h.c.setField('review','raw');assert.equal(h.c.validate(),false);assert.equal(h.c.snapshot().validation.flags.photos,true);assert.equal(h.c.snapshot().validation.flags.name,false);assert.equal(h.c.selectBasis(0),false);
 await h.c.openForm('unregistered');assert.equal(h.c.selectBasis(10),true);assert.equal(h.c.snapshot().basis,'Bukti Lainnya');assert.equal(h.c.selectTax(8),true);assert.equal(h.c.snapshot().tax,'Dokumen Perpajakan Lain');assert.equal(h.c.selectRight('1'),false);assert.equal(h.c.selectBasis(11),false);assert.equal(h.c.selectTax(-1),false);assert.equal(h.c.setField('number','wrong form'),false);assert.equal(h.c.setField('address',3),false);assert.equal(h.calls.some(row=>!['disclaimer','offices','regions'].includes(row.kind)),false);
});
