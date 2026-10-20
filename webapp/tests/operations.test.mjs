import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERATIONS, SERVICES, getOperation, getPublicCatalog, prepareOperation } from '../private/operations.mjs';
import { ApiClient } from '../private/api-client.mjs';

const find = (path, method) => OPERATIONS.find(operation => operation.path === path && (!method || operation.method === method));
const session = { authenticated: true, applicationConfigured: true, nik: '0000000000000000', tipeuser: 'perorangan', user: { username: 'fixture-local-only', nomorIndukKependudukan: '0000000000000000' } };

test('170 audited shapes plus the separate SPS viewer, two group DELETE and three item helpers remain distinct, immutable and explicit about readiness', () => {
  assert.equal(OPERATIONS.length, 176);
  assert.equal(new Set(OPERATIONS.map(operation => operation.id)).size, 176);
  assert.equal(OPERATIONS.filter(operation => operation.enabled).length, 75);
  for (const operation of OPERATIONS) {
    if (operation.readiness !== 'dedicated_login') assert.equal(operation.enabled, !operation.inspectOnly);
    assert.equal(operation.serverAcceptance, 'untested');
    assert.equal(operation.requiresConfirmation, operation.effect === 'write');
    if (operation.enabled) {
      assert.ok(SERVICES[operation.serviceId]);
      assert.ok(!operation.fields.some(field => field.path.includes('[]')));
      assert.equal(new URL(SERVICES[operation.serviceId].baseUrl).hostname, SERVICES[operation.serviceId].allowedHost);
    }
  }
  assert.throws(() => { OPERATIONS[0].enabled = true; });
});

test('sign-in is represented by its dedicated login flow and cannot run through generic execution', () => {
  const login = find('auth/signin');
  assert.equal(login.label, 'Masuk akun');
  assert.equal(login.readiness, 'dedicated_login');
  assert.equal(login.uiRoute, '/login');
  assert.equal(login.dedicatedApi, '/api/login');
  assert.equal(login.inspectOnly, false);
  assert.equal(login.enabled, false);
  assert.throws(() => prepareOperation(login.id, {}, {}), error => error.code === 'DEDICATED_LOGIN_REQUIRED');
});

test('public catalog is detached and does not expose internal evidence or credentials', () => {
  const catalog = getPublicCatalog();
  assert.equal(catalog.length, 176);
  assert.ok(catalog.every(operation => !Object.hasOwn(operation, 'evidence') && !Object.hasOwn(operation, 'recoveredTransport')));
  catalog[0].label = 'changed locally';
  assert.notEqual(OPERATIONS[0].label, catalog[0].label);
  assert.ok(!JSON.stringify(catalog).includes('AtrBpn '));
});

test('execution is strictly allowlisted and ignores no unexpected URL or header fields', () => {
  assert.throws(() => prepareOperation('unknown', {}, session), error => error.code === 'UNKNOWN_OPERATION');
  const survey = find('surveynonpertanian');
  assert.throws(() => prepareOperation(survey.id, {}, session), error => error.code === 'OPERATION_INSPECT_ONLY');
  const publicList = find('InfoLayanan/GetInfoLayanan');
  for (const key of ['url', 'Authorization', 'headers', '__proto__']) {
    const params = JSON.parse(JSON.stringify({ [key]: 'https://example.invalid/' }));
    assert.throws(() => prepareOperation(publicList.id, params, {}), error => error.code === 'UNKNOWN_FIELD');
  }
  assert.throws(() => prepareOperation(publicList.id, [], {}), error => error.code === 'INVALID_PARAMETERS');
});

test('session identity is derived, required and cannot be changed to another account', () => {
  const certificateList = find('Legacy/SertifikatTanahNew');
  assert.throws(() => prepareOperation(certificateList.id, {}, {}), error => error.code === 'LOGIN_REQUIRED');
  assert.throws(() => prepareOperation(certificateList.id, {}, { authenticated: true }), error => error.code === 'SESSION_PROFILE_REQUIRED');
  const result = prepareOperation(certificateList.id, {}, session);
  assert.deepEqual({ ...result.query }, { nik: session.nik, tipeuser: session.tipeuser });
  assert.throws(() => prepareOperation(certificateList.id, { nik: '1111111111111111' }, session), error => error.code === 'SESSION_IDENTITY_MISMATCH');
  const collection = find('Collection/AddCollectionBerkas');
  assert.equal(prepareOperation(collection.id, { BerkasId: 'fixture', Title: 'judul', Subtitle: 'subjudul' }, session).body.Nik, session.nik);
});

