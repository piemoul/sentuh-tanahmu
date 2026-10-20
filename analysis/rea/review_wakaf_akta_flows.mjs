// Independent execution of current source functions with local DOM/API fixtures.
// No production requests, credentials, or parallel implementation of the application.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parcelMapView} from '../../webapp/parcel-map.js';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const declaration = lines.filter(line => new RegExp(`^(async )?function ${name}\\(`).test(line)).at(-1);
  assert.ok(declaration, `Missing actual source function: ${name}`);
  return declaration;
};
const names = ['resetSearchFileNavigation','resetPartnerNavigation','nativeResponseObject','activityItem','activityRows','activityCategories','activityMatches','activityDetailTarget','activityDeleteOperation','activityCard','listPagination','activityListView','filterActivity','loadActivityDetail','kkprStringFields','isKkprItem','kkprRows','kkprMatches','kkprCard','kkprListView','kkprFacts','kkprMapView','kkprDocumentTarget','kkprDocumentControls','kkprDetailView','showKkprDetail',
  'certificateListItem', 'certificateRowOpen', 'certificateListMatches', 'certificateListCard',
  'isAktaItem', 'aktaRows', 'aktaTitleCase', 'aktaMatches', 'aktaCertificate', 'aktaCard', 'toggleAkta', 'showAktaInfo',
  'nativeListMode', 'collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','nativeListResultView', 'filterFlow', 'showFlowDetail', 'clearPrivate', 'resetNewsNavigation','resetCollectionNavigation','navigate',
  'flowData', 'dataItems', 'itemTitle', 'facts', 'result', 'flowResultView', 'flowPage', 'runFlow', 'redact',
  'certificateDetailTarget', 'certificateText', 'isAnalogCertificate', 'isElectronicCertificate',
  'electronicCertificateNumber', 'electronicCertificatePrinted', 'electronicCertificateOptionalValue',
  'electronicCertificateLocation', 'electronicCertificateNote', 'electronicCertificateDetailView',
  'electronicCertificateDocumentTarget', 'electronicCertificateDocumentControls',
  'certificateMapControls', 'certificateFacts', 'certificateRecords', 'certificateLocation',
  'loadCertificateMap', 'loadCertificateMaps', 'certificateOwner', 'certificateSurvey', 'certificateNote',
  'certificateDetailView', 'loadCertificateDetail', 'htField', 'htListTitle', 'htDetailTarget',
];
const declarations = names.map(get).join('\n');
const operations = [
  {id: 'get-legacy-getinfosertifikat-d4340c', endpoint: 'legacy/GetInfoSertifikat'},
  {id: 'get-brankas-detailsertipikatnew-d43b54', endpoint: 'Brankas/DetailSertipikatNew'},
  {id: 'get-legacy-getparcelboundarybyid-d39898', endpoint: 'legacy/GetParcelBoundaryById?persilid={value}'},
].map(op => ({...op, enabled: true, effect: 'read', auth: 'session'}));
const certificate = {SertifikatId: 'FIXTURE-CERTIFICATE', Nama: 'Nama Fixture', Nomor: 'HAK-001', JenisHak: 'Wakaf', StatusEl: 0, StatusProses: null};
const analog = {Nomor: 'FIXTURE-ANALOG', JenisHak: 'Wakaf', Persil: [], PemilikPertama: [], SuratUkur: [], CatatanPendaftaran: []};
const electronic = {nibel: '12345678901234', jenisHak: 'Wakaf', kodeHat: 'FIXTURE-CODE', persilId: null, statusDI301A: false, listPemilik: [], catatan: []};
const akta = {aktaId: 'FIXTURE-AKTA', nomor: '0007', tipe: 'Akta Fixture', jenisPihak: 'Pihak Fixture', tglAkta: '2020-08-17T23:30:00-07:00', tglLapor: '2020-08-18', namaPPAT: 'PPAT Fixture', readyToRatingPPAT: true, sertipikatAkta: [{nomorHak: 'AKTA-HAK-001', statusEl: '0', wilayah: [{nama: 'BANDUNG BARAT', tipeWilayah: 'KABUPATEN'}]}]};
const reply = data => ({result: {status: 200, data}});
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};
function active(mode = 'wakaf') {
  const endpoint = mode === 'akta' ? 'Akta/GetAktaList?nik={value}' : mode === 'tanah' ? 'Legacy/SertifikatTanahNew' : mode === 'ht' ? 'legacy/GetSertipikatHT' : 'Legacy/GetSertipikatWakaf';
  const id = mode === 'wakaf' ? 'get-legacy-getsertipikatwakaf-d45354' : mode === 'akta' ? 'get-akta-getaktalist-d1ccc4' : `fixture-list-${mode}`;
  return {key: mode === 'akta' ? 'akta:default' : `certificates:${mode}`, op: {id, endpoint, enabled: true, effect: 'read', auth: 'session', fields: []}, def: {title: mode === 'akta' ? 'Aktaku' : 'Sertipikatku', asset: 'fixture.svg'}, tab: {id: mode, label: mode}};
}

