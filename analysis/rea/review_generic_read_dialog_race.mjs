// Executes actual generic read/review/navigation functions with local deferred responses.
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

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const names = ['resetSearchFileNavigation','resetPartnerNavigation','execute','showReview','resetNewsNavigation','resetCollectionNavigation','navigate','clearPrivate','redact','nativeAccountSummary','nativeResponseObject'];
const declarations = names.map(name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);return line;
}).join('\n');
const deferred = () => {let resolve, reject;const promise = new Promise((yes, no) => {resolve = yes;reject = no});return {promise, resolve, reject}};
const operations = ['A','B'].map(id => ({id: `fixture-read-${id}`, label: `Fixture read ${id}`, method: 'POST', effect: 'read', fields: [{path: 'q', source: 'input', type: 'string'}]}));
const formFor = q => ({dataset: {}, elements: {namedItem: key => key === 'q' ? {value: q} : null}});
function harness() {
  const events = {}, modal = {innerHTML: '', open: false, close() {this.open = false}, showModal() {this.open = true}, addEventListener(name, handler) {events[`modal:${name}`] = handler}};
  let reviewError = {textContent: ''};const errors = [];
  const d = deferred();const state = {authenticated: true, user: {username: 'fixture'}, operations, results: new Map(), activity: [], points: [], connection: {origin: 'fixture-only'}};
  const c = createPersilFixtureContext({state, Map, Object, Array, String, Number, JSON, URLSearchParams, FormData,
    sessionEpoch: 0, searchFileState: null, partnerFrame: null, detailSequence: 0, busy: false, logoutPending: false, pending: null, htDetailData: null, flowDetail: null,
    route: 'catalog', selected: operations[0].id, flowTab: '', flowQuery: '', flowPageIndex: 0,
    search: '', group: '', filter: '', comparison: null, comparisonSelection: {}, flowResults: new Map(),
    routes: {catalog: 'Katalog Kontrak', testing: 'Pengujian Lanjutan'}, location: {hash: '#/catalog'},
    document: {body: {classList: {remove() {}}}, addEventListener(name, handler) {events[name] = handler}}, window: {scrollTo() {}},
    $: selector => selector === '#review-error' ? reviewError : modal,
    icon: () => '', badge: () => '', notice: message => message, write: operation => operation.effect === 'write',
    renders: 0, render: () => {c.renders++}, toast: () => {}, record: () => {}, api: () => d.promise,
  });
  vm.runInContext(declarations, c);
  const escLine = lines.find(line => line.startsWith('const $='));vm.runInContext(`globalThis.esc=${escLine.slice(escLine.indexOf('esc=') + 4)}`, c);
  vm.runInContext(lines.find(line => line.startsWith('const json=')).replace('const json=', 'globalThis.json='), c);
  vm.runInContext(lines.find(line => line.startsWith("document.addEventListener('click',async e=>")), c);
  vm.runInContext(lines.find(line => line.startsWith("$('#modal').addEventListener('cancel'")), c);
  const openReview = index => {reviewError = {textContent: ''};errors.push(reviewError);c.showReview(formFor(`fixture-query-${index}`), operations[index]);return reviewError};
  return {c, state, modal, d, openReview, errors, events};
}
const checks = [];
async function check(name, fn) {
  try {const detail = await fn(harness());checks.push({name, passed: true, detail})}
  catch (error) {checks.push({name, passed: false, actual: error.actual, expected: error.expected, message: error.message})}
}

