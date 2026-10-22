// Execute current application functions with local session/catalog/profile fixtures.
import fs from 'node:fs';
import vm from 'node:vm';
import {createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry} from '../../webapp/collection-save-persil.js';
// Bind the real new host helpers/module to legacy VM fixtures; assertions and
// existing source-function renderers remain unchanged.
function createPersilFixtureContext(...args){
  const context=vm.createContext(...args);
  Object.assign(context,{createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry});
  const dependencies=new Set(['nativeResponseObject','nativeAccountSummary','collectionTab','collectionGroupCreated']);
  const declarations=String(source).split(/\r?\n/).filter(line=>/^(?:async )?function (?:persilMap\w+|resetPersilMaps|resetScanHost|scanDisposeLocation)\(/.test(line)||dependencies.has(line.match(/^(?:async )?function (\w+)\(/)?.[1])).join('\n');
  vm.runInContext(declarations,context);
  return context;
}

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);return line;
};
const names = ['resetSearchFileNavigation','resetPartnerNavigation','load', 'session', 'refreshNativeProfile', 'visibleNativeMenus', 'clearPrivate', 'collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','runFlow', 'execute', 'flowData', 'nativeResponseObject', 'nativeAccountSummary', 'loginCard'];
const profileOp = OPERATIONS.find(op => op.endpoint === 'account/account_summary');
assert.ok(profileOp?.enabled);
const copy = value => JSON.parse(JSON.stringify(value));
const profile = (overrides = {}, marker = 'PROFILE') => ({status: 200, data: {error: false, data: {roleUser: 'PERORANGAN', statusVerifikasi: 1, isIkd: false, nama: marker, ...overrides}}});
const sessionData = (username = 'synthetic-a') => ({authenticated: !!username, user: username ? {username} : null, csrfToken: 'synthetic-local-csrf', connection: {configured: true}});
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};
const flush = async () => {for (let i = 0; i < 12; i++) await Promise.resolve()};
const authError = () => Object.assign(new Error('Synthetic session expired'), {code: 'SESSION_EXPIRED'});

