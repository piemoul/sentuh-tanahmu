import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {createSwaplottingHost} from '../assets/swaplotting/host.js';

// Only the frozen test Element adapter is reused. Actual host/controller/view,
// owned real Blobs and an injected synthetic camera callback run below.
const adapterSource=fs.readFileSync(new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url),'utf8');
const dom=vm.runInNewContext('('+adapterSource.slice(adapterSource.indexOf('function dom(document){'),adapterSource.indexOf('function setup('))+')');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const origin='https://synthetic.invalid';
const photoPath=index=>`blob:${origin}/00000000-0000-4000-8000-${String(index).padStart(12,'0')}`;
const own={userLevel:2,isIkd:false,nama:'  OWNER <synth>  ',nomorHp:'  0000  ',email:'  synthetic@example.invalid  '};
const offices=[{KantorId:' OFFICE-A ',Nama:'Office <A>'},{KantorId:'OFFICE-B',Nama:'Office B'}];
const regions=[{WilayahId:' REGION-A ',Nama:'Region <A>',Kode:'WRONG-A'},{WilayahId:'REGION-B',Nama:'Region B',Kode:'WRONG-B'}];

function setup({profile=own,disclaimer={}}={}){
 const {document}=harness();dom(document);const main=document.body.appendChild(document.createElement('main'));main.setAttribute('id','main');
 const query=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):query(selector);
 const reads=[],configs=[],revoked=[],sessions=[],holds=new Map(),captureCalls=[];let current=true,profileValue=profile,capture;
 // A pending synthetic map-config promise avoids all tile/library work; opening
 // a form uses the same public controller target callback as a map event.
 document.defaultView={location:{origin},URL:{revokeObjectURL:url=>revoked.push(url)},fetch(path,options){assert.equal(path,'/api/maps/config');assert.equal(options.method,'GET');const wait=deferred();configs.push({...wait,options});return wait.promise;},navigator:{geolocation:{getCurrentPosition(){assert.fail('No GPS');},watchPosition(){assert.fail('No GPS');}},mediaDevices:{getUserMedia(){assert.fail('No hardware camera');}}}};
 const host=createSwaplottingHost({document,profile:()=>profileValue,isCurrent:()=>current,onSessionError:error=>sessions.push(error),read:async(kind,values)=>{reads.push({kind,values});const hold=holds.get(kind);if(hold){holds.delete(kind);return hold.promise;}if(kind==='disclaimer')return structuredClone(disclaimer);if(kind==='offices')return structuredClone(offices);if(kind==='regions')return structuredClone(regions);assert.fail('Unexpected read');},photoCaptureFactory:options=>{
  let active=null,disposed=false;
  capture={open(context){if(disposed)return false;active={...context};captureCalls.push(active);return true;},close(){if(!active)return;const context=active;active=null;options.onClose(context);},dispose(){this.close();disposed=true;},use(record){if(!active||!options.isCurrent())return false;const accepted=options.onUse(record,active);if(accepted)this.close();return accepted;},get context(){return active;},get disposed(){return disposed;}};return capture;
 }});
 main.innerHTML=host.html();
 const slot=()=>main.querySelector('[data-swaplotting-host]'),node=id=>main.querySelector('#'+id);
 const fire=async(target,type='click')=>{assert.ok(target,'Existing '+type+' target');for(const listener of [...slot()?.listeners.get(type)??[]])await listener({target,preventDefault(){}});};
 const h={document,main,host,reads,configs,revoked,sessions,captureCalls,slot,node,fire,review:()=>node('swaplotting-review-title'),action:name=>fire(slot().querySelector(`[data-action="${name}"]`)),change:async(id,value)=>{const target=node('swaplotting-'+id);assert.ok(target);target.value=value;await fire(target,'change');},type:async(id,value)=>{const target=node('swaplotting-'+id);assert.ok(target);target.value=value;await fire(target,'input');},profile:value=>profileValue=value,retire:()=>current=false,hold(kind){const wait=deferred();holds.set(kind,wait);return wait;},async addPhoto(index=1,bytes='SYNTHETIC DOCUMENT'){await this.action('swaplotting-photo-add');const blob=new Blob([bytes],{type:'image/jpeg'});blob.arrayBuffer=()=>assert.fail('Review must not read or transform photo bytes');assert.equal(capture.use({url:photoPath(index),blob}),true);return blob;},capture:()=>capture,dispose:()=>host.dispose()};
 return h;
}
async function form(t,kind='registered',options={}){
 const h=setup(options);t.after(()=>h.dispose());await tick();
 if(h.host.controller.snapshot().disclaimerVisible)await h.action('swaplotting-accept');
 h.host.controller.setCameraTarget({lat:-6.123456789,lng:106.75,zoom:12.5});
 await h.fire(h.slot().querySelector(`[data-action="swaplotting-open-form"][data-kind="${kind}"]`));
 await h.change('office','0');await h.change('region','0');
 if(kind==='registered'){await h.change('right','8');await h.type('number','  000123  ');}
 else{await h.change('basis','0');await h.change('tax','1');for(const [key,value]of Object.entries({address:'  ALAMAT <raw>  ',basisNumber:'  000 BASIS  ',basisDescription:'  BASIS DESC  ',taxNumber:'  000 TAX  ',taxDescription:'  TAX DESC  '}))await h.type(key,value);}
 await h.type('review','  RAW REVIEW <text>  ');await h.addPhoto();return h;
}
async function openReview(h){await h.action('swaplotting-review');assert.ok(h.review(),'Local review shown');return h.main.querySelector('[data-swaplotting-review]');}

