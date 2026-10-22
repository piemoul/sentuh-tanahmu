// Native initial instruction screens only. All UI state and account reads are
// synthetic; the only HTTP test serves fixed public assets on an ephemeral loopback server.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from '../server.mjs';
import {harness,response} from './support/account-verification-ui-harness.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=relative=>fs.readFileSync(path.join(root,relative));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const LEDGER_HASH='86a32299f9b50a0b6393009ee2599ba00dfd829f44db9a18ee7a389b94743977';
const PROOF='webapp/tests/fixtures/verification-methods-native-proof.json';
const PROOF_HASH='86471c7a4684c14af0e4106dbd234deb1a55ff3854167ac584ca0c729f1e3ba0';
const proof=JSON.parse(read(PROOF)),native=proof.methods;
const names=['Daring','Luring','IKD'];
const images=['verification-ktp.png','verification-aps.png','verification-ikd.webp'];
const owner=h=>h.c.flowResults.get('verification:dialog-state');
const choices=h=>h.modal.querySelectorAll('[data-action="verification-method-choice"]');
const choice=(h,index)=>h.modal.querySelector(`[data-action="verification-method-choice"][data-index="${index}"]`);
const open=()=>{const h=harness();h.open(response('-1'));return h;};
const panel=(h,index)=>{const element=h.document.createElement('section');element.innerHTML=h.c.verificationMethodView(index);return element;};

