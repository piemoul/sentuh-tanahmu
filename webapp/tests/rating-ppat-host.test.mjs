import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {createRatingPPATHost} from '../assets/rating-ppat/host.js';
const source=fs.readFileSync(new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url),'utf8');
const dom=vm.runInNewContext('('+source.slice(source.indexOf('function dom(document){'),source.indexOf('function setup('))+')');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const groups=[{pertanyaanRatingPPATId:' raw group ',indikator:'<Indicator>',jawabanRatingPPAT:[{pertanyaanRatingPPATId:' raw answer ',pertanyaan:'First description',jawaban:'<Answer>'},{pertanyaanRatingPPATId:null,pertanyaan:'ignored description',jawaban:'Empty ID'}]},{pertanyaanRatingPPATId:null,indikator:null,jawabanRatingPPAT:[{pertanyaanRatingPPATId:'null-group',pertanyaan:null,jawaban:'Ignored choice'}]}];
function setup({read=async()=>({data:groups}),available=true}={}){
 const {document}=harness();dom(document);const main=document.body.appendChild(document.createElement('main'));main.setAttribute('id','main');const query=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):query(selector);
 const reads=[],backs=[],sessions=[];let current=true,ready=available;
 document.defaultView={fetch(){assert.fail('No direct HTTP');},navigator:{geolocation:{getCurrentPosition(){assert.fail('No GPS');}},mediaDevices:{getUserMedia(){assert.fail('No camera');}}}};
 const host=createRatingPPATHost({document,entry:{aktaId:' RAW ENTRY ',namaPPAT:'<PPAT> & Name'},read:(...args)=>{reads.push(args);return read(...args);},available:()=>ready,isCurrent:()=>current,onBack:()=>backs.push(true),onSessionError:error=>sessions.push(error)});
 const slot=()=>main.querySelector('[data-rating-ppat-host]');main.innerHTML=host.html();
 const fire=async(target,type='click')=>{assert.ok(target);for(const listener of [...slot()?.listeners.get(type)??[]])await listener({target,preventDefault(){}});};
 return {host,document,main,reads,backs,sessions,slot,fire,action:name=>fire(slot().querySelector(`[data-action="${name}"]`)),answer:(g,a)=>main.querySelector(`#rating-ppat-answer-${g}-${a}`),async choose(g,a){const target=this.answer(g,a);target.focus();await fire(target,'change');},available:value=>ready=value,retire:()=>current=false,dispose:()=>host.dispose()};
}
test('host mounts source screen and autoloads only once without sending entry values',async t=>{
 const h=setup();t.after(h.dispose);await tick();h.host.attach();h.host.paint();await tick();assert.deepEqual(h.reads,[[]]);assert.match(h.main.textContent,/Rating PPAT <PPAT> & Name/);assert.equal(h.main.querySelector('PPAT'),null);assert.equal(h.main.querySelector('Indicator'),null);assert.match(h.main.textContent,/First description/);assert.doesNotMatch(h.main.textContent,/ignored description/);assert.equal(h.main.querySelector('button[aria-describedby="rating-ppat-write-boundary"]').disabled,true);
});
test('host resolves original numeric indices rather than native IDs from DOM and keeps radio focus',async t=>{
 const h=setup();t.after(h.dispose);await tick();const radio=h.answer(0,1);radio.value='INJECTED_ID';await h.choose(0,1);assert.deepEqual([...h.host.controller.snapshot().selection],[[' raw group ','']]);assert.equal(h.document.activeElement.id,'rating-ppat-answer-0-1');assert.equal(h.document.activeElement.isConnected,true);assert.equal(h.answer(0,1).getAttribute('checked'),'');assert.equal(h.reads.length,1);
 await h.choose(1,0);assert.deepEqual([...h.host.controller.snapshot().selection],[[' raw group ','']]);assert.equal(h.answer(1,0).getAttribute('checked'),null);
});
test('bad indices and detached controls cannot mutate local answers or start another read',async t=>{
 const h=setup();t.after(h.dispose);await tick();const radio=h.answer(0,0);radio.setAttribute('data-rating-ppat-group','00');await h.fire(radio,'change');assert.equal(h.host.controller.snapshot().selection.size,0);radio.setAttribute('data-rating-ppat-group','-1');await h.fire(radio,'change');assert.equal(h.host.controller.snapshot().selection.size,0);
 const old=h.slot(),target=h.answer(0,1),listeners=[...old.listeners.get('change')];h.main.innerHTML='<div data-rating-ppat-host></div>';for(const listener of listeners)await listener({target,preventDefault(){}});assert.equal(h.host.controller.snapshot().selection.size,0);assert.equal(h.reads.length,1);
});
test('unavailable host starts no read and attach after availability change loads once',async t=>{
 const h=setup({available:false});t.after(h.dispose);await tick();assert.equal(h.reads.length,0);assert.match(h.main.textContent,/Pembacaan pertanyaan belum tersedia/);h.available(true);h.host.attach();await tick();assert.equal(h.reads.length,1);assert.equal(h.host.controller.snapshot().stage,'ready');
});
test('explicit retry clears prior choices, cannot duplicate pending reads and exposes errors honestly',async t=>{
 const pending=deferred();let attempt=0;const h=setup({read:()=>++attempt===1?Promise.resolve({data:groups}):pending.promise});t.after(h.dispose);await tick();await h.choose(0,0);const retry=h.action('rating-ppat-retry');assert.equal(h.host.controller.snapshot().selection.size,0);assert.match(h.main.textContent,/Memuat pertanyaan/);h.host.attach();assert.equal(h.reads.length,2);pending.reject(new Error('<Read failed>'));await retry;assert.match(h.main.textContent,/<Read failed>/);assert.equal(h.main.querySelector('Read'),null);assert.equal(h.host.controller.snapshot().stage,'error');assert.equal(h.main.querySelector('button[aria-describedby="rating-ppat-write-boundary"]').disabled,true);h.host.attach();await tick();assert.equal(h.reads.length,2);
});
test('back callback only returns ownership to the parent, preserving questionnaire and making no extra read',async t=>{
 const h=setup();t.after(h.dispose);await tick();await h.choose(0,0);const before=h.host.controller.snapshot();await h.action('rating-ppat-back');assert.deepEqual(h.backs,[true]);assert.deepEqual(h.host.controller.snapshot(),before);assert.equal(h.reads.length,1);assert.equal(h.host.controller.submit,undefined);
});
test('retired route owner rejects stale success and401 and detached old handlers after disposal',async t=>{
 for(const auth of [false,true]){const pending=deferred(),h=setup({read:()=>pending.promise});t.after(h.dispose);await tick();const old=h.slot(),back=old.querySelector('[data-action="rating-ppat-back"]'),listeners=[...old.listeners.get('click')];h.retire();h.dispose();if(auth)pending.reject(Object.assign(new Error('Old401'),{code:'SESSION_EXPIRED'}));else pending.resolve({data:groups});await tick();assert.equal(h.host.controller.snapshot().stage,'disposed');assert.deepEqual(h.host.controller.snapshot().entry,{aktaId:'',namaPPAT:''});assert.equal(old.children.length,0);assert.deepEqual(h.sessions,[]);for(const listener of listeners)await listener({target:back,preventDefault(){}});assert.deepEqual(h.backs,[]);}
});
test('same child owner can rebind a replaced host slot without duplicating its autoload',async t=>{
 const h=setup();t.after(h.dispose);await tick();await h.choose(0,0);const old=h.slot();h.main.innerHTML=h.host.html();await tick();assert.notEqual(h.slot(),old);assert.equal(h.reads.length,1);assert.equal(h.answer(0,0).getAttribute('checked'),'');await h.choose(0,1);assert.deepEqual([...h.host.controller.snapshot().selection],[[' raw group ','']]);assert.equal((old.listeners.get('change')??[]).length,0);
});
