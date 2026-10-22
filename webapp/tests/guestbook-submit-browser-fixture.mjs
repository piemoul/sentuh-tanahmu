// Import is inert. Explicit factory/start requires the passed full Node freeze.
// Actual app, handler, SessionStore, registry and standalone guestbook clients;
// only transports are synthetic. No provider, QR scanner or hardware access.
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
const bytes=file=>fs.readFileSync(path.join(ROOT,file)),sha=value=>createHash('sha256').update(value).digest('hex');
const PASSWORD='synthetic-only-not-a-real-password';
const IDS={profile:'post-account-account-summary-d2939c',read:'get-bukutamu-d28bf4',post:'post-bukutamu-d99dd8'};
const POST_MODES=['accepted','plaininvalidjson','empty','anyjson','known201','malformed','oversize','truncated','drop','hold','late401'];
const READ_MODES=['normal','null','errortrue-valid','malformed','hold','echo-ids','null-ids'];
const PARTS=['kantorId','unitKerjaId','userId','nik','alamat','namaLengkap','tempatLahir','tanggalLahir','noTelp','email','instansi','keperluan'];
const VALUE_KEYS=['contextId','name','nik','phone','birthDate','birthPlace','address','email','institution','purpose'];
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'none'; connect-src 'self'; font-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
function multipart(raw,type){
 const match=/^multipart\/form-data; boundary=(--dio-boundary-\d{10})$/.exec(type??'');assert.ok(match);const boundary=match[1];
 const open=Buffer.from('--'+boundary+'\r\n'),divide=Buffer.from('\r\n--'+boundary),close=Buffer.from('--'+boundary+'--\r\n');
 assert.ok(raw.subarray(0,open.length).equals(open));assert.ok(raw.subarray(-close.length).equals(close));
 const parts=[];let cursor=open.length;
 while(cursor<raw.length){const headerEnd=raw.indexOf('\r\n\r\n',cursor),valueEnd=raw.indexOf(divide,headerEnd+4);assert.ok(headerEnd>=cursor&&valueEnd>=headerEnd+4);
  const header=raw.subarray(cursor,headerEnd).toString('utf8'),match=/^content-disposition: form-data; name="([^"\r\n]+)"$/.exec(header);assert.ok(match,'Exact scalar disposition; no file or per-part headers');
  const value=raw.subarray(headerEnd+4,valueEnd);parts.push({name:match[1],headers:header,bytes:value.length,sha256:sha(value),value:new TextDecoder('utf8',{fatal:true}).decode(value)});
  const next=valueEnd+divide.length;if(raw.subarray(next,next+4).toString()==='--\r\n'){assert.equal(next+4,raw.length);break;}assert.equal(raw.subarray(next,next+2).toString(),'\r\n');cursor=next+2;
 }
 assert.deepEqual(parts.map(row=>row.name),PARTS);return {boundary,parts,closingBoundary:true};
}

