import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSessionSync, SESSION_SYNC_CHANNEL} from '../assets/session-sync.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return {promise, resolve, reject}; };
class Events {
  constructor() { this.events = new Map(); }
  addEventListener(type, listener) { if (!this.events.has(type)) this.events.set(type, new Set()); this.events.get(type).add(listener); }
  removeEventListener(type, listener) { this.events.get(type)?.delete(listener); }
  emit(type, extra = {}) { for (const listener of [...this.events.get(type) ?? []]) listener({type, ...extra}); }
  count(type) { return this.events.get(type)?.size ?? 0; }
}
const message = suffix => ({type:'sentuh-session-change', version:1, nonce:'s_' + suffix.repeat(16)});
function harness(options = {}) {
  const view = new Events(), doc = new Events(), channel = new Events();
  Object.assign(doc, {hidden:false, visibilityState:'visible'});
  Object.assign(channel, {sent:[], closed:0, postMessage(data) { this.sent.push(data); }, close() { this.closed++; }});
  const calls = [], applied = [], errors = [], names = [];
  let permitted = true, generation = 0, active = 0, maximumActive = 0;
  const manager = createSessionSync({
    readState: args => {
      assert.deepEqual(Object.keys(args), ['signal']);
      assert.equal(args.signal instanceof AbortSignal, true);
      const wait = deferred(), call = {...args, ...wait};
      calls.push(call); active++; maximumActive = Math.max(maximumActive, active);
      if (options.honorAbort) args.signal.addEventListener('abort', () => wait.reject(Object.assign(new Error('Synthetic abort'), {name:'AbortError'})), {once:true});
      return wait.promise.finally(() => { active--; });
    },
    applyState: async (data, context) => { applied.push({data, context}); await options.apply?.(data, context); },
    canCheck: () => permitted,
    getGeneration: () => generation,
    eventTarget:view,
    document:doc,
    channelFactory: name => { names.push(name); return channel; },
    onError: (error, context) => { errors.push({error, context}); },
    ...options.callbacks,
  });
  return {manager,view,doc,channel,calls,applied,errors,names,
    permit(value) { permitted = value; },
    nextGeneration() { generation++; },
    get maximumActive() { return maximumActive; },
    hide(value) { doc.hidden = value; doc.visibilityState = value ? 'hidden' : 'visible'; doc.emit('visibilitychange'); },
  };
}

test('construction binds optional events but performs no read or broadcast', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); await tick();
  assert.equal(h.calls.length, 0); assert.deepEqual(h.channel.sent, []);
  assert.deepEqual(h.names, [SESSION_SYNC_CHANNEL]);
  assert.equal(h.view.count('focus'), 1); assert.equal(h.view.count('pageshow'), 1); assert.equal(h.doc.count('visibilitychange'), 1);
});

test('manual check reads once with only an abort signal and applies its guarded data', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  const work = h.manager.check('manual'); await tick();
  assert.equal(h.calls.length, 1); assert.equal(h.applied.length, 0);
  const data = {authenticated:false, csrfToken:'SYNTHETIC_LOCAL_ONLY'};
  h.calls[0].resolve(data); assert.equal(await work, true);
  assert.equal(h.applied[0].data, data); assert.equal(h.applied[0].context.reason, 'manual');
  assert.deepEqual(Object.keys(h.applied[0].context).sort(), ['generation','isCurrent','reason']);
  assert.equal(await h.manager.flush(), false); assert.equal(h.calls.length, 1);
});

test('focus, pageshow and visibility events in one turn coalesce into one local GET', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  h.view.emit('focus'); h.view.emit('pageshow'); h.doc.emit('visibilitychange'); await tick();
  assert.equal(h.calls.length, 1); h.calls[0].resolve('latest'); await tick();
  assert.deepEqual(h.applied.map(item => item.data), ['latest']);
  assert.equal(h.applied[0].context.reason, 'visibility');
});

test('events during a pending read abort and revoke it, coalescing one nonparallel follow-up', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  const old = h.manager.check(); await tick();
  h.view.emit('focus'); h.view.emit('pageshow'); h.view.emit('focus'); await tick();
  assert.equal(h.calls[0].signal.aborted, true); assert.equal(h.calls.length, 1);
  h.calls[0].resolve('retired'); assert.equal(await old, false); await tick();
  assert.equal(h.calls.length, 2); assert.equal(h.applied.length, 0);
  h.calls[1].resolve('fresh'); await tick();
  assert.deepEqual(h.applied.map(item => item.data), ['fresh']); assert.equal(h.maximumActive, 1);
});

