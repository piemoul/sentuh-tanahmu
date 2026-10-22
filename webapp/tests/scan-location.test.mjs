import test from 'node:test';
import assert from 'node:assert/strict';
import {createScanLocationController,scanLocationPlan} from '../scan-location.js';
import {OPERATIONS} from '../private/operations.mjs';
const RAW='  SYNTHETIC: /?+%2F <tag>  ',CONTEXT='SYNTHETIC opaque context';
const ids={pbt:'post-apis-getpbteldetail-d3d134',kkpr:'post-apis-getkkprdetail-d311e8',generic:'get-apis-getgeojsoninfo-d39f1c'};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function harness({operations=OPERATIONS,validate=()=>{}}={}){
  const calls=[],auth=[],changes=[],records=[],owner={};let valid=true;
  const pending={pbt:deferred(),kkpr:deferred(),generic:deferred()};
  const controller=createScanLocationController({getOperations:()=>operations,isCurrent:context=>valid&&context===owner,api:(path,options)=>{calls.push({path,...options});const kind=Object.keys(ids).find(kind=>ids[kind]===options.body.operationId);assert.ok(kind);return pending[kind].promise;},onChange:value=>changes.push(value),onAuthError:error=>auth.push(error),record:(...args)=>records.push(args),validate});
  const open=(type,q=RAW)=>controller.open({type,q,scanContextId:CONTEXT},owner);
  const reply=(kind,status=200)=>pending[kind].resolve({result:{status,data:{error:false,data:{kind}}}});
  return{controller,calls,auth,changes,records,open,reply,pending,owner,invalidate(){valid=false;}};
}
test('native type selects PBT then generic, KKPR exclusively, and other types generic',()=>{
  assert.deepEqual(scanLocationPlan('PetaBidangElektronik'),['pbt','generic']);
  assert.deepEqual(scanLocationPlan('KKPR'),['kkpr']);
  for(const type of ['',null,undefined,'kkpr','Other'])assert.deepEqual(scanLocationPlan(type),['generic']);
});
for(const q of ['',RAW])test(`PBT dispatches both raw-q reads before either settles (${JSON.stringify(q)})`,async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik',q);
  assert.deepEqual(h.calls.map(call=>call.body),[
    {operationId:ids.pbt,values:{q},scanContextId:CONTEXT},
    {operationId:ids.generic,values:{q},scanContextId:CONTEXT},
  ]);assert.equal(h.controller.snapshot().active,'generic');assert.equal(h.controller.snapshot().loading,true);
  h.reply('generic');await tick();assert.equal(h.controller.snapshot().branches[1].stage,'ready');assert.equal(h.controller.snapshot().branches[0].stage,'loading');
  h.reply('pbt');assert.equal(await work,true);assert.equal(h.controller.snapshot().loading,false);
});
for(const failed of ['pbt','generic'])test(`${failed} ordinary failure does not gate or remove the other PBT branch`,async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik');h.pending[failed].reject(Error('SYNTHETIC raw diagnostics never shown'));
  const other=failed==='pbt'?'generic':'pbt';h.reply(other);assert.equal(await work,true);
  const state=h.controller.snapshot();assert.equal(state.branches.find(branch=>branch.kind===failed).stage,'error');assert.equal(state.branches.find(branch=>branch.kind===other).stage,'ready');assert.doesNotMatch(JSON.stringify(state),/raw diagnostics/);assert.equal(h.calls.length,2);
});
test('opposite PBT completion order preserves generic foreground and independently selectable panes',async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik');h.reply('pbt');await tick();assert.equal(h.controller.snapshot().active,'generic');assert.equal(h.controller.select('pbt'),true);h.reply('generic');await work;assert.equal(h.controller.snapshot().active,'pbt');assert.equal(h.controller.select('__proto__'),false);assert.equal(h.controller.select('generic'),true);
});
test('KKPR requests only its own endpoint and uses the same captured context',async()=>{
  const h=harness(),work=h.open('KKPR');assert.equal(h.calls.length,1);assert.equal(h.calls[0].body.operationId,ids.kkpr);h.reply('kkpr');assert.equal(await work,true);assert.equal(h.controller.snapshot().branches.length,1);assert.equal(h.controller.snapshot().active,'kkpr');
});
test('ordinary location uses only generic endpoint; snapshots omit q and opaque context',async()=>{
  const h=harness(),work=h.open('Other');h.reply('generic');assert.equal(await work,true);assert.equal(h.calls.length,1);assert.equal(h.calls[0].body.operationId,ids.generic);assert.doesNotMatch(JSON.stringify(h.controller.snapshot())+JSON.stringify(h.changes)+JSON.stringify(h.records),/SYNTHETIC:|opaque context/);
});
test('original null/invalid q and unavailable context do not invent a request',async()=>{
  const h=harness();for(const q of [null,undefined,42,{},[]])assert.equal(await h.controller.open({type:'KKPR',q,scanContextId:CONTEXT},h.owner),false);
  for(const scanContextId of ['',null,42,'x'.repeat(257)])assert.equal(await h.controller.open({type:'KKPR',q:RAW,scanContextId},h.owner),false);
  assert.equal(h.calls.length,0);assert.equal(h.controller.snapshot(),null);
});
test('unsupported operation scope fails its own pane without blocking a valid generic read',async()=>{
  const operations=OPERATIONS.map(op=>op.id===ids.pbt?{...op,method:'DELETE'}:op),h=harness({operations}),work=h.open('PetaBidangElektronik');assert.equal(h.calls.length,1);assert.equal(h.controller.snapshot().branches[0].stage,'error');h.reply('generic');assert.equal(await work,true);
});
test('reset/closed dialog suppress late success, errors and authentication changes',async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik'),changes=h.changes.length;h.controller.reset();h.reply('pbt');h.pending.generic.reject(Object.assign(Error('SYNTHETIC expiry'),{code:'SESSION_EXPIRED'}));assert.equal(await work,false);assert.equal(h.controller.snapshot(),null);assert.equal(h.auth.length,0);assert.equal(h.changes.length,changes);
});
test('old attempt completion cannot publish into a new location plan',async()=>{
  const h=harness(),old=h.open('PetaBidangElektronik'),recent=h.open('KKPR');h.reply('pbt');h.reply('generic');assert.equal(await old,false);assert.equal(h.controller.snapshot().active,'kkpr');assert.equal(h.controller.snapshot().branches[0].stage,'loading');h.reply('kkpr');assert.equal(await recent,true);
});
test('route/session ownership change suppresses all later publication and auth handling',async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik'),changes=h.changes.length;h.invalidate();h.pending.pbt.reject(Object.assign(Error('SYNTHETIC expiry'),{code:'AUTH_REQUIRED'}));h.reply('generic');assert.equal(await work,false);assert.equal(h.auth.length,0);assert.equal(h.changes.length,changes);assert.equal(h.controller.select('pbt'),false);
});
for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED'])test(`current ${code} retires both branches and notifies auth once`,async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik');h.pending.pbt.reject(Object.assign(Error('SYNTHETIC active expiry'),{code}));await tick();assert.equal(h.auth.length,1);assert.equal(h.controller.snapshot(),null);h.pending.generic.reject(Object.assign(Error('SYNTHETIC other expiry'),{code}));assert.equal(await work,false);assert.equal(h.auth.length,1);
});
for(const code of ['SESSION_CHANGED','SCAN_CONTEXT_INVALID'])test(`${code} is an ordinary location failure without classifier replay/logout`,async()=>{
  const h=harness(),work=h.open('PetaBidangElektronik');h.pending.pbt.reject(Object.assign(Error('SYNTHETIC recoverable read failure'),{code}));h.reply('generic');assert.equal(await work,true);assert.equal(h.auth.length,0);assert.equal(h.calls.length,2);assert.equal(h.controller.snapshot().branches[0].error,'SYNTHETIC recoverable read failure');
});
test('validation failure is isolated and never publishes an invalid model',async()=>{
  const h=harness({validate(kind,result){assert.equal(result.status,200);if(kind==='pbt')throw Error('SYNTHETIC invalid model');}}),work=h.open('PetaBidangElektronik');h.reply('pbt');h.reply('generic');assert.equal(await work,true);const pbt=h.controller.snapshot().branches[0];assert.equal(pbt.stage,'error');assert.equal(pbt.response,null);assert.doesNotMatch(pbt.error,/invalid model/);
});
