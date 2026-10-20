// Actual runFlow ownership/session regression tests using deferred local responses.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const text = lines.filter(line => new RegExp(`^(async )?function ${name}\\(`).test(line)).at(-1);
  assert.ok(text, `Missing actual source function ${name}`);
  return text;
};
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};
const success = marker => ({result: {status: 200, data: {marker}}});
const expiry = () => Object.assign(new Error('Fixture session expiry'), {code: 'SESSION_EXPIRED'});
const flow = key => ({key, def: {title: key}, tab: {}, op: {id: key, enabled: true, effect: 'read', fields: [{path: 'query', source: 'input', type: 'string'}]}});
const form = value => ({elements: {namedItem: () => ({value})}});

function harness() {
  const requests = [], records = [], toasts = [];
  const modal = {open: false, innerHTML: '', close() {this.open = false}};
  const state = {authenticated: true, user: {username: 'fixture-only'}, results: new Map(), points: [], activity: []};
  let selected = flow('fixture:first');
  const c = vm.createContext({
    route: 'files', state, Map, Object, String, console, flowResults: new Map(), flowDetail: null,
    htDetailData: null, flowQuery: '', flowPageIndex: 0, detailSequence: 0, sessionEpoch: 0, searchFileState: null, partnerFrame: null,
    comparison: null, comparisonSelection: {}, pending: null, selected: null,
    currentFlow: () => selected, ready: op => op.enabled === true, write: op => op.effect === 'write',
    $: () => modal, renderCalls: 0, render: () => {c.renderCalls++},
    record: (...args) => records.push(args), toast: message => toasts.push(message),
    api: (path, options) => {const pending = deferred();requests.push({path, options, ...pending});return pending.promise},
  });
  vm.runInContext(['collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','runFlow', 'clearPrivate', 'nativeAccountSummary', 'nativeResponseObject', 'resetSearchFileNavigation','resetPartnerNavigation'].map(get).join('\n'), c);
  return {c, state, requests, records, toasts, modal, use(key) {selected = flow(key);return selected}};
}

const checks = [];
async function check(name, fn) {
  try {await fn(harness());checks.push({name, passed: true})}
  catch (error) {checks.push({name, passed: false, error: error.message})}
}