function harness() {
  const calls = [], records = [], toasts = [], events = {};
  const modal = {innerHTML: '', open: false, showModal() {this.open = true}, close() {this.open = false}, querySelectorAll() {return this.innerHTML.includes('data-action="certificate-map"') ? c.mapButtons : []}, addEventListener(name, callback) {(events[`modal:${name}`] ??= []).push(callback)}};
  const searchInput = {focusCalls: 0, selections: [], focus() {this.focusCalls++}, setSelectionRange(a, b) {this.selections.push([a, b])}};
  const state = {authenticated: true, user: {username: 'fixture-only'}, operations: operations.map(o => ({...o})), results: new Map(), points: [], activity: [], selectedPoint: null, connection: {configured: true}};
  let selected = active();
  const c = vm.createContext({
    state, Map, Object, Number, Array, JSON, String, console, URLSearchParams, parcelMapView,
    flowResults: new Map(), flowPageIndex: 0, flowDetail: null, htDetailData: null, flowQuery: '',
    detailSequence: 0, sessionEpoch: 0, searchFileState: null, partnerFrame: null, comparison: null, comparisonSelection: {},
    selected: null, pending: null, busy: false, route: 'certificates', flowTab: 'wakaf',
    search: '', group: 'Semua', filter: 'Semua', routes: {certificates: 'Sertipikatku', akta: 'Aktaku', dashboard: 'Beranda'},
    location: {hash: '#/certificates'}, window: {scrollTo() {}}, mapButtons: [],
    document: {body: {classList: {remove() {}}}, addEventListener(name, callback) {(events[name] ??= []).push(callback)}},
    ready: o => o.enabled === true, write: o => o.effect === 'write', needsAuth: o => o.auth === 'session',
    $: selector => selector === '#flow-search' ? searchInput : modal, icon: () => '',
    empty: s => s, notice: s => s, humanField: s => s, head: (...parts) => parts.join(''),
    render: () => {c.renderCalls++}, renderCalls: 0,
    toast: text => toasts.push(text), record: (...args) => records.push(args),
    berkasDetailTarget: () => null, collectionDetailTarget: () => null,
    currentFlow: () => selected,
    api: async (path, options) => {calls.push({path, options});return reply(analog)},
  });
  vm.runInContext(declarations, c);
  const escLine = lines.find(line => line.startsWith('const $='));
  vm.runInContext(`globalThis.esc=${escLine.slice(escLine.indexOf('esc=') + 4)}`, c);
  for (const name of ['json', 'badge']) vm.runInContext(lines.find(line => line.startsWith(`const ${name}=`)).replace(`const ${name}=`, `globalThis.${name}=`), c);
  for (const line of lines.filter(line => line.startsWith("document.addEventListener('click'") || line.startsWith("document.addEventListener('input'") || line.startsWith("$('#modal').addEventListener('cancel'"))) vm.runInContext(line, c);
  return {c, state, modal, calls, records, toasts, events, searchInput, use(mode) {selected = active(mode);c.route = mode === 'akta' ? 'akta' : 'certificates';c.flowTab = mode;return selected}};
}
const passed = [];
async function check(label, fn) {await fn(harness());passed.push(label)}

