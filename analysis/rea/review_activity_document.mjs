// Actual application functions, deferred in-process responses and synthetic DOM only.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);return line;
};
const names = ['resetSearchFileNavigation','resetPartnerNavigation','nativeResponseObject','nativeDocumentProfileName','activityItem','activityRows','activityCategories','activityMatches','activityDetailTarget','activityDeleteOperation','activityCard','activityDocumentType','activityDocumentGeoControls','loadActivityDetail','loadActivityDocument','spsDocumentLinks','clearPrivate','collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','showFlowDetail','nativeListMode','flowData','dataItems'];
const declarations = names.map(get).join('\n');
const endpoints = {profile: 'account/account_summary', pdf: 'apis/GetDocument', metadata: 'apis/GetDocumentType'};
const operations = Object.fromEntries(Object.entries(endpoints).map(([key, endpoint]) => [key, OPERATIONS.find(op => op.endpoint === endpoint && op.enabled && op.effect === 'read')]));
for (const [key, op] of Object.entries(operations)) assert.ok(op, `Missing read adapter ${key}`);
const item = {userActivityId: 'ACTIVITY-FIXTURE', activityType: 'SCANDOKUMEN', contentId: ' selected : full & + ', title: 'Synthetic document', subTitle: 'Dokumen elektronik', createdAt: null};
const profile = nama => ({status: 200, data: {error: false, data: {nama, username: 'NEVER-USE-USERNAME', namaPemilik: 'NEVER-USE-OWNER'}}});
const pdf = {status: 200, contentType: 'application/pdf', downloadUrl: '/api/download/document-fixture', previewUrl: '/api/preview/document-fixture'};
const metadata = (showRoute = 0, type = 'FIXTURE', error = false) => ({status: 200, data: {error, data: {showRoute, type}}});
const responses = {profile: profile(' Exact Profile & + '), pdf, metadata: metadata()};
const copy = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};
const flush = async () => {for (let i = 0; i < 8; i++) await Promise.resolve()};

function harness() {
  const calls = [], records = [], toasts = [], events = {}, slots = [];
  let markup = '';
  const modal = {open: false, slot: null, button: null, showModal() {this.open = true}, close() {this.open = false},
    get innerHTML() {return markup},
    set innerHTML(value) {
      if (this.slot) this.slot.isConnected = false;
      if (this.button) this.button.isConnected = false;
      markup = value;
      this.slot = value.includes('activity-document-result') ? {innerHTML: 'loading', isConnected: true} : null;
      this.button = value.includes('data-action="activity-document"') ? {disabled: true, isConnected: true} : null;
      if (this.slot) slots.push(this.slot);
    },
    querySelector(selector) {return selector === '.activity-document-result' ? this.slot : selector === '[data-action="activity-document"]' ? this.button : null},
  };
  const context = {key: 'activity:default', def: {title: 'Aktivitas'}, tab: {}, op: OPERATIONS.find(op => op.endpoint === 'activity/GetUserActivity')};
  const state = {authenticated: true, loading: false, connection: {configured: true}, user: {username: 'NEVER-USE-USERNAME'}, operations: OPERATIONS.map(op => ({...op})), results: new Map(), points: [], activity: []};
  const c = vm.createContext({state, sessionEpoch: 0, searchFileState: null, partnerFrame: null, detailSequence: 0, flowDetail: null, htDetailData: null, flowQuery: '', flowResults: new Map(), comparison: null, comparisonSelection: {}, pending: null, selected: null,
    route: 'activity', currentFlow: () => context, ready: op => op.enabled === true, write: op => op.effect === 'write', $: () => modal,
    icon: () => '', notice: text => text, empty: text => text, render: () => {}, toast: text => toasts.push(text), record: (...args) => records.push(args),
    document: {addEventListener: (name, handler) => {events[name] = handler}},
    api: async (path, options) => {
      const stage = Object.keys(operations).find(key => operations[key].id === options.body.operationId);
      calls.push({stage, path, ...copy(options.body)});
      assert.ok(stage, `Unexpected operation ${options.body.operationId}`);
      return {result: responses[stage]};
    },
  });
  vm.runInContext(declarations, c);
  const esc = lines.find(line => line.startsWith('const $='));vm.runInContext(`globalThis.esc=${esc.slice(esc.indexOf('esc=') + 4)}`, c);
  vm.runInContext(lines.find(line => line.startsWith("document.addEventListener('click'") && line.includes('loadActivityDocument(flowDetail)')), c);
  return {c, state, modal, calls, records, toasts, events, slots, context};
}

