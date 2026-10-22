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

function setup({profile=own,disclaimer={},submit,onResult,writeAvailable=()=>true}={}){
 const {document}=harness();dom(document);const main=document.body.appendChild(document.createElement('main'));main.setAttribute('id','main');
 const query=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):query(selector);
 const reads=[],configs=[],revoked=[],sessions=[],holds=new Map(),captureCalls=[];let current=true,profileValue=profile,capture;
 // A pending synthetic map-config promise avoids all tile/library work; opening
 // a form uses the same public controller target callback as a map event.
 document.defaultView={location:{origin},URL:{revokeObjectURL:url=>revoked.push(url)},fetch(path,options){assert.equal(path,'/api/maps/config');assert.equal(options.method,'GET');const wait=deferred();configs.push({...wait,options});return wait.promise;},navigator:{geolocation:{getCurrentPosition(){assert.fail('No GPS');},watchPosition(){assert.fail('No GPS');}},mediaDevices:{getUserMedia(){assert.fail('No hardware camera');}}}};
 const host=createSwaplottingHost({document,submit,onResult,writeAvailable,profile:()=>profileValue,isCurrent:()=>current,onSessionError:error=>sessions.push(error),read:async(kind,values)=>{reads.push({kind,values});const hold=holds.get(kind);if(hold){holds.delete(kind);return hold.promise;}if(kind==='disclaimer')return structuredClone(disclaimer);if(kind==='offices')return structuredClone(offices);if(kind==='regions')return structuredClone(regions);assert.fail('Unexpected read');},photoCaptureFactory:options=>{
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

test('one click sends raw registered draft and owned blobs without requiring local review',async t=>{
 const calls=[],results=[],wait=deferred(),h=await form(t,'registered',{submit:(payload,context)=>{calls.push({payload,context});return wait.promise;},onResult:result=>results.push(result)});
 assert.equal(h.review(),null);const before=h.host.controller.snapshot(),blob=await h.addPhoto(2,'SECOND');
 h.host.controller.setField('number','\u0085 000123 \u0085');
 const work=h.action('swaplotting-send');assert.equal(calls.length,1);const {payload,context}=calls[0];
 assert.deepEqual(Object.keys(payload),['kind','draft','files']);assert.equal(payload.kind,'registered');assert.deepEqual(payload.draft.fields,{name:own.nama,phone:own.nomorHp,email:own.email,number:'\u0085 000123 \u0085',review:'  RAW REVIEW <text>  '});
 assert.deepEqual(payload.draft,{fields:payload.draft.fields,officeIndex:0,regionIndex:0,right:'8',basisIndex:null,taxIndex:null,latitude:'-6.123456789',longitude:'106.75',disclaimerAcknowledged:false});
 assert.equal(payload.files.length,2);assert.equal(payload.files[0].name,'file');assert.equal(payload.files[1].blob,blob);assert.deepEqual(Object.keys(payload.files[0]),['name','blob']);assert.ok(Object.isFrozen(payload)&&Object.isFrozen(payload.draft)&&Object.isFrozen(payload.draft.fields)&&Object.isFrozen(payload.files));assert.equal(context.isCurrent(),true);
 assert.deepEqual(h.host.controller.snapshot().photos,[...before.photos,photoPath(2)]);assert.equal(h.review(),null);wait.resolve({success:false});await work;assert.deepEqual(results,[{success:false}]);assert.equal(h.host.controller.snapshot().screen,'registered');assert.equal(h.host.submissionSnapshot().canSubmit,true);
});

test('unregistered raw values and selected proof indices survive optional review; zero signs stay text',async t=>{
 const calls=[],h=await form(t,'unregistered',{submit:async(payload)=>{calls.push(payload);return {success:false};},onResult:()=>{}});
 await h.type('basisNumber',' \u0085 000-BASIS ');await h.type('taxNumber',' 000-TAX\u0085 ');await openReview(h);await h.action('swaplotting-send');
 const draft=calls[0].draft;assert.equal(draft.fields.basisNumber,' \u0085 000-BASIS ');assert.equal(draft.fields.taxNumber,' 000-TAX\u0085 ');assert.equal(draft.fields.address,'  ALAMAT <raw>  ');assert.deepEqual(Object.keys(draft.fields),['name','phone','email','address','basisNumber','basisDescription','taxNumber','taxDescription','review']);assert.equal(draft.basisIndex,0);assert.equal(draft.taxIndex,1);assert.equal(draft.right,null);
 const z=setup({submit:async payload=>{calls.push(payload);return {success:false};},onResult:()=>{}});t.after(()=>z.dispose());await tick();z.host.controller.setCameraTarget({lat:-0,lng:-0});await z.fire(z.slot().querySelector('[data-action="swaplotting-open-form"][data-kind="registered"]'));await z.change('office','0');await z.change('region','0');await z.change('right','1');await z.type('number','1');await z.type('review','r');await z.addPhoto();await z.action('swaplotting-send');assert.equal(calls[1].draft.latitude,'-0');assert.equal(calls[1].draft.longitude,'-0');assert.equal(typeof JSON.parse(JSON.stringify(calls[1].draft)).latitude,'string');
});

test('invalid native required fields and missing owned bytes do not stage or send',async t=>{
 let calls=0;const h=await form(t,'registered',{submit:async()=>{calls++;return {success:true};}});
 await h.type('number','');await h.action('swaplotting-send');assert.equal(calls,0);assert.equal(h.host.controller.snapshot().validation.flags.number,true);assert.equal(h.host.submissionSnapshot().pending,false);
 await h.type('number','1');h.host.controller.applyPhoto(photoPath(9),photoPath(1));await h.action('swaplotting-send');assert.equal(calls,0);assert.equal(h.host.submissionSnapshot().stage,'error');assert.match(h.main.textContent,/Ringkasan belum dapat dibuat/);
});

test('pending write blocks direct controller mutators and DOM controls through result feedback',async t=>{
 const wait=deferred(),feedback=deferred(),calls=[],h=await form(t,'registered',{submit:(payload,context)=>{calls.push({payload,context});return wait.promise;},onResult:()=>feedback.promise});
 const work=h.action('swaplotting-send'),c=h.host.controller,before=c.snapshot();
 for(const action of [()=>c.setField('number','OTHER'),()=>c.selectRegion(1),()=>c.selectRight('1'),()=>c.applyPhoto(photoPath(3)),()=>c.removePhoto(photoPath(1)),()=>c.validate(),()=>c.backToMap(),()=>c.setCameraTarget({lat:1,lng:1}),()=>c.setCoordinateDraft('latitude','2'),()=>c.setCoordinateError('x'),()=>c.applyCoordinateTarget({lat:1,lng:1},{}),()=>c.acceptDisclaimer(),()=>c.declineDisclaimer(),()=>c.selectBasis(2),()=>c.selectTax(2)])assert.equal(action(),false);
 assert.equal(await c.loadOffices(),false);assert.equal(await c.selectOffice(1),false);assert.equal(await c.openForm('unregistered'),false);assert.equal(await c.loadDisclaimer(),false);assert.deepEqual(c.snapshot(),before);
 for(const selector of ['#swaplotting-number','#swaplotting-office','#swaplotting-region','#swaplotting-right','#swaplotting-photos','[data-action="swaplotting-send"]','[data-action="swaplotting-review"]','[data-action="swaplotting-back-map"]','[data-action="swaplotting-photo-retake"]','[data-action="swaplotting-photo-remove"]'])assert.equal(h.slot().querySelector(selector).disabled,true,selector);
 await h.action('swaplotting-send');assert.equal(calls.length,1);wait.resolve({success:false});await tick();assert.equal(h.host.submissionSnapshot().stage,'result');assert.equal(c.setField('number','AGAIN'),false);feedback.resolve();await work;assert.equal(h.host.submissionSnapshot().locked,false);assert.equal(c.setField('number','NOW'),true);assert.equal(h.node('swaplotting-number').disabled,false);
});

test('profile revocation retires local staging context and suppresses a late auth failure',async t=>{
 const wait=deferred(),calls=[],results=[],h=await form(t,'registered',{submit:(payload,context)=>{calls.push({payload,context});return wait.promise;},onResult:r=>results.push(r)}),work=h.action('swaplotting-send');
 h.profile({...own,isIkd:true});h.host.attach();assert.equal(calls[0].context.isCurrent(),false);assert.equal(h.host.submissionSnapshot().stage,'stale');assert.equal(h.host.controller.snapshot().owner.status,'unresolved');wait.reject(Object.assign(new Error('OLD AUTH'),{code:'SESSION_EXPIRED'}));await work;assert.deepEqual(h.sessions,[]);assert.deepEqual(results,[]);assert.equal(h.host.submissionSnapshot().canSubmit,false);
});

test('profile change before final stage invalidates context even without an attach/render',async t=>{
 const wait=deferred(),calls=[],h=await form(t,'registered',{submit:(payload,context)=>{calls.push(context);return wait.promise;}}),work=h.action('swaplotting-send');h.profile({...own,email:'replacement@example.invalid'});assert.equal(calls[0].isCurrent(),false);wait.resolve({success:true});await work;assert.equal(h.host.submissionSnapshot().stage,'stale');
});

test('accepted callback return directive clears form and private bytes only after completion',async t=>{
 const wait=deferred(),feedback=deferred(),results=[],h=await form(t,'registered',{submit:()=>wait.promise,onResult:r=>{results.push(r);return feedback.promise;}}),work=h.action('swaplotting-send');
 wait.resolve({success:true,attemptId:'ATTEMPT'});await tick();assert.deepEqual(results,[{success:true,attemptId:'ATTEMPT'}]);assert.equal(h.host.controller.snapshot().screen,'registered');assert.deepEqual(h.revoked,[]);assert.equal(h.host.submissionSnapshot().locked,true);
 feedback.resolve({backToMap:true});await work;assert.equal(h.host.controller.snapshot().screen,'map');assert.equal(h.host.controller.snapshot().photos,null);assert.deepEqual(h.revoked,[photoPath(1)]);assert.equal(h.host.submissionSnapshot().stage,'idle');
});

test('completion failure is visible as literal text and permits safe back without resubmission',async t=>{
 let calls=0;const h=await form(t,'registered',{submit:async()=>{calls++;return {success:true};},onResult:()=>({completionFailed:true,message:'Completion <failed> & retry requires review'})});await h.action('swaplotting-send');assert.equal(h.host.submissionSnapshot().stage,'completion-error');assert.match(h.main.textContent,/Completion <failed> & retry requires review/);assert.equal(h.main.querySelector('failed'),null);assert.equal(h.slot().querySelector('[data-action="swaplotting-send"]').disabled,true);assert.equal(h.slot().querySelector('[data-action="swaplotting-back-map"]').disabled,false);await h.action('swaplotting-back-map');assert.equal(h.host.controller.snapshot().screen,'map');assert.equal(calls,1);
});

test('unknown outcome preserves draft, displays uncertainty, blocks repeat, and allows explicit back',async t=>{
 let calls=0;const h=await form(t,'registered',{submit:async()=>{calls++;throw Object.assign(new Error('Timeout'),{delivery:'unknown'});}});await h.action('swaplotting-send');assert.equal(h.host.submissionSnapshot().stage,'unknown');assert.match(h.main.textContent,/Hasil pengiriman belum dapat dipastikan/);assert.equal(h.slot().querySelector('[data-action="swaplotting-send"]').disabled,true);assert.deepEqual(h.host.controller.snapshot().photos,[photoPath(1)]);await h.action('swaplotting-send');assert.equal(calls,1);await h.action('swaplotting-back-map');assert.equal(h.host.controller.snapshot().screen,'map');assert.deepEqual(h.revoked,[photoPath(1)]);
});

test('raw nonempty disclaimer requires agreement and carries only its genuine acknowledgement',async t=>{
 const calls=[],h=await form(t,'registered',{disclaimer:{message:'\u0085 '},submit:async payload=>{calls.push(payload);return {success:false};},onResult:()=>{}});assert.equal(h.host.controller.snapshot().disclaimerAcknowledged,true);await h.action('swaplotting-send');assert.equal(calls[0].draft.disclaimerAcknowledged,true);assert.equal(Object.hasOwn(calls[0].draft,'presence'),false);assert.equal(Object.hasOwn(calls[0].draft,'accuracy'),false);
});

test('local not_sent error allows only another explicit click, preserving raw input and photos',async t=>{
 let calls=0;const h=await form(t,'registered',{submit:async()=>{calls++;throw Object.assign(new Error('Review <expired>'),{delivery:'not_sent'});}}),before=h.host.controller.snapshot();await h.action('swaplotting-send');assert.equal(calls,1);assert.equal(h.host.submissionSnapshot().canSubmit,true);assert.deepEqual(h.host.controller.snapshot().fields,before.fields);assert.deepEqual(h.host.controller.snapshot().photos,before.photos);assert.match(h.main.textContent,/Review <expired>/);assert.equal(h.main.querySelector('expired'),null);await tick();assert.equal(calls,1);await h.action('swaplotting-send');assert.equal(calls,2);
});

test('disposing a pending host drops owned Blob URLs and prevents late results or back',async t=>{
 const wait=deferred(),results=[],contexts=[],h=await form(t,'registered',{submit:(_payload,context)=>{contexts.push(context);return wait.promise;},onResult:r=>results.push(r)}),work=h.action('swaplotting-send');h.dispose();assert.equal(contexts[0].isCurrent(),false);assert.deepEqual(h.revoked,[photoPath(1)]);assert.equal(h.main.textContent,'');wait.resolve({success:true});await work;assert.deepEqual(results,[]);assert.equal(h.host.submissionSnapshot().stage,'disposed');assert.equal(h.host.controller.snapshot().screen,'disposed');
});