test('collection status preserves the native BERKAS constant and does not masquerade as a content detail lookup', () => {
  const operation = find('collection/GetCollectionId');
  assert.equal(operation.label, 'Status koleksi berkas');
  const prepared = prepareOperation(operation.id, { id: 'fixture-file:fixture-office' }, session);
  assert.equal(prepared.method, 'GET');
  assert.equal(prepared.auth, 'session');
  assert.deepEqual({ ...prepared.query }, { id: 'fixture-file:fixture-office', type: 'BERKAS' });
  assert.deepEqual({ ...prepared.body }, {});
  assert.throws(() => prepareOperation(operation.id, { id: 'fixture-parcel', type: 'PERSIL' }, session), error => error.code === 'FIXED_FIELD');
});

test('geotag contract remains inspectable but reference coordinates cannot replace a verified site visit', () => {
  const geotag = find('geotag/UploadGeotag');
  assert.deepEqual(geotag.fields.map(field => field.path), ['BerkasId', 'Lat', 'Longi', 'file', 'Lokasi', 'IsOffline']);
  const values = { BerkasId: 'fixture-berkas', Lat: '-6.1234567', Longi: '106.7654321', Lokasi: 'titik pengukuran', IsOffline: false };
  assert.equal(geotag.enabled, false); assert.equal(geotag.readiness, 'native_required');
  assert.throws(() => prepareOperation(geotag.id, values, session), error => error.code === 'OPERATION_INSPECT_ONLY');
  assert.throws(() => prepareOperation(geotag.id, { ...values, IsOffline: true }, session), error => error.code === 'OPERATION_INSPECT_ONLY');
});

test('KKPR lookup uses the active account identity and document lookups preserve field casing', () => {
  const kkpr = find('KKPR/GetKKPRList');
  assert.deepEqual({ ...prepareOperation(kkpr.id, {}, session).query }, { nomorIdentitas: session.nik });
  assert.throws(() => prepareOperation(kkpr.id, { nomorIdentitas: 'other-person' }, session), error => error.code === 'SESSION_IDENTITY_MISMATCH');
  for (const [path, key] of [['Dokumen/GetSpsDokumen', 'dokumenid'], ['LokasiBidang/GetByPersilId', 'persilId'], ['legacy/GetParcelBoundaryById', 'persilid']]) {
    const op = OPERATIONS.find(o => o.path === path && o.enabled);
    const prepared = prepareOperation(op.id, { [key]: 'fixture-document' }, session);
    assert.equal(prepared.method, 'GET'); assert.deepEqual({ ...prepared.query }, { [key]: 'fixture-document' }); assert.deepEqual({ ...prepared.body }, {});
    assert.throws(() => prepareOperation(op.id, { [key.toUpperCase()]: 'fixture' }, session), error => error.code === 'UNKNOWN_FIELD');
  }
});

test('GetDocument retains an explicit empty profile name and exact q during form serialization', async () => {
  const operation = find('apis/GetDocument'), q = 'fixture-ID + & = :KKPRKU';
  for (const values of [{q}, {q, name: ''}, {q, name: ' Fixture Nama + & '}]) {
    const prepared = prepareOperation(operation.id, values, session), expected = {q, name: values.name ?? ''};
    assert.equal(prepared.method, 'POST'); assert.equal(prepared.encoding, 'form'); assert.equal(prepared.auth, 'session');
    assert.deepEqual({...prepared.body}, expected); assert.deepEqual({...prepared.query}, {});
    let transmitted;
    const client = new ApiClient({}, {log: () => {}, transport: async (_url, init) => {transmitted = init; return new Response('%PDF-fixture'.padEnd(201, ' '));}});
    await client.request({...prepared, base: prepared.service.baseUrl, session: {active: true, tokens: {tokenType: 'Bearer', accessToken: 'fixture-local-token'}}});
    assert.deepEqual(Object.fromEntries(transmitted.body), expected); assert.equal(transmitted.body.has('name'), true);
    if (expected.name === '') assert.match(transmitted.body.toString(), /&name=$/);
  }
  assert.throws(() => prepareOperation(operation.id, {name: ''}, session), error => error.code === 'FIELD_REQUIRED');
});