function pauseAt(h, stage) {
  const d = deferred();
  h.c.api = async (path, options) => {
    const current = Object.keys(operations).find(key => operations[key].id === options.body.operationId);
    h.calls.push({stage: current, path, ...copy(options.body)});
    assert.ok(current, `Unexpected operation ${options.body.operationId}`);
    return current === stage ? d.promise : {result: responses[current]};
  };
  return d;
}
const checks = [];
async function check(name, fn) {await fn(harness());checks.push(name)}

await check('non-PBT selection preserves the complete identifier without suffix, split or normalization', ({c}) => {
  assert.deepEqual(copy(c.activityDetailTarget(item)), {type: 'DOKUMEN', endpoint: endpoints.pdf, values: {q: item.contentId}});
  for (const contentId of [null, '', ' ', 7]) assert.equal(c.activityDetailTarget({...item, contentId}), null);
  assert.deepEqual(copy(c.activityDetailTarget({...item, activityType: 'scandokumenpbt'}).values), {q: item.contentId});
});
await check('ordered route matching retains PBT parcel, queue and earlier BERKAS or bidang branches', ({c}) => {
  assert.equal(c.activityDetailTarget({...item, subTitle: 'Hasil PbT terbaru'}).type, 'PERSIL');
  for (const [activityType, expected] of [['BidangScandokumen','PERSIL'], ['BerkasScandokumen','BERKAS'], ['AntrianScandokumen','ANTRIAN'], ['Scan','NONE']]) assert.equal(c.activityDetailTarget({...item, activityType})?.type || 'NONE', expected);
});
await check('Activity document card enables its original selected index and escapes untrusted text', ({c}) => {
  const html = c.activityCard({...item, title: '<img src=x onerror="bad()">'}, 41);
  assert.match(html, /data-action="flow-detail" data-index="41"/);assert.doesNotMatch(html, / disabled|<img src=x/);assert.match(html, /&lt;img/);
});
await check('metadata parser accepts only numeric HTTP 200 and recognized object envelopes', ({c}) => {
  const valid = metadata(1, ' Exact Type ');assert.deepEqual(copy(c.activityDocumentType(valid)), {error: false, showRoute: true, type: ' Exact Type '});
  assert.deepEqual(copy(c.activityDocumentType({...valid, data: JSON.stringify(valid.data)})), {error: false, showRoute: true, type: ' Exact Type '});
  for (const status of [undefined, null, '200', 201, 400]) assert.equal(c.activityDocumentType({...valid, status}), null);
  for (const data of [null, [], 'invalid', '[]', {}]) assert.equal(c.activityDocumentType({status: 200, data}), null);
});
await check('metadata showRoute requires an integer while type and error use audited nullable defaults', ({c}) => {
  for (const showRoute of [0, -1, 2, 42]) assert.equal(c.activityDocumentType(metadata(showRoute)).showRoute, false);
  for (const showRoute of [undefined, null, true, '1', 1.5]) {const response = metadata();response.data.data.showRoute = showRoute;assert.equal(c.activityDocumentType(response), null)}
  for (const error of [undefined, null]) {const response = metadata();response.data.error = error;assert.equal(c.activityDocumentType(response).error, true)}
  for (const type of [undefined, null, '']) {const response = metadata();response.data.data.type = type;assert.equal(c.activityDocumentType(response).type, '')}
  for (const error of ['false', 0, 1, {}]) assert.equal(c.activityDocumentType(metadata(1, 'x', error)), null);
  for (const type of [7, false, {}, []]) assert.equal(c.activityDocumentType(metadata(1, type)), null);
  for (const data of [null, [], 'x']) assert.equal(c.activityDocumentType({status: 200, data: {error: false, data}}), null);
});
await check('fresh profile, PDF and metadata execute sequentially with exact names and q values only', async h => {
  const d = pauseAt(h, 'pdf'), task = h.c.loadActivityDetail(item);await flush();
  assert.deepEqual(h.calls.map(call => call.stage), ['profile', 'pdf']);assert.equal(h.modal.button.disabled, true);
  assert.deepEqual(h.calls[0].values, {});assert.deepEqual(h.calls[1].values, {q: item.contentId, name: ' Exact Profile & + '});
  d.resolve({result: pdf});await task;
  assert.deepEqual(h.calls.map(call => call.stage), ['profile', 'pdf', 'metadata']);assert.deepEqual(h.calls[2].values, {q: item.contentId});
  assert.match(h.modal.slot.innerHTML, /Lihat PDF/);assert.match(h.modal.slot.innerHTML, /Unduh PDF/);assert.doesNotMatch(h.modal.slot.innerHTML, /Lihat lokasi/);assert.equal(h.modal.button.disabled, false);
  assert.equal(h.state.results.size, 0, 'secondary profile reads must not overwrite a newer profile cache');
});
await check('cached recognized profile avoids a read and never substitutes username or owner name', async ({c, state, calls}) => {
  state.results.set(operations.profile.id, profile(' Exact & + '));await c.loadActivityDocument(item);
  assert.deepEqual(calls.map(call => call.stage), ['pdf', 'metadata']);assert.equal(calls[0].values.name, ' Exact & + ');
});
await check('recognized null or missing profile nama is sent as an explicit empty string', async ({c, state, calls}) => {
  for (const name of [undefined, null, '']) {state.results.set(operations.profile.id, profile(name));calls.length = 0;await c.loadActivityDocument(item);assert.equal(calls[0].values.name, '')}
});
await check('malformed or non-false profile envelope blocks both document and metadata with retry', async h => {
  for (const error of [undefined, null, true, 'false', 0, 1]) {
    h.calls.length = 0;h.c.api = async () => {h.calls.push('profile');const response = profile('name');response.data.error = error;return {result: response}};
    await h.c.loadActivityDocument(item);assert.equal(h.calls.length, 1);assert.match(h.modal.slot.innerHTML, /Nama profil belum/);assert.doesNotMatch(h.modal.slot.innerHTML, /href=/);assert.equal(h.modal.button.disabled, false);
  }
});
await check('unauthenticated, blank, PBT or unsupported selections never fetch a document', async ({c, state, calls, modal}) => {
  state.authenticated = false;await c.loadActivityDocument(item);state.authenticated = true;
  for (const value of [{...item, contentId: ''}, {...item, subTitle: 'PBT'}, {...item, activityType: 'AntrianOnline'}, {...item, activityType: 'Login'}]) await c.loadActivityDocument(value);
  assert.equal(calls.length, 0);assert.equal(modal.open, false);
});
await check('missing, disabled or write-only required adapters cause a visible failure without any request', async ({c, state, calls, modal}) => {
  for (const stage of ['profile', 'pdf']) for (const override of [null, {enabled: false}, {effect: 'write'}]) {
    state.operations = OPERATIONS.filter(op => op.id !== operations[stage].id).map(op => ({...op}));if (override) state.operations.push({...operations[stage], ...override});
    await c.loadActivityDocument(item);assert.equal(calls.length, 0);assert.match(modal.slot.innerHTML, /belum tersedia/);assert.equal(modal.button.disabled, false);
  }
});
await check('invalid or mismatched PDF links stop before metadata and remain retryable', async ({c, state, calls, modal}) => {
  state.results.set(operations.profile.id, profile('name'));
  for (const invalid of [{...pdf, status: 201}, {...pdf, contentType: 'text/html'}, {...pdf, previewUrl: '/api/preview/other'}, {...pdf, downloadUrl: 'https://example.invalid/doc'}]) {
    calls.length = 0;c.api = async (path, options) => {calls.push(options.body);return {result: invalid}};await c.loadActivityDocument(item);
    assert.equal(calls.length, 1);assert.doesNotMatch(modal.slot.innerHTML, /href=/);assert.equal(modal.button.disabled, false);
  }
});
await check('unavailable or non-read metadata preserves PDF with a notice and no location request', async ({c, state, calls, modal}) => {
  for (const override of [null, {enabled: false}, {effect: 'write'}]) {
    state.operations = OPERATIONS.filter(op => op.id !== operations.metadata.id).map(op => ({...op}));if (override) state.operations.push({...operations.metadata, ...override});
    calls.length = 0;await c.loadActivityDocument(item);assert.deepEqual(calls.map(call => call.stage), ['profile', 'pdf']);assert.match(modal.slot.innerHTML, /Lihat PDF/);assert.match(modal.slot.innerHTML, /PDF tetap tersedia/);assert.doesNotMatch(modal.slot.innerHTML, /Lihat lokasi/);
  }
});
await check('malformed metadata keeps valid PDF without inferring a location or type', async h => {
  const base = h.c.api;
  for (const showRoute of [null, undefined]) {
    const response = metadata(0, '<img>');response.data.data.showRoute = showRoute;
    h.c.api = async (path, options) => options.body.operationId === operations.metadata.id ? {result: response} : base(path, options);
    await h.c.loadActivityDocument(item);assert.match(h.modal.slot.innerHTML, /Lihat PDF/);assert.match(h.modal.slot.innerHTML, /PDF tetap tersedia/);assert.doesNotMatch(h.modal.slot.innerHTML, /Lihat lokasi|<img>/);
  }
});
await check('non-auth metadata failure keeps usable PDF and releases retry', async h => {
  const base = h.c.api;h.c.api = async (path, options) => {if (options.body.operationId === operations.metadata.id) throw Object.assign(new Error('<img>private upstream detail'), {code: 'UPSTREAM_TIMEOUT'});return base(path, options)};
  await h.c.loadActivityDocument(item);assert.match(h.modal.slot.innerHTML, /Lihat PDF/);assert.match(h.modal.slot.innerHTML, /PDF tetap tersedia/);assert.doesNotMatch(h.modal.slot.innerHTML, /private upstream|<img>/);assert.equal(h.modal.button.disabled, false);
});
await check('showRoute one exposes a location read control with the full q even when metadata error is true', async h => {
  // Inject the native helper result directly. The existing backend may reject error:true
  // before the frontend receives it; this check does not claim that transport behavior.
  const base = h.c.api;h.c.api = async (path, options) => {const response = await base(path, options);return options.body.operationId === operations.metadata.id ? {result: metadata(1, '<img src=x>', true)} : response};
  await h.c.loadActivityDocument(item);assert.match(h.modal.slot.innerHTML, /data-action="activity-document-geo"/);assert.match(h.modal.slot.innerHTML, /data-document-id=" selected : full &amp; \+ "/);assert.doesNotMatch(h.modal.slot.innerHTML, /<img src=x|disabled>Lihat lokasi/);assert.deepEqual(h.calls.map(call => call.stage), ['profile', 'pdf', 'metadata']);
});
await check('PDF failure produces escaped error and retry obtains a new PDF with metadata', async h => {
  const base = h.c.api;h.c.api = async (path, options) => {if (options.body.operationId === operations.pdf.id) throw new Error('<img src=x>');return base(path, options)};
  await h.c.loadActivityDocument(item);assert.match(h.modal.slot.innerHTML, /&lt;img/);assert.doesNotMatch(h.modal.slot.innerHTML, /href=|<img src=x/);assert.equal(h.modal.button.disabled, false);
  h.c.api = base;await h.c.loadActivityDocument(item);assert.match(h.modal.slot.innerHTML, /Lihat PDF/);assert.equal(h.modal.button.disabled, false);
});