test('instruction assertions bind the exact frozen native ledger and verified packaged image records',()=>{
 assert.equal(sha(read(PROOF)),PROOF_HASH);assert.equal(proof.nativeEvidence.sha256,LEDGER_HASH);assert.equal(proof.nativeEvidence.artifactSha256,'bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683');assert.equal(proof.nativeEvidence.poolSha256,'871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04');assert.equal(proof.runtimeObserved,false);assert.equal(proof.productionRequests,0);assert.equal(proof.applicationChanged,false);assert.equal(proof.credentialsReadOrExported,false);assert.equal(proof.chooserDefaultSelectionProven,false);assert.equal(proof.methods.length,3);assert.deepEqual(proof.methods.map(method=>method.name),names);
});
for(let index=0;index<3;index++)test(`${names[index]} initial copy/order is exactly the frozen native public instructions`,()=>{
 const h=harness(),element=panel(h,index),expected=native[index].instructions??native[index].text;
 assert.equal(element.querySelector('h3').textContent,`Verifikasi ${names[index]}`);
 const instructionNodes=index===1?element.querySelectorAll('[role="listitem"]'):element.querySelectorAll('p').slice(0,-1);
 assert.deepEqual(instructionNodes.map(node=>node.textContent),expected);
 assert.equal(element.querySelector('img').getAttribute('src'),`assets/profile/${images[index]}`);
 assert.equal(element.querySelector('article').getAttribute('aria-label'),`Verifikasi ${names[index]}`);
 assert.equal(h.calls.length,0);
});
test('Luring keeps all seven original steps verbatim, including physical APS attendance and original punctuation',()=>{
 const h=harness(),element=panel(h,1),steps=element.querySelectorAll('[role="listitem"]');assert.equal(steps.length,7);assert.equal(steps[0].textContent,'1. Datang ke Anjungan Pencetakan Sertipikat terdekat.');assert.equal(steps[4].textContent,'5. Periksa kembali data kamu');assert.equal(steps[5].textContent,'6. Ketuk tombol Verifikasi Akun');assert.equal(steps[6].textContent,'7. Tunggu proses selesai, lalu akun Kamu berhasil diverifikasi.');assert.equal(element.querySelector('[role="list"]').getAttribute('aria-label'),'Langkah verifikasi luring');
});
for(let index=0;index<3;index++)test(`${names[index]} illustration preserves original bytes, dimensions, format and matching browser extension`,()=>{
 const asset=proof.methods[index].asset,bytes=read(`webapp/assets/profile/${images[index]}`);
 // This public proof was exported from the independently pinned native ledger,
 // with byte-equal original/public comparisons performed by the audit exporter.
 assert.equal(bytes.length,asset.bytes);assert.equal(sha(bytes),asset.sha256);assert.equal(asset.file,`webapp/assets/profile/${images[index]}`);assert.equal(asset.packagedName,['KTP.png','aps.png','ikd.png'][index]);
 if(index<2){assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));assert.equal(bytes.toString('ascii',12,16),'IHDR');assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height);assert.equal(path.extname(asset.file),'.png');assert.equal(asset.contentType,'image/png');}
 else{assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(bytes.toString('ascii',12,16),'VP8L');assert.equal(bytes[20],0x2f);const bits=bytes.readUInt32LE(21);assert.equal((bits&0x3fff)+1,asset.width);assert.equal(((bits>>>14)&0x3fff)+1,asset.height);assert.equal(path.extname(asset.packagedName),'.png');assert.equal(path.extname(asset.file),'.webp');assert.equal(asset.contentType,'image/webp');}
});
test('actual static server serves the exact three images with header-correct MIME and no business transport',async t=>{
 const calls=[],rejectTransport=(url)=>{calls.push(String(url));throw Error('Business transport forbidden in public asset test');};
 const configuration={configured:false,origin:'https://sentuh.atrbpn.go.id/',reason:'synthetic static assets only'};
 const server=createServer({configuration,transport:rejectTransport,queueTransport:rejectTransport,bhumiTransport:rejectTransport,log:()=>{}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(let index=0;index<3;index++){const asset=`/assets/profile/${images[index]}`,result=await fetch(base+asset);assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),index===2?'image/webp':'image/png');assert.equal(Number(result.headers.get('content-length')),proof.methods[index].asset.bytes);assert.equal(result.headers.get('x-content-type-options'),'nosniff');assert.equal(sha(Buffer.from(await result.arrayBuffer())),proof.methods[index].asset.sha256);const head=await fetch(base+asset,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-type'),result.headers.get('content-type'));assert.equal((await head.arrayBuffer()).byteLength,0);}
 assert.deepEqual(calls,[]);
});
test('pure unselected view never guesses native cached default and has three local choices plus close',()=>{
 const h=harness();for(const selected of [undefined,null,-1,3,0.5,'0',NaN]){const element=h.document.createElement('section');element.innerHTML=h.c.verificationMethodsView(selected);const buttons=element.querySelectorAll('[data-action="verification-method-choice"]');assert.deepEqual(buttons.map(node=>node.textContent),names);assert.deepEqual(buttons.map(node=>node.getAttribute('data-index')),['0','1','2']);assert.ok(buttons.every(node=>node.getAttribute('aria-pressed')==='false'));assert.match(element.textContent,/Pilih metode verifikasi untuk melihat petunjuknya/);assert.equal(element.querySelector('img'),null);assert.equal(element.querySelector('.verification-method-panel'),null);assert.equal(element.querySelectorAll('button').length,4);}
});
test('method helper rejects malformed/out-of-range indices without showing an image or actionable start',()=>{
 const h=harness();for(const index of [undefined,null,-1,3,1.5,'0',true,NaN,Infinity,{},[]]){const element=panel(h,index);assert.match(element.textContent,/Pilih metode verifikasi/);assert.equal(element.querySelector('article'),null);assert.equal(element.querySelector('img'),null);assert.equal(element.querySelector('button'),null);}assert.equal(h.calls.length,0);
});
for(const code of ['-1','3','2'])test(`entry through status${code} starts unselected, focuses Close and makes no extra request`,async()=>{
 const h=harness();h.open(response(code));if(code==='2')await h.click(h.button('verification-methods'));assert.equal(owner(h).stage,'methods');assert.equal(owner(h).method,null);assert.ok(choices(h).every(button=>button.getAttribute('aria-pressed')==='false'));assert.equal(h.document.activeElement,h.button('verification-dismiss'));assert.equal(h.modal.querySelector('img'),null);assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);
});
test('actual delegated choices select all three methods locally, repaint one pressed state and focus replacement control',async()=>{
 const h=open();for(const index of [2,0,1]){const button=choice(h,index),oldElement=owner(h).element;await h.click(button);assert.equal(owner(h).method,index);assert.equal(oldElement.isConnected,false);assert.equal(button.isConnected,false);assert.equal(h.document.activeElement,choice(h,index));assert.deepEqual(choices(h).map(node=>node.getAttribute('aria-pressed')),names.map((_,j)=>String(j===index)));assert.equal(h.modal.querySelector('img').getAttribute('src'),`assets/profile/${images[index]}`);assert.equal(h.c.verificationDialogCurrent(),true);assert.equal(h.modal.shows,1);assert.equal(h.calls.length,0);}
});
test('repeated selected choice is a no-op preserving subtree/focus without reinitializing native state',async()=>{
 const h=open();await h.click(choice(h,1));const element=owner(h).element,button=choice(h,1),image=h.modal.querySelector('img');await h.click(button);assert.equal(owner(h).element,element);assert.equal(h.modal.querySelector('img'),image);assert.equal(h.document.activeElement,button);assert.equal(h.calls.length,0);
});
test('a stale choice detached by previous selection cannot change the newly selected method',async()=>{
 const h=open(),old=choice(h,2);await h.click(choice(h,0));const element=owner(h).element;await h.click(old);assert.equal(owner(h).method,0);assert.equal(owner(h).element,element);assert.equal(h.calls.length,0);
});
test('invalid direct indices are rejected before altering current choice/focus/subtree',()=>{
 const h=open(),button=choice(h,0),element=owner(h).element,focus=h.document.activeElement;for(const index of [undefined,null,'0',true,-1,3,1.5,NaN,Infinity])h.c.verificationMethodChoice(index,button);assert.equal(owner(h).method,null);assert.equal(owner(h).element,element);assert.equal(h.document.activeElement,focus);assert.equal(h.calls.length,0);
});
test('invalid delegated choice payloads cannot select or construct a method child',async()=>{
 const h=open(),button=choice(h,0),element=owner(h).element;for(const index of ['unknown','-1','3','1.5','Infinity']){button.setAttribute('data-index',index);await h.click(button);}assert.equal(owner(h).method,null);assert.equal(owner(h).element,element);assert.equal(h.modal.querySelector('img'),null);assert.equal(h.calls.length,0);
});
test('matching choice control outside the owned dialog cannot mutate local selection',async()=>{
 const h=open(),button=h.document.body.appendChild(h.document.createElement('button'));button.setAttribute('data-action','verification-method-choice');button.setAttribute('data-index','1');const element=owner(h).element;await h.click(button);assert.equal(owner(h).method,null);assert.equal(owner(h).element,element);assert.equal(h.calls.length,0);
});
for(const mismatch of ['route','epoch','navigation','reader','response','loading','element','closed','anonymous','stage'])test(`${mismatch} mismatch rejects selection and stale paint without replacing newer UI`,async()=>{
 const h=open(),current=owner(h),button=choice(h,1);if(mismatch==='route')h.c.route='account';if(mismatch==='epoch')h.c.sessionEpoch++;if(mismatch==='navigation')h.c.detailSequence++;if(mismatch==='reader')h.c.flowResults.set(current.key,{response:current.response});if(mismatch==='response')current.reader.response=response('-1');if(mismatch==='loading')current.reader.loading=true;if(mismatch==='element')h.modal.innerHTML='<section data-verification-dialog>SYNTHETIC different content</section>';if(mismatch==='closed')h.modal.close();if(mismatch==='anonymous')h.state.authenticated=false;if(mismatch==='stage')current.stage='status';const before=h.modal.innerHTML;
 await h.click(button);h.c.verificationMethodsPaint(current);assert.equal(current.method,null);assert.equal(h.modal.innerHTML,before);assert.equal(h.calls.length,0);
});
test('prior dialog owner cannot repaint a replacement response even in the same route/session',()=>{
 const h=open(),previous=owner(h);h.c.dismissVerificationDialog();h.open(response('-1'));const current=owner(h),element=current.element;previous.method=1;h.c.verificationMethodsPaint(previous);assert.equal(owner(h),current);assert.equal(current.element,element);assert.equal(current.method,null);assert.equal(h.modal.querySelector('img'),null);
});
test('repeated showMethods calls preserve chosen local method instead of resetting to a guessed cached value',async()=>{
 const h=open();await h.click(choice(h,2));const current=owner(h),element=current.element;h.c.showVerificationMethods(current);assert.equal(current.method,2);assert.equal(current.element,element);assert.equal(h.modal.shows,1);assert.equal(h.calls.length,0);
});
test('closing then explicitly reopening chooser resets browser selection to null rather than claiming native cache parity',async()=>{
 const h=open();await h.click(choice(h,1));await h.click(h.button('verification-dismiss'));h.open(response('3'));assert.equal(owner(h).method,null);assert.equal(h.modal.querySelector('img'),null);assert.equal(h.document.activeElement,h.button('verification-dismiss'));assert.equal(h.modal.shows,2);assert.equal(h.calls.length,0);
});
test('navigation away/back and private clearing retire selected method controls and cannot revive old subtree',async()=>{
 for(const lifecycle of ['navigation','private']){const h=open();await h.click(choice(h,1));const old=owner(h),button=choice(h,2);if(lifecycle==='navigation'){h.navigate('account');h.navigate('verification');}else h.c.clearPrivate();const retiredMarkup=h.modal.innerHTML;await h.click(button);h.c.verificationMethodsPaint(old);assert.equal(h.modal.open,false);assert.equal(h.modal.innerHTML,retiredMarkup);if(lifecycle==='private')assert.equal(retiredMarkup,'');assert.equal(h.modal.shows,1);assert.equal(h.calls.length,0);assert.equal(h.c.verificationDialogCurrent(old),false);}
});
test('Escape retires selected method controls; generic rerender never reopens this handled response',async()=>{
 const h=open(),reader=owner(h).reader;await h.click(choice(h,0));const old=owner(h),button=choice(h,2);h.escape();await h.click(button);h.c.render();h.c.showVerificationStatusDialog(reader,old.key,h.c.sessionEpoch,h.c.detailSequence);assert.equal(h.modal.open,false);assert.equal(h.modal.shows,1);assert.equal(h.calls.length,0);
});
for(let index=0;index<3;index++)test(`${names[index]} continuation remains disabled and has no start action, identity form, camera/OTP or provider call`,async()=>{
 const h=open();await h.click(choice(h,index));const article=h.modal.querySelector('article'),start=article.querySelector('button');assert.equal(start.textContent,'Mulai Verifikasi');assert.equal(start.disabled,true);assert.equal(start.getAttribute('data-action'),null);assert.equal(start.getAttribute('type'),'button');assert.equal(start.getAttribute('aria-describedby'),'verification-method-unavailable');assert.equal(article.querySelector('#verification-method-unavailable').textContent,'Lanjutkan proses verifikasi identitas melalui aplikasi Android Sentuh Tanahku.');for(const tag of ['form','input','select','textarea','video','iframe','a','script'])assert.equal(article.querySelector(tag),null);await h.click(start);assert.equal(h.calls.length,0);assert.equal(h.state.authenticated,true);assert.equal(owner(h).stage,'methods');
});
test('public instruction screens never interpolate cached identity/status or portray current account as verified',async()=>{
 const h=open();h.state.user={username:'<script>SYNTHETIC-PRIVATE-IDENTITY</script>',nomorIndukKependudukan:'SYNTHETIC-PRIVATE-NIK',userLevel:1};for(let index=0;index<3;index++){await h.click(choice(h,index));assert.doesNotMatch(h.modal.innerHTML,/SYNTHETIC-PRIVATE|<script>|data-action="logout"|data-action="execute"/);assert.equal(h.state.authenticated,true);}assert.equal(h.calls.length,0);
});