test('document geometry is a q-only main-session read and preserves the full raw string before transport', () => {
  const operation = find('/apis/getGeoJsonInfo', 'GET');
  assert.equal(operation.id, 'get-apis-getgeojsoninfo-d39f1c');
  assert.equal(operation.enabled, true); assert.equal(operation.auth, 'session');
  assert.equal(operation.effect, 'read'); assert.equal(operation.requiresConfirmation, false);
  assert.deepEqual(operation.fields.map(field => field.path), ['q']);
  for (const q of [' Activity:document +%3A/&? ', "!'()*~", 'é/文😀', '\ud800', '\udc00']) {
    const prepared = prepareOperation(operation.id, {q}, session);
    assert.equal(prepared.service.id, 'main'); assert.equal(prepared.clientProfile, 'main');
    assert.equal(prepared.method, 'GET'); assert.equal(prepared.encoding, 'none');
    assert.deepEqual({...prepared.query}, {q}); assert.deepEqual({...prepared.body}, {});
  }
  assert.throws(() => prepareOperation(operation.id, {q: 'fixture'}, {}), error => error.code === 'LOGIN_REQUIRED');
  for (const q of [undefined, null, '']) assert.throws(() => prepareOperation(operation.id, {q}, session), error => error.code === 'FIELD_REQUIRED');
  for (const q of [1, false, [], {}, 'x'.repeat(16001), 'nul\0value']) assert.throws(() => prepareOperation(operation.id, {q}, session), error => error.code === 'INVALID_FIELD');
  for (const key of ['Q', 'persilid', 'name', 'Lat', 'Longi', 'Authorization']) assert.throws(() => prepareOperation(operation.id, {q: 'fixture', [key]: 'unexpected'}, session), error => error.code === 'UNKNOWN_FIELD');
});

test('analog certificate detail preserves its exact GET query and uses only the authenticated session header', async () => {
  const operation = find('legacy/GetInfoSertifikat', 'GET');
  const values = { sertifikatId: 'fixture-certificate +&/id' };
  assert.equal(operation.id, 'get-legacy-getinfosertifikat-d4340c');
  assert.equal(operation.enabled, true); assert.equal(operation.auth, 'session');
  assert.equal(operation.effect, 'read'); assert.equal(operation.requiresConfirmation, false);
  assert.throws(() => prepareOperation(operation.id, values, {}), error => error.code === 'LOGIN_REQUIRED');
  for (const key of ['SertifikatId', 'sertipikatId', 'Authorization', 'headers']) {
    assert.throws(() => prepareOperation(operation.id, { ...values, [key]: 'fixture-invalid-override' }, session), error => error.code === 'UNKNOWN_FIELD');
  }
  const prepared = prepareOperation(operation.id, values, session);
  assert.equal(prepared.service.id, 'main'); assert.equal(prepared.encoding, 'none');
  assert.deepEqual({ ...prepared.query }, values); assert.deepEqual({ ...prepared.body }, {});
  assert.equal(Object.hasOwn(prepared, 'headers'), false);
  let transmitted;
  const client = new ApiClient({}, { log: () => {}, transport: async (url, init) => {
    transmitted = { url, init }; return Response.json({ data: {} });
  } });
  await client.request({ ...prepared, base: prepared.service.baseUrl, session: { active: true, tokens: { tokenType: 'Bearer', accessToken: 'fixture-session-only' } } });
  assert.equal(transmitted.url.origin, 'https://sentuh.atrbpn.go.id');
  assert.equal(transmitted.url.pathname, '/legacy/GetInfoSertifikat');
  assert.deepEqual(Object.fromEntries(transmitted.url.searchParams), values);
  assert.equal(transmitted.init.method, 'GET'); assert.equal(transmitted.init.body, undefined);
  assert.equal(transmitted.init.headers.Authorization, 'Bearer fixture-session-only');
});

