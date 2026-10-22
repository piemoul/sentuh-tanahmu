import test from 'node:test';import assert from 'node:assert/strict';
import {createGuestbook} from '../assets/guestbook/controller.js';
import {GUESTBOOK_FIELDS,GUESTBOOK_WRITE_COPY,guestbookWriteValues,guestbookWriteResult,guestbookInputMode} from '../assets/guestbook/model.js';
import {guestbookView,guestbookForm,guestbookFeedback} from '../assets/guestbook/view.js';
const QR='https://persuratan.atrbpn.go.id/visitor?id=SYNTHETIC-ID&kd=SYNTHETIC-UNIT',UNIT={error:false,data:{userId:'SYNTHETIC-PRIVATE-USER',kantorId:'SYNTHETIC-PRIVATE-OFFICE',unitKerjaId:'SYNTHETIC-PRIVATE-UNIT',namaUnitKerja:'KANTOR SINTETIS'}};
const draft=()=>({name:' RAW NAMA SINTETIS ',nik:'RAW-NIK-AT-LEAST-16',phone:' + phone/raw ',birthDate:' RAW DOB 12/03/2000 ',birthPlace:' RAW PLACE ',address:' RAW ADDRESS ',email:' @ ',institution:' RAW INSTITUTION ',purpose:' RAW PURPOSE\n日本語\nline '});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function fixture({write,read=async()=>UNIT,available=true,onResult,onBack}={}){
 let current=true,ready=available;const writes=[],reads=[],changes=[],results=[],backs=[],auth=[];
 const controller=createGuestbook({read:async values=>{reads.push(values);return read(values);},write:write??(values=>{const hold=deferred();writes.push({values,...hold});return hold.promise;}),writeAvailable:()=>ready,user:{nomorIndukKependudukan:'PREFILL-SYNTHETIC-NIK',email:'prefill@example.invalid'},changed:state=>changes.push(state),isCurrent:()=>current,onResult:result=>{results.push(result);onResult?.(result);},onBack:()=>{backs.push('back');onBack?.();},onSessionError:error=>auth.push(error)});
 return{controller,writes,reads,changes,results,backs,auth,retire:()=>current=false,availability:value=>ready=value,async open(){controller.setRaw(QR);assert.equal(await controller.open(),true);return this;},fill(values=draft()){for(const field of GUESTBOOK_FIELDS)assert.equal(controller.setField(field.id,values[field.id]),true);return this;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('optional read-only construction retains original snapshot and has no writer methods or automatic request',()=>{
 let calls=0;const c=createGuestbook({read:()=>{calls++;return UNIT;}});assert.equal(calls,0);assert.equal(c.submit,undefined);assert.equal(c.back,undefined);assert.deepEqual(Object.keys(c.snapshot()),['raw','stage','pending','error','unit','values','validation']);
});

test('public writer value preparation sends exactly nine raw Strings, no identifiers/trim/date conversion',()=>{
 const raw=draft(),copy=guestbookWriteValues(raw);assert.deepEqual(copy,raw);assert.notEqual(copy,raw);assert.equal(copy.birthDate,' RAW DOB 12/03/2000 ');assert.equal(copy.email,' @ ');
 const spaces=Object.fromEntries(GUESTBOOK_FIELDS.map(field=>[field.id,' ']));spaces.nik='😀'.repeat(8);spaces.email='@';assert.deepEqual(guestbookWriteValues(spaces),spaces);
 for(const value of [{...raw,userId:'forged'},{...raw,kantorId:'forged'},{...raw,unitKerjaId:'forged'},{...raw,contextId:'forged'},{...raw,name:null},{...raw,phone:123},{...raw,nik:'short'},{...raw,email:'no-at'},Object.assign(Object.create({}),raw)])assert.throws(()=>guestbookWriteValues(value));
 let reads=0;const getter=draft();Object.defineProperty(getter,'birthDate',{get(){reads++;return 'never';}});assert.throws(()=>guestbookWriteValues(getter));assert.equal(reads,0);
});

test('strict writer response cannot invert bool or coerce unknown delivery into success',()=>{
 for(const error of [false,true])assert.deepEqual(guestbookWriteResult({error,delivery:'received'}),{error,delivery:'received'});
 for(const value of [false,true,null,0,'false',{},[],{error:false},{error:'false',delivery:'received'},{error:false,delivery:'unknown'},{error:false,delivery:'received',message:'ignored?'}])assert.throws(()=>guestbookWriteResult(value));
 let reads=0;const value={error:false,delivery:'received'};Object.defineProperty(value,'error',{get(){reads++;return false;}});assert.throws(()=>guestbookWriteResult(value));assert.equal(reads,0);
});

test('native keyboard hints keep DOB as raw text and purpose as sole10-line field without guessed formatting',async()=>{
 const h=await fixture().open();h.fill();const html=guestbookForm(h.controller.snapshot());
 assert.equal(guestbookInputMode('birthDate'),'numeric');assert.equal(guestbookInputMode('nik'),'numeric');assert.equal(guestbookInputMode('phone'),'tel');assert.equal(guestbookInputMode('email'),'email');
 assert.match(html,/<input[^>]*id="guestbook-birthDate"[^>]*inputmode="numeric"[^>]*type="text"[^>]*value=" RAW DOB 12\/03\/2000 "/);assert.match(html,/<textarea[^>]*id="guestbook-purpose"[^>]*rows="10"> RAW PURPOSE\n日本語\nline <\/textarea>/);
 assert.equal((html.match(/<input /g)??[]).length,8);assert.equal((html.match(/<textarea /g)??[]).length,1);assert.doesNotMatch(html,/type="date"|maxlength|pattern=|type="email"|type="number"/);
});

test('writer construction, field changes and local validation never automatically submit or reread',async()=>{
 const h=fixture();assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);await h.open();h.fill();assert.equal(h.controller.validate(),true);await tick();assert.equal(h.reads.length,1);assert.equal(h.writes.length,0);assert.equal(h.results.length,0);assert.equal(h.controller.snapshot().canSubmit,true);
});

test('invalid Simpan publishes busy before aggregate, then exact native errors without a POST',async()=>{
 const h=await fixture().open(),before=h.changes.length;assert.equal(h.controller.snapshot().canSubmit,true,'Native press validates rather than pre-disabling invalid form');assert.equal(await h.controller.submit(),false);assert.equal(h.writes.length,0);
 const changed=h.changes.slice(before);assert.equal(changed[0].pending,true);assert.equal(changed[0].writePending,true);assert.equal(changed.at(-1).pending,false);assert.equal(changed.at(-1).validation.errors.name,'Nama tidak boleh kosong');assert.equal(h.controller.snapshot().stage,'form');assert.equal(h.results.length,0);
});

test('dynamic unavailable writer disables Simpan without discarding raw draft or starting a read',async()=>{
 const h=await fixture({available:false}).open();h.fill();assert.equal(h.controller.snapshot().canSubmit,false);assert.equal(await h.controller.submit(),false);assert.equal(h.writes.length,0);assert.deepEqual(h.controller.snapshot().values,draft());h.availability(true);assert.equal(h.controller.snapshot().canSubmit,true);
});

test('one explicit submit injects exactly nine raw fields and freezes edits, QR and duplicate save while pending',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit(),s=h.controller.snapshot();assert.equal(h.writes.length,1);assert.deepEqual(h.writes[0].values,draft());assert.deepEqual(Object.keys(h.writes[0].values),GUESTBOOK_FIELDS.map(field=>field.id));assert.equal(s.pending,true);assert.equal(s.writePending,true);assert.equal(s.canSubmit,false);
 assert.equal(h.controller.setRaw('changed'),false);assert.equal(h.controller.setField('purpose','changed'),false);assert.equal(h.controller.validate(),false);assert.equal(await h.controller.open(),false);assert.equal(await h.controller.submit(),false);assert.equal(h.reads.length,1);assert.equal(h.writes.length,1);
 h.writes[0].resolve({error:true,delivery:'received'});assert.equal(await work,false);assert.deepEqual(h.controller.snapshot().values,draft());
});

test('pending snapshots and injected payload copies cannot alter the owned raw form draft',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit(),s=h.controller.snapshot();s.values.birthDate='MUTATED';s.unit.userId='MUTATED';h.writes[0].values.purpose='PAYLOAD COPY MUTATED';assert.equal(h.controller.snapshot().values.birthDate,draft().birthDate);assert.equal(h.controller.snapshot().values.purpose,draft().purpose);assert.equal(h.controller.snapshot().unit.userId,UNIT.data.userId);
 h.writes[0].resolve({error:true,delivery:'received'});await work;
});