test('abort-aware reads settle before exactly one newer read starts', async t => {
  const h = harness({honorAbort:true}); t.after(() => h.manager.dispose());
  const old = h.manager.check(); await tick(); h.manager.check('focus'); h.manager.check('pageshow');
  assert.equal(await old, false); await tick(); assert.equal(h.calls.length, 2);
  h.calls[1].resolve('fresh'); await tick(); assert.deepEqual(h.applied.map(item => item.data), ['fresh']);
  assert.equal(h.maximumActive, 1); assert.equal(h.errors.length, 0);
});

test('hidden checks resolve as deferred and a later flush releases one read', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  h.doc.hidden = true;
  assert.equal(await h.manager.check('manual'), false); h.view.emit('focus'); h.view.emit('pageshow'); await tick();
  assert.equal(h.calls.length, 0); h.doc.hidden = false;
  const work = h.manager.flush(); await tick(); assert.equal(h.calls.length, 1);
  h.calls[0].resolve('visible'); assert.equal(await work, true);
});

test('visibilityState hidden also defers and visible event resumes without an interval', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); h.doc.visibilityState = 'hidden';
  h.view.emit('focus'); await tick(); assert.equal(h.calls.length, 0);
  h.doc.visibilityState = 'visible'; h.doc.emit('visibilitychange'); await tick();
  assert.equal(h.calls.length, 1); h.calls[0].resolve('visible'); await tick();
  assert.equal(h.applied.length, 1); await tick(); assert.equal(h.calls.length, 1);
});

test('canCheck pause retains only one deferred event until flush', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); h.permit(false);
  await h.manager.check('manual'); await h.manager.check('focus'); h.view.emit('pageshow');
  assert.equal(await h.manager.flush(), false); assert.equal(h.calls.length, 0);
  h.permit(true); const work = h.manager.flush(); await tick();
  assert.equal(h.calls.length, 1); h.calls[0].resolve('allowed'); assert.equal(await work, true);
});

test('becoming paused while a read is pending drops its response and defers a fresh check', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick();
  h.permit(false); h.calls[0].resolve('must not apply'); assert.equal(await work, false);
  assert.equal(h.applied.length, 0); assert.equal(h.calls.length, 1);
  h.permit(true); const fresh = h.manager.flush(); await tick(); assert.equal(h.calls.length, 2);
  h.calls[1].resolve('current'); assert.equal(await fresh, true);
});

test('a read failing while paused retains one deferred state check without reporting to a retired owner', async t => {
  const h=harness();t.after(()=>h.manager.dispose());const work=h.manager.check();await tick();h.permit(false);
  h.calls[0].reject(Error('Synthetic failure while paused'));assert.equal(await work,false);assert.equal(h.errors.length,0);assert.equal(h.calls.length,1);
  h.permit(true);const fresh=h.manager.flush();await tick();assert.equal(h.calls.length,2);h.calls[1].resolve('fresh');assert.equal(await fresh,true);
});

test('becoming hidden aborts old work and visible events queue one fresh read', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick();
  h.hide(true); assert.equal(h.calls[0].signal.aborted, true); h.calls[0].resolve('old'); assert.equal(await work, false);
  await tick(); assert.equal(h.calls.length, 1); h.hide(false); await tick();
  assert.equal(h.calls.length, 2); h.calls[1].resolve('current'); await tick(); assert.equal(h.applied.length, 1);
});

test('invalidate aborts a pending read and discards previously queued follow-up events', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick();
  h.manager.check('focus'); h.manager.invalidate(); h.calls[0].resolve('old'); assert.equal(await work, false);
  assert.equal(await h.manager.flush(), false); await tick(); assert.equal(h.calls.length, 1); assert.equal(h.applied.length, 0);
});

test('invalidate before scheduled microtask resolves false without making a read', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); h.manager.invalidate();
  assert.equal(await work, false); await tick(); assert.equal(h.calls.length, 0);
});

