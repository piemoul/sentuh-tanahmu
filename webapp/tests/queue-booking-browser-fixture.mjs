// Whole actual app and HTTP adapter. Only sessions/upstream responses synthetic.
// Import is inert; start only after root source freeze. No product transforms.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from '../private/http-api.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url)),BASELINE='analysis/webapp/queue-booking-runtime-baseline.json',BASELINE_SHA='64b2224621254631299230e331709cd7b3359ba69dea979114afd9b2d07ef527';
const bytes=file=>fs.readFileSync(path.join(ROOT,file)),sha=value=>createHash('sha256').update(value).digest('hex');
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
const MODES=['success','quota-false','full','closed','service-error','empty-message','slow-quota','slow-quota-401','slow-availability'];
const offices=[{id:'queue-A',nama:'Kantor SINTETIS A',kantor_id:'canonical-A'},{id:'queue-B',nama:'Kantor SINTETIS B',kantor_id:'canonical-B'}];
const loket={id:'loket-A',nama:'Loket SINTETIS A',deskripsi:'Informasi pelayanan sintetis',nomor:null,jumlah_antrian_total:17,jumlah_antrian:9,status:1,is_available:1,estimasi:1.5,jam_buka:null,jam_tutup:null,estimasi_message:'Estimasi SINTETIS'};
const profile={nama:'Pemohon SINTETIS',nomorIdentitas:'0000000000000000',kantorId:'canonical-B',userLevel:2,isIkd:false,roleUser:'PERORANGAN',statusVerifikasi:1,tempatLahir:'Tempat SINTETIS',tanggalLahir:'21/10/1985',nomorHp:'0000000000'};