test('known native errortrue keeps form/draft with no invented feedback, callback, clear or automatic retry',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].resolve({error:true,delivery:'received'});assert.equal(await work,false);let s=h.controller.snapshot();assert.equal(s.stage,'form');assert.equal(s.pending,false);assert.equal(s.writeLocked,false);assert.equal(s.writeError,'');assert.deepEqual(s.values,draft());assert.equal(s.unit.userId,UNIT.data.userId);assert.equal(h.results.length,0);assert.equal(h.backs.length,0);await tick();assert.equal(h.writes.length,1);assert.equal(h.reads.length,1);
 const explicit=h.controller.submit();assert.equal(h.writes.length,2);h.writes[1].resolve({error:true,delivery:'received'});await explicit;
});

test('known native errorfalse alone opens success copy and delivers one accepted outcome without refresh',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].resolve({error:false,delivery:'received'});assert.equal(await work,true);const s=h.controller.snapshot();assert.equal(s.stage,'success');assert.equal(s.pending,false);assert.equal(s.writeLocked,true);assert.deepEqual(h.results,[{accepted:true,error:false,delivery:'received'}]);assert.equal(h.reads.length,1);assert.equal(await h.controller.submit(),false);assert.equal(h.writes.length,1);
 const html=guestbookView(s);assert.match(html,/Terimakasih/);assert.match(html,/Buku Tamu Sudah Terisi/);assert.match(html,/data-action="guestbook-back"/);assert.doesNotMatch(html,/SYNTHETIC-PRIVATE|RAW NAMA|RAW DOB|KTP|terverifikasi|kartu pengunjung|guestbook-raw|data-guestbook-field/);
});