function harness() {
  const calls = [], records = [], toasts = [], renders = [], events = {};
  const modal = {open: false, innerHTML: '', close() {this.open = false}};
  let loginButton = {disabled: false, textContent: '', innerHTML: ''};const loginError = {textContent: ''};
  const state = {authenticated: false, user: null, operations: [], results: new Map(), points: [], activity: [], connection: {configured: true}, loading: false, profileError: '', loadError: '', catalogError: ''};
  const fixture = {session: sessionData(), catalog: {operations: [{...profileOp}]}, profile: profile()};
  const c = createPersilFixtureContext({route: 'accountsummary', state, sessionEpoch: 0, searchFileState: null, partnerFrame: null, loadSequence: 0, authSequence: 0, authPending: false, logoutPending: false, busy: false, detailSequence: 0, flowResults: new Map(), flowDetail: null, htDetailData: null, flowQuery: '', flowPageIndex: 0, comparison: null, comparisonSelection: {}, pending: null, selected: null,
    ready: op => op?.enabled === true, write: op => op?.effect === 'write',
    currentFlow: () => ({key: 'accountsummary:default', op: profileOp, tab: {}, def: {title: 'Data Akun'}}),
    $: selector => selector === '#modal' ? modal : selector.includes('button') ? loginButton : loginError,
    render: () => {
      renders.push({authenticated: state.authenticated, loading: state.loading, menus: copy(c.visibleNativeMenus()).map(row => row[0])});
      if (!state.authenticated) loginButton = {disabled: /<button type="submit"[^>]*\bdisabled\b/.test(c.loginCard()), textContent: '', innerHTML: ''};
    },
    record: (...args) => records.push(args), toast: message => toasts.push(message), icon: () => '', badge: () => '', esc: value => String(value ?? ''),
    document: {addEventListener: (event, handler) => {events[event] = handler}},
    api: async (path, options) => {
      calls.push({path, ...(options ? copy(options) : {})});
      if (path === '/api/state') return fixture.session;
      if (path === '/api/catalog') return fixture.catalog;
      if (path === '/api/execute') {assert.equal(options.body.operationId, profileOp.id);return {result: fixture.profile}}
      if (path === '/api/login') return fixture.session;
      if (path === '/api/logout') return sessionData(null);
      throw new Error(`Unexpected local fixture path ${path}`);
    },
  });
  vm.runInContext(lines.find(line => line.startsWith('const primaryMenus=')), c);
  vm.runInContext(names.map(get).join('\n'), c);
  vm.runInContext(lines.find(line => line.startsWith("document.addEventListener('submit'") && line.includes("form.id==='login-form'")), c);
  vm.runInContext(lines.find(line => line.startsWith("document.addEventListener('click'") && line.includes("action==='logout'")), c);
  return {c, state, fixture, calls, records, toasts, renders, events, modal, get loginButton() {return loginButton}, loginError};
}
const menuKeys = h => copy(h.c.visibleNativeMenus()).map(row => row[0]);
const profileCalls = h => h.calls.filter(call => call.path === '/api/execute');
const authenticate = h => {h.c.session(sessionData());h.state.operations = [{...profileOp}]};
function pauseProfiles(h) {
  const original = h.c.api, waits = [];
  h.c.api = (path, options) => {
    if (path !== '/api/execute') return original(path, options);
    assert.equal(options.body.operationId, profileOp.id);
    const wait = deferred();waits.push(wait);h.calls.push({path, ...copy(options)});return wait.promise;
  };
  return waits;
}
function pausePath(h, target) {
  const original = h.c.api, waits = [];
  h.c.api = (path, options) => {
    if (path !== target) return original(path, options);
    const wait = deferred();waits.push(wait);h.calls.push({path, ...(options ? copy(options) : {})});return wait.promise;
  };
  return waits;
}
const logout = h => h.events.click({target: {closest: () => ({dataset: {action: 'logout'}, disabled: false})}});
const signin = h => {
  const form = {id: 'login-form', elements: {username: {value: 'synthetic-new'}, password: {value: 'synthetic-fixture-password'}}};
  return {form, task: h.events.submit({target: form, preventDefault() {}})};
};
const genericProfile = h => {
  h.c.pending = {op: profileOp, values: {}, files: []};h.modal.open = true;
  const button = {disabled: false, textContent: ''};return {button, task: h.c.execute(button)};
};
const seedPrivate = h => {
  h.state.results.set('private-other', {data: 'old'});h.state.points.push({id: 'old-point'});h.state.activity.push('old-history');
  h.c.flowResults.set('old-private-flow', {response: 'old'});h.c.flowDetail = {private: true};h.c.htDetailData = {private: true};
  h.c.pending = {private: true};h.c.selected = 'old';h.c.comparison = {private: true};h.modal.open = true;h.modal.innerHTML = 'OLD PRIVATE';
};
const assertPrivateCleared = h => {
  assert.equal(h.state.results.has('private-other'), false);assert.equal(h.state.points.length, 0);assert.equal(h.state.activity.length, 0);
  assert.equal(h.c.flowResults.has('old-private-flow'), false);assert.equal(h.c.flowDetail, null);assert.equal(h.c.htDetailData, null);
  assert.equal(h.c.pending, null);assert.equal(h.c.selected, null);assert.equal(h.c.comparison, null);assert.equal(h.modal.open, false);assert.equal(h.modal.innerHTML, '');
};
const checks = [];
async function check(name, fn) {
  try {await fn(harness());checks.push({name, passed: true})}
  catch (error) {checks.push({name, passed: false, error: error.message})}
}