test('a newer root auth/load generation rejects an older response without applying or retrying', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick();
  h.nextGeneration(); h.calls[0].resolve('old generation'); assert.equal(await work, false);
  assert.equal(h.applied.length, 0); assert.equal(h.errors.length, 0); assert.equal(await h.manager.flush(), false);
  const fresh = h.manager.check(); await tick(); h.calls[1].resolve('new generation'); assert.equal(await fresh, true);
});

test('a current read error reports once and never automatically retries', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check('manual'); await tick();
  const error = Error('Synthetic local read failure'); h.calls[0].reject(error); assert.equal(await work, false);
  assert.equal(h.errors.length, 1); assert.equal(h.errors[0].error, error); assert.equal(h.errors[0].context.reason, 'manual');
  await tick(); assert.equal(h.calls.length, 1); assert.equal(await h.manager.flush(), false);
  const retry = h.manager.check(); await tick(); h.calls[1].resolve('recover'); assert.equal(await retry, true);
});

test('stale or aborted read errors cannot notify the current owner', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick();
  h.manager.invalidate(); h.calls[0].reject(Error('Retired local failure')); assert.equal(await work, false); assert.equal(h.errors.length, 0);
  const current = h.manager.check(); await tick(); h.calls[1].reject(Object.assign(Error('Browser aborted'), {name:'AbortError'}));
  assert.equal(await current, false); assert.equal(h.errors.length, 0); assert.equal(h.calls.length, 2);
});

test('async application receives an owner guard and follow-up waits until it releases', async t => {
  const applying = deferred(), writes = [];
  const h = harness({apply:async (data, context) => { if(data==='old'){await applying.promise;if(context.isCurrent())writes.push(data);}else writes.push(data); }});
  t.after(() => h.manager.dispose()); const work = h.manager.check(); await tick(); h.calls[0].resolve('old'); await tick();
  assert.equal(h.applied[0].context.isCurrent(), true); h.manager.check('focus');
  assert.equal(h.applied[0].context.isCurrent(), false); await tick(); assert.equal(h.calls.length, 1);
  applying.resolve(); await work; await tick(); assert.equal(h.calls.length, 2);
  h.calls[1].resolve('fresh'); await tick(); assert.deepEqual(writes, ['fresh']);
});

test('notify sends only fixed protocol fields and an opaque nonce, with no local request', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  assert.equal(h.manager.notify({csrfToken:'MUST_NOT_SEND',user:'MUST_NOT_SEND'}), true);
  assert.equal(h.manager.notify(), true); await tick(); assert.equal(h.calls.length, 0);
  assert.equal(h.channel.sent.length, 2);
  for(const data of h.channel.sent){assert.deepEqual(Object.keys(data).sort(), ['nonce','type','version']);assert.equal(data.type,'sentuh-session-change');assert.equal(data.version,1);assert.match(data.nonce,/^s_[A-Za-z0-9_-]{16,80}$/);assert.doesNotMatch(JSON.stringify(data),/MUST_NOT_SEND|csrfToken|username|password|authenticated/);}
  assert.notEqual(h.channel.sent[0].nonce,h.channel.sent[1].nonce);
});

test('one valid broadcast schedules a read and duplicate/self notices do not revoke it', async t => {
  const h = harness(); t.after(() => h.manager.dispose()); const data = message('a');
  h.channel.emit('message',{data}); await tick(); assert.equal(h.calls.length, 1);
  h.channel.emit('message',{data}); assert.equal(h.calls[0].signal.aborted,false);
  h.manager.notify(); h.channel.emit('message',{data:h.channel.sent[0]}); assert.equal(h.calls[0].signal.aborted,false);
  h.calls[0].resolve('broadcast'); await tick(); assert.equal(h.applied.length, 1); assert.equal(h.calls.length, 1);
});

test('invalid, extra-field or credential-bearing broadcast payloads are ignored', async t => {
  const h = harness(); t.after(() => h.manager.dispose());
  for(const data of [null,[],true,'SYNTHETIC_TOKEN',{},message('!'),{...message('b'),version:2},{...message('c'),type:'other'},{...message('d'),user:{username:'SYNTHETIC'}},{...message('e'),csrfToken:'SYNTHETIC'}, {...message('f'),nonce:'s_'+ 'x'.repeat(81)}])h.channel.emit('message',{data});
  await tick(); assert.equal(h.calls.length, 0); assert.equal(h.channel.sent.length, 0);
});

