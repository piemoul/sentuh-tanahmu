// Whole-app browser fixture. Never run against a provider; all API is local.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {DEFAULT_CSP} from '../private/browser-map-configuration.mjs';
import {getPublicCatalog} from '../private/operations.mjs';
import {HOME_MEDIA_OPERATIONS} from '../assets/home-media/model.js';

const repo=fileURLToPath(new URL('../../',import.meta.url)),publicRoot=path.join(repo,'webapp'),origin='http://localhost:4209';
const suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'';assert.match(suffix,/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/);
const output='analysis/webapp/home-media-browser-transport'+(suffix?'-'+suffix:'')+'.json';
assert.ok(!fs.existsSync(path.join(repo,output)),'Preserve existing transport receipt');
const staged='environment/home-media-runtime/staged-app.js',hostFile='webapp/assets/home-media/host.js';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),read=file=>fs.readFileSync(path.join(repo,file));
assert.ok(fs.existsSync(path.join(repo,staged)),'Root must stage exact future app bytes before fixture launch');
const baseline=JSON.parse(read('analysis/webapp/home-media-runtime-baseline.json'));
const inputs=new Map();
function pin(file){if(!inputs.has(file))inputs.set(file,{file,sha256:sha(read(file))});return inputs.get(file);}
for(const file of [...baseline.runtime.map(row=>row.file),'webapp/tests/home-media-browser-fixture.mjs','webapp/tests/home-media-browser-page.mjs',staged,'webapp/private/operations.mjs','webapp/private/browser-map-configuration.mjs',...['model','controller','view','host'].map(name=>'webapp/assets/home-media/'+name+'.js')])pin(file);
// Hash all public asset candidates before serving, but only publish requested
// assets in the served-input list. Private/test files are never static routes.
const startup=new Map();
function inventory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(repo,full).split(path.sep).join('/');startup.set(file,sha(fs.readFileSync(full)));}}}
inventory(path.join(publicRoot,'assets'));
for(const file of ['index.html','app.js','domain.js','gnss.js','coordinate-comparison.js','collection-save-persil.js','scan-controller.js','scan-camera.js','scan-location.js','parcel-map.js','styles.css','manifest.json'])if(fs.existsSync(path.join(publicRoot,file)))startup.set('webapp/'+file,sha(read('webapp/'+file)));
const hostRaw=read(hostFile).toString(),needle='resolvePlayerUrl=homeYoutubeEmbedUrl';assert.equal(hostRaw.split(needle).length-1,1);
const hostServed=hostRaw.replace(needle,"resolvePlayerUrl=(videoId=>new URL('/fixture/player?id='+encodeURIComponent(videoId),document.defaultView.location.origin).href)");
const transforms=[{route:'/app.js',source:pin(staged),servedSha256:sha(read(staged)),rule:'Exact staged future application, original webapp/app.js independently pinned unchanged.'},{route:'/assets/home-media/host.js',source:pin(hostFile),servedSha256:sha(hostServed),replacements:1,rule:'Only default resolvePlayerUrl initializer replaced with explicit same-origin inert fixture player. Production helper/model and all host URL/lifecycle guards unchanged.'}];
const directives=new Map(DEFAULT_CSP.split(';').map(value=>value.trim()).filter(Boolean).map(value=>{const [key,...values]=value.split(/\s+/);return[key,values];}));
for(const [key,values]of Object.entries({'img-src':["'self'",'data:'],'connect-src':["'self'"],'font-src':["'self'",'data:'],'frame-src':["'self'"],'frame-ancestors':["'self'"],'media-src':["'none'"]}))directives.set(key,values);
const csp=[...directives].map(([key,values])=>[key,...values].join(' ')).join('; ');
const catalog=getPublicCatalog(),recipes={banner:HOME_MEDIA_OPERATIONS.banner,youtube:HOME_MEDIA_OPERATIONS.youtube,news:catalog.find(op=>op.endpoint==='Berita/GetBerita?limit=8')?.id,announcements:catalog.find(op=>op.endpoint==='Pengumuman/GetPengumuman?limit=5')?.id};
assert.equal(new Set(Object.values(recipes)).size,4);
for(const id of Object.values(recipes)){const op=catalog.find(op=>op.id===id);assert.ok(op&&op.enabled&&op.effect==='read'&&op.method==='GET');}
const kinds=Object.keys(recipes),modes=Object.fromEntries(kinds.map(kind=>[kind,'ready'])),allowedModes=['ready','deferred','empty','malformed','transport-error'];
const apiCalls=[],controls=[],observations=[],pending=[],served=new Map(),localPlayers=[];let sequence=0,unexpected=0,stopped=false,listenerClosed=false,stopReason=null;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function assertStable(){for(const row of inputs.values())assert.equal(sha(read(row.file)),row.sha256,'Source changed while fixture live: '+row.file);}
function persist(){assertStable();const data={schemaVersion:1,checkedAt:new Date().toISOString(),origin,port:4209,scope:'Actual index/assets/CSS and staged whole application; anonymous synthetic API only. No app-owner/controller injection. Same-origin inert player is an explicit default-resolver transform; external images are blocked by fixture CSP and non-origin navigation is intercepted visibly.',inputs:[...inputs.values()],servedInputs:[...served.values()],transforms,productionCsp:DEFAULT_CSP,fixtureCsp:csp,cspAdaptations:['img/connect/font restricted to local/data','frame-src/frame-ancestors self for inert player and390px same-origin frame','media-src none'],requestedOperations:Object.values(recipes),modes:{...modes},apiCalls,controls,pending:pending.length,observations,localPlayers,unexpected,stopped,listenerClosed,stopReason,productionProviderRequests:0,accountLoginRequests:0,hardwarePermissionRequests:0,identityOtpBookingPlotGeotagWrites:0};fs.writeFileSync(path.join(repo,output),JSON.stringify(data,null,2)+'\n',{flag:fs.existsSync(path.join(repo,output))?'w':'wx'});}
function status(){return{modes:{...modes},pending:pending.map(row=>({kind:row.kind,sequence:row.call.sequence})),calls:apiCalls.map(({sequence,kind,mode,completed,cancelled,response})=>({sequence,kind,mode,completed,cancelled,response})),counts:{api:apiCalls.length,completed:apiCalls.filter(row=>row.completed).length,unexpected,localPlayer:localPlayers.length,servedInputs:served.size},stopped,listenerClosed};}
function json(res,value,statusCode=200){res.writeHead(statusCode,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
function result(kind,mode){
 if(mode==='transport-error')return{http:503,body:{error:{code:'SYNTHETIC_TRANSPORT_ERROR',message:'Koneksi uji belum tersedia. Coba muat ulang.'}}};
 if(kind==='banner')return{http:200,body:{result:{status:200,data:{error:false,message:null,totalRecords:mode==='empty'?0:2,resultsCount:mode==='empty'?0:2,pageSize:2,pageNumber:1,data:mode==='empty'?[]:mode==='malformed'?[{path:12}]:[{bannerId:'fixture-banner-1',sequenceId:9,bannerUrl:'https://localhost:4209/NEVER-BANNER-URL.jpg',externalUrl:'https://localhost:4209/fixture/banner-target',path:'/fixture/banner-first.jpg'},{bannerId:'fixture-banner-2',sequenceId:1,bannerUrl:'https://localhost:4209/NEVER-SECOND-URL.jpg',externalUrl:null,path:'/fixture/banner-second.jpg'}]}}}};
 if(kind==='youtube')return{http:200,body:{result:{status:200,data:{data:mode==='empty'?[]:mode==='malformed'?[{videoId:'synthetic_A1',title:42}]:[{channelTitle:'Kanal SINTETIS',channelId:'channel-synthetic',videoId:'synthetic_A1',title:'Video <script>fixtureOnly()</script> & judul',thumbnailUrl:'https://i.ytimg.com/vi/synthetic_A1/default.jpg',publishedTime:'RAW time, deliberately not a DateTime'},{channelTitle:null,channelId:null,videoId:'synthetic_B2',title:'Video kedua SINTETIS',thumbnailUrl:null,publishedTime:'2026-10-20 RAW'}]}}}};
 return{http:200,body:{result:{status:200,data:{message:mode==='malformed'?'not-a-list':[]}}}};
}
function finish(row,mode){if(row.res.destroyed||row.res.writableEnded)return;const reply=result(row.kind,mode);row.call.completed=true;row.call.response=mode;json(row.res,reply.body,reply.http);}
function release(kind,outcome){assert.ok(kinds.includes(kind)&&['ready','empty'].includes(outcome));for(const row of pending.filter(row=>row.kind===kind)){pending.splice(pending.indexOf(row),1);finish(row,outcome);}persist();}
function stop(reason){if(stopped)return;stopped=true;stopReason=reason;for(const row of pending.splice(0))finish(row,'empty');persist();server.close(()=>{listenerClosed=true;persist();console.log('Home media fixture closed gracefully');});server.closeIdleConnections();}
async function body(req){assert.equal(req.headers.origin,origin);let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<=8192);}const value=text?JSON.parse(text):{};assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.jpg':'image/jpeg','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
function staticFile(res,route,file,data=null,type=null){
 const expected=startup.get(file)??inputs.get(file)?.sha256;assert.ok(expected,'Uninventoried static input');assert.equal(sha(read(file)),expected);pin(file);const bytes=data===null?read(file):Buffer.from(data);
 served.set(route,{route,file,sourceSha256:expected,servedSha256:sha(bytes),transformed:data!==null&&sha(bytes)!==expected});res.writeHead(200,{'Content-Type':type??types[path.extname(file)]??'application/octet-stream'});res.end(bytes);persist();
}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 try{
  assert.equal(req.headers.host,'localhost:4209');const url=new URL(req.url,origin),route=url.pathname;
  if(req.method==='GET'&&route==='/fixture/status'){json(res,status());return;}
  if(req.method==='POST'&&route.startsWith('/fixture/')){
   const data=await body(req);
   if(route==='/fixture/control'){assert.deepEqual(Object.keys(data).sort(),['kind','mode']);assert.ok(kinds.includes(data.kind)&&allowedModes.includes(data.mode));modes[data.kind]=data.mode;controls.push({action:'mode',kind:data.kind,mode:data.mode});}
   else if(route==='/fixture/release'){assert.deepEqual(Object.keys(data).sort(),['kind','outcome']);release(data.kind,data.outcome);controls.push({action:'release',kind:data.kind,outcome:data.outcome});}
   else if(route==='/fixture/observe'){assert.ok(observations.length<150);observations.push(data);}
   else if(route==='/fixture/stop'){assert.equal(data.route,'#/services');assert.equal(data.activePlayers,0);controls.push({action:'stop',route:data.route,activePlayers:0});json(res,{stopping:true});setImmediate(()=>stop('visible-button-after-services-navigation'));return;}
   else throw Error('Unexpected fixture action');persist();json(res,status());return;
  }
  if(req.method==='GET'&&route==='/api/state'){json(res,{csrfToken:'fixture-home-media-csrf',authenticated:false,user:null,connection:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL'},version:'6.1.5',capabilities:{}});return;}
  if(req.method==='GET'&&route==='/api/catalog'){json(res,{operations:catalog});return;}
  if(req.method==='POST'&&route==='/api/execute'){
   assert.equal(req.headers['x-csrf-token'],'fixture-home-media-csrf');const data=await body(req);assert.deepEqual(Object.keys(data).sort(),['operationId','values']);assert.deepEqual(data.values,{});const kind=kinds.find(kind=>recipes[kind]===data.operationId);assert.ok(kind,'Unexpected operation');const mode=modes[kind],call={sequence:++sequence,kind,operationId:data.operationId,mode,completed:false,cancelled:false};apiCalls.push(call);assert.ok(apiCalls.length<=200);const row={res,kind,call};
   if(mode==='deferred'){pending.push(row);res.once('close',()=>{const at=pending.indexOf(row);if(at>=0){pending.splice(at,1);call.cancelled=true;persist();}});persist();return;}finish(row,mode);persist();return;
  }
  if(route.startsWith('/api/'))throw Error('Unexpected API path');
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(route==='/fixture/player'){assert.ok(['synthetic_A1','synthetic_B2'].includes(url.searchParams.get('id')));localPlayers.push({id:url.searchParams.get('id')});
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pemutar SINTETIS lokal</title></head><body><h1>Pemutar SINTETIS lokal</h1><p>'+escape(url.searchParams.get('id'))+'</p><p>Tidak ada video, SDK, cookie atau jaringan YouTube.</p></body></html>');persist();return;}
  if(route==='/fixture/mobile'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Beranda frame390</title><style>body{margin:16px;font:14px system-ui;background:#e7eeee}iframe{display:block;width:390px;height:844px;border:1px solid #999;background:white}</style></head><body><h1>Beranda · frame CSS390×844</h1><p>Bukan Android atau perangkat fisik.</p><iframe title="Beranda lebar390" src="/"></iframe></body></html>');return;}
  if(route==='/fixture/page.js'){staticFile(res,route,'webapp/tests/home-media-browser-page.mjs',null,'text/javascript; charset=utf-8');return;}
  if(route==='/'){const html=read('webapp/index.html').toString().replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace('<body>','<body><aside id="home-media-fixture"></aside>').replace('</body>','<script type="module" src="/fixture/page.js"></script></body>');staticFile(res,route,'webapp/index.html',html,'text/html; charset=utf-8');return;}
  if(route==='/fixture/style.css'){res.writeHead(200,{'Content-Type':'text/css; charset=utf-8'});res.end('#home-media-fixture{padding:12px;margin:12px;border:2px solid #927200;background:#fff8dc;font:12px/1.5 system-ui;color:#312b20}#home-media-fixture h1{font-size:17px}#home-media-fixture label{display:inline-flex;gap:6px;align-items:center}#home-media-fixture button,#home-media-fixture select{padding:6px;margin:4px;font:inherit}#fixture-status{white-space:pre-wrap;overflow-wrap:anywhere;max-height:340px;overflow:auto}@media(min-width:761px){#home-media-fixture{margin-left:270px}}');return;}
  if(route==='/app.js'){staticFile(res,route,staged,null,'text/javascript; charset=utf-8');return;}
  if(route==='/assets/home-media/host.js'){staticFile(res,route,hostFile,hostServed,'text/javascript; charset=utf-8');return;}
  let relative;try{relative=decodeURIComponent(route).replace(/^\/+/, '');}catch{res.writeHead(400);res.end();return;}
  const file='webapp/'+relative;if(!startup.has(file)||(!relative.startsWith('assets/')&&!['index.html','domain.js','gnss.js','coordinate-comparison.js','collection-save-persil.js','scan-controller.js','scan-camera.js','scan-location.js','parcel-map.js','styles.css','manifest.json'].includes(relative))){res.writeHead(404);res.end();return;}
  assert.ok(fs.realpathSync(path.join(repo,file)).startsWith(fs.realpathSync(publicRoot)+path.sep));staticFile(res,route,file);
 }catch(error){unexpected++;persist();if(!res.headersSent)json(res,{error:{code:'FIXTURE_REJECTED',message:'Permintaan tidak diizinkan pada fixture lokal.'}},400);else res.end();}
});
await new Promise(resolve=>server.listen(4209,'127.0.0.1',resolve));persist();console.log('Whole-app home media fixture '+origin+'/#/dashboard');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>stop(signal));