await check('authenticated page reload hydrates one profile after catalog and restores eligible menus', async h => {
  await h.c.load();
  assert.deepEqual(h.calls.map(call => call.path), ['/api/state', '/api/catalog', '/api/execute']);
  assert.deepEqual(profileCalls(h)[0].body, {operationId: profileOp.id, values: {}});
  assert.equal(h.state.authenticated, true);assert.equal(h.state.loading, false);
  assert.ok(menuKeys(h).includes('collections'));assert.ok(menuKeys(h).includes('activity'));
});
await check('anonymous startup never requests an account profile', async h => {
  h.fixture.session = sessionData(null);await h.c.load();
  assert.equal(profileCalls(h).length, 0);assert.equal(h.state.authenticated, false);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
});
await check('ordinary profile fetch failure preserves authentication and exposes profile retry state', async h => {
  h.c.session(sessionData());h.state.operations = [{...profileOp}];
  h.c.api = async () => {throw new Error('Synthetic profile timeout')};
  await h.c.refreshNativeProfile();
  assert.equal(h.state.authenticated, true);assert.match(h.state.profileError, /Synthetic profile timeout/);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
});
await check('malformed success envelope cannot expose eligibility-only account menus', h => {
  h.c.session(sessionData());h.state.operations = [{...profileOp}];
  for (const response of [{...profile(), status: 500}, {status: 200, data: {error: true, data: profile().data.data}}, {status: 200, data: {data: profile().data.data}}, {status: 200, data: profile().data.data}]) {
    h.state.results.set(profileOp.id, response);
    assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
  }
});
await check('native ineligible profiles keep Collection and Activity hidden', h => {
  authenticate(h);
  for (const fields of [{roleUser: 'BADANHUKUM'}, {roleUser: null}, {roleUser: ''}, {statusVerifikasi: -1}, {statusVerifikasi: '1'}, {statusVerifikasi: null}, {isIkd: true}]) {
    h.state.results.set(profileOp.id, profile(fields));assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
  }
});
await check('eligible integer verification statuses retain native menu order', h => {
  authenticate(h);
  for (const statusVerifikasi of [0, 1, 2]) {
    h.state.results.set(profileOp.id, profile({statusVerifikasi}));
    assert.deepEqual(menuKeys(h), ['dashboard', 'collections', 'scan', 'activity', 'account']);
  }
});
await check('a successful retry after profile failure restores eligible navigation', async h => {
  authenticate(h);const original = h.c.api;
  h.c.api = async () => {throw new Error('Synthetic profile timeout')};await h.c.refreshNativeProfile();
  h.c.api = original;await h.c.refreshNativeProfile();
  assert.equal(h.state.authenticated, true);assert.equal(h.state.profileError, '');
  assert.ok(menuKeys(h).includes('activity'));assert.ok(h.state.results.has(profileOp.id));
});
await check('profile auth expiry still clears the current account and private caches', async h => {
  authenticate(h);h.state.results.set('other-private', {});h.modal.open = true;h.modal.innerHTML = 'PRIVATE';
  h.c.api = async () => {throw authError()};await h.c.refreshNativeProfile();
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.state.results.size, 0);
  assert.equal(h.modal.open, false);assert.equal(h.modal.innerHTML, '');assert.equal(h.toasts.length, 1);
});
for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`profile ${outcome} after logout cannot restore private navigation`, async h => {
  authenticate(h);const waits = pauseProfiles(h), task = h.c.refreshNativeProfile();await flush();
  h.c.sessionEpoch++;h.c.clearPrivate();h.state.authenticated = false;h.state.user = null;
  if (outcome === 'success') waits[0].resolve({result: profile()});
  else waits[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old failure'));
  await task;
  assert.equal(h.state.results.size, 0);assert.equal(h.c.flowResults.size, 0);assert.equal(h.state.authenticated, false);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);assert.equal(h.records.length, 0);assert.equal(h.toasts.length, 0);
});
for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`old-account profile ${outcome} cannot alter a replacement session`, async h => {
  authenticate(h);const waits = pauseProfiles(h), task = h.c.refreshNativeProfile();await flush();
  h.c.session(sessionData('synthetic-b'));const newer = profile({roleUser: 'BADANHUKUM'}, 'NEWER ACCOUNT');h.state.results.set(profileOp.id, newer);
  if (outcome === 'success') waits[0].resolve({result: profile()});
  else waits[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old failure'));
  await task;
  assert.equal(h.state.authenticated, true);assert.equal(h.state.user.username, 'synthetic-b');assert.equal(h.state.results.get(profileOp.id), newer);
  assert.equal(h.state.profileError, '');assert.equal(h.records.length, 0);assert.equal(h.toasts.length, 0);
});
for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`older profile ${outcome} cannot overwrite newer manual account-summary success`, async h => {
  authenticate(h);const waits = pauseProfiles(h), old = h.c.refreshNativeProfile();await flush();
  const manual = h.c.runFlow();await flush();assert.equal(waits.length, 2);
  const newer = profile({roleUser: 'BADANHUKUM'}, 'MANUAL NEWER');waits[1].resolve({result: newer});await manual;
  const renderCount = h.renders.length, recordCount = h.records.length;
  if (outcome === 'success') waits[0].resolve({result: profile()});
  else waits[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old failure'));
  await old;
  assert.equal(h.state.results.get(profileOp.id), newer);assert.equal(h.c.flowResults.get('accountsummary:default').response, newer);
  assert.equal(h.state.authenticated, true);assert.equal(h.renders.length, renderCount);assert.equal(h.records.length, recordCount);
  assert.equal(h.toasts.length, 0);
});
await check('older profile success cannot replace a newer manual failure', async h => {
  authenticate(h);const waits = pauseProfiles(h), old = h.c.refreshNativeProfile();await flush();
  const manual = h.c.runFlow();await flush();assert.equal(waits.length, 2);
  waits[1].reject(new Error('New manual failure'));await manual;
  waits[0].resolve({result: profile()});await old;
  assert.match(h.c.flowResults.get('accountsummary:default').error, /New manual failure/);assert.equal(h.state.results.has(profileOp.id), false);
  assert.equal(h.state.authenticated, true);
});
await check('manual profile result still populates navigation through actual runFlow', async h => {
  authenticate(h);await h.c.runFlow();
  assert.equal(profileCalls(h).length, 1);assert.ok(menuKeys(h).includes('activity'));
  assert.equal(h.state.results.get(profileOp.id), h.fixture.profile);
});

