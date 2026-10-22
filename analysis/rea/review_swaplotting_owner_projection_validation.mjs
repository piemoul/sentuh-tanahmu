// Independent actual-source own-contact probes. No transport/browser/provider action.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {swaplottingOwnProfile} from '../../webapp/assets/swaplotting/model.js';
import {createSwaplotting} from '../../webapp/assets/swaplotting/controller.js';
import {swaplottingView} from '../../webapp/assets/swaplotting/view.js';
import {OPERATIONS} from '../../webapp/private/operations.mjs';
import {harness,plain} from '../../webapp/tests/support/account-verification-ui-harness.mjs';

const root=new URL('../../',import.meta.url),read=file=>fs.readFileSync(new URL(file,root)),hash=file=>createHash('sha256').update(read(file)).digest('hex');
const writer='analysis/rea/review_swaplotting_owner_projection_validation.mjs';
const native='analysis/recovered/swaplotting-owner-followup/flow.json';
assert.equal(hash(native),'02ecc3c52cf9ee22c73dfe40b0e9a5cbd2327d5c5779285ed1d4ecd71c8ccf22');
const predecessorFile='analysis/webapp/swaplotting-owner-projection-review-integrated.json',predecessor=JSON.parse(read(predecessorFile));
assert.equal(hash(predecessorFile),'79cd126f0f02ad9ef74bdd66ebbcd448f89d01b699da19855f6d6ba25a70b27a');
const changedSincePredecessor=predecessor.inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>({file:row.file,before:row.sha256,after:hash(row.file)}));
assert.deepEqual(changedSincePredecessor.map(row=>row.file),['webapp/assets/swaplotting/host.js']);
assert.equal(changedSincePredecessor[0].before,'82c662136b1e0ed8a4ce5030ea1d9ecd663f015d08ed0eb819e66aa02c141de5');
assert.equal(changedSincePredecessor[0].after,'e6bf0ccc7c60b71b237853f37eb1d9d3f9a69a1eca4fc91286e38679f5e3ffd2');
const source=read('webapp/app.js').toString('utf8');
const functions=[...source.matchAll(/^(?:async )?function ([A-Za-z0-9_]+)\(/gm)];
function actual(name){const index=functions.findIndex(row=>row[1]===name);assert.ok(index>=0,name);return source.slice(functions[index].index,functions[index+1]?.index??source.length);}
const runtime=['webapp/app.js','webapp/styles.css',...['model','controller','view','host','map'].map(name=>'webapp/assets/swaplotting/'+name+'.js'),'webapp/private/operations.mjs','webapp/tests/support/account-verification-ui-harness.mjs'];
const testFiles=fs.readdirSync(new URL('webapp/tests/',root)).filter(name=>/^swaplotting-.*\.test\.mjs$/.test(name)).map(name=>'webapp/tests/'+name);
const inputs=[...new Set([writer,predecessorFile,'analysis/rea/review_swaplotting_owner_projection_integrated.mjs','analysis/rea/review_swaplotting_owner_projection.mjs',native,'analysis/recovered/swaplotting-owner-followup/verification.json','analysis/SWAPLOTTING-OWNER-FOLLOWUP.md',...runtime,...testFiles])].map(file=>({file,sha256:hash(file)}));
const checks=[];
async function check(name,fn){const evidence=await fn();checks.push({name,status:'PASS',...evidence});}
const own=(values={})=>({userLevel:2,isIkd:false,nama:' PEMOHON SINTETIS ',nomorHp:' +000 000 ',email:' synthetic@example.invalid ',...values});
const expected={name:' PEMOHON SINTETIS ',phone:' +000 000 ',email:' synthetic@example.invalid '};
const readFixture=async kind=>kind==='disclaimer'?{}:[];
const open=async(controller,kind='registered')=>{await controller.loadDisclaimer();assert.equal(await controller.openForm(kind),true);};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function app(){
 const h=harness({user:{username:'SIGNIN-SYNTHETIC',userLevel:3,nama:'WRONG SIGNIN NAME',nomorHp:'WRONG SIGNIN PHONE',email:'wrong-signin@example.invalid'}});
 const hostCalls=[];
 Object.assign(h.c,{head:()=>'',createSwaplottingHost:options=>{hostCalls.push(options);return{html:()=>'<div>synthetic host</div>',dispose:()=>{options.disposed=true;}};}});
 h.c.state.operations=[...OPERATIONS];h.c.route='swaplotting';h.c.logoutPending=false;
 vm.runInContext(['nativeResponseObject','nativeAccountSummary','queuePrereadProfile','swaplottingOperation','swaplottingCurrent','swaplottingPage','refreshNativeProfile'].map(actual).join('\n'),h.c);
 const operation=OPERATIONS.find(op=>op.endpoint==='account/account_summary');assert.ok(operation);
 const result=(profile=own(),bodyOverrides={},status=200)=>({status,data:{error:false,data:profile,...bodyOverrides}});
 h.c.state.results.set(operation.id,result());
 return{...h,hostCalls,operation,result};
}

await check('Native gate permits only own profile levels2/3 with exact false IKD',()=>{
 for(const userLevel of [2,3])assert.deepEqual(swaplottingOwnProfile(own({userLevel})),expected);
 for(const userLevel of [undefined,null,-1,0,1,4,'2',2.5,true,2n])assert.equal(swaplottingOwnProfile(own({userLevel})),null);
 for(const isIkd of [undefined,null,true,0,1,'false'])assert.equal(swaplottingOwnProfile(own({isIkd})),null);
 return {permittedLevels:[2,3],requiredIkd:false};
});
await check('Null or missing native contact Strings become empty; no trim/case/Unicode normalization',()=>{
 assert.deepEqual(swaplottingOwnProfile({userLevel:2,isIkd:false}),{name:'',phone:'',email:''});
 assert.deepEqual(swaplottingOwnProfile(own({nama:null,nomorHp:null,email:null})),{name:'',phone:'',email:''});
 assert.deepEqual(swaplottingOwnProfile(own({nama:' \u0085E\u0301😀 ',nomorHp:' 000.0+\t',email:' MIXED@EXAMPLE.INVALID '})),{name:' \u0085E\u0301😀 ',phone:' 000.0+\t',email:' MIXED@EXAMPLE.INVALID '});
 return {contacts:['nama','nomorHp','email'],rawStrings:true};
});
await check('Wrong nonnull contact types reject the whole projection',()=>{
 for(const key of ['nama','nomorHp','email'])for(const value of [0,false,[],{}])assert.equal(swaplottingOwnProfile(own({[key]:value})),null);
 for(const value of [null,undefined,[],false,12,'profile'])assert.equal(swaplottingOwnProfile(value),null);
});
await check('Projection creates exactly three contacts without reading NIK, DOB, username or record flags',()=>{
 const profile=own();for(const key of ['username','nomorIdentitas','tempatLahir','tanggalLahir','id','fromUserData'])Object.defineProperty(profile,key,{get(){assert.fail('Unneeded identity read: '+key);}});
 const projected=swaplottingOwnProfile(profile);assert.deepEqual(projected,expected);assert.deepEqual(Object.keys(projected),['name','phone','email']);
 assert.equal(Object.hasOwn(projected,'id'),false);assert.equal(Object.hasOwn(projected,'tglLahir'),false);
});
await check('Both form branches copy current trusted raw contacts; getter reads do not issue profile requests',async()=>{
 let current=own(),reads=0;const calls=[];
 const controller=createSwaplotting({profile:()=>{reads++;return current;},read:async(kind,values)=>{calls.push({kind,values});return readFixture(kind);}});
 assert.equal(reads,0);await open(controller);
 assert.deepEqual(controller.snapshot().owner.data,expected);for(const key of Object.keys(expected))assert.equal(controller.snapshot().fields[key],expected[key]);
 assert.equal(controller.backToMap(),true);current=own({nama:'SECOND SYNTHETIC',nomorHp:null,email:''});
 assert.equal(await controller.openForm('unregistered'),true);assert.deepEqual(controller.snapshot().owner.data,{name:'SECOND SYNTHETIC',phone:'',email:''});
 assert.equal(reads,2);assert.deepEqual(calls.map(row=>row.kind),['disclaimer','offices','offices']);
 controller.dispose();return{profileFetches:0,branches:['registered','unregistered']};
});
await check('Profile replacement clears old contacts while preserving land drafts and native required validation',async()=>{
 const controller=createSwaplotting({profile:own(),read:readFixture});await open(controller);
 controller.setField('number',' RAW-NUMBER ');controller.setField('review',' RAW-REVIEW ');controller.validate();
 controller.setProfile(own({nama:null,nomorHp:null,email:null}));let state=controller.snapshot();
 assert.deepEqual(state.owner.data,{name:'',phone:'',email:''});assert.equal(state.fields.number,' RAW-NUMBER ');assert.equal(state.fields.review,' RAW-REVIEW ');
 for(const key of ['name','phone','email'])assert.equal(state.validation.flags[key],true);
 controller.setProfile(own({userLevel:1}));state=controller.snapshot();assert.equal(state.owner.status,'unresolved');assert.equal(state.owner.data,null);
 for(const key of ['name','phone','email'])assert.equal(state.fields[key],null);
 controller.dispose();
});
await check('Contact editing is rejected; view escapes values and offers no owner, identity or submit action',async()=>{
 const controller=createSwaplotting({profile:own({nama:'<img src=x onerror=alert(1)>',email:'" onclick="synthetic'}),read:readFixture});await open(controller);
 for(const key of ['name','phone','email','nik','tglLahir','id'])assert.equal(controller.setField(key,'forged'),false);
 const html=swaplottingView(controller.snapshot());assert.match(html,/Profil akun sendiri/);assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(html,/<img src=x/);assert.doesNotMatch(html,/name="(?:name|phone|email|nik|tglLahir|id)"/);
 assert.match(html,/<button[^>]*disabled>Pilih pengguna<\/button>/);assert.match(html,/<button[^>]*disabled[^>]*>Kirim<\/button>/);
 controller.dispose();
});
await check('Disposed or retired controller cannot refresh profile or restore contacts from a late read',async()=>{
 const pending=deferred();let getterCalls=0,alive=true;
 const controller=createSwaplotting({profile:()=>{getterCalls++;return own();},isCurrent:()=>alive,read:kind=>kind==='offices'?pending.promise:Promise.resolve({})});
 await controller.loadDisclaimer();const work=controller.openForm('registered');assert.equal(getterCalls,1);
 controller.dispose();pending.resolve([]);assert.equal(await work,false);assert.equal(controller.setProfile(()=>{assert.fail('Disposed getter');}),false);
 let state=controller.snapshot();assert.equal(state.screen,'disposed');assert.equal(state.owner.data,null);for(const key of ['name','phone','email'])assert.equal(state.fields[key],null);
 const second=createSwaplotting({profile:own(),isCurrent:()=>alive,read:readFixture});alive=false;
 assert.equal(second.setProfile(own({nama:'STALE'})),false);assert.equal(await second.openForm('registered'),false);second.dispose();
});
await check('Actual app passes account_summary rather than conflicting cached signin to the host',()=>{
 const h=app();h.c.swaplottingPage();assert.equal(h.hostCalls.length,1);const options=h.hostCalls[0];assert.equal(options.isCurrent(),true);
 assert.deepEqual(swaplottingOwnProfile(plain(options.profile())),expected);
 assert.notEqual(options.profile().nama,h.state.user.nama);assert.equal(h.calls.length,0);
 h.state.results.delete(h.operation.id);assert.equal(options.profile(),null);assert.equal(h.calls.length,0);
 return {source:'queuePrereadProfile→nativeAccountSummary→state.results[account_summary operation ID]',signinSubstitution:false,implicitProfileRequest:false};
});
await check('Actual typed profile envelope rejects malformed or failed reads and never falls back to signin',()=>{
 const h=app();h.c.swaplottingPage();const options=h.hostCalls[0];
 for(const value of [h.result(null),h.result([]),h.result(own(),{error:true}),h.result(own(),{},503),h.result(own({nomorHp:12})),h.result(own({userLevel:'2'})),h.result(own({isIkd:'false'}))]){
  h.state.results.set(h.operation.id,value);assert.equal(options.profile(),null);
 }
 assert.equal(h.calls.length,0);
});
await check('Actual route, navigation, epoch and owner identity gates retire the host',()=>{
 const h=app();h.c.swaplottingPage();const options=h.hostCalls[0],owner=h.c.flowResults.get('swaplotting:personal');
 for(const [key,value] of [['route','account'],['detailSequence',h.c.detailSequence+1],['sessionEpoch',h.c.sessionEpoch+1]]){
  const before=h.c[key];h.c[key]=value;assert.equal(options.isCurrent(),false);h.c[key]=before;
 }
 h.c.flowResults.set('swaplotting:personal',{});assert.equal(options.isCurrent(),false);h.c.flowResults.set('swaplotting:personal',owner);assert.equal(options.isCurrent(),true);
});
await check('Actual logout clears profile cache, disposes host and makes the old profile unavailable',()=>{
 const h=app();h.c.swaplottingPage();const options=h.hostCalls[0];
 h.c.session({authenticated:false,user:null});assert.equal(options.disposed,true);assert.equal(options.isCurrent(),false);assert.equal(options.profile(),null);assert.equal(h.state.results.size,0);
});
await check('Actual profile reader ignores old epoch/declined owner results, without production requests',async()=>{
 for(const retire of ['epoch','accept']){
  const h=app();h.state.results.clear();let accepted=true;const work=h.c.refreshNativeProfile(()=>accepted);assert.equal(h.calls.length,1);
  if(retire==='epoch')h.c.sessionEpoch++;else accepted=false;
  h.calls[0].resolve({result:h.result()});await work;assert.equal(h.state.results.size,0);
 }
 return{transport:'Existing synthetic deferred api stub; no fetch or network.',lateCases:['epoch change','caller ownership/accept rejection']};
});

for(const row of inputs)assert.equal(hash(row.file),row.sha256,'Changed during review: '+row.file);
const report={schemaVersion:1,predecessor:{file:predecessorFile,sha256:hash(predecessorFile)},changedSincePredecessor,successorReason:'Only host.patchSameScreen select ARIA synchronization changed after the prior frozen review. This current-source successor repeats the same scoped checks and preserves all prior evidence.',checkedAt:new Date().toISOString(),status:'PASS',reviewerRole:'Author of the pinned native owner bridge proof; independent reviewer of frontend and root app projection implementation.',scope:'Own-contact read subset only, actual imported model/controller/view and verbatim root app helpers in synthetic VM; no full Swaplotting parity claim.',inputs,writer:{file:writer,sha256:hash(writer)},checks,materialFindings:[],changedInputs:[],nativeEvidence:{file:native,sha256:hash(native)},adaptations:['Only own-profile contact projection is implemented; full eight-field lCb, date conversion, managed-user list/default/selection and persisted user_plotting are omitted.','Contacts are displayed read-only, with the browser label Profil akun sendiri. This is not a native pixel or complete managed-user UI claim.','Root reuses a typed account_summary response already bound to the current session; this projection and form entry add no account/profile request.','Route/session/request retirement and clearing are browser protections, not a claim that the full native lifecycle was proved race-free.'],newActions:{networkRequests:0,accountDataRead:0,identityOrOtpActions:0,plotOrUploadActions:0,gpsOrPresenceActions:0,runtimeEdits:0,browserActions:0},limits:['Synthetic probes establish source behavior only; no real account_summary response, original Android comparison, provider authorization, ownership or physical presence was tested.','No camera, managed-user enrollment, submit transport or success state is enabled by this projection.','Getter/accessor behavior from arbitrary non-JSON objects is not an accepted browser identity source; the root supplies typed JSON from its own session results.'],goalComplete:false};
if(process.argv.includes('--probe-only'))console.log(JSON.stringify({status:report.status,checks:checks.length,materialFindings:0,sourceAppSha256:hash('webapp/app.js'),reportWritten:false}));
else{
 const output='analysis/webapp/swaplotting-owner-projection-review-validation.json';
 fs.writeFileSync(new URL(output,root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:report.status,checks:checks.length,output,sha256:hash(output),sourceAppSha256:hash('webapp/app.js')}));
}
