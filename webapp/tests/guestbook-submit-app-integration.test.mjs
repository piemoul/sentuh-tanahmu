import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {harness,plain,expiry} from './support/account-verification-ui-harness.mjs';
import {createGuestbook} from '../assets/guestbook/controller.js';import {GUESTBOOK_FIELDS,GUESTBOOK_COPY} from '../assets/guestbook/model.js';import {guestbookView,guestbookForm,guestbookFeedback,guestbookValidation} from '../assets/guestbook/view.js';import {getPublicCatalog} from '../private/operations.mjs';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/),helpers=lines.filter(line=>/^(?:async )?function guestbook\w+\(/.test(line)).join('\n'),handlers=lines.filter(line=>line.startsWith('document.addEventListener(')&&line.includes('guestbook-')).join('\n');
const READ='get-bukutamu-d28bf4',POST='post-bukutamu-d99dd8',CONTEXT='gbc_'+'a'.repeat(32),CONTEXT2='gbc_'+'b'.repeat(32),QR='http://persuratan.atrbpn.go.id/visitor?id=SYNTHETIC%2FID&kd=SYNTHETIC+UNIT';
const UNIT={error:false,message:null,data:{userId:'SYNTHETIC-PRIVATE-USER',kantorId:'SYNTHETIC-PRIVATE-OFFICE',unitKerjaId:'SYNTHETIC-PRIVATE-UNIT',namaUnitKerja:'KANTOR SINTETIS'}};
const draft=()=>({name:' RAW NAMA SINTETIS ',nik:'RAW-NIK-AT-LEAST-16',phone:' + phone/raw ',birthDate:' RAW DOB 12/03/2000 ',birthPlace:' RAW PLACE ',address:' RAW ADDRESS ',email:' @ ',institution:' RAW INSTITUTION ',purpose:' RAW PURPOSE\n日本語\nline '});
function setup(){
 const h=harness({user:{username:'SYNTHETIC username',nomorIndukKependudukan:'SYNTHETIC-NIK-123456',email:'SYNTHETIC@example.invalid'}}),main=h.document.body.appendChild(h.document.createElement('main'));main.setAttribute('id','main');const cameras=[];h.c.route='guestbook';h.c.routes.guestbook='Buku Tamu';h.state.operations=getPublicCatalog();assert.equal(h.state.operations.find(op=>op.id===POST)?.enabled,true);
 Object.assign(h.c,{GUESTBOOK_FIELDS,GUESTBOOK_COPY,guestbookView,guestbookForm,guestbookFeedback,guestbookValidation,structuredClone,
  // Product modules and app helpers share one browser realm. This extraction
  // harness alone crosses a Node vm boundary; clone only the helper's returned
  // literal result to that module realm, preserving every bool/delivery value.
  // It does not transform requests,errors,API responses or implementation code.
  createGuestbook:options=>createGuestbook({...options,...(options.write?{write:async values=>structuredClone(await options.write(values))}:{})}),
  head:(_kind,title,text)=>`<h1>${title}</h1><p>${text??''}</p>`,$:selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):h.document.querySelector(selector),
  createScanCamera(options){let model={stage:'idle',message:''};const camera={starts:0,stops:0,destroyed:false,context:null,snapshot:()=>({...model}),async start(context,video){camera.starts++;camera.context=context;camera.video=video;model={stage:'scanning',message:'SYNTHETIC local camera'};options.onChange(model);return true;},stop(){camera.stops++;model={stage:'idle',message:''};options.onChange(model);},destroy(){camera.destroyed=true;camera.stop();},detect(raw){options.onCode(raw,camera.context);}};cameras.push(camera);return camera;},
  render(){h.c.renderCount++;main.innerHTML=h.c.route==='guestbook'?h.c.guestbookPage():'<p>Other route</p>';},
 });vm.runInContext(helpers+'\n'+handlers,h.c);
 const dispatch=(kind,target)=>Promise.all((h.document.listeners.get(kind)??[]).map(fn=>fn({target,preventDefault(){}})));
 return{...h,main,cameras,dispatch,owner:()=>h.c.flowResults.get('guestbook:read'),input(id,value){const node=main.querySelector('#'+id);assert.ok(node,id);node.value=value;return dispatch('input',node);},submit(id='guestbook-form'){const form=main.querySelector('#'+id);assert.ok(form,id);return dispatch('submit',form);},click(action){const node=main.querySelector(`[data-action="${action}"]`);assert.ok(node,action);return dispatch('click',node);},async open({contextId=CONTEXT,unit=UNIT}={}){h.c.render();await this.input('guestbook-raw',QR);const work=this.submit('guestbook-read-form');h.calls.at(-1).resolve({result:{status:200,data:unit,...(contextId===undefined?{}:{guestbookContextId:contextId})}});await work;return this;},async fill(values=draft()){for(const field of GUESTBOOK_FIELDS)await this.input('guestbook-'+field.id,values[field.id]);return this;}};
}
const postCalls=h=>h.calls.filter(row=>row.options.body.operationId===POST),result=(error,status=200)=>({result:{status,delivery:'received',data:{error}}}),tick=()=>new Promise(resolve=>setImmediate(resolve));

