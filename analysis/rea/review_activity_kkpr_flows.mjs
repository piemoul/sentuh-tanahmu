// Current source functions with synthetic DOM/API fixtures; never production data.
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
import {parcelMapView} from '../../webapp/parcel-map.js';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const line = lines.filter(line => new RegExp(`^(async )?function ${name}\\(`).test(line)).at(-1);
  assert.ok(line, `Missing actual function ${name}`);return line;
};
const names = ['berkasBookmarkOperation','berkasBookmarkEnvelope','berkasBookmarkValues','berkasBookmarkEligible','berkasBookmarkCurrent','berkasBookmarkForDetail','berkasBookmarkButton','berkasBookmarkView','berkasBookmarkPaint','berkasBookmarkAuth','loadBerkasBookmarkStatus','berkasBookmarkCollectionChanged','submitBerkasBookmark','nativeAccountSummary','resetSearchFileNavigation','resetPartnerNavigation','nativeResponseObject','activityItem','activityRows','activityCategories','activityMatches','activityDetailTarget','activityDeleteOperation','activityCard','activityDocumentType','activityDocumentGeoControls','loadActivityDocument','nativeDocumentProfileName','spsDocumentLinks','listPagination','activityListView','filterActivity','loadActivityDetail','kkprStringFields','isKkprItem','kkprRows','kkprMatches','kkprCard','kkprListView','kkprFacts','kkprMapView','kkprDocumentTarget','kkprDocumentControls','kkprDetailView','showKkprDetail','nativeListMode','collectionDetailTarget','collectionItem','collectionRows','collectionDate','collectionBerkasCard','collectionListView','nativeListResultView','filterFlow','showFlowDetail','flowResultView','flowData','dataItems','itemTitle','facts','result','redact','clearPrivate','resetNewsNavigation','resetCollectionNavigation','navigate','runFlow','collectionDetailView','isBerkasDetail','berkasStatus','berkasSection','berkasParties','berkasOffice','berkasJourneyCurrent','berkasJourney','berkasReadSection','berkasDetailView','berkasSupplementView','loadBerkasSection','loadBerkasSections','certificateText','certificateFacts'];
const declarations = names.map(get).join('\n');
const operation = endpoint => OPERATIONS.find(op => op.endpoint === endpoint && op.enabled && op.effect === 'read');
const result = data => ({result: {status: 200, data}});
const activityResponse = rows => ({status: 200, data: {data: rows}});
const kkprResponse = rows => ({status: 200, data: {message: rows}});
const clone = data => JSON.parse(JSON.stringify(data));
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {promise, resolve, reject}};
const activity = {userActivityId: 'FIXTURE-ACTIVITY', activityType: 'CariBidang', contentId: 'FIXTURE-PERSIL', title: 'Activity Fixture', subTitle: 'Subtitle Fixture', createdAt: '2026-01-02T23:30:00-07:00', platform: 'PRIVATE-PLATFORM', status: 'PRIVATE-STATUS'};
const kkpr = {kkprId: 'FIXTURE-KKPR', nomor: 'KKPR-001', judulKbli: 'Judul Fixture', jenisKkpr: 'Jenis Fixture', hasilKkpr: 'Hasil Fixture', geometry: null, pertimbangan: []};
const berkas = {berkasId: 'RESPONSE-ID-MUST-NOT-REPLACE-SELECTED', nomor: 7, tahun: 2026, statusBerkas: 1, namaProsedur: 'Prosedur Fixture', parapihak: [], perjalananBerkas: []};
const polygon = {type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]]};
const geometryResponse = {type: 'FeatureCollection', features: [{type: 'Feature', properties: {}, geometry: polygon}]};
const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function active(mode) {const endpoint = mode === 'activity' ? 'activity/GetUserActivity' : 'KKPR/GetKKPRList?nomorIdentitas={value}';return {key: `${mode}:default`, def: {title: mode === 'activity' ? 'Aktivitas' : 'KKPR', asset: 'fixture.svg'}, tab: {}, op: {...operation(endpoint)}}}