test('GET body remains a GET body and shared service auth remains disabled until implemented', () => {
  const operation = find('berkas', 'GET');
  assert.equal(operation.encoding, 'json');
  assert.equal(operation.fields.find(field => field.path === 'nik').location, 'body');
  assert.equal(operation.serviceId, 'sipenta');
  assert.equal(operation.inspectOnly, true);
  assert.throws(() => prepareOperation(operation.id, {}, session), error => error.code === 'OPERATION_INSPECT_ONLY');
});

test('application authorization and fixed recovered URL constants cannot be user supplied', () => {
  const regions = find('common/kecamatan');
  assert.throws(() => prepareOperation(regions.id, { kabupatenkotaId: 'fixture' }, {}), error => error.code === 'APPLICATION_AUTH_UNAVAILABLE');
  const result = prepareOperation(regions.id, { kabupatenkotaId: 'fixture' }, session);
  assert.equal(result.encoding, 'form');
  assert.equal(result.auth, 'application');
  const regionAtLocation = find('common/GetWilayahByLocation');
  assert.equal(regionAtLocation.auth, 'optionalSession'); // Full-URI common regex ends with $, query prevents its application-auth branch.
  const news = find('Berita/GetBerita');
  assert.equal(prepareOperation(news.id).query.limit, '8');
  assert.throws(() => prepareOperation(news.id, { limit: 999 }), error => error.code === 'FIXED_FIELD');
});

test('all enabled adapters prepare locally without inventing nested models or network activity', () => {
  for (const operation of OPERATIONS.filter(operation => operation.enabled)) {
    const values = {};
    for (const field of operation.fields) {
      if (field.source !== 'input' || field.type === 'file' || Object.hasOwn(field, 'default')) continue;
      values[field.path] = field.arraySchema === 'information-simulation-type2' ? [{Jumlah:'02',Luas:'00100',Penggunaan:'pertanian'}] : field.format === 'decimal-coordinate' ? '0.0000000' : field.type === 'boolean' ? false : ['integer', 'number'].includes(field.type) ? 1 : 'fixture-local';
    }
    const prepared = prepareOperation(operation.id, values, session);
    const dynamic = operation.id === 'get-api-antrian-path-argument-1-d1e130' || operation.method === 'DELETE' && operation.group === 'Koleksi';
    assert.equal(prepared.path, dynamic ? operation.path.replace('{path_argument_1}', 'fixture-local') : operation.path);
    assert.equal(prepared.method, operation.method);
    assert.ok(!prepared.path.includes('{'));
    assert.ok(!Object.hasOwn(prepared, 'headers'));
  }
});

test('SPS viewer uses only the selected metadata ID and alias under an explicit session profile', () => {
  const operation = find('dokumen/GetDokumen');
  assert.equal(operation.id, 'get-dokumen-getdokumen-d3e240');
  assert.equal(operation.evidence.source, 'analysis/recovered/sps-document-flow.json');
  const prepared = prepareOperation(operation.id, { id: 'fixture-sps-id', tipe: 'fixture-alias' }, session);
  assert.equal(prepared.clientProfile, 'sps-document-viewer');
  assert.equal(prepared.method, 'GET'); assert.equal(prepared.encoding, 'none');
  assert.equal(prepared.auth, 'session'); assert.equal(prepared.requiresConfirmation, false);
  assert.deepEqual({ ...prepared.query }, { id: 'fixture-sps-id', tipe: 'fixture-alias' });
  assert.deepEqual({ ...prepared.body }, {});
  assert.throws(() => prepareOperation(operation.id, { id: 'fixture', tipe: 'alias', url: 'https://example.invalid/' }, session), error => error.code === 'UNKNOWN_FIELD');
  assert.throws(() => prepareOperation(operation.id, { id: 'fixture' }, session), error => error.code === 'FIELD_REQUIRED');
  assert.throws(() => prepareOperation(operation.id, { id: 'fixture', tipe: 'alias' }), error => error.code === 'LOGIN_REQUIRED');
});
