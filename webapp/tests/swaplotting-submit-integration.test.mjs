import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness,plain} from './support/account-verification-ui-harness.mjs';
import {swaplottingReadOperation} from '../assets/swaplotting/model.js';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const block=source.slice(source.indexOf('function swaplottingOperation('),source.indexOf('function ratingPpatWriteOperation('));
const actual=name=>source.split(/\r?\n/).find(line=>line.startsWith('function '+name+'(')||line.startsWith('async function '+name+'('));
const tick=()=>new Promise(setImmediate),ss=letter=>'ss_'+letter.repeat(32),reviewId='sr_'+'R'.repeat(32);
const profile={userId:'SYNTHETIC-ID',userLevel:2,isIkd:false,nama:' OWN ',nomorHp:' 000 ',email:' own@example.invalid ',nomorIdentitas:'0000000000000000'};
const specs={registered:['post-apis-swaplottingterdaftar-d9f850','/apis/SwaplottingTerdaftar'],unregistered:['post-apis-swaplottingbelumterdaftar-da0be8','/apis/SwaplottingBelumTerdaftar']};
function setup(){
 const h=harness(),captures=[],model={screen:'registered'},posts=Object.entries(specs).map(([kind,[id,path]])=>({id,path,endpoint:path,clientProfile:'swaplotting-post',method:'POST',serviceId:'main',auth:'session',encoding:'multipart',effect:'write',requiresConfirmation:true,enabled:true,kind}));
 h.c.route='swaplotting';h.state.capabilities={personalSwaplottingSubmission:true};h.state.operations=[{id:'post-account-account-summary-d2939c',endpoint:'account/account_summary',effect:'read',enabled:true},{id:'activity-get',endpoint:'activity/GetUserActivity',effect:'read',enabled:true},...posts,...[['disclaimer','get-map-getdisclaimer-d29ef0','Map/GetDisclaimer','optionalSession'],['offices','get-legacy-kantah-d10364','legacy/Kantah','optionalSession'],['regions','get-legacy-wilayah-d752bc','legacy/Wilayah','session']].map(([kind,id,path,auth])=>({id,path,auth,kind,method:'GET',encoding:'none',serviceId:'main',effect:'read',enabled:true}))];
 h.state.results.set('post-account-account-summary-d2939c',{status:200,data:{error:false,data:profile},swaplottingSourceContext:{kind:'profile',id:ss('P')}});
 Object.assign(h.c,{FormData,Blob,Promise,swaplottingReadOperation,swaplottingSubmissions:new Map(),swaplottingResultWait:null,head:()=>'<h1>Swaplotting</h1>',queuePrereadProfile:()=>profile,createSwaplottingHost:options=>{captures.push(options);return {html:()=>'<div>HOST</div>',controller:{snapshot:()=>({...model})},paint(){},dispose(){}};}});
 vm.runInContext(['nativeResponseObject','nativeAccountSummary','activityItem','activityRows','operationDestination'].map(actual).join('\n')+'\n'+block,h.c);
 const enter=()=>{h.c.swaplottingPage();const owner=h.c.flowResults.get('swaplotting:personal');Object.assign(owner.sources,{disclaimer:ss('D'),offices:ss('O'),regions:ss('G')});return owner;};
 const owner=enter(),payload={kind:'registered',draft:{fields:{name:profile.nama,phone:profile.nomorHp,email:profile.email,number:' 001 ',review:'raw\nreview'},officeIndex:0,regionIndex:0,right:'1',basisIndex:null,taxIndex:null,latitude:'-0',longitude:'106.8',disclaimerAcknowledged:true},files:[{name:'file',blob:new Blob(['REAL SYNTHETIC BYTES'],{type:'image/jpeg'})}]};
 const context=()=>({isCurrent:()=>h.c.swaplottingCurrent(owner)});
 const ok=()=>{const button=h.modal.querySelector('[data-action="swaplotting-result-ok"]');assert.ok(button);for(const listener of [...h.modal.listeners.get('click')??[]])listener({target:button});};
 return {...h,captures,posts,model,owner,payload,context,enter,ok,guard:()=>h.c.swaplottingSubmissions.get(h.c.sessionEpoch),async staged(work,kind='registered'){assert.equal(h.calls.at(-1).path,'/api/swaplotting/review');h.calls.at(-1).resolve({ok:true,reviewId,kind});await tick();assert.equal(h.calls.at(-1).path,'/api/execute');return work;}};
}
async function uploaded(h,success=true){const work=h.captures[0].submit(h.payload,h.context());h.calls.at(-1).resolve({ok:true,reviewId,kind:h.payload.kind});await tick();h.calls.at(-1).resolve({result:{status:success?200:201,data:success,reviewId,delivery:success?'confirmed':'unknown'}});return work;}
const completion=refresh=>({ok:true,reviewId,uploadAccepted:true,activity:{success:false,delivery:'unknown'},refresh,completed:true});