test('both local review forms use owned bytes and no extra read, capture, transport or submit',async t=>{
 for(const kind of ['registered','unregistered']){
  const h=await form(t,kind),before=h.host.controller.snapshot(),reads=h.reads.length,configs=h.configs.length,captures=h.captureCalls.length;
  const review=await openReview(h);assert.match(review.textContent,/Draf ini belum dikirim/);assert.match(review.textContent,/Foto 1 · 18 byte/);assert.match(review.textContent,/RAW REVIEW <text>/);assert.match(review.textContent,/Spasi di awal\/akhir dibuang/);assert.equal(review.querySelector('text'),null);assert.equal(review.querySelector('synth'),null);assert.equal(h.document.activeElement,h.review());
  if(kind==='registered')assert.match(review.textContent,/Wakaf/);else{assert.match(review.textContent,/  000 BASIS  /);assert.match(review.textContent,/Letter C/);}
  assert.equal(h.reads.length,reads);assert.equal(h.configs.length,configs);assert.equal(h.captureCalls.length,captures);assert.equal(h.host.controller.submit,undefined);assert.equal(h.main.querySelector('button[aria-describedby="swaplotting-write-boundary"]').disabled,true);assert.deepEqual(h.host.controller.snapshot().photos,before.photos);
 }
});

test('closing local review retains active form, fields and owned photo; reopening does not recapture',async t=>{
 const h=await form(t),before=h.host.controller.snapshot();await openReview(h);await h.action('swaplotting-review-close');assert.equal(h.review(),null);assert.deepEqual(h.host.controller.snapshot().fields,before.fields);assert.deepEqual(h.host.controller.snapshot().photos,before.photos);assert.deepEqual(h.revoked,[]);assert.equal(h.document.activeElement,h.slot().querySelector('[data-action="swaplotting-review"]'));await openReview(h);assert.equal(h.captureCalls.length,1);
});

test('raw field edits invalidate review even though photoGeneration stays unchanged and preserve caret',async t=>{
 const h=await form(t);await openReview(h);const generation=h.host.controller.snapshot().photoGeneration,input=h.node('swaplotting-number');input.focus();input.selectionStart=2;input.selectionEnd=5;await h.type('number','  EDITED <number>  ');
 assert.equal(h.review(),null);assert.equal(h.host.controller.snapshot().photoGeneration,generation);assert.equal(h.node('swaplotting-number'),input);assert.equal(h.document.activeElement,input);assert.equal(input.value,'  EDITED <number>  ');await openReview(h);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/EDITED <number>/);assert.doesNotMatch(h.main.querySelector('[data-swaplotting-review]').textContent,/000123/);
});

test('trusted own-profile replacement clears review and new review uses current owner; revocation blocks it',async t=>{
 const h=await form(t);await openReview(h);h.profile({...own,nama:'NEW <owner>'});h.host.attach();assert.equal(h.review(),null);await openReview(h);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/NEW <owner>/);assert.doesNotMatch(h.main.querySelector('[data-swaplotting-review]').textContent,/OWNER <synth>/);
 h.profile({...own,isIkd:true});h.host.attach();assert.equal(h.review(),null);await h.action('swaplotting-review');assert.equal(h.review(),null);assert.equal(h.host.controller.snapshot().owner.status,'unresolved');assert.equal(h.host.controller.snapshot().validation.flags.name,true);assert.deepEqual(h.revoked,[]);
});

