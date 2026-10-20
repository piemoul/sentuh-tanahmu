// Executes the actual Activity functions and delegated handlers. All requests are synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {OPERATIONS} from '../private/operations.mjs';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/);
const names=['nativeResponseObject','activityItem','activityRows','activityCategories','activityMatches','activityDetailTarget','activityDeleteOperation','activityDeleteControllerCurrent','activityDeleteCurrent','activityDeleteMaster','openActivityDelete','cancelActivityDelete','submitActivityDelete','activityCard','activityListView','filterActivity','listPagination','clearPrivate'];
const functions=names.map(name=>{const line=lines.find(line=>new RegExp(`^(?:async )?function ${name}\\(`).test(line));assert.ok(line,name);return line;}).join('\n');
const ID='post-activity-deleteuseractivity-de6c94',KEY='activity:default',OWNER='activity:delete-state';
const activity=(id=' A ',title='Synthetic activity',type='CariBidang')=>({userActivityId:id,title,activityType:type,contentId:'different-content',subTitle:'Synthetic only',platform:'android',status:'',createdAt:null});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const plain=value=>JSON.parse(JSON.stringify(value));

function harness(rows=[activity()]){
 const calls=[],records=[],toasts=[],events=new Map(),modalEvents=new Map();let form=null,html='',handler=async()=>({result:{status:200,data:true}});
 const modal={open:false,showModal(){this.open=true;},close(){this.open=false;for(const fn of modalEvents.get('close')||[])fn({});},querySelector:selector=>selector==='#'+form?.id?form:null,addEventListener(type,fn){if(!modalEvents.has(type))modalEvents.set(type,[]);modalEvents.get(type).push(fn);}};
 Object.defineProperty(modal,'innerHTML',{get:()=>html,set:value=>{html=value;if(form)form.isConnected=false;form=value.includes('id="activity-delete-form"')?{id:'activity-delete-form',isConnected:true,submit:{disabled:false},querySelector:selector=>selector==='button[type="submit"]'?form.submit:null}:null;}});
 const state={loading:false,authenticated:true,user:{username:'synthetic'},connection:{configured:true},operations:OPERATIONS.map(op=>({...op})),activity:[],results:new Map(),points:[]};
 const readOp=OPERATIONS.find(op=>op.endpoint==='activity/GetUserActivity'),context={key:KEY,op:readOp},reader={loading:false,response:{status:200,data:{data:rows}}};
 const c=vm.createContext({state,Map,Object,Array,String,Number,JSON,Date,Intl,flowResults:new Map([[KEY,reader]]),route:'activity',sessionEpoch:0,detailSequence:0,busy:false,pending:null,flowDetail:null,htDetailData:null,flowQuery:'',flowPageIndex:0,selected:null,comparison:null,comparisonSelection:{},searchFileState:null,partnerFrame:null,
 collectionGroupCreate:null,collectionGroupMove:null,collectionGroupDelete:null,collectionGroupRemove:null,collectionItemDelete:null,collectionItemEdit:null,
 $:()=>modal,currentFlow:()=>context,ready:op=>op.enabled===true,write:op=>op.effect==='write',icon:()=>'',empty:message=>message,badge:message=>message,renderCount:0,render:()=>c.renderCount++,toast:message=>toasts.push(message),record:(...args)=>records.push(args),resetSearchFileNavigation(){},resetPartnerNavigation(){},
 document:{addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);}},api:async(path,options)=>{calls.push({path,options});return handler(path,options);}});
 vm.runInContext(functions,c);
 const escapeLine=lines.find(line=>line.startsWith('const $='));vm.runInContext(`globalThis.esc=${escapeLine.slice(escapeLine.indexOf('esc=')+4)}`,c);
 for(const prefix of ["$('#modal').addEventListener('cancel'","$('#modal').addEventListener('close'","document.addEventListener('click',async event=>{const button=","document.addEventListener('submit',async event=>{const form="]){const line=lines.find(line=>line.startsWith(prefix));assert.ok(line,prefix);vm.runInContext(line,c);}
 return{c,state,reader,context,rows,modal,calls,records,toasts,events,modalEvents,get form(){return form;},setApi(fn){handler=fn;},open(index=0){c.openActivityDelete(index);return form;},async click(action,index=0){for(const fn of events.get('click')||[])await fn({target:{closest:()=>({dataset:{action,index:String(index)}})}});},async submit(){let prevented=false;for(const fn of events.get('submit')||[])await fn({target:form,preventDefault(){prevented=true;}});return prevented;},escape(){let prevented=false;for(const fn of modalEvents.get('cancel')||[])fn({preventDefault(){prevented=true;}});if(!prevented)modal.close();return prevented;}};
}

