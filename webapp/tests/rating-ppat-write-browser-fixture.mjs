// Whole actual app and HTTP handler; only session/bootstrap and upstream
// transport are synthetic. Importing starts no listener. Freeze before start.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from '../private/http-api.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const BASELINE='analysis/webapp/rating-ppat-write-baseline.json',BASELINE_SHA='ff484ffa87f84edb267b4f7ef6ea70cb9af4c38f2471ce838f36ee4f990512a9';
const bytes=file=>fs.readFileSync(path.join(ROOT,file)),sha=value=>createHash('sha256').update(value).digest('hex');
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
const RECIPES={profile:'post-account-account-summary-d2939c',akta:'get-akta-getaktalist-d1ccc4',questions:'get-ratingppat-getratingquestions-d1d6bc',post:'post-ratingppat-postratingppat-d86e10'};
const QUESTION_MODES=['normal','empty','edge','malformed','error503','hold','hold401'];
const POST_MODES=['success200','success201','native-false','missing-fields','success-missing-message','invalid-fields','plain-json','json-string','error503','transport-error','hold','hold401'];
const aktaRows=Array.from({length:6},(_,index)=>({aktaId:index===2?null:` RAW-SINTETIS-AKTA-${index} `,namaPPAT:index===2?null:index===3?'<img src=x onerror="fixtureOnly()"> PPAT SINTETIS':index===5?'PPAT SINTETIS '+('NamaPanjangTanpaSpasi'.repeat(10)):`PPAT SINTETIS ${index}`,nomor:`Akta SINTETIS ${index}`,tipe:'Akta SINTETIS',jenisPihak:'Pemohon SINTETIS',tglAkta:'RAW tanggal SINTETIS',tglLapor:'RAW laporan SINTETIS',readyToRatingPPAT:index===0?false:index===2?null:true,sertipikatAkta:index===1?[]:[{nomorHak:'HAK SINTETIS '+index,statusEl:index%2?'1':'0',wilayah:[]}]}));
const answer=(id,label,question)=>({pertanyaanRatingPPATId:id,pertanyaan:question,jawaban:label,bobot:null,nilai:'RAW STRING'});
const group=(id,label,answers)=>({pertanyaanRatingPPATId:id,kategori:null,indikator:label,jawabanRatingPPAT:answers});
function questions(mode,tag){
 if(mode==='empty')return[];
 if(mode==='edge')return[group(null,'ID grup null '+tag,[answer('ignored','Tidak dapat dipilih','ID grup null')]),group('duplicate','Duplikat A '+tag,[answer('shared','Sama A','Pertanyaan duplikat A')]),group('duplicate','Duplikat B '+tag,[answer('shared','Sama B','Pertanyaan duplikat B')]),group('empty-answers','Daftar kosong '+tag,[])];
 const rows=[group('10','Pelayanan SINTETIS 10 · '+tag,[answer(' RAW-ANSWER-10-A ','Baik A','Pertanyaan pertama SINTETIS 10 · '+tag),answer(' RAW-ANSWER-10-B ','Baik B','TIDAK BOLEH DESKRIPSI')]),group('2','Pelayanan SINTETIS 2 · '+tag,[answer(' RAW-ANSWER-2 ','Baik C','Pertanyaan pertama SINTETIS 2 · '+tag)]),group(' raw-group ','ID spasi SINTETIS · '+tag,[answer(null,'Jawaban ID null','Pertanyaan ID null · '+tag),answer(' RAW-ANSWER-SPACE ','Jawaban ID spasi','TIDAK BOLEH DESKRIPSI')])];
 if(mode==='malformed')rows[0].kategori=42;return rows;
}

