// Import is inert. Start only after the root agent freezes product sources.
// Two actual app tabs share an actual SessionStore cookie. Only upstream is fake.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from '../private/http-api.mjs';
import {SessionStore,readSessionId} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const bytes=file=>fs.readFileSync(path.join(ROOT,file));
const MODES=['normal','hold-state','hold-profile','late-profile401','reject-next-csrf'];
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'none'; connect-src 'self'; font-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
const PROFILE='post-account-account-summary-d2939c';
const FIXTURE_PASSWORD='synthetic-only-not-a-real-password';

export function createSessionSyncBrowserFixture({port=4224,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/session-sync-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve previous receipt');
 // Pins are established when this exported factory is called, never at import.
 assert.ok(fs.existsSync(path.join(ROOT,'webapp/assets/session-sync.js')),'Wait for session-sync runtime freeze');
 const previous=JSON.parse(bytes('analysis/webapp/swaplotting-submit-node-fidelity.json'));
 const runtime=new Set(previous.runtime.map(row=>row.file)),inputs=new Map(),statics=new Map(),served=new Map(),calls=[],requests=[],controls=[],observations=[],logs=[],held=new Map(),scope=new AsyncLocalStorage();
 let now=Date.UTC(2026,9,21,12),sequence=0,mode='normal',generation=0,started=false,stopped=false,listenerClosed=false,unexpected=0;
 const pin=file=>{const row={file,sha256:sha(bytes(file))};if(inputs.has(file))assert.equal(row.sha256,inputs.get(file).sha256,'Frozen input changed '+file);else inputs.set(file,row);return row;};
 function inventory(folder){for(const entry of fs.readdirSync(path.join(ROOT,folder),{withFileTypes:true})){assert.equal(entry.isSymbolicLink(),false);const file=folder+'/'+entry.name;if(entry.isDirectory())inventory(file);else if(entry.isFile()){if(/\.(?:mjs|js)$/.test(file)&&!file.startsWith('webapp/assets/vendor/'))runtime.add(file);if(file.startsWith('webapp/assets/'))statics.set('/'+file.slice(7),file);}}}
 inventory('webapp/private');inventory('webapp/assets');
 for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;statics.set('/'+entry.name,file);}
 for(const file of [...runtime,'analysis/webapp/swaplotting-submit-node-fidelity.json','webapp/tests/session-sync-browser-fixture.mjs','webapp/tests/session-sync-browser-page.mjs'])pin(file);
 const stable=()=>{for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Frozen input changed '+row.file);};
 const sessions=new SessionStore({now:()=>now}),catalog=operations.getPublicCatalog();
 assert.equal(catalog.length,176);assert.equal(catalog.filter(row=>row.enabled).length,92);
 const allowed=new Set([PROFILE,...catalog.filter(row=>['Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(row.endpoint)).map(row=>row.id)]);
 const reject=message=>{unexpected++;persist();throw Error(message);};
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!allowed.has(id))return reject('Operation outside session-sync fixture scope');return operations.prepareOperation(id,values,context);}};
 const sessionRows=()=>[...sessions.sessions.values()].map(row=>({idFingerprint:sha(row.id),csrfFingerprint:sha(row.csrfToken),active:row.active,authenticated:!!row.user&&!!row.tokens,username:row.user?.username??null,created:row.created,seen:row.seen}));
 const summary=()=>({origin,port,suffix,started,stopped,listenerClosed,sequence,mode,now,generation,unexpected,sessions:sessionRows(),requests:[...requests],calls:[...calls],controls:[...controls],observations:observations.length,held:[...held.keys()]});
 function persist(){if(!started)return;fs.writeFileSync(path.join(ROOT,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Byte-exact product app and runtime. Actual createApiHandler, ApiClient, registry, SessionStore and shared HttpOnly cookie. Synthetic application sign-in, account summary and anonymous empty news only. Fixed server/session clock is a fixture adaptation, not browser or Android time parity. Existing-session state responses may be buffered after the actual handler snapshot; no bootstrap Set-Cookie response is held. One explicit CSRF fault mutates an incoming header before the actual handler. No product fetch, BroadcastChannel, focus or session state is monkey-patched.',runtime:[...runtime].map(file=>inputs.get(file)),runtimeCount:runtime.size,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'Insert fixture stylesheet and helper module tags only; actual app/module source bytes unchanged'}],fixtureCsp:CSP,catalogCount:catalog.length,enabled:catalog.filter(row=>row.enabled).length,...summary(),observations,logs,providerRequests:0,productionRequests:0,productionWrites:0,identitySubmissions:0,otpRequests:0,fcmRequests:0,hardwarePermissionGrants:0,hardwareBoundary:'Permissions-Policy denies camera, microphone and geolocation. No helper hardware API is called; attempted hardware API calls are not separately instrumented.'},null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 function release(reason='control'){const ids=[...held.keys()];for(const finish of [...held.values()])finish(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 function wait(row){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(row.sequence);row.releaseReason='fixture-hold-timeout';resolve(row.releaseReason);},60_000);timer.unref();held.set(row.sequence,reason=>{clearTimeout(timer);held.delete(row.sequence);row.releaseReason=reason;resolve(reason);});persist();});}
 function done(call,data,status=200){const body=Buffer.from(JSON.stringify(data));Object.assign(call,{completed:true,completedSequence:++sequence,status,responseBytes:body.length,responseSha256:sha(body)});persist();return new Response(body,{status,headers:{'Content-Type':TYPES['.json']}});}
 async function transport(input,init){
  const url=new URL(input),context=scope.getStore()??{},headers=new Headers(init.headers);assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  const kind=({'/auth/signin':'signin','/account/account_summary':'profile','/Berita/GetBerita':'news','/Pengumuman/GetPengumuman':'news'})[url.pathname];if(!kind)return reject('Unexpected synthetic path '+url.pathname);
  const call={sequence:++sequence,kind,path:url.pathname,method:init.method,requestSequence:context.sequence??null,completed:false};calls.push(call);persist();
  if(kind==='signin'){
   assert.equal(init.method,'POST');assert.equal(headers.get('Authorization'),'AtrBpn fixture-app-only');
   const fields=new URLSearchParams(init.body);assert.deepEqual([...fields.keys()],['devicePlatform','username','password']);assert.equal(fields.get('devicePlatform'),'android');assert.equal(fields.get('password'),FIXTURE_PASSWORD);const username=fields.get('username');assert.match(username,/^session-sync-[AB]$/);generation++;call.generation=generation;call.username=username;
   return done(call,{error:false,data:{username,email:'synthetic@example.invalid',nomorIndukKependudukan:'0000000000000000',userLevel:2,isParticipatoryMapper:false,roleUser:'PERORANGAN',token:{tokenType:'Bearer',accessToken:'fixture-session-sync-'+generation,refreshToken:null,expiredAt:null}}});
  }
  if(kind==='news'){assert.equal(init.method,'GET');return done(call,{error:false,message:[]});}
  assert.equal(init.method,'POST');assert.deepEqual([...new URLSearchParams(init.body)],[['appVersion','6.1.5']]);
  const token=/^Bearer fixture-session-sync-(\d+)$/.exec(headers.get('Authorization')??'');assert.ok(token,'Synthetic account token required');call.authorizationGeneration=Number(token[1]);
  const owner=[...sessions.sessions.values()].find(row=>row.tokens?.accessToken==='fixture-session-sync-'+token[1]);const username=owner?.user?.username??'session-sync-A';
  if(context.mode==='hold-profile'||context.mode==='late-profile401')await wait(call);
  if(context.mode==='late-profile401')return done(call,{error:true,message:'Sesi SINTETIS lama ditolak'},401);
  return done(call,{error:false,message:null,data:{userId:'synthetic-'+username,username,email:'synthetic@example.invalid',roleName:null,roleUser:'PERORANGAN',nama:'Pemilik SINTETIS '+username,nomorIdentitas:'0000000000000000',tempatLahir:'SINTETIS',tanggalLahir:'1 Januari 2000',nomorHp:'0000000000',namaKantor:null,alamatKantor:null,kantorId:null,linkedEmailIkd:null,userLevel:2,statusVerifikasi:1,isIkd:false,readyToReview:false}});
 }
 const prohibited=async()=>reject('Other upstream/provider prohibited');
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SESSION SYNC SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-app-only',queueAuthorization:()=> 'Bearer fixture-queue-only'};
 const api=createApiHandler({configuration,registry,sessions,now:()=>now,transport,queueTransport:prohibited,guestbookTransport:prohibited,bhumiTransport:prohibited,log:entry=>{logs.push(entry);persist();}});
 const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 async function controlBody(req){assert.equal(req.headers.origin,origin);let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<20000);}const value=JSON.parse(text||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function send(res,route,file,transform){const source=pin(file),raw=bytes(file),content=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,servedSha256:sha(content),sourceBytes:raw.length,servedBytes:content.length,transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(content);persist();}
 function stop(reason='explicit'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});stable();persist();server.close(()=>{listenerClosed=true;api.close();persist();console.log('Session sync fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){stable();json(res,summary());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await controlBody(req);
    if(route==='/fixture/configure'){assert.deepEqual(Object.keys(value),['mode']);assert.ok(MODES.includes(value.mode));mode=value.mode;controls.push({sequence:++sequence,action:'configure',mode});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/advance'){assert.deepEqual(Object.keys(value),['milliseconds']);assert.ok(Number.isSafeInteger(value.milliseconds)&&value.milliseconds>=0&&value.milliseconds<=9*60*60_000);now+=value.milliseconds;controls.push({sequence:++sequence,action:'advance-clock',milliseconds:value.milliseconds,now});}
    else if(route==='/fixture/expire'){assert.deepEqual(value,{});now+=31*60_000;controls.push({sequence:++sequence,action:'idle-expiration-clock',now});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<200);assert.ok(typeof value.tab==='string'&&value.tab.length<=20&&typeof value.label==='string'&&value.label.length<=100);observations.push({...value,receiptSequence:++sequence,receivedAt:new Date().toISOString(),requestSequenceAtReceipt:requests.at(-1)?.sequence??null,upstreamSequenceAtReceipt:calls.at(-1)?.sequence??null});}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);stable();json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,summary());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/session-sync-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#session-sync-fixture{margin:12px 12px 100px;padding:10px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.4 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 24px);box-sizing:border-box}#session-sync-fixture h2{font-size:15px;margin:0 0 6px}#session-sync-fixture button,#session-sync-fixture input,#session-sync-fixture select{padding:6px;margin:3px;font:inherit;max-width:100%}#session-sync-fixture-status{white-space:pre-wrap}#session-sync-fixture label{display:inline-block}@media(min-width:761px){body>#session-sync-fixture{margin-left:270px;max-width:calc(100% - 282px)}}');return;}
   if(route.startsWith('/api/')){
    const requestMode=mode,request={sequence:++sequence,route,method:req.method,mode:requestMode,bodyRead:false,completed:false};requests.push(request);const session=sessions.sessions.get(readSessionId(req.headers.cookie));request.cookieSessionFingerprint=session?sha(session.id):null;
    if(requestMode==='reject-next-csrf'&&route==='/api/execute'&&req.method==='POST'){req.headers['x-csrf-token']='synthetic-deliberately-stale';request.injectedCsrfFault=true;mode='normal';}
    else if(requestMode==='hold-state'&&route==='/api/state'&&req.method==='GET'){assert.ok(session,'Do not hold bootstrap Set-Cookie');mode='normal';request.holdState=true;}
    else if(['hold-profile','late-profile401'].includes(requestMode)&&route==='/api/execute'&&req.method==='POST')mode='normal';
    const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);request.bodyRead=true;request.bodyBytes=raw.length;try{const body=JSON.parse(raw.toString('utf8'));request.bodyKeys=Object.keys(body);if(route==='/api/login'){assert.equal(body.password,FIXTURE_PASSWORD);assert.match(body.username,/^session-sync-[AB]$/);request.username=body.username;}else if(route==='/api/execute'){request.operationId=body.operationId;request.valueKeys=Object.keys(body.values??{});}}catch(error){if(error?.code==='ERR_ASSERTION')throw error;request.bodyInvalidJson=true;}persist();};
    const originalEnd=res.end.bind(res);res.end=(chunk,...args)=>{const raw=chunk==null?Buffer.alloc(0):Buffer.from(chunk);let body;try{body=JSON.parse(raw.toString('utf8'));}catch{}request.status=res.statusCode;request.responseCode=body?.error?.code??null;request.responseAuthenticated=typeof body?.authenticated==='boolean'?body.authenticated:null;request.responseUsername=body?.user?.username??null;request.responseCsrfFingerprint=typeof body?.csrfToken==='string'?sha(body.csrfToken):null;request.responseBytes=raw.length;request.responseSha256=sha(raw);const finish=()=>{request.completed=true;request.completedSequence=++sequence;persist();return originalEnd(chunk,...args);};if(request.holdState){assert.equal(res.hasHeader('Set-Cookie'),false,'Never buffer a session cookie bootstrap');request.snapshotSequence=++sequence;wait(request).then(finish);persist();return res;}return finish();};
    persist();if(await scope.run({sequence:request.sequence,route,mode:requestMode},()=>api.handle(req,res,route)))return;
   }
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>{const tag='<script type="module" src="app.js"></script>';assert.equal(html.split(tag).length,2);return html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace(tag,'<script type="module" src="/fixture/page.js"></script>'+tag);});return;}
   const file=statics.get(route);if(!file){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(ROOT,file)).startsWith(fs.realpathSync(path.join(ROOT,'webapp'))+path.sep));send(res,route,file);
  }catch(error){unexpected++;persist();console.error('Session sync fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'SESSION_SYNC_FIXTURE_REJECTED',message:'Synthetic session-sync request rejected.'}},400);else res.end();}
 });
 return {origin,port,output,server,status:summary,start:async()=>{assert.equal(started,false);stable();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return summary();},stop};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4224),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createSessionSyncBrowserFixture({port,suffix});await fixture.start();console.log('Session sync two-tab synthetic browser '+fixture.origin+'/#/account');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
 if(!process.stdin.isTTY){process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop')fixture.stop('session-stdin');});process.stdin.unref?.();}
}