test('actual own read binds only the opaque server context,never metadata IDs or an automatic writer',async()=>{
 const h=await setup().open();assert.equal(h.calls.length,1);assert.deepEqual(plain(h.calls[0].options.body),{operationId:READ,values:{uid:'SYNTHETIC+UNIT',unid:'SYNTHETIC%2FID'}});assert.equal(h.owner().submitContext,CONTEXT);assert.equal(h.owner().controller.snapshot().stage,'form');assert.equal(postCalls(h).length,0);assert.doesNotMatch(h.main.innerHTML,/SYNTHETIC-PRIVATE|gbc_/);
});

test('native Simpan validates allnine only on explicit press and invalid form never reaches API',async()=>{
 const h=await setup().open(),owner=h.owner();assert.equal(owner.controller.snapshot().canSubmit,true);await h.submit();assert.equal(h.calls.length,1);assert.equal(postCalls(h).length,0);assert.equal(owner.controller.snapshot().pending,false);assert.match(h.main.textContent,/Nama tidak boleh kosong/);assert.match(h.main.textContent,/Nomor Telepon tidak boleh kosong/);assert.equal(owner.controller.snapshot().stage,'form');
});

test('actual writer sends exact original context followed by nine raw fields,confirmtrue,and no nativeID overrides',async()=>{
 const h=await setup().open();await h.fill();const work=h.submit();assert.equal(postCalls(h).length,1);const call=postCalls(h)[0];assert.equal(call.path,'/api/execute');assert.deepEqual(plain(call.options.body),{operationId:POST,values:{contextId:CONTEXT,...draft()},confirm:true});assert.deepEqual(Object.keys(call.options.body.values),['contextId',...GUESTBOOK_FIELDS.map(field=>field.id)]);for(const key of ['userId','kantorId','unitKerjaId','uid','unid','tanggalLahir'])assert.equal(Object.hasOwn(call.options.body.values,key),false);call.resolve(result(true,201));await work;assert.equal(h.calls.length,2);
});

test('direct root writer rejects extra identities,changed raw values or absent context before any API call',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),controller=owner.controller;owner.controller={snapshot:()=>({...controller.snapshot(),writePending:true})};
 for(const values of [{...draft(),userId:'forged'},{...draft(),kantorId:'forged'},{...draft(),contextId:CONTEXT2},{...draft(),birthDate:'changed'},Object.fromEntries(Object.entries(draft()).filter(([key])=>key!=='purpose'))])await assert.rejects(h.c.guestbookWrite(owner,values),error=>error.delivery==='not_sent');
 owner.submitContext=null;await assert.rejects(h.c.guestbookWrite(owner,draft()),error=>error.delivery==='not_sent');owner.controller=controller;assert.equal(h.calls.length,1);
});

test('writer operation substitution cannot enable a different auth,path,profile,method,encoding or effect',async()=>{
 for(const patch of [{enabled:false},{clientProfile:'main'},{auth:'application'},{method:'GET'},{path:'other'},{serviceId:'directus'},{encoding:'json'},{effect:'read'},{requiresConfirmation:false},{upstreamAuthentication:'session'}]){
  const h=setup();Object.assign(h.state.operations.find(op=>op.id===POST),patch);await h.open();await h.fill();assert.equal(h.c.guestbookWriteOperation(),null);assert.equal(h.owner().controller.submit,undefined);await h.submit();assert.equal(postCalls(h).length,0);assert.equal(h.calls.length,1);
 }
});

