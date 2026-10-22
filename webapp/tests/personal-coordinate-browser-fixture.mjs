// Isolated coordinate/photo UI QA. Provider transports are prohibited.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from '../server.mjs';
import {DEFAULT_CSP,browserMapConfiguration} from '../private/browser-map-configuration.mjs';
const suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'';assert.match(suffix,/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/);
const output='analysis/webapp/personal-coordinate-browser-transport'+(suffix?'-'+suffix:'')+'.json';
assert.ok(!fs.existsSync(output),'Preserve earlier browser transport');
const files=['webapp/tests/personal-coordinate-browser-fixture.mjs','webapp/tests/personal-coordinate-browser-page.mjs','webapp/app.js','webapp/styles.css','webapp/server.mjs','webapp/private/browser-map-configuration.mjs',...['coordinate-entry','model','controller','view','map','host','camera','capture-dialog','photo-store','photo-removal'].map(name=>'webapp/assets/swaplotting/'+name+'.js')];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),inputs=files.map(file=>({file,sha256:sha(fs.readFileSync(file))}));
const requests=[],observations=[],pendingMaps=[];let mode='ready',stopped=false,unexpected=0,tileRequests=0;
const persist=()=>{for(const row of inputs)assert.equal(sha(fs.readFileSync(row.file)),row.sha256,row.file);fs.writeFileSync(output,JSON.stringify({checkedAt:new Date().toISOString(),inputs,stopped,unexpected,mode,pendingMaps:pendingMaps.length,tileRequests,requests,observations,productionProviderRequests:0,hardwarePermissionRequests:0,uploadGeotagOtpBookingRequests:0,scope:'Actual current personal host/controller/map/view/camera and CSS, synthetic contacts/references/current-session points and canvas camera. OSM image tiles may load publicly; Bhumi tiles are transparent local PNGs. No production API, user credential/document, deviceGPS, hardware camera or upload. Same-origin390px iframe requires fixture-only frame-ancestors self; remaining production CSP unchanged.'},null,2)+'\n');};
const blocked=async()=>{unexpected++;persist();throw Error('Provider transport prohibited in coordinate fixture');};
const server=createServer({publicOrigin:'',configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SYNTHETIC COORDINATE QA ONLY',applicationAuthorization:()=> 'AtrBpn synthetic-not-a-credential'},log:()=>{},transport:blocked,queueTransport:blocked,bhumiTransport:blocked});
const listener=server.listeners('request')[0];server.removeAllListeners('request');
const fixtureCsp=DEFAULT_CSP.replace("frame-ancestors 'none'","frame-ancestors 'self'");
const controls='<aside id="fixture-controls"><h1>UJI KOORDINAT · DATA SINTETIS</h1><p>Koordinat dan profil buatan. Kamera hanya stream canvas, tanpa GPS, OTP, upload atau layanan BPN.</p><div><label>Peta uji <select id="fixture-map-mode"><option value="ready">Siap</option><option value="deferred">Tertunda</option><option value="fail">Gagal</option></select></label><label>Informasi uji <select id="fixture-disclaimer-mode"><option value="ready">Siap</option><option value="deferred">Tertunda</option><option value="show">Tampilkan</option></select></label></div><div><button data-fixture-action="new">Buka alur baru</button><button data-fixture-action="release-map">Selesaikan peta tertunda</button><button data-fixture-action="release-disclaimer">Selesaikan informasi tertunda</button><button data-fixture-action="mutate-point">Ubah titik sesi</button><button data-fixture-action="remove-points">Hapus titik sesi</button><button data-fixture-action="duplicate-point">Duplikat ID titik</button><button data-fixture-action="reset-points">Pulihkan titik sesi</button><button data-fixture-action="close">Tutup alur</button><button data-fixture-action="stop">Hentikan fixture</button></div><details><summary>Keadaan uji teramati</summary><pre id="fixture-status"></pre></details></aside>';
const css='body{background:#f5f7f6}#fixture-controls{margin:18px;padding:16px;border:2px solid #997600;background:#fff9df;font:12px/1.6 system-ui;color:#3e3526}#fixture-controls h1{font-size:17px}#fixture-controls label{display:inline-flex;gap:8px;margin:4px 12px 4px 0}#fixture-controls button,#fixture-controls select{font:inherit;padding:7px;margin:4px}#fixture-status{white-space:pre-wrap;overflow-wrap:anywhere}#main{max-width:1100px;margin:20px auto;padding:0 22px}@media(max-width:600px){#fixture-controls{margin:8px;padding:12px}#main{padding:0 10px}}';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=','base64');
function finishMap(res,status=200){res.writeHead(status,{'Content-Type':'application/json'});res.end(status===200?JSON.stringify(browserMapConfiguration()):'{"error":"SYNTHETIC_MAP_FAILURE"}');}
function releaseMaps(){for(const row of pendingMaps.splice(0))if(!row.res.destroyed)finishMap(row.res);persist();}
function stop(){if(stopped)return;stopped=true;releaseMaps();persist();server.closeAllConnections();server.close(()=>console.log('Coordinate fixture stopped'));}
server.on('request',async(req,res)=>{
 const url=new URL(req.url,'http://localhost:4208');requests.push({method:req.method,path:url.pathname});
 res.setHeader('Content-Security-Policy',fixtureCsp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Cache-Control','no-store');
 try{
  if(url.pathname.startsWith('/fixture/')&&req.method==='POST'){
   assert.equal(req.headers.origin,'http://localhost:4208');let body='';for await(const chunk of req){body+=chunk;assert.ok(body.length<30000);}const data=body?JSON.parse(body):{};
   if(url.pathname==='/fixture/map-mode'){assert.ok(['ready','deferred','fail'].includes(data.mode));mode=data.mode;}
   else if(url.pathname==='/fixture/release-map')releaseMaps();
   else if(url.pathname==='/fixture/report'){assert.equal(data.hardwareCameraCalls,0);observations.push(data);assert.ok(observations.length<150);}
   else if(url.pathname==='/fixture/stop'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"stopped":true}');setImmediate(stop);return;}
   else{unexpected++;throw Error('Unexpected fixture action');}
   persist();res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return;
  }
  if(req.method==='GET'&&url.pathname==='/fixture/mobile'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Koordinat personal390</title><style>body{margin:16px;background:#e8edef;font:14px system-ui}h1{font-size:18px}iframe{width:390px;height:844px;display:block;border:1px solid #b5c5c1;background:white}</style></head><body><h1>Uji personal · frame390×844</h1><p>Frame CSS, bukan perangkat Android atau kamera fisik.</p><iframe title="Koordinat personal lebar390" src="/"></iframe></body></html>');return;}
  if(req.method==='GET'&&url.pathname==='/fixture/page.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(fs.readFileSync('webapp/tests/personal-coordinate-browser-page.mjs'));return;}
  if(req.method==='GET'&&url.pathname==='/fixture/style.css'){res.writeHead(200,{'Content-Type':'text/css'});res.end(css);return;}
  if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Koordinat personal · SINTETIS</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/assets/vendor/leaflet/leaflet.css"><link rel="stylesheet" href="/fixture/style.css"></head><body>'+controls+'<main id="main"></main><script type="module" src="/fixture/page.js"></script></body></html>');return;}
  if(req.method==='GET'&&url.pathname==='/api/maps/config'){if(mode==='deferred'){const row={res};pendingMaps.push(row);res.once('close',()=>{const index=pendingMaps.indexOf(row);if(index>=0)pendingMaps.splice(index,1);});persist();return;}finishMap(res,mode==='fail'?503:200);persist();return;}
  if(req.method==='GET'&&/^\/api\/maps\/bhumi\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){tileRequests++;res.writeHead(200,{'Content-Type':'image/png'});res.end(png);persist();return;}
  if(url.pathname.startsWith('/api/')){unexpected++;persist();res.writeHead(403);res.end('No other API allowed');return;}
  return listener(req,res);
 }catch(error){unexpected++;persist();res.writeHead(400);res.end('Invalid synthetic fixture request');}
});
await new Promise(resolve=>server.listen(4208,'127.0.0.1',resolve));persist();console.log('Coordinate/photo synthetic fixture http://localhost:4208/');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,stop);
