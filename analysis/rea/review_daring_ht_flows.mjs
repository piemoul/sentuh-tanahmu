// Execute current frontend functions with local mocks. No browser or upstream request.
import fs from 'node:fs';
import vm from 'node:vm';
import {createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry} from '../../webapp/collection-save-persil.js';
// Bind the real new host helpers/module to legacy VM fixtures; assertions and
// existing source-function renderers remain unchanged.
function createPersilFixtureContext(...args){
  const context=vm.createContext(...args);
  // This isolated HT fixture has no verification dialog owner. The full Daring
  // lifecycle is exercised by its separate actual-helper Node/browser tests.
  Object.assign(context,{createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry,verificationDaringBusy:()=>false});
  const dependencies=new Set(['nativeResponseObject','nativeAccountSummary','collectionTab','collectionGroupCreated']);
  const declarations=String(source).split(/\r?\n/).filter(line=>/^(?:async )?function (?:persilMap\w+|resetPersilMaps|resetScanHost|scanDisposeLocation)\(/.test(line)||dependencies.has(line.match(/^(?:async )?function (\w+)\(/)?.[1])).join('\n');
  vm.runInContext(declarations,context);
  return context;
}

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const declaration = lines.filter(line => new RegExp(`^(async )?function ${name}\\(`).test(line)).at(-1);
  assert.ok(declaration, `Missing actual source function: ${name}`);
  return declaration;
};
const names = ['resetSearchFileNavigation','resetPartnerNavigation','nativeResponseObject','activityItem','activityRows','activityCategories','activityMatches','activityDetailTarget','activityDeleteOperation','activityCard','listPagination','activityListView','filterActivity','loadActivityDetail','kkprStringFields','isKkprItem','kkprRows','kkprMatches','kkprCard','kkprListView','kkprFacts','kkprMapView','kkprDocumentTarget','kkprDocumentControls','kkprDetailView','showKkprDetail','certificateRowOpen', 'certificateListMatches', 'certificateListCard', 'aktaRows', 'aktaTitleCase', 'aktaMatches', 'aktaCertificate', 'aktaCard', 'certificateListItem', 'isAktaItem', 'nativeListMode', 'collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','nativeListResultView', 'htField', 'htListTitle', 'htDetailTarget', 'isHtDetail', 'htDetailRows', 'htDetailView', 'filterHtDetail', 'loadHtDetail', 'showFlowDetail', 'clearPrivate', 'resetNewsNavigation','resetCollectionNavigation','navigate', 'flowData', 'dataItems', 'itemTitle', 'facts', 'result', 'flowResultView', 'certificateText', 'redact'];
const declarations = names.map(get).join('\n');
const operation = {id: 'get-legacy-getsertipikathtdetail-d446dc', endpoint: 'legacy/GetSertipikatHTDetail', enabled: true, effect: 'read', auth: 'session'};
const normalRow = {HaktanggunganId: 'FIXTURE-HT', Nama: 'Nama Fixture', NomorHak: 'HAK-001', Nibel: 'NIBEL-001', JenisHak: 'Hak Fixture'};
const result = data => ({result: {status: 200, data}});
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};

