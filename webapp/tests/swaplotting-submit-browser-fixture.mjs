// Import is inert. Start only after the parent freezes product sources.
// Actual app/handler/session/registry/staging/encoder; only upstream is synthetic.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from '../private/http-api.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const BASELINE='analysis/webapp/swaplotting-submit-runtime-baseline.json',BASELINE_SHA='3bd00656a3f9695206865758aa61eabc149221c64dc007185b79ceb25a93f72f';
const sha=value=>createHash('sha256').update(value).digest('hex'),bytes=file=>fs.readFileSync(path.join(ROOT,file));
const MODES=['upload200','upload201','upload403','upload500','malformedJSON200','stagefailure','timeout-before-dispatch','timeout-after-dispatch','slowupload','activityfalse','refreshfailure','slowactivity','slowrefresh','late401'];
const POSTS={registered:'post-apis-swaplottingterdaftar-d9f850',unregistered:'post-apis-swaplottingbelumterdaftar-da0be8'};
const KEYS={registered:['id','kluster','namapemilik','kontaktelp','kontakemail','tipehakid','tipehak','kantorid','namakantor','wilayahid','namawilayah','nomorhak','reviu','lat','lon'],unregistered:['id','kluster','namapemilik','kontaktelp','kontakemail','alamat','alashak','nomoralashak','keteranganalashak','buktipajak','nomorbuktipajak','keteranganbuktipajak','kantorid','namakantor','wilayahid','namawilayah','reviu','lat','lon']};
const profile={userId:'fixture-user',nama:'Pemilik SINTETIS <b>literal</b>',nomorIdentitas:'0000000000000000',kantorId:' raw-office-A ',userLevel:2,isIkd:false,roleUser:'PERORANGAN',statusVerifikasi:1,nomorHp:'0000000000',email:'synthetic@example.invalid'};
const offices=[{KantorId:' raw-office-A ',Nama:'Kantor SINTETIS <b>A</b>'},{KantorId:'raw-office-B',Nama:'Kantor SINTETIS B'}];
const regions=[{WilayahId:' raw-region-A ',Nama:'Desa SINTETIS <i>A</i>'},{WilayahId:'raw-region-B',Nama:'Desa SINTETIS B'}];
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=','base64');

// Independent byte parser: no product serializer or decoder is an oracle here.
function multipart(raw,contentType){
 const match=/^multipart\/form-data; boundary=(?:"([^"\r\n]+)"|([^;\s]+))$/i.exec(contentType??'');assert.ok(match,'Expected exact multipart Content-Type');
 const boundary=match[1]??match[2],opening=Buffer.from('--'+boundary+'\r\n'),divider=Buffer.from('\r\n--'+boundary),closing=Buffer.from('--'+boundary+'--\r\n');
 assert.ok(raw.subarray(0,opening.length).equals(opening));assert.ok(raw.subarray(-closing.length).equals(closing));
 const parts=[];let offset=opening.length;
 while(offset<raw.length){const split=raw.indexOf('\r\n\r\n',offset);assert.ok(split>=offset);const headers=raw.subarray(offset,split).toString('utf8'),end=raw.indexOf(divider,split+4);assert.ok(end>=split+4);const value=raw.subarray(split+4,end);
  const disposition=/^content-disposition: form-data; name="([^"\r\n]*)"(?:; filename="([^"\r\n]*)")?$/im.exec(headers);assert.ok(disposition);const mime=/^content-type: ([^\r\n]+)$/im.exec(headers)?.[1]??null;
  parts.push({name:disposition[1],filename:disposition[2]??null,contentType:mime,headers,byteLength:value.length,sha256:sha(value),...(disposition[2]===undefined?{value:new TextDecoder('utf8',{fatal:true}).decode(value)}:{})});
  const suffix=end+divider.length;if(raw.subarray(suffix,suffix+4).toString()==='--\r\n'){assert.equal(suffix+4,raw.length);break;}assert.equal(raw.subarray(suffix,suffix+2).toString(),'\r\n');offset=suffix+2;
 }
 return {boundary,closingBoundary:true,parts};
}