test('pending actual app disables nine fields/QR,stops camera and suppresses double submit or stale DOM events',async()=>{
 const h=await setup().open();await h.fill();await h.click('guestbook-camera-start');const owner=h.owner(),oldForm=h.main.querySelector('#guestbook-form'),work=h.submit();assert.equal(postCalls(h).length,1);assert.equal(owner.controller.snapshot().writePending,true);assert.equal(owner.camera.snapshot().stage,'idle');assert.ok(h.main.querySelectorAll('[data-guestbook-field]').every(node=>node.disabled));assert.equal(h.main.querySelector('#guestbook-raw').disabled,true);assert.equal(h.main.querySelector('[data-guestbook-save]').disabled,true);
 await h.submit();await h.dispatch('submit',oldForm);const node=h.main.querySelector('#guestbook-name');node.value='DISABLED INPUT ATTEMPT';await h.dispatch('input',node);owner.camera.detect(QR+'&new=attempt');assert.deepEqual(owner.controller.snapshot().values,draft());assert.equal(owner.submitContext,CONTEXT);assert.equal(postCalls(h).length,1);postCalls(h)[0].resolve(result(true,201));await work;
});

test('received201 native errortrue silently retains form,draft and context with no refresh or automatic retry',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),work=h.submit();postCalls(h)[0].resolve(result(true,201));await work;assert.equal(owner.controller.snapshot().stage,'form');assert.equal(owner.controller.snapshot().writeError,'');assert.equal(owner.submitContext,CONTEXT);assert.deepEqual(owner.controller.snapshot().values,draft());assert.doesNotMatch(h.main.textContent,/Sudah Terisi|Hasil pengiriman belum/);await tick();assert.equal(h.calls.length,2);const explicit=h.submit();assert.equal(postCalls(h).length,2);postCalls(h)[1].resolve(result(true,201));await explicit;assert.equal(h.calls.length,3);
});

test('native200false opens success without another API,and Kembali destroys oldowner into freshQRentry',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),oldForm=h.main.querySelector('#guestbook-form'),work=h.submit();postCalls(h)[0].resolve(result(false));await work;assert.match(h.main.textContent,/Terimakasih/);assert.match(h.main.textContent,/Buku Tamu Sudah Terisi/);assert.equal(h.main.querySelector('#guestbook-form'),null);assert.equal(owner.submitContext,null);assert.equal(owner.readNonce,null);assert.equal(h.calls.length,2);
 await h.dispatch('submit',oldForm);assert.equal(h.calls.length,2);await h.click('guestbook-back');assert.equal(owner.camera.destroyed,true);assert.equal(owner.controller.snapshot().stage,'disposed');assert.ok(Object.values(owner.controller.snapshot().values).every(value=>value===null));assert.notEqual(h.owner(),owner);assert.equal(h.owner().controller.snapshot().stage,'idle');assert.equal(h.owner().controller.snapshot().raw,'');assert.equal(h.c.route,'guestbook');assert.ok(h.main.querySelector('#guestbook-read-form'));assert.doesNotMatch(h.main.innerHTML,/RAW NAMA|RAW DOB|RAW PURPOSE/);assert.equal(h.calls.length,2);
});

test('unknown handoff locks actualform/QR/edit and cannot replay via event,doubleclick,camera or newread',async()=>{
 const h=await setup().open();await h.fill();const work=h.submit();postCalls(h)[0].reject(Object.assign(new Error('SYNTHETIC transport drop'),{delivery:'unknown'}));await work;const owner=h.owner();assert.equal(owner.controller.snapshot().writeLocked,true);assert.equal(h.main.querySelector('[data-guestbook-save]').disabled,true);assert.equal(h.main.querySelector('#guestbook-raw').disabled,true);assert.match(h.main.textContent,/Hasil pengiriman belum dapat dipastikan/);await h.submit();await h.submit('guestbook-read-form');await h.click('guestbook-camera-start');assert.equal(h.calls.length,2);assert.equal(postCalls(h).length,1);assert.deepEqual(owner.controller.snapshot().values,draft());assert.doesNotMatch(h.main.textContent,/Buku Tamu Sudah Terisi/);
});

