// Actual frontend functions, synthetic DOM and deferred local responses only.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const names = ['resetSearchFileNavigation','resetPartnerNavigation','electronicCertificateDocumentTarget', 'electronicCertificateDocumentControls', 'loadElectronicCertificateDocument', 'nativeDocumentProfileName', 'nativeResponseObject', 'spsDocumentLinks', 'activityDocumentGeoControls', 'clearPrivate', 'certificateListItem', 'certificateRowOpen', 'certificateDetailTarget', 'isElectronicCertificate', 'isAnalogCertificate', 'certificateDetailView', 'electronicCertificateDetailView', 'electronicCertificateNumber', 'electronicCertificatePrinted', 'electronicCertificateOptionalValue', 'electronicCertificateLocation', 'electronicCertificateNote', 'certificateText', 'certificateFacts', 'certificateRecords', 'certificateMapControls', 'certificateLocation', 'certificateOwner', 'certificateSurvey', 'certificateNote', 'flowData', 'redact'];
const get = name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);
  return line;
};
const declarations = names.map(get).join('\n');
const profileOp = OPERATIONS.find(op => op.endpoint === 'account/account_summary');
const documentOp = OPERATIONS.find(op => op.endpoint === 'apis/GetDocument');
assert.ok(profileOp?.enabled && documentOp?.enabled);
const selectedId = ' selected-id : A +%\'!()*~é ';
const selected = {SertifikatId: selectedId, StatusEl: 1, StatusProses: 1, Dibagikan: false, StatusHT: '-'};
const detail = {sertipikatId: 'RESPONSE-ID-MUST-NOT-REPLACE-SELECTION', nibel: '12345678901234', jenisHak: 'SYNTHETIC', listPemilik: ['SYNTHETIC OWNER'], catatan: [], statusDI301A: false, isPrinted: 1, persilId: null};
const profile = nama => ({status: 200, data: {error: false, data: {nama, email: 'NOT-THE-NAME@example.invalid', username: 'NOT-THE-NAME', namaPemilik: 'NOT-THE-NAME'}}});
const pdf = {status: 200, contentType: 'application/pdf', previewUrl: '/api/preview/certificate-fixture', downloadUrl: '/api/download/certificate-fixture'};
const copy = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve, reject;const promise = new Promise((a, b) => {resolve = a;reject = b});return {resolve, reject, promise}};
const flush = async () => {for (let i = 0; i < 8; i++) await Promise.resolve()};

function harness() {
  const calls = [], records = [], toasts = [], events = {};
  const modal = {open: true, innerHTML: 'CERTIFICATE DETAIL AND MAP REMAIN', close() {this.open = false}};
  const slot = {isConnected: true, innerHTML: 'INITIAL DOCUMENT SLOT'};
  const wrapper = {querySelector: selector => selector === '.certificate-document-result' ? slot : null};
  const button = {dataset: {certificateId: selectedId}, isConnected: true, disabled: false, textContent: 'Buka Sertipikat', closest: selector => selector === 'dialog' ? modal : selector === '.certificate-document' ? wrapper : null};
  const state = {authenticated: true, user: {username: 'synthetic-account'}, operations: OPERATIONS.map(op => ({...op})), results: new Map(), points: [], activity: []};
  const c = vm.createContext({state, sessionEpoch: 0, searchFileState: null, partnerFrame: null, detailSequence: 0, flowResults: new Map(), flowDetail: selected, htDetailData: null, flowQuery: '', comparison: null, comparisonSelection: {}, pending: null, selected: null,
    ready: op => op.enabled === true, write: op => op.effect === 'write', $: () => modal,
    render() {}, toast: value => toasts.push(value), record: (...args) => records.push(args), icon: () => '', notice: text => text,
    result: () => '<p>GENERIC RESULT</p>', document: {addEventListener: (name, handler) => {events[name] = handler}},
    api: async (path, options) => {
      calls.push({path, ...copy(options.body)});
      assert.ok([profileOp.id, documentOp.id].includes(options.body.operationId), 'Only profile and PDF reads belong to this flow.');
      return {result: options.body.operationId === profileOp.id ? profile(' Exact profile & + ') : pdf};
    },
  });
  vm.runInContext(declarations, c);
  const esc = lines.find(line => line.startsWith('const $='));
  vm.runInContext(`globalThis.esc=${esc.slice(esc.indexOf('esc=') + 4)}`, c);
  vm.runInContext(lines.find(line => line.startsWith('const json=')).replace('const json=', 'globalThis.json='), c);
  const listener = lines.find(line => line.startsWith("document.addEventListener('click'") && line.includes('loadElectronicCertificateDocument(button)'));
  assert.ok(listener, 'Actual certificate document action listener exists.');
  vm.runInContext(listener, c);
  return {c, state, modal, slot, button, calls, records, toasts, events};
}
function pauseAt(h, stage) {
  const wait = deferred();
  h.c.api = async (path, options) => {
    h.calls.push({path, ...copy(options.body)});
    const current = options.body.operationId === profileOp.id ? 'profile' : options.body.operationId === documentOp.id ? 'pdf' : 'UNEXPECTED';
    assert.notEqual(current, 'UNEXPECTED');
    return current === stage ? wait.promise : {result: current === 'profile' ? profile(' Exact profile & + ') : pdf};
  };
  return wait;
}
const checks = [];
async function check(name, fn) {
  try {await fn(harness());checks.push({name, passed: true})}
  catch (error) {checks.push({name, passed: false, error: error.message})}
}

