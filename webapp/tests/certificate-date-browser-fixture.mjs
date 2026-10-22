// Date successor: production certificate display, synthetic read responses only.
// Actual application with three synthetic local read responses; never an upstream client.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getPublicCatalog} from '../private/operations.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url)),web=path.join(repo,'webapp'),port=4211,origin='http://localhost:'+port;
const suffix=process.argv.find(x=>x.startsWith('--suffix='))?.slice(9)??'initial';assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const output='analysis/webapp/certificate-date-browser-transport-'+suffix+'.json';assert.ok(!fs.existsSync(path.join(repo,output)),'Preserve previous receipt');
const bytes=file=>fs.readFileSync(path.join(repo,file)),sha=value=>createHash('sha256').update(value).digest('hex'),inputs=new Map(),served=new Map();
function pin(file){if(!inputs.has(file))inputs.set(file,{file,sha256:sha(bytes(file))});return inputs.get(file);}
const baselineFile='analysis/webapp/certificate-date-baseline.json',baseline=JSON.parse(bytes(baselineFile));assert.equal(baseline.runtime.length,84);
for(const file of [...baseline.runtime.map(row=>row.file),...baseline.expectedAdded,baselineFile,'webapp/tests/certificate-date-browser-fixture.mjs','webapp/tests/certificate-date-browser-page.mjs'])pin(file);
const staticInputs=new Map();function inventory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(repo,full).split(path.sep).join('/');staticInputs.set('/'+file.slice(7),pin(file));}}}inventory(path.join(web,'assets'));
const roots=['index.html','app.js','domain.js','gnss.js','coordinate-comparison.js','collection-save-persil.js','scan-controller.js','scan-camera.js','scan-location.js','parcel-map.js','styles.css','manifest.json'];for(const name of roots)if(fs.existsSync(path.join(web,name)))staticInputs.set('/'+name,pin('webapp/'+name));
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const catalog=getPublicCatalog(),recipes={profile:['post-account-account-summary-d2939c','account/account_summary'],list:['get-legacy-sertifikattanahnew-d44dc0','Legacy/SertifikatTanahNew'],detail:['get-legacy-getinfosertifikat-d4340c','legacy/GetInfoSertifikat']};
for(const [id,endpoint]of Object.values(recipes)){const op=catalog.find(row=>row.id===id);assert.ok(op?.enabled&&op.effect==='read'&&op.endpoint===endpoint);}
const variants=['filled','empty','null'],cards=variants.map((kind,index)=>({SertifikatId:'synthetic-analog-'+kind,Nama:'Catatan '+kind+' SINTETIS',Nomor:'SINTETIS-'+(index+1),JenisHak:'Hak Milik SINTETIS',StatusEl:0,StatusProses:1}));
const notes=Array.from({length:13},(_,i)=>({CatatanId:'synthetic-note-'+(i+1),Status:i%3===0?0:i%3===1?1:null,Kolom1:'Catatan '+(i+1),Kolom2:'Kolom dua '+(i+1),Kolom3:'Kolom tiga '+(i+1),Kolom4:'Kolom empat '+(i+1)}));
Object.assign(notes[0],{Kolom1:'baris awal<br>baris lanjut',Kolom2:'HURUF<BR>TETAP',Kolom3:'<script>fixtureOnly()</script>',Kolom4:'<img src=x onerror="fixtureOnly()"> & teks'});Object.assign(notes[12],{Kolom1:null,Kolom2:null,Kolom3:null,Kolom4:null,Status:null});
const apiCalls=[],observations=[],controls=[];let unexpected=0,stopped=false,listenerClosed=false;
function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input changed while fixture live: '+row.file);}
function persist(){stable();fs.writeFileSync(path.join(repo,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),origin,port,scope:'Unmodified production app/assets/CSS; fixture controls appended only; synthetic authenticated read API. No owner/controller injection, real login or upstream requests.',baseline:pin(baselineFile),baselineRuntimeCount:84,inputs:[...inputs.values()],servedInputs:[...served.values()],fixtureCsp:csp,operations:recipes,apiCalls,observations,controls,unexpected,stopped,listenerClosed,productionProviderRequests:0,hardwarePermissionRequests:0,writeRequests:0},null,2)+'\n',{flag:fs.existsSync(path.join(repo,output))?'w':'wx'});}
function status(){return{apiCalls:[...apiCalls],observations:observations.length,unexpected,stopped,listenerClosed};}
function json(res,value,code=200){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
async function body(req){assert.equal(req.headers.origin,origin);let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<=40000);}const data=JSON.parse(text||'{}');assert.ok(data&&typeof data==='object'&&!Array.isArray(data));return data;}
function stop(reason){if(stopped)return;stopped=true;controls.push({action:'stop',reason});persist();server.close(()=>{listenerClosed=true;persist();console.log('Certificate date fixture closed gracefully');});server.closeIdleConnections();}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.jpg':'image/jpeg','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
function sendFile(res,route,file,transformed=null){const source=pin(file);assert.equal(sha(bytes(file)),source.sha256);const data=transformed===null?bytes(file):Buffer.from(transformed);served.set(route,{route,...source,servedSha256:sha(data),transformed:transformed!==null});res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream'});res.end(data);persist();}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 try{
  assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
  if(req.method==='GET'&&route==='/fixture/status'){json(res,status());return;}
  if(req.method==='POST'&&route.startsWith('/fixture/')){const data=await body(req);if(route==='/fixture/observe'){assert.ok(observations.length<100);observations.push(data);persist();json(res,status());return;}if(route==='/fixture/stop'){assert.deepEqual(data,{openDialogs:0,route:'#/certificates'});json(res,{stopping:true});setImmediate(()=>stop('visible-stop-after-real-modal-close'));return;}throw Error('Unknown control');}
  if(req.method==='GET'&&route==='/api/state'){json(res,{csrfToken:'fixture-analog-notes-csrf',authenticated:true,user:{username:'synthetic-analog-only',nama:'Akun SINTETIS',roleUser:'PERORANGAN',userLevel:2},connection:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL'},version:'6.1.5',capabilities:{}});return;}
  if(req.method==='GET'&&route==='/api/catalog'){json(res,{operations:catalog});return;}
  if(req.method==='POST'&&route==='/api/execute'){
   assert.equal(req.headers['x-csrf-token'],'fixture-analog-notes-csrf');const data=await body(req);assert.deepEqual(Object.keys(data).sort(),['operationId','values']);const kind=Object.keys(recipes).find(key=>recipes[key][0]===data.operationId);assert.ok(kind,'Unexpected operation');assert.ok(apiCalls.length<100);let payload,selectedId=null;
   if(kind==='profile'){assert.deepEqual(data.values,{});payload={nama:'Akun SINTETIS',username:'synthetic-analog-only',nomorIdentitas:'SYNTHETIC-NON-IDENTITY',roleUser:'PERORANGAN',userLevel:2,statusVerifikasi:1,isIkd:false};}
   else if(kind==='list'){assert.deepEqual(data.values,{});payload=cards;}
   else{assert.deepEqual(Object.keys(data.values),['sertifikatId']);selectedId=data.values.sertifikatId;const card=cards.find(row=>row.SertifikatId===selectedId);assert.ok(card,'Unknown synthetic selection');const kind=variants[cards.indexOf(card)],list=kind==='null'?null:[];payload={Nomor:card.Nomor,JenisHak:card.JenisHak,KodeBlanko:'BLANKO SINTETIS',ValidSejak:kind==='filled'?'2026-10-20T13:24:35.123Z':kind==='empty'?'2/29/2024 1:24:35 pm':null,ValidSampai:kind==='filled'?'9999-12-31T00:00:00':kind==='empty'?'2023-02-29':null,Persil:list,PemilikPertama:list,SuratUkur:kind==='filled'?[{Nomor:'UKUR SINTETIS 1',BerlakuSejak:'2020-08-01T13:24:35.1Z',Luas:100},{Nomor:'UKUR SINTETIS 2',BerlakuSejak:'2026-10-20T13:24:35.123',Luas:100},{Nomor:'UKUR SINTETIS 3',BerlakuSejak:'2026-10-20T13:24:35+07:00',Luas:100}]:list,CatatanPendaftaran:list};}
   apiCalls.push({sequence:apiCalls.length+1,kind,operationId:data.operationId,values:data.values,selectedId,status:200});json(res,{result:{status:200,data:{error:false,data:payload}}});persist();return;
  }
  if(route.startsWith('/api/'))throw Error('Unexpected API route');if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(route==='/fixture/mobile'){res.writeHead(200,{'Content-Type':types['.html']});res.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tanggal frame390</title><style>body{margin:12px;font:14px system-ui}iframe{display:block;width:390px;height:844px;border:1px solid #999}</style></head><body><h1>Tanggal · CSS390×844</h1><p>Frame browser; bukan Android fisik.</p><iframe title="Tanggal lebar390" src="/#/certificates"></iframe></body></html>');return;}
  if(route==='/fixture/page.js'){sendFile(res,route,'webapp/tests/certificate-date-browser-page.mjs');return;}
  if(route==='/'){const html=bytes('webapp/index.html').toString().replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace('</body>','<script type="module" src="/fixture/page.js"></script></body>');sendFile(res,route,'webapp/index.html',html);return;}
  if(route==='/fixture/style.css'){res.writeHead(200,{'Content-Type':types['.css']});res.end('#certificate-date-fixture{padding:10px;margin:10px;border:2px solid #927200;background:#fff8dc;font:12px/1.4 system-ui;color:#312b20}#certificate-date-fixture h2{font-size:15px}#certificate-date-fixture button{padding:6px;margin:4px;font:inherit}#fixture-status{white-space:pre-wrap;overflow-wrap:anywhere;max-height:280px;overflow:auto}@media(min-width:761px){body>#certificate-date-fixture{margin-left:270px}}');return;}
  const row=staticInputs.get(route);if(!row){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(repo,row.file)).startsWith(fs.realpathSync(web)+path.sep));sendFile(res,route,row.file);
 }catch(error){unexpected++;persist();console.error('Fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'FIXTURE_REJECTED',message:'Permintaan tidak diizinkan pada fixture.'}},400);else res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});persist();console.log('Certificate date fixture '+origin+'/#/certificates');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>stop(signal));