test('verified local not_sent keeps draft and explicit retry without automatic refresh or loss of context',async()=>{
 const h=await setup().open();await h.fill();const work=h.submit();postCalls(h)[0].reject(Object.assign(new Error('SYNTHETIC local check'),{code:'CSRF_REJECTED',delivery:'not_sent'}));await work;assert.equal(h.owner().submitContext,CONTEXT);assert.deepEqual(h.owner().controller.snapshot().values,draft());assert.equal(h.owner().controller.snapshot().writeLocked,false);assert.match(h.main.textContent,/SYNTHETIC local check/);await tick();assert.equal(h.calls.length,2);const explicit=h.submit();assert.equal(postCalls(h).length,2);postCalls(h)[1].resolve(result(true,201));await explicit;
});

test('expired context is removed without resending; a new explicit QR lookup resets and binds only its new context',async()=>{
 const h=await setup().open();await h.fill();const work=h.submit();postCalls(h)[0].reject(Object.assign(new Error('SYNTHETIC context expired'),{code:'GUESTBOOK_CONTEXT_INVALID',delivery:'not_sent'}));await work;assert.equal(h.owner().submitContext,null);assert.equal(h.owner().controller.snapshot().canSubmit,false);assert.deepEqual(h.owner().controller.snapshot().values,draft());await h.submit();assert.equal(postCalls(h).length,1);
 const read=h.submit('guestbook-read-form');assert.equal(h.calls.length,3);h.calls.at(-1).resolve({result:{status:200,data:UNIT,guestbookContextId:CONTEXT2}});await read;assert.equal(h.owner().submitContext,CONTEXT2);assert.equal(h.owner().controller.snapshot().values.name,null);await h.fill();const explicit=h.submit();assert.equal(postCalls(h).at(-1).options.body.values.contextId,CONTEXT2);postCalls(h).at(-1).resolve(result(true,201));await explicit;
});

test('late old QR success cannot bind or overwrite a newer successful opaque lookup context',async()=>{
 const h=setup();h.c.render();await h.input('guestbook-raw',QR);const first=h.submit('guestbook-read-form');await h.input('guestbook-raw',QR+'&generation=NEW');const second=h.submit('guestbook-read-form');h.calls[1].resolve({result:{status:200,data:UNIT,guestbookContextId:CONTEXT2}});await second;assert.equal(h.owner().submitContext,CONTEXT2);h.calls[0].resolve({result:{status:200,data:UNIT,guestbookContextId:CONTEXT}});await first;assert.equal(h.owner().submitContext,CONTEXT2);assert.equal(h.owner().controller.snapshot().raw,QR+'&generation=NEW');assert.equal(postCalls(h).length,0);
});

test('late oldQR401 neither clears a newer user session nor binds any oldcontext',async()=>{
 const h=setup();h.c.render();await h.input('guestbook-raw',QR);const first=h.submit('guestbook-read-form');await h.input('guestbook-raw',QR+'&new=1');const second=h.submit('guestbook-read-form');h.calls[1].resolve({result:{status:200,data:UNIT,guestbookContextId:CONTEXT2}});await second;h.calls[0].reject(expiry());await first;assert.equal(h.owner().submitContext,CONTEXT2);assert.equal(h.state.authenticated,true);assert.equal(h.toasts.length,0);
});

test('navigation disposes pendingwriter,camera,rawPII and late401 without restoring form or clearing newer state',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),work=h.submit();h.navigate('account');const before=h.main.innerHTML;postCalls(h)[0].reject(expiry());await work;assert.equal(owner.camera.destroyed,true);assert.equal(owner.controller.snapshot().stage,'disposed');assert.ok(Object.values(owner.controller.snapshot().values).every(value=>value===null));assert.equal(h.main.innerHTML,before);assert.equal(h.owner(),undefined);assert.equal(h.state.authenticated,true);assert.equal(h.toasts.length,0);
});