function harness() {
  const calls = [], records = [], toasts = [], events = {};
  const slot = {innerHTML: ''};
  const modal = {
    innerHTML: '', open: false, hasSlot: true,
    showModal() {this.open = true}, close() {this.open = false},
    querySelector(selector) {return selector === '.ht-results' && this.hasSlot ? slot : null},
    addEventListener(name, callback) {events[`modal:${name}`] = callback},
  };
  const state = {authenticated: true, user: {username: 'fixture-only'}, operations: [{...operation}], results: new Map(), points: [], activity: [], selectedPoint: null};
  const c = createPersilFixtureContext({
    state, Map, Object, Number, Array, JSON, String, console, URLSearchParams,
    flowResults: new Map(), flowPageIndex: 0, flowDetail: null, htDetailData: null,
    detailSequence: 0, sessionEpoch: 0, searchFileState: null, partnerFrame: null, flowQuery: '', comparison: null, comparisonSelection: {},
    selected: null, pending: null, busy: false, collectionGroupCreate: null, collectionItemEdit: null, route: 'certificates', flowTab: 'ht',
    search: '', group: 'Semua', filter: 'Semua', routes: {certificates: 'Sertipikatku', dashboard: 'Beranda'},
    location: {hash: '#/certificates'}, window: {scrollTo() {}},
    document: {body: {classList: {remove() {}}}, addEventListener(name, callback) {events[name] = callback}},
    ready: o => o.enabled === true, write: o => o.effect === 'write',
    $: () => modal, icon: () => '', badge: () => '',
    empty: s => s, notice: s => s, humanField: s => s,
    render: () => {c.renderCalls++}, renderCalls: 0,
    toast: text => toasts.push(text), record: (...args) => records.push(args),
    berkasDetailTarget: () => null, collectionDetailTarget: () => null, certificateDetailTarget: () => null,
    currentFlow: () => ({key: 'certificates:ht', op: {endpoint: 'legacy/GetSertipikatHT'}, def: {title: 'Sertipikatku', asset: 'fixture.svg'}, tab: {id: 'ht', label: 'Hak tanggungan'}}),
    api: async (path, options) => {calls.push({path, options});return result([normalRow])},
  });
  vm.runInContext(declarations, c);
  const escLine = lines.find(line => line.startsWith('const $='));
  vm.runInContext(`globalThis.esc=${escLine.slice(escLine.indexOf('esc=') + 4)}`, c);
  vm.runInContext(lines.find(line => line.startsWith('const json=')).replace('const json=', 'globalThis.json='), c);
  for (const marker of ["document.addEventListener('click'", "document.addEventListener('input'", "$('#modal').addEventListener('cancel'"]) {
    const line = lines.find(line => line.startsWith(marker));
    assert.ok(line, `Missing actual source handler: ${marker}`);
    vm.runInContext(line, c);
  }
  return {c, state, modal, slot, calls, records, toasts, events};
}

const passed = [];
async function check(label, fn) {await fn(harness());passed.push(label)}