export function createSwaplottingSubmitBrowserFixture({port=4223,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/swaplotting-submit-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve prior receipt');assert.equal(sha(bytes(BASELINE)),BASELINE_SHA);
 const baseline=JSON.parse(bytes(BASELINE));assert.equal(baseline.passed,true);assert.equal(baseline.runtimeCount,129);
 const inputs=new Map(),statics=new Map(),served=new Map(),calls=[],browserRequests=[],controls=[],observations=[],logs=[],held=new Map(),scope=new AsyncLocalStorage();
 let started=false,stopped=false,listenerClosed=false,sequence=0,unexpected=0,generation=0,authenticateNext=true,mode='upload200',tileRequests=0;
 const pin=file=>{const row={file,sha256:sha(bytes(file))};if(inputs.has(file))assert.equal(inputs.get(file).sha256,row.sha256,'Source changed '+file);else inputs.set(file,row);return row;};
 const runtime=new Set(baseline.runtime.map(row=>row.file));
 function inventory(folder){for(const entry of fs.readdirSync(path.join(ROOT,folder),{withFileTypes:true})){assert.equal(entry.isSymbolicLink(),false);const file=folder+'/'+entry.name;if(entry.isDirectory())inventory(file);else if(entry.isFile()){if(/\.(?:mjs|js)$/.test(entry.name)&&!file.startsWith('webapp/assets/vendor/'))runtime.add(file);if(folder==='webapp/assets'||folder.startsWith('webapp/assets/'))statics.set('/'+file.slice(7),pin(file));}}}
 inventory('webapp/private');inventory('webapp/assets');for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;statics.set('/'+entry.name,pin(file));}
 for(const file of [...runtime,BASELINE,'webapp/tests/swaplotting-submit-browser-fixture.mjs','webapp/tests/swaplotting-submit-browser-page.mjs'])pin(file);
 const catalog=operations.getPublicCatalog();assert.equal(catalog.length,176);
 for(const id of Object.values(POSTS)){const op=catalog.find(row=>row.id===id);assert.ok(op?.enabled&&op.requiresConfirmation&&op.effect==='write','Freeze and enable actual bounded submit before starting fixture');}
 const allowed=new Set([...Object.values(POSTS),'post-account-account-summary-d2939c','get-map-getdisclaimer-d29ef0','get-legacy-kantah-d10364','get-legacy-wilayah-d752bc',...catalog.filter(row=>['activity/GetUserActivity','Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(row.endpoint)).map(row=>row.id)]);
 const reject=message=>{unexpected++;persist();throw Error(message);};
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!allowed.has(id))return reject('Operation outside personal Swaplotting fixture scope');return operations.prepareOperation(id,values,context);}};
 const sessions=new SessionStore(),create=sessions.create.bind(sessions);
 sessions.create=()=>{const session=create();if(authenticateNext){authenticateNext=false;generation++;session.user={username:'swaplotting-SYNTHETIC-'+generation,nama:profile.nama,userLevel:2,roleUser:'PERORANGAN',nomorIndukKependudukan:profile.nomorIdentitas};session.tokens={tokenType:'Bearer',accessToken:'fixture-main-token-'+generation,refreshToken:null,expiredAt:4e9};}return session;};
 const status=()=>({origin,port,suffix,started,stopped,listenerClosed,sequence,generation,mode,tileRequests,authenticated:[...sessions.sessions.values()].some(row=>!!row.user&&!!row.tokens),calls:[...calls],browserRequests:[...browserRequests],controls:[...controls],observations:observations.length,held:[...held.keys()],unexpected,syntheticUploadRequests:calls.filter(row=>row.kind==='upload').length,syntheticActivityRequests:calls.filter(row=>row.kind==='activity').length,syntheticRefreshRequests:calls.filter(row=>row.kind==='refresh').length});
 function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input changed '+row.file);}
 function persist(){if(!started)return;stable();const data={schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Byte-exact product app/modules with actual handler, staging, session, registry, ApiClient encoder and decoder. Upstream main transport/session are synthetic; fixture helper alone installs canvas media and redirects shipped Leaflet tile URLs to local pixels. No BPN, OSM, device, OTP, FCM, real account or actual upload.',baseline:pin(BASELINE),runtime:[...runtime].map(pin),runtimeCount:runtime.size,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'insert fixture Leaflet/helper/stylesheet tags only; product script unchanged'}],fixtureCsp:CSP,catalogCount:catalog.length,enabled:catalog.filter(row=>row.enabled).length,modes:MODES,profile,offices,regions,...status(),observations,logs,providerRequests:0,productionRequests:0,productionWrites:0,actualUploads:0,identitySubmissions:0,otpRequests:0,fcmRequests:0,hardwarePermissionRequests:0};fs.writeFileSync(path.join(ROOT,output),JSON.stringify(data,null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 function release(reason='control'){const ids=[...held.keys()];for(const finish of [...held.values()])finish(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 async function wait(call){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('fixture-hold-timeout');},60_000);timer.unref();held.set(call.sequence,reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);});persist();});}
 function done(call,value,statusCode=200,{raw=false,type='application/json; charset=utf-8'}={}){const wire=raw?Buffer.from(value):Buffer.from(JSON.stringify(value));Object.assign(call,{completed:true,completedSequence:++sequence,status:statusCode,responseBytes:wire.length,responseSha256:sha(wire)});persist();return new Response(wire,{status:statusCode,headers:{'Content-Type':type}});}
 function timeout(call){Object.assign(call,{completed:true,completedSequence:++sequence,syntheticError:'REQUEST_TIMEOUT'});persist();throw Object.assign(new Error('Synthetic transport timeout'),{name:'TimeoutError',code:'REQUEST_TIMEOUT'});}
 async function transport(input,init){
  const url=new URL(input),headers=new Headers(init.headers),context=scope.getStore()??{},modeAtRequest=context.mode??mode;
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');const token=/^Bearer fixture-main-token-(\d+)$/.exec(headers.get('Authorization')??'');assert.ok(token,'Only synthetic session authorization');
  const kind=({'/account/account_summary':'profile','/Map/GetDisclaimer':'disclaimer','/legacy/Kantah':'offices','/legacy/Wilayah':'regions','/apis/SwaplottingTerdaftar':'upload','/apis/SwaplottingBelumTerdaftar':'upload','/activity/AddUserActivity':'activity','/activity/GetUserActivity':'refresh','/Berita/GetBerita':'news','/Pengumuman/GetPengumuman':'news'})[url.pathname];if(!kind)return reject('Unexpected main path '+url.pathname);
  const call={sequence:++sequence,kind,path:url.pathname,method:init.method,query:[...url.searchParams],mode:modeAtRequest,requestRoute:context.route??null,requestSequence:context.sequence??null,authorizationGeneration:Number(token[1]),completed:false};calls.push(call);persist();
  if(kind==='profile'){
   assert.equal(init.method,'POST');assert.deepEqual([...new URLSearchParams(init.body)],[['appVersion','6.1.5']]);
   if(context.route==='/api/execute'&&Object.values(POSTS).includes(context.body?.operationId)&&modeAtRequest==='timeout-before-dispatch')return timeout(call);
   return done(call,{error:false,data:{...profile,...(modeAtRequest==='stagefailure'&&context.route==='/api/swaplotting/review'?{email:'changed@example.invalid'}:{})}});
  }
  if(kind==='disclaimer'){assert.equal(init.method,'GET');assert.equal(url.search,'');return done(call,{message:'Ketentuan SINTETIS <b>teks literal</b>',message2:'Hanya fixture lokal; bukan dokumen atau kunjungan asli.',message3:null,url:null});}
  if(kind==='offices'){assert.equal(init.method,'GET');assert.deepEqual([...url.searchParams],[['nama',''],['tipeKantor','']]);return done(call,offices);}
  if(kind==='regions'){assert.equal(init.method,'GET');assert.ok(offices.some(row=>row.KantorId===url.searchParams.get('kantorid')));assert.equal(url.searchParams.get('nama'),'');return done(call,regions);}
  if(kind==='news'){assert.equal(init.method,'GET');return done(call,{error:false,message:[]});}
  if(kind==='refresh'){assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);if(modeAtRequest==='slowrefresh')call.releaseReason=await wait(call);if(modeAtRequest==='refreshfailure')return done(call,{error:true,message:'Refresh SINTETIS gagal'},503);return done(call,{error:false,data:[]});}
  assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof Uint8Array);const body=Buffer.from(init.body);if(headers.has('Content-Length'))assert.equal(headers.get('Content-Length'),String(body.length));
  call.bodyBytes=body.length;call.bodySha256=sha(body);call.contentType=headers.get('Content-Type');call.contentLengthAtInjectedTransport=headers.get('Content-Length');call.computedExpectedContentLength=String(body.length);call.httpHeaderMeasurement='Injected before createHttpsTransport, which assigns the final content-length; this fixture measures encoded bytes, not a real HTTP/TLS write.';call.accept=headers.get('Accept');call.multipart=multipart(body,call.contentType);
  const scalars=call.multipart.parts.filter(part=>part.filename===null),files=call.multipart.parts.filter(part=>part.filename!==null);
  if(kind==='activity'){
   assert.deepEqual(scalars.map(part=>part.name),['activityType','contentId','title','subtitle','status']);assert.equal(files.length,0);const values=Object.fromEntries(scalars.map(part=>[part.name,part.value]));assert.equal(values.activityType,'Swaplotting');assert.equal(values.contentId,'');assert.equal(values.status,'sukses');
   if(modeAtRequest==='slowactivity')call.releaseReason=await wait(call);return done(call,{fixture:'business body ignored'},modeAtRequest==='activityfalse'?201:200);
  }
  const formKind=url.pathname.endsWith('BelumTerdaftar')?'unregistered':'registered';call.formKind=formKind;assert.deepEqual(scalars.map(part=>part.name),KEYS[formKind]);assert.ok(files.length>=1&&files.length<=5);
  assert.deepEqual(call.multipart.parts.map(part=>part.name),[...KEYS[formKind],...files.map(()=> 'file')]);for(const part of files){assert.equal(part.contentType,'application/octet-stream');assert.match(part.filename,/^[0-9a-f]{32}$/);assert.ok(part.byteLength>0);}
  if(modeAtRequest==='slowupload'||modeAtRequest==='late401')call.releaseReason=await wait(call);if(modeAtRequest==='timeout-after-dispatch')return timeout(call);
  if(modeAtRequest==='late401')return done(call,{error:true,message:'Sesi SINTETIS lama ditolak'},401);
  if(modeAtRequest==='malformedJSON200')return done(call,'{"fixture":',200,{raw:true});
  return done(call,{error:true,message:'Badan SINTETIS sengaja diabaikan sesuai kontrak native'},modeAtRequest==='upload201'?201:modeAtRequest==='upload403'?403:modeAtRequest==='upload500'?500:200);
 }
 const prohibited=async()=>reject('Other upstream/provider prohibited');
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SWAPLOTTING SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-app-only',queueAuthorization:()=> 'Bearer fixture-queue-only'};
 const api=createApiHandler({configuration,registry,sessions,transport,queueTransport:prohibited,guestbookTransport:prohibited,bhumiTransport:prohibited,log:entry=>{logs.push(entry);persist();}});
 const json=(res,value,statusCode=200)=>{res.writeHead(statusCode,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 async function controlBody(req){assert.equal(req.headers.origin,origin);let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<250000);}const value=JSON.parse(text||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function send(res,route,file,transform){const source=pin(file),raw=bytes(file),content=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,servedSha256:sha(content),sourceBytes:raw.length,servedBytes:content.length,transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(content);persist();}
 function stop(reason='explicit'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});persist();server.close(()=>{listenerClosed=true;api.close();persist();console.log('Swaplotting submit fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){json(res,status());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await controlBody(req);
    if(route==='/fixture/mode'){assert.deepEqual(Object.keys(value),['mode']);assert.ok(MODES.includes(value.mode));mode=value.mode;controls.push({sequence:++sequence,action:'mode',mode});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/new-session'){assert.deepEqual(value,{});for(const id of [...sessions.sessions.keys()])sessions.delete(id);authenticateNext=true;controls.push({sequence:++sequence,action:'new-synthetic-session'});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<250);observations.push(value);}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);assert.equal(value.hasChild,false);assert.equal(value.liveTracks,0);json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,status());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/swaplotting-submit-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#swaplotting-submit-fixture{margin:14px 14px 110px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 28px);box-sizing:border-box}#swaplotting-submit-fixture h2{font-size:16px}#swaplotting-submit-fixture button,#swaplotting-submit-fixture a,#swaplotting-submit-fixture select{padding:7px;margin:4px;font:inherit;max-width:100%}#swaplotting-submit-fixture-status{white-space:pre-wrap;max-height:260px;overflow:auto}@media(min-width:761px){body>#swaplotting-submit-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   if(/^\/(?:fixture\/tile|api\/maps\/bhumi)\/\d+\/\d+\/\d+\.png$/.test(route)&&req.method==='GET'){tileRequests++;res.writeHead(200,{'Content-Type':'image/png'});res.end(pixel);persist();return;}
   if(route==='/api/maps/config'&&req.method==='GET'){json(res,{provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'});return;}
   const context={route,method:req.method,mode,sequence:++sequence};
   if(route.startsWith('/api/')&&req.method==='POST'){
    const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks),type=req.headers['content-type']??'';context.bodyBytes=raw.length;context.bodySha256=sha(raw);if(type.startsWith('multipart/form-data;')){context.multipart=multipart(raw,type);const fields=context.multipart.parts.filter(part=>part.filename===null);context.body=Object.fromEntries(fields.map(part=>[part.name,part.value]));if(context.body.values)context.values=JSON.parse(context.body.values);}else{try{context.body=JSON.parse(raw.toString('utf8'));}catch{}}browserRequests.push(context);persist();};
   }
   if(await scope.run(context,()=>api.handle(req,res,route)))return;
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>{const tag='<script type="module" src="app.js"></script>';assert.equal(html.split(tag).length,2);assert.equal(html.split('</head>').length,2);return html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace(tag,'<script src="/assets/vendor/leaflet/leaflet.js"></script><script type="module" src="/fixture/page.js"></script>'+tag);});return;}
   const source=statics.get(route);if(!source){res.writeHead(404);res.end();return;}send(res,route,source.file);
  }catch(error){unexpected++;persist();console.error('Swaplotting fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'SWAPLOTTING_FIXTURE_REJECTED',message:'Synthetic request rejected.'}},400);else res.end();}
 });
 return {origin,port,output,server,status,start:async()=>{assert.equal(started,false);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return status();},stop};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4223),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createSwaplottingSubmitBrowserFixture({port,suffix});await fixture.start();console.log('Personal Swaplotting synthetic browser '+fixture.origin+'/#/swaplotting');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
 if(!process.stdin.isTTY){process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop')fixture.stop('session-stdin');});process.stdin.unref?.();}
}
