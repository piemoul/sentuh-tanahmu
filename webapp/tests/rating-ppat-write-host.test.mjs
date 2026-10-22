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
const group=(id,ids)=>({pertanyaanRatingPPATId:id,indikator:'<Indicator>',jawabanRatingPPAT:ids.map(value=>({pertanyaanRatingPPATId:value,pertanyaan:'Question',jawaban:'<Answer>'}))});
const groups=[group('10',[' a0 ',' replacement ']),group('2',[null])];
function setup({data=groups,read=async()=>({data}),write=async()=>({success:true,message:'received'}),readAvailable=true,writeAvailable=true,onResult=()=>{}}={}){
 const {document}=harness();dom(document);const main=document.body.appendChild(document.createElement('main'));main.setAttribute('id','main');const query=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):query(selector);
 const reads=[],writes=[],backs=[],results=[],sessions=[];let current=true,readerReady=readAvailable,writerReady=writeAvailable;
 document.defaultView={fetch(){assert.fail('No direct HTTP');},navigator:{geolocation:{getCurrentPosition(){assert.fail('No GPS');}},mediaDevices:{getUserMedia(){assert.fail('No camera');}}}};
 const host=createRatingPPATHost({document,entry:{aktaId:' RAW AKTA ',namaPPAT:'<PPAT>'},read:(...args)=>{reads.push(args);return read(...args);},write:values=>{writes.push(structuredClone(values));return write(values);},isCurrent:()=>current,available:()=>readerReady,writeAvailable:()=>writerReady,onBack:()=>backs.push(true),onSessionError:error=>sessions.push(error),onResult:value=>{results.push(value);onResult(value);}});
 const slot=()=>main.querySelector('[data-rating-ppat-host]');main.innerHTML=host.html();
 const fire=async(target,type='click')=>{assert.ok(target);for(const listener of [...slot()?.listeners.get(type)??[]])await listener({target,preventDefault(){}});};
 return {host,document,main,reads,writes,backs,results,sessions,slot,fire,button:name=>slot().querySelector(`[data-action="rating-ppat-${name}"]`),action(name){return fire(this.button(name));},answer:(g,a)=>main.querySelector(`#rating-ppat-answer-${g}-${a}`),async choose(g,a){await fire(this.answer(g,a),'change');},setReadAvailable:value=>readerReady=value,setWriteAvailable:value=>writerReady=value,retire:()=>current=false,dispose:()=>host.dispose()};
}
async function complete(h){await tick();await h.choose(1,0);await h.choose(0,0);return h;}