export function createQueueBookingBrowserFixture({port=4222,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/queue-booking-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve prior receipt; choose a new suffix');
 assert.equal(sha(bytes(BASELINE)),BASELINE_SHA);const baseline=JSON.parse(bytes(BASELINE));assert.equal(baseline.passed,true);assert.equal(baseline.runtime.length,122);
 const inputs=new Map(),statics=new Map(),served=new Map(),calls=[],browserRequests=[],controls=[],observations=[],logs=[],held=new Map();
 let started=false,stopped=false,listenerClosed=false,sequence=0,unexpected=0,generation=0,authenticateNext=true,mode='success';
 const pin=file=>{const row={file,sha256:sha(bytes(file))};if(inputs.has(file))assert.equal(inputs.get(file).sha256,row.sha256,'Source changed '+file);else inputs.set(file,row);return row;};
 const runtime=new Set(baseline.runtime.map(row=>row.file));
 for(const folder of ['webapp/private','webapp/assets/queue'])for(const entry of fs.readdirSync(path.join(ROOT,folder),{withFileTypes:true}))if(entry.isFile()&&/\.(?:mjs|js)$/.test(entry.name))runtime.add(folder+'/'+entry.name);
 for(const file of [...runtime,BASELINE,'webapp/tests/queue-booking-browser-fixture.mjs','webapp/tests/queue-booking-browser-page.mjs'])pin(file);
 function inventory(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){assert.equal(entry.isSymbolicLink(),false);const full=path.join(folder,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(ROOT,full).split(path.sep).join('/');statics.set('/'+file.slice(7),pin(file));}}}
 inventory(path.join(ROOT,'webapp/assets'));for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;statics.set('/'+entry.name,pin(file));}
 const catalog=operations.getPublicCatalog();assert.equal(catalog.length,176);
 const limit=catalog.find(op=>op.path==='api/booking/limit/'&&op.method==='POST');assert.ok(limit?.enabled&&limit.requiresConfirmation&&limit.serviceId==='directus','Real quota operation must be enabled before fixture start');
 const permitted=catalog.filter(op=>op.id===limit.id||op.serviceId==='directus'&&op.effect==='read'&&['items/kantor','items/lokasi','api/antrian','api/antrian/saya','api/notifikasi'].includes(op.path)||op.serviceId==='main'&&['account/account_summary','KantorNearby/GetCalendar','Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(op.endpoint));
 const allowedIds=new Set(permitted.map(op=>op.id));
 const reject=message=>{unexpected++;persist();throw Error(message);};
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!allowedIds.has(id))reject('Operation outside queue booking fixture scope');return operations.prepareOperation(id,values,context);}};
 const sessions=new SessionStore(),create=sessions.create.bind(sessions);
 sessions.create=()=>{const session=create();if(authenticateNext){authenticateNext=false;generation++;session.user={username:'queue-booking-SYNTHETIC-'+generation,nama:profile.nama,userLevel:2,roleUser:'PERORANGAN',nomorIndukKependudukan:profile.nomorIdentitas};session.tokens={tokenType:'Bearer',accessToken:'fixture-main-token-'+generation,refreshToken:null,expiredAt:4e9};}return session;};
 const status=()=>({origin,port,suffix,started,stopped,listenerClosed,sequence,generation,mode,authenticated:[...sessions.sessions.values()].some(row=>!!row.user&&!!row.tokens),calls:[...calls],browserRequests:[...browserRequests],controls:[...controls],observations:observations.length,held:[...held.keys()],unexpected,syntheticLimitRequests:calls.filter(row=>row.kind==='limit').length,syntheticCreateRequests:calls.filter(row=>row.kind==='create').length});
 function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input changed during fixture '+row.file);}
 function persist(){if(!started)return;stable();fs.writeFileSync(path.join(ROOT,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Whole actual app, createApiHandler, SessionStore, registry, serializers and decoders with synthetic session and injected main/Directus transports only. No provider, real account, notification token or create request. Product app/modules are byte-exact.',baseline:pin(BASELINE),runtime:[...runtime].map(pin),runtimeCount:runtime.size,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'append fixture helper module before product module and stylesheet only'}],fixtureCsp:CSP,catalogCount:catalog.length,enabled:catalog.filter(row=>row.enabled).length,limitOperationId:limit.id,modes:MODES,offices,profile,baseLoket:loket,...status(),observations,logs,providerRequests:0,productionRequests:0,productionWrites:0,identitySubmissions:0,otpRequests:0,socketRequests:0,hardwarePermissionRequests:0},null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 function release(reason='control'){const ids=[...held.keys()];for(const callback of held.values())callback(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 async function wait(call){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('timeout');},60000);timer.unref();held.set(call.sequence,reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);});persist();});}
 function done(call,data,statusCode=200){const wire=Buffer.from(JSON.stringify(data));Object.assign(call,{completed:true,completedSequence:++sequence,status:statusCode,responseBytes:wire.length,responseSha256:sha(wire)});persist();return new Response(wire,{status:statusCode,headers:{'Content-Type':'application/json; charset=utf-8'}});}
 async function mainTransport(input,init){
  const url=new URL(input),headers=new Headers(init.headers);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.match(headers.get('Authorization')??'',/^Bearer fixture-main-token-\d+$/);
  const kind=({'/account/account_summary':'profile','/KantorNearby/GetCalendar':'calendar','/Berita/GetBerita':'news','/Pengumuman/GetPengumuman':'news'})[url.pathname];if(!kind)return reject('Unexpected main fixture path');
  const call={sequence:++sequence,client:'main',kind,path:url.pathname,method:init.method,completed:false};calls.push(call);
  if(kind==='profile'){assert.equal(init.method,'POST');assert.deepEqual([...new URLSearchParams(init.body)],[['appVersion','6.1.5']]);return done(call,{error:false,data:profile});}
  if(kind==='calendar'){assert.equal(init.method,'POST');const body=new URLSearchParams(init.body);assert.deepEqual([...body.keys()].sort(),['kantorId','tahun']);assert.ok(['canonical-A','canonical-B'].includes(body.get('kantorId')));assert.match(body.get('tahun'),/^\d{4}$/);call.canonicalOffice=body.get('kantorId');return done(call,{error:false,data:[]});}
  assert.equal(init.method,'GET');return done(call,{error:false,message:[]});
 }
 async function queueTransport(input,init){
  const url=new URL(input),headers=new Headers(init.headers),relative=url.pathname.replace('/konsol/antrian/directus/','');assert.equal(url.origin,'https://aplikasi.atrbpn.go.id');assert.equal(headers.get('Authorization'),'Bearer fixture-queue-token-only');assert.equal(headers.get('User-Agent'),'Dart/Flutter');
  const kind=({'api/antrian/saya':'list','items/kantor':'offices','items/lokasi':'locations','api/antrian':'availability','api/notifikasi':'calls','api/booking/limit/':'limit','api/booking/':'create'})[relative];if(!kind)return reject('Unexpected Directus fixture path');
  const call={sequence:++sequence,client:'queue',kind,path:url.pathname,method:init.method,query:[...url.searchParams],mode,completed:false};calls.push(call);persist();
  if(kind==='create')return reject('No create expected without legitimate notification capability');
  if(kind==='limit'){
   assert.equal(init.method,'POST');assert.equal(url.search,'');assert.equal(headers.get('Content-Type'),'application/json');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body),['nik','kantorid','tanggal_booking']);assert.equal(body.nik,profile.nomorIdentitas);assert.ok(['queue-A','queue-B'].includes(body.kantorid));assert.match(body.tanggal_booking,/^\d{4}-\d{2}-\d{2}$/);call.body=body;call.bodyBytes=Buffer.byteLength(init.body);call.bodySha256=sha(Buffer.from(init.body));
   if(call.mode==='slow-quota'||call.mode==='slow-quota-401'){call.releaseReason=await wait(call);if(call.releaseReason!=='control')return done(call,{error:true,message:'Kuota SINTETIS timeout'},503);}
   if(call.mode==='slow-quota-401')return done(call,{error:true,message:'Kuota SINTETIS sesi ditolak'},401);
   const error=call.mode==='service-error',message=error?'Gangguan kuota SINTETIS':call.mode==='empty-message'?'':null;
   return done(call,{error,message,data:error?null:{is_available:!['quota-false','empty-message'].includes(call.mode),jumlah_antrian:2}});
  }
  assert.equal(init.method,'GET');assert.equal(init.body,undefined);
  if(kind==='list'||kind==='calls')return done(call,{error:false,data:[]});
  if(kind==='offices'){assert.equal(url.search,'?limit=1000&sort=nama');return done(call,{error:true,data:offices});}
  if(kind==='locations'){const id=url.searchParams.get('filter[kantor]');assert.ok(['queue-A','queue-B'].includes(id));return done(call,{data:[{id:id==='queue-A'?'loc-A':'loc-B',kantor:id,nama:id==='queue-A'?'Lokasi SINTETIS A':'Lokasi SINTETIS B',alamat:'Alamat SINTETIS'}]});}
  assert.ok(['loc-A','loc-B'].includes(url.searchParams.get('lokasi')));assert.match(url.searchParams.get('tanggal'),/^\d{4}-\d{2}-\d{2}$/);
  const first={...loket,...(call.mode==='full'?{estimasi_message:'Loket SINTETIS not full <b>teks literal</b>'}:{}),...(call.mode==='closed'?{jam_tutup:'2000-01-01 00:00:00'}:{})};
  const rows=[first,{...loket,id:'loket-B',nama:'Loket SINTETIS tidak tersedia',status:0,is_available:0,jumlah_antrian:0,nomor:'004'},{...loket,id:'loket-A',nama:'<img src=x onerror="fixtureOnly()"> LOKET SINTETIS',deskripsi:'<script>fixtureOnly()</script>',estimasi_message:'Estimasi <b>SINTETIS</b>'}];
  call.responseRows=rows;if(call.mode==='slow-availability'){call.releaseReason=await wait(call);if(call.releaseReason!=='control')return done(call,{error:true,message:'Ketersediaan SINTETIS timeout'},503);}
  return done(call,{error:false,data:rows});
 }
 const guarded=transport=>async(url,init)=>{try{return await transport(url,init);}catch(error){unexpected++;const call=calls.at(-1);if(call){call.fixtureRejected=true;call.fixtureError=String(error.message).slice(0,220);}persist();throw error;}};
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'ANTRIAN SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-app-only',queueAuthorization:()=> 'Bearer fixture-queue-token-only',calendarOfficeId:()=>reject('Queue calendar must use returned canonical ID directly')};
 const prohibited=async()=>reject('Non-queue provider prohibited');
 const api=createApiHandler({configuration,registry,sessions,transport:guarded(mainTransport),queueTransport:guarded(queueTransport),guestbookTransport:prohibited,bhumiTransport:prohibited,log:entry=>{logs.push(entry);persist();}});
 const json=(res,value,statusCode=200)=>{res.writeHead(statusCode,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 async function controlBody(req){assert.equal(req.headers.origin,origin);let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<180000);}const value=JSON.parse(text||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function send(res,route,file,transform){const source=pin(file),raw=bytes(file),content=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,servedSha256:sha(content),sourceBytes:raw.length,servedBytes:content.length,transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(content);persist();}
 function stop(reason='explicit'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});persist();server.close(()=>{listenerClosed=true;api.close();persist();console.log('Queue booking fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){json(res,status());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await controlBody(req);
    if(route==='/fixture/mode'){assert.deepEqual(Object.keys(value),['mode']);assert.ok(MODES.includes(value.mode));mode=value.mode;controls.push({sequence:++sequence,action:'mode',mode});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/new-session'){assert.deepEqual(value,{});for(const id of [...sessions.sessions.keys()])sessions.delete(id);authenticateNext=true;controls.push({sequence:++sequence,action:'new-synthetic-session'});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<250);observations.push(value);}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);assert.equal(value.hasChild,false);json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,status());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/queue-booking-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#queue-booking-fixture{margin:14px 14px 110px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 28px);box-sizing:border-box}#queue-booking-fixture h2{font-size:16px}#queue-booking-fixture button,#queue-booking-fixture a,#queue-booking-fixture select{padding:7px;margin:4px;font:inherit;max-width:100%}#queue-booking-fixture-status{white-space:pre-wrap;max-height:260px;overflow:auto}@media(min-width:761px){body>#queue-booking-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   if(route.startsWith('/api/')&&req.method==='POST'){
    const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);let body;try{body=JSON.parse(raw.toString('utf8'));}catch{}browserRequests.push({sequence:++sequence,route,body,bodyBytes:raw.length,bodySha256:sha(raw)});persist();};
   }
   if(await api.handle(req,res,route))return;
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>{const tag='<script type="module" src="app.js"></script>';assert.equal(html.split(tag).length,2);assert.equal(html.split('</head>').length,2);return html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace(tag,'<script type="module" src="/fixture/page.js"></script>'+tag);});return;}
   const source=statics.get(route);if(!source){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(ROOT,source.file)).startsWith(fs.realpathSync(path.join(ROOT,'webapp'))+path.sep));send(res,route,source.file);
  }catch(error){unexpected++;persist();console.error('Queue booking fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'QUEUE_BOOKING_FIXTURE_REJECTED',message:'Synthetic queue request rejected.'}},400);else res.end();}
 });
 return {origin,port,output,server,status,start:async()=>{assert.equal(started,false);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return status();},stop};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4222),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createQueueBookingBrowserFixture({port,suffix});await fixture.start();console.log('Queue booking synthetic browser '+fixture.origin+'/#/queue');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
 if(!process.stdin.isTTY){process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop')fixture.stop('session-stdin');});process.stdin.unref?.();}
}
