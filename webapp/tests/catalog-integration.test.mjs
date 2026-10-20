import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';
import { OPERATIONS } from '../private/operations.mjs';

test('every catalog entry reaches its intended mock transport or fails locally at its explicit boundary', async t => {
  const calls = [];
  const configuration = { configured: true, applicationAuthorization: () => 'AtrBpn fixture-only', queueAuthorization: () => 'Bearer fixture-queue-only', calendarOfficeId: () => 'fixture-decoded-office', origin: 'https://sentuh.atrbpn.go.id/', reason: 'test fixture only' };
  const user = { username: 'fixture-user', email: 'fixture@example.invalid', nomorIndukKependudukan: '0000000000000000', roleUser: 'fixture-role' };
  const server = createServer({ configuration, log: () => {}, transport: async (url, init) => {
    calls.push({ url, init });
    if (url.pathname === '/auth/signin') return Response.json({ data: { ...user, token: { accessToken: 'fixture-token', refreshToken: 'fixture-refresh', tokenType: 'Bearer', expiredAt: 4_000_000_000 } } });
    if (url.pathname === '/account/account_summary') return Response.json({error:false,data:{userLevel:2,isIkd:false,nomorIdentitas:'fixture-summary-nik',endpoint:url.pathname}});
    if (url.hostname === 'aplikasi.atrbpn.go.id') return url.pathname.endsWith('/notifikasi')?Response.json({data:[]}):Response.json({error:false,data:url.pathname.endsWith('/saya')?[{id:'fixture-queue-id'}]:{id:'fixture-queue-id'}});
    if (url.pathname === '/dokumen/GetDokumen') return new Response('%PDF-fixture-only', { headers: { 'Content-Type': 'application/octet-stream' } });
    if (url.pathname === '/apis/GetDocument') return new Response('%PDF-fixture-only'.padEnd(256, ' '), { headers: { 'Content-Type': 'application/octet-stream' } });
    if (['/Berita/GetBerita', '/Pengumuman/GetPengumuman'].includes(url.pathname)) return Response.json({ error: true, message: [{ id: url.pathname, title: 'fixture news', category: null, banner: null, url: null }] });
    if (url.pathname === '/activity/GetUserActivity') return Response.json({error:true,data:[],message:'ignored'});
    if (url.pathname === '/activity/deleteUserActivity') return new Response('ignored malformed response body', {status:200});
    if (['/collection/GetCollectionId','/Collection/AddCollectionBerkas','/Collection/AddCollectionPersil'].includes(url.pathname)) return Response.json({error:true,message:null,data:'fixture-bookmark',unknownFixture:'discarded'});
    if (['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)) return Response.json({error:true,message:null,data:[],unknownFixture:'discarded'});
    if (['/Collection/AddPersilCollectionGroup','/Collection/AddPersilCollectionToGroup','/Collection/EditCollectionPersil'].includes(url.pathname) || /^\/Collection\/Delete(?:PersilCollection(?:From)?Group|Collection(?:Persil|Berkas))\//.test(url.pathname)) return Response.json({error:true,message:null,data:'fixture-group-action',unknownFixture:'discarded'});
    return Response.json({ data: { fixture: true, endpoint: url.pathname } });
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  let response = await fetch(base + '/api/state');
  let cookie = response.headers.get('set-cookie').split(';')[0]; let state = await response.json();
  const post = (route, data) => fetch(base + route, { method: 'POST', headers: { Cookie: cookie, Origin: base, 'X-CSRF-Token': state.csrfToken, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  response = await post('/api/login', { username: 'fixture-user', password: 'fixture-password' });
  assert.equal(response.status, 200); cookie = response.headers.get('set-cookie').split(';')[0]; state = await response.json();
  response=await post('/api/execute',{operationId:'get-api-antrian-saya-d1eb1c',values:{}});
  assert.equal(response.status,200,'Prepare own server-returned queue ID before the catalog detail entry');
  let enabled = 0, blocked = 0;
  for (const operation of OPERATIONS) {
    const values = {};
    for (const field of operation.fields) {
      if (field.source !== 'input' || field.type === 'file' || Object.hasOwn(field, 'default')) continue;
      values[field.path] = field.arraySchema === 'information-simulation-type2' ? [{Jumlah:'02',Luas:'00100',Penggunaan:'pertanian'}] : field.type === 'boolean' ? false : ['integer', 'number'].includes(field.type) ? 1 : 'fixture input + & value';
    }
    const before = calls.length;
    if(operation.endpoint==='api/antrian/{path_argument_1}')values.path_argument_1='fixture-queue-id';
    response = await post('/api/execute', { operationId: operation.id, values, confirm: true });
    const result = await response.json();
    if (!operation.enabled) {
      blocked++; assert.equal(response.status, 422, operation.id); assert.equal(calls.length, before, operation.id); continue;
    }
    enabled++; assert.equal(response.status, 200, `${operation.id}: ${JSON.stringify(result)}`); assert.equal(calls.length, before + 1, operation.id);
    if(operation.clientProfile==='queue-read'){
      const {url,init}=calls.at(-1);assert.equal(url.origin,'https://aplikasi.atrbpn.go.id');
      assert.equal(init.method,'GET');assert.equal(init.headers.Authorization,'Bearer fixture-queue-only');assert.equal(init.body,undefined);
      if(operation.endpoint==='api/notifikasi'){assert.equal(url.pathname,'/konsol/antrian/directus/api/notifikasi');assert.equal(url.searchParams.get('nik'),'fixture-summary-nik');assert.deepEqual(result.result.data,{data:[]});}
      else if(operation.endpoint==='api/antrian/saya'){assert.equal(result.result.data.error,false);assert.equal(url.pathname,'/konsol/antrian/directus/api/antrian/saya');assert.equal(url.searchParams.get('nik'),'fixture-summary-nik');assert.equal(result.result.data.data[0].id,'fixture-queue-id');}
      else {assert.equal(url.pathname,'/konsol/antrian/directus/api/antrian/fixture-queue-id');assert.equal(url.search,'');assert.equal(result.result.data.data.id,'fixture-queue-id');}
      continue;
    }
    if (operation.clientProfile === 'sps-document-viewer' || operation.path === 'apis/GetDocument') { assert.equal(result.result.contentType, 'application/pdf'); assert.match(result.result.previewUrl, /^\/api\/preview\//); }
    else if (['Berita/GetBerita', 'Pengumuman/GetPengumuman'].includes(operation.path)) assert.deepEqual(result.result.data, { message: [{ id: `/${operation.path}`, title: 'fixture news', category: null, banner: null, url: null }] });
    else if (operation.path === 'activity/GetUserActivity') assert.deepEqual(result.result.data,{data:[]});
    else if (operation.path === 'activity/deleteUserActivity') assert.equal(result.result.data,true);
    else if (['collection/GetCollectionId','Collection/AddCollectionBerkas','Collection/AddCollectionPersil'].includes(operation.path)) assert.deepEqual(result.result.data,{error:true,message:null,data:'fixture-bookmark'});
    else if (['collection/GetUserCollection','collection/GetPersilCollectionGroup'].includes(operation.path)) assert.deepEqual(result.result.data,{error:true,message:null,data:[]});
    else if (['Collection/AddPersilCollectionGroup','Collection/AddPersilCollectionToGroup','Collection/EditCollectionPersil'].includes(operation.path) || operation.method === 'DELETE' && operation.group === 'Koleksi') assert.deepEqual(result.result.data,{error:true,message:null,data:'fixture-group-action'});
    else assert.equal(result.result.data.data.endpoint, `/${operation.path.replace(/^\/+/, '')}`, operation.id);
    const { url, init } = calls.at(-1);
    assert.equal(init.method, operation.method, operation.id);
    const expectedQuery = operation.fields.filter(f => f.location === 'query').map(f => f.path).sort();
    assert.deepEqual([...url.searchParams.keys()].sort(), expectedQuery, operation.id);
    if (operation.method === 'DELETE' && operation.group === 'Koleksi') assert.equal(url.pathname, '/' + operation.path.replace('{path_argument_1}', encodeURIComponent(values.path_argument_1)));
    const expectedBody = operation.fields.filter(f => f.location !== 'query' && f.location !== 'path' && f.type !== 'file').map(f => f.path).sort();
    const actualBody = init.body instanceof FormData || init.body instanceof URLSearchParams ? [...init.body.keys()] : typeof init.body === 'string' && init.headers['Content-Type'] === 'application/x-www-form-urlencoded' ? [...new URLSearchParams(init.body).keys()] : init.body ? Object.keys(JSON.parse(init.body)) : [];
    assert.deepEqual(actualBody.sort(), expectedBody, operation.id);
    if (operation.auth === 'application') assert.equal(init.headers.Authorization, 'AtrBpn fixture-only');
    else if (['session', 'optionalSession'].includes(operation.auth)) assert.equal(init.headers.Authorization, 'Bearer fixture-token');
  }
  assert.equal(enabled, 75); assert.equal(blocked, 101);
  assert.equal(calls.length, 78, 'One mock login, two ownership preparation calls, one call per enabled operation; no real network transport');
});