test('Kembali is an explicit parent-owned one-shot callback, no hardcoded navigation or early back',async()=>{
 const h=await fixture().open();h.fill();assert.equal(h.controller.back(),false);const work=h.controller.submit();assert.equal(h.controller.back(),false);h.writes[0].resolve({error:false,delivery:'received'});await work;assert.equal(h.backs.length,0);assert.equal(h.controller.back(),true);assert.equal(h.controller.back(),false);assert.equal(h.backs.length,1);assert.equal(h.controller.snapshot().canBack,false);
});

test('ambiguous transport handoff locks QR, form and submit while preserving draft and never reporting accepted',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('SYNTHETIC drop'),{delivery:'unknown'}));assert.equal(await work,false);const s=h.controller.snapshot();assert.equal(s.stage,'form');assert.equal(s.writeLocked,true);assert.equal(s.writePending,false);assert.equal(s.writeOutcome.accepted,false);assert.equal(s.writeOutcome.delivery,'unknown');assert.equal(s.writeError,GUESTBOOK_WRITE_COPY.unknown);assert.deepEqual(s.values,draft());assert.equal(h.results.length,0);assert.equal(h.controller.setRaw(QR),false);assert.equal(h.controller.setField('name','again'),false);assert.equal(await h.controller.open(),false);assert.equal(await h.controller.submit(),false);assert.equal(h.writes.length,1);assert.equal(h.reads.length,1);
});

test('malformed writer return stays unknown including native-looking boolfalse and wrong envelope type',async()=>{
 for(const value of [false,true,null,{},[],{error:'false',delivery:'received'},{error:false,delivery:'unknown'}]){const h=await fixture({write:async()=>value}).open();h.fill();assert.equal(await h.controller.submit(),false);assert.equal(h.controller.snapshot().writeLocked,true);assert.equal(h.controller.snapshot().writeOutcome.accepted,false);assert.equal(h.controller.snapshot().writeOutcome.delivery,'unknown');assert.equal(h.results.length,0);}
});

test('verified not_sent retains raw values and permits only a fresh explicit retry',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('SINTETIS local rejection'),{delivery:'not_sent'}));assert.equal(await work,false);assert.equal(h.controller.snapshot().writeLocked,false);assert.deepEqual(h.controller.snapshot().values,draft());assert.equal(h.controller.snapshot().writeOutcome.delivery,'not_sent');await tick();assert.equal(h.writes.length,1);const explicit=h.controller.submit();assert.equal(h.writes.length,2);h.writes[1].resolve({error:true,delivery:'received'});await explicit;
});

test('changing QR after verified not_sent clears only old feedback and restores original NIK/email prefill',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('SINTETIS local'),{delivery:'not_sent'}));await work;assert.equal(h.controller.setRaw(QR+'&extra=NEW'),true);const s=h.controller.snapshot();assert.equal(s.writeError,'');assert.equal(s.writeOutcome,null);assert.equal(s.values.name,null);assert.equal(s.values.nik,'PREFILL-SYNTHETIC-NIK');assert.equal(s.values.email,'prefill@example.invalid');assert.equal(s.unit,null);assert.equal(h.writes.length,1);
});

