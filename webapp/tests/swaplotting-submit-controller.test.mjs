import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplottingSubmit,SWAPLOTTING_SUBMIT_COPY} from '../assets/swaplotting/submit-controller.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function setup(options={}){
 let current=true,sourceCurrent=true,available=true,captures=0;
 const calls=[],results=[],auth=[],backs=[],wait=deferred(),feedback=deferred();
 const state=createSwaplottingSubmit({capture:()=>{captures++;return options.capture?.()??{payload:{kind:'registered'},revision:1};},isSnapshotCurrent:()=>sourceCurrent,submit:options.submit??((payload,context)=>{calls.push({payload,context});return wait.promise;}),available:()=>available,isCurrent:()=>current,onSessionError:error=>auth.push(error),onResult:options.onResult??(result=>{results.push(result);return feedback.promise;}),onBack:()=>{backs.push('back');return true;}});
 return {state,calls,results,auth,backs,wait,feedback,captures:()=>captures,retire:()=>current=false,stale:()=>sourceCurrent=false,available:value=>available=value};
}
test('one intent stays locked through submission and asynchronous result feedback',async()=>{
 const h=setup(),work=h.state.begin();assert.equal(h.calls.length,1);assert.equal(await h.state.begin(),false);assert.equal(h.captures(),1);assert.equal(h.state.snapshot().pending,true);assert.equal(h.calls[0].context.isCurrent(),true);
 h.wait.resolve({success:true,attemptId:'opaque-local-attempt'});await new Promise(setImmediate);assert.deepEqual(h.results,[{success:true,attemptId:'opaque-local-attempt'}]);assert.equal(h.state.snapshot().stage,'result');assert.equal(h.state.snapshot().locked,true);assert.equal(await h.state.begin(),false);
 h.feedback.resolve({backToMap:true});assert.equal(await work,true);assert.deepEqual(h.backs,['back']);assert.equal(h.state.snapshot().stage,'idle');assert.equal(h.calls[0].context.isCurrent(),false);
});
test('native false invokes only result callback and permits a new explicit click after feedback',async()=>{
 const h=setup(),work=h.state.begin();h.wait.resolve({success:false});await new Promise(setImmediate);assert.equal(h.state.snapshot().locked,true);assert.deepEqual(h.results,[{success:false}]);assert.deepEqual(h.backs,[]);
 h.feedback.resolve({backToMap:true});assert.equal(await work,true);assert.equal(h.state.snapshot().canSubmit,true);assert.deepEqual(h.backs,[]);assert.equal(h.calls.length,1);
});
test('accepted true without completion directive remains terminal',async()=>{
 const h=setup({onResult:()=>undefined}),work=h.state.begin();h.wait.resolve({success:true});await work;assert.equal(h.state.snapshot().stage,'complete');assert.equal(h.state.snapshot().locked,true);assert.equal(await h.state.begin(),false);
});
test('result callback failure cannot replay an accepted write or invoke return',async()=>{
 const h=setup({onResult:()=>{throw new Error('UI failure');}}),work=h.state.begin();h.wait.resolve({success:true});await work;assert.equal(h.state.snapshot().stage,'completion-error');assert.equal(h.state.snapshot().message,'UI failure');assert.equal(h.state.snapshot().locked,false);assert.equal(await h.state.begin(),false);assert.deepEqual(h.backs,[]);
});
test('completion-failure directives show literal recovery text without replay or automatic return',async()=>{
 for(const success of [false,true]){
  const h=setup({onResult:()=>({completionFailed:true,message:'Activity refresh <failed>'})}),work=h.state.begin();h.wait.resolve({success});await work;assert.equal(h.state.snapshot().stage,'completion-error');assert.equal(h.state.snapshot().message,'Activity refresh <failed>');assert.equal(h.state.snapshot().canSubmit,false);assert.equal(h.state.snapshot().locked,false);assert.equal(h.calls.length,1);assert.deepEqual(h.backs,[]);
 }
});
test('explicit local not_sent failure preserves ability to make a fresh user intent',async()=>{
 const h=setup(),work=h.state.begin();h.wait.reject(Object.assign(new Error('Local review expired <literal>'),{delivery:'not_sent'}));assert.equal(await work,false);assert.equal(h.state.snapshot().stage,'error');assert.equal(h.state.snapshot().message,'Local review expired <literal>');assert.equal(h.state.snapshot().canSubmit,true);assert.deepEqual(h.results,[]);assert.equal(h.calls.length,1);
});
test('unknown delivery and malformed result remain terminal without invented native false',async()=>{
 for(const kind of ['thrown','unknown','malformed','wrongAttempt']){
  const h=setup(),work=h.state.begin();if(kind==='thrown')h.wait.reject(new Error('Network lost'));else if(kind==='unknown')h.wait.reject(Object.assign(new Error('Timeout'),{delivery:'unknown'}));else if(kind==='malformed')h.wait.resolve({success:'true'});else h.wait.resolve({success:true,attemptId:17});
  assert.equal(await work,false);assert.equal(h.state.snapshot().stage,'unknown');assert.equal(h.state.snapshot().message,SWAPLOTTING_SUBMIT_COPY.unknown);assert.equal(h.state.snapshot().requiresReload,true);assert.equal(await h.state.begin(),false);assert.deepEqual(h.results,[]);assert.deepEqual(h.backs,[]);
 }
});
test('only the three current auth codes notify session owner',async()=>{
 for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']){
  const h=setup(),work=h.state.begin();const error=Object.assign(new Error(code),{code});h.wait.reject(error);await work;assert.deepEqual(h.auth,[error]);assert.equal(h.state.snapshot().requiresReload,true);assert.deepEqual(h.results,[]);
 }
});
test('SESSION_CHANGED does not invalidate a replacement account or produce a result',async()=>{
 const h=setup(),work=h.state.begin();h.wait.reject(Object.assign(new Error('changed'),{code:'SESSION_CHANGED'}));await work;assert.equal(h.state.snapshot().stage,'stale');assert.equal(h.state.snapshot().requiresReload,true);assert.deepEqual(h.auth,[]);assert.deepEqual(h.results,[]);
});
test('source revocation immediately drops ownership and suppresses late success or auth',async()=>{
 for(const rejected of [false,true]){
  const h=setup(),work=h.state.begin();h.stale();assert.equal(h.calls[0].context.isCurrent(),false);assert.equal(h.state.snapshot().stage,'stale');assert.equal(h.state.snapshot().locked,false);
  if(rejected)h.wait.reject(Object.assign(new Error('old'),{code:'SESSION_EXPIRED'}));else h.wait.resolve({success:true});await work;assert.deepEqual(h.results,[]);assert.deepEqual(h.auth,[]);
 }
});
test('route retirement and disposal suppress pending callback and release capability',async()=>{
 for(const dispose of [false,true]){
  const h=setup(),work=h.state.begin();if(dispose)h.state.dispose();else h.retire();assert.equal(h.calls[0].context.isCurrent(),false);h.wait.resolve({success:true});await work;assert.deepEqual(h.results,[]);assert.deepEqual(h.backs,[]);assert.equal(h.state.snapshot().canSubmit,false);h.state.dispose();assert.equal(h.state.snapshot().stage,'disposed');
 }
});
test('revocation while the success dialog is open suppresses a late back directive',async()=>{
 const h=setup(),work=h.state.begin();h.wait.resolve({success:true});await new Promise(setImmediate);assert.equal(h.results.length,1);h.stale();h.feedback.resolve({backToMap:true});await work;assert.deepEqual(h.backs,[]);assert.equal(h.state.snapshot().stage,'stale');
});
test('unavailable adapter and invalid capture cannot stage or send',async()=>{
 const h=setup();h.available(false);assert.equal(await h.state.begin(),false);assert.equal(h.captures(),0);assert.equal(h.calls.length,0);
 let sent=0;const absent=createSwaplottingSubmit({capture:()=>null,isSnapshotCurrent:()=>true,submit:()=>{sent++;},available:()=>true});assert.equal(await absent.begin(),false);assert.equal(sent,0);
 const invalid=createSwaplottingSubmit({capture:()=>{throw new Error('Owned photo missing');},isSnapshotCurrent:()=>true,submit:()=>{sent++;},available:()=>true});assert.equal(await invalid.begin(),false);assert.equal(invalid.snapshot().stage,'error');assert.equal(sent,0);
});