test('explicit submit stages raw source-bound values and repeated blobs, then sends only reviewId',async()=>{
 const h=setup(),work=h.captures[0].submit(h.payload,h.context()),stage=h.calls[0];assert.equal(stage.path,'/api/swaplotting/review');assert.ok(stage.options.body instanceof FormData);assert.equal(stage.options.body.get('operationId'),'swaplotting-review');const values=JSON.parse(stage.options.body.get('values'));assert.deepEqual(values,{kind:'registered',sourceContexts:{profile:ss('P'),disclaimer:ss('D'),offices:ss('O'),regions:ss('G')},draft:h.payload.draft});assert.equal(values.draft.latitude,'-0');assert.equal(stage.options.body.getAll('file').length,1);assert.equal(await stage.options.body.get('file').text(),'REAL SYNTHETIC BYTES');
 stage.resolve({ok:true,reviewId,kind:'registered'});await tick();assert.deepEqual(plain(h.calls[1].options.body),{operationId:specs.registered[0],values:{reviewId},confirm:true});assert.equal(h.guard().phase,'uploading');h.calls[1].resolve({result:{status:200,data:true,reviewId}});assert.deepEqual(plain(await work),{success:true,attemptId:reviewId});assert.equal(h.guard().phase,'accepted');assert.deepEqual(Object.keys(h.guard()).sort(),['epoch','kind','phase','reviewId','success']);assert.equal(h.modal.open,false);
});
test('unregistered source uses its own scoped operation without fabricated extra fields',async()=>{
 const h=setup();h.model.screen='unregistered';h.payload.kind='unregistered';h.payload.draft={...h.payload.draft,fields:{name:profile.nama,phone:profile.nomorHp,email:profile.email,address:'raw address',basisNumber:' 001 ',basisDescription:'basis',taxNumber:' 002 ',taxDescription:'tax',review:'r'},right:null,basisIndex:0,taxIndex:1};await uploaded(h,false);assert.equal(h.calls[1].options.body.operationId,specs.unregistered[0]);assert.deepEqual(Object.keys(h.calls[1].options.body.values),['reviewId']);
});
test('capability, exact operation and missing server source contexts block staging',async()=>{
 for(const change of [h=>h.state.capabilities.personalSwaplottingSubmission=false,h=>h.owner.sources.regions=null,h=>h.state.results.get('post-account-account-summary-d2939c').swaplottingSourceContext.id='invented',h=>h.posts[0].path='/other',h=>h.posts[0].clientProfile='main',h=>h.posts[0].requiresConfirmation=false,h=>h.c.logoutPending=true]){const h=setup();change(h);assert.equal(h.captures[0].writeAvailable(),false);await assert.rejects(h.captures[0].submit(h.payload,h.context()),{delivery:'not_sent'});assert.equal(h.calls.length,0);}
});
test('late region response cannot replace the context returned by the newer source read',async()=>{
 const h=setup(),a=h.captures[0].read('regions',{kantorid:'A'}),b=h.captures[0].read('regions',{kantorid:'B'});h.calls[1].resolve({result:{status:200,data:[],swaplottingSourceContext:{kind:'regions',id:ss('N')}}});await b;h.calls[0].resolve({result:{status:200,data:[],swaplottingSourceContext:{kind:'regions',id:ss('X')}}});await a;assert.equal(h.owner.sources.regions,ss('N'));
});
test('office reload clears dependent source and wrong-kind metadata never becomes a source',async()=>{
 const h=setup(),work=h.captures[0].read('offices',{nama:'',tipeKantor:''});assert.equal(h.owner.sources.offices,null);assert.equal(h.owner.sources.regions,null);h.calls[0].resolve({result:{status:200,data:[],swaplottingSourceContext:{kind:'regions',id:ss('X')}}});await work;assert.equal(h.owner.sources.offices,null);
});
test('changed profile context after local stage prevents final upload and permits only new explicit attempt',async()=>{
 const h=setup(),work=h.captures[0].submit(h.payload,h.context());h.state.results.get('post-account-account-summary-d2939c').swaplottingSourceContext.id=ss('Q');h.calls[0].resolve({ok:true,reviewId,kind:'registered'});await assert.rejects(work,{code:'SESSION_CHANGED',delivery:'not_sent'});assert.equal(h.calls.length,1);assert.equal(h.guard().phase,'not_sent');
});
test('route-surviving guard blocks concurrent reopened forms and retains ambiguous outcome',async()=>{
 const h=setup(),work=h.captures[0].submit(h.payload,h.context());h.calls[0].resolve({ok:true,reviewId,kind:'registered'});await tick();h.owner.dispose();h.c.flowResults.delete('swaplotting:personal');h.enter();assert.equal(h.captures[1].writeAvailable(),false);await assert.rejects(h.captures[1].submit(h.payload,{isCurrent:()=>true}));assert.equal(h.calls.length,2);h.calls[1].reject(new TypeError('fetch failed'));await assert.rejects(work,{delivery:'unknown'});assert.equal(h.guard().phase,'unknown');assert.equal(h.captures[1].writeAvailable(),false);assert.match(h.c.swaplottingGuardNotice(),/belum diketahui/);
});
test('known scoped failure is not_sent while unreadable execution response stays unknown',async()=>{
 for(const [error,delivery] of [[Object.assign(new Error('scope'),{code:'SWAPLOTTING_REVIEW_EXPIRED',localResponse:true,httpStatus:409}),'not_sent'],[Object.assign(new Error('gateway'),{code:'LOCAL_RESPONSE_UNREADABLE',httpStatus:502}),'unknown'],[Object.assign(new Error('expired after dispatch'),{code:'SESSION_EXPIRED',localResponse:true,delivery:'unknown'}),'unknown']]){const h=setup(),work=h.captures[0].submit(h.payload,h.context());h.calls[0].resolve({ok:true,reviewId,kind:'registered'});await tick();h.calls[1].reject(error);await assert.rejects(work,{delivery});assert.equal(h.guard().phase,delivery);}
});
test('success waits for visible OK, completes once, updates actual Activity cache, then directs back',async()=>{
 const h=setup(),result=await uploaded(h,true),work=h.captures[0].onResult(result);assert.equal(h.modal.open,true);assert.match(h.modal.textContent,/Swaplotting Success/);assert.equal(h.modal.querySelector('[data-action="swaplotting-result-ok"]').textContent,'OK');assert.equal(h.calls.length,2);await assert.rejects(h.captures[0].onResult(result));assert.equal(h.calls.length,2);h.ok();await tick();assert.deepEqual(plain(h.calls[2].options.body),{reviewId,confirm:true});assert.equal(h.calls[2].path,'/api/swaplotting/complete');assert.equal(h.captures[0].writeAvailable(),false);const activity={status:200,data:{data:[{userActivityId:'A',activityType:'Swaplotting',title:'SYNTHETIC'}]}};h.calls[2].resolve(completion({success:true,result:activity}));assert.deepEqual(plain(await work),{backToMap:true});assert.equal(h.state.results.get('activity-get'),activity);assert.equal(h.c.flowResults.get('activity:default').response,activity);assert.equal(h.guard().phase,'completed');assert.equal(h.calls.length,3);
});
test('native false shows Gagal and OK only, retains editable form and makes no completion call',async()=>{
 const h=setup(),result=await uploaded(h,false),work=h.captures[0].onResult(result);assert.match(h.modal.textContent,/Swaplotting Gagal/);assert.equal(h.captures[0].writeAvailable(),false);h.ok();assert.deepEqual(plain(await work),{});assert.equal(h.calls.length,2);assert.equal(h.guard().phase,'failed');assert.equal(h.captures[0].writeAvailable(),true);
});
test('ordinary Activity refresh failure clears old cache but still returns back without repeating mutation',async()=>{
 const h=setup();h.state.results.set('activity-get',{status:200,data:{data:[{title:'OLD'}]}});h.c.flowResults.set('activity:default',{response:h.state.results.get('activity-get')});const result=await uploaded(h,true),work=h.captures[0].onResult(result);h.ok();await tick();h.calls[2].resolve(completion({success:false,result:null}));assert.deepEqual(plain(await work),{backToMap:true});assert.equal(h.state.results.has('activity-get'),false);assert.equal(h.c.flowResults.get('activity:default').response,null);assert.equal(h.calls.length,3);
});
test('dialog disposal resolves the wait without completing or producing a delayed dialog',async()=>{
 const h=setup(),result=await uploaded(h,true),work=h.captures[0].onResult(result);h.owner.dispose();assert.equal(h.modal.open,false);await assert.rejects(work,{code:'SESSION_CHANGED'});assert.equal(h.calls.length,2);assert.equal(h.guard().phase,'accepted');h.c.flowResults.delete('swaplotting:personal');h.enter();assert.equal(h.captures[1].writeAvailable(),false);
});
test('completion exception preserves accepted guard and does not replay upload or Activity',async()=>{
 const h=setup(),result=await uploaded(h,true),work=h.captures[0].onResult(result);h.ok();await tick();h.calls[2].reject(Object.assign(new Error('Completion failed'),{uploadAccepted:true}));await assert.rejects(work,/Completion failed/);assert.equal(h.guard().phase,'accepted');assert.equal(h.captures[0].writeAvailable(),false);assert.equal(h.calls.length,3);assert.equal(h.state.authenticated,true);
});
test('late completion auth failure cannot clear a newer session or its Activity cache',async()=>{
 const h=setup(),result=await uploaded(h,true),work=h.captures[0].onResult(result);h.ok();await tick();h.c.sessionEpoch++;h.state.results.set('activity-get',{newSession:true});h.calls[2].reject(Object.assign(new Error('old auth'),{code:'SESSION_EXPIRED'}));await assert.rejects(work);assert.equal(h.state.authenticated,true);assert.deepEqual(h.state.results.get('activity-get'),{newSession:true});
});
test('clearing private state retires dialog and removes all global submission guards',async()=>{
 const h=setup(),result=await uploaded(h,true),work=h.captures[0].onResult(result);h.c.clearPrivate();await assert.rejects(work);assert.equal(h.c.swaplottingSubmissions.size,0);assert.equal(h.modal.open,false);assert.equal(h.calls.length,2);
});
test('destination maps only the two exact personal upload scopes',()=>{
 const h=setup();for(const op of h.posts){assert.equal(h.c.operationDestination(op),'https://sentuh.atrbpn.go.id/');for(const patch of [{id:'other'},{path:'/other'},{method:'GET'},{auth:'optionalSession'},{serviceId:'other'},{encoding:'json'},{effect:'read'},{requiresConfirmation:false}])assert.equal(h.c.operationDestination({...op,...patch}),null);}assert.equal(h.calls.length,0);
});
test('actual API helper retains only typed scoped delivery and completion metadata',async()=>{
 const h=setup(),apiSource=source.slice(source.indexOf('async function api('),source.indexOf('async function load('));let response={ok:false,status:409,headers:{get:()=>null},json:async()=>({ok:false,error:{code:'SWAPLOTTING_CONTEXT_CHANGED',message:'scope',details:{delivery:'not_sent',uploadAccepted:true,activityDelivery:'unknown'}}})};h.c.fetch=async()=>response;vm.runInContext(apiSource,h.c);await assert.rejects(h.c.api('/synthetic',{method:'POST',body:{}}),error=>error.delivery==='not_sent'&&error.uploadAccepted===true&&error.activityDelivery==='unknown'&&error.localResponse===true&&error.httpStatus===409);response={...response,json:async()=>({ok:false,error:{code:'X',details:{delivery:'invented',uploadAccepted:'true',activityDelivery:'invented'}}})};await assert.rejects(h.c.api('/synthetic'),error=>!Object.hasOwn(error,'delivery')&&!Object.hasOwn(error,'uploadAccepted')&&!Object.hasOwn(error,'activityDelivery'));
});