for (const stage of ['profile', 'pdf', 'metadata']) for (const change of ['close', 'navigate', 'detach', 'logout']) await check(`${change} during ${stage} suppresses stale links and subsequent requests`, async h => {
  const d = pauseAt(h, stage), task = h.c.loadActivityDocument(item);await flush();
  const slot = h.modal.slot, button = h.modal.button, count = h.calls.length;assert.equal(h.calls.at(-1).stage, stage);
  if (change === 'close') h.modal.close();if (change === 'navigate') h.c.detailSequence++;if (change === 'detach') slot.isConnected = false;if (change === 'logout') {h.c.sessionEpoch++;h.state.authenticated = false}
  slot.innerHTML = 'NEW-STATE';d.resolve({result: responses[stage]});await task;
  assert.equal(slot.innerHTML, 'NEW-STATE');assert.equal(h.calls.length, count);assert.equal(button.disabled, true);
});
for (const stage of ['profile', 'pdf', 'metadata']) await check(`ordinary stale ${stage} failure cannot overwrite a newer detail`, async h => {
  const d = pauseAt(h, stage), task = h.c.loadActivityDocument(item);await flush();h.c.detailSequence++;h.modal.innerHTML = 'NEW-DETAIL';
  d.reject(Object.assign(new Error('OLD-ERROR'), {code: 'UPSTREAM_TIMEOUT'}));await task;assert.equal(h.modal.innerHTML, 'NEW-DETAIL');assert.equal(h.state.authenticated, true);
});
for (const stage of ['profile', 'pdf', 'metadata']) await check(`current ${stage} auth expiry clears private state and document links`, async h => {
  const d = pauseAt(h, stage), task = h.c.loadActivityDocument(item);await flush();h.state.results.set('private', {sensitive: 'fixture'});h.c.flowResults.set('private', {});
  d.reject(Object.assign(new Error('fixture expiry'), {code: ['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED'][['profile', 'pdf', 'metadata'].indexOf(stage)]}));await task;
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.state.results.size, 0);assert.equal(h.c.flowResults.size, 0);assert.equal(h.modal.open, false);assert.equal(h.modal.innerHTML, '');
});
for (const stage of ['profile', 'pdf', 'metadata']) await check(`old-session ${stage} expiry does not clear a replacement account`, async h => {
  const d = pauseAt(h, stage), task = h.c.loadActivityDocument(item);await flush();h.c.sessionEpoch++;h.state.user = {username: 'replacement'};h.modal.innerHTML = 'REPLACEMENT';
  d.reject(Object.assign(new Error('old expiry'), {code: 'SESSION_EXPIRED'}));await task;
  assert.equal(h.state.authenticated, true);assert.equal(h.state.user.username, 'replacement');assert.equal(h.modal.innerHTML, 'REPLACEMENT');assert.equal(h.toasts.length, 0);
});
await check('newer document selection wins while an older PDF request is unresolved', async h => {
  h.state.results.set(operations.profile.id, profile('name'));const old = deferred(), base = h.c.api;
  h.c.api = async (path, options) => options.body.operationId === operations.pdf.id && options.body.values.q === item.contentId ? old.promise : base(path, options);
  const first = h.c.loadActivityDocument(item);await flush();const oldSlot = h.modal.slot;
  await h.c.loadActivityDocument({...item, contentId: 'SECOND'});const html = h.modal.slot.innerHTML;old.resolve({result: pdf});await first;
  assert.equal(h.modal.slot.innerHTML, html);assert.equal(oldSlot.isConnected, false);assert.deepEqual(h.calls.map(call => call.values.q), ['SECOND', 'SECOND']);
});
await check('actual row dispatch binds the original selected row and retry uses that same selection', async h => {
  const rows = Array.from({length: 43}, (_, index) => ({...item, contentId: `DOC-${index}`}));h.c.flowResults.set(h.context.key, {response: {status: 200, data: JSON.stringify({data: rows})}});
  const loader = h.c.loadActivityDocument;let last;h.c.loadActivityDocument = value => (last = loader(value));h.c.showFlowDetail(31);await last;
  assert.equal(h.c.flowDetail.contentId, 'DOC-31');assert.equal(h.calls.find(call => call.stage === 'pdf').values.q, 'DOC-31');h.calls.length = 0;
  const button = h.modal.button;h.events.click({target: {closest: selector => selector === '[data-action="activity-document"]' ? button : null}});await last;
  assert.equal(h.calls.find(call => call.stage === 'pdf').values.q, 'DOC-31');
});
await check('disabled retry while profile is pending does not start a duplicate sequence', async h => {
  const d = pauseAt(h, 'profile'), task = h.c.loadActivityDocument(item);await flush();h.c.flowDetail = item;const button = h.modal.button, sequence = h.c.detailSequence;
  h.events.click({target: {closest: selector => selector === '[data-action="activity-document"]' ? button : null}});
  assert.equal(h.calls.length, 1);assert.equal(h.c.detailSequence, sequence);d.resolve({result: responses.profile});await task;
});

const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), passed: checks.length, failed: 0, checks, network_calls: 0,
  scope: 'Actual Activity non-PBT selection, exact profile/document binding, sequential PDF/metadata reads, native metadata parser, local retry and modal/session ownership. Synthetic responses only; no production acceptance, native runtime, PDF rendering or location-navigation claim.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/activity-document-frontend-review-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