test('office reload invalidates review immediately and its late response cannot revive a closed form',async t=>{
 const h=await form(t);await openReview(h);const hold=h.hold('offices'),work=h.host.controller.loadOffices();assert.equal(h.review(),null);assert.equal(h.host.controller.snapshot().pending.offices,true);await h.action('swaplotting-review');assert.equal(h.review(),null);
 await h.action('swaplotting-back-map');hold.resolve(offices);assert.equal(await work,false);assert.equal(h.host.controller.snapshot().screen,'map');assert.equal(h.review(),null);assert.deepEqual(h.host.controller.snapshot().offices,[]);assert.deepEqual(h.revoked,[photoPath(1)]);
});

test('region, right and unregistered proof replacement retire review without losing captured bytes',async t=>{
 const h=await form(t);await openReview(h);await h.change('region','1');assert.equal(h.review(),null);await openReview(h);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/Region B/);await h.change('right','1');assert.equal(h.review(),null);await openReview(h);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/Hak Milik/);assert.deepEqual(h.revoked,[]);
 const u=await form(t,'unregistered');await openReview(u);await u.change('basis','2');assert.equal(u.review(),null);await openReview(u);assert.match(u.main.querySelector('[data-swaplotting-review]').textContent,/Akta Hibah/);await u.change('tax','2');assert.equal(u.review(),null);await openReview(u);assert.match(u.main.querySelector('[data-swaplotting-review]').textContent,/Girik/);assert.deepEqual(u.revoked,[]);
});

test('superseded region success or 401 cannot replace current reviewed references or expire its session',async t=>{
 for(const auth of [false,true]){
  const h=await form(t),hold=h.hold('regions'),old=h.host.controller.selectOffice(1);await h.change('office','0');await h.change('region','1');await openReview(h);const title=h.review(),revision=h.host.controller.snapshot().revision;
  if(auth)hold.reject(Object.assign(new Error('OLD SYNTHETIC SESSION'),{code:'SESSION_EXPIRED'}));else hold.resolve([{WilayahId:'OLD-REGION',Nama:'OLD RESULT'}]);assert.equal(await old,false);
  assert.equal(h.review(),title);assert.equal(h.host.controller.snapshot().revision,revision);assert.deepEqual(h.sessions,[]);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/Region B/);assert.doesNotMatch(h.main.textContent,/OLD RESULT|OLD SYNTHETIC SESSION/);
 }
});

test('retake replaces owned bytes, invalidates review and revokes old path once without reading bytes',async t=>{
 const h=await form(t);await openReview(h);const reads=h.reads.length;await h.fire(h.slot().querySelector('[data-action="swaplotting-photo-retake"]'));assert.equal(h.capture().context.oldPath,photoPath(1));const blob=new Blob(['NEW'],{type:'image/png'});blob.arrayBuffer=()=>assert.fail('No byte transformation');assert.equal(h.capture().use({url:photoPath(2),blob}),true);
 assert.equal(h.review(),null);assert.deepEqual(h.host.controller.snapshot().photos,[photoPath(2)]);assert.deepEqual(h.revoked,[photoPath(1)]);await openReview(h);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/Foto 1 · 3 byte/);assert.equal(h.reads.length,reads);
});

test('photo removal requires confirmation, then invalidates review and cannot review an empty photo list',async t=>{
 const h=await form(t);await openReview(h);await h.fire(h.slot().querySelector('[data-action="swaplotting-photo-remove"]'));let dialog=h.document.body.querySelector('[aria-labelledby="swaplotting-photo-removal-title"]');assert.ok(dialog?.open);assert.deepEqual(h.revoked,[]);
 for(const listener of [...dialog.listeners.get('click')??[]])listener({target:dialog.querySelector('[data-photo-removal="cancel"]'),preventDefault(){}});assert.ok(h.review());assert.deepEqual(h.host.controller.snapshot().photos,[photoPath(1)]);
 await h.fire(h.slot().querySelector('[data-action="swaplotting-photo-remove"]'));dialog=h.document.body.querySelector('[aria-labelledby="swaplotting-photo-removal-title"]');for(const listener of [...dialog.listeners.get('click')??[]])listener({target:dialog.querySelector('[data-photo-removal="remove"]'),preventDefault(){}});
 assert.equal(h.review(),null);assert.deepEqual(h.host.controller.snapshot().photos,[]);assert.deepEqual(h.revoked,[photoPath(1)]);await h.action('swaplotting-review');assert.equal(h.review(),null);assert.equal(h.host.controller.snapshot().validation.flags.photos,true);
});

