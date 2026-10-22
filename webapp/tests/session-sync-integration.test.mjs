// Actual app helpers/handlers are extracted verbatim. No provider/browser I/O.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {OPERATIONS} from '../private/operations.mjs';
import {createSessionSync} from '../assets/session-sync.js';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/);
function actual(name){const start=lines.findIndex(line=>new RegExp(`^(?:async )?function ${name}\\(`).test(line));assert.ok(start>=0,'Missing actual app helper '+name);let body='';for(let i=start;i<lines.length;i++){body+=lines[i]+'\n';try{new vm.Script(body);return body;}catch(error){if(!(error instanceof SyntaxError))throw error;}}throw Error('Incomplete actual helper '+name);}
const helpers=['sessionSyncGeneration','invalidateSessionSync','flushSessionSync','notifySessionSync','requestSessionSync','applySessionState','installSessionSync'];
const stateValue=(csrfToken='csrf-A',authenticated=true,username='session-sync-A')=>({csrfToken,authenticated,user:authenticated?{username,email:'synthetic@example.invalid'}:null,connection:{configured:true},version:'6.1.5',capabilities:{}});
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function eventSurface(){const listeners=new Map();return{listeners,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},emit(type,event={}){for(const fn of [...listeners.get(type)??[]])fn(event);}};}
function setup({realApi=false,realProfile=false,realSync=false}={}){
 const h=harness({user:{username:'session-sync-A',userLevel:2}}),profiles=[],fetches=[],syncEvents=[],channels=[],target=eventSurface();
 Object.assign(h.state,stateValue());h.state.operations=[{...OPERATIONS.find(row=>row.id==='post-account-account-summary-d2939c')}];
 h.state.points=[{id:'old-point'}];h.state.results.set('old-result',{data:'old'});h.c.flowResults.set('old-source',{response:'old'});
 Object.assign(h.c,{authSequence:0,loadSequence:0,sessionSynchronizer:null,FormData,AbortController,queueMicrotask,window:{...h.c.window,...target},document:h.document,$:(selector,root=h.document)=>root.querySelector(selector),refreshNativeProfile:async accept=>{profiles.push(accept);},fetch:async(path,options)=>{const wait=deferred();fetches.push({path,options,...wait});return wait.promise;}});
 h.document.hidden=false;h.document.visibilityState='visible';
 h.c.createSessionSync=options=>{if(realSync){const channel=eventSurface();channel.postMessage=value=>syncEvents.push({kind:'broadcast',value});channel.close=()=>syncEvents.push({kind:'close'});channels.push(channel);return createSessionSync({...options,channelFactory:()=>channel});}h.c.installedSyncOptions=options;return{invalidate(){syncEvents.push('invalidate');},flush(){syncEvents.push('flush');return Promise.resolve(false);},notify(){syncEvents.push('notify');},check(reason){syncEvents.push({check:reason});return Promise.resolve(false);},dispose(){syncEvents.push('dispose');}};};
 vm.runInContext(helpers.map(actual).join('\n'),h.c);
 if(realApi)vm.runInContext(actual('api'),h.c);
 if(realProfile)vm.runInContext(['nativeResponseObject','nativeAccountSummary','refreshNativeProfile'].map(actual).join('\n'),h.c);
 return {...h,profiles,fetches,syncEvents,channels,target};
}