test('clearPrivate erases pendingQR/form DOM and controllerPII before late accepted completion',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),work=h.submit();h.c.clearPrivate();const before=h.main.innerHTML;postCalls(h)[0].resolve(result(false));await work;assert.equal(h.owner(),undefined);assert.equal(owner.camera.destroyed,true);assert.equal(owner.controller.snapshot().raw,'');assert.equal(owner.controller.snapshot().unit,null);assert.ok(Object.values(owner.controller.snapshot().values).every(value=>value===null));assert.equal(h.main.innerHTML,before);assert.doesNotMatch(before,/RAW NAMA|RAW DOB|RAW PURPOSE|SYNTHETIC%2F|SYNTHETIC@example/);
});

test('current authenticated writer401 retires owner once and displays ordinary login without PII',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),work=h.submit();postCalls(h)[0].reject(expiry());await work;assert.equal(h.state.authenticated,false);assert.equal(h.owner(),undefined);assert.equal(h.toasts.length,1);assert.equal(owner.camera.destroyed,true);assert.equal(owner.controller.snapshot().stage,'disposed');assert.match(h.main.textContent,/Masuk untuk membuka Buku Tamu/);assert.doesNotMatch(h.main.innerHTML,/RAW NAMA|RAW DOB|RAW PURPOSE/);
});

test('actual account replacement keeps newidentity after oldwriter401 and does not publish stale success',async()=>{
 const h=await setup().open();await h.fill();const owner=h.owner(),work=h.submit();h.c.session({csrfToken:'SYNTHETIC-new-csrf',authenticated:true,user:{username:'NEW-SYNTHETIC-OWNER'}});h.c.render();postCalls(h)[0].reject(expiry());await work;assert.equal(h.state.authenticated,true);assert.equal(h.state.user.username,'NEW-SYNTHETIC-OWNER');assert.equal(h.toasts.length,0);assert.equal(owner.controller.snapshot().stage,'disposed');assert.notEqual(h.owner(),owner);assert.doesNotMatch(h.main.textContent,/Buku Tamu Sudah Terisi/);
});

test('detached,foreign and disabled form/input/camera controls cannot start another write',async()=>{
 const h=await setup().open();await h.fill();const foreign=h.document.body.appendChild(h.document.createElement('form'));foreign.setAttribute('id','guestbook-form');await h.dispatch('submit',foreign);assert.equal(postCalls(h).length,0);const old=h.main.querySelector('#guestbook-form'),work=h.submit();await h.dispatch('submit',old);assert.equal(postCalls(h).length,1);postCalls(h)[0].resolve(result(true,201));await work;
});

test('malformed response delivery or wrongtypebool stays unknown in actual adapter,never nativefalse success',async()=>{
 for(const reply of [{result:{status:200,data:{error:false}}},{result:{status:200,delivery:'received',data:{error:'false'}}},{result:{status:200,delivery:'unknown',data:{error:false}}}]){const h=await setup().open();await h.fill();const work=h.submit();postCalls(h)[0].resolve(reply);await work;assert.equal(h.owner().controller.snapshot().writeLocked,true);assert.equal(h.owner().controller.snapshot().writeOutcome.accepted,false);assert.doesNotMatch(h.main.textContent,/Buku Tamu Sudah Terisi/);assert.equal(h.calls.length,2);}
});

test('writer error text remains escaped and original GET IDs are not displayed in writefeedback',async()=>{
 const h=await setup().open({unit:{...UNIT,data:{...UNIT.data,namaUnitKerja:'<script>KANTOR SINTETIS</script>'}}});await h.fill();const work=h.submit();postCalls(h)[0].reject(Object.assign(new Error('<img src=x onerror="SYNTHETIC()">'),{delivery:'not_sent'}));await work;assert.equal(h.main.querySelector('script'),null);assert.equal(h.main.querySelector('img'),null);assert.match(h.main.innerHTML,/&lt;script&gt;/);assert.match(h.main.innerHTML,/&lt;img/);assert.doesNotMatch(h.main.innerHTML,/SYNTHETIC-PRIVATE/);
});