test('a syntactically valid same-origin blob path without host-owned bytes fails review',async t=>{
 const h=await form(t);h.host.controller.applyPhoto(photoPath(9),photoPath(1));assert.deepEqual(h.revoked,[photoPath(1)]);await h.action('swaplotting-review');assert.equal(h.review(),null);assert.match(h.main.querySelector('[data-swaplotting-review]').textContent,/Ringkasan belum dapat dibuat/);assert.equal(h.reads.length,3);assert.equal(h.captureCalls.length,1);
});

test('back-to-map and disposal clear review, revoke private bytes once and reject detached delegated controls',async t=>{
 const h=await form(t);await openReview(h);const oldSlot=h.slot(),oldButton=oldSlot.querySelector('[data-action="swaplotting-review"]'),listeners=[...oldSlot.listeners.get('click')],reads=h.reads.length;
 await h.action('swaplotting-back-map');assert.equal(h.review(),null);assert.equal(h.host.controller.snapshot().photos,null);assert.deepEqual(h.revoked,[photoPath(1)]);for(const listener of listeners)await listener({target:oldButton,preventDefault(){}});assert.equal(h.host.controller.snapshot().screen,'map');assert.equal(h.reads.length,reads);
 h.dispose();h.dispose();assert.equal(h.host.controller.snapshot().screen,'disposed');assert.equal(oldSlot.children.length,0);assert.equal(h.capture().disposed,true);assert.deepEqual(h.revoked,[photoPath(1)]);for(const listener of listeners)await listener({target:oldButton,preventDefault(){}});assert.equal(h.review(),null);assert.equal(h.reads.length,reads);
});

test('a retired owner cannot open review or accept pending synthetic camera bytes; disposal clears retained display',async t=>{
 const h=await form(t);await h.action('swaplotting-photo-add');const oldButton=h.slot().querySelector('[data-action="swaplotting-review"]'),reads=h.reads.length;h.retire();await h.fire(oldButton);assert.equal(h.review(),null);assert.equal(h.capture().use({url:photoPath(2),blob:new Blob(['late'],{type:'image/jpeg'})}),false);assert.deepEqual(h.host.controller.snapshot().photos,[photoPath(1)]);assert.equal(h.reads.length,reads);h.dispose();assert.deepEqual(h.revoked,[photoPath(1)]);assert.equal(h.main.textContent,'');
});

test('raw whitespace server disclaimer needs explicit agreement before a form or review can open',async t=>{
 const h=setup({disclaimer:{message:'\u0085 ',message2:'SERVER TERMS <synthetic>'}});t.after(()=>h.dispose());await tick();
 const before=h.host.controller.snapshot(),open=h.slot().querySelector('[data-action="swaplotting-open-form"][data-kind="registered"]');assert.equal(before.disclaimerVisible,true);assert.equal(before.disclaimerAcknowledged,false);assert.equal(open.disabled,true);assert.match(h.main.textContent,/SERVER TERMS <synthetic>/);assert.equal(h.main.querySelector('synthetic'),null);
 await h.fire(open);assert.equal(h.host.controller.snapshot().screen,'map');assert.equal(h.reads.length,1);assert.equal(h.review(),null);await h.action('swaplotting-accept');assert.equal(h.host.controller.snapshot().disclaimerAcknowledged,true);assert.equal(h.host.controller.snapshot().canOpenForm,true);assert.equal(h.reads.length,1);assert.equal(h.capture(),undefined);
});

test('direct disposal drops an open review and all owned photos exactly once, with no late camera commit',async t=>{
 const h=await form(t);await openReview(h);const oldTitle=h.review();await h.action('swaplotting-photo-add');const capture=h.capture();assert.ok(capture.context);h.dispose();h.dispose();assert.equal(oldTitle.isConnected,false);assert.equal(h.review(),null);assert.equal(h.main.textContent,'');assert.deepEqual(h.revoked,[photoPath(1)]);assert.equal(capture.disposed,true);assert.equal(capture.use({url:photoPath(2),blob:new Blob(['late'],{type:'image/jpeg'})}),false);assert.equal(h.host.controller.snapshot().screen,'disposed');
});
