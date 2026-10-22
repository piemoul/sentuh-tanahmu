// Independent frontend review. Reviewer authored native boundary and the
// separate private client/model, not these public modules or app glue.
// Reuse test-only DOM plus actual app helper/handler source; no browser/provider.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {harness,plain,expiry} from '../../webapp/tests/support/account-verification-ui-harness.mjs';
import {createGuestbook} from '../../webapp/assets/guestbook/controller.js';
import {GUESTBOOK_FIELDS,GUESTBOOK_COPY,guestbookValidate} from '../../webapp/assets/guestbook/model.js';
import {guestbookView,guestbookForm,guestbookFeedback,guestbookValidation} from '../../webapp/assets/guestbook/view.js';
import {getPublicCatalog} from '../../webapp/private/operations.mjs';
const root=new URL('../../',import.meta.url),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=path=>readFile(new URL(path,root)),bind=async path=>({path,sha256:sha(await read(path))});
const files=['webapp/app.js','webapp/styles.css','webapp/assets/guestbook/model.js','webapp/assets/guestbook/controller.js','webapp/assets/guestbook/view.js','webapp/scan-camera.js','webapp/private/operations.mjs','webapp/private/operations-runtime.mjs','webapp/tests/guestbook-model.test.mjs','webapp/tests/guestbook-controller.test.mjs','webapp/tests/guestbook-ui.test.mjs','webapp/tests/support/account-verification-ui-harness.mjs','analysis/recovered/guestbook-followup/flow.json','analysis/recovered/guestbook-followup/public-copy.json','analysis/recovered/guestbook-service-followup/flow.json'];
const inputs=await Promise.all(files.map(bind));
const source=(await read(files[0])).toString(),lines=source.split(/\r?\n/),testSource=(await read('webapp/tests/guestbook-ui.test.mjs')).toString();
const helpers=lines.filter(line=>/^(?:async )?function guestbook\w+\(/.test(line)).join('\n');
const handlers=lines.filter(line=>line.startsWith('document.addEventListener(')&&line.includes('guestbook-')).join('\n');
const setupSource=testSource.slice(testSource.indexOf('function setup(){'),testSource.indexOf('\nasync function open('));
assert.match(setupSource,/function setup\(\)/);assert.match(setupSource,/vm.runInContext\(helpers/);
const names=['harness','vm','createGuestbook','GUESTBOOK_FIELDS','GUESTBOOK_COPY','guestbookView','guestbookForm','guestbookFeedback','guestbookValidation','getPublicCatalog','source','lines','helpers','handlers','assert'];
const setup=new Function(...names,setupSource+'\nreturn setup;')(harness,vm,createGuestbook,GUESTBOOK_FIELDS,GUESTBOOK_COPY,guestbookView,guestbookForm,guestbookFeedback,guestbookValidation,getPublicCatalog,source,lines,helpers,handlers,assert);
const qr='https://persuratan.atrbpn.go.id/visitor?id=SYNTHETIC%2FID&kd=SYNTHETIC+UNIT';
const envelope={error:true,message:null,data:{userId:'synthetic-private-user',kantorId:'synthetic-private-office',unitKerjaId:'synthetic-private-unit',namaUnitKerja:'Review office'}};
const checkNames=[];async function check(name,fn){await fn();checkNames.push(name);}
async function open(h,body=envelope){h.c.render();await h.input('guestbook-raw',qr);const work=h.submit();assert.equal(h.calls.length,1);h.calls[0].resolve({result:{status:200,data:body}});await work;}

await check('real public catalog accepts normalized path/service profile despite original endpoint template',()=>{
 const h=setup(),op=h.state.operations.find(op=>op.id==='get-bukutamu-d28bf4');assert.equal(op.endpoint,'${TRb.AYi}bukutamu');assert.equal(op.path,'bukutamu');assert.equal(h.c.guestbookOperation(),op);
 for(const patch of [{id:'wrong'},{path:'/bukutamu'},{serviceId:'directus'},{method:'POST'},{auth:'application'},{clientProfile:'main'},{enabled:false},{effect:'write'}]){
  const fresh=setup(),target=fresh.state.operations.find(op=>op.id==='get-bukutamu-d28bf4');Object.assign(target,patch);assert.equal(fresh.c.guestbookOperation(),undefined);
 }
});
await check('all native nullable error/message combinations render nine fields from a typed nonnull model',async()=>{
 for(const body of [envelope,{...envelope,error:false},{...envelope,error:null},{data:envelope.data},{data:{},error:null,message:null}]){
  const h=setup();await open(h,body);assert.equal(h.owner().controller.snapshot().stage,'form');assert.equal(h.main.querySelectorAll('[data-guestbook-field]').length,9);
  assert.equal(h.calls.length,1);assert.doesNotMatch(h.main.innerHTML,/synthetic-private-(?:user|office|unit)/);
 }
});
await check('every raw field retains the exact active DOM node/caret/value through edits and local validation',async()=>{
 const h=setup();await open(h);const nodes=new Map();
 const values={name:'  名 "<&>  ',nik:'not-only-digits-123456',phone:' raw +62? ',birthDate:'raw-date',birthPlace:'  Kota é  ',address:'  Alamat & jalan  ',email:' raw @ address ',institution:' Instansi "é" ',purpose:' Keperluan <sah> '};
 for(const field of GUESTBOOK_FIELDS){const input=h.main.querySelector('#guestbook-'+field.id);nodes.set(field.id,input);input.focus();input.selectionStart=2;input.selectionEnd=4;await h.input(input.id,values[field.id]);assert.equal(h.main.querySelector('#'+input.id),input);assert.equal(h.document.activeElement,input);assert.equal(input.value,values[field.id]);assert.equal(input.selectionStart,2);assert.equal(input.selectionEnd,4);}
 await h.submit('guestbook-form');assert.deepEqual(plain(h.owner().controller.snapshot().values),values);assert.equal(h.owner().controller.snapshot().validation.ok,true);
 for(const field of GUESTBOOK_FIELDS){assert.equal(h.main.querySelector('#guestbook-'+field.id),nodes.get(field.id));assert.equal(nodes.get(field.id).value,values[field.id]);}
 assert.equal(h.calls.length,1);assert.match(h.main.textContent,/Data belum dikirim dan kedatangan belum didaftarkan/);assert.equal(h.main.querySelector('button[aria-describedby="guestbook-write-boundary"]').disabled,true);
});
await check('actual String rules retain native overwrite order, UTF16 length, whitespace and date permissiveness',()=>{
 const empty=Object.fromEntries(GUESTBOOK_FIELDS.map(field=>[field.id,null]));let checked=guestbookValidate(empty);assert.equal(checked.errors.nik,'NIK Tidak Boleh Kurang Dari 16 Digit');assert.equal(checked.errors.email,'Alamat Email tidak boleh kosong');
 checked=guestbookValidate({...empty,email:''});assert.equal(checked.errors.email,'Email Tidak Valid');
 const permissive=Object.fromEntries(GUESTBOOK_FIELDS.map(field=>[field.id,' ']));permissive.nik='😀'.repeat(8);permissive.email='@';permissive.birthDate='not-a-date';assert.equal(guestbookValidate(permissive).ok,true);
});
await check('QR input retains focus and retires the prior request; late response cannot replace a newer form',async()=>{
 for(const lateAuth of [false,true]){
  const h=setup();h.c.render();await h.input('guestbook-raw',qr);const first=h.submit();const raw=h.main.querySelector('#guestbook-raw');raw.focus();raw.selectionStart=3;raw.selectionEnd=5;
  await h.input('guestbook-raw',qr.replace('SYNTHETIC+UNIT','NEW-UNIT'));assert.equal(h.main.querySelector('#guestbook-raw'),raw);assert.equal(h.document.activeElement,raw);assert.equal(raw.selectionStart,3);
  const second=h.submit();assert.equal(h.calls.length,2);h.calls[1].resolve({result:{status:200,data:{...envelope,data:{...envelope.data,namaUnitKerja:'New current office'}}}});await second;
  if(lateAuth)h.calls[0].reject(expiry());else h.calls[0].resolve({result:{status:200,data:envelope}});await first;
  assert.equal(h.state.authenticated,true);assert.match(h.main.textContent,/New current office/);assert.equal(h.owner().controller.snapshot().unit.namaUnitKerja,'New current office');assert.equal(h.toasts.length,0);
 }
});
await check('real session helper clears old identity/draft/camera and starts a fresh own-signin prefill after account switch',async()=>{
 const h=setup();h.c.render();await h.input('guestbook-raw',qr);const work=h.submit(),old=h.owner();
 h.c.session({authenticated:true,user:{username:'SECOND SYNTHETIC account',nomorIndukKependudukan:'SECOND SIGNIN NIK',email:'second@example.invalid',nama:'not-prefill',name:'not-prefill'}});h.c.render();
 assert.equal(old.camera.destroyed,true);assert.equal(old.controller.snapshot().stage,'disposed');assert.notEqual(h.owner(),old);
 h.calls[0].reject(expiry());await work;assert.equal(h.state.authenticated,true);assert.equal(h.toasts.length,0);assert.equal(h.owner().controller.snapshot().values.nik,'SECOND SIGNIN NIK');assert.equal(h.owner().controller.snapshot().values.email,'second@example.invalid');assert.equal(h.owner().controller.snapshot().values.name,null);assert.equal(h.owner().controller.snapshot().raw,'');
});
await check('late camera callback and detached controls from a retired visit cannot change replacement owner',async()=>{
 const h=setup();h.c.render();await h.dispatch('click',h.main.querySelector('[data-action="guestbook-camera-start"]'));const old=h.owner(),camera=old.camera,readForm=h.main.querySelector('#guestbook-read-form');
 h.navigate('account');h.navigate('guestbook');const replacement=h.owner();assert.notEqual(replacement,old);assert.equal(camera.destroyed,true);
 camera.detect(qr);await h.dispatch('submit',readForm);assert.equal(replacement.controller.snapshot().raw,'');assert.equal(h.calls.length,0);
});
await check('rendering and invalid/changed QR never implicitly read, store, export or submit draft fields',async()=>{
 const h=setup();for(let i=0;i<3;i++)h.c.render();await h.input('guestbook-raw','invalid-local-input');await h.submit();assert.equal(h.calls.length,0);await h.input('guestbook-raw',qr);assert.equal(h.calls.length,0);
 const modules=(await Promise.all(['model','controller','view'].map(name=>read('webapp/assets/guestbook/'+name+'.js')))).map(raw=>raw.toString()).join('\n');
 assert.doesNotMatch(modules,/\b(?:localStorage|sessionStorage|indexedDB|sendBeacon|fetch)\s*(?:\.|\()/);assert.doesNotMatch(helpers,/post-bukutamu|\/api\/logout|\/api\/login|account_summary|state\.results\.set|\brecord\(/);assert.equal(h.owner().controller.submit,undefined);
});
await check('malformed metadata/errors and untrusted display strings remain escaped and cannot become success',async()=>{
 const h=setup();await open(h,{...envelope,data:{...envelope.data,namaUnitKerja:'<img src=x onerror="bad()">'}});assert.equal(h.main.querySelector('img'),null);assert.match(h.main.innerHTML,/&lt;img/);assert.doesNotMatch(h.main.textContent,/Buku Tamu Sudah Terisi/);
 await h.input('guestbook-raw',qr);const work=h.submit();h.calls[1].reject(Object.assign(new Error('<script>bad()</script>'),{code:'SYNTHETIC_ERROR'}));await work;assert.equal(h.main.querySelector('script'),null);assert.match(h.main.innerHTML,/&lt;script&gt;/);assert.equal(h.main.querySelector('#guestbook-form'),null);assert.equal(h.state.authenticated,true);
});
await check('responsive CSS and semantic form boundaries exist without claiming actual mobile/IME acceptance',async()=>{
 const css=(await read('webapp/styles.css')).toString();assert.match(css,/@media\(max-width:900px\)\{\.guestbook-layout\{grid-template-columns:1fr\}/);assert.match(css,/@media\(max-width:480px\)\{\.guestbook-form-panel \.parameter-grid\{grid-template-columns:1fr\}/);
 const h=setup();await open(h);const form=h.main.querySelector('#guestbook-form');assert.equal(form.querySelectorAll('input[type="text"]').length,9);assert.equal(form.getAttribute('autocomplete'),'off');assert.ok(h.main.querySelector('[data-guestbook-validation]'));assert.equal(form.querySelector('input[type="hidden"]'),null);
});

const result=spawnSync(process.execPath,['--test','--test-reporter=tap','webapp/tests/guestbook-model.test.mjs','webapp/tests/guestbook-controller.test.mjs','webapp/tests/guestbook-ui.test.mjs'],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
assert.equal(result.status,0,result.stderr+'\n'+result.stdout);assert.match(result.stdout,/# tests 30\n/);assert.match(result.stdout,/# pass 30\n/);assert.match(result.stdout,/# fail 0\n/);
for(const row of inputs)assert.deepEqual(await bind(row.path),row,'Frontend source changed during review');
const tapPath='analysis/webapp/guestbook-frontend-review-tests.tap',reportPath='analysis/webapp/guestbook-frontend-review.json';
for(const path of [tapPath,reportPath]){try{await read(path);throw new Error('Frozen output exists; use a successor.');}catch(error){if(error.code!=='ENOENT')throw error;}}
await writeFile(new URL(tapPath,root),result.stdout);
const report={schema_version:1,status:'PASS',review_kind:'independent public frontend integration review; reviewer authored native boundary/private read client, not public model/controller/view/app/styles/tests',inputs,writer:await bind('analysis/rea/review_guestbook_frontend.mjs'),actualSourceHarness:{appHelpers:'guestbook* functions and all three delegated input/click/submit handlers extracted verbatim from current app.js',setup:'Reuse unchanged test setup plus account-verification-ui-harness fake DOM; fresh independent assertions',networkRequests:0,camera:'mock only; real camera/provider not used'},independentChecks:checkNames,focusedTests:{tests:30,pass:30,fail:0,tap:await bind(tapPath)},confirmedPreReviewResolutions:[{source:'root identified/corrected before this review',issue:'public catalog original endpoint template differs from normalized path',verified:'guestbookOperation uses exact id/path/serviceId/method/auth/profile and enabled nonwrite guard against actual getPublicCatalog() output'},{source:'root identified/corrected before this review',issue:'nullable/missing native envelope.error must not veto valid metadata',verified:'public model and actual app helpers render nine-field form for true/false/null/missing error; bad nonnull types still fail'}],materialFindings:[],observedBoundaries:{prefill:'only cached sign-in NIK/email; account_summary/name/phone/date not substituted',fields:9,validation:'raw String null/empty, NIK length<16, email contains@ with native error overwrite order; no stronger identity/date claims',metadata:'explicit QR read only; no hidden server identifiers in markup and no form values in request',form:'local validation only; Simpan disabled, no POST writer or arrival success',lifecycle:'owned route/epoch/navigation/DOM checks; QR changes retire request; navigate/session/logout dispose controller/camera and erase DOM; stale callbacks ignored',storage:'no persistent/export/logging API in the public modules or guestbook helper path'},newActions:{runtimeEdits:0,productionRequests:0,browserRequests:0,cameraActions:0,geolocationActions:0,accountValuesRead:false,realQrReadOrGenerated:false,guestbookSubmissions:0},limits:['Fake DOM/source VM does not establish real mobile layout, browser selection/IME, permission or hardware camera acceptance. Root browser receipt is separate.','HTTP(S) exact-host QR guard and retryable null-data UI are browser adaptations; native substring query behavior/empty values remain explicit, not QR authenticity or attendance proof.','Native instructions are presented as expandable information rather than full native dialog navigation. Shared formatter/keyboard/user chooser and full native parity remain unproved.','No actual official metadata read or registration acceptance was tested.'],goalComplete:false};
await writeFile(new URL(reportPath,root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',independentChecks:checkNames.length,tests:30,materialFindings:0,reportSha256:sha(await read(reportPath))}));
