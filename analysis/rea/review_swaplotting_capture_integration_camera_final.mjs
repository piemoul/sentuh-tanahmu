// Actual-module offline integration review of root host/resource/removal code.
// Reviewer authored native capture proof and local model/controller/view; this
// is not an independent review of those owned modules or real browser/hardware.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {harness} from '../../webapp/tests/support/account-verification-ui-harness.mjs';
import {createSwaplottingHost} from '../../webapp/assets/swaplotting/host.js';
import {createSwaplottingPhotoCapture} from '../../webapp/assets/swaplotting/capture-dialog.js';
import {createSwaplottingPhotoStore} from '../../webapp/assets/swaplotting/photo-store.js';

const writer='analysis/rea/review_swaplotting_capture_integration_camera_final.mjs';
const suffix=process.argv.find(x=>x.startsWith('--suffix='))?.slice(9)??'camera-final';assert.match(suffix,/^[a-z0-9-]+$/);
const output=`analysis/webapp/swaplotting-capture-host-review-${suffix}.json`,probeOnly=process.argv.includes('--probe-only');
assert.equal(fs.existsSync(output),false,'Never overwrite a frozen review');
const files=[writer,'webapp/app.js','webapp/styles.css',...['host','photo-store','photo-removal','camera','capture-dialog','model','controller','view','map'].map(x=>`webapp/assets/swaplotting/${x}.js`),'webapp/tests/swaplotting-photos.test.mjs','webapp/tests/swaplotting-photo-resources.test.mjs','webapp/tests/swaplotting-camera.test.mjs','webapp/tests/support/account-verification-ui-harness.mjs','analysis/rea/review_swaplotting_frontend_validation.mjs','analysis/recovered/swaplotting-capture-followup/flow.json','analysis/recovered/swaplotting-capture-followup/verification.json','analysis/webapp/swaplotting-capture-runtime-baseline.json','analysis/webapp/swaplotting-photo-browser-initial.json'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),inputs=files.map(file=>({file,sha256:hash(file)}));
const predecessorFile='analysis/webapp/swaplotting-capture-host-review-final.json',cameraReceiptFile='analysis/webapp/swaplotting-capture-camera-verification-final.json';
assert.equal(hash(predecessorFile),'95351d060c3fa36e4420d1b2842b8a8d178387d303209b0f940fe0d8b07aa9f0');
assert.equal(hash(cameraReceiptFile),'4ca1d8b1550dd2a02caa04e59eed365dd51585c1a0f4dfb9393adaf58150d54f');
const predecessor=JSON.parse(fs.readFileSync(predecessorFile)),cameraReceipt=JSON.parse(fs.readFileSync(cameraReceiptFile));
const changedSincePredecessor=predecessor.inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>row.file);assert.deepEqual(changedSincePredecessor,[]);
assert.equal(cameraReceipt.status,'PASS');assert.equal(cameraReceipt.tests.tests,28);assert.equal(cameraReceipt.tests.pass,28);assert.equal(cameraReceipt.tests.fail,0);for(const row of cameraReceipt.inputs)assert.equal(hash(row.file),row.sha256,row.file);
for(const file of [predecessorFile,cameraReceiptFile,'analysis/rea/review_swaplotting_capture_integration.mjs',cameraReceipt.tests.report.file])inputs.push({file,sha256:hash(file)});
const reused=fs.readFileSync('analysis/rea/review_swaplotting_frontend_validation.mjs','utf8');
const support=vm.runInNewContext('('+reused.slice(reused.indexOf('function dom(document){'),reused.indexOf('function setup('))+')');
const tick=()=>new Promise(resolve=>setImmediate(resolve)),origin='https://sentuh.example.test';
const checks=[];
async function check(name,fn){try{const evidence=await fn();checks.push({name,status:'PASS',...evidence});}catch(e){checks.push({name,status:'FAIL',error:e.message});}}
function setup({pendingMedia=false,pendingBlob=false,injectCapture=false}={}){
 const {document}=harness();support(document);document.hidden=false;
 const proto=Object.getPrototypeOf(document.body);
 if(!proto.captureReviewSupport){
  Object.defineProperty(proto,'captureReviewSupport',{value:true});
  const id=Object.getOwnPropertyDescriptor(proto,'id');Object.defineProperty(proto,'id',{get:id.get,set(value){this.setAttribute('id',value);}});
  proto.append=function(...nodes){for(const node of nodes)this.appendChild(node);};
  proto.removeAttribute=function(key){this.attributes.delete(key);};
  proto.removeEventListener=function(type,fn){this.listeners.set(type,(this.listeners.get(type)??[]).filter(item=>item!==fn));};
 }
 const windowListeners=new Map(),url={created:[],revoked:[]},media=[],blobCallbacks=[],reads=[],captures=[];let active=true,serial=0;
 document.removeEventListener=(type,fn)=>document.listeners.set(type,(document.listeners.get(type)??[]).filter(x=>x!==fn));
 const make=document.createElement.bind(document);
 document.createElement=tag=>{
  const node=make(tag);node.dataset=new Proxy({}, {get:(_,key)=>node.getAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))??undefined,set:(_,key,value)=>{node.setAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);return true;}});
  if(tag==='video'){node.videoWidth=16;node.videoHeight=12;node.readyState=2;node.play=async()=>{};node.pause=()=>{};}
  if(tag==='canvas'){node.getContext=()=>({drawImage(video,_x,_y,w,h){assert.ok(video.srcObject);assert.equal(w,16);assert.equal(h,12);}});node.toBlob=(callback,mime)=>{assert.equal(mime,'image/jpeg');if(pendingBlob)blobCallbacks.push(callback);else callback(new Blob(['SYNTHETIC FRAME BYTES'],{type:'image/jpeg'}));};}
  return node;
 };
 document.defaultView={location:{origin},Blob,URL:{createObjectURL(blob){assert.ok(blob instanceof Blob);const value=`blob:${origin}/00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`;url.created.push(value);return value;},revokeObjectURL(value){url.revoked.push(value);}},navigator:{mediaDevices:{getUserMedia(options){assert.deepEqual(options,{audio:false,video:{facingMode:{ideal:'environment'}}});const track={kind:'video',readyState:'live',stopped:0,handlers:new Map(),addEventListener(name,fn){this.handlers.set(name,fn);},removeEventListener(name){this.handlers.delete(name);},stop(){this.stopped++;this.readyState='ended';}};const stream={active:true,getTracks:()=>[track]};let resolve;const promise=new Promise(yes=>resolve=yes);media.push({options,track,stream,resolve});if(!pendingMedia)resolve(stream);return promise;}}},fetch:async()=>{throw Error('Synthetic map config unavailable; no transport');},addEventListener(name,fn){windowListeners.set(name,[...(windowListeners.get(name)??[]),fn]);},removeEventListener(name,fn){windowListeners.set(name,(windowListeners.get(name)??[]).filter(x=>x!==fn));}};
 const main=document.body.appendChild(document.createElement('main'));main.id='main';const q=document.querySelector.bind(document);document.querySelector=selector=>selector.startsWith('#main ')?main.querySelector(selector.slice(6)):q(selector);
 const factory=options=>{captures.push(options);if(injectCapture){let context=null;return{open(value){context={...value};return true;},close(){if(context){options.onClose(context);context=null;}},dispose(){this.close();}};}return createSwaplottingPhotoCapture(options);};
 const host=createSwaplottingHost({document,isCurrent:()=>active,profile:{userLevel:2,isIkd:false,nama:'SYNTHETIC OWNER',nomorHp:'00',email:'synthetic@example.invalid'},photoCaptureFactory:factory,read:async(kind,values)=>{reads.push({kind,values});return kind==='disclaimer'?{}:kind==='offices'?[{KantorId:'A',Nama:'A'}]:[{WilayahId:'r1',Nama:'R1'}];}});
 main.innerHTML=host.html();
 const slot=()=>main.querySelector('[data-swaplotting-host]');
 const fire=async(node,type='click')=>{assert.ok(node,'actual existing target');const listeners=slot()?.listeners.get(type)??[];for(const fn of [...listeners])await fn({target:node,preventDefault(){}});};
 const action=async(name,index)=>fire(slot().querySelector(`[data-action="${name}"]${index===undefined?'':`[data-photo-index="${index}"]`}`));
 const dialogAction=async name=>{const dialog=document.querySelector('[data-swaplotting-capture]');assert.ok(dialog?.open,'camera dialog open');const button=dialog.querySelector(`[data-swaplotting-capture-action="${name}"]`);assert.ok(button&&!button.hidden&&!button.disabled,'active camera action '+name);for(const fn of [...dialog.listeners.get('click')??[]])fn({target:button});await tick();};
 const removal=()=>document.querySelector('#swaplotting-photo-removal-title')?.closest('dialog');
 const removeAction=async name=>{const dialog=removal();assert.ok(dialog?.open);const button=dialog.querySelector(`[data-photo-removal="${name}"]`);for(const fn of [...dialog.listeners.get('click')??[]])fn({target:button});await tick();};
 return{document,main,host,slot,fire,action,dialogAction,removal,removeAction,url,media,blobCallbacks,reads,captures,windowListeners,retire(){active=false;},async ready(){await tick();await action('swaplotting-open-form');await tick();return this;},dispose(){host.dispose();}};
}
async function capture(h){await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');await h.dialogAction('use');return h.host.controller.snapshot().photos.at(-1);}

await check('host construction/map/read attach is camera-lazy; first explicit Add creates exactly one capture manager',async()=>{
 const h=setup();await h.ready();assert.equal(h.captures.length,0);assert.equal(h.media.length,0);assert.equal(h.document.querySelector('[data-swaplotting-capture]'),null);await h.action('swaplotting-photo-add');await tick();assert.equal(h.captures.length,1);assert.equal(h.media.length,1);h.dispose();assert.equal(h.media[0].track.stopped,1);return{deviceActions:'synthetic media fixture only'};
});
await check('actual synchronous generation increment transfers URL to store without revocation; dispose releases it once',async()=>{
 const h=await setup().ready(),generation=h.host.controller.snapshot().photoGeneration,path=await capture(h);assert.ok(h.host.controller.snapshot().photoGeneration>generation);assert.deepEqual(h.url.revoked,[]);assert.equal(h.media[0].track.stopped,1);assert.equal(h.document.querySelector('[data-swaplotting-capture]').open,false);assert.equal(h.slot().querySelector('img').getAttribute('src'),path);h.dispose();h.dispose();assert.deepEqual(h.url.revoked,[path]);
});
await check('actual retake and remove confirmation own old String paths and release replaced/removed resources once',async()=>{
 const h=await setup().ready(),one=await capture(h);await h.action('swaplotting-photo-retake',0);await tick();await h.dialogAction('take');await h.dialogAction('use');const two=h.host.controller.snapshot().photos[0];assert.notEqual(one,two);assert.deepEqual(h.url.revoked,[one]);await h.action('swaplotting-photo-remove',0);assert.deepEqual(h.host.controller.snapshot().photos,[two]);await h.removeAction('cancel');assert.deepEqual(h.host.controller.snapshot().photos,[two]);await h.action('swaplotting-photo-remove',0);await h.removeAction('remove');assert.deepEqual(h.host.controller.snapshot().photos,[]);assert.deepEqual(h.url.revoked,[one,two]);h.dispose();assert.deepEqual(h.url.revoked,[one,two]);
});
await check('selected-context change cancels pending preview and releases only that URL, preserving committed photo',async()=>{
 const h=await setup().ready(),one=await capture(h);await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');const pending=h.url.created.at(-1);h.host.controller.selectRight('1');assert.deepEqual(h.host.controller.snapshot().photos,[one]);assert.equal(h.document.querySelector('[data-swaplotting-capture]').open,false);assert.deepEqual(h.url.revoked,[pending]);h.dispose();assert.deepEqual(h.url.revoked,[pending,one]);
});
await check('close/reopen owns late getUserMedia: old stream is stopped without overwriting newer video',async()=>{
 const h=await setup({pendingMedia:true}).ready();await h.action('swaplotting-photo-add');await h.dialogAction('cancel');await h.action('swaplotting-photo-add');h.media[1].resolve(h.media[1].stream);await tick();const video=h.document.querySelector('[data-swaplotting-capture-video]');assert.equal(video.srcObject,h.media[1].stream);h.media[0].resolve(h.media[0].stream);await tick();assert.equal(h.media[0].track.stopped,1);assert.equal(h.media[1].track.stopped,0);assert.equal(video.srcObject,h.media[1].stream);h.dispose();assert.equal(h.media[1].track.stopped,1);assert.deepEqual(h.url.created,[]);
});
await check('late canvas callback after close/reopen cannot populate new preview or create a stale object URL',async()=>{
 const h=await setup({pendingBlob:true}).ready();await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');assert.equal(h.blobCallbacks.length,1);await h.dialogAction('cancel');await h.action('swaplotting-photo-add');await tick();h.blobCallbacks[0](new Blob(['OLD SYNTHETIC FRAME'],{type:'image/jpeg'}));await tick();assert.deepEqual(h.url.created,[]);assert.equal(h.host.controller.snapshot().photos,null);assert.equal(h.document.querySelector('[data-swaplotting-capture]').open,true);h.dispose();
});
await check('current slot replacement closes pending capture; detached old buttons cannot start camera again',async()=>{
 const h=await setup().ready();await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');const oldSlot=h.slot(),oldAdd=oldSlot.querySelector('[data-action="swaplotting-photo-add"]'),oldListeners=[...(oldSlot.listeners.get('click')??[])],preview=h.url.created[0];h.main.innerHTML=h.host.html();await tick();assert.equal(h.document.querySelector('[data-swaplotting-capture]').open,false);assert.deepEqual(h.url.revoked,[preview]);const count=h.media.length;for(const fn of oldListeners)await fn({target:oldAdd});assert.equal(h.media.length,count);assert.equal(h.host.controller.snapshot().photos,null);h.dispose();
});
await check('form changes and disposal release committed list and pending preview; stale use cannot restore them',async()=>{
 for(const mode of ['map','form','dispose']){
  const h=await setup().ready(),one=await capture(h);await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');const pending=h.url.created.at(-1),dialog=h.document.querySelector('[data-swaplotting-capture]'),use=dialog.querySelector('[data-swaplotting-capture-action="use"]'),listeners=[...dialog.listeners.get('click')??[]];
  if(mode==='map')h.host.controller.backToMap();else if(mode==='form')await h.host.controller.openForm('unregistered');else h.dispose();for(const fn of listeners)fn({target:use});await tick();assert.equal(h.host.controller.snapshot().photos,null);assert.deepEqual(new Set(h.url.revoked),new Set([one,pending]));assert.equal(h.url.revoked.length,2);h.dispose();
 }
});
await check('session retirement blocks commit and disposal retires stream; no replacement application action is sent',async()=>{
 const h=await setup().ready();await h.action('swaplotting-photo-add');await tick();await h.dialogAction('take');const preview=h.url.created[0];h.retire();const dialog=h.document.querySelector('[data-swaplotting-capture]'),use=dialog.querySelector('[data-swaplotting-capture-action="use"]');for(const fn of dialog.listeners.get('click')??[])fn({target:use});assert.equal(h.host.controller.snapshot().photos,null);h.dispose();assert.deepEqual(h.url.revoked,[preview]);assert.deepEqual(h.reads.map(row=>row.kind),['disclaimer','offices']);
});
await check('removal confirmation is canceled by context change; detached confirmation cannot remove retained photo',async()=>{
 const h=await setup().ready(),one=await capture(h);await h.action('swaplotting-photo-remove',0);const dialog=h.removal(),button=dialog.querySelector('[data-photo-removal="remove"]'),listeners=[...dialog.listeners.get('click')??[]];h.host.controller.selectRight('1');assert.equal(dialog.isConnected,false);for(const fn of listeners)fn({target:button});assert.deepEqual(h.host.controller.snapshot().photos,[one]);assert.deepEqual(h.url.revoked,[]);h.dispose();
});
await check('host strictly resolves current numerical indices to owned paths; malformed/foreign/unowned targets are inert',async()=>{
 const h=await setup().ready(),one=await capture(h),button=h.slot().querySelector('[data-action="swaplotting-photo-retake"]');
 for(const value of ['-1','01','0.0','+0','1e0','9007199254740992','1','blob:any']){button.setAttribute('data-photo-index',value);await h.fire(button);assert.equal(h.media.length,1,value);}
 const external=h.document.body.appendChild(h.document.createElement('button'));external.dataset.action='swaplotting-photo-remove';external.dataset.photoIndex='0';await h.fire(external);assert.ok(h.removal()==null);assert.deepEqual(h.host.controller.snapshot().photos,[one]);h.dispose();
});
await check('same-screen actions retain input/select identity/caret; capture restores retained input focus and validation feedback',async()=>{
 const h=await setup().ready(),input=h.slot().querySelector('#swaplotting-number'),select=h.slot().querySelector('#swaplotting-right');input.value=' RAW <&> DRAFT ';input.focus();input.selectionStart=2;input.selectionEnd=7;await h.fire(input,'input');await h.fire(h.slot().querySelector('#swaplotting-form'),'submit');assert.equal(h.slot().querySelector('#swaplotting-error-photos').textContent,'Isian ini wajib diisi.');await capture(h);assert.equal(h.slot().querySelector('#swaplotting-error-photos').textContent,'');assert.equal(h.slot().querySelector('#swaplotting-number'),input);assert.equal(h.slot().querySelector('#swaplotting-right'),select);assert.equal(h.document.activeElement,input);assert.equal(input.value,' RAW <&> DRAFT ');assert.equal(input.selectionStart,2);assert.equal(input.selectionEnd,7);await h.action('swaplotting-photo-remove',0);await h.removeAction('remove');assert.equal(h.slot().querySelector('#swaplotting-error-photos').textContent,'Isian ini wajib diisi.');assert.equal(h.slot().querySelector('#swaplotting-number'),input);assert.equal(input.selectionStart,2);h.dispose();
});
await check('replaced Add/Retake targets return focus to current retained photo action; successful removal returns to current Add',async()=>{
 const h=await setup().ready();const add=h.slot().querySelector('#swaplotting-photos');add.focus();await capture(h);let retake=h.slot().querySelector('[data-action="swaplotting-photo-retake"]');assert.equal(add.isConnected,false);assert.equal(h.document.activeElement,retake);assert.equal(retake.isConnected,true);
 retake.focus();await h.action('swaplotting-photo-retake',0);await tick();await h.dialogAction('take');await h.dialogAction('use');assert.equal(retake.isConnected,false);retake=h.slot().querySelector('[data-action="swaplotting-photo-retake"]');assert.equal(h.document.activeElement,retake);
 const remove=h.slot().querySelector('[data-action="swaplotting-photo-remove"]');remove.focus();await h.action('swaplotting-photo-remove',0);await h.removeAction('remove');assert.equal(remove.isConnected,false);assert.equal(h.document.activeElement,h.slot().querySelector('#swaplotting-photos'));assert.equal(h.document.activeElement.disabled,false);assert.deepEqual(h.host.controller.snapshot().photos,[]);h.dispose();
});
await check('resource store releases all retained blobs even when a URL revoker throws',()=>{
 const revoked=[],store=createSwaplottingPhotoStore({revoke:value=>{revoked.push(value);throw Error('SYNTHETIC cleanup');}});for(const url of ['blob:one','blob:two'])assert.equal(store.add({url,blob:new Blob(['SYNTHETIC'],{type:'image/png'})}),true);store.dispose();store.dispose();assert.deepEqual(revoked,['blob:one','blob:two']);assert.equal(store.size(),0);
});
await check('actual app source guards owning route/session/navigation and disposes host before private clear/navigation',()=>{
 const source=fs.readFileSync('webapp/app.js','utf8');const line=name=>source.split(/\r?\n/).find(row=>row.startsWith('function '+name+'('));for(const name of ['clearPrivate','navigate'])assert.match(line(name),/flowResults\.get\('swaplotting:personal'\)\?\.dispose\?\.\(\);flowResults\.delete\('swaplotting:personal'\)/);assert.match(line('swaplottingCurrent'),/route==='swaplotting'.*state\.authenticated===true.*owner\.epoch===sessionEpoch.*owner\.navigation===detailSequence/);const local=files.filter(file=>/^webapp\/assets\/swaplotting\/(?:camera|capture-dialog|photo-store|photo-removal)\.js$/.test(file)).map(file=>fs.readFileSync(file,'utf8')).join('\n');assert.doesNotMatch(local,/\b(?:fetch|XMLHttpRequest|WebSocket|FormData|sendBeacon|localStorage|sessionStorage|indexedDB|getCurrentPosition|watchPosition)\b|type="file"/);assert.match(local,/getUserMedia\(\{audio:false,video:\{facingMode:\{ideal:'environment'\}\}\}\)/);
});

const changedInputs=inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>row.file);assert.deepEqual(changedInputs,[],'Source changed during review; successor required');
const failed=checks.filter(row=>row.status!=='PASS');
const report={schemaVersion:1,status:failed.length?'FAIL':'PASS',checkedAt:new Date().toISOString(),reviewerScope:'Independent review of root host/photo-store/photo-removal integration with actual camera/dialog modules. Reviewer authored native capture proof and local model/controller/view, including root-authorized photo label-to-group correction; not an independent review of own code.',inputs,changedInputs,checks,results:{tests:checks.length,passed:checks.length-failed.length,failed:failed.length},materialFindings:[{status:'resolved',finding:'Photo thumbnails originally nested in label[for=swaplotting-photos] could trigger default Add activation.',resolution:'Root-authorized view correction uses div role=group aria-labelledby; explicit regression added. Fake DOM does not simulate browser default activation.'},{status:'resolved',finding:'Successful Use replaced the original Add/Retake return-focus node; root browser initial attempt recorded BODY focus (3 checks passed, 1 failed).',resolution:'Root host stores current committed-path/generation focus target and uses current retained Retake or Add; removalCommitting prevents premature close during synchronous repaint. New actual-module focus probe exercises all three paths.',historicalEvidence:'analysis/webapp/swaplotting-photo-browser-initial.json'}],limits:['Offline actual-module probes with synthetic DOM/media/Blob callbacks; no browser, real camera, image-content fidelity or production request exercised.','Synthetic media bytes are deliberate fixtures, not document-photo evidence.','Main map config uses rejecting synthetic fetch stub only; no tiles/provider transport.','Runtime SDK MIME/JPEG/EXIF/identity/freshness/presence or server acceptance remain unproven.'],networkRequests:0,productionRequests:0,realCameraActions:0,gpsActions:0,uploads:0};
report.predecessor={file:predecessorFile,sha256:hash(predecessorFile),preserved:true,sourceDelta:changedSincePredecessor,note:'Predecessor already pinned final capture-dialog and28-test source; successor adds final camera author receipt binding and repeats15 integration probes.'};
report.cameraAuthorEvidence={file:cameraReceiptFile,sha256:hash(cameraReceiptFile),tests:28,scope:'Synthetic offline author unit tests, no real camera/browser/network.'};
if(!probeOnly)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify(report.results)+'\n');for(const row of failed)process.stdout.write(row.name+': '+row.error+'\n');if(failed.length)process.exitCode=1;