function harness() {
  const calls = [], records = [], toasts = [], events = {}, slots = [], queueDispatch = [], tasks = [];
  let selected = active('activity');
  const modal = {
    innerHTML: '', open: false, showModal() {this.open = true}, close() {this.open = false},
    querySelectorAll(selector) {
      if (selector !== '[data-action="berkas-read"]') return [];
      return [...this.innerHTML.matchAll(/data-action="berkas-read" data-kind="([^"]+)" data-berkas-id="([^"]+)"/g)].map(match => {
        const slot = {innerHTML: '', isConnected: true};slots.push(slot);
        return {dataset: {kind: match[1], berkasId: decode(match[2])}, isConnected: true, disabled: false, hidden: true,
          closest: selector => selector === 'dialog' ? modal : {querySelector: () => slot}};
      });
    },
    addEventListener(name, handler) {(events[`modal:${name}`] ??= []).push(handler)},
  };
  const selector = {focusCalls: 0, focus() {this.focusCalls++}, setSelectionRange() {}};
  const state = {authenticated: true, user: {username: 'fixture-only'}, operations: OPERATIONS.map(op => ({...op})), results: new Map(), activity: [{label: 'LOCAL-LOG-ONLY'}], points: [], connection: {configured: true}};
  const c = createPersilFixtureContext({
    state, Map, Object, Array, String, Number, JSON, Intl, console, URLSearchParams, parcelMapView, queueMicrotask: task => tasks.push(task),
    flowResults: new Map(), flowDetail: null, htDetailData: null, flowQuery: '', flowPageIndex: 0,
    detailSequence: 0, sessionEpoch: 0, searchFileState: null, partnerFrame: null, comparison: null, comparisonSelection: {}, pending: null, selected: null,
    route: 'activity', flowTab: '', busy: false, search: '', group: 'Semua', filter: 'Semua',
    routes: {activity: 'Aktivitas', kkpr: 'KKPR', dashboard: 'Beranda'}, location: {hash: '#/activity'},
    document: {body: {classList: {remove() {}}}, addEventListener(name, handler) {(events[name] ??= []).push(handler)}},
    window: {scrollTo() {}}, currentFlow: () => selected, openActivityQueueDetail: item => queueDispatch.push(item),
    ready: op => op.enabled === true, write: op => op.effect === 'write',
    $: name => ['#activity-filter','#flow-search'].includes(name) ? selector : modal,
    icon: () => '', empty: text => text, notice: text => text, humanField: key => key,
    renderCalls: 0, render: () => {c.renderCalls++}, record: (...args) => records.push(args), toast: message => toasts.push(message),
    api: async (path, options) => {
      calls.push({path, options});const endpoint = OPERATIONS.find(op => op.id === options.body.operationId)?.endpoint;
      if (endpoint === '/berkas/CariBerkas') return result(berkas);
      if (endpoint === 'berkas/berkassop') return result({lewatTenggat: false, tipeProduk: 'Rutin'});
      if (endpoint === 'berkas/getStatusCetak') return result({error: false, message: 'PRINT-FIXTURE'});
      if (endpoint === 'legacy/GetParcelBoundaryById?persilid={value}') return result(geometryResponse);
      if (endpoint === 'activity/GetUserActivity') return result({data: [activity]});
      if (endpoint === 'KKPR/GetKKPRList?nomorIdentitas={value}') return result({message: [kkpr]});
      throw new Error(`Unexpected fixture operation ${endpoint}`);
    },
  });
  vm.runInContext(declarations, c);
  const escLine = lines.find(line => line.startsWith('const $='));vm.runInContext(`globalThis.esc=${escLine.slice(escLine.indexOf('esc=') + 4)}`, c);
  for (const name of ['json','badge']) vm.runInContext(lines.find(line => line.startsWith(`const ${name}=`)).replace(`const ${name}=`, `globalThis.${name}=`), c);
  for (const line of lines.filter(line => /^document.addEventListener\('(click|change|input)'/.test(line) || line.startsWith("$('#modal').addEventListener('cancel'"))) vm.runInContext(line, c);
  return {c, state, modal, calls, records, toasts, events, selector, slots, queueDispatch, tasks, use(mode) {selected = active(mode);c.route = mode;return selected}};
}
// Direct-loader checks still establish the actual selected-row/read ownership
// that showFlowDetail now supplies before invoking the unchanged loader.
function loadOwnedActivityDetail(c,item){
  c.flowDetail=item;
  let reader=c.flowResults.get('activity:default');
  if(!reader?.response){reader={response:activityResponse([])};c.flowResults.set('activity:default',reader);}
  const rows=c.activityRows(reader.response);
  if(Array.isArray(rows)&&!rows.includes(item))rows.push(item);
  return c.loadActivityDetail(item);
}
const passed = [];
async function check(name, fn) {await fn(harness());passed.push(name)}

await check('native response helper parses string JSON objects and rejects non-200 or non-object envelopes', ({c}) => {
  assert.equal(c.nativeResponseObject({status: 200, data: '{"message":[]}'}).message.length, 0);
  for (const response of [{status: 201, data: {}}, {status: 400, data: {}}, {data: 'invalid'}, {data: '[]'}, {data: []}, {data: null}]) assert.equal(c.nativeResponseObject(response), null);
});
await check('Activity parser retains eight camelCase fields with six empty-string defaults and no invented date', ({c}) => {
  const before = JSON.stringify(activity), model = c.activityItem(activity);assert.equal(Object.keys(model).length, 8);assert.equal(JSON.stringify(activity), before);
  const empty = c.activityItem({title: null});for (const key of ['userActivityId','activityType','platform','title','subTitle','status']) assert.equal(empty[key], '');
  assert.equal(empty.contentId, null);assert.equal(empty.createdAt, null);
  for (const row of [null, [], {}, {Title: 'wrong-case'}, {title: 7}, {contentId: 7}, {createdAt: 7}, {status: false}]) assert.equal(c.activityItem(row), null);
});
await check('Activity envelope uses data before message with null-only fallback and no shape guessing', ({c}) => {
  const first = [activity], second = [{title: 'second'}];assert.equal(c.activityRows({data: {data: first, message: second}}), first);
  assert.equal(c.activityRows({data: {data: null, message: second}}), second);assert.equal(c.activityRows({data: {data: [], message: second}}).length, 0);
  for (const response of [{data: [activity]}, {data: null}, {data: 'invalid'}, {status: 500, data: {data: first}}, {data: {data: [null]}}, {data: {message: [{wrong: 'model'}]}}]) assert.equal(c.activityRows(response), null);
  assert.equal(c.activityRows({status: 200, data: JSON.stringify({data: first})}).length, 1);
});
// ACTIVITY-FLOW.md: non-list data ?? message sets an internal error flag; the native
// controller emits an empty list. This asserts its display result, not success parity.
await check('Activity non-list or absent selected list field yields the native empty-list display model', ({c}) => {
  for (const body of [{}, {data: null}, {message: null}, {message: ''}, {message: ' '}, {message: false}, {message: 0}, {message: {}}, {error: false, message: ' '}, {error: true, message: 'fixture error'}]) {
    const before = JSON.stringify(body);
    for (const data of [body, JSON.stringify(body)]) assert.deepEqual(clone(c.activityRows({status: 200, data})), []);
    assert.equal(JSON.stringify(body), before);
  }
});
await check('Activity non-null non-list data does not guess rows from the otherwise valid message alias', ({c}) => {
  for (const data of ['', false, 0, {}, {rows: [activity]}]) assert.deepEqual(clone(c.activityRows({status: 200, data: {data, message: [activity]}})), []);
  assert.equal(c.activityRows({status: 200, data: {data: null, message: [activity]}})[0], activity);
  assert.equal(c.activityRows({status: 200, data: {message: [activity]}})[0], activity);
});
await check('Activity native non-list response renders empty controls and cannot dispatch an obsolete row', ({c, use, calls, modal}) => {
  const current = use('activity'), response = {status: 200, data: {error: false, message: ' '}};
  c.flowPageIndex = 4;c.flowResults.set(current.key, {response});
  const html = c.flowResultView(current, response);assert.match(html, /Tidak ada aktivitas/);assert.match(html, /id="activity-filter"/);assert.match(html, /data-action="flow-load"/);
  assert.doesNotMatch(html, /response-facts|class="data-card activity-card"|data-action="flow-detail"/);
  c.showFlowDetail(0);assert.equal(calls.length, 0);assert.equal(modal.open, false);
});
await check('Activity categories retain exact native order and no free-text category', ({c}) => {
  assert.deepEqual(clone(c.activityCategories()), ['Semua','Berkas','Bidang','Antrian','Scan','Login','Penandaan Lokasi','Lainnya']);
  assert.equal(c.activityMatches(activity, 'custom query'), false);assert.equal(c.activityMatches(activity, 'Semua'), true);
});
await check('Activity Berkas/Bidang/Antrian categories use lowercase substrings without trimming', ({c}) => {
  for (const [type, category] of [['CARIberkasLater','Berkas'],['PREFIXBIDANGsuffix','Bidang'],['OnlineANTRIANNext','Antrian']]) assert.equal(c.activityMatches({...activity, activityType: type}, category), true);
  assert.equal(c.activityMatches({...activity, activityType: 'BerkasBidang'}, 'Berkas'), true);assert.equal(c.activityMatches({...activity, activityType: 'BerkasBidang'}, 'Bidang'), true);
});
await check('Activity Scan and Penandaan categories use exact normalized types rather than substrings', ({c}) => {
  for (const type of ['SCANDOKUMEN','scandokumenpbt']) assert.equal(c.activityMatches({...activity, activityType: type}, 'Scan'), true);
  for (const type of ['Scan','SCANDOKUMENEXTRA',' SCANDOKUMEN']) assert.equal(c.activityMatches({...activity, activityType: type}, 'Scan'), false);
  for (const type of ['GEOTAG','aktivasiberkasgeotag']) assert.equal(c.activityMatches({...activity, activityType: type}, 'Penandaan Lokasi'), true);
  for (const type of ['GEOTAG-extra',' GEOTAG']) assert.equal(c.activityMatches({...activity, activityType: type}, 'Penandaan Lokasi'), false);
});
await check('Activity Login is exact while Lainnya excludes all audited lowercase substrings', ({c}) => {
  assert.equal(c.activityMatches({...activity, activityType: 'LOGIN'}, 'Login'), true);assert.equal(c.activityMatches({...activity, activityType: ' LOGIN'}, 'Login'), false);
  for (const part of ['berkas','bidang','antrian','scandokumen','scandokumenpbt','geotag','aktivasiberkasgeotag','login','caribidang']) assert.equal(c.activityMatches({...activity, activityType: `x${part}x`}, 'Lainnya'), false);
  assert.equal(c.activityMatches({...activity, activityType: 'Unknown'}, 'Lainnya'), true);assert.equal(c.activityMatches({...activity, activityType: ''}, 'Lainnya'), true);
});
await check('Activity selected target follows native ordered matches and exact full/prefix identifiers', ({c}) => {
  const id = ' LEFT-ID :RIGHT-ID ';
  for (const type of ['CariBidang','BidangBerkas']) assert.deepEqual(clone(c.activityDetailTarget({...activity, activityType: type, contentId: id})), {type: 'PERSIL', endpoint: 'legacy/GetParcelBoundaryById?persilid={value}', values: {persilid: id}});
  for (const type of ['CariBerkas','AktivasiBerkasGeotag','BerkasAntrian']) assert.deepEqual(clone(c.activityDetailTarget({...activity, activityType: type, contentId: id})), {type: 'BERKAS', endpoint: '/berkas/CariBerkas', values: {berkasId: ' LEFT-ID '}});
  assert.equal(c.activityDetailTarget({...activity, activityType: 'GEOTAG', contentId: id}).values.berkasId, id);
});
await check('Activity Scan PBT uses subtitle routing while other document selections retain their full identifier', ({c}) => {
  const pbt = c.activityDetailTarget({...activity, activityType: 'SCANDOKUMEN', subTitle: 'Hasil PBT fixture'});assert.equal(pbt.type, 'PERSIL');assert.equal(pbt.values.persilid, activity.contentId);
  assert.deepEqual(clone(c.activityDetailTarget({...activity, activityType: 'SCANDOKUMENPBT', subTitle: 'Other'})), {type: 'DOKUMEN', endpoint: 'apis/GetDocument', values: {q: activity.contentId}});
  assert.deepEqual(clone(c.activityDetailTarget({...activity, activityType: 'AntrianScandokumen', subTitle: 'PBT'})), {type: 'ANTRIAN', endpoint: 'api/antrian/{path_argument_1}', values: {path_argument_1: activity.contentId}});
  for (const contentId of [null, '', '   ']) assert.equal(c.activityDetailTarget({...activity, contentId}), null);
  assert.equal(c.activityDetailTarget({...activity, activityType: 'CariBerkas', contentId: ':tail'}), null);assert.equal(c.activityDetailTarget({...activity, activityType: 'Login'}), null);
});
await check('Activity cards show only title/subtitle/raw timestamp and escape supplied markup', ({c}) => {
  const html = c.activityCard({...activity, title: '<img src=x onerror="bad()">'}, 31);
  assert.match(html, /&lt;img/);assert.doesNotMatch(html, /<img src=x|PRIVATE-PLATFORM|PRIVATE-STATUS|FIXTURE-ACTIVITY/);assert.match(html, /2026-01-02T23:30:00-07:00/);assert.match(html, /data-index="31"/);
  assert.match(c.activityCard({title: 'Missing date'}, 0), /activity-date">-</);assert.match(html, /data-action="activity-delete" data-index="31"/);
});
await check('Activity icon names use case-sensitive native mapping independently of category case folding', ({c}) => {
  for (const [activityType, asset] of Object.entries({CariBidang:'location.svg', CariBerkas:'find.svg', Scan:'file_search.svg', AntrianOnline:'antre.svg', Login:'account.svg', SCANDOKUMEN:'barcode.svg', SCANDOKUMENPBT:'barcode.svg', scandokumen:'location.svg'})) assert.ok(c.activityCard({...activity, activityType}, 0).includes(`assets/icons/${asset}`));
});
await check('Activity queue and audited document controls are available', ({c}) => {
  assert.match(c.activityCard({...activity, activityType: 'AntrianOnline', subTitle: 'Other'}, 0), /data-index="0"/);
  assert.doesNotMatch(c.activityCard({...activity, activityType: 'AntrianOnline', subTitle: 'Other'}, 0), /data-action="flow-detail"[^>]* disabled/);
  const documentCard = c.activityCard({...activity, activityType: 'SCANDOKUMEN', subTitle: 'Other'}, 0);
  assert.match(documentCard, /data-action="flow-detail" data-index="0"/);assert.doesNotMatch(documentCard, /data-action="flow-detail"[^>]* disabled/);
  assert.doesNotMatch(c.activityCard({...activity, activityType: 'Login'}, 0), /data-action="flow-detail"/);
});
await check('Activity category pagination retains all 105 rows and absolute original indices', ({c}) => {
  const rows = Array.from({length: 105}, (_, i) => ({...activity, title: `ACT-${i}`, activityType: i % 2 ? 'Login' : 'CariBidang'}));c.flowQuery = 'Bidang';c.flowPageIndex = 1;
  const html = c.activityListView(activityResponse(rows));assert.match(html, /21–40 dari 53/);assert.equal((html.match(/class="data-card activity-card"/g) || []).length, 20);assert.match(html, /data-index="40"/);assert.match(html, /data-index="78"/);
  c.flowPageIndex = 2;assert.match(c.activityListView(activityResponse(rows)), /data-index="104"/);
});
await check('Activity empty state retains category selector and never substitutes the local testing log', ({c, state}) => {
  const html = c.activityListView(activityResponse([]));assert.match(html, /Tidak ada aktivitas/);assert.match(html, /id="activity-filter"/);assert.doesNotMatch(html, /LOCAL-LOG-ONLY|id="flow-search"/);assert.equal(state.activity.length, 1);
});
await check('actual Activity category handler validates route/auth/cache and resets pagination locally', async ({c, use, events, calls, selector, state}) => {
  const current = use('activity');c.flowResults.set(current.key, {response: activityResponse([activity])});c.flowPageIndex = 3;
  for (const handler of events.change) await handler({target: {id: 'activity-filter', value: 'Bidang', closest: () => null}});
  assert.equal(c.flowQuery, 'Bidang');assert.equal(c.flowPageIndex, 0);assert.equal(selector.focusCalls, 1);assert.equal(calls.length, 0);
  state.authenticated = false;c.filterActivity('Scan');assert.equal(c.flowQuery, 'Bidang');state.authenticated = true;
  c.filterActivity('Unknown');assert.equal(c.flowQuery, 'Bidang');use('kkpr');c.filterActivity('Scan');assert.equal(c.flowQuery, 'Bidang');
});
await check('actual Activity dispatch selects original row from string envelope and guards unsupported actions', ({c, use}) => {
  const selected = use('activity'), rows = Array.from({length: 43}, (_, i) => ({...activity, contentId: `ROW-${i}`}));c.flowResults.set(selected.key, {response: {status: 200, data: JSON.stringify({data: rows})}});
  let received = null;c.loadActivityDetail = item => {received = item};c.showFlowDetail(31);assert.equal(received.contentId, 'ROW-31');assert.equal(c.detailSequence, 1);
  c.flowResults.set(selected.key, {response: activityResponse([{...activity, activityType: 'AntrianOnline'}])});received = null;c.showFlowDetail(0);assert.equal(received.contentId, activity.contentId);
});
await check('Activity parcel read uses full selected ID and existing geometry view', async ({c, calls, modal}) => {
  await loadOwnedActivityDetail(c,{...activity, contentId: 'PARCEL:WHOLE'});
  assert.equal(calls.length, 1);assert.equal(calls[0].options.body.operationId, operation('legacy/GetParcelBoundaryById?persilid={value}').id);assert.deepEqual(clone(calls[0].options.body.values), {persilid: 'PARCEL:WHOLE'});assert.match(modal.innerHTML, /official-map-canvas/);
});
await check('Activity BERKAS reads primary/SOP/print using split or full selected ID and never SPS', async ({c, calls, modal}) => {
  for (const [activityType, id] of [['CariBerkas','LEFT'], ['GEOTAG','LEFT:RIGHT'], ['AktivasiBerkasGeotag','LEFT']]) {
    calls.length = 0;await loadOwnedActivityDetail(c,{...activity, activityType, contentId: 'LEFT:RIGHT'});
    assert.deepEqual(calls.map(call => OPERATIONS.find(op => op.id === call.options.body.operationId).endpoint), ['/berkas/CariBerkas','berkas/berkassop','berkas/getStatusCetak']);
    assert.deepEqual(clone(calls.map(call => call.options.body.values)), [{berkasId: id},{berkasid: id},{berkasid: id}]);assert.doesNotMatch(modal.innerHTML, /data-kind="sps"/);
  }
});
await check('Activity loader guards unsupported destinations and delegates authorized queue reads', async ({c, state, calls, modal, queueDispatch}) => {
  state.authenticated = false;await loadOwnedActivityDetail(c,activity);state.authenticated = true;
  for (const override of [{enabled: false},{effect: 'write'}]) {state.operations = [{...operation('legacy/GetParcelBoundaryById?persilid={value}'), ...override}];await loadOwnedActivityDetail(c,activity)}
  state.operations = OPERATIONS;for (const activityType of ['AntrianOnline','Login']) await loadOwnedActivityDetail(c,{...activity, activityType, subTitle: 'Other'});
  assert.equal(calls.length, 0);assert.equal(modal.open, false);
  assert.equal(queueDispatch.length, 1);assert.equal(queueDispatch[0].contentId, activity.contentId);
});
await check('Activity unfamiliar BERKAS response keeps generic content without supplementary reads', async ({c, modal}) => {
  let calls = 0;c.api = async () => {calls++;return result({unmapped: 'UNKNOWN-BERKAS'})};await loadOwnedActivityDetail(c,{...activity, activityType: 'CariBerkas'});
  assert.equal(calls, 1);assert.match(modal.innerHTML, /UNKNOWN-BERKAS/);assert.doesNotMatch(modal.innerHTML, /data-action="berkas-read"/);
});
await check('Activity stale or closed primary responses cannot render or launch supplementary reads', async ({c, modal}) => {
  for (const mutate of [() => c.sessionEpoch++, () => c.detailSequence++, () => modal.close()]) {
    const d = deferred();let calls = 0;c.api = () => {calls++;return d.promise};const request = loadOwnedActivityDetail(c,{...activity, activityType: 'CariBerkas'});mutate();modal.innerHTML = 'NEW-CONTENT';d.resolve(result(berkas));await request;
    assert.equal(modal.innerHTML, 'NEW-CONTENT');assert.equal(calls, 1);
  }
});
await check('Activity late ordinary errors respect modal/sequence guards and current errors escape HTML', async ({c, modal}) => {
  const d = deferred();c.api = () => d.promise;const request = loadOwnedActivityDetail(c,activity);c.detailSequence++;modal.innerHTML = 'NEW-CONTENT';d.reject(new Error('OLD-ERROR'));await request;assert.equal(modal.innerHTML, 'NEW-CONTENT');
  c.api = async () => {throw new Error('<img src=x onerror="bad()">')};await loadOwnedActivityDetail(c,activity);assert.match(modal.innerHTML, /&lt;img/);assert.doesNotMatch(modal.innerHTML, /<img src=x/);
});
await check('Activity newer selection wins over slower old detail', async ({c, modal}) => {
  const old = deferred(), newer = deferred();let calls = 0;c.api = () => ++calls === 1 ? old.promise : newer.promise;
  const first = loadOwnedActivityDetail(c,{...activity, activityType: 'CariBerkas'});c.detailSequence++;const second = loadOwnedActivityDetail(c,{...activity, activityType: 'CariBerkas', contentId: 'SECOND'});
  newer.resolve(result({unknown: 'NEWER-DETAIL'}));await second;old.resolve(result({unknown: 'OLD-DETAIL'}));await first;
  assert.match(modal.innerHTML, /NEWER-DETAIL/);assert.doesNotMatch(modal.innerHTML, /OLD-DETAIL/);
});
for (const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']) await check(`Activity ${code} clears actual private state`, async ({c, state, modal}) => {
  c.flowQuery = 'Bidang';c.flowResults.set('private', {});state.results.set('private', {});c.api = async () => {throw Object.assign(new Error('fixture expiry'), {code})};await loadOwnedActivityDetail(c,activity);
  assert.equal(state.authenticated, false);assert.equal(state.user, null);assert.equal(c.flowQuery, '');assert.equal(c.flowResults.size, 0);assert.equal(state.results.size, 0);assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');
});
await check('Activity stale-session expiry leaves a replacement account intact', async ({c, state, modal, toasts}) => {
  const d = deferred();c.api = () => d.promise;const request = loadOwnedActivityDetail(c,activity);c.sessionEpoch++;state.user = {username: 'replacement'};modal.innerHTML = 'NEW-CONTENT';d.reject(Object.assign(new Error('expired'), {code: 'SESSION_EXPIRED'}));await request;
  assert.equal(state.authenticated, true);assert.equal(state.user.username, 'replacement');assert.equal(modal.innerHTML, 'NEW-CONTENT');assert.equal(toasts.length, 0);
});

await check('KKPR model has exactly 32 audited camelCase nullable string fields', ({c}) => {
  const expected = ['kkprId','nomor','jenisKkpr','tanggalTerbit','tanggalCetak','kodeKbli','judulKbli','alamatUsaha','luasDimohon','luasDisetujui','namaPemilik','koefDasar','koefLantai','indikasiUtama','garisSempadan','jarakBangunan','koefDasarHijau','koefTapak','jaringanUtilitas','hasilKkpr','jenisManfaatRuang','judulDelineasiKkpr','indikasiZonasi','kategoriKkpr','sumberDana','kodeUnik','adaBangunan','jumlahLantai','luasLantai','kodeIndeks','namaIndeks','nilaiIndeks'];
  assert.deepEqual(clone(c.kkprStringFields()), expected);
  for (const key of expected) {assert.equal(c.isKkprItem({[key]: null}), true);assert.equal(c.isKkprItem({[key]: ''}), true);assert.equal(c.isKkprItem({[key]: 7}), false)}
  for (const item of [null, [], {}, {Nomor: 'UPPER-ONLY'}, {unmapped: 'model'}]) assert.equal(c.isKkprItem(item), false);
});
await check('KKPR geometry and consideration guards retain nullable supported shapes without source mutation', ({c}) => {
  const item = {...kkpr, geometry: polygon, pertimbangan: [{kkprPertimbanganId: null, keterangan: 'note'}, {}]}, before = JSON.stringify(item);assert.equal(c.isKkprItem(item), true);assert.equal(JSON.stringify(item), before);
  for (const item of [{geometry: []}, {geometry: {type: 7}}, {pertimbangan: {}}, {pertimbangan: [null]}, {pertimbangan: [{keterangan: 7}]}, {pertimbangan: [{kkprPertimbanganId: false}]}]) assert.equal(c.isKkprItem(item), false);
});
await check('KKPR consumes exact message-list envelope including JSON strings and rejects invalid top-level or typed models', ({c}) => {
  const rows = [kkpr];assert.equal(c.kkprRows(kkprResponse(rows)), rows);assert.equal(c.kkprRows({status: 200, data: JSON.stringify({message: rows})}).length, 1);
  assert.equal(c.kkprRows({status: 200, data: {error: true, message: rows}}), rows); // Native builder never reads body.error.
  for (const response of [{data: rows}, {data: null}, {data: 'invalid'}, {data: {message: [null]}}, {data: {message: [{unknown: 'model'}]}}, {status: 500, data: {message: rows}}]) assert.equal(c.kkprRows(response), null);
});
// KKPR-FLOW.md: message must be List; its missing/null/non-list error branch emits
// an empty typed list. The request builder does not inspect the body's error flag.
await check('KKPR absent or non-list message follows native empty-list emission without changing the response', ({c}) => {
  for (const body of [{}, {message: null}, {message: ''}, {message: false}, {message: 0}, {message: {}}, {message: {rows: [kkpr]}}, {error: false, message: ' '}, {error: true, message: 'fixture error'}]) {
    const before = JSON.stringify(body);
    for (const data of [body, JSON.stringify(body)]) assert.deepEqual(clone(c.kkprRows({status: 200, data})), []);
    assert.equal(JSON.stringify(body), before);
  }
});
await check('KKPR message-only contract never discovers rows through data or differently cased aliases', ({c}) => {
  for (const body of [{data: [kkpr]}, {Message: [kkpr]}, {rows: [kkpr]}, {message: null, data: [kkpr]}, {message: '', data: [kkpr]}]) assert.deepEqual(clone(c.kkprRows({status: 200, data: body})), []);
  const rows = [kkpr];assert.equal(c.kkprRows({status: 200, data: {data: [{unknown: true}], message: rows}}), rows);
});
await check('KKPR native non-list response renders empty controls and cannot open an obsolete detail', ({c, use, calls, modal}) => {
  const current = use('kkpr'), response = {status: 200, data: {message: null, data: [kkpr]}};
  c.flowPageIndex = 4;c.flowResults.set(current.key, {response});
  const html = c.flowResultView(current, response);assert.match(html, /Kamu belum memiliki KKPR/);assert.match(html, /id="flow-search"/);assert.match(html, /data-action="flow-load"/);
  assert.doesNotMatch(html, /response-facts|class="data-card kkpr-card"|data-action="flow-detail"/);
  c.showFlowDetail(0);assert.equal(calls.length, 0);assert.equal(modal.open, false);
});
await check('KKPR search lowercases only number/title/type and preserves query spaces', ({c}) => {
  for (const query of ['kkpr-001','JUDUL FIXTURE','JENIS FIXTURE']) assert.equal(c.kkprMatches(kkpr, query), true);
  for (const query of ['FIXTURE-KKPR','Hasil Fixture',' KKPR-001 ']) assert.equal(c.kkprMatches(kkpr, query), false);
  assert.equal(c.kkprMatches({nomor: null}, ''), true);assert.equal(c.kkprMatches({nomor: null}, 'missing'), false);
});
await check('KKPR card uses audited three-line order, empty null defaults and escaped text', ({c}) => {
  const html = c.kkprCard(kkpr, 31);assert.ok(html.indexOf('Judul Fixture') < html.indexOf('KKPR-001'));assert.ok(html.indexOf('KKPR-001') < html.indexOf('Jenis Fixture'));assert.match(html, /data-index="31"/);
  assert.match(c.kkprCard({nomor: null}, 0), /<h3><\/h3><p class="kkpr-number"><\/p><p class="kkpr-kind"><\/p>/);
  const attack = c.kkprCard({...kkpr, judulKbli: '<img src=x onerror="bad()">'}, 0);assert.match(attack, /&lt;img/);assert.doesNotMatch(attack, /<img src=x/);
});
await check('KKPR filter/pagination retains original indices and complete source count beyond 100', ({c}) => {
  const rows = Array.from({length: 105}, (_, i) => ({...kkpr, kkprId: `ID-${i}`, nomor: `${i % 2 ? 'OTHER' : 'MATCH'}-${i}`}));c.flowQuery = 'match';c.flowPageIndex = 1;
  const html = c.kkprListView(kkprResponse(rows));assert.match(html, /21–40 dari 53/);assert.equal((html.match(/class="data-card kkpr-card"/g) || []).length, 20);assert.match(html, /data-index="40"/);assert.match(html, /data-index="78"/);
  c.flowPageIndex = 2;assert.match(c.kkprListView(kkprResponse(rows)), /data-index="104"/);
});
await check('KKPR empty list keeps local search/retry and unknown models retain generic view', ({c, use}) => {
  const html = c.kkprListView(kkprResponse([]));assert.match(html, /Kamu belum memiliki KKPR/);assert.match(html, /id="flow-search"/);assert.match(html, /data-action="flow-load"/);
  const unknown = c.flowResultView(use('kkpr'), {data: {message: [{unknown: 'UNMAPPED-KKPR'}]}});assert.match(unknown, /UNMAPPED-KKPR/);assert.doesNotMatch(unknown, /class="data-card kkpr-card"/);
});
await check('KKPR detail binds all 18 audited summary/term fields in order and preserves raw values', ({c}) => {
  const pairs = [['Nama Pemilik','namaPemilik'],['Jenis KKPR','jenisKkpr'],['Kategori KKPR','kategoriKkpr'],['Kode KKPR','kodeUnik'],['Kode KBLI','kodeKbli'],['Alamat Kegiatan','alamatUsaha'],['Tanggal Terbit','tanggalTerbit'],['Luas Dimohon','luasDimohon'],['Luas Disetujui','luasDisetujui'],['Jenis Peruntukan','jenisManfaatRuang'],['Koefisian Dasar Bangunan Maks.','koefDasar'],['Koefisien Lantai Bangunan Maks.','koefLantai'],['Koefisien Dasar Hijau Min.','koefDasarHijau'],['Indikasi Program Utama','indikasiUtama'],['Garis Sempadan Bangunan Min.','garisSempadan'],['Jarak Bebas Bangunan Min.','jarakBangunan'],['Keofisien Tapak Basement Maks.','koefTapak'],['jaringan Utilitas','jaringanUtilitas']];
  const item = {...kkpr, ...Object.fromEntries(pairs.map(([label, key], index) => [key, `RAW-${index}`])), indikasiZonasi: 'RAW-ZONASI'};
  const html = c.kkprDetailView(item).split('<details class="json-details"')[0];let previous = -1;
  for (const [index, [label]] of pairs.entries()) {const position = html.indexOf(`<dt>${label}</dt><dd>RAW-${index}`);assert.ok(position > previous, label);previous = position}
  assert.match(html, /RAW-7 m²/);assert.match(html, /RAW-8 m²/);assert.match(html, /RAW-ZONASI/);assert.match(html, /Hasil Fixture/);
  const nulls = c.kkprDetailView({kkprId: 'id'});assert.match(nulls, /<dt>Luas Dimohon<\/dt><dd>- m²/);assert.match(nulls, /<dt>Luas Disetujui<\/dt><dd>- m²/);
});
await check('KKPR dates and empty strings remain literal while notes retain all 105 entries', ({c}) => {
  const notes = Array.from({length: 105}, (_, i) => ({keterangan: `NOTE-${String(i).padStart(3, '0')}`}));notes[1].keterangan = null;notes[2].keterangan = '';
  const item = {...kkpr, tanggalTerbit: '2026-01-02T23:30:00-07:00', nomor: '', pertimbangan: notes}, before = JSON.stringify(item), html = c.kkprDetailView(item);
  assert.match(html, /2026-01-02T23:30:00-07:00/);assert.match(html, /kkpr-number"><\/p>/);assert.equal((html.match(/<li>/g) || []).length, 105);assert.match(html, /<li>-<\/li><li><\/li>/);assert.match(html, /NOTE-104/);assert.equal(JSON.stringify(item), before);
});
await check('KKPR optional geometry/considerations sections follow null and nonempty predicates', ({c}) => {
  for (const item of [{kkprId: 'id'}, {...kkpr, geometry: null, pertimbangan: []}, {...kkpr, pertimbangan: null}]) {
    const html = c.kkprDetailView(item);assert.doesNotMatch(html, /official-map-canvas|Dengan Mempertimbangkan/);
  }
  assert.match(c.kkprDetailView({...kkpr, pertimbangan: [{keterangan: null}]}), /Dengan Mempertimbangkan/);
});
await check('KKPR detail escapes text and renders the audited document control without fetching a secondary detail', ({c, calls}) => {
  const attack = '<img src=x onerror="bad()">', html = c.kkprDetailView({...kkpr, judulKbli: attack, alamatUsaha: attack, pertimbangan: [{keterangan: attack}]});
  assert.doesNotMatch(html, /<img src=x|href=|GetDocument|GetKKPRDetail/);assert.match(html, /&lt;img/);assert.match(html, /data-action="kkpr-document"/);assert.match(html, /data-kkpr-id="FIXTURE-KKPR"/);assert.equal(calls.length, 0);
  assert.match(c.kkprDetailView({nomor: 'fixture-no-id'}), /Referensi dokumen KKPR belum tersedia/);
});
await check('KKPR maps use first polygon ring only without altering any source coordinates', ({c}) => {
  const exterior = polygon.coordinates[0], hole = [[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]], geometry = {type: 'Polygon', coordinates: [exterior, hole]}, before = JSON.stringify(geometry);
  const html = c.kkprMapView({geometry});assert.match(html, /Sketsa KKPR/);assert.match(html, /Geometri KKPR dari layanan/);assert.match(html, /official-map-canvas/);
  assert.equal(html, c.kkprMapView({geometry: {type: 'Polygon', coordinates: [exterior]}}));assert.equal(JSON.stringify(geometry), before);
});
await check('KKPR MultiPolygon maps preserve first ring per polygon and reject unsupported geometry safely', ({c}) => {
  const exterior = polygon.coordinates[0], shifted = exterior.map(([x,y]) => [x + 2, y]), hole = [[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]];
  const geometry = {type: 'MultiPolygon', coordinates: [[exterior, hole], [shifted]]}, before = JSON.stringify(geometry);
  assert.equal(c.kkprMapView({geometry}), c.kkprMapView({geometry: {type: 'MultiPolygon', coordinates: [[exterior],[shifted]]}}));assert.equal(JSON.stringify(geometry), before);
  for (const geometry of [{type: 'Point', coordinates: [0,0]}, {type: 'Polygon', coordinates: [[[200,0],[201,0],[201,1],[200,0]]]}, {type: 'Polygon', coordinates: []}]) {
    const html = c.kkprMapView({geometry});assert.doesNotMatch(html, /official-map-canvas|NaN|Infinity/);
  }
});
await check('actual KKPR selection opens its selected local object without API requests', ({c, use, modal, calls}) => {
  const current = use('kkpr'), rows = Array.from({length: 43}, (_, i) => ({...kkpr, nomor: `KKPR-${i}`}));c.flowResults.set(current.key, {response: {status: 200, data: JSON.stringify({message: rows})}});c.showFlowDetail(31);
  assert.match(modal.innerHTML, /Informasi KKPR/);assert.match(modal.innerHTML, /KKPR-31/);assert.doesNotMatch(modal.innerHTML, /KKPR-30/);assert.equal(calls.length, 0);assert.equal(c.detailSequence, 1);
});
await check('KKPR local detail rejects unauthenticated or incompatible records', ({c, state, modal, calls}) => {
  state.authenticated = false;c.showKkprDetail(kkpr);state.authenticated = true;c.showKkprDetail({unmapped: 'model'});assert.equal(modal.open, false);assert.equal(modal.innerHTML, '');assert.equal(calls.length, 0);
});
await check('opening local KKPR detail invalidates a pending Activity response', async ({c, use, modal}) => {
  const d = deferred();c.api = () => d.promise;const request = loadOwnedActivityDetail(c,activity);const current = use('kkpr');c.flowResults.set(current.key, {response: kkprResponse([kkpr])});c.showFlowDetail(0);const html = modal.innerHTML;
  d.resolve(result(geometryResponse));await request;assert.equal(modal.innerHTML, html);assert.match(html, /Informasi KKPR/);
});
await check('actual private cleanup and navigation remove Activity/KKPR filters and cached detail data', ({c, state, modal}) => {
  c.flowQuery = 'Bidang';c.flowResults.set('activity:default', {response: activityResponse([activity])});c.showKkprDetail(kkpr);c.clearPrivate();assert.equal(c.flowQuery, '');assert.equal(c.flowResults.size, 0);assert.equal(modal.innerHTML, '');assert.equal(state.activity.length, 0);
  c.flowQuery = 'private';c.location.hash = '#/kkpr';c.navigate();assert.equal(c.flowQuery, '');assert.equal(c.route, 'kkpr');assert.equal(modal.open, false);
});

const css = fs.readFileSync(new URL('../../webapp/styles.css', import.meta.url), 'utf8');
const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), styles_sha256: createHash('sha256').update(css).digest('hex'), passed: passed.length, checks: passed, network_calls: 0, scope: 'Actual Activity/KKPR model, envelope, category/search, local/detail dispatch, BERKAS supplementary readers, geometry, cleanup and handlers. Synthetic data only; no APK runtime, production detail, native date/Unicode/basemap parity or mutation acceptance claim.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/activity-kkpr-frontend-review-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