await check('current generic read still completes its own review and caches its response', async ({c, state, modal, d, openReview}) => {
  openReview(0);const task = c.execute({disabled: false, textContent: ''});d.resolve({result: {status: 200, data: {value: 'fixture-A'}}});await task;
  assert.equal(state.results.get(operations[0].id).data.value, 'fixture-A');assert.equal(c.pending, null);assert.equal(modal.open, false);assert.equal(c.busy, false);
});
await check('old generic read success must not dismiss a newer unsubmitted review after navigation', async ({c, state, modal, d, openReview}) => {
  openReview(0);const task = c.execute({disabled: false, textContent: ''});
  c.location.hash = '#/catalog';c.navigate();openReview(1);
  const newer = c.pending, before = modal.innerHTML;
  d.resolve({result: {status: 200, data: {value: 'fixture-A'}}});await task;
  assert.deepEqual({newerPendingPreserved: c.pending === newer, newerDialogOpen: modal.open, newerMarkupPreserved: modal.innerHTML === before}, {newerPendingPreserved: true, newerDialogOpen: true, newerMarkupPreserved: true});
  assert.equal(c.busy, false);assert.equal(state.results.get(operations[0].id).data.value, 'fixture-A');
  c.api = async () => ({result: {status: 200, data: {value: 'fixture-B'}}});await c.execute({disabled: false, textContent: ''});
  assert.equal(state.results.get(operations[1].id).data.value, 'fixture-B');assert.equal(modal.open, false);
});
await check('old generic read error must not appear in a newer unsubmitted review after navigation', async ({c, modal, d, openReview}) => {
  openReview(0);const oldButton = {disabled: false, textContent: ''}, task = c.execute(oldButton);
  c.location.hash = '#/catalog';c.navigate();const newerError = openReview(1), newer = c.pending;
  d.reject(Object.assign(new Error('Fixture A request failed'), {code: 'UPSTREAM_UNREACHABLE'}));await task;
  assert.deepEqual({newerPendingPreserved: c.pending === newer, newerDialogOpen: modal.open, newerError: newerError.textContent}, {newerPendingPreserved: true, newerDialogOpen: true, newerError: ''});
});
await check('old generic read success after logout cannot restore its response or replace the new review', async ({c, state, modal, d, openReview}) => {
  openReview(0);const task = c.execute({disabled: false, textContent: ''});c.sessionEpoch++;c.clearPrivate();state.authenticated = false;
  d.resolve({result: {status: 200, data: {value: 'fixture-A'}}});await task;
  assert.equal(state.results.size, 0);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');
});
for (const fail of [false, true]) await check(`distinct reviews of the same operation keep ownership on delayed ${fail ? 'error' : 'success'}`, async ({c, state, modal, d, openReview}) => {
  openReview(0);const task = c.execute({disabled: false, textContent: ''});c.location.hash = '#/catalog';c.navigate();const newerError = openReview(0), newer = c.pending;
  if (fail) d.reject(Object.assign(new Error('Fixture old review failed'), {code: 'UPSTREAM_UNREACHABLE'}));else d.resolve({result: {status: 200, data: {value: 'fixture-old-review'}}});
  await task;assert.equal(c.pending, newer);assert.equal(modal.open, true);assert.equal(newerError.textContent, '');assert.equal(c.busy, false);
  if (!fail) assert.equal(state.results.get(operations[0].id).data.value, 'fixture-old-review');
});
await check('current ordinary failure remains in its matching review and enables retry', async ({c, modal, d, openReview}) => {
  const currentError = openReview(0), current = c.pending, button = {disabled: false, textContent: ''}, task = c.execute(button);
  d.reject(Object.assign(new Error('Fixture current read failed'), {code: 'UPSTREAM_UNREACHABLE'}));await task;
  assert.equal(currentError.textContent, 'Fixture current read failed');assert.equal(c.pending, current);assert.equal(modal.open, true);assert.equal(button.disabled, false);assert.equal(c.busy, false);
  c.api = async () => ({result: {status: 200, data: {value: 'fixture-retry'}}});await c.execute(button);assert.equal(modal.open, false);
});
await check('authoritative session expiry still clears the replacement review and private data', async () => {
  for (const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']) {
    const {c, state, modal, d, openReview} = harness();openReview(0);const task = c.execute({disabled: false, textContent: ''});
    c.location.hash = '#/catalog';c.navigate();openReview(1);state.results.set('fixture-private', {data: 'private'});
    d.reject(Object.assign(new Error('Fixture session expired'), {code}));await task;
    assert.equal(state.authenticated, false);assert.equal(state.user, null);assert.equal(state.results.size, 0);assert.equal(c.pending, null);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');assert.equal(c.busy, false);
  }
});
await check('active request retains existing modal-close and Escape guards until it completes', async ({c, modal, d, openReview, events}) => {
  openReview(0);const current = c.pending, task = c.execute({disabled: false, textContent: ''});
  await events.click({target: {closest: () => ({dataset: {action: 'modal-close'}})}});
  let prevented = false;events['modal:cancel']({preventDefault() {prevented = true}});
  assert.equal(c.pending, current);assert.equal(modal.open, true);assert.equal(prevented, true);
  d.resolve({result: {status: 200, data: {value: 'fixture-complete'}}});await task;assert.equal(modal.open, false);
});
await check('navigation without a replacement review keeps late result cached without rerendering the current page', async ({c, state, modal, d, openReview}) => {
  openReview(0);const task = c.execute({disabled: false, textContent: ''});c.location.hash = '#/testing';c.navigate();const renders = c.renders;
  d.resolve({result: {status: 200, data: {value: 'fixture-A'}}});await task;
  assert.equal(state.results.get(operations[0].id).data.value, 'fixture-A');assert.equal(c.pending, null);assert.equal(modal.open, false);assert.equal(c.renders, renders);assert.equal(c.busy, false);
});
const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length, checks, network_calls: 0, scope: 'Actual generic catalog read-operation completion after browser navigation and opening another unsubmitted review. Request ownership, current retry, modal-close, logout and expiry guards. Synthetic data and deferred API only; no production calls or browser acceptance claim.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/generic-read-dialog-race-review.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