test('absent BroadcastChannel support does not disable local focus checks', async t => {
  const h = harness({callbacks:{channelFactory:()=>{throw Error('Unsupported');}}}); t.after(() => h.manager.dispose());
  assert.equal(h.manager.notify(),false); h.view.emit('focus'); await tick(); assert.equal(h.calls.length,1);
  h.calls[0].resolve('focus fallback'); await tick(); assert.equal(h.applied.length,1);
});

test('missing event targets and a null channel still support explicit checks', async t => {
  const values = [], manager = createSessionSync({readState:async()=>({authenticated:false}),applyState:data=>values.push(data),eventTarget:{},document:{},channelFactory:null});
  t.after(()=>manager.dispose()); assert.equal(await manager.check(),true); assert.equal(values.length,1); assert.equal(manager.notify(),false);
});

test('onmessage-only channel fallback is cleaned up without overwriting a newer handler', async t => {
  const channel = {onmessage:null,closed:0,postMessage(){},close(){this.closed++;}}, h = harness({callbacks:{channelFactory:()=>channel}});
  t.after(()=>h.manager.dispose()); assert.equal(typeof channel.onmessage,'function'); channel.onmessage({data:message('g')});await tick();assert.equal(h.calls.length,1);
  h.calls[0].resolve('fallback');await tick(); const newer=()=>{};channel.onmessage=newer;h.manager.dispose();assert.equal(channel.onmessage,newer);assert.equal(channel.closed,1);
});

test('dispose removes listeners, closes once, aborts work and ignores late responses/events', async () => {
  const h=harness(),work=h.manager.check();await tick();h.manager.dispose();h.manager.dispose();
  assert.equal(h.calls[0].signal.aborted,true);assert.equal(h.view.count('focus'),0);assert.equal(h.view.count('pageshow'),0);assert.equal(h.doc.count('visibilitychange'),0);assert.equal(h.channel.count('message'),0);assert.equal(h.channel.closed,1);
  h.calls[0].resolve('late');assert.equal(await work,false);h.view.emit('focus');h.channel.emit('message',{data:message('h')});assert.equal(await h.manager.check(),false);assert.equal(await h.manager.flush(),false);assert.equal(h.manager.notify(),false);await tick();assert.equal(h.calls.length,1);assert.equal(h.applied.length,0);
});

test('notify posting failure and diagnostics failure do not affect later explicit recovery', async t => {
  const h=harness({callbacks:{onError:()=>{throw Error('Diagnostic unavailable');}}});t.after(()=>h.manager.dispose());h.channel.postMessage=()=>{throw Error('Channel closed');};assert.equal(h.manager.notify(),false);
  const old=h.manager.check();await tick();h.calls[0].reject(Error('Synthetic unavailable'));assert.equal(await old,false);const fresh=h.manager.check();await tick();h.calls[1].resolve('recovered');assert.equal(await fresh,true);
});

test('throwing readiness/generation callbacks fail closed and can recover on a later event', async t => {
  let readiness=true,brokenGeneration=true;
  const h=harness({callbacks:{canCheck:()=>{if(!readiness)throw Error('Paused');return true;},getGeneration:()=>{if(brokenGeneration)throw Error('No generation');return 0;}}});t.after(()=>h.manager.dispose());
  assert.equal(await h.manager.check(),false);assert.equal(h.calls.length,0);readiness=false;brokenGeneration=false;assert.equal(await h.manager.flush(),false);readiness=true;const work=h.manager.flush();await tick();assert.equal(h.calls.length,1);h.calls[0].resolve('recovered');assert.equal(await work,true);
});

test('module has no fetch, POST, persistence, interval or credential-bearing message implementation', () => {
  const source=fs.readFileSync(new URL('../assets/session-sync.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bfetch\s*\(|localStorage|sessionStorage|setInterval\s*\(|document\.cookie|['"]\/api\/(?:login|logout|execute)['"]/);
  assert.throws(()=>createSessionSync({readState:()=>{}}),TypeError);assert.throws(()=>createSessionSync({applyState:()=>{}}),TypeError);
});