test('same username with a changed CSRF retires actual private contexts before profile hydration',async()=>{
 const h=setup(),epoch=h.c.sessionEpoch;h.modal.innerHTML='<p>old private detail</p>';h.modal.showModal();
 assert.equal(await h.c.applySessionState(stateValue('csrf-rotated'),{isCurrent:()=>true}),true);
 assert.equal(h.c.sessionEpoch,epoch+1);assert.equal(h.state.authenticated,true);assert.equal(h.state.user.username,'session-sync-A');assert.equal(h.state.csrfToken,'csrf-rotated');
 assert.equal(h.state.points.length,0);assert.equal(h.state.results.size,0);assert.equal(h.c.flowResults.size,0);assert.equal(h.modal.open,false);assert.equal(h.modal.innerHTML,'');assert.equal(h.profiles.length,1);assert.equal(h.profiles[0](),true);assert.equal(h.c.renderCount,2);
});
test('unchanged critical identity updates public metadata without clearing drafts, repainting or reading profile',async()=>{
 const h=setup(),epoch=h.c.sessionEpoch,points=h.state.points,result=h.state.results.get('old-result'),value={...stateValue(),version:'updated-public-version',connection:{configured:false}};
 assert.equal(await h.c.applySessionState(value,{isCurrent:()=>true}),false);assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.points,points);assert.equal(h.state.results.get('old-result'),result);assert.equal(h.c.flowResults.size,1);assert.equal(h.c.renderCount,0);assert.equal(h.profiles.length,0);assert.equal(h.state.version,'updated-public-version');assert.equal(h.state.connection.configured,false);
});
test('other-tab logout clears actual caches and never hydrates an anonymous profile',async()=>{
 const h=setup();assert.equal(await h.c.applySessionState(stateValue('csrf-logout',false),{isCurrent:()=>true}),true);assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.state.points.length,0);assert.equal(h.state.results.size,0);assert.equal(h.profiles.length,0);assert.match(h.toasts.at(-1),/berakhir/);
});
test('changed account username retires contexts even when the supplied CSRF is unchanged',async()=>{
 const h=setup(),epoch=h.c.sessionEpoch;await h.c.applySessionState(stateValue('csrf-A',true,'session-sync-B'),{isCurrent:()=>true});assert.equal(h.c.sessionEpoch,epoch+1);assert.equal(h.state.user.username,'session-sync-B');assert.equal(h.state.results.size,0);assert.equal(h.profiles.length,1);
});
test('a retired sync attempt cannot apply even malformed or anonymous old state',async()=>{
 for(const value of [null,stateValue('old',false),{authenticated:'bad'}]){const h=setup(),points=h.state.points,epoch=h.c.sessionEpoch;assert.equal(await h.c.applySessionState(value,{isCurrent:()=>false}),false);assert.equal(h.state.authenticated,true);assert.equal(h.state.csrfToken,'csrf-A');assert.equal(h.state.points,points);assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.profiles.length,0);}
});
test('current malformed local state is rejected without partial cache/session changes',async()=>{
 for(const value of [null,{...stateValue(),csrfToken:''},{...stateValue(),csrfToken:'x'.repeat(257)},{...stateValue(),authenticated:'true'},{...stateValue(),user:[]}]){const h=setup(),epoch=h.c.sessionEpoch,points=h.state.points;await assert.rejects(h.c.applySessionState(value,{isCurrent:()=>true}));assert.equal(h.c.sessionEpoch,epoch);assert.equal(h.state.points,points);assert.equal(h.state.csrfToken,'csrf-A');assert.equal(h.profiles.length,0);}
});
test('post-rotation hydration guard uses the new epoch and rejects later login/bootstrap ownership',async()=>{
 for(const change of [h=>h.c.sessionEpoch++,h=>h.c.loadSequence++,h=>h.c.authPending=true,h=>h.c.logoutPending=true]){const h=setup();await h.c.applySessionState(stateValue('new-csrf'),{isCurrent:()=>true});assert.equal(h.profiles[0](),true);change(h);assert.equal(h.profiles[0](),false);}
});
test('install passes actual local state reader, lifecycle gates and abort signal without an eager fetch',async()=>{
 const h=setup({realApi:true});h.c.installSessionSync();assert.equal(h.fetches.length,0);const options=h.c.installedSyncOptions;assert.equal(options.applyState,h.c.applySessionState);assert.equal(options.canCheck(),true);
 for(const field of ['loading','authPending','logoutPending']){if(field==='loading')h.state.loading=true;else h.c[field]=true;assert.equal(options.canCheck(),false);if(field==='loading')h.state.loading=false;else h.c[field]=false;}
 const controller=new AbortController(),work=options.readState({signal:controller.signal});assert.equal(h.fetches.length,1);assert.equal(h.fetches[0].path,'/api/state');assert.equal(h.fetches[0].options.method,'GET');assert.equal(h.fetches[0].options.signal,controller.signal);assert.equal(h.fetches[0].options.credentials,'same-origin');assert.equal(h.fetches[0].options.body,undefined);h.fetches[0].resolve(response(stateValue()));await work;
 h.c.installSessionSync();assert.equal(h.syncEvents.filter(value=>value==='dispose').length,1);
});
test('generation changes for auth, bootstrap and epoch while route changes alone keep identity ownership',()=>{
 const h=setup(),initial=h.c.sessionSyncGeneration();h.c.route='services';assert.equal(h.c.sessionSyncGeneration(),initial);h.c.authSequence++;assert.notEqual(h.c.sessionSyncGeneration(),initial);const next=h.c.sessionSyncGeneration();h.c.loadSequence++;assert.notEqual(h.c.sessionSyncGeneration(),next);const last=h.c.sessionSyncGeneration();h.c.sessionEpoch++;assert.notEqual(h.c.sessionSyncGeneration(),last);
});
test('typed local CSRF POST rejection schedules a state check, reports not_sent and never replays input',async()=>{
 for(const code of ['CSRF_REQUIRED','CSRF_REJECTED']){const h=setup({realApi:true});h.c.installSessionSync();const original={operationId:'bounded-original',values:{raw:'original <literal>'},confirm:true};const work=h.c.api('/api/execute',{method:'POST',body:original});assert.equal(h.fetches.length,1);assert.equal(h.fetches[0].options.headers['X-CSRF-Token'],'csrf-A');h.fetches[0].resolve(response({ok:false,error:{code,message:'synthetic local gate'}},403));await assert.rejects(work,error=>error.code===code&&error.delivery==='not_sent'&&error.localResponse===true&&error.httpStatus===403);await tick();assert.equal(h.fetches.length,1);assert.equal(h.fetches[0].options.body,JSON.stringify(original));assert.deepEqual(h.syncEvents,[{check:'csrf-rejected'}]);assert.equal(h.state.authenticated,true);}
});
test('unrelated status/code, GET rejection and unreadable response never replay or trigger a CSRF check',async()=>{
 for(const [method,status,code]of [['POST',401,'SESSION_EXPIRED'],['POST',403,'ORIGIN_REJECTED'],['POST',502,'UPSTREAM_REJECTED'],['GET',403,'CSRF_REJECTED']]){const h=setup({realApi:true});h.c.installSessionSync();const work=h.c.api('/api/execute',{method,body:method==='POST'?{confirm:true}:undefined});h.fetches[0].resolve(response({ok:false,error:{code,message:'synthetic'}},status));await assert.rejects(work);await tick();assert.equal(h.fetches.length,1);assert.equal(h.syncEvents.length,0);}
 const h=setup({realApi:true});h.c.installSessionSync();const work=h.c.api('/api/execute',{method:'POST',body:{confirm:true}});h.fetches[0].resolve(new Response('<h1>not JSON</h1>',{status:403,headers:{'Content-Type':'text/html'}}));await assert.rejects(work,{code:'LOCAL_RESPONSE_UNREADABLE'});await tick();assert.equal(h.fetches.length,1);assert.equal(h.syncEvents.length,0);
});
test('pending old actual sync state is revoked before a newer local login and cannot clear it',async()=>{
 const h=setup({realApi:true,realSync:true});h.c.installSessionSync();h.target.emit('focus');await tick();assert.equal(h.fetches.length,1);const oldSignal=h.fetches[0].options.signal;h.c.invalidateSessionSync();h.c.authSequence++;h.c.sessionEpoch++;Object.assign(h.state,stateValue('newer-csrf',true,'session-sync-B'));assert.equal(oldSignal.aborted,true);h.fetches[0].resolve(response(stateValue('stale-csrf',false)));await tick();await tick();assert.equal(h.state.user.username,'session-sync-B');assert.equal(h.state.csrfToken,'newer-csrf');assert.equal(h.state.authenticated,true);assert.equal(h.profiles.length,0);h.c.sessionSynchronizer.dispose();
});
test('late failed actual profile hydration cannot log out a newer account or overwrite its profile cache',async()=>{
 const h=setup({realProfile:true});const work=h.c.refreshNativeProfile();assert.equal(h.calls.length,1);const old=h.c.flowResults.get('accountsummary:default');h.c.sessionEpoch++;h.c.clearPrivate();Object.assign(h.state,stateValue('newer-csrf',true,'session-sync-B'));const current={response:'newer'};h.c.flowResults.set('accountsummary:default',current);h.state.results.set('newer-profile',{data:'newer'});h.calls[0].reject(Object.assign(new Error('old synthetic expired'),{code:'SESSION_EXPIRED'}));await work;assert.notEqual(h.c.flowResults.get('accountsummary:default'),old);assert.equal(h.c.flowResults.get('accountsummary:default'),current);assert.equal(h.state.user.username,'session-sync-B');assert.equal(h.state.authenticated,true);assert.equal(h.state.results.has('newer-profile'),true);assert.equal(h.state.profileError,'');
});
test('manual bootstrap invalidates synchronization before reading and flushes only after its owned load clears',async()=>{
 const h=setup();h.c.installSessionSync();vm.runInContext(actual('load'),h.c);h.state.authenticated=false;const work=h.c.load();assert.equal(h.syncEvents[0],'invalidate');assert.equal(h.state.loading,true);assert.equal(h.calls[0].path,'/api/state');h.calls[0].resolve(stateValue('anonymous',false));await tick();assert.equal(h.calls[1].path,'/api/catalog');h.calls[1].resolve({operations:OPERATIONS});await work;assert.equal(h.state.loading,false);assert.equal(h.syncEvents.at(-1),'flush');assert.equal(h.profiles.length,0);
});
test('manual bootstrap adopts a same-name rotated cookie only after retiring private source contexts',async()=>{
 const h=setup();h.c.installSessionSync();vm.runInContext(actual('load'),h.c);const epoch=h.c.sessionEpoch,work=h.c.load();h.calls[0].resolve(stateValue('manual-bootstrap-new-csrf'));await tick();h.calls[1].resolve({operations:OPERATIONS});await work;assert.equal(h.state.csrfToken,'manual-bootstrap-new-csrf');assert.equal(h.state.user.username,'session-sync-A');assert.equal(h.c.sessionEpoch,epoch+1);assert.equal(h.state.points.length,0);assert.equal(h.state.results.size,0);assert.equal(h.c.flowResults.has('old-source'),false);assert.equal(h.profiles.length,1);assert.equal(h.profiles[0](),true);
});
test('actual login success broadcasts only after session rotation; failure flushes without broadcast',async()=>{
 for(const success of [true,false]){const h=setup();h.c.installSessionSync();h.state.authenticated=false;h.state.user=null;h.document.listeners.set('submit',[]);const handler=lines.find(line=>line.startsWith('document.addEventListener(')&&line.includes("api('/api/login'"));assert.ok(handler);vm.runInContext(handler,h.c);const form=h.document.body.appendChild(h.document.createElement('form'));form.setAttribute('id','login-form');form.innerHTML='<input name="username"><input name="password"><button type="submit">Masuk</button>';const values={username:{value:' session-sync-A '},password:{value:'synthetic-only'}};Object.defineProperty(form,'elements',{value:values});const error=h.document.body.appendChild(h.document.createElement('div'));error.setAttribute('id','login-error');const work=Promise.all(h.document.listeners.get('submit').map(fn=>fn({target:form,preventDefault(){}})));assert.equal(h.calls.length,1);assert.equal(h.syncEvents[0],'invalidate');assert.equal(h.c.authPending,true);if(success)h.calls[0].resolve(stateValue('login-csrf'));else h.calls[0].reject(new Error('synthetic rejected'));await work;assert.equal(values.password.value,'');assert.equal(h.c.authPending,false);assert.equal(h.syncEvents.filter(value=>value==='notify').length,success?1:0);assert.equal(h.syncEvents.at(-1),'flush');assert.equal(h.state.authenticated,success);}
});
test('actual logout broadcasts only after server rotation and flushes after failure without replay',async()=>{
 for(const success of [true,false]){const h=setup();h.c.installSessionSync();h.document.listeners.set('click',[]);const handler=lines.find(line=>line.startsWith('document.addEventListener(')&&line.includes("api('/api/logout'"));assert.ok(handler);vm.runInContext(handler,h.c);const button=h.document.body.appendChild(h.document.createElement('button'));button.setAttribute('data-action','logout');const work=Promise.all(h.document.listeners.get('click').map(fn=>fn({target:button,preventDefault(){}})));assert.equal(h.calls.length,1);assert.equal(h.calls[0].path,'/api/logout');assert.equal(h.syncEvents[0],'invalidate');assert.equal(h.c.logoutPending,true);if(success)h.calls[0].resolve(stateValue('logout-csrf',false));else h.calls[0].reject(new Error('synthetic rejected'));await work;assert.equal(h.c.logoutPending,false);assert.equal(h.syncEvents.filter(value=>value==='notify').length,success?1:0);assert.equal(h.syncEvents.at(-1),'flush');assert.equal(h.calls.length,1);assert.equal(h.state.authenticated,false);}
});