test('every Activity type has a separate delete control and an untouched source index',()=>{
 const h=harness();for(const type of ['CariBerkas','CariBidang','AntrianOnline','Scan','Login','Geotagging','Other','']){const html=h.c.activityCard(activity('',null,type),42);assert.match(html,/data-action="activity-delete" data-index="42"/);assert.doesNotMatch(html,/<button[^>]*activity-delete[^>]* disabled/);assert.match(html,/aria-label="Hapus aktivitas"/);}
});
test('confirmation escapes the exact nullable title and does not use contentId',async()=>{
 const h=harness([activity(' ID ', '<img src=x>')]);await h.click('activity-delete');assert.match(h.modal.innerHTML,/Hapus &lt;img src=x&gt;\?/);assert.doesNotMatch(h.modal.innerHTML,/<img src=x>/);assert.equal(h.c.flowResults.get(OWNER).id,' ID ');assert.equal(h.calls.length,0);
 const empty=harness([{title:null,userActivityId:null}]);empty.open();assert.match(empty.modal.innerHTML,/Hapus \?/);assert.equal(empty.c.flowResults.get(OWNER).id,'');
});
test('cancel and Escape before confirmation send no requests',async()=>{
 for(const escape of [false,true]){const h=harness();h.open();if(escape)assert.equal(h.escape(),false);else await h.click('activity-delete-cancel');assert.equal(h.modal.open,false);assert.equal(h.calls.length,0);assert.equal(h.rows.length,1);assert.equal(h.c.flowResults.has(OWNER),false);}
});
test('delegated confirmation sends exactly one multipart-operation value and explicit review flag',async()=>{
 const h=harness();h.open();assert.equal(await h.submit(),true);assert.deepEqual(plain(h.calls),[{path:'/api/execute',options:{method:'POST',body:{operationId:ID,values:{userActivityId:' A '},confirm:true}}}]);assert.equal(h.modal.open,false);
});
for(const id of ['', '   ', 'a/:?#%'])test(`delete preserves ID ${JSON.stringify(id)} without trimming or routing substitution`,async()=>{
 const h=harness([activity(id)]);h.open();await h.c.submitActivityDelete(h.form);assert.equal(h.calls[0].options.body.values.userActivityId,id);assert.equal(h.rows.length,0);
});
for(const result of [{status:200,data:true},{status:200,data:false},{status:503,data:false},{status:200,data:{error:true}}])test(`local in-place removal ignores service Boolean/body (${JSON.stringify(result)})`,async()=>{
 const a=activity('same'),b=activity('keep','Survivor'),d=activity('same','Duplicate'),h=harness([a,b,d]),master=h.rows,reply=h.reader.response;
 const group={rows:[{id:'UNRELATED'}],loaded:true};h.c.flowResults.set('collections:groups',group);h.setApi(async()=>({result}));h.open();await h.c.submitActivityDelete(h.form);
 assert.equal(h.c.activityRows(reply),master);assert.deepEqual(master,[b]);assert.equal(master[0],b);assert.equal(h.c.flowResults.get('collections:groups'),group);assert.equal(h.calls.length,1);assert.equal(h.toasts.length,0);assert.equal(h.modal.open,false);assert.equal(h.c.flowResults.has(OWNER),false);
 assert.equal(h.records[0][1],result.status===200&&result.data===true?'success':'error');
});
test('ordinary network failure still removes locally without claiming server success or showing a toast',async()=>{
 const h=harness();h.setApi(async()=>{throw Object.assign(new Error('synthetic network failure'),{code:'UPSTREAM_TIMEOUT'});});h.open();await h.c.submitActivityDelete(h.form);assert.equal(h.rows.length,0);assert.equal(h.records[0][1],'error');assert.match(h.records[0][2],/belum terkonfirmasi/);assert.equal(h.toasts.length,0);assert.equal(h.modal.open,false);
});
test('post-await CURRENT master is mutated in place, preserving survivor objects and order',async()=>{
 const h=harness(),wait=deferred();h.setApi(()=>wait.promise);h.open();const pending=h.c.submitActivityDelete(h.form),survivor=activity('B'),last=activity('C'),current=[survivor,activity(' A '),last];h.reader.response.data.data=current;wait.resolve({result:{status:200,data:true}});await pending;assert.equal(h.reader.response.data.data,current);assert.deepEqual(current,[survivor,last]);assert.equal(h.rows.length,1);
});
test('null/missing typed IDs compare as empty strings and all empty duplicates disappear',async()=>{
 const kept=activity(' '),h=harness([{title:'A'},activity(''),{userActivityId:null,title:'C'},kept]);h.open();await h.c.submitActivityDelete(h.form);assert.deepEqual(h.rows,[kept]);assert.equal(h.calls[0].options.body.values.userActivityId,'');
});
test('String response is normalized once so rendered and dispatched rows share the mutated array',async()=>{
 const h=harness([activity('A'),activity('B')]);h.reader.response.data=JSON.stringify(h.reader.response.data);h.open();await h.c.submitActivityDelete(h.form);assert.equal(typeof h.reader.response.data,'object');assert.equal(h.c.activityRows(h.reader.response).length,1);h.open();await h.c.submitActivityDelete(h.form);assert.equal(h.calls[1].options.body.values.userActivityId,'B');
});
test('current category after await is preserved and the last browser page clamps to a valid page',async()=>{
 const rows=Array.from({length:21},(_,index)=>activity(String(index),'Activity '+index,'CariBerkas')),h=harness(rows),wait=deferred();h.c.flowPageIndex=1;h.setApi(()=>wait.promise);h.open(20);const pending=h.c.submitActivityDelete(h.form);h.c.flowQuery='Berkas';wait.resolve({result:{status:503,data:false}});await pending;assert.equal(h.c.flowQuery,'Berkas');assert.equal(h.c.flowPageIndex,0);const html=h.c.activityListView(h.reader.response);assert.match(html,/1–20 dari 20 aktivitas/);assert.match(html,/data-action="activity-delete" data-index="19"/);
});
test('pending deletion overlays duplicate IDs, not other IDs, and a second submit is ignored',async()=>{
 const h=harness([activity('D'),activity('D'),activity('K')]),wait=deferred();h.setApi(()=>wait.promise);h.open();const form=h.form,pending=h.c.submitActivityDelete(form);assert.equal(form.submit.disabled,true);for(const index of [0,1])assert.match(h.c.activityCard(h.rows[index],index),/aria-busy="true"/);assert.match(h.c.activityCard(h.rows[2],2),/aria-busy="false"/);assert.doesNotMatch(h.modal.innerHTML,/activity-delete-cancel[^>]*disabled/);await h.c.submitActivityDelete(form);assert.equal(h.calls.length,1);wait.resolve({result:{status:200,data:true}});await pending;
});
for(const action of ['cancel','escape','modal-close'])test(`pending ${action} closes only the dialog; the native controller still removes after await`,async()=>{
 const h=harness(),wait=deferred();h.setApi(()=>wait.promise);h.open();const pending=h.c.submitActivityDelete(h.form);if(action==='cancel')h.c.cancelActivityDelete();else if(action==='escape')h.escape();else h.modal.close();wait.resolve({result:{status:200,data:true}});await pending;assert.equal(h.rows.length,0);assert.equal(h.modal.open,false);assert.equal(h.c.flowResults.has(OWNER),false);
});
for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED','SESSION_CHANGED'])test(`${code} clears private state rather than reporting a successful deletion`,async()=>{
 const h=harness();h.setApi(async()=>{throw Object.assign(new Error('synthetic auth loss'),{code});});h.open();await h.c.submitActivityDelete(h.form);assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.c.flowResults.size,0);assert.equal(h.rows.length,1);assert.equal(h.modal.open,false);assert.equal(h.records.length,0);
});
test('stale read replacement never mutates the new master',async()=>{
 const h=harness(),wait=deferred(),next=[activity()];h.setApi(()=>wait.promise);h.open();const pending=h.c.submitActivityDelete(h.form);h.c.flowResults.set(KEY,{response:{status:200,data:{data:next}}});wait.resolve({result:{status:200,data:true}});await pending;assert.equal(h.rows.length,1);assert.equal(next.length,1);assert.equal(h.modal.open,false);assert.equal(h.c.flowResults.has(OWNER),false);
});
test('invalid source indices, disabled metadata, anonymous/loading/disconnected views send no request',async()=>{
 for(const alter of [h=>{},h=>{h.state.authenticated=false;},h=>{h.state.loading=true;},h=>{h.state.connection.configured=false;},h=>{h.c.route='account';},h=>{h.reader.loading=true;},h=>{h.state.operations.find(op=>op.id===ID).method='DELETE';},h=>{h.state.operations.find(op=>op.id===ID).enabled=false;}]){const h=harness();alter(h);h.c.openActivityDelete(alter.toString()==='h=>{}'?99:0);assert.equal(h.modal.open,false);assert.equal(h.calls.length,0);}
 for(const index of [-1,0.2,NaN,Infinity]){const h=harness();h.c.openActivityDelete(index);assert.equal(h.modal.open,false);}
});