await check('older same-key success cannot replace the newer successful response', async ({c, state, requests, records}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  requests[1].resolve(success('new'));await current;
  const renders = c.renderCalls;requests[0].resolve(success('old'));await old;
  assert.equal(c.flowResults.get('fixture:first').response.data.marker, 'new');
  assert.equal(c.flowResults.get('fixture:first').values.query, 'new');
  assert.equal(state.results.get('fixture:first').data.marker, 'new');
  assert.equal(records.length, 1);assert.equal(c.renderCalls, renders);
});
await check('older same-key failure cannot replace the newer successful response', async ({c, requests, records}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  requests[1].resolve(success('new'));await current;const renders = c.renderCalls;
  requests[0].reject(new Error('OLD-FAILURE'));await old;
  assert.equal(c.flowResults.get('fixture:first').response?.data.marker, 'new');
  assert.equal(c.flowResults.get('fixture:first').error, undefined);assert.equal(records.length, 1);assert.equal(c.renderCalls, renders);
});
await check('older same-key auth expiry cannot clear a newer successful request', async ({c, state, requests, toasts}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  requests[1].resolve(success('new'));await current;const epoch = c.sessionEpoch;
  requests[0].reject(expiry());await old;
  assert.equal(state.authenticated, true);assert.equal(state.user.username, 'fixture-only');assert.equal(c.sessionEpoch, epoch);
  assert.equal(c.flowResults.get('fixture:first').response?.data.marker, 'new');assert.equal(toasts.length, 0);
});
await check('older same-key auth expiry cannot clear a newer pending request', async ({c, state, requests}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  requests[0].reject(expiry());await old;const stayedAuthenticated = state.authenticated;
  requests[1].resolve(success('new'));await current;
  assert.equal(stayedAuthenticated, true);assert.equal(c.flowResults.get('fixture:first').response?.data.marker, 'new');
});
await check('older same-key success cannot replace a newer ordinary error', async ({c, requests, records}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  requests[1].reject(new Error('CURRENT-FAILURE'));await current;const renders = c.renderCalls;
  requests[0].resolve(success('old'));await old;
  assert.equal(c.flowResults.get('fixture:first').error, 'CURRENT-FAILURE');assert.equal(c.flowResults.get('fixture:first').values.query, 'new');
  assert.equal(c.flowResults.get('fixture:first').response, undefined);assert.equal(records.length, 1);assert.equal(c.renderCalls, renders);
});
await check('older completion does not unlock or re-render a newer pending request', async ({c, requests, records}) => {
  const old = c.runFlow(form('old')), current = c.runFlow(form('new'));
  const renders = c.renderCalls;requests[0].resolve(success('old'));await old;
  const pending = c.flowResults.get('fixture:first'), pendingLoading = pending.loading, pendingQuery = pending.values.query, renderCount = c.renderCalls, recordCount = records.length;
  requests[1].resolve(success('new'));await current;
  assert.equal(pendingLoading, true);assert.equal(pendingQuery, 'new');assert.equal(renderCount, renders);assert.equal(recordCount, 0);
});
await check('independent flow keys may complete in either order and retain both results', async ({c, state, requests, records, use}) => {
  const first = c.runFlow(form('first'));use('fixture:second');const second = c.runFlow(form('second'));
  requests[1].resolve(success('second'));await second;requests[0].resolve(success('first'));await first;
  assert.equal(c.flowResults.get('fixture:first').response.data.marker, 'first');assert.equal(c.flowResults.get('fixture:second').response.data.marker, 'second');
  assert.equal(state.results.size, 2);assert.equal(records.length, 2);
});
await check('current request auth expiry still clears all private caches and authentication', async ({c, state, requests, modal, toasts}) => {
  c.flowQuery = 'PRIVATE';c.htDetailData = [{fixture: true}];state.results.set('private', {});modal.open = true;modal.innerHTML = 'PRIVATE';
  const request = c.runFlow(form('current'));requests[0].reject(expiry());await request;
  assert.equal(state.authenticated, false);assert.equal(state.user, null);assert.equal(c.sessionEpoch, 1);assert.equal(c.flowResults.size, 0);assert.equal(state.results.size, 0);assert.equal(c.flowQuery, '');assert.equal(c.htDetailData, null);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');assert.equal(toasts.length, 1);
});
await check('success after logout epoch change cannot restore private data', async ({c, state, requests, records}) => {
  const request = c.runFlow(form('private'));c.sessionEpoch++;c.clearPrivate();state.authenticated = false;state.user = null;
  requests[0].resolve(success('private'));await request;
  assert.equal(c.flowResults.size, 0);assert.equal(state.results.size, 0);assert.equal(state.authenticated, false);assert.equal(records.length, 0);
});
await check('old-session failure or expiry cannot sign out a replacement authenticated session', async ({c, state, requests, toasts, records}) => {
  const request = c.runFlow(form('private'));c.sessionEpoch++;c.clearPrivate();state.user = {username: 'replacement'};
  requests[0].reject(expiry());await request;
  assert.equal(state.authenticated, true);assert.equal(state.user.username, 'replacement');assert.equal(c.flowResults.size, 0);assert.equal(toasts.length, 0);assert.equal(records.length, 0);
});
await check('current ordinary error retains submitted values and finishes loading', async ({c, state, requests}) => {
  const request = c.runFlow(form('current'));requests[0].reject(new Error('CURRENT-FAILURE'));await request;
  const result = c.flowResults.get('fixture:first');assert.equal(result.error, 'CURRENT-FAILURE');assert.equal(result.values.query, 'current');assert.equal(result.loading, false);assert.equal(state.authenticated, true);
});

const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length, checks, network_calls: 0, scope: 'Actual runFlow and clearPrivate functions, local deferred API responses; same-key ownership and independent-key/session behavior only.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/flow-request-order-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