await check('account summary parser accepts only the successful native object envelope', h => {
  const valid = profile();assert.equal(h.c.nativeAccountSummary(valid), valid.data.data);
  assert.deepEqual(copy(h.c.nativeAccountSummary({...valid, data: JSON.stringify(valid.data)})), valid.data.data);
  assert.deepEqual(copy(h.c.nativeAccountSummary({status: 200, data: {error: false, data: {}}})), {});
  for (const invalid of [null, {}, {...valid, status: '200'}, {...valid, status: 201}, {...valid, data: 'invalid json'}, {...valid, data: []},
    {status: 200, data: {error: 'false', data: valid.data.data}}, {status: 200, data: {error: false, data: []}},
    {status: 200, data: {error: false, data: null}}, {status: 200, data: {error: false, data: 'profile'}}]) {
    assert.equal(h.c.nativeAccountSummary(invalid), null);
  }
});
for (const entry of ['refresh', 'manual', 'generic']) await check(`${entry} profile writer rejects malformed envelopes and clears stale eligibility`, async h => {
  authenticate(h);h.state.results.set(profileOp.id, profile());
  h.fixture.profile = {status: 200, data: {error: true, data: profile().data.data}};
  if (entry === 'refresh') await h.c.refreshNativeProfile();
  else if (entry === 'manual') await h.c.runFlow();
  else await genericProfile(h).task;
  assert.equal(h.state.authenticated, true);assert.equal(h.state.results.has(profileOp.id), false);
  assert.match(h.state.profileError, /Respons profil/);assert.equal(h.c.flowResults.get('accountsummary:default').loading, false);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
});
await check('reload that observes replacement session hydrates the new account after clearing old caches', async h => {
  authenticate(h);seedPrivate(h);h.fixture.session = sessionData('synthetic-b');
  h.fixture.profile = profile({roleUser: 'BADANHUKUM'}, 'NEW ACCOUNT');const oldEpoch = h.c.sessionEpoch;
  await h.c.load();
  assert.equal(h.c.sessionEpoch, oldEpoch + 1);assert.equal(h.state.user.username, 'synthetic-b');assertPrivateCleared(h);
  assert.equal(profileCalls(h).length, 1);assert.equal(h.state.results.get(profileOp.id), h.fixture.profile);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);
});
await check('overlapping reloads accept only the latest state response and issue one catalog/profile chain', async h => {
  const states = pausePath(h, '/api/state'), first = h.c.load(), second = h.c.load();await flush();
  assert.equal(states.length, 2);states[1].resolve(sessionData('synthetic-b'));await second;
  states[0].resolve(sessionData('synthetic-a'));await first;
  assert.equal(h.state.user.username, 'synthetic-b');assert.equal(profileCalls(h).length, 1);
  assert.equal(h.calls.filter(call => call.path === '/api/catalog').length, 1);assert.equal(h.state.loading, false);
});
await check('obsolete catalog failure cannot overwrite the latest reload status', async h => {
  const catalogs = pausePath(h, '/api/catalog'), first = h.c.load();await flush();const second = h.c.load();await flush();
  catalogs[1].resolve(h.fixture.catalog);await second;catalogs[0].reject(new Error('Obsolete catalog failure'));await first;
  assert.equal(h.state.catalogError, '');assert.equal(profileCalls(h).length, 1);assert.equal(h.state.loading, false);
});
for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`new reload cancels a pending automatic profile before old ${outcome}`, async h => {
  authenticate(h);const profiles = pauseProfiles(h), first = h.c.load();await flush();
  assert.equal(profiles.length, 1);const oldOwner = h.c.flowResults.get('accountsummary:default');assert.equal(oldOwner.loading, true);
  const catalogs = pausePath(h, '/api/catalog'), second = h.c.load();await flush();
  assert.equal(h.c.flowResults.has('accountsummary:default'), false);
  if (outcome === 'success') profiles[0].resolve({result: profile({}, 'OLD AUTO')});
  else profiles[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old auto failure'));
  await first;assert.equal(h.state.authenticated, true);assert.equal(h.state.results.has(profileOp.id), false);assert.equal(h.toasts.length, 0);
  catalogs[0].resolve(h.fixture.catalog);await flush();assert.equal(profiles.length, 2);
  const newer = profile({}, 'NEW AUTO');profiles[1].resolve({result: newer});await second;
  assert.equal(h.state.results.get(profileOp.id), newer);assert.equal(h.c.flowResults.get('accountsummary:default').loading, false);
  assert.equal(h.state.profileError, '');assert.equal(h.state.loading, false);
});
for (const phase of ['pending', 'completed', 'failed']) await check(`manual profile ${phase} during catalog load owns the result without extra auto request`, async h => {
  authenticate(h);const profiles = pauseProfiles(h), catalogs = pausePath(h, '/api/catalog'), bootstrap = h.c.load();await flush();
  const manual = h.c.runFlow();await flush();assert.equal(profiles.length, 1);
  const owner = h.c.flowResults.get('accountsummary:default'), newer = profile({}, 'MANUAL DURING LOAD');
  if (phase === 'completed') {profiles[0].resolve({result: newer});await manual;}
  if (phase === 'failed') {profiles[0].reject(new Error('Manual timeout'));await manual;}
  catalogs[0].resolve(h.fixture.catalog);await bootstrap;
  assert.equal(profiles.length, 1);assert.equal(h.c.flowResults.get('accountsummary:default'), owner);
  if (phase === 'pending') {profiles[0].resolve({result: newer});await manual;}
  assert.equal(h.state.loading, false);
  if (phase === 'failed') {assert.equal(h.state.results.has(profileOp.id), false);assert.match(h.state.profileError, /Manual timeout/);}
  else assert.equal(h.state.results.get(profileOp.id), newer);
});
await check('manual profile already pending before reload is preserved and not duplicated', async h => {
  authenticate(h);const profiles = pauseProfiles(h), manual = h.c.runFlow();await flush();
  const owner = h.c.flowResults.get('accountsummary:default');await h.c.load();
  assert.equal(profiles.length, 1);assert.equal(h.c.flowResults.get('accountsummary:default'), owner);
  profiles[0].resolve({result: profile()});await manual;assert.ok(menuKeys(h).includes('activity'));
});
for (const unavailable of ['missing', 'disabled', 'write']) await check(`${unavailable} profile catalog entry does not trigger automatic reads`, async h => {
  h.fixture.catalog.operations = unavailable === 'missing' ? [] : [{...profileOp, ...(unavailable === 'disabled' ? {enabled: false} : {effect: 'write'})}];
  await h.c.load();assert.equal(profileCalls(h).length, 0);assert.equal(h.state.authenticated, true);assert.equal(h.state.loading, false);
});
for (const path of ['/api/state', '/api/catalog']) await check(`${path} failure suppresses auto hydration and next reload can recover`, async h => {
  authenticate(h);const original = h.c.api;let fail = true;
  h.c.api = (url, options) => url === path && fail ? Promise.reject(new Error('Synthetic bootstrap failure')) : original(url, options);
  await h.c.load();assert.equal(profileCalls(h).length, 0);assert.equal(h.state.authenticated, true);
  fail = false;await h.c.load();assert.equal(profileCalls(h).length, 1);assert.ok(menuKeys(h).includes('activity'));
  assert.equal(h.state.loadError, '');assert.equal(h.state.catalogError, '');
});
for (const guard of ['authPending', 'logoutPending']) await check(`reload is a no-op while ${guard}`, async h => {
  h.c[guard] = true;await h.c.load();assert.equal(h.calls.length, 0);assert.equal(h.renders.length, 0);assert.equal(h.state.loading, false);
});
await check('refresh accept predicate prevents a request before initiation', async h => {
  authenticate(h);await h.c.refreshNativeProfile(() => false);assert.equal(profileCalls(h).length, 0);assert.equal(h.c.flowResults.size, 0);
});
for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`refresh accept predicate rejects stale ${outcome} with no account effects`, async h => {
  authenticate(h);let accepts = true;const profiles = pauseProfiles(h), task = h.c.refreshNativeProfile(() => accepts);await flush();
  accepts = false;
  if (outcome === 'success') profiles[0].resolve({result: profile()});
  else profiles[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old rejected refresh'));
  await task;assert.equal(h.state.authenticated, true);assert.equal(h.state.results.size, 0);assert.equal(h.state.profileError, '');
  assert.equal(h.records.length, 0);assert.equal(h.toasts.length, 0);
});
for (const older of ['refresh', 'generic']) for (const outcome of ['success', 'ordinary failure', 'auth expiry']) await check(`older ${older} ${outcome} cannot overwrite the newer ${older === 'refresh' ? 'generic' : 'refresh'} profile`, async h => {
  authenticate(h);const profiles = pauseProfiles(h), first = older === 'refresh' ? h.c.refreshNativeProfile() : genericProfile(h).task;await flush();
  const second = older === 'refresh' ? genericProfile(h).task : h.c.refreshNativeProfile();await flush();assert.equal(profiles.length, 2);
  const newer = profile({roleUser: 'BADANHUKUM'}, 'LATEST INITIATED');profiles[1].resolve({result: newer});await second;
  const recordCount = h.records.length, toastCount = h.toasts.length;
  if (outcome === 'success') profiles[0].resolve({result: profile()});
  else profiles[0].reject(outcome === 'auth expiry' ? authError() : new Error('Old generic failure'));
  await first;assert.equal(h.state.results.get(profileOp.id), newer);assert.equal(h.c.flowResults.get('accountsummary:default').response, newer);
  assert.equal(h.state.authenticated, true);assert.equal(h.state.profileError, '');assert.equal(h.records.length, recordCount);assert.equal(h.toasts.length, toastCount);
});
await check('generic profile initiated during bootstrap remains owner after catalog resolves', async h => {
  authenticate(h);const profiles = pauseProfiles(h), catalogs = pausePath(h, '/api/catalog'), load = h.c.load();await flush();
  const manual = genericProfile(h).task;profiles[0].resolve({result: profile()});await manual;
  const owner = h.c.flowResults.get('accountsummary:default');catalogs[0].resolve(h.fixture.catalog);await load;
  assert.equal(profiles.length, 1);assert.equal(h.c.flowResults.get('accountsummary:default'), owner);assert.ok(menuKeys(h).includes('activity'));
});
await check('successful login clears all old private state before its one profile hydration', async h => {
  authenticate(h);seedPrivate(h);h.fixture.session = sessionData('synthetic-new');
  const profiles = pauseProfiles(h), login = signin(h);await flush();
  assertPrivateCleared(h);assert.equal(h.state.authenticated, true);assert.equal(h.state.user.username, 'synthetic-new');
  assert.equal(login.form.elements.password.value, '');assert.equal(profiles.length, 1);assert.equal(h.c.authPending, false);
  profiles[0].resolve({result: profile()});await login.task;assert.ok(menuKeys(h).includes('activity'));
});
await check('logout clears local account and all private state immediately before awaiting the server', async h => {
  authenticate(h);seedPrivate(h);const waits = pausePath(h, '/api/logout'), task = logout(h);await flush();
  assert.equal(h.c.logoutPending, true);assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assertPrivateCleared(h);
  assert.deepEqual(menuKeys(h), ['dashboard', 'scan', 'account']);waits[0].resolve(sessionData(null));await task;
  assert.equal(h.c.logoutPending, false);assert.equal(h.loginButton.disabled, false);
});
await check('login, reload and profile refresh cannot run while logout response is pending', async h => {
  authenticate(h);const waits = pausePath(h, '/api/logout'), task = logout(h);await flush();
  await signin(h).task;await h.c.load();await h.c.refreshNativeProfile();
  assert.deepEqual(h.calls.map(call => call.path), ['/api/logout']);waits[0].resolve(sessionData(null));await task;
  await signin(h).task;assert.equal(h.calls.filter(call => call.path === '/api/login').length, 1);assert.equal(h.state.authenticated, true);
});
await check('late login profile completion keeps the replacement login button disabled until pending logout completes', async h => {
  h.state.operations = [{...profileOp}];const profiles = pauseProfiles(h), logouts = pausePath(h, '/api/logout');
  const submittedButton = h.loginButton, login = signin(h);await flush();
  assert.equal(h.state.authenticated, true);assert.equal(profiles.length, 1);assert.equal(h.c.authPending, false);
  const leaving = logout(h);await flush();const replacementButton = h.loginButton;
  assert.notEqual(replacementButton, submittedButton);assert.equal(replacementButton.disabled, true);assert.equal(h.c.logoutPending, true);
  profiles[0].resolve({result: profile()});await login.task;
  assert.equal(h.loginButton, replacementButton);assert.equal(replacementButton.disabled, true);
  assert.equal(h.state.authenticated, false);assert.equal(h.state.results.size, 0);
  logouts[0].resolve(sessionData(null));await leaving;
  assert.equal(h.c.logoutPending, false);assert.equal(h.loginButton.disabled, false);
});
for (const outcome of ['success', 'failure']) await check(`obsolete logout ${outcome} cannot clear a replacement session`, async h => {
  authenticate(h);const waits = pausePath(h, '/api/logout'), task = logout(h);await flush();
  h.c.sessionEpoch++;h.c.session(sessionData('synthetic-replacement'));const newer = profile({}, 'REPLACEMENT');h.state.results.set(profileOp.id, newer);
  const renderCount = h.renders.length;
  if (outcome === 'success') waits[0].resolve(sessionData(null));else waits[0].reject(authError());await task;
  assert.equal(h.state.authenticated, true);assert.equal(h.state.user.username, 'synthetic-replacement');assert.equal(h.state.results.get(profileOp.id), newer);
  assert.equal(h.toasts.length, 0);assert.equal(h.renders.length, renderCount);assert.equal(h.c.logoutPending, false);
});
await check('failed current logout remains locally signed out and allows login retry', async h => {
  authenticate(h);const waits = pausePath(h, '/api/logout'), task = logout(h);waits[0].reject(new Error('Synthetic logout timeout'));await task;
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.c.logoutPending, false);assert.equal(h.toasts.length, 1);
  await signin(h).task;assert.equal(h.state.authenticated, true);assert.ok(menuKeys(h).includes('activity'));
});
for (const waitingAt of ['state', 'catalog', 'profile']) await check(`logout invalidates bootstrap waiting at ${waitingAt} without restoring account data`, async h => {
  const path = {state: '/api/state', catalog: '/api/catalog', profile: '/api/execute'}[waitingAt], waits = pausePath(h, path), task = h.c.load();await flush();
  assert.equal(waits.length, 1);await logout(h);
  waits[0].resolve(waitingAt === 'state' ? sessionData() : waitingAt === 'catalog' ? h.fixture.catalog : {result: profile()});await task;
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.state.results.size, 0);assert.equal(h.c.flowResults.size, 0);
  assert.equal(profileCalls(h).length, waitingAt === 'profile' ? 1 : 0);assert.equal(h.state.loading, false);
});
for (const outcome of ['success', 'failure']) await check(`old login ${outcome} after logout cannot reactivate the account`, async h => {
  const waits = pausePath(h, '/api/login'), login = signin(h);await flush();await logout(h);
  if (outcome === 'success') waits[0].resolve(sessionData());else waits[0].reject(authError());await login.task;
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.state.results.size, 0);assert.equal(profileCalls(h).length, 0);
  assert.equal(h.c.authPending, false);assert.equal(login.form.elements.password.value, '');
});

const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length, checks, network_calls: 0, scope: 'Actual load/session/profile/menu functions with synthetic local responses; bootstrap hydration and ownership regression, not production acceptance.'};
if (process.argv.includes('--write-report') || process.argv.includes('--baseline')) fs.writeFileSync(new URL(`../webapp/${process.argv.includes('--baseline') ? 'profile-bootstrap-before-fix' : 'profile-bootstrap-review-latest'}.json`, import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