export function createRatingPpatWriteBrowserFixture({port=4221,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/rating-ppat-write-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve prior receipt; select a new suffix');
 assert.equal(sha(bytes(BASELINE)),BASELINE_SHA);const baseline=JSON.parse(bytes(BASELINE));assert.equal(baseline.passed,true);assert.equal(baseline.runtime.length,121);
 const runtime=[...baseline.runtime.map(row=>row.file),'webapp/private/rating-ppat-post.mjs'];assert.equal(new Set(runtime).size,122);
 const inputs=new Map(),served=new Map(),statics=new Map(),calls=[],browserRequests=[],controls=[],observations=[],logs=[],held=new Map(),nextModes=new Map();
 let started=false,stopped=false,listenerClosed=false,sequence=0,unexpected=0,generation=0,authenticateNext=true;
 const pin=file=>{const value={file,sha256:sha(bytes(file))};if(inputs.has(file))assert.equal(inputs.get(file).sha256,value.sha256,'Source changed '+file);else inputs.set(file,value);return value;};
 for(const file of [...runtime,BASELINE,'webapp/tests/rating-ppat-write-browser-fixture.mjs','webapp/tests/rating-ppat-write-browser-page.mjs','analysis/RATING-PPAT-WRITE-FINAL-FOLLOWUP-20261021.md','analysis/recovered/ratingppat-write-final-followup/source-index.json','analysis/RATING-PPAT-RESULT-NAVIGATION-FOLLOWUP.md'])pin(file);
 function inventory(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const full=path.join(folder,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(ROOT,full).split(path.sep).join('/');statics.set('/'+file.slice(7),pin(file));}}}
 inventory(path.join(ROOT,'webapp/assets'));for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;statics.set('/'+entry.name,pin(file));}
 const catalog=operations.getPublicCatalog();assert.equal(catalog.length,176);assert.equal(catalog.filter(row=>row.enabled).length,89);
 for(const [kind,id]of Object.entries(RECIPES)){const op=catalog.find(row=>row.id===id);assert.ok(op?.enabled&&op.serviceId==='main'&&op.auth==='session'&&op.effect===(kind==='post'?'write':'read'),kind);if(kind==='post'){assert.equal(op.requiresConfirmation,true);assert.equal(op.encoding,'json');assert.equal(op.method,'POST');assert.equal(op.endpoint,'RatingPPAT/PostRatingPPAT');}}
 const news=catalog.filter(row=>['Berita/GetBerita?limit=8','Pengumuman/GetPengumuman?limit=5'].includes(row.endpoint));
 const allowedIds=new Set([...Object.values(RECIPES),...news.map(row=>row.id)]);
 const reject=message=>{unexpected++;persist();throw Error(message);};
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!allowedIds.has(id))reject('Operation outside Rating PPAT fixture scope');return operations.prepareOperation(id,values,context);}};
 const sessions=new SessionStore(),create=sessions.create.bind(sessions);
 sessions.create=()=>{const session=create();if(authenticateNext){authenticateNext=false;generation++;session.user={username:'synthetic-rating-write-user-'+generation,nama:'Pemohon SINTETIS',roleUser:'PERORANGAN',userLevel:2,nomorIndukKependudukan:'0000000000000000'};session.tokens={tokenType:'Bearer',accessToken:'fixture-rating-write-access-'+generation,refreshToken:null,expiredAt:4e9};}return session;};
 const status=()=>({origin,port,suffix,started,stopped,listenerClosed,sequence,generation,authenticated:[...sessions.sessions.values()].some(row=>!!row.user&&!!row.tokens),calls:[...calls],browserRequests:[...browserRequests],controls:[...controls],observations:observations.length,held:[...held.values()].map(row=>({sequence:row.call.sequence,kind:row.call.kind,mode:row.call.mode})),nextModes:Object.fromEntries(nextModes),unexpected,syntheticPostRequests:calls.filter(row=>row.kind==='post').length,syntheticSuccessBodies:calls.filter(row=>row.kind==='post'&&row.syntheticOutcomeSuccess===true).length});
 function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input changed during fixture '+row.file);}
 function persist(){if(!started)return;stable();fs.writeFileSync(path.join(ROOT,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Actual packaged app/modules, createApiHandler, ApiClient, SessionStore, operation preparation, JSON serializer and response decoder. Synthetic authenticated bootstrap and injected synthetic transports only. No real account/provider/write acceptance; product app.js served byte-exact.',origin,port,suffix,baseline:pin(BASELINE),runtime:runtime.map(pin),runtimeCount:122,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'append-visible-fixture-helper-and-stylesheet-only'}],fixtureCsp:CSP,catalogCount:catalog.length,enabled:89,recipes:RECIPES,aktaRows,normalQuestionRows:questions('normal','REFERENCE'),questionModes:QUESTION_MODES,postModes:POST_MODES,calls,browserRequests,controls,observations,logs,held:status().held,nextModes:Object.fromEntries(nextModes),unexpected,generation,stopped,listenerClosed,syntheticPostRequests:status().syntheticPostRequests,providerRequests:0,productionRequests:0,productionWrites:0,hardwarePermissionRequests:0},null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 function takeMode(kind){const mode=nextModes.get(kind)??(kind==='post'?'success200':'normal');nextModes.delete(kind);return mode;}
 async function hold(call){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('timeout');},60000);timer.unref?.();held.set(call.sequence,{call,release:reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);}});persist();});}
 function release(reason='control'){const released=[...held.keys()];for(const item of held.values())item.release(reason);controls.push({sequence:++sequence,action:'release',reason,released});persist();return released;}
 async function transport(url,init){
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  const kind=({'/account/account_summary':'profile','/Akta/GetAktaList':'akta','/RatingPPAT/GetRatingQuestions':'questions','/RatingPPAT/PostRatingPPAT':'post','/Berita/GetBerita':'news','/Pengumuman/GetPengumuman':'news'})[url.pathname];if(!kind)return reject('Unknown synthetic provider path');
  const headers=new Headers(init.headers),mode=takeMode(kind),call={sequence:++sequence,kind,method:init.method,path:url.pathname,query:[...url.searchParams],mode,completed:false,hasSyntheticSessionAuthorization:/^Bearer fixture-rating-write-access-\d+$/.test(headers.get('Authorization')??''),hasExpectedUserAgent:headers.get('User-Agent')==='Sentuh-Browser-Reconstruction/0.1'};calls.push(call);assert.ok(call.hasSyntheticSessionAuthorization&&call.hasExpectedUserAgent);
  let body,statusCode=mode==='error503'?503:mode==='hold401'?401:mode==='success201'?201:200,contentType='application/json; charset=utf-8';
  assert.equal(init.method,['profile','post'].includes(kind)?'POST':'GET');
  if(kind==='post'){
   assert.equal(url.search,'');assert.equal(headers.get('Accept'),'text/plain');assert.equal(headers.get('Content-Type'),'application/json');assert.equal(typeof init.body,'string');const value=JSON.parse(init.body);assert.deepEqual(Object.keys(value),['aktaId','PertanyaanRatingPPATId']);assert.equal(typeof value.aktaId,'string');assert.ok(aktaRows.some(row=>(row.aktaId??'')===value.aktaId));assert.ok(Array.isArray(value.PertanyaanRatingPPATId));assert.ok(value.PertanyaanRatingPPATId.every(id=>typeof id==='string'&&['',' RAW-ANSWER-10-A ',' RAW-ANSWER-10-B ',' RAW-ANSWER-2 ',' RAW-ANSWER-SPACE ','shared'].includes(id)));call.body=value;call.exactBody=init.body;call.bodySha256=sha(Buffer.from(init.body));call.bodyBytes=Buffer.byteLength(init.body);call.accept='text/plain';call.contentType='application/json';
   body=mode==='native-false'?{error:true,message:'Rating PPAT SINTETIS ditolak.'}:mode==='missing-fields'?{}:mode==='success-missing-message'?{error:false}:mode==='invalid-fields'?{error:'false',message:42}:{error:false,message:'Rating PPAT SINTETIS diterima. <b>tetap teks</b>'};
   if(mode==='plain-json')contentType='text/plain; charset=utf-8';
  }else{
   assert.equal(headers.get('Accept'),'application/json');assert.equal(headers.get('Content-Type'),'application/x-www-form-urlencoded');
   if(kind==='profile'){assert.equal(url.search,'');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual([...init.body],[['appVersion','6.1.5']]);call.body=[...init.body];body={error:false,data:{userLevel:2,isIkd:false,statusVerifikasi:1,nama:'Profil SINTETIS',nomorHp:'000',email:'synthetic@example.invalid'}};}
   else{assert.equal(init.body,undefined);if(kind==='akta'){assert.deepEqual([...url.searchParams],[['nik','0000000000000000']]);body={error:false,message:structuredClone(aktaRows)};}
    else if(kind==='questions'){assert.equal(url.search,'');body={error:true,message:'SYNTHETIC envelope flag ignored',data:questions(mode,'RESP'+call.sequence)};call.responseRows=body.data.length;}
    else{assert.deepEqual([...url.searchParams],[['limit',url.pathname.startsWith('/Berita/')?'8':'5']]);body={error:true,message:[]};}}
  }
  persist();if(mode==='hold'||mode==='hold401'){const reason=await hold(call);call.releaseReason=reason;if(reason!=='control')statusCode=503;}
  if(mode==='transport-error'){call.completed=true;call.completedSequence=++sequence;call.thrown='SYNTHETIC_CONNECTION';persist();throw Error('SYNTHETIC connection failure');}
  if(statusCode>=400)body={error:true,message:statusCode===401?'Sesi SINTETIS ditolak.':'Gangguan SINTETIS.'};
  const wire=Buffer.from(JSON.stringify(mode==='json-string'?JSON.stringify(body):body));call.status=statusCode;call.responseContentType=contentType;call.responseBytes=wire.length;call.responseSha256=sha(wire);call.completed=true;call.completedSequence=++sequence;call.syntheticOutcomeSuccess=kind==='post'&&statusCode>=200&&statusCode<300&&contentType.startsWith('application/json')&&mode!=='json-string'&&body.error===false;persist();return new Response(wire,{status:statusCode,headers:{'Content-Type':contentType}});
 }
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'RATING PPAT SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn synthetic-application-only'};
 const prohibited=async()=>reject('Non-Rating provider transport prohibited');
 const api=createApiHandler({configuration,registry,sessions,transport:async(url,init)=>{try{return await transport(url,init);}catch(error){if(error.message!=='SYNTHETIC connection failure'){unexpected++;const call=calls.at(-1);if(call){call.fixtureRejected=true;call.fixtureError=String(error.message).slice(0,220);}persist();}throw error;}},queueTransport:prohibited,guestbookTransport:prohibited,bhumiTransport:prohibited,log:entry=>{logs.push(entry);persist();}});
 const json=(res,value,statusCode=200)=>{res.writeHead(statusCode,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 async function controlBody(req){assert.equal(req.headers.origin,origin);let raw='';for await(const chunk of req){raw+=chunk;assert.ok(raw.length<200000);}const value=JSON.parse(raw||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function send(res,route,file,transform){const source=pin(file),raw=bytes(file),content=transform?Buffer.from(transform(raw.toString())):raw;served.set(route,{route,...source,servedSha256:sha(content),transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(content);persist();}
 function stop(reason='explicit'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});persist();server.close(()=>{listenerClosed=true;api.close();persist();});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){json(res,status());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await controlBody(req);
    if(route==='/fixture/mode'){assert.deepEqual(Object.keys(value),['kind','mode']);assert.ok(value.kind==='post'?POST_MODES.includes(value.mode):value.kind==='questions'&&QUESTION_MODES.includes(value.mode));nextModes.set(value.kind,value.mode);controls.push({sequence:++sequence,action:'mode',...value});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/new-session'){assert.deepEqual(value,{});for(const id of [...sessions.sessions.keys()])sessions.delete(id);authenticateNext=true;controls.push({sequence:++sequence,action:'new-synthetic-session'});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<250);observations.push(value);}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);assert.equal(value.hasChild,false);json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,status());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/rating-ppat-write-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#rating-ppat-write-fixture{margin:14px 14px 110px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 28px);box-sizing:border-box}#rating-ppat-write-fixture h2{font-size:16px}#rating-ppat-write-fixture button,#rating-ppat-write-fixture a,#rating-ppat-write-fixture select{padding:7px;margin:4px;font:inherit;max-width:100%}#rating-ppat-write-fixture-status{white-space:pre-wrap;max-height:260px;overflow:auto}@media(min-width:761px){body>#rating-ppat-write-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   if(route==='/api/execute'&&req.method==='POST'){
    const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);let operationId=null,confirm=null,values=null;try{const value=JSON.parse(raw.toString('utf8'));operationId=value.operationId;confirm=value.confirm??null;values=value.values;}catch{}browserRequests.push({sequence:++sequence,operationId,confirm,values,bodyBytes:raw.length,bodySha256:sha(raw)});persist();};
   }
   if(await api.handle(req,res,route))return;
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace('</body>','<script type="module" src="/fixture/page.js"></script></body>'));return;}
   const source=statics.get(route);if(!source){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(ROOT,source.file)).startsWith(fs.realpathSync(path.join(ROOT,'webapp'))+path.sep));send(res,route,source.file);
  }catch(error){unexpected++;persist();console.error('Rating PPAT write fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'RATING_PPAT_WRITE_FIXTURE_REJECTED',message:'Synthetic Rating PPAT request rejected.'}},400);else res.end();}
 });
 server.on('close',()=>{if(!listenerClosed){listenerClosed=true;api.close();persist();}});
 return {origin,port,output,server,status,start:async()=>{assert.equal(started,false);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return status();},stop};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4221),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createRatingPpatWriteBrowserFixture({port,suffix});await fixture.start();console.log('Rating PPAT write synthetic browser '+fixture.origin+'/#/akta');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
}