await check('shared certificate parser normalizes exactly 13 typed fields without changing input', ({c}) => {
  const input = {...certificate, berakhirHak: 'date-a', validSampai: 'date-b', validSejak: 'date-c', Dibagikan: true, DibagikanSampai: 'date-d', ProsesInfo: 'info', StatusHT: 'status'};
  const before = JSON.stringify(input), model = c.certificateListItem(input);
  assert.equal(Object.keys(model).length, 13);assert.equal(model.BerakhirHak, 'date-a');assert.equal(model.ValidSampai, 'date-b');assert.equal(model.ValidSejak, 'date-c');assert.equal(model.Dibagikan, true);assert.equal(JSON.stringify(input), before);
});
await check('first eight certificate fields use null-only PascalCase fallback including StatusEl', ({c}) => {
  for (const [key, alias] of [['BerakhirHak','berakhirHak'], ['JenisHak','jenisHak'], ['Nama','nama'], ['Nomor','nomor'], ['SertifikatId','sertifikatId'], ['ValidSampai','validSampai'], ['ValidSejak','validSejak']]) {
    assert.equal(c.certificateListItem({[key]: 'primary', [alias]: 'alias'})[key], 'primary');
    assert.equal(c.certificateListItem({[key]: null, [alias]: 'alias'})[key], 'alias');
    assert.equal(c.certificateListItem({[key]: '', [alias]: 'alias'})[key], '');
    assert.equal(c.certificateListItem({[key]: 4, [alias]: 'alias'}), null);
  }
  assert.equal(c.certificateListItem({StatusEl: 0, statusEl: 1}).StatusEl, 0);
  assert.equal(c.certificateListItem({StatusEl: null, statusEl: 1}).StatusEl, 1);
  assert.equal(c.certificateListItem({StatusEl: '0', statusEl: 0}), null);
});
await check('remaining five certificate fields are Pascal-only and strictly typed', ({c}) => {
  const lower = {StatusEl: 1, statusProses: 0, dibagikan: true, dibagikanSampai: 'wrong', prosesInfo: 'wrong', statusHT: 'wrong'};
  const model = c.certificateListItem(lower);
  for (const key of ['StatusProses', 'Dibagikan', 'DibagikanSampai', 'ProsesInfo', 'StatusHT']) assert.equal(model[key], null);
  for (const row of [{StatusProses: '0'}, {StatusProses: 1.5}, {Dibagikan: 1}, {DibagikanSampai: false}, {ProsesInfo: {}}, {StatusHT: []}]) assert.equal(c.certificateListItem(row), null);
});
await check('certificate parser declines unknown or incompatible models instead of guessing', ({c}) => {
  for (const row of [null, [], {}, 'text', {Other: 'model'}, {SertifikatId: 3}, {StatusEl: 1.5}, {Dibagikan: 'true'}]) assert.equal(c.certificateListItem(row), null);
  assert.equal(c.certificateListItem({SertifikatId: 'fixture'}).StatusEl, null);
});
await check('shared Tanah/Wakaf native guard blocks only StatusEl 1 and StatusProses 0', ({c}) => {
  for (const StatusEl of [null, 0, 1, 2, -1]) for (const StatusProses of [null, 0, 1, 2, -1]) {
    const row = {...certificate, StatusEl, StatusProses};
    assert.equal(c.certificateRowOpen(row), !(StatusEl === 1 && StatusProses === 0));
    assert.equal(c.certificateDetailTarget(row) !== null, !(StatusEl === 1 && StatusProses === 0));
  }
  assert.equal(c.certificateRowOpen({...certificate, StatusEl: 1, statusProses: 0}), true);
});
await check('certificate selector keeps exact normalized ID and routes null/zero versus nonzero integer', ({c}) => {
  for (const StatusEl of [null, 0, 1, 2, -1]) {
    const id = ' FIXTURE-ID/?&+ ', target = c.certificateDetailTarget({SertifikatId: null, sertifikatId: id, StatusEl});
    assert.deepEqual(clone(target), StatusEl === null || StatusEl === 0 ? {endpoint: operations[0].endpoint, values: {sertifikatId: id}} : {endpoint: operations[1].endpoint, values: {id}});
  }
  assert.equal(c.certificateDetailTarget({SertifikatId: 'ID-WITHOUT-STATUS'}).endpoint, operations[0].endpoint);
  for (const row of [{SertifikatId: ''}, {SertifikatId: ' '}, {SertifikatId: '', sertifikatId: 'wrong'}, {Nomor: 'not-an-id'}, {SertifikatId: 7}, {SertifikatId: 'id', StatusEl: '1'}]) assert.equal(c.certificateDetailTarget(row), null);
});
await check('shared certificate cards retain native text, badges, and disabled guarded actions', ({c}) => {
  const analogHtml = c.certificateListCard(certificate, 31);
  assert.ok(analogHtml.indexOf('Nama Fixture') < analogHtml.indexOf('HAK-001'));assert.ok(analogHtml.indexOf('HAK-001') < analogHtml.indexOf('Wakaf'));
  assert.match(analogHtml, /aria-label="Sertipikat analog">A</);assert.match(analogHtml, /data-index="31"/);
  const blocked = c.certificateListCard({...certificate, StatusEl: 1, StatusProses: 0}, 32);
  assert.match(blocked, /aria-label="Sertipikat elektronik">E</);assert.match(blocked, /data-index="32" disabled/);assert.match(blocked, /sedang diproses/);
  assert.match(c.certificateListCard({...certificate, SertifikatId: null}, 33), /Referensi sertipikat belum tersedia/);
});
await check('certificate cards escape text and preserve null versus empty and raw status values', ({c}) => {
  const attack = '<img src=x onerror="bad()">';
  const html = c.certificateListCard({...certificate, Nama: attack, Nomor: '', JenisHak: null, Dibagikan: true, DibagikanSampai: 'RAW-DATE', ProsesInfo: attack, StatusHT: 'HT-STATUS'}, 0);
  assert.doesNotMatch(html, /<img/);assert.match(html, /&lt;img/);assert.match(html, /native-certificate-number"><\/p>/);assert.match(html, /native-certificate-right"><\/p>/);assert.match(html, /RAW-DATE/);assert.match(html, /HT-STATUS/);
  for (const StatusHT of [null, '', '-']) assert.doesNotMatch(c.certificateListCard({...certificate, StatusHT}, 0), /native-certificate-status/);
});
await check('certificate search uses only native name/number ASCII case folding without trim', ({c}) => {
  assert.equal(c.certificateListMatches(certificate, 'NAMA'), true);assert.equal(c.certificateListMatches(certificate, 'hak-001'), true);
  for (const query of ['Wakaf', 'FIXTURE-CERTIFICATE', ' Nama ', 'missing']) assert.equal(c.certificateListMatches(certificate, query), false);
  assert.equal(c.certificateListMatches({SertifikatId: 'fixture', Nama: null, Nomor: null}, 'x'), false);
});
await check('native list modes are selected by exact registered endpoint', ({c}) => {
  for (const mode of ['tanah', 'wakaf']) assert.equal(c.nativeListMode(active(mode)), 'certificate');
  assert.equal(c.nativeListMode(active('akta')), 'akta');assert.equal(c.nativeListMode(active('ht')), null);assert.equal(c.nativeListMode(null), null);
});
await check('filtered certificate pagination preserves original selected indices and complete result count', ({c, use}) => {
  const rows = Array.from({length: 105}, (_, i) => ({...certificate, SertifikatId: `ID-${i}`, Nama: i % 2 ? 'Other' : `Match-${i}`}));
  c.flowQuery = 'MATCH';c.flowPageIndex = 1;
  const html = c.flowResultView(use('wakaf'), {data: rows});
  assert.match(html, /21–40 dari 53/);assert.equal((html.match(/native-certificate-card/g) || []).length, 20);
  assert.match(html, /data-index="40"/);assert.match(html, /data-index="78"/);assert.doesNotMatch(html, /data-index="41"/);
  c.flowPageIndex = 2;assert.match(c.flowResultView(c.currentFlow(), {data: rows}), /data-index="104"/);
});
await check('shared Tanah and Wakaf renderers use native cards while unknown models retain fallback', ({c, use}) => {
  for (const mode of ['tanah', 'wakaf']) {
    assert.match(c.flowResultView(use(mode), {data: [certificate]}), /native-certificate-card/);
    const html = c.flowResultView(c.currentFlow(), {data: [{unmapped: 'UNKNOWN-CERTIFICATE'}]});
    assert.doesNotMatch(html, /native-certificate-card/);assert.match(html, /UNKNOWN-CERTIFICATE/);
  }
});
await check('actual Wakaf selection dispatch passes selected original row and respects native guard', ({c, use}) => {
  const rows = Array.from({length: 43}, (_, i) => ({...certificate, SertifikatId: `ID-${i}`}));const selected = use('wakaf');
  c.flowResults.set(selected.key, {response: {data: rows}});let item = null;c.loadCertificateDetail = row => {item = row};
  c.showFlowDetail(31);assert.equal(item, rows[31]);assert.equal(c.detailSequence, 1);
  rows[32] = {...certificate, StatusEl: 1, StatusProses: 0};item = null;c.showFlowDetail(32);assert.equal(item, null);
});
await check('actual Tanah selection shares native guard while HT stays on its dedicated path', ({c, use}) => {
  const selected = use('tanah');c.flowResults.set(selected.key, {response: {data: [{...certificate, StatusEl: 1, StatusProses: 0}]}});let called = false;c.loadCertificateDetail = () => {called = true};c.showFlowDetail(0);assert.equal(called, false);
  const ht = use('ht'), row = {HaktanggunganId: 'HT-FIXTURE'};c.flowResults.set(ht.key, {response: {data: [row]}});c.loadHtDetail = item => {assert.equal(item, row);called = true};c.showFlowDetail(0);assert.equal(called, true);
});
await check('Wakaf analog loader uses exact ID and existing renderer without invented parameters', async ({c, calls, modal}) => {
  await c.loadCertificateDetail({SertifikatId: null, sertifikatId: ' EXACT-ID ', statusEl: 0});
  assert.deepEqual(clone(calls), [{path: '/api/execute', options: {method: 'POST', body: {operationId: operations[0].id, values: {sertifikatId: ' EXACT-ID '}}}}]);
  assert.match(modal.innerHTML, /FIXTURE-ANALOG/);assert.match(modal.innerHTML, /Catatan Pendaftaran/);
});
await check('Wakaf electronic loader retains canonical shared visibility flags and exact endpoint', async ({c, modal}) => {
  let request;c.api = async (_path, options) => {request = options.body;return reply(electronic)};
  await c.loadCertificateDetail({sertifikatId: 'ELECTRONIC-ID', statusEl: 2, Dibagikan: true, DibagikanSampai: 'RAW-SHARED-DATE'});
  assert.deepEqual(clone(request), {operationId: operations[1].id, values: {id: 'ELECTRONIC-ID'}});
  assert.match(modal.innerHTML, /certificate-electronic/);assert.match(modal.innerHTML, /RAW-SHARED-DATE/);assert.doesNotMatch(modal.innerHTML, /FIXTURE-CODE|Kode Sertipikat/);
});
await check('shared certificate loader refuses unauthenticated, disabled, write-only, and blocked rows', async ({c, state, calls, modal}) => {
  state.authenticated = false;await c.loadCertificateDetail(certificate);state.authenticated = true;
  for (const op of [{...operations[0], enabled: false}, {...operations[0], effect: 'write'}]) {state.operations = [op];await c.loadCertificateDetail(certificate)}
  state.operations = operations;await c.loadCertificateDetail({...certificate, StatusEl: 1, StatusProses: 0});
  assert.equal(calls.length, 0);assert.equal(modal.open, false);
});
await check('Wakaf mapped Persil uses actual automatic map loader and only its source ID', async ({c, modal}) => {
  const slot = {innerHTML: '', isConnected: true}, button = {dataset: {persilId: 'MAP-EXACT-ID'}, isConnected: true, disabled: false, textContent: '', closest: () => ({querySelector: () => slot})};
  c.mapButtons = [button];const requests = [];
  c.api = async (_path, options) => {requests.push(options.body);return requests.length === 1 ? reply({...analog, Persil: [{PersilId: 'MAP-EXACT-ID', NamaWilayah: 'Fixture'}]}) : reply({type: 'FeatureCollection', features: []})};
  await c.loadCertificateDetail(certificate);
  assert.equal(requests.length, 2);assert.deepEqual(clone(requests[1]), {operationId: operations[2].id, values: {persilid: 'MAP-EXACT-ID'}});assert.match(modal.innerHTML, /data-persil-id="MAP-EXACT-ID"/);assert.equal(button.disabled, false);
});
await check('stale or closed Wakaf success cannot overwrite a dialog or start map reads', async ({c, modal}) => {
  for (const mutate of [() => c.sessionEpoch++, () => c.detailSequence++, () => modal.close()]) {
    const d = deferred();let calls = 0;c.api = () => {calls++;return d.promise};const request = c.loadCertificateDetail(certificate);mutate();modal.innerHTML = 'NEW-CONTENT';
    d.resolve(reply({...analog, Persil: [{PersilId: 'SHOULD-NOT-LOAD'}]}));await request;assert.equal(modal.innerHTML, 'NEW-CONTENT');assert.equal(calls, 1);
  }
});
await check('later certificate choice wins over an older outstanding Wakaf request', async ({c, modal}) => {
  const first = deferred(), second = deferred();let count = 0;c.api = () => ++count === 1 ? first.promise : second.promise;
  const old = c.loadCertificateDetail(certificate);c.detailSequence++;const newer = c.loadCertificateDetail({...certificate, SertifikatId: 'NEWER'});
  second.resolve(reply({...analog, Nomor: 'NEWER-DETAIL'}));await newer;first.resolve(reply({...analog, Nomor: 'STALE-DETAIL'}));await old;
  assert.match(modal.innerHTML, /NEWER-DETAIL/);assert.doesNotMatch(modal.innerHTML, /STALE-DETAIL/);
});
await check('stale-session Wakaf expiry does not sign out a replacement account', async ({c, state, modal}) => {
  const d = deferred();c.api = () => d.promise;const request = c.loadCertificateDetail(certificate);c.sessionEpoch++;state.user = {username: 'replacement'};modal.innerHTML = 'REPLACEMENT';
  d.reject(Object.assign(new Error('fixture'), {code: 'SESSION_EXPIRED'}));await request;assert.equal(state.authenticated, true);assert.equal(state.user.username, 'replacement');assert.equal(modal.innerHTML, 'REPLACEMENT');
});
for (const code of ['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED']) await check(`Wakaf ${code} clears actual private state including local query`, async ({c, state, modal}) => {
  c.flowQuery = 'PRIVATE-QUERY';c.flowResults.set('private', {});state.results.set('private', {});c.htDetailData = [certificate];c.api = async () => {throw Object.assign(new Error('fixture expiry'), {code})};
  await c.loadCertificateDetail(certificate);assert.equal(state.authenticated, false);assert.equal(state.user, null);assert.equal(c.flowQuery, '');assert.equal(c.flowResults.size, 0);assert.equal(state.results.size, 0);assert.equal(c.htDetailData, null);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');
});