test('route retirement drops a late accepted response without success callback or private state resurrection',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit(),before=h.changes.length;h.retire();h.writes[0].resolve({error:false,delivery:'received'});assert.equal(await work,false);assert.equal(h.results.length,0);assert.equal(h.changes.length,before);assert.equal(h.controller.back(),false);
});

test('disposal wipes QR, metadata and nine fields before late accepted/auth/error responses arrive',async()=>{
 for(const mode of ['accepted','auth','unknown']){const h=await fixture().open();h.fill();const work=h.controller.submit();h.controller.dispose();const before=h.changes.length;if(mode==='accepted')h.writes[0].resolve({error:false,delivery:'received'});else h.writes[0].reject(Object.assign(new Error('late'),mode==='auth'?{code:'SESSION_EXPIRED'}:{delivery:'unknown'}));assert.equal(await work,false);assert.equal(h.changes.length,before);assert.equal(h.auth.length,0);assert.equal(h.results.length,0);const s=h.controller.snapshot();assert.equal(s.stage,'disposed');assert.equal(s.raw,'');assert.equal(s.unit,null);assert.equal(s.writeOutcome,null);assert.ok(Object.values(s.values).every(value=>value===null));assert.equal(await h.controller.submit(),false);}
});

test('current authentication errors call guarded parent handler once and lock the old form',async()=>{
 for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('SINTETIS expired'),{code}));assert.equal(await work,false);assert.equal(h.auth.length,1);assert.equal(h.controller.snapshot().writeLocked,true);assert.equal(await h.controller.submit(),false);assert.equal(h.auth.length,1);assert.equal(h.results.length,0);}
});

test('a late authentication failure from a retired owner never clears a newer session',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.retire();h.writes[0].reject(Object.assign(new Error('SINTETIS old401'),{code:'SESSION_EXPIRED'}));await work;assert.equal(h.auth.length,0);assert.equal(h.results.length,0);
});

test('SESSION_CHANGED locks old owner without treating its uncertain operation as native success',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('SINTETIS changed'),{code:'SESSION_CHANGED'}));await work;assert.equal(h.controller.snapshot().writeLocked,true);assert.equal(h.results.length,0);assert.equal(h.auth.length,0);assert.equal(await h.controller.submit(),false);
});

test('success callback rendering failure or reentrancy cannot replay the already accepted writer',async()=>{
 let h;h=await fixture({onResult:()=>{void h.controller.submit();throw Error('SYNTHETIC parent render failure');}}).open();h.fill();const work=h.controller.submit();h.writes[0].resolve({error:false,delivery:'received'});assert.equal(await work,true);await tick();assert.equal(h.writes.length,1);assert.equal(h.results.length,1);assert.equal(h.controller.snapshot().stage,'success');
});

test('pending/unknown form views freeze all nine fields and QR; native knownfailure has no invented result notice',async()=>{
 const h=await fixture().open();h.fill();const work=h.controller.submit(),pending=h.controller.snapshot(),html=guestbookView(pending);assert.equal((guestbookForm(pending).match(/data-guestbook-field="[^"]+"[^>]*disabled/g)??[]).length,9);assert.match(html,/<textarea id="guestbook-raw"[^>]*disabled/);assert.match(guestbookFeedback(pending),/Menyimpan/);assert.doesNotMatch(guestbookFeedback(pending),/Memuat data unit/);h.writes[0].resolve({error:true,delivery:'received'});await work;assert.doesNotMatch(guestbookForm(h.controller.snapshot()),/data-guestbook-write-error|Sudah Terisi|belum dapat dipastikan/);
});

test('display Strings and browser rejection messages are escaped without exposing source identifiers',async()=>{
 const h=await fixture({read:async()=>({...UNIT,data:{...UNIT.data,namaUnitKerja:'<script>UNIT SINTETIS</script>'}})}).open();h.fill({...draft(),name:'<img src=x onerror="syntheticOnly()">'});const work=h.controller.submit();h.writes[0].reject(Object.assign(new Error('<script>LOCAL SINTETIS</script>'),{delivery:'not_sent'}));await work;const html=guestbookView(h.controller.snapshot());assert.match(html,/&lt;script&gt;UNIT SINTETIS&lt;\/script&gt;/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;LOCAL SINTETIS&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>|<img|SYNTHETIC-PRIVATE/);
});