await check('document target uses the complete selected list ID, not the detail model ID or NIBel', h => {
  assert.deepEqual(copy(h.c.electronicCertificateDocumentTarget(detail, selected)), {q: selectedId + ':SERTIPIKATKU'});
  for (const sertipikatId of [undefined, null, '', 'different-detail-id']) {
    assert.deepEqual(copy(h.c.electronicCertificateDocumentTarget({...detail, sertipikatId}, selected)), {q: selectedId + ':SERTIPIKATKU'});
  }
  assert.deepEqual(copy(h.c.electronicCertificateDocumentTarget(detail, {...selected, SertifikatId: 'id:SERTIPIKATKU'})), {q: 'id:SERTIPIKATKU:SERTIPIKATKU'});
});
await check('target rejects missing, blank or nonstring selection instead of falling back to response IDs', h => {
  for (const SertifikatId of [undefined, null, '', '  ', 7, false, {}, []]) assert.equal(h.c.electronicCertificateDocumentTarget(detail, {...selected, SertifikatId}), null);
  assert.equal(h.c.electronicCertificateDocumentTarget(detail, {}), null);
});
await check('unrecognized detail model never gains a certificate PDF action', h => {
  for (const data of [null, undefined, [], {}, {...detail, statusDI301A: null}, {...detail, listPemilik: [{}]}, {...detail, luas: 20}]) {
    assert.equal(h.c.electronicCertificateDocumentTarget(data, selected), null);
    assert.doesNotMatch(h.c.electronicCertificateDocumentControls(data, selected), /data-action="certificate-document"/);
  }
});
await check('shared status does not hide a PDF action in an already loaded electronic detail', h => {
  for (const Dibagikan of [true, false, null, undefined]) {
    assert.deepEqual(copy(h.c.electronicCertificateDocumentTarget(detail, {...selected, Dibagikan})), {q: selectedId + ':SERTIPIKATKU'});
    assert.match(h.c.electronicCertificateDocumentControls(detail, {...selected, Dibagikan}), /Lihat Sertipikat/);
  }
});
await check('QR print, DI301A and HT gates do not gate the independent PDF action', h => {
  for (const isPrinted of [undefined, null, 0, 1, 2]) for (const statusDI301A of [false, true]) for (const StatusHT of [null, '', '-', 'HT SINTETIS']) {
    const model = {...detail, isPrinted, statusDI301A};
    assert.deepEqual(copy(h.c.electronicCertificateDocumentTarget(model, {...selected, StatusHT})), {q: selectedId + ':SERTIPIKATKU'});
  }
});
await check('document control escapes raw ID and retains the native action label', h => {
  const html = h.c.electronicCertificateDocumentControls(detail, {...selected, SertifikatId: ' selected "<& ID '});
  assert.match(html, /data-action="certificate-document"/);assert.match(html, /data-certificate-id=" selected &quot;&lt;&amp; ID "/);
  assert.match(html, /Lihat Sertipikat/);assert.match(html, /class="certificate-document(?: |")/);
  assert.doesNotMatch(html, /<img|data-certificate-id="RESPONSE-ID/);
  assert.doesNotMatch(h.c.electronicCertificateDocumentControls(detail, {...selected, SertifikatId: null}), /data-action="certificate-document"/);
});
await check('electronic detail renderer mounts the selected document action while shared code stays hidden', h => {
  const data = {...detail, kodeHat: 'PRIVATE-CERTIFICATE-CODE'}, response = {status: 200, data: {data}};
  const own = h.c.certificateDetailView(response, 'Brankas/DetailSertipikatNew', selected);
  assert.match(own, /data-action="certificate-document"/);assert.match(own, /PRIVATE-CERTIFICATE-CODE/);
  const shared = h.c.certificateDetailView(response, 'Brankas/DetailSertipikatNew', {...selected, Dibagikan: true});
  assert.match(shared, /data-action="certificate-document"/);assert.doesNotMatch(shared, /PRIVATE-CERTIFICATE-CODE/);
  assert.doesNotMatch(h.c.certificateDetailView(response, 'legacy/GetInfoSertifikat', selected), /data-action="certificate-document"/);
  assert.doesNotMatch(h.c.certificateDetailView({data: {}}, 'Brankas/DetailSertipikatNew', selected), /data-action="certificate-document"/);
});
await check('cached profile binds nama and exact selected identifier to one PDF read', async h => {
  h.state.results.set(profileOp.id, profile(' Exact profile & + '));
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.equal(h.calls.length, 1);assert.equal(h.calls[0].operationId, documentOp.id);
  assert.deepEqual(h.calls[0].values, {q: selectedId + ':SERTIPIKATKU', name: ' Exact profile & + '});
  assert.match(h.slot.innerHTML, /Lihat PDF/);assert.match(h.slot.innerHTML, /Unduh PDF/);
  assert.match(h.slot.innerHTML, /Lihat lokasi/);
  assert.ok(h.slot.innerHTML.includes(`data-document-id="${h.c.esc(selectedId + ':SERTIPIKATKU')}"`));
  assert.equal(h.modal.innerHTML, 'CERTIFICATE DETAIL AND MAP REMAIN');assert.equal(h.button.disabled, false);
});
await check('PDF success offers exact document q for location without metadata or automatic geo reads', async h => {
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.deepEqual(h.calls.map(call => call.operationId), [profileOp.id, documentOp.id]);
  assert.match(h.slot.innerHTML, /data-action="activity-document-geo"/);
  assert.ok(h.slot.innerHTML.includes(`data-document-id="${h.c.esc(selectedId + ':SERTIPIKATKU')}"`));
});
await check('uncached profile is read before PDF and secondary lookup does not overwrite cache', async h => {
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.deepEqual(h.calls.map(call => call.operationId), [profileOp.id, documentOp.id]);
  assert.deepEqual(h.calls[0].values, {});assert.equal(h.calls[1].values.name, ' Exact profile & + ');
  assert.equal(h.state.results.size, 0);
});
await check('nullable or empty nama uses empty native fallback without email or username substitution', async h => {
  for (const value of [undefined, null, '']) {
    h.state.results.set(profileOp.id, profile(value));h.calls.length = 0;
    await h.c.loadElectronicCertificateDocument(h.button);
    assert.equal(h.calls.length, 1);assert.equal(h.calls[0].values.name, '');
  }
});
await check('malformed profile prevents PDF and keeps certificate detail available for retry', async h => {
  h.c.api = async (_path, options) => {h.calls.push(copy(options.body));return {result: profile(42)}};
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.deepEqual(h.calls.map(call => call.operationId), [profileOp.id]);
  assert.doesNotMatch(h.slot.innerHTML, /href=/);assert.match(h.slot.innerHTML, /Nama profil/);
  assert.equal(h.button.disabled, false);assert.equal(h.modal.innerHTML, 'CERTIFICATE DETAIL AND MAP REMAIN');
});
for (const endpoint of [profileOp.endpoint, documentOp.endpoint]) for (const unavailable of ['missing', 'disabled', 'write']) await check(`${endpoint} ${unavailable} prevents all requests`, async h => {
  h.state.operations = h.state.operations.flatMap(op => op.endpoint !== endpoint ? [op] : unavailable === 'missing' ? [] : [{...op, ...(unavailable === 'disabled' ? {enabled: false} : {effect: 'write'})}]);
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.equal(h.calls.length, 0);assert.doesNotMatch(h.slot.innerHTML, /href=/);
});
for (const condition of ['logged out', 'closed dialog', 'detached slot', 'empty ID', 'blank ID']) await check(`${condition} prevents a document request`, async h => {
  if (condition === 'logged out') h.state.authenticated = false;
  if (condition === 'closed dialog') h.modal.open = false;
  if (condition === 'detached slot') h.slot.isConnected = false;
  if (condition === 'empty ID') h.button.dataset.certificateId = '';
  if (condition === 'blank ID') h.button.dataset.certificateId = '  ';
  await h.c.loadElectronicCertificateDocument(h.button);assert.equal(h.calls.length, 0);
});
await check('duplicate clicks during profile fetch share one in-flight request and PDF follow-up', async h => {
  const wait = pauseAt(h, 'profile'), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  await h.c.loadElectronicCertificateDocument(h.button);assert.equal(h.calls.length, 1);assert.equal(h.button.disabled, true);
  wait.resolve({result: profile('name')});await task;
  assert.deepEqual(h.calls.map(call => call.operationId), [profileOp.id, documentOp.id]);
  assert.equal(h.button.disabled, false);assert.equal(h.button.dataset.loading, 'false');
});
await check('duplicate clicks during PDF fetch do not create a second PDF request', async h => {
  h.state.results.set(profileOp.id, profile('name'));
  const wait = pauseAt(h, 'pdf'), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  await h.c.loadElectronicCertificateDocument(h.button);assert.equal(h.calls.length, 1);
  wait.resolve({result: pdf});await task;assert.equal(h.calls.length, 1);
});
for (const stage of ['profile', 'pdf']) for (const change of ['close', 'navigate', 'detach', 'logout', 'replace account']) await check(`${change} during ${stage} suppresses stale content and further reads`, async h => {
  if (stage === 'pdf') h.state.results.set(profileOp.id, profile('name'));
  const wait = pauseAt(h, stage), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  if (change === 'close') h.modal.close();
  if (change === 'navigate') h.c.detailSequence++;
  if (change === 'detach') h.slot.isConnected = false;
  if (change === 'logout' || change === 'replace account') {h.c.sessionEpoch++;h.c.clearPrivate();h.state.authenticated = change === 'replace account';h.state.user = change === 'replace account' ? {username: 'replacement'} : null}
  h.slot.innerHTML = 'NEW STATE';
  wait.resolve({result: stage === 'profile' ? profile('old name') : pdf});await task;
  assert.equal(h.calls.length, 1);assert.equal(h.slot.innerHTML, 'NEW STATE');assert.equal(h.records.length, 0);
});
await check('late profile completion does not replace a newer profile cache', async h => {
  const wait = pauseAt(h, 'profile'), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  const newer = profile('Newer cache');h.state.results.set(profileOp.id, newer);
  wait.resolve({result: profile('Read for current document')});await task;
  assert.equal(h.state.results.get(profileOp.id), newer);assert.equal(h.calls[1].values.name, 'Read for current document');
});
await check('profile wait keeps the original clicked identifier rather than mutable selection state', async h => {
  const wait = pauseAt(h, 'profile'), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  h.c.flowDetail = {...selected, SertifikatId: 'NEW-GLOBAL-SELECTION'};h.button.dataset.certificateId = 'NEW-BUTTON-VALUE';
  wait.resolve({result: profile('name')});await task;
  assert.equal(h.calls[1].values.q, selectedId + ':SERTIPIKATKU');
});
await check('PDF failure remains in its own slot and retry restores valid links', async h => {
  h.state.results.set(profileOp.id, profile('name'));
  h.c.api = async () => {throw Object.assign(new Error('Synthetic PDF unavailable'), {code: 'UPSTREAM_REJECTED'})};
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.match(h.slot.innerHTML, /Synthetic PDF unavailable/);assert.doesNotMatch(h.slot.innerHTML, /href=/);
  assert.equal(h.button.disabled, false);assert.equal(h.modal.innerHTML, 'CERTIFICATE DETAIL AND MAP REMAIN');
  h.c.api = async () => ({result: pdf});await h.c.loadElectronicCertificateDocument(h.button);
  assert.match(h.slot.innerHTML, /\/api\/preview\/certificate-fixture/);
});
await check('untrusted or mismatched PDF URLs never become links', async h => {
  h.state.results.set(profileOp.id, profile('name'));
  for (const result of [{...pdf, previewUrl: 'https://example.invalid/private'}, {...pdf, previewUrl: '/api/preview/wrong-id'}, {...pdf, contentType: 'text/html'}, {...pdf, status: 201}, {...pdf, downloadUrl: 'javascript:alert(1)'}]) {
    h.c.api = async () => ({result});await h.c.loadElectronicCertificateDocument(h.button);
    assert.doesNotMatch(h.slot.innerHTML, /href=/);assert.equal(h.button.disabled, false);
  }
});
for (const stage of ['profile', 'pdf']) for (const code of ['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED']) await check(`${code} during ${stage} clears current private state`, async h => {
  if (stage === 'pdf') h.state.results.set(profileOp.id, profile('name'));
  h.c.api = async () => {throw Object.assign(new Error('Synthetic expiry'), {code})};
  await h.c.loadElectronicCertificateDocument(h.button);
  assert.equal(h.state.authenticated, false);assert.equal(h.state.user, null);assert.equal(h.state.results.size, 0);
  assert.equal(h.modal.open, false);assert.equal(h.modal.innerHTML, '');assert.equal(h.toasts.length, 1);
});
for (const stage of ['profile', 'pdf']) await check(`old-account ${stage} expiry cannot sign out a replacement session`, async h => {
  if (stage === 'pdf') h.state.results.set(profileOp.id, profile('name'));
  const wait = pauseAt(h, stage), task = h.c.loadElectronicCertificateDocument(h.button);await flush();
  h.c.sessionEpoch++;h.c.clearPrivate();h.state.authenticated = true;h.state.user = {username: 'replacement'};
  wait.reject(Object.assign(new Error('Old expiry'), {code: 'SESSION_EXPIRED'}));await task;
  assert.equal(h.state.authenticated, true);assert.equal(h.state.user.username, 'replacement');assert.equal(h.toasts.length, 0);
});
await check('document action invokes the actual loader with the clicked button', async h => {
  let received = null;h.c.loadElectronicCertificateDocument = button => {received = button};
  await h.events.click({target: {closest: selector => selector === '[data-action="certificate-document"]' || selector === '[data-action]' ? h.button : null}});
  assert.equal(received, h.button);assert.equal(h.calls.length, 0);
});

const report = {source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'), passed: checks.filter(check => check.passed).length, failed: checks.filter(check => !check.passed).length, checks, network_calls: 0, scope: 'Actual electronic certificate PDF helpers with synthetic DOM and responses; audited selected-ID binding and independent shared/QR-print visibility, profile binding, isolated errors, session/dialog ownership and same-origin PDF links. Native audit and backend acceptance are verified separately; no production acceptance claim.'};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/certificate-document-frontend-review-latest.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
