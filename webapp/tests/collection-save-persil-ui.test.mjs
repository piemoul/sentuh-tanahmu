import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { OPERATIONS } from '../private/operations.mjs';
import { collectionSavePersilEligible, collectionSavePersilEntry, createCollectionSavePersil, renderCollectionSavePersil, trimCollectionSavePersil } from '../collection-save-persil.js';

// Only injected synthetic API callbacks run here. No fetch/browser/providers.
const ids = { save: 'post-collection-addcollectionpersil-daae30', groups: 'get-collection-getpersilcollectiongroup-d31fbc', assign: 'post-collection-addpersilcollectiontogroup-da897c', create: 'post-collection-addpersilcollectiongroup-da8f20' };
const response = (data, status = 200) => ({ result: { status, data } });
const group = (id = 'SINTETIS group /+?', name = 'Grup SINTETIS') => ({ collectionGroupId: id, collectionGroupName: name, createdAt: null });
const context = (overrides = {}) => ({ origin: 'synthetic-map', persilId: ' SINTETIS persil:/+?# ', collectionId: null, featureCollection: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { NIB: 'SINTETIS-NIB', tipehak: 'Hak SINTETIS', LUAS: 123 } }] }, ...overrides });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(responder = () => response({ error: false, message: null, data: 'SINTETIS collection /+?' })) {
  const calls = [], events = [], notices = [];
  let account = { authenticated: true, tokenPresent: true, configured: true, loading: false, profile: { statusVerifikasi: 0 } }, owned = true, operations = structuredClone(OPERATIONS);
  const controller = createCollectionSavePersil({
    api: async (path, options) => { assert.equal(path, '/api/execute'); assert.equal(options.method, 'POST'); calls.push(structuredClone(options.body)); return options.body.operationId === ids.groups ? response({ error: true, data: [group()] }) : responder(options.body); },
    getOperations: () => operations, getAccount: () => account, isCurrent: () => owned,
    onChange: value => events.push(['change', value]), onSaved: () => { events.push(['saved']); },
    onClose: reason => events.push(['close', reason]), notify: (text, kind) => { notices.push({ text, kind }); events.push(['notice', text, kind]); },
    onAuthError: error => events.push(['auth', error.code]), record: (...args) => events.push(['record', ...args]),
  });
  return { controller, calls, events, notices, setAccount: value => { account = value; }, getAccount: () => account, unown: () => { owned = false; }, setOperations: value => { operations = value; },
    async open(value = context()) { assert.equal(controller.open(value), true); await flush(); return value; } };
}
const writes = h => h.calls.filter(call => call.operationId !== ids.groups);