await check('HT field values prefer non-null PascalCase, including empty text, before lowerCamel', ({c}) => {
  assert.equal(c.htField({Nama: 'Upper', nama: 'lower'}, 'Nama', 'nama'), 'Upper');
  assert.equal(c.htField({Nama: '', nama: 'lower'}, 'Nama', 'nama'), '');
  assert.equal(c.htField({Nama: null, nama: 'lower'}, 'Nama', 'nama'), 'lower');
  assert.equal(c.htField({nama: 'lower'}, 'Nama', 'nama'), 'lower');
  assert.equal(c.htField({}, 'Nama', 'nama'), null);
});
await check('HT selector preserves selected identifier bytes and exact native query spelling', ({c}) => {
  const id = '  FIXTURE-ID /?&=+  ';
  assert.deepEqual(clone(c.htDetailTarget({HaktanggunganId: id, haktanggunganId: 'other', SertifikatId: 'wrong'})), {endpoint: operation.endpoint, values: {haktanggunganId: id}});
  assert.equal(c.htDetailTarget({HaktanggunganId: null, haktanggunganId: 'lower'}).values.haktanggunganId, 'lower');
});
await check('HT selector never guesses missing identifiers or substitutes invalid non-null PascalCase', ({c}) => {
  for (const row of [null, {}, {SertifikatId: 'wrong'}, {Id: 'wrong'}, {HaktanggunganId: ' '}, {HaktanggunganId: ''}, {HaktanggunganId: 5}, {HaktanggunganId: '', haktanggunganId: 'must-not-replace'}, {HaktanggunganId: 5, haktanggunganId: 'must-not-replace'}]) assert.equal(c.htDetailTarget(row), null);
});
await check('HT list title retains native number/year text with null-only case fallback', ({c}) => {
  assert.equal(c.htListTitle({NomorHT: '0007', TahunHT: '2026', nomorHT: 'wrong', tahunHT: 'wrong'}), '0007/2026');
  assert.equal(c.htListTitle({NomorHT: null, nomorHT: 'lower', TahunHT: null, tahunHT: 'lower-year'}), 'lower/lower-year');
  assert.equal(c.htListTitle({NomorHT: '', nomorHT: 'wrong', TahunHT: '', tahunHT: 'wrong'}), '/');
  assert.equal(c.htListTitle({NomorHT: null, TahunHT: null}), '-/-');
});
await check('HT list title rejects unsupported types without deriving an identifier or year', ({c}) => {
  for (const row of [null, {}, {HaktanggunganId: 'not-a-title'}, {Nama: 'generic'}, {NomorHT: 7, TahunHT: '2026'}, {NomorHT: '7', TahunHT: 2026}, {NomorHT: 7, nomorHT: 'not-a-fallback'}]) assert.equal(c.htListTitle(row), null);
});
await check('HT list renderer uses escaped native title only for the HT list endpoint', ({c}) => {
  const row = {NomorHT: '<img onerror="bad()">', TahunHT: '2026', Nama: 'Generic Name'};
  const active = c.currentFlow();
  assert.match(c.flowResultView(active, {data: [row]}), /<h3>&lt;img onerror=&quot;bad\(\)&quot;&gt;\/2026<\/h3>/);
  assert.doesNotMatch(c.flowResultView(active, {data: [row]}), /<img onerror=/);
  assert.match(c.flowResultView({...active, op: {endpoint: 'Legacy/SertifikatTanahNew'}}, {data: [row]}), /<h3>Generic Name<\/h3>/);
});
await check('HT list unfamiliar title model retains the generic title fallback', ({c}) => {
  assert.match(c.flowResultView(c.currentFlow(), {data: [{NomorHT: 7, Nama: 'Unfamiliar Fixture'}]}), /<h3>Unfamiliar Fixture<\/h3>/);
});
await check('HT detail accepts direct typed lists, empty list, and native nullable fields', ({c}) => {
  for (const data of [[], [{}], [normalRow], [{nama: 'lower', nomorHak: null, nibel: 'E', jenisHak: null}], [{Nama: null, nama: 'fallback'}, {Nama: '', nama: 77}]]) assert.equal(c.isHtDetail(data), true);
});
await check('HT detail rejects incompatible list rows and effective non-string model values', ({c}) => {
  for (const data of [null, normalRow, {data: [normalRow]}, [null], [[]], ['text'], [{unmapped: 'model'}], [normalRow, {Nama: 77}], [{Nama: null, nama: 77}], [{NomorHak: false}], [{Nibel: {nested: true}}], [{JenisHak: []}], [{HaktanggunganId: 4}]]) assert.equal(c.isHtDetail(data), false);
});
await check('HT view unwraps response envelopes but uses generic fallback for unfamiliar models', ({c}) => {
  assert.match(c.htDetailView({data: [normalRow]}), /class="certificate-detail ht-detail"/);
  assert.match(c.htDetailView({data: {data: [normalRow]}}), /class="certificate-detail ht-detail"/);
  for (const response of [{data: {unmapped: 'Unfamiliar fixture'}}, {data: [{unmapped: 'Unfamiliar fixture'}]}, {data: [{Nama: 77}]}]) {
    const html = c.htDetailView(response);
    assert.doesNotMatch(html, /class="certificate-detail ht-detail"/);
    assert.match(html, /Lihat respons JSON/);
  }
});
await check('HT detail renders every one of 105 rows in supplied order beyond generic preview limits', ({c}) => {
  const rows = Array.from({length: 105}, (_, i) => ({...normalRow, Nama: `Fixture-${String(i).padStart(3, '0')}`}));
  const before = JSON.stringify(rows), html = c.htDetailView({data: rows});
  assert.equal((html.match(/class="ht-certificate"/g) || []).length, 105);
  let previous = -1;
  for (let i = 0; i < rows.length; i++) {const position = html.indexOf(`>${rows[i].Nama}<`);assert.ok(position > previous);previous = position}
  assert.equal(JSON.stringify(rows), before);
  assert.doesNotMatch(html, /data-action=|href=/);
});
await check('HT rows retain native three-line order, empty-string values, and null fallback', ({c}) => {
  const html = c.htDetailRows([{Nama: 'ROW-NAME', NomorHak: 'ROW-NUMBER', JenisHak: 'ROW-RIGHT'}, {Nama: null, NomorHak: null, Nibel: 'ROW-NIBEL', JenisHak: null}, {Nama: '', NomorHak: '', Nibel: 'UNUSED-NIBEL', JenisHak: ''}]);
  assert.ok(html.indexOf('ROW-NAME') < html.indexOf('ROW-NUMBER'));
  assert.ok(html.indexOf('ROW-NUMBER') < html.indexOf('ROW-RIGHT'));
  assert.match(html, /<h3>-<\/h3><p class="ht-number">ROW-NIBEL<\/p><p class="ht-right">-<\/p>/);
  assert.match(html, /<h3><\/h3><p class="ht-number"><\/p><p class="ht-right"><\/p>/);
  assert.doesNotMatch(html, /UNUSED-NIBEL/);
});
await check('HT analog/electronic badge uses NomorHak nullness rather than truthiness', ({c}) => {
  const html = c.htDetailRows([{NomorHak: ''}, {NomorHak: 'A'}, {NomorHak: null, Nibel: 'E'}, {}]);
  assert.equal((html.match(/aria-label="Sertipikat analog">A</g) || []).length, 2);
  assert.equal((html.match(/aria-label="Sertipikat elektronik">E</g) || []).length, 2);
});
await check('HT row text escapes markup and attributes without changing source strings', ({c}) => {
  const attack = '<img src=x onerror="bad()">&\' <br>tail';
  const rows = [{Nama: attack, NomorHak: attack, JenisHak: attack}], before = JSON.stringify(rows);
  const html = c.htDetailRows(rows);
  assert.doesNotMatch(html, /<img|<br>/);
  assert.equal((html.match(/&lt;img src=x onerror=&quot;bad\(\)&quot;&gt;&amp;&#39; &lt;br&gt;tail/g) || []).length, 3);
  assert.equal(JSON.stringify(rows), before);
});
await check('HT text preserves long values beyond the general JSON preview character limit', ({c}) => {
  const value = 'x'.repeat(24010) + 'COMPLETE-TAIL';
  assert.ok(c.htDetailRows([{Nama: value}]).includes(value));
});
await check('HT search lowercases and matches Nama, JenisHak, or NomorHak only', ({c}) => {
  const rows = [{Nama: 'Alpha', NomorHak: '001', JenisHak: 'Milik'}, {Nama: 'Beta', NomorHak: '002', JenisHak: 'Guna'}, {Nama: 'Gamma', NomorHak: null, Nibel: 'NIBEL-EXCLUSIVE', JenisHak: 'Wakaf'}];
  for (const [query, expected] of [['ALPHA', 'Alpha'], ['GUNA', 'Beta'], ['002', 'Beta'], ['WAKAF', 'Gamma']]) {
    const html = c.htDetailRows(rows, query);assert.equal((html.match(/class="ht-certificate"/g) || []).length, 1);assert.match(html, new RegExp(`>${expected}<`));
  }
  assert.equal(c.htDetailRows(rows, 'NIBEL-EXCLUSIVE'), '');
  assert.equal(c.htDetailRows(rows, ' Alpha '), '');
});
await check('HT search honors nullable case precedence and restores all rows for empty query', ({c}) => {
  const rows = [{Nama: 'PRIMARY', nama: 'hidden'}, {Nama: null, nama: 'FALLBACK'}, {Nama: '', nama: 'hidden'}, {}];
  assert.match(c.htDetailRows(rows, 'primary'), />PRIMARY</);
  assert.match(c.htDetailRows(rows, 'fallback'), />FALLBACK</);
  assert.equal(c.htDetailRows(rows, 'hidden'), '');
  assert.equal((c.htDetailRows(rows, '').match(/class="ht-certificate"/g) || []).length, 4);
});
await check('HT empty detail keeps native search visible without inventing rows or actions', ({c}) => {
  const html = c.htDetailView({data: []});
  assert.match(html, /Cari nomor hak/);assert.match(html, /id="ht-search"/);
  assert.doesNotMatch(html, /class="ht-certificate"|data-action=|href=/);
});
await check('HT detail loader requests only the selected ID through the registered read operation', async ({c, calls, modal, records}) => {
  const row = {HaktanggunganId: ' FIXTURE-SELECTED ', NomorHak: 'NOT-THE-ID', SertifikatId: 'NOT-THE-ID'};
  await c.loadHtDetail(row);
  assert.deepEqual(clone(calls), [{path: '/api/execute', options: {method: 'POST', body: {operationId: operation.id, values: {haktanggunganId: ' FIXTURE-SELECTED '}}}}]);
  assert.match(modal.innerHTML, /id="modal-title">Daftar Sertipikat</);
  assert.match(modal.innerHTML, /Nama Fixture/);assert.equal(c.htDetailData.length, 1);assert.equal(records.length, 1);
  assert.doesNotMatch(JSON.stringify(records), /FIXTURE-HT|Nama Fixture|HAK-001/);
});
await check('HT unavailable, disabled, and write-only registrations do not fetch', async ({c, state, calls, modal}) => {
  for (const operations of [[], [{...operation, enabled: false}], [{...operation, effect: 'write'}]]) {
    state.operations = operations;await c.loadHtDetail(normalRow);
    assert.equal(calls.length, 0);assert.match(modal.innerHTML, /belum tersedia/);
  }
});
await check('HT loader refuses unauthenticated and invalid-ID calls without opening a dialog', async ({c, state, calls, modal}) => {
  state.authenticated = false;await c.loadHtDetail(normalRow);
  state.authenticated = true;await c.loadHtDetail({HaktanggunganId: ' '});
  assert.equal(calls.length, 0);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');
});
await check('HT unfamiliar successful response renders generic content and cannot become search cache', async ({c, modal}) => {
  c.api = async () => result({unknown: 'UNMAPPED-FIXTURE'});
  await c.loadHtDetail(normalRow);
  assert.equal(c.htDetailData, null);assert.match(modal.innerHTML, /UNMAPPED-FIXTURE/);assert.doesNotMatch(modal.innerHTML, /id="ht-search"/);
});
await check('HT current request errors are escaped and discard previous searchable data', async ({c, modal, records}) => {
  c.htDetailData = [normalRow];c.api = async () => {throw new Error('<img onerror="bad()">')};
  await c.loadHtDetail(normalRow);
  assert.equal(c.htDetailData, null);assert.doesNotMatch(modal.innerHTML, /<img/);assert.match(modal.innerHTML, /&lt;img/);assert.equal(records[0][1], 'error');
});
await check('HT successful response after session epoch change cannot restore private data', async ({c, modal, records}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);
  c.sessionEpoch++;c.clearPrivate();d.resolve(result([normalRow]));await request;
  assert.equal(c.htDetailData, null);assert.equal(modal.innerHTML, '');assert.equal(modal.open, false);assert.equal(records.length, 0);
});
await check('HT successful response after route sequence change leaves the newer dialog intact', async ({c, modal, records}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);
  c.detailSequence++;modal.innerHTML = 'NEW-DIALOG';c.htDetailData = null;d.resolve(result([normalRow]));await request;
  assert.equal(modal.innerHTML, 'NEW-DIALOG');assert.equal(c.htDetailData, null);assert.equal(records.length, 0);
});
await check('HT closed dialog never receives a late successful payload or searchable cache', async ({c, modal, records}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);
  modal.close();const html = modal.innerHTML;d.resolve(result([normalRow]));await request;
  assert.equal(modal.innerHTML, html);assert.equal(c.htDetailData, null);assert.equal(records.length, 0);
});
await check('HT slower older selection cannot replace a newer selected detail', async ({c, modal}) => {
  const old = deferred(), newer = deferred();let count = 0;c.api = () => ++count === 1 ? old.promise : newer.promise;
  const first = c.loadHtDetail({HaktanggunganId: 'FIRST'});c.detailSequence++;
  const second = c.loadHtDetail({HaktanggunganId: 'SECOND'});newer.resolve(result([{Nama: 'NEWER-SELECTED'}]));await second;
  old.resolve(result([{Nama: 'STALE-SELECTED'}]));await first;
  assert.match(modal.innerHTML, /NEWER-SELECTED/);assert.doesNotMatch(modal.innerHTML, /STALE-SELECTED/);assert.equal(c.htDetailData[0].Nama, 'NEWER-SELECTED');
});
await check('HT late ordinary errors after closure or sequence change do not overwrite content', async ({c, modal, records}) => {
  for (const mutate of [() => modal.close(), () => c.detailSequence++]) {
    const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);mutate();const html = modal.innerHTML;
    d.reject(new Error('STALE-ERROR'));await request;assert.equal(modal.innerHTML, html);
  }
  assert.equal(records.length, 0);
});
await check('HT stale-epoch authentication failure cannot sign out a replacement session', async ({c, state, modal, toasts}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);
  c.sessionEpoch++;state.user = {username: 'replacement'};modal.innerHTML = 'REPLACEMENT';
  d.reject(Object.assign(new Error('old expiry'), {code: 'SESSION_EXPIRED'}));await request;
  assert.equal(state.authenticated, true);assert.equal(state.user.username, 'replacement');assert.equal(modal.innerHTML, 'REPLACEMENT');assert.equal(toasts.length, 0);
});
for (const code of ['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED']) {
  await check(`HT ${code} clears actual private state and authenticated account`, async ({c, state, modal, toasts}) => {
    state.results.set('private', {value: 'fixture'});c.flowResults.set('private', {value: 'fixture'});c.htDetailData = [normalRow];state.points = [{id: 'fixture'}];state.activity = ['fixture'];
    const epoch = c.sessionEpoch;c.api = async () => {throw Object.assign(new Error('fixture expiry'), {code})};
    await c.loadHtDetail(normalRow);
    assert.equal(c.sessionEpoch, epoch + 1);assert.equal(state.authenticated, false);assert.equal(state.user, null);
    assert.equal(state.results.size, 0);assert.equal(c.flowResults.size, 0);assert.equal(c.htDetailData, null);assert.equal(state.points.length, 0);assert.equal(state.activity.length, 0);
    assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');assert.equal(c.renderCalls, 1);assert.deepEqual(toasts, ['fixture expiry']);
  });
}
await check('HT expiry of a current-session request still clears auth after dialog sequence changes', async ({c, state, modal}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);c.detailSequence++;modal.innerHTML = 'OTHER-PRIVATE-DIALOG';
  d.reject(Object.assign(new Error('fixture expiry'), {code: 'SESSION_EXPIRED'}));await request;
  assert.equal(state.authenticated, false);assert.equal(modal.innerHTML, '');
});
await check('HT local filtering updates only rows and performs no API request', ({c, state, modal, slot, calls}) => {
  c.htDetailData = [normalRow, {...normalRow, Nama: 'Other Fixture'}];modal.open = true;
  const input = {value: 'other', isConnected: true};c.filterHtDetail(input);
  assert.match(slot.innerHTML, /Other Fixture/);assert.doesNotMatch(slot.innerHTML, /Nama Fixture/);assert.equal(calls.length, 0);
  input.value = '';c.filterHtDetail(input);assert.equal((slot.innerHTML.match(/class="ht-certificate"/g) || []).length, 2);
  assert.equal(state.authenticated, true);
});
await check('HT filter refuses unauthenticated, closed, detached, absent-slot, and missing-cache inputs', ({c, state, modal, slot}) => {
  const reset = () => {state.authenticated = true;modal.open = true;modal.hasSlot = true;c.htDetailData = [normalRow];slot.innerHTML = 'UNCHANGED'};
  for (const mutate of [() => {state.authenticated = false}, () => {modal.open = false}, () => {modal.hasSlot = false}, () => {c.htDetailData = null}]) {
    reset();mutate();c.filterHtDetail({value: 'fixture', isConnected: true});assert.equal(slot.innerHTML, 'UNCHANGED');
  }
  reset();c.filterHtDetail({value: 'fixture', isConnected: false});assert.equal(slot.innerHTML, 'UNCHANGED');
});
await check('actual HT input event dispatches local filtering', ({c, modal, slot, events}) => {
  c.htDetailData = [{Nama: 'EVENT-MATCH'}, {Nama: 'OTHER'}];modal.open = true;
  events.input({target: {id: 'ht-search', value: 'event', isConnected: true, closest: () => null}});
  assert.match(slot.innerHTML, /EVENT-MATCH/);assert.doesNotMatch(slot.innerHTML, />OTHER</);
});
await check('actual detail dispatch picks absolute selected HT index and resets previous data', ({c}) => {
  const rows = Array.from({length: 43}, (_, i) => ({HaktanggunganId: `HT-${i}`}));
  c.flowResults.set('certificates:ht', {response: {data: rows}});c.htDetailData = [normalRow];let item;
  c.loadHtDetail = row => {item = row};c.flowPageIndex = 1;
  const html = c.flowResultView(c.currentFlow(), {data: rows});assert.match(html, /data-index="31"/);
  c.showFlowDetail(31);assert.equal(item, rows[31]);assert.equal(c.htDetailData, null);assert.equal(c.detailSequence, 1);
});
await check('HT detail dispatch remains isolated to HT tab and rejects unlisted indices', ({c, modal}) => {
  const rows = [normalRow];c.flowResults.set('certificates:ht', {response: {data: rows}});let calls = 0;c.loadHtDetail = () => {calls++};
  for (const tab of ['wakaf', 'tanah']) {c.currentFlow = () => ({key: 'certificates:ht', def: {title: 'Fixture'}, tab: {id: tab}});c.showFlowDetail(0)}
  assert.equal(calls, 0);assert.equal(modal.innerHTML, '');assert.equal(modal.open, false); // Shared certificate rows without their own ID cannot open detail.
  c.currentFlow = () => ({key: 'certificates:ht', def: {title: 'Fixture'}, tab: {id: 'ht'}});
  c.showFlowDetail(43);c.showFlowDetail(-1);assert.equal(calls, 0);
});
await check('HT row without selected ID retains generic inspection without fetching', ({c, modal, calls}) => {
  c.flowResults.set('certificates:ht', {response: {data: [{Nama: 'NO-ID-ROW'}]}});c.showFlowDetail(0);
  assert.match(modal.innerHTML, /NO-ID-ROW/);assert.match(modal.innerHTML, /Data lengkap/);assert.equal(calls.length, 0);
});
await check('actual modal-close action clears HT cache and prevents its late response', async ({c, modal, events}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);c.htDetailData = [normalRow];
  await events.click({target: {closest: () => ({dataset: {action: 'modal-close'}})}});
  assert.equal(c.htDetailData, null);assert.equal(modal.open, false);const html = modal.innerHTML;
  d.resolve(result([normalRow]));await request;assert.equal(modal.innerHTML, html);assert.equal(c.htDetailData, null);
});
await check('actual modal cancel handler clears HT cache while busy cancellation is prevented', ({c, events}) => {
  c.htDetailData = [normalRow];c.pending = {fixture: true};let prevented = 0;
  events['modal:cancel']({preventDefault() {prevented++}});assert.equal(c.htDetailData, null);assert.equal(c.pending, null);
  c.htDetailData = [normalRow];c.busy = true;events['modal:cancel']({preventDefault() {prevented++}});
  assert.equal(prevented, 1);assert.equal(c.htDetailData.length, 1);
});
await check('actual navigation invalidates HT request sequence and clears detail cache', async ({c, modal}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadHtDetail(normalRow);c.htDetailData = [normalRow];
  const sequence = c.detailSequence;c.location.hash = '#/dashboard';c.navigate();
  assert.equal(c.route, 'dashboard');assert.equal(c.detailSequence, sequence + 1);assert.equal(c.htDetailData, null);assert.equal(modal.open, false);
  const html = modal.innerHTML;d.resolve(result([normalRow]));await request;assert.equal(modal.innerHTML, html);assert.equal(c.htDetailData, null);
});

const css = fs.readFileSync(new URL('../../webapp/styles.css', import.meta.url), 'utf8');
const report = {
  source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'),
  styles_sha256: createHash('sha256').update(css).digest('hex'),
  passed: passed.length, checks: passed, network_calls: 0,
  scope: 'Actual extracted HT functions, source escape/JSON helpers, session cleanup, navigation, and event handlers with local mocks; no APK runtime, browser-layout, or production HT acceptance claim.',
};
report.predecessorHarness='analysis/rea/review_ht_flows.mjs';
report.noVerificationOwner=true;
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/daring-ht-frontend-review-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
