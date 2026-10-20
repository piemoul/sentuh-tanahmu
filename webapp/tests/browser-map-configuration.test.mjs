import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {browserMapConfiguration,DEFAULT_CSP} from '../private/browser-map-configuration.mjs';
const configuration={configured:false,origin:'https://sentuh.atrbpn.go.id/',reason:'fixture only',applicationAuthorization:()=>null,bhumiAuthKey:()=>{throw new Error('Private key must not be read');}};
async function fixture(t){
  const server=createServer({configuration,googleMapsBrowserKey:'must_never_be_used_or_exported',transport:()=>{throw new Error('No upstream permitted');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  return `http://127.0.0.1:${server.address().port}`;
}
test('map configuration uses fixed OSM and Bhumi routes without any Google or account key',()=>{
  const expected={provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'};
  for(const ignored of [undefined,null,'arbitrary_google_key',{},'https://evil.invalid/tiles'])assert.deepEqual(browserMapConfiguration(ignored),expected);
  assert.ok(Object.isFrozen(browserMapConfiguration()));
});
test('public map configuration never bootstraps a session or touches private authorization',async t=>{
  const base=await fixture(t),response=await fetch(base+'/api/maps/config');
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('set-cookie'),null);
  assert.deepEqual(await response.json(),browserMapConfiguration());
});
test('HTML loads packaged Leaflet CSS and sends origin referrers without Google scripts or keys',async t=>{
  const base=await fixture(t),response=await fetch(base+'/'),html=await response.text();
  assert.equal(response.headers.get('content-security-policy'),DEFAULT_CSP);
  assert.equal(response.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
  assert.match(html,/href="assets\/vendor\/leaflet\/leaflet\.css"/);
  assert.doesNotMatch(html,/nonce=|maps\.googleapis\.com|must_never_be_used_or_exported/);
  for(const path of ['/assets/vendor/leaflet/leaflet.js','/assets/vendor/leaflet/leaflet.css','/assets/maps/official-map.js'])assert.equal((await fetch(base+path)).status,200);
  const apiResponse=await fetch(base+'/api/state');await apiResponse.text();assert.equal(apiResponse.headers.get('referrer-policy'),'no-referrer');
  const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('referrer-policy'),'strict-origin-when-cross-origin');
});
test('CSP permits only the exact OSM image host while scripts and API connections stay same-origin',()=>{
  assert.match(DEFAULT_CSP,/script-src 'self';/);assert.match(DEFAULT_CSP,/connect-src 'self';/);
  const images=DEFAULT_CSP.split(';').find(value=>value.trim().startsWith('img-src'));
  assert.equal(images.trim(),"img-src 'self' data: blob: https://www.atrbpn.go.id https://tile.openstreetmap.org");
  assert.doesNotMatch(DEFAULT_CSP,/unsafe-eval|script-src[^;]*unsafe-inline|googleapis|gstatic|https:\*/);
});