test('explicit Kirim validates count first, then sends actual returned choices without another confirmation',async t=>{
 const h=setup();t.after(h.dispose);await tick();assert.equal(h.button('submit').disabled,false);await h.action('submit');assert.equal(h.writes.length,0);assert.match(h.main.textContent,/Jawab seluruh pertanyaan sebelum mengirim\./);
 await h.choose(1,0);const radio=h.answer(0,1);radio.value='FORGED ANSWER';await h.fire(radio,'change');await h.action('submit');
 assert.deepEqual(h.writes,[{aktaId:' RAW AKTA ',PertanyaanRatingPPATId:['',' replacement ']}]);assert.deepEqual(h.reads,[[]]);assert.deepEqual(h.results,[{success:true,message:'received'}]);assert.equal(h.main.querySelector('dialog'),null);
});
test('write busy disables every choice, reload and back, and logical guards reject a second POST',async t=>{
 const wait=deferred(),h=await complete(setup({write:()=>wait.promise}));t.after(h.dispose);const send=h.button('submit'),work=h.fire(send),before=h.host.controller.snapshot();
 assert.equal(h.button('submit'),null);assert.ok(h.main.querySelector('[data-rating-ppat-write-pending]'));assert.equal(h.button('back').disabled,true);assert.equal(h.button('retry').disabled,true);assert.ok([...h.main.querySelectorAll('input[type="radio"]')].every(input=>input.disabled));
 await h.fire(send);for(const name of ['back','retry']){const button=h.button(name);button.disabled=false;await h.fire(button);}const radio=h.answer(0,1);radio.disabled=false;await h.fire(radio,'change');assert.equal(await h.host.controller.submit(),false);assert.deepEqual(h.host.controller.snapshot(),before);assert.equal(h.writes.length,1);assert.equal(h.reads.length,1);assert.deepEqual(h.backs,[]);
 wait.resolve({success:false,message:'not accepted'});await work;assert.deepEqual(h.results,[{success:false,message:'not accepted'}]);assert.equal(h.host.controller.snapshot().writePending,false);
});
test('read and write availability are separate; later availability paints the same loaded questionnaire',async t=>{
 const h=await complete(setup({writeAvailable:false}));t.after(h.dispose);assert.equal(h.button('submit').disabled,true);await h.action('submit');assert.equal(h.writes.length,0);assert.equal(h.reads.length,1);
 h.setWriteAvailable(true);h.setReadAvailable(false);h.host.paint();assert.equal(h.button('submit').disabled,false);assert.equal(h.button('retry').disabled,true);await h.action('submit');assert.equal(h.writes.length,1);assert.equal(h.reads.length,1);
});
test('empty loaded questionnaire exposes an explicit send and submits the native empty value list',async t=>{
 const h=setup({data:[]});t.after(h.dispose);await tick();assert.equal(h.button('submit').disabled,false);await h.action('submit');assert.deepEqual(h.writes,[{aktaId:' RAW AKTA ',PertanyaanRatingPPATId:[]}]);assert.equal(h.results.length,1);
});
test('SESSION_CHANGED is literal inline text and requires explicit reload without clearing another session',async t=>{
 let attempt=0;const h=await complete(setup({write:async()=>{if(++attempt===1)throw Object.assign(new Error('<changed>'),{code:'SESSION_CHANGED'});return {success:false,message:''};}}));t.after(h.dispose);await h.action('submit');
 assert.match(h.main.textContent,/<changed>/);assert.equal(h.main.querySelector('changed'),null);assert.equal(h.button('submit').disabled,true);assert.equal(h.button('retry').disabled,false);assert.deepEqual(h.results,[]);assert.deepEqual(h.sessions,[]);assert.equal(h.writes.length,1);assert.equal(h.reads.length,1);
 await h.action('retry');assert.equal(h.reads.length,2);assert.equal(h.host.controller.snapshot().selection.size,0);await h.choose(1,0);await h.choose(0,0);await h.action('submit');assert.deepEqual(h.results,[{success:false,message:''}]);assert.equal(h.writes.length,2);
});
test('actual current auth failure reaches only the parent session handler and generic failure reaches result',async t=>{
 for(const code of ['SESSION_EXPIRED','HTTP_401']){const error=Object.assign(new Error('failure'),{code}),h=await complete(setup({write:async()=>{throw error;}}));t.after(h.dispose);await h.action('submit');assert.equal(h.writes.length,1);if(code==='SESSION_EXPIRED'){assert.deepEqual(h.sessions,[error]);assert.deepEqual(h.results,[]);}else{assert.deepEqual(h.sessions,[]);assert.deepEqual(h.results,[{success:false,message:'Terjadi kesalahan saat Mengirimkan Rating PPAT'}]);}}
});
test('retired source/session suppresses late tuple or auth result and disposal releases private screen state',async t=>{
 for(const auth of [false,true]){const wait=deferred(),h=await complete(setup({write:()=>wait.promise}));t.after(h.dispose);const old=h.slot(),work=h.action('submit');h.retire();h.dispose();if(auth)wait.reject(Object.assign(new Error('old401'),{code:'SESSION_EXPIRED'}));else wait.resolve({success:true,message:'old'});await work;assert.deepEqual(h.results,[]);assert.deepEqual(h.sessions,[]);assert.equal(old.children.length,0);assert.deepEqual(h.host.controller.snapshot().entry,{aktaId:'',namaPPAT:''});assert.equal(h.host.controller.snapshot().selection.size,0);}
});
test('detached old controls and retired current controls cannot submit an existing valid selection',async t=>{
 const h=await complete(setup());t.after(h.dispose);const old=h.slot(),send=h.button('submit'),listeners=[...old.listeners.get('click')];h.main.innerHTML=h.host.html();await tick();for(const listener of listeners)await listener({target:send,preventDefault(){}});assert.equal(h.writes.length,0);h.retire();await h.action('submit');assert.equal(h.writes.length,0);
});
test('same-owner rebind preserves one pending write and original source values without rereading',async t=>{
 const wait=deferred(),h=await complete(setup({write:()=>wait.promise}));t.after(h.dispose);const old=h.slot(),work=h.action('submit');h.main.innerHTML=h.host.html();await tick();assert.notEqual(h.slot(),old);assert.ok(h.main.querySelector('[data-rating-ppat-write-pending]'));assert.equal(h.reads.length,1);assert.equal(h.writes.length,1);assert.equal((old.listeners.get('click')??[]).length,0);
 wait.resolve({success:true,message:''});await work;assert.deepEqual(h.results,[{success:true,message:''}]);assert.equal(h.reads.length,1);assert.equal(h.writes.length,1);
});