export function createGuestbookSubmitBrowserFixture({port=4226,suffix='initial',runtimeReceipt='analysis/webapp/guestbook-submit-node-final.json'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const proof=JSON.parse(bytes(runtimeReceipt));assert.equal(proof.passed,true);assert.equal(proof.runtimeCount,141);assert.equal(proof.fail,0);assert.ok(proof.tests>2423);
 const origin='http://localhost:'+port,output=`analysis/webapp/guestbook-submit-browser-transport-${suffix}.json`;assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve prior receipt');
 const inputs=new Map(),runtime=new Set(),statics=new Map(),served=new Map(),calls=[],requests=[],controls=[],observations=[],logs=[],held=new Map(),scope=new AsyncLocalStorage();
 const pin=file=>{const row={file,sha256:sha(bytes(file))};if(inputs.has(file))assert.equal(inputs.get(file).sha256,row.sha256,'Frozen source changed '+file);else inputs.set(file,row);return row;};
 for(const row of proof.runtime){assert.equal(sha(bytes(row.file)),row.sha256,'Node-frozen runtime changed '+row.file);runtime.add(row.file);pin(row.file);}assert.equal(runtime.size,141);
 function inventory(folder){for(const entry of fs.readdirSync(path.join(ROOT,folder),{withFileTypes:true})){assert.equal(entry.isSymbolicLink(),false);const file=folder+'/'+entry.name;if(entry.isDirectory())inventory(file);else statics.set('/'+file.slice(7),file);}}
 inventory('webapp/assets');for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name))statics.set('/'+entry.name,'webapp/'+entry.name);
 for(const file of [...statics.values(),runtimeReceipt,'webapp/tests/guestbook-submit-browser-fixture.mjs','webapp/tests/guestbook-submit-browser-page.mjs','analysis/GUESTBOOK-SUBMIT-FOLLOWUP-20261022.md','analysis/recovered/guestbook-submit-followup-20261022/flow.json'])pin(file);
 const stable=()=>{for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Frozen source changed '+row.file);};
 const catalog=operations.getPublicCatalog();assert.equal(catalog.length,176);assert.equal(catalog.filter(row=>row.enabled).length,94);assert.ok(catalog.find(row=>row.id===IDS.post&&row.clientProfile==='guestbook-post')?.enabled);
 const allowed=new Set([...Object.values(IDS),...catalog.filter(row=>['Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(row.endpoint)).map(row=>row.id)]);
 let started=false,stopped=false,listenerClosed=false,sequence=0,generation=0,dataGeneration=1,now=Date.UTC(2026,9,22,12),postMode='accepted',readMode='normal',unexpected=0;
 const sessions=new SessionStore({now:()=>now});
 const summary=()=>({origin,port,suffix,started,stopped,listenerClosed,sequence,generation,dataGeneration,now,postMode,readMode,unexpected,held:[...held.keys()],authenticated:[...sessions.sessions.values()].some(session=>!!session.tokens&&!!session.user),requests:[...requests],calls:[...calls],controls:[...controls],observationCount:observations.length,syntheticGuestbookReads:calls.filter(row=>row.kind==='guestbook-read').length,syntheticGuestbookPosts:calls.filter(row=>row.kind==='guestbook-post').length});
 function persist(){if(!started)return;fs.writeFileSync(path.join(ROOT,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Actual frozen app, guestbook modules, createApiHandler, SessionStore, registry, GuestbookClient and GuestbookPostClient. Injected fixed standalone transport and synthetic account transport only. No product fetch/timer/handler/hardware monkeypatch; controls require explicit browser action. No automatic POST.',runtimeCount:runtime.size,runtime:[...runtime].map(file=>inputs.get(file)),inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'Insert fixture helper and stylesheet tags only'}],fixtureCsp:CSP,modes:{post:POST_MODES,read:READ_MODES},catalogCount:176,enabled:94,...summary(),observations,logs,providerRequests:0,productionRequests:0,productionWrites:0,realIdentitySubmissions:0,otpRequests:0,fcmRequests:0,hardwarePermissionGrants:0,hardwarePermissionAttempts:'Not instrumented; no product hardware API monkeypatch. Use the manual synthetic QR input.',hardwareBoundary:'Permissions-Policy denies camera, microphone and geolocation. Helper never invokes these APIs. All QR strings and identity values are synthetic test data.'},null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 const reject=message=>{unexpected++;persist();throw Error(message);};
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>allowed.has(id)?operations.prepareOperation(id,values,context):reject('Operation outside synthetic guestbook scope')};
 function release(reason='control'){const ids=[...held.keys()];for(const finish of [...held.values()])finish(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 function wait(call){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);call.releaseReason='fixture-hold-timeout';resolve();},45000);timer.unref();held.set(call.sequence,reason=>{clearTimeout(timer);held.delete(call.sequence);call.releaseReason=reason;resolve();});persist();});}
 function done(call,value,status=200,{raw=false,type=TYPES['.json'],headers={}}={}){const body=raw?Buffer.from(value):Buffer.from(JSON.stringify(value));Object.assign(call,{completed:true,completedSequence:++sequence,status,responseBytes:body.length,responseSha256:sha(body)});persist();return new Response(body,{status,headers:{'Content-Type':type,...headers}});}
 const lookup=mode=>mode==='null-ids'?{userId:null,kantorId:null,unitKerjaId:null,namaUnitKerja:'UNIT SINTETIS NULL'}:mode==='echo-ids'?{userId:'AtrBpn fixture-guestbook-application',kantorId:'fixture-guestbook-account-'+generation,unitKerjaId:'fixture-guestbook-application',namaUnitKerja:'UNIT SINTETIS PRIVAT'}:{userId:' USER SINTETIS '+dataGeneration+' ',kantorId:' OFFICE SINTETIS '+dataGeneration+' ',unitKerjaId:' UNIT SINTETIS '+dataGeneration+' ',namaUnitKerja:'UNIT <img src=x onerror="syntheticOnly()"> SINTETIS '+dataGeneration};
 async function mainTransport(input,init){
  const url=new URL(input),headers=new Headers(init.headers),context=scope.getStore()??{};assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  const kind=({'/auth/signin':'signin','/account/account_summary':'profile','/Berita/GetBerita':'news','/Pengumuman/GetPengumuman':'news'})[url.pathname];if(!kind)return reject('Unexpected synthetic main path '+url.pathname);
  const call={sequence:++sequence,kind,path:url.pathname,method:init.method,requestSequence:context.sequence??null,completed:false};calls.push(call);assert.ok(calls.length<=600);persist();
  if(kind==='signin'){assert.equal(headers.get('Authorization'),'AtrBpn fixture-guestbook-application');assert.equal(init.method,'POST');const form=new URLSearchParams(init.body);assert.deepEqual([...form.keys()],['devicePlatform','username','password']);assert.equal(form.get('devicePlatform'),'android');assert.equal(form.get('password'),PASSWORD);assert.match(form.get('username'),/^guestbook-submit-[AB]$/);generation++;call.generation=generation;call.username=form.get('username');return done(call,{error:false,data:{username:form.get('username'),email:'synthetic@example.invalid',nomorIndukKependudukan:'0000000000000000',userLevel:2,isParticipatoryMapper:false,roleUser:'PERORANGAN',token:{tokenType:'Bearer',accessToken:'fixture-guestbook-account-'+generation,refreshToken:null,expiredAt:null}}});}
  if(kind==='news'){assert.equal(init.method,'GET');return done(call,{error:false,message:[]});}
  const token=/^Bearer fixture-guestbook-account-(\d+)$/.exec(headers.get('Authorization')??'');assert.ok(token);call.authorizationGeneration=Number(token[1]);assert.equal(init.method,'POST');assert.deepEqual([...new URLSearchParams(init.body)],[['appVersion','6.1.5']]);return done(call,{error:false,data:{userId:'SYNTHETIC-USER',nama:'PEMILIK SINTETIS',nomorIdentitas:'0000000000000000',userLevel:2,isIkd:false,statusVerifikasi:1,roleUser:'PERORANGAN',nomorHp:'0000000000',email:'synthetic@example.invalid',readyToReview:false}});
 }
 async function standaloneTransport(input,init){
  const url=new URL(input),headers=new Headers(init.headers),context=scope.getStore()??{};assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(url.pathname,'/bukutamu');assert.equal(init.redirect,'manual');assert.equal(headers.get('Authorization'),'AtrBpn fixture-guestbook-application');assert.equal(headers.get('Accept'),null);
  const kind=init.method==='GET'?'guestbook-read':'guestbook-post',call={sequence:++sequence,kind,path:url.pathname,method:init.method,requestSequence:context.sequence??null,applicationAuthorization:true,accountBearer:false,completed:false};calls.push(call);assert.ok(calls.length<=600);persist();
  if(init.method==='GET'){
   assert.deepEqual(Object.keys(init.headers),['Authorization']);assert.equal(init.body,undefined);assert.deepEqual([...url.searchParams.keys()],['uid','unid']);assert.match(url.searchParams.get('uid'),/^SYNTHETIC-UID-\d+$/);assert.match(url.searchParams.get('unid'),/^SYNTHETIC-UNIT-\d+$/);call.readMode=readMode;call.query=[...url.searchParams];call.lookup=lookup(readMode);if(readMode==='hold')await wait(call);
   if(call.readMode==='malformed')return done(call,{error:false,data:{...source(),userId:7}});
   return done(call,{error:call.readMode==='errortrue-valid',message:null,data:call.readMode==='null'?null:call.lookup});
  }
  assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof Uint8Array);const raw=Buffer.from(init.body),parsed=multipart(raw,headers.get('Content-Type'));
  const request=requests.find(row=>row.sequence===context.sequence);assert.deepEqual(Object.keys(request?.values??{}).sort(),[...VALUE_KEYS].sort());assert.equal(request.confirm,true);
  const values=Object.fromEntries(parsed.parts.map(row=>[row.name,row.value]));const mapping={nik:'nik',alamat:'address',namaLengkap:'name',tempatLahir:'birthPlace',tanggalLahir:'birthDate',noTelp:'phone',email:'email',instansi:'institution',keperluan:'purpose'};
  for(const [wire,key]of Object.entries(mapping)){assert.equal(values[wire],request.values[key]);assert.equal(parsed.parts.find(row=>row.name===wire).sha256,sha(Buffer.from(request.values[key],'utf8')),'Original raw UTF8/LF preserved');}
  const readRequest=requests.find(row=>row.guestbookContextId===request.values.contextId),previous=calls.find(row=>row.kind==='guestbook-read'&&row.requestSequence===readRequest?.sequence);assert.ok(previous,'POST is bound to the exact original local lookup context, not latest global read');for(const key of ['kantorId','unitKerjaId','userId'])assert.equal(values[key],previous.lookup[key]??'');call.sourceReadSequence=previous.sequence;
  call.postMode=postMode;call.bodyBytes=raw.length;call.bodySha256=sha(raw);call.contentType=headers.get('Content-Type');call.multipart=parsed;call.headerMeasurement='Injected before standalone HTTPS transport; native encoded bytes inspected, not actual TLS/HTTP packet capture.';persist();
  if(call.postMode==='hold'||call.postMode==='late401')await wait(call);
  if(call.postMode==='late401')return done(call,{error:false},401);
  if(call.postMode==='drop'){call.completed=true;call.completedSequence=++sequence;call.syntheticError='AFTER_HANDOFF_DROP';persist();throw Error('Synthetic standalone drop after handoff');}
  if(call.postMode==='plaininvalidjson')return done(call,'{bad JSON SINTETIS',200,{raw:true,type:'text/plain'});
  if(call.postMode==='empty')return done(call,'',200,{raw:true});
  if(call.postMode==='anyjson')return done(call,[false,null,42,'SINTETIS']);
  if(call.postMode==='known201')return done(call,{error:false},201);
  if(call.postMode==='malformed')return done(call,'{"error":',200,{raw:true});
  if(call.postMode==='oversize')return done(call,'{}',200,{raw:true,headers:{'Content-Length':String(20*1024*1024+1)}});
  if(call.postMode==='truncated')return done(call,'{}',200,{raw:true,headers:{'Content-Length':'3'}});
  return done(call,{error:true,message:'BODY BISNIS DIABAIKAN SINTETIS'});
 }
 function source(){return lookup('normal');}
 const checked=transport=>async(...args)=>{try{return await transport(...args);}catch(error){if(error?.code==='ERR_ASSERTION'){unexpected++;controls.push({sequence:++sequence,action:'wire-assertion-failed',message:error.message.slice(0,400)});persist();}throw error;}};
 const prohibited=async()=>reject('Other synthetic provider prohibited');
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'BUKU TAMU SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-guestbook-application',queueAuthorization:()=> 'Bearer fixture-queue-only'};
 const api=createApiHandler({configuration,registry,sessions,now:()=>now,guestbookNow:()=>now,transport:checked(mainTransport),guestbookTransport:checked(standaloneTransport),guestbookPostTransport:checked(standaloneTransport),queueTransport:prohibited,bhumiTransport:prohibited,log:entry=>{assert.ok(logs.length<1500);logs.push(entry);persist();}});
 const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 async function controlBody(req){assert.equal(req.headers.origin,origin);let raw='';for await(const chunk of req){raw+=chunk;assert.ok(raw.length<60000);}const value=JSON.parse(raw||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function send(res,route,file,transform){const source=pin(file),raw=bytes(file),body=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,servedSha256:sha(body),sourceBytes:raw.length,servedBytes:body.length,transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(body);persist();}
 function stop(reason='explicit'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});stable();persist();server.close(()=>{listenerClosed=true;api.close();persist();console.log('Guestbook Submit fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){stable();json(res,summary());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await controlBody(req);
    if(route==='/fixture/configure'){assert.deepEqual(Object.keys(value).sort(),['postMode','readMode']);assert.ok(POST_MODES.includes(value.postMode)&&READ_MODES.includes(value.readMode));({postMode,readMode}=value);controls.push({sequence:++sequence,action:'configure',postMode,readMode});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/advance'){assert.deepEqual(Object.keys(value),['milliseconds']);assert.ok(Number.isSafeInteger(value.milliseconds)&&value.milliseconds>=0&&value.milliseconds<=31*60000);now+=value.milliseconds;controls.push({sequence:++sequence,action:'advance',milliseconds:value.milliseconds,now});}
    else if(route==='/fixture/new-data'){assert.deepEqual(value,{});dataGeneration++;controls.push({sequence:++sequence,action:'new-synthetic-data',dataGeneration});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<400);assert.ok(typeof value.label==='string'&&value.label.length<=100);observations.push({...value,receiptSequence:++sequence,receivedAt:new Date().toISOString(),requestSequenceAtReceipt:requests.at(-1)?.sequence??null,upstreamSequenceAtReceipt:calls.at(-1)?.sequence??null});}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);assert.equal(value.hasForm,false);json(res,{stopping:true});setImmediate(()=>stop('visible-stop-after-form-exit'));return;}
    else throw Error('Unknown fixture control');persist();json(res,summary());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/guestbook-submit-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#guestbook-submit-fixture{margin:14px 14px 100px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;max-width:calc(100% - 28px);box-sizing:border-box;overflow-wrap:anywhere}#guestbook-submit-fixture h2{font-size:16px}#guestbook-submit-fixture label{display:inline-flex;gap:5px;align-items:center;flex-wrap:wrap}#guestbook-submit-fixture button,#guestbook-submit-fixture input,#guestbook-submit-fixture select,#guestbook-submit-fixture a{margin:4px;padding:6px;max-width:100%;font:inherit}#guestbook-submit-fixture-status{white-space:pre-wrap}@media(min-width:761px){body>#guestbook-submit-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   if(route.startsWith('/api/')){
    assert.ok(requests.length<1500);const before=sessions.sessions.get(readSessionId(req.headers.cookie)),request={sequence:++sequence,route,method:req.method,authenticatedBefore:!!before?.tokens,sessionGenerationBefore:before?.user?.username??null,completed:false};requests.push(request);
    const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);request.bodyBytes=raw.length;try{const body=JSON.parse(raw.toString('utf8'));request.bodyKeys=Object.keys(body);if(route==='/api/login'){assert.equal(body.password,PASSWORD);request.username=body.username;}if(route==='/api/execute'){request.operationId=body.operationId;request.values=body.values;request.confirm=body.confirm===true;}}catch(error){if(error?.code==='ERR_ASSERTION')throw error;request.bodyInvalidJson=true;}persist();};
    const end=res.end.bind(res);res.end=(chunk,...args)=>{const raw=chunk==null?Buffer.alloc(0):Buffer.from(chunk);let body;try{body=JSON.parse(raw.toString('utf8'));}catch{}Object.assign(request,{completed:true,completedSequence:++sequence,status:res.statusCode,responseCode:body?.error?.code??null,responseDelivery:body?.result?.delivery??body?.error?.details?.delivery??null,resultData:request.operationId===IDS.post?body?.result?.data??null:null,responseBytes:raw.length,responseSha256:sha(raw),hasGuestbookContext:typeof body?.result?.guestbookContextId==='string',guestbookContextId:body?.result?.guestbookContextId??null});persist();return end(chunk,...args);};
    persist();if(await scope.run({sequence:request.sequence,route},()=>api.handle(req,res,route)))return;
   }
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>{const app='<script type="module" src="app.js"></script>';assert.equal(html.split(app).length,2);return html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace(app,'<script type="module" src="/fixture/page.js"></script>'+app);});return;}
   const file=statics.get(route);if(!file){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(ROOT,file)).startsWith(fs.realpathSync(path.join(ROOT,'webapp'))+path.sep));send(res,route,file);
  }catch(error){unexpected++;persist();console.error('Guestbook Submit fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'GUESTBOOK_SUBMIT_FIXTURE_REJECTED',message:'Synthetic request rejected.'}},400);else res.end();}
 });
 return {origin,port,output,server,status:summary,start:async()=>{assert.equal(started,false);stable();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return summary();},stop};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4226),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial',runtimeReceipt=process.argv.find(value=>value.startsWith('--runtime-receipt='))?.slice(18)??'analysis/webapp/guestbook-submit-node-final.json';
 const fixture=createGuestbookSubmitBrowserFixture({port,suffix,runtimeReceipt});await fixture.start();console.log('Guestbook Submit synthetic browser '+fixture.origin+'/#/account');for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
 if(!process.stdin.isTTY){process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')fixture.stop('session-stdin');});process.stdin.unref?.();}
}
