import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,response,plain,expiry} from './support/account-verification-ui-harness.mjs';
import {OPERATIONS} from '../private/operations.mjs';
import {DARING_OPERATION_ID,DARING_FIELDS} from '../assets/profile/daring-model.js';
const operation=OPERATIONS.find(op=>op.id===DARING_OPERATION_ID);
const owner=h=>h.c.flowResults.get('verification:dialog-state');
const valid={Nama:'Nama SINTETIS',Nik:'0000000000000000',Tempatlahir:'Kota SINTETIS',TglLahir:'2009-10-20',NoHp:'000000000000'};
async function open(){const h=harness();h.state.operations.push({...operation});h.open(response('-1'));await h.click(h.modal.querySelector('[data-index="0"]'));await h.click(h.button('verification-daring-start'));return h;}
async function input(h,key,value){const node=h.modal.querySelector(`[name="${key}"]`);node.value=value;for(const fn of h.document.listeners.get('input')??[])await fn({target:node});return node;}
async function submit(h){const form=h.modal.querySelector('form');let prevented=false;for(const fn of h.document.listeners.get('submit')??[])await fn({target:form,preventDefault(){prevented=true;}});assert.equal(prevented,true);}
async function review(h,values=valid){for(const [key,value]of Object.entries(values))await input(h,key,value);await submit(h);assert.equal(owner(h).stage,'daring-review');}
const tuple=(error,message='SINTETIS')=>({status:200,data:{error,message}});
test('scoped adapter gate rejects wrong service, auth, path, method, encoding, effect, confirmation or connection',async()=>{
 for(const mutation of [{enabled:false},{serviceId:'queue'},{auth:'none'},{path:'other'},{method:'GET'},{encoding:'json'},{effect:'read'},{requiresConfirmation:false}]){const h=harness();h.state.operations.push({...operation,...mutation});h.open(response('-1'));await h.click(h.modal.querySelector('[data-index="0"]'));assert.equal(h.button('verification-daring-start'),null);assert.equal(h.calls.length,0);}
 const h=await open();h.state.connection.configured=false;assert.equal(h.c.verificationDaringOperation(),null);
});
test('Daring opens five empty native labels in order without profile substitution or traffic',async()=>{
 const h=await open(),inputs=h.modal.querySelectorAll('input');assert.equal(owner(h).stage,'daring-form');assert.deepEqual(inputs.map(n=>n.getAttribute('name')),DARING_FIELDS.map(f=>f.key));assert.deepEqual(inputs.map(n=>n.value),['','','','','']);assert.match(h.modal.textContent,/Lengkapi data/);assert.match(h.modal.textContent,/\*Masukkan data diri kamu sesuai dengan KTP\./);assert.equal(h.calls.length,0);assert.equal(h.modal.querySelector('[name="TglLahir"]').getAttribute('min'),'1900-01-01');
});
test('edit errors update in place and final missing-data Info preserves all five errors',async()=>{
 const h=await open(),element=owner(h).element,node=await input(h,'Nama',' ');assert.equal(owner(h).element,element);assert.equal(node.getAttribute('aria-invalid'),'true');assert.equal(h.modal.querySelector('#verification-daring-Nama-error').textContent,'Nama tidak boleh diawali spasi');await submit(h);assert.equal(owner(h).stage,'daring-info');assert.match(h.modal.textContent,/Harap lengkapi semua data/);await h.click(h.button('verification-daring-ok'));assert.equal(owner(h).stage,'daring-form');assert.equal(h.modal.querySelector('[name="Nama"]').value,' ');assert.equal(h.modal.querySelectorAll('[aria-invalid="true"]').length,5);assert.equal(h.calls.length,0);
});
test('browser date conversion accepts a recent DOB without invented 18-year rule',async()=>{
 const h=await open();await input(h,'TglLahir','2020-01-02');assert.equal(owner(h).daring.values.TglLahir,'02/01/2020');assert.equal(owner(h).daring.errors.TglLahir,null);await input(h,'TglLahir','1899-12-31');assert.equal(owner(h).daring.values.TglLahir,'');assert.match(owner(h).daring.errors.TglLahir,/rentang kalender/);assert.equal(h.calls.length,0);
});
test('Lanjut captures review only, preserves raw Strings and requires explicit separate send',async()=>{
 const h=await open();await review(h,{...valid,Nama:' Nama SINTETIS ',NoHp:' 0000 '});assert.equal(h.calls.length,0);assert.equal(owner(h).daring.snapshot.Nama,' Nama SINTETIS ');assert.equal(owner(h).daring.snapshot.NoHp,' 0000 ');assert.equal(owner(h).daring.snapshot.TglLahir,'20/10/2009');assert.ok(Object.isFrozen(owner(h).daring.snapshot));assert.match(h.modal.textContent,/dikirim ke layanan Sentuh Tanahku \(ATR\/BPN\)/);assert.equal(h.modal.querySelectorAll('dd').length,5);
});
test('form submit reads current input values even when autofill produced no input event',async()=>{
 const h=await open();for(const[key,value]of Object.entries(valid))h.modal.querySelector(`[name="${key}"]`).value=value;await submit(h);assert.equal(owner(h).stage,'daring-review');assert.equal(owner(h).daring.snapshot.Nik,valid.Nik);assert.equal(h.calls.length,0);
});
test('back from review retains draft; back to instructions retains it only in current owner',async()=>{
 const h=await open();await review(h);await h.click(h.button('verification-daring-back'));assert.equal(owner(h).stage,'daring-form');assert.equal(h.modal.querySelector('[name="Nama"]').value,valid.Nama);assert.equal(owner(h).daring.snapshot,null);await h.click(h.button('verification-daring-back'));assert.equal(owner(h).stage,'methods');await h.click(h.button('verification-daring-start'));assert.equal(h.modal.querySelector('[name="Nama"]').value,valid.Nama);h.escape();h.open(response('-1'));await h.click(h.modal.querySelector('[data-index="0"]'));await h.click(h.button('verification-daring-start'));assert.equal(h.modal.querySelector('[name="Nama"]').value,'');
});
test('confirmed send uses exact operation and five captured Strings once; busy prevents duplicates/Escape',async()=>{
 const h=await open();await review(h);const button=h.button('verification-daring-send'),snapshot=plain(owner(h).daring.snapshot),work=h.click(button);assert.equal(h.calls.length,1);assert.deepEqual(plain(h.calls[0].options),{method:'POST',body:{operationId:DARING_OPERATION_ID,values:snapshot,confirm:true}});assert.equal(h.calls[0].path,'/api/execute');assert.equal(owner(h).stage,'daring-sending');assert.equal(h.escape().defaultPrevented,true);await h.click(button);await h.click(h.button('verification-daring-send'));h.c.dismissVerificationDialog();assert.equal(h.modal.open,true);assert.equal(h.calls.length,1);await h.resolve(work,tuple(true));assert.equal(owner(h).stage,'daring-info');assert.equal(h.records[0][2],'HTTP 200 · Respons diterima');assert.doesNotMatch(JSON.stringify(h.records),/000000|Nama SINTETIS|20\/10/);
});
test('error tuple shows escaped exact empty/nonempty message and permits explicit edit',async()=>{
 for(const message of ['', '<img src=x onerror=alert(1)> SINTETIS']){const h=await open();await review(h);const work=h.click(h.button('verification-daring-send'));await h.resolve(work,tuple(true,message));assert.equal(h.modal.querySelector('.verification-dialog-message').textContent,message);assert.equal(h.modal.querySelector('img'),null);await h.click(h.button('verification-daring-ok'));assert.equal(owner(h).stage,'daring-form');assert.equal(h.modal.querySelector('[name="Nik"]').value,valid.Nik);assert.equal(h.calls.length,1);}
});
test('false tuple stops at OTP boundary, never auto-sends OTP, opens camera or marks account verified',async()=>{
 const h=await open();await review(h);const user=h.state.user,work=h.click(h.button('verification-daring-send'));await h.resolve(work,tuple(false));assert.equal(owner(h).stage,'daring-otp-boundary');assert.match(h.modal.textContent,/Akun belum dinyatakan terverifikasi/);assert.equal(h.state.user,user);assert.equal(h.calls.length,1);for(const tag of ['form','input','video','iframe','script'])assert.equal(h.modal.querySelector(tag),null);
});
test('network and malformed responses require explicit retry with same captured snapshot, never automatic replay',async()=>{
 for(const malformed of [false,true]){const h=await open();await review(h);const snapshot=owner(h).daring.snapshot,work=h.click(h.button('verification-daring-send'));if(malformed)await h.resolve(work,{status:200,data:{error:0,message:'bad'}});else await h.reject(work,new Error('SYNTHETIC timeout'));assert.equal(owner(h).stage,'daring-review');assert.equal(owner(h).daring.snapshot,snapshot);assert.equal(h.calls.length,1);assert.match(h.modal.textContent,malformed?/belum dikenali/:/SYNTHETIC timeout/);}
});
for(const lifecycle of ['route','epoch','navigation','reader','response','element','anonymous','close','clear'])test(`late Daring success/error after ${lifecycle} retirement cannot alter newer UI`,async()=>{
 for(const reject of [false,true]){const h=await open();await review(h);const current=owner(h),work=h.click(h.button('verification-daring-send'));if(lifecycle==='route')h.c.route='account';if(lifecycle==='epoch')h.c.sessionEpoch++;if(lifecycle==='navigation')h.c.detailSequence++;if(lifecycle==='reader')h.c.flowResults.set(current.key,{});if(lifecycle==='response')current.reader.response=response('3');if(lifecycle==='element')h.modal.innerHTML='<section data-verification-dialog>SYNTHETIC new owner</section>';if(lifecycle==='anonymous')h.state.authenticated=false;if(lifecycle==='close')h.modal.close();if(lifecycle==='clear')h.c.clearPrivate();const html=h.modal.innerHTML;if(reject)await h.reject(work,expiry());else await h.resolve(work,tuple(false));assert.equal(h.modal.innerHTML,html);assert.equal(h.records.length,0);assert.equal(h.calls.length,1);}
});
test('current authentication expiry clears identity owner and requires login without retry',async()=>{
 const h=await open();await review(h);const work=h.click(h.button('verification-daring-send'));await h.reject(work,expiry());assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(owner(h),undefined);assert.equal(h.modal.innerHTML,'');assert.equal(h.calls.length,1);assert.equal(h.toasts.length,1);
});
test('foreign or stale start/send/submit controls never dispatch identity data',async()=>{
 const h=await open(),form=h.modal.querySelector('form');await review(h);h.c.verificationDaringContinue(form);const foreign=h.document.body.appendChild(h.document.createElement('button'));foreign.setAttribute('data-action','verification-daring-send');await h.click(foreign);assert.equal(h.calls.length,0);const button=h.button('verification-daring-send');h.navigate();await h.click(button);assert.equal(h.calls.length,0);
});
