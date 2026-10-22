// Actual account-status functions and delegated handlers; synthetic DOM/transport only.
// Method follow-up intentionally replaces the old inert name-list assertion with
// three local choice controls and no guessed native cached default; 44 cases retained.
import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,response,plain,expiry,OP,KEY} from './support/account-verification-ui-harness.mjs';
test('exact native messages/actions are independent of nullable error and retain null/empty rejection suffix',()=>{
 const {c}=harness();for(const error of [undefined,null,false,true])for(const data of [undefined,null,'','SYNTHETIC reason'])for(const message of ['0','1','2']){
  const decision=c.nativeVerificationDecision(response(message,error,data),{userLevel:1});assert.equal(decision.kind,'status');
  assert.equal(decision.message,message==='0'?'Permohonan verifikasi akun sedang dalam proses.':message==='1'?'Permohonan verifikasi kamu telah disetujui. Mohon untuk login kembali untuk memperbarui akun kamu.':'Permohonan verifikasi kamu ditolak. \n'+(data??''));
  assert.equal(decision.first,message==='0'?'Ok':'Batal ');assert.equal(decision.action,message==='0'?null:message==='1'?'logout':'methods');
 }
});
test('normal native dialogs suppress integer level2 and reject missing/malformed cached users without coercion',()=>{
 const {c}=harness();for(const user of [undefined,null,[],false,'user',2,{userLevel:2},{userLevel:'2'},{userLevel:'1'},{userLevel:2.5},{userLevel:true},{userLevel:NaN},{userLevel:Infinity},{userLevel:Number.MAX_SAFE_INTEGER+1}])for(const message of ['0','1','2'])assert.equal(c.nativeVerificationDecision(response(message),user),null,`${message}/${JSON.stringify(user)}`);
});
test('existing cached user with nullable or other integer levels permits exact normal dispatch',()=>{
 const {c}=harness();for(const user of [{},{userLevel:undefined},{userLevel:null},{userLevel:-1},{userLevel:0},{userLevel:1},{userLevel:3}])for(const message of ['0','1','2'])assert.equal(c.nativeVerificationDecision(response(message),user)?.kind,'status');
});
test('routing codes -1/3 precede cached-user gate and never imply verified/unverified account',()=>{
 const {c}=harness();for(const message of ['-1','3'])for(const error of [null,false,true])for(const user of [undefined,null,[],{userLevel:2},{userLevel:'malformed'}])assert.deepEqual(plain(c.nativeVerificationDecision(response(message,error,'unused'),user)),{kind:'methods'});
});
test('unknown/null/empty/prototype codes have no normal native dialog',()=>{
 const {c}=harness();for(const message of [undefined,null,'','01',' 1','1 ','TRUE','__proto__','constructor','toString','<img src=x onerror=alert(1)>'])for(const error of [false,true])assert.equal(c.nativeVerificationDecision(response(message,error),{userLevel:1}),null);
});
test('wrong BCb types, encoded JSON and unsuccessful/missing HTTP statuses never create native decision',()=>{
 const {c}=harness();for(const data of [null,[],true,'{"message":"1"}',{error:'true',message:'1'},{message:1},{message:'1',data:7}])assert.equal(c.nativeVerificationDecision({status:200,data},{userLevel:1}),null);
 for(const status of [undefined,null,'200',199,300,401,403,500])assert.equal(c.nativeVerificationDecision({status,data:{error:false,message:'1'}},{userLevel:1}),null);
 for(const status of [200,201,299])assert.equal(c.nativeVerificationDecision({status,data:{message:'1'}},{userLevel:1})?.kind,'status');
});
test('native dialog uses sign-in state.user rather than conflicting account_summary userLevel/statusVerifikasi',()=>{
 const h=harness();h.state.results.set('synthetic-summary',{status:200,data:{error:false,data:{userLevel:2,statusVerifikasi:1}}});h.open();assert.equal(h.modal.open,true);
 const second=harness();second.c.session({authenticated:true,user:{username:'SYNTHETIC login user',userLevel:2}});second.state.results.set('synthetic-summary',{status:200,data:{error:false,data:{userLevel:1,statusVerifikasi:0}}});const owner=second.open(response('2'));assert.equal(second.modal.open,false);assert.equal(owner.verificationDialogHandled,true);
});
test('declared browser status card remains separate from role-suppressed native dialog and does not veto error:true',()=>{
 const h=harness({user:{userLevel:2}});for(const [message,label] of [['0','Verifikasi dalam proses'],['1','Verifikasi disetujui'],['2','Verifikasi ditolak']]){const html=h.c.verificationStatusView(response(message,true,'<script>inert</script>'));assert.match(html,new RegExp(label));assert.doesNotMatch(html,/<script>/);h.open(response(message,true));assert.equal(h.modal.open,false);}
 assert.match(h.c.verificationStatusView(response('1',true)),/Mohon untuk login kembali/);assert.equal(h.calls.length,0);
});
for(const [code,first,action] of [['0','Ok',null],['1','Batal ','logout'],['2','Batal ','verification-methods']])test(`native code${code} opens once with exact message/controls and never executes its action automatically`,()=>{
 const h=harness(),owner=h.open(response(code,true,'SYNTHETIC reason'));assert.equal(h.modal.open,true);assert.equal(h.modal.shows,1);assert.equal(h.c.verificationDialogCurrent(),true);assert.equal(h.button('verification-dismiss').textContent,first);assert.equal(h.document.activeElement,h.button('verification-dismiss'));
 assert.equal(Boolean(h.button('logout')),action==='logout');assert.equal(Boolean(h.button('verification-methods')),action==='verification-methods');assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);
 if(code==='2')assert.equal(h.modal.querySelector('.verification-dialog-message').textContent,'Permohonan verifikasi kamu ditolak. \nSYNTHETIC reason');
 h.c.showVerificationStatusDialog(owner,KEY,h.c.sessionEpoch,h.c.detailSequence);h.c.render();h.c.verificationStatusView(owner.response);assert.equal(h.modal.shows,1);
});
for(const code of ['-1','3'])test(`code${code} opens local method choices without a guessed default or identity action`,()=>{
 const h=harness({user:null});h.open(response(code,true));assert.equal(h.modal.querySelector('#modal-title').textContent,'Metode verifikasi');const choices=h.modal.querySelectorAll('[data-action="verification-method-choice"]');assert.deepEqual(choices.map(node=>node.textContent),['Daring','Luring','IKD']);assert.ok(choices.every(node=>node.getAttribute('aria-pressed')==='false'));assert.match(h.modal.textContent,/Pilih metode verifikasi untuk melihat petunjuknya/);assert.equal(h.button('verification-dismiss').textContent,'Tutup');assert.equal(h.modal.querySelectorAll('button').length,4);for(const tag of ['input','form','a','iframe','img','script'])assert.equal(h.modal.querySelector(tag),null);assert.equal(h.calls.length,0);
});
test('explicit Verifikasi replaces owned rejected-status content with inert chooser and no request',async()=>{
 const h=harness();h.open(response('2'));const original=h.c.flowResults.get('verification:dialog-state').element;await h.click(h.button('verification-methods'));assert.equal(original.isConnected,false);assert.equal(h.c.verificationDialogCurrent(),true);assert.equal(h.modal.shows,1);assert.equal(h.modal.querySelector('#modal-title').textContent,'Metode verifikasi');assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);
});
test('rejection and unknown service text remain escaped; no identity/OTP fields or hidden aliases become active',()=>{
 const h=harness();h.open(response('2',true,'<img src=x onerror=alert(1)>'));assert.equal(h.modal.querySelector('img'),null);assert.match(h.modal.innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);assert.doesNotMatch(h.modal.innerHTML,/data-action="(?:execute|submit|otp)"/);const html=h.c.verificationStatusView(response('<script>bad</script>',true,'IGNORED'));assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>|IGNORED/);
});
test('explicit dismissal closes only current owner and handled response cannot reopen on render/revisit',async()=>{
 const h=harness(),owner=h.open();await h.click(h.button('verification-dismiss'));assert.equal(h.modal.open,false);assert.equal(h.modal.innerHTML,'');assert.equal(h.c.flowResults.has('verification:dialog-state'),false);h.c.render();h.c.showVerificationStatusDialog(owner,KEY,h.c.sessionEpoch,h.c.detailSequence);h.navigate('account');h.navigate('verification');h.c.showVerificationStatusDialog(owner,KEY,h.c.sessionEpoch,h.c.detailSequence);assert.equal(h.modal.shows,1);assert.equal(h.calls.length,0);
});
test('Escape follows actual cancel/close listeners, retires active dialog and does not execute credential action',()=>{
 const h=harness(),owner=h.open();const event=h.escape();assert.equal(event.defaultPrevented,false);assert.equal(h.modal.open,false);assert.equal(h.c.verificationDialogCurrent(),false);h.c.showVerificationStatusDialog(owner,KEY,h.c.sessionEpoch,h.c.detailSequence);assert.equal(h.modal.shows,1);assert.equal(h.state.authenticated,true);assert.equal(h.calls.length,0);
});
test('a pre-existing unrelated modal is not overwritten or reopened later by a handled status response',()=>{
 const h=harness();h.modal.innerHTML='<section id="unrelated">SYNTHETIC other dialog</section>';h.modal.showModal();const owner=h.open();assert.ok(h.modal.querySelector('#unrelated'));assert.equal(h.c.flowResults.has('verification:dialog-state'),false);h.modal.close();h.c.showVerificationStatusDialog(owner,KEY,h.c.sessionEpoch,h.c.detailSequence);assert.equal(h.modal.shows,1);assert.equal(h.modal.open,false);
});
for(const mismatch of ['route','epoch','navigation','reader','response','loading','element','closed','anonymous'])test(`${mismatch} mismatch prevents obsolete dialog controls from acting`,async()=>{
 const h=harness();h.open(response('2'));const original=h.modal.innerHTML;if(mismatch==='route')h.c.route='account';if(mismatch==='epoch')h.c.sessionEpoch++;if(mismatch==='navigation')h.c.detailSequence++;if(mismatch==='reader')h.c.flowResults.set(KEY,{response:response('2'),loading:false});if(mismatch==='response')h.c.flowResults.get(KEY).response=response('2');if(mismatch==='loading')h.c.flowResults.get(KEY).loading=true;if(mismatch==='element')h.modal.innerHTML='<section data-verification-dialog>SYNTHETIC replacement</section>';if(mismatch==='closed')h.modal.close();if(mismatch==='anonymous')h.state.authenticated=false;
 const before=h.modal.innerHTML,wasOpen=h.modal.open;assert.equal(h.c.verificationDialogCurrent(),false);h.c.showVerificationMethods();h.c.dismissVerificationDialog();assert.equal(h.modal.innerHTML,before);assert.equal(h.modal.open,wasOpen);if(mismatch!=='element')assert.equal(before,original);assert.equal(h.calls.length,0);
});
test('actual runFlow uses existing session-only read operation and empty values, then offers dialog once',async()=>{
 const h=harness(),work=h.c.runFlow();assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/api/execute');assert.deepEqual(plain(h.calls[0].options),{method:'POST',body:{operationId:OP,values:{}}});assert.equal(h.modal.open,false);await h.resolve(work,response('1',true));assert.equal(h.modal.open,true);assert.equal(h.modal.shows,1);assert.equal(h.records.length,1);assert.equal(h.state.authenticated,true);assert.equal(h.state.results.get(OP).data.error,true);assert.equal(h.calls.length,1);
});
test('a new read dismisses old owned dialog, retires its state, and waits for a fresh response',async()=>{
 const h=harness();h.open(response('2'));const old=h.c.flowResults.get('verification:dialog-state');const work=h.c.runFlow();assert.equal(h.modal.open,false);assert.equal(h.c.flowResults.has('verification:dialog-state'),false);assert.equal(h.c.verificationDialogCurrent(old),false);await h.resolve(work,response('0'));assert.equal(h.modal.shows,2);assert.equal(h.button('verification-dismiss').textContent,'Ok');
});
test('superseded success cannot replace newer response or open a second dialog',async()=>{
 const h=harness(),old=h.c.runFlow(),fresh=h.c.runFlow();await h.resolve(fresh,response('2'),1);const current=h.c.flowResults.get(KEY),element=h.c.flowResults.get('verification:dialog-state').element;await h.resolve(old,response('1'),0);assert.equal(h.c.flowResults.get(KEY),current);assert.equal(h.c.flowResults.get('verification:dialog-state').element,element);assert.equal(h.modal.shows,1);assert.equal(h.button('logout'),null);assert.equal(h.records.length,1);
});
test('superseded auth failure cannot expire current response or session',async()=>{
 const h=harness(),old=h.c.runFlow(),fresh=h.c.runFlow();await h.resolve(fresh,response('0'),1);await h.reject(old,expiry(),0);assert.equal(h.state.authenticated,true);assert.equal(h.c.sessionEpoch,3);assert.equal(h.modal.open,true);assert.equal(h.toasts.length,0);
});
for(const back of [false,true])test(`late read after navigation${back?' away and back':''} cannot open status or chooser`,async()=>{
 const h=harness(),work=h.c.runFlow();h.navigate('account');if(back)h.navigate('verification');await h.resolve(work,response('-1'));assert.equal(h.modal.open,false);assert.equal(h.modal.shows,0);assert.equal(h.c.flowResults.has('verification:dialog-state'),false);assert.equal(h.state.authenticated,true);
});
test('logout epoch and clearPrivate prevent delayed status from returning or opening modal',async()=>{
 const h=harness(),work=h.c.runFlow();h.c.sessionEpoch++;h.c.clearPrivate();h.state.authenticated=false;h.state.user=null;await h.resolve(work);assert.equal(h.c.flowResults.size,0);assert.equal(h.state.results.size,0);assert.equal(h.modal.shows,0);assert.equal(h.records.length,0);
});
test('current ordinary transport/model failures remain visible errors without opening or automatic logout',async()=>{
 for(const mode of ['transport','model']){const h=harness(),work=h.c.runFlow();if(mode==='transport')await h.reject(work,Object.assign(new Error('SYNTHETIC service unavailable'),{code:'UPSTREAM_ERROR'}));else await h.resolve(work,{status:200,data:{message:1}});assert.equal(h.state.authenticated,true);assert.equal(h.modal.open,false);assert.equal(h.state.results.size,0);assert.ok(h.c.flowResults.get(KEY).error);assert.equal(h.records[0][1],'error');}
});
test('current authentication expiry clears private state and closes owned dialog once',async()=>{
 const h=harness();h.open();const work=h.c.runFlow();await h.reject(work,expiry());assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.c.sessionEpoch,4);assert.equal(h.c.flowResults.size,0);assert.equal(h.state.results.size,0);assert.equal(h.modal.open,false);assert.equal(h.toasts.length,1);
});
test('explicit current code1 Logout alone invokes existing local logout adapter and closes private state',async()=>{
 const h=harness();h.open(response('1'));assert.equal(h.calls.length,0);const work=h.click(h.button('logout'));assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/api/logout');assert.deepEqual(plain(h.calls[0].options),{method:'POST',body:{}});assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.modal.open,false);assert.equal(h.c.flowResults.size,0);h.calls[0].resolve({authenticated:false,user:null});await work;assert.equal(h.calls.length,1);assert.match(h.toasts[0],/sudah keluar/);
});
test('detached prior Logout cannot act on a newly owned status dialog',async()=>{
 const h=harness();h.open(response('1'));const old=h.button('logout');h.c.dismissVerificationDialog();h.open(response('0'));assert.equal(old.isConnected,false);await h.click(old);assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);assert.equal(h.modal.open,true);
});
test('detached prior Verifikasi/dismiss controls cannot mutate a newer owned dialog',async()=>{
 const h=harness();h.open(response('2'));const oldMethods=h.button('verification-methods'),oldDismiss=h.button('verification-dismiss');h.c.dismissVerificationDialog();h.open(response('0'));const before=h.modal.innerHTML;await h.click(oldMethods);await h.click(oldDismiss);assert.equal(h.modal.innerHTML,before);assert.equal(h.modal.open,true);assert.equal(h.calls.length,0);
});
test('marked verification Logout outside the current owned element is ignored',async()=>{
 const h=harness();h.open(response('1'));const forged=h.document.body.appendChild(h.document.createElement('button'));forged.setAttribute('data-action','logout');forged.setAttribute('data-verification-logout','true');await h.click(forged);assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);
});
test('method shell stage rejects marked Logout even when a matching control is inside its current element',async()=>{
 const h=harness();h.open(response('-1'));const owner=h.c.flowResults.get('verification:dialog-state'),forged=owner.element.appendChild(h.document.createElement('button'));forged.setAttribute('data-action','logout');forged.setAttribute('data-verification-logout','true');assert.equal(h.c.verificationDialogCurrent(owner,forged),true);await h.click(forged);assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);assert.equal(h.modal.open,true);assert.equal(owner.stage,'methods');
});
test('only rejected status action can enter methods; pending/approved status and completed shell stay unchanged',async()=>{
 for(const code of ['0','1','-1']){const h=harness();h.open(response(code));const owner=h.c.flowResults.get('verification:dialog-state'),forged=owner.element.appendChild(h.document.createElement('button'));forged.setAttribute('data-action','verification-methods');const before=h.modal.innerHTML;await h.click(forged);assert.equal(h.modal.innerHTML,before);assert.equal(h.calls.length,0);}
});
test('current read completion does not replace an unrelated modal opened while response was pending',async()=>{
 const h=harness(),work=h.c.runFlow();h.modal.innerHTML='<section id="new-dialog">SYNTHETIC other UI</section>';h.modal.showModal();await h.resolve(work,response('1'));assert.ok(h.modal.querySelector('#new-dialog'));assert.equal(h.modal.shows,1);assert.equal(h.c.flowResults.has('verification:dialog-state'),false);assert.equal(h.state.authenticated,true);
});
test('suppressed role2 response remains handled after unrelated role refresh; a fresh explicit read is required',()=>{
 const h=harness({user:{userLevel:2}}),reader=h.open(response('1'));h.state.user={userLevel:1};h.c.render();h.c.showVerificationStatusDialog(reader,KEY,h.c.sessionEpoch,h.c.detailSequence);assert.equal(h.modal.shows,0);assert.equal(h.calls.length,0);
});