test('native canonical ledger remains pinned and staged UI imports no transport or document surface', async () => {
  const bytes = await readFile(new URL('../../analysis/recovered/collection-save-persil/flow.json', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199');
  const source = await readFile(new URL('../collection-save-persil.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|\bdocument\.|\bwindow\.|https?:\/\//);
  assert.equal(renderCollectionSavePersil(null), '');
});

test('visibility uses token presence and nullable-int status separately, never browser NIK', () => {
  const h = harness(), account = h.getAccount();
  for (const value of [0, 1, 2, -2, 100]) assert.equal(collectionSavePersilEligible({ ...account, profile: { statusVerifikasi: value } }, context()), true);
  for (const value of [-1, null, undefined, '0', false, 1.5]) assert.equal(collectionSavePersilEligible({ ...account, profile: { statusVerifikasi: value } }, context()), false);
  for (const patch of [{ authenticated: false }, { tokenPresent: false }, { profile: null }]) assert.equal(collectionSavePersilEligible({ ...account, ...patch }, context()), false);
  assert.equal(account.user, undefined, 'Cached NIK stays in the private adapter');
  assert.match(collectionSavePersilEntry(account, context()), />Simpan ke Koleksi</);
  for (const collectionId of ['', ' ', 'SINTETIS-saved']) { assert.equal(collectionSavePersilEntry(account, context({ collectionId })), ''); assert.equal(h.controller.open(context({ collectionId })), false); }
  assert.match(collectionSavePersilEntry({ ...account, configured: false }, context()), /disabled/);
  assert.match(collectionSavePersilEntry(account, context(), false), /disabled/);
});

test('exact operation identity/capabilities and host ownership guard entry before API work', () => {
  for (const patch of [{ enabled: false }, { endpoint: 'Collection/Other' }, { method: 'PUT' }, { effect: 'read' }, { auth: 'application' }, { serviceId: 'other' }]) {
    const h = harness(); h.setOperations(OPERATIONS.map(op => op.id === ids.save ? { ...op, ...patch } : op));
    assert.equal(h.controller.open(context()), false); assert.equal(h.calls.length, 0);
  }
  for (const patch of [{ configured: false }, { loading: true }]) { const h = harness(); h.setAccount({ ...h.getAccount(), ...patch }); assert.equal(h.controller.open(context()), false); assert.equal(h.calls.length, 0); }
  const h = harness(); h.unown(); assert.equal(h.controller.open(context()), false); assert.equal(h.calls.length, 0);
});

test('fresh sheet does precisely its own groups GET, defaults and native copy without main Batal', async () => {
  const h = harness(); await h.open();
  assert.deepEqual(h.calls, [{ operationId: ids.groups, values: {} }]);
  assert.equal(h.controller.snapshot().caption, ''); assert.equal(h.controller.snapshot().selectedGroupId, null);
  const html = h.controller.render();
  for (const copy of ['Caption', 'Tulis sesuatu biar mudah dicari di koleksi', 'Pilih Grup', 'Buat Grup', 'Simpan ke Koleksi', 'SINTETIS-NIB']) assert.ok(html.includes(copy));
  assert.doesNotMatch(html, /Batal|\brequired\b|\bmaxlength\b|type="password"|nomorIdentitas|nomorIndukKependudukan/);
  assert.match(html, /id="collection-save-persil-caption"[^>]*value=""/);
  h.controller.setCaption('retained'); h.controller.close(); await h.open(); assert.equal(h.controller.snapshot().caption, '');
});

test('Dart whitespace trim includes NEL/FEFF and retains zero-width-space and internal spacing', () => {
  for (const text of [' \t\n', '\u0085\ufeff\u3000']) assert.equal(trimCollectionSavePersil(text), '');
  assert.equal(trimCollectionSavePersil('\u0085  SINTETIS  + / &  \ufeff'), 'SINTETIS  + / &');
  assert.equal(trimCollectionSavePersil('\u200b'), '\u200b');
});

test('caption save preserves target ID, captures title and sends only public inputs with confirmation', async () => {
  const wait = deferred(), h = harness(() => wait.promise), original = await h.open();
  h.controller.setCaption(' \u0085SINTETIS <caption> + / &\ufeff ');
  const work = h.controller.submit();
  assert.equal(h.controller.snapshot().busy, true); assert.equal(await h.controller.submit(), false);
  h.controller.setCaption('Changed during pending');
  assert.deepEqual(writes(h), [{ operationId: ids.save, values: { PersilId: original.persilId, Title: 'SINTETIS <caption> + / &' }, confirm: true }]);
  const html = h.controller.render();
  assert.doesNotMatch(html.match(/<input[^>]*id="collection-save-persil-caption"[^>]*>/)[0], /disabled|readonly/);
  assert.match(html, /type="submit"[^>]*disabled>Menyimpan\.\.\./);
  assert.doesNotMatch(html.match(/<button[^>]*data-action="collection-save-persil-group-open"[^>]*>/)[0], /disabled/);
  wait.resolve(response({ error: false, data: 'SINTETIS-id' })); assert.equal(await work, true);
  assert.equal(original.collectionId, null, 'Normal sheet never updates parent saved ID');
  assert.deepEqual(h.events.filter(event => ['saved', 'close', 'notice'].includes(event[0])).map(event => event[0]), ['saved', 'close', 'notice']);
  assert.equal(h.controller.snapshot(), null); assert.equal(h.calls.length, 2, 'No implicit collection refresh');
});

test('blank caption fallback uses only first feature NIB with null/empty distinctions', async () => {
  for (const [nib, suffix] of [[null, '1'], [undefined, '1'], ['', ''], [' ', ' '], [0, '0'], ['SINTETIS-NIB', 'SINTETIS-NIB']]) {
    const h = harness(), value = context(); value.featureCollection.features[0].properties.NIB = nib;
    value.featureCollection.features.push({ properties: { NIB: 'WRONG SECOND FEATURE' } }); await h.open(value); h.controller.setCaption('\u0085 ');
    assert.equal(await h.controller.submit(), true); assert.equal(writes(h)[0].values.Title, 'Bidang Analog nomor ' + suffix);
  }
});

test('missing feature/target produces native prerequisite notices and no mutation; spaces IDs pass', async () => {
  for (const featureCollection of [null, {}, { features: [] }, { features: [null] }, { features: { 0: { properties: {} } } }]) {
    const h = harness(); await h.open(context({ featureCollection })); assert.equal(await h.controller.submit(), false); assert.equal(writes(h).length, 0); assert.equal(h.notices.at(-1).text, 'Data bidang tidak tersedia');
  }
  for (const persilId of [null, undefined, '', 1]) { const h = harness(); await h.open(context({ persilId })); assert.equal(await h.controller.submit(), false); assert.equal(writes(h).length, 0); assert.equal(h.notices.at(-1).text, 'ID Persil tidak tersedia'); }
  const h = harness(); await h.open(context({ persilId: ' ' })); assert.equal(await h.controller.submit(), true); assert.equal(writes(h)[0].values.PersilId, ' ');
});

test('save requires HTTP200 typed envelope error exactly false; failure retains editable state', async () => {
  for (const result of [response({ error: true, message: 'SINTETIS gagal' }), response({ error: null }), response({}), response(null), response([]), response('JSON string'), response({ error: false, data: {} }), response({ error: false, message: 1 }), response({ error: false }, 201), response({ error: false }, 503)]) {
    const h = harness(() => result); await h.open(); h.controller.setCaption('SINTETIS caption'); h.controller.selectGroup(0);
    assert.equal(await h.controller.submit(), false); assert.equal(h.controller.snapshot().busy, false); assert.equal(h.controller.snapshot().caption, 'SINTETIS caption'); assert.equal(h.controller.snapshot().selectedGroupId, group().collectionGroupId); assert.equal(writes(h).length, 1);
    assert.equal(h.events.some(event => event[0] === 'saved' || event[0] === 'close'), false);
  }
  const h = harness(() => response({ error: true, message: '' })); await h.open(); await h.controller.submit(); assert.equal(h.notices.at(-1).text, '');
});

test('nullable/empty collection IDs skip optional assignment without warning or forced refresh', async () => {
  for (const data of [null, undefined, '']) {
    const h = harness(() => response({ error: false, message: '', ...(data === undefined ? {} : { data }) })); await h.open(); h.controller.selectGroup(0);
    assert.equal(await h.controller.submit(), true); assert.equal(writes(h).length, 1); assert.deepEqual(h.notices, [{ text: '', kind: 'success' }]);
  }
});

test('group selection is read after primary await; caption is captured before it; choice remains active', async () => {
  const wait = deferred(), h = harness(call => call.operationId === ids.save ? wait.promise : response({ error: false })); await h.open();
  h.controller.setCaption('SINTETIS original'); const work = h.controller.submit();
  assert.equal(h.controller.selectGroup(0), true); h.controller.setCaption('Changed pending');
  assert.doesNotMatch(h.controller.render().match(/<button[^>]*data-action="collection-save-persil-group-choice"[^>]*>/)[0], /disabled/);
  wait.resolve(response({ error: false, data: ' ' })); assert.equal(await work, true);
  assert.deepEqual(writes(h), [{ operationId: ids.save, values: { PersilId: context().persilId, Title: 'SINTETIS original' }, confirm: true }, { operationId: ids.assign, values: { collectionGroupId: group().collectionGroupId, collectionId: ' ' }, confirm: true }]);
});

test('group failure warns while primary save succeeds; no rollback or retry', async () => {
  for (const assign of [() => response({ error: true }), () => response({}), () => response({ error: false }, 201), () => { throw Object.assign(new Error('SINTETIS network'), { code: 'NETWORK_ERROR' }); }]) {
    const h = harness(call => call.operationId === ids.save ? response({ error: false, message: 'SINTETIS saved', data: 'SINTETIS row' }) : assign()); await h.open(); h.controller.selectGroup(0);
    assert.equal(await h.controller.submit(), true); assert.equal(writes(h).length, 2); assert.equal(h.notices.at(-1).text, 'SINTETIS saved\n\nCatatan: 1 grup gagal ditambahkan, namun bidang sudah tersimpan di koleksi.');
  }
});

test('own group list accepts body error true, filters IDs without trim/dedup and uses nullable names', async () => {
  const h = harness(); h.setOperations(OPERATIONS);
  const rows = [group(null, 'null ID'), group('', 'empty ID'), group(' ', ''), group('same', null), group('same', '<script>SINTETIS</script>')];
  const snapshot = { busy: false, caption: '<img src=x>', groupsLoading: false, groups: rows, selectedGroupId: 'same', groupCreate: null, feature: { tipeHak: '<b>SINTETIS</b>', luas: '1', nib: '' } };
  const html = renderCollectionSavePersil(snapshot);
  assert.equal((html.match(/data-action="collection-save-persil-group-choice"/g) ?? []).length, 3); assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 2);
  assert.match(html, /data-index="2"/); assert.match(html, /<span>-<\/span>/); assert.match(html, /&lt;script&gt;SINTETIS/); assert.doesNotMatch(html, /<script>|<img|<b>SINTETIS/);
  assert.doesNotMatch(renderCollectionSavePersil({ ...snapshot, groups: rows.slice(0, 2) }), /Belum ada grup/);
  assert.match(renderCollectionSavePersil({ ...snapshot, groups: [] }), /Belum ada grup\. Buat grup terlebih dahulu\./);
  await h.open(); assert.equal(h.controller.snapshot().groups.length, 1); assert.equal(h.controller.selectGroup(0), true); assert.equal(h.controller.selectGroup(0), true); assert.equal(h.controller.snapshot().selectedGroupId, null);
});

test('nested create has its own form, native blank notice, editable input and disabled explicit buttons', async () => {
  const wait = deferred(), h = harness(() => wait.promise); await h.open(); h.controller.setCaption('SINTETIS parent'); h.controller.selectGroup(0);
  assert.equal(h.controller.openGroupCreate(), true); assert.equal(h.controller.snapshot().groupCreate.name, ''); h.controller.setGroupName(' \u0085 ');
  assert.equal(await h.controller.submitGroupCreate(), false); assert.equal(writes(h).length, 0); assert.equal(h.notices.at(-1).text, 'Nama grup tidak boleh kosong');
  h.controller.setGroupName(' \u0085SINTETIS group + / &\ufeff'); const work = h.controller.submitGroupCreate();
  assert.equal(await h.controller.submitGroupCreate(), false); assert.equal(h.controller.cancelGroupCreate(), false);
  h.controller.setGroupName('typed while busy'); const html = h.controller.render();
  assert.match(html, /Buat Grup Baru/); assert.match(html, /Beri nama grup agar bidang-bidangmu lebih mudah dikelola\./); assert.match(html, /Contoh: Tanah Warisan, Investasi\.\.\./);
  assert.doesNotMatch(html.match(/<input[^>]*id="collection-save-persil-group-name"[^>]*>/)[0], /disabled|readonly/);
  assert.match(html, /data-action="collection-save-persil-group-cancel" disabled/); assert.match(html, /type="submit"[^>]*disabled>Menyimpan/);
  assert.deepEqual(writes(h), [{ operationId: ids.create, values: { GroupName: 'SINTETIS group + / &' }, confirm: true }]);
  wait.resolve(response({ error: true, data: 'SINTETIS new group' })); assert.equal(await work, true); await flush();
  assert.equal(h.controller.snapshot().groupCreate, null); assert.equal(h.controller.snapshot().caption, 'SINTETIS parent'); assert.equal(h.controller.snapshot().selectedGroupId, group().collectionGroupId);
  assert.equal(h.calls.filter(call => call.operationId === ids.groups).length, 2); assert.equal(h.notices.filter(item => item.kind === 'success').length, 0);
});

test('nested parsed error true/null/missing succeeds, while malformed/non200 stays open', async () => {
  for (const body of [{ error: true }, { error: null }, {}]) { const h = harness(() => response(body)); await h.open(); h.controller.openGroupCreate(); h.controller.setGroupName('SINTETIS group'); assert.equal(await h.controller.submitGroupCreate(), true); assert.equal(h.controller.snapshot().groupCreate, null); }
  for (const reply of [response({ error: false, data: {} }), response({ error: false }, 201), response([])]) { const h = harness(() => reply); await h.open(); h.controller.openGroupCreate(); h.controller.setGroupName('SINTETIS group'); assert.equal(await h.controller.submitGroupCreate(), false); assert.equal(h.controller.snapshot().groupCreate.busy, false); assert.equal(h.controller.snapshot().groupCreate.name, 'SINTETIS group'); }
  const h = harness(); await h.open(); h.controller.openGroupCreate(); assert.equal(h.controller.cancelGroupCreate(), true); assert.equal(writes(h).length, 0); h.controller.openGroupCreate(); assert.equal(h.controller.snapshot().groupCreate.name, '');
});

test('nested create remains available during primary save, but late nested result cannot reopen saved form', async () => {
  const primary = deferred(), nested = deferred(), h = harness(call => call.operationId === ids.save ? primary.promise : nested.promise); await h.open();
  const save = h.controller.submit(); assert.equal(h.controller.openGroupCreate(), true); h.controller.setGroupName('SINTETIS pending group'); const create = h.controller.submitGroupCreate();
  primary.resolve(response({ error: false, data: null })); assert.equal(await save, true); const count = h.events.length;
  nested.resolve(response({ error: false })); assert.equal(await create, false); assert.equal(h.controller.snapshot(), null); assert.equal(h.events.length, count); assert.equal(h.calls.filter(call => call.operationId === ids.groups).length, 1);
});

test('dismiss, route/session ownership and replacement suppress late primary effects and assignment', async () => {
  for (const invalidate of [h => h.controller.close(), h => h.controller.reset(), h => h.unown(), h => h.setAccount({ ...h.getAccount(), authenticated: false })]) {
    const wait = deferred(), h = harness(() => wait.promise); await h.open(); h.controller.selectGroup(0); const work = h.controller.submit(); invalidate(h); const count = h.events.length;
    wait.resolve(response({ error: false, data: 'SINTETIS id' })); assert.equal(await work, false); assert.equal(writes(h).length, 1); assert.equal(h.events.length, count);
  }
  const wait = deferred(), h = harness(() => wait.promise); await h.open(); const work = h.controller.submit(); await h.open(context({ persilId: 'SINTETIS replacement' }));
  wait.resolve(response({ error: false })); assert.equal(await work, false); assert.equal(h.controller.snapshot().busy, false); assert.equal(h.events.some(event => event[0] === 'saved'), false);
});

test('authentication failure clears controller and delegates once without leaking raw JS exceptions', async () => {
  for (const code of ['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED']) {
    const h = harness(() => { throw Object.assign(new Error('SINTETIS expired'), { code }); }); await h.open(); assert.equal(await h.controller.submit(), false); assert.equal(h.controller.snapshot(), null); assert.deepEqual(h.events.filter(event => event[0] === 'auth'), [['auth', code]]); assert.equal(h.notices.length, 0);
  }
  const h = harness(() => { throw new Error('DO-NOT-EXPORT fixture-secret'); }); await h.open(); assert.equal(await h.controller.submit(), false); assert.equal(h.notices.at(-1).text, 'Terjadi kesalahan. Coba lagi.'); assert.doesNotMatch(JSON.stringify(h.events), /fixture-secret/);
});

test('onSaved is not awaited and runs before host close; callback may not write parent saved ID', async () => {
  const h = harness(), wait = deferred(), value = context({ onSaved: () => { h.events.push(['context-saved']); return wait.promise; } }); await h.open(value);
  assert.equal(await h.controller.submit(), true); assert.equal(value.collectionId, null); assert.equal(h.events.some(event => event[0] === 'saved'), false);
  assert.deepEqual(h.events.filter(event => ['context-saved', 'close', 'notice'].includes(event[0])).map(event => event[0]), ['context-saved', 'close', 'notice']);
  wait.reject(new Error('SINTETIS callback rejection')); await flush();
});
