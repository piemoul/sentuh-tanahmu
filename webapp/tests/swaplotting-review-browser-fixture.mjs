import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../../',import.meta.url)),web=path.join(root,'webapp');
const suffix=process.argv.find(x=>x.startsWith('--suffix='))?.slice(9)??'initial';assert.match(suffix,/^[a-z0-9-]+$/);const output=path.join(root,`analysis/webapp/swaplotting-review-browser-transport-${suffix}.json`);assert.equal(fs.existsSync(output),false);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),pin=file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))});
const baseline=JSON.parse(fs.readFileSync(path.join(root,'analysis/webapp/swaplotting-review-baseline.json')));
const files=[...baseline.runtime.map(row=>row.file),'webapp/assets/swaplotting/review.js','webapp/assets/swaplotting/review-view.js',...baseline.additionalDeliveryFiles.map(row=>row.file),'webapp/tests/swaplotting-review-browser-fixture.mjs','webapp/tests/swaplotting-review-browser-page.mjs'];
const inputs=[...new Set(files)].map(pin),observations=[];let stopped=false,listenerClosed=false,unexpected=0,tileRequests=0;
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=','base64');
function persist(){for(const row of inputs)assert.equal(pin(row.file).sha256,row.sha256,row.file);fs.writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),inputs,runtimeCount:103,stopped,listenerClosed,unexpected,tileRequests,observations,productionRequests:0,providerRequests:0,productionMutations:0,hardwareRequests:0,scope:'Actual packaged Swaplotting host/controller/view/photo capture/review. Profile and reads are explicit synthetic dependencies. Camera uses canvas stream; Leaflet tile source is redirected by fixture to a local pixel. No genuine BPN, OSM, GPS or camera permission request.'},null,2)+'\n');}
const html='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ringkasan Swaplotting · SINTETIS</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/assets/vendor/leaflet/leaflet.css"><style>body{margin:0}#fixture{margin:12px;padding:12px;border:2px solid #876100;background:#fff6d8;color:#372f1e;font:13px system-ui}#fixture button{padding:8px;margin:4px}#main{max-width:1000px;padding:16px;margin:auto}#fixture-state{white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto}</style></head><body><aside id="fixture"><h1>RINGKASAN DRAF · SINTETIS LOKAL</h1><p>Profil, pilihan, video dan tile dibuat untuk uji. Peta ini tidak menampilkan data bidang BPN. Tidak ada pengiriman atau sensor perangkat.</p><button id="fixture-new">Alur baru</button><button id="fixture-revoke">Cabut profil sintetis</button><button id="fixture-restore">Pulihkan profil sintetis</button><button id="fixture-observe">Rekam keadaan</button><button id="fixture-stop">Hentikan fixture</button><details><summary>Keadaan uji</summary><pre id="fixture-state"></pre></details></aside><main id="main"></main><script src="/assets/vendor/leaflet/leaflet.js"></script><script type="module" src="/fixture/page.js"></script></body></html>';
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.otf':'font/otf'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Cache-Control','no-store');
 try{
  assert.equal(req.headers.host,'localhost:4216');const route=new URL(req.url,'http://localhost:4216').pathname;
  if(req.method==='POST'&&['/fixture/observe','/fixture/stop'].includes(route)){
   assert.equal(req.headers.origin,'http://localhost:4216');let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<100000);}const body=JSON.parse(text);
   if(route==='/fixture/observe'){assert.ok(observations.length<120);observations.push(body);persist();res.writeHead(200,{'Content-Type':'application/json'});res.end('{"recorded":true}');return;}
   assert.equal(body.disposed,true);assert.equal(body.liveTracks,0);stopped=true;persist();res.writeHead(200,{'Content-Type':'application/json'});res.end('{"stopped":true}');setImmediate(()=>{server.close(()=>{listenerClosed=true;persist();console.log('Review fixture closed gracefully');});server.closeIdleConnections();});return;
  }
  if(req.method!=='GET')throw Error('Blocked mutation');
  if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
  if(route==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
  if(route==='/api/maps/config'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'}));return;}
  if(/^\/(?:fixture\/tile|api\/maps\/bhumi)\/\d+\/\d+\/\d+\.png$/.test(route)){tileRequests++;res.writeHead(200,{'Content-Type':'image/png'});res.end(pixel);return;}
  const relative=route==='/fixture/page.js'?'tests/swaplotting-review-browser-page.mjs':route.slice(1);
  assert.ok(relative==='styles.css'||relative.startsWith('assets/')||route==='/fixture/page.js');const file=path.resolve(web,relative);assert.ok(file.startsWith(web+path.sep));const body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream'});res.end(body);
 }catch(error){unexpected++;persist();res.writeHead(400,{'Content-Type':'text/plain'});res.end('Synthetic fixture rejected request');}
});
await new Promise(resolve=>server.listen(4216,'127.0.0.1',resolve));persist();console.log('Review fixture http://localhost:4216');