await check('Aktaku accepts exact camelCase nullable scalars and defaultable nested collections', ({c}) => {
  assert.equal(c.isAktaItem(akta), true);assert.equal(c.isAktaItem({nomor: null, readyToRatingPPAT: null, sertipikatAkta: null}), true);
  assert.equal(c.isAktaItem({nomor: '', sertipikatAkta: [{nomorHak: null, statusEl: null, wilayah: null}, {wilayah: [{}]}]}), true);
  for (const row of [null, [], {}, {Nomor: 'UPPER-ONLY'}, {nomor: 7}, {readyToRatingPPAT: 'true'}, {sertipikatAkta: {}}, {sertipikatAkta: [null]}, {sertipikatAkta: [{statusEl: 0}]}, {sertipikatAkta: [{wilayah: [null]}]}, {sertipikatAkta: [{wilayah: [{nama: 4}]}]}]) assert.equal(c.isAktaItem(row), false);
});
await check('Aktaku response consumes message array and declines direct-list or error bodies', ({c}) => {
  const rows = [akta];assert.equal(c.aktaRows({data: {message: rows}}), rows);assert.equal(c.aktaRows({data: rows}), null);assert.equal(c.aktaRows({data: {error: true, message: rows}}), null);
});
await check('Aktaku missing or non-list message becomes an empty view as in the audited error path', ({c, use}) => {
  for (const body of [{}, {message: null}, {message: 'unexpected'}, {message: {nested: true}}]) {
    assert.equal(c.aktaRows({data: body}).length, 0);assert.match(c.flowResultView(use('akta'), {data: body}), /Kamu belum memiliki Akta/);
  }
});
await check('Aktaku heading and description retain raw dates, null placeholders and empty strings', ({c}) => {
  const html = c.aktaCard(akta, 7);assert.match(html, /Akta Fixture No\. 0007/);assert.match(html, /Tanggal 2020-08-17T23:30:00-07:00 sebagai Pihak Fixture dan sudah dilaporkan pada 2020-08-18/);
  const absent = c.aktaCard({nomor: null}, 0);assert.match(absent, /<h3> No\. -<\/h3>/);assert.match(absent, /Tanggal - sebagai - dan sudah dilaporkan pada -/);assert.match(absent, /Gagal mengambil Sertipikat/);
  assert.match(c.aktaCard({nomor: '', tipe: ''}, 1), /<h3> No\. <\/h3>/);
});
await check('Aktaku certificate badge tests exact string zero while null and other strings mean E', ({c}) => {
  for (const statusEl of ['0', '1', '', null, '00', 'false']) {
    const html = c.aktaCertificate({nomorHak: null, statusEl});assert.match(html, /Sertipikat Nomor -/);assert.match(html, /Wilayah tidak tersedia/);assert.match(html, statusEl === '0' ? /analog">A</ : /elektronik">E</);
  }
});
await check('Aktaku title-case applies to each whole region field and preserves supplied region order', ({c}) => {
  assert.equal(c.aktaTitleCase('BANDUNG BARAT'), 'Bandung barat');assert.equal(c.aktaTitleCase(null), '');assert.equal(c.aktaTitleCase(''), '');
  const html = c.aktaCertificate({nomorHak: 'N', wilayah: [{tipeWilayah: 'KABUPATEN', nama: 'BANDUNG BARAT'}, {tipeWilayah: 'DESA', nama: 'SUMBER JAYA'}]});
  assert.match(html, /Kabupaten Bandung barat, Desa Sumber jaya/);
});
await check('Aktaku retains all 105 nested certificates and 105 regions beyond preview limits', ({c}) => {
  const regions = Array.from({length: 105}, (_, i) => ({tipeWilayah: 'DESA', nama: `REGION-${String(i).padStart(3, '0')}`}));
  const rows = Array.from({length: 105}, (_, i) => ({nomorHak: `CERT-${String(i).padStart(3, '0')}`, statusEl: '0', wilayah: i === 104 ? regions : []}));
  const item = {...akta, sertipikatAkta: rows}, before = JSON.stringify(item), html = c.aktaCard(item, 31);
  assert.equal((html.match(/class="akta-certificate"/g) || []).length, 105);assert.match(html, /id="akta-extra-31" hidden/);assert.match(html, /CERT-104/);assert.match(html, /Region-104/);assert.equal((html.match(/Desa Region-/g) || []).length, 105);assert.equal(JSON.stringify(item), before);
  for (let i = 1; i < rows.length; i++) assert.ok(html.indexOf(rows[i - 1].nomorHak) < html.indexOf(rows[i].nomorHak));
});
await check('Aktaku escapes all supplied text without adding a detail, document or rating request action', ({c}) => {
  const attack = '<img src=x onerror="bad()">';const item = {...akta, tipe: attack, nomor: attack, tglAkta: attack, jenisPihak: attack, tglLapor: attack, sertipikatAkta: [{nomorHak: attack, wilayah: [{nama: attack, tipeWilayah: attack}]}]};
  const html = c.aktaCard(item, 0);assert.doesNotMatch(html, /<img|href=|data-action="flow-detail"|data-action=".*rating|data-action=".*document/);assert.match(html, /&lt;img/);assert.match(html, /Penilaian PPAT belum tersedia/);
});
await check('Aktaku rating availability is a local notice with true/null default and certificate gate', ({c}) => {
  for (const readyToRatingPPAT of [true, null, undefined]) assert.match(c.aktaCard({...akta, readyToRatingPPAT}, 0), /Penilaian PPAT belum tersedia/);
  assert.doesNotMatch(c.aktaCard({...akta, readyToRatingPPAT: false}, 0), /Penilaian PPAT belum tersedia/);
  assert.doesNotMatch(c.aktaCard({...akta, sertipikatAkta: []}, 0), /Penilaian PPAT belum tersedia/);
});
await check('Aktaku local search includes exactly five native fields without trimming', ({c}) => {
  for (const query of ['0007', 'AKTA FIXTURE', 'PIHAK FIXTURE', '2020-08-17', '2020-08-18']) assert.equal(c.aktaMatches(akta, query), true);
  for (const query of ['PPAT Fixture', 'FIXTURE-AKTA', 'AKTA-HAK-001', 'BANDUNG', ' 0007 ']) assert.equal(c.aktaMatches(akta, query), false);
  assert.equal(c.aktaMatches({nomor: null}, 'x'), false);assert.equal(c.aktaMatches({nomor: null}, ''), true);
});
await check('Aktaku filtering/pagination retains original indices and every source row remains reachable', ({c, use}) => {
  const rows = Array.from({length: 105}, (_, i) => ({...akta, nomor: `${i % 2 ? 'OTHER' : 'MATCH'}-${i}`}));c.flowQuery = 'match';c.flowPageIndex = 1;
  const html = c.flowResultView(use('akta'), {data: {message: rows}});assert.match(html, /21–40 dari 53/);assert.equal((html.match(/data-akta-index=/g) || []).length, 20);assert.match(html, /data-akta-index="40"/);assert.match(html, /data-akta-index="78"/);
  c.flowPageIndex = 2;assert.match(c.flowResultView(c.currentFlow(), {data: {message: rows}}), /data-akta-index="104"/);
});
await check('Aktaku unknown item models retain generic fallback and valid cards have no detail action', ({c, use}) => {
  const selected = use('akta');assert.doesNotMatch(c.flowResultView(selected, {data: {message: [akta]}}), /data-action="flow-detail"/);
  const html = c.flowResultView(selected, {data: {message: [{unmapped: 'UNKNOWN-AKTA'}]}});assert.match(html, /UNKNOWN-AKTA/);assert.doesNotMatch(html, /data-akta-index=/);
});
await check('native empty lists retain local search and explicit retry without network', ({c, use, calls}) => {
  for (const mode of ['wakaf', 'tanah', 'akta']) {
    const html = c.flowResultView(use(mode), {data: mode === 'akta' ? {message: []} : []});assert.match(html, /id="flow-search"/);assert.match(html, /data-action="flow-load"/);
    if (mode === 'akta') assert.match(html, /Kamu belum memiliki Akta/);
  }
  assert.equal(calls.length, 0);
});
await check('actual Wakaf retry stays on the Wakaf operation rather than the native pull-refresh misroute', async ({c, use, events, calls}) => {
  const selected = use('wakaf');c.flowResults.set(selected.key, {response: {data: []}});c.flowPageIndex = 3;
  for (const handler of events.click) await handler({target: {closest: selector => selector === '[data-action]' ? {dataset: {action: 'flow-load'}} : null}});
  assert.deepEqual(clone(calls), [{path: '/api/execute', options: {method: 'POST', body: {operationId: 'get-legacy-getsertipikatwakaf-d45354', values: {}}}}]);
  assert.equal(c.flowPageIndex, 0);assert.equal(c.flowResults.get(selected.key).loading, false);
});
await check('Aktaku local expand/collapse changes only its own certificate group and accessibility state', ({c, calls}) => {
  const extra = {hidden: true}, untouched = {hidden: true}, attrs = {}, button = {textContent: 'Lihat semua', closest: () => ({querySelector: () => extra}), setAttribute: (key, value) => {attrs[key] = value}};
  c.toggleAkta(button);assert.equal(extra.hidden, false);assert.equal(untouched.hidden, true);assert.equal(attrs['aria-expanded'], 'true');assert.equal(button.textContent, 'Tampilkan lebih sedikit');
  c.toggleAkta(button);assert.equal(extra.hidden, true);assert.equal(attrs['aria-expanded'], 'false');assert.equal(button.textContent, 'Lihat semua');assert.equal(calls.length, 0);
});
await check('actual Aktaku row dispatch does not invent a detail fetch or generic detail dialog', ({c, use, modal, calls}) => {
  const selected = use('akta');c.flowResults.set(selected.key, {response: {data: {message: [akta]}}});c.showFlowDetail(0);assert.equal(calls.length, 0);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');
});
await check('Aktaku information legend invalidates a pending certificate detail without API requests', async ({c, modal}) => {
  const d = deferred();let calls = 0;c.api = () => {calls++;return d.promise};const pending = c.loadCertificateDetail(certificate);c.showAktaInfo();
  assert.match(modal.innerHTML, /A : Sertipikat Analog/);assert.match(modal.innerHTML, /E : Sertipikat Elektronik/);const html = modal.innerHTML;
  d.resolve(reply(analog));await pending;assert.equal(modal.innerHTML, html);assert.equal(calls, 1);
});
await check('actual Aktaku page exposes its info control while unauthenticated data remains gated', ({c, use, state}) => {
  use('akta');state.authenticated = false;const html = c.flowPage();assert.match(html, /data-action="akta-info"/);assert.match(html, /Masuk untuk membuka Aktaku/);assert.doesNotMatch(html, /data-akta-index=/);
});
await check('local flow filtering resets page, retains exact query and restores focus/caret without fetching', ({c, searchInput, calls}) => {
  c.flowPageIndex = 3;c.filterFlow({isConnected: true, value: ' Name ', selectionStart: 2, selectionEnd: 4});
  assert.equal(c.flowQuery, ' Name ');assert.equal(c.flowPageIndex, 0);assert.equal(c.renderCalls, 1);assert.equal(searchInput.focusCalls, 1);assert.deepEqual(searchInput.selections, [[2, 4]]);assert.equal(calls.length, 0);
});
await check('local flow filtering rejects detached, unauthenticated and unrelated flow inputs', ({c, state, use}) => {
  const input = {isConnected: true, value: 'forbidden', selectionStart: 0, selectionEnd: 1};c.flowQuery = 'OLD';c.filterFlow({...input, isConnected: false});
  state.authenticated = false;c.filterFlow(input);state.authenticated = true;use('ht');c.filterFlow(input);assert.equal(c.flowQuery, 'OLD');assert.equal(c.renderCalls, 0);
});
await check('actual flow input and tab handlers update local query and clear it when switching tabs', async ({c, events}) => {
  for (const handler of events.input) await handler({target: {id: 'flow-search', isConnected: true, value: 'query', selectionStart: 0, selectionEnd: 2, closest: () => null}});
  assert.equal(c.flowQuery, 'query');c.flowPageIndex = 2;
  for (const handler of events.click) await handler({target: {closest: selector => selector === '[data-action]' ? {dataset: {action: 'flow-tab', id: 'tanah'}} : null}});
  assert.equal(c.flowTab, 'tanah');assert.equal(c.flowQuery, '');assert.equal(c.flowPageIndex, 0);
});
await check('actual navigation and private cleanup remove local list query and cached account rows', ({c, state, modal}) => {
  c.flowQuery = 'PRIVATE';c.location.hash = '#/akta';c.navigate();assert.equal(c.flowQuery, '');assert.equal(c.route, 'akta');assert.equal(modal.open, false);
  c.flowQuery = 'PRIVATE';c.flowResults.set('private', {});state.results.set('private', {});c.clearPrivate();assert.equal(c.flowQuery, '');assert.equal(c.flowResults.size, 0);assert.equal(state.results.size, 0);assert.equal(modal.innerHTML, '');
});

const css = fs.readFileSync(new URL('../../webapp/styles.css', import.meta.url), 'utf8');
const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), styles_sha256: createHash('sha256').update(css).digest('hex'), passed: passed.length, checks: passed, network_calls: 0, scope: 'Actual extracted shared Tanah/Wakaf and Aktaku functions, renderers, maps, cleanup/navigation and event handlers using local fixtures; no APK runtime, pixel parity, production acceptance or PPAT rating mutation claim.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/wakaf-akta-frontend-review-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
