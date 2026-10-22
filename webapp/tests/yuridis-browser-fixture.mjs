// Actual packaged app + createApiHandler/ApiClient/registry/session/decoders.
// Every main/WMS transport response and raster tile is synthetic and local.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createApiHandler} from '../private/http-api.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const sha=value=>createHash('sha256').update(value).digest('hex');
const bytes=file=>fs.readFileSync(path.join(ROOT,file));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon'};
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const RECIPES={
 profile:'post-account-account-summary-d2939c',offices:'get-legacy-kantah-d10364',
 feed:'get-announcement-yuridis-bykantor-d0fb64',review:'post-review-last-user-review-dad1dc',
 location:'get-lokasibidang-getbypersilid-dad6f4',boundary:'get-legacy-getparcelboundarybyid-dbaeb8',
 post:'post-review-post-deb030'
};
const MODES=['normal','string','empty','null-data','malformed','error503','auth401','hold','hold401','post201'];
const FAVORITE=' SINTETIS-FAVORITE-OFFICE ';
const SYNTHETIC_USER={username:'penguji-yuridis-sintetis',nama:'Akun SINTETIS Yuridis',roleUser:'PERORANGAN',userLevel:2};
const offices=[{KantorId:'SINTETIS-EMPTY-OFFICE',Nama:'Kantor Kosong SINTETIS',TipeKantorId:2},{KantorId:FAVORITE,Nama:'Kantor Favorit SINTETIS',TipeKantorId:2},{KantorId:'SINTETIS-FAIL-OFFICE',Nama:'Kantor Gagal SINTETIS',TipeKantorId:2},{KantorId:'SINTETIS-OTHER-OFFICE',Nama:'Kantor Lain SINTETIS',TipeKantorId:2},{KantorId:null,Nama:'Kantor ID Null SINTETIS',TipeKantorId:null}];
const originalId=index=>` ORIGINAL-SINTETIS-PERSIL-${index} `;
const returnedId=index=>` RETURNED-SINTETIS-PERSIL-${index} `;
function records(tag){
 const rows=Array.from({length:35},(_,index)=>({persilId:originalId(index),nomorBerkas:`Berkas SINTETIS ${index}`,nomorPengumuman:'TIDAK-DITAMPILKAN-SINTETIS',tanggalMulai:'2026-10-20T13:24:35.123Z',tanggalSelesai:'2026-11-20',nib:`NIB SINTETIS ${index}`,wilayah:`Desa SINTETIS ${index}`,luasPersil:index===5?JSON.rawJSON('9007199254740993'):123,pemohon:`Pemohon SINTETIS ${index} · ${tag}`,permohonan:'JANGAN-DICARI-SINTETIS',kegiatan:index===6?'rutin':'Rutin'}));
 rows[1]=Object.fromEntries(Object.keys(rows[1]).map(key=>[key,null]));rows[2]={...rows[0]};
 Object.assign(rows[3],{pemohon:'Pemohon CARI SINTETIS · '+tag,wilayah:'Desa CARI SINTETIS',nomorBerkas:'Berkas CARI SINTETIS'});
 Object.assign(rows[4],{pemohon:'<img src=x onerror="fixtureOnly()">',wilayah:'<script>fixtureOnly()</script>',kegiatan:'',tanggalMulai:'invalid',tanggalSelesai:null});
 rows[34].pemohon='Pemohon SINTETIS panjang '+('NamaPanjangTanpaSpasi'.repeat(16))+' · '+tag;
 return rows;
}
function crc32(value){let crc=0xffffffff;for(const byte of value){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function pngChunk(name,value){const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(value.length);crc.writeUInt32BE(crc32(Buffer.concat([type,value])));return Buffer.concat([length,type,value,crc]);}
function png(overlay){const header=Buffer.alloc(13);header.writeUInt32BE(256,0);header.writeUInt32BE(256,4);header[8]=8;header[9]=6;const pixels=Buffer.alloc(256*(1+256*4));for(let y=0;y<256;y++)for(let x=0;x<256;x++){const offset=y*(1+256*4)+1+x*4,line=x%64<2||y%64<2;pixels[offset]=overlay?160:line?232:214;pixels[offset+1]=overlay?50:line?235:225;pixels[offset+2]=overlay?85:line?237:212;pixels[offset+3]=overlay?(line?220:0):255;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),pngChunk('IDAT',zlib.deflateSync(pixels)),pngChunk('IEND',Buffer.alloc(0))]);}
const BASE_PNG=png(false),OVERLAY_PNG=png(true);
const GEOMETRY={type:'FeatureCollection',features:[{type:'Feature',properties:{NIB:'Bidang SINTETIS',TIPEHAK:'Hak SINTETIS'},geometry:{type:'Polygon',coordinates:[[[106,-6],[106.00016,-6],[106.00016,-5.99984],[106,-5.99984],[106,-6]]]}}]};

export function createYuridisBrowserFixture({port=4219,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>0&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/yuridis-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve earlier browser receipt; use a new suffix');
 const inputs=new Map(),served=new Map(),statics=new Map(),calls=[],browserRequests=[],controls=[],observations=[],logs=[],tiles=[],held=new Map(),nextModes=new Map(),accepted=new Map();
 let sequence=0,unexpected=0,started=false,stopped=false,listenerClosed=false,autoAuthenticateNext=true;
 const pin=file=>{if(!inputs.has(file))inputs.set(file,{file,sha256:sha(bytes(file))});return inputs.get(file);};
 const baselineFile='analysis/webapp/yuridis-runtime-baseline.json',baseline=JSON.parse(bytes(baselineFile));
 const additions=['model.js','controller.js','review-controller.js','view.js','host.js'].map(name=>'webapp/assets/yuridis/'+name).concat('webapp/private/yuridis-response.mjs');
 const runtime=[...new Set([...baseline.runtime.map(row=>row.file),...additions])];
 for(const file of [...runtime,baselineFile,'webapp/tests/yuridis-browser-fixture.mjs','webapp/tests/yuridis-browser-page.mjs','analysis/YURIDIS-READ-FLOW.md','analysis/recovered/yuridis-read-flow/source-index.json'])pin(file);
 function inventory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(ROOT,full).split(path.sep).join('/');statics.set('/'+file.slice(7),pin(file));}}}
 inventory(path.join(ROOT,'webapp/assets'));
 for(const item of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(item.isFile()&&/\.(?:js|css|html|json)$/.test(item.name)){const file='webapp/'+item.name;statics.set('/'+item.name,pin(file));}
 const catalog=operations.getPublicCatalog();
 for(const [kind,id]of Object.entries(RECIPES)){const op=catalog.find(row=>row.id===id);assert.ok(op?.enabled&&op.serviceId==='main'&&op.effect===(kind==='post'?'write':'read'),kind);}
 const news=catalog.find(op=>op.endpoint==='Pengumuman/GetPengumuman?limit=5');assert.ok(news?.enabled);const allowedIds=new Set([...Object.values(RECIPES),news.id]);
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{assert.ok(allowedIds.has(id),'Fixture operation outside Yuridis scope');return operations.prepareOperation(id,values,context);}};
 const sessions=new SessionStore(),create=sessions.create.bind(sessions);
 sessions.create=()=>{const session=create();if(autoAuthenticateNext){autoAuthenticateNext=false;session.user={...SYNTHETIC_USER};session.tokens={tokenType:'Bearer',accessToken:'fixture-yuridis-access-only',refreshToken:null,expiredAt:4e9};}return session;};
 const status=()=>({origin,port,started,stopped,listenerClosed,calls:[...calls],browserRequests:[...browserRequests],controls:[...controls],observations:observations.length,held:[...held.values()].map(value=>({sequence:value.call.sequence,kind:value.call.kind,mode:value.call.mode})),nextModes:Object.fromEntries(nextModes),unexpected,postRequests:calls.filter(call=>call.kind==='post').length,acceptedPosts:calls.filter(call=>call.kind==='post'&&call.accepted).length,authenticated:[...sessions.sessions.values()].some(session=>!!session.tokens&&!!session.user),tiles:{osm:tiles.filter(row=>row.kind==='osm').length,bhumi:tiles.filter(row=>row.kind==='bhumi').length}});
 function stable(){for(const source of inputs.values())assert.equal(sha(bytes(source.file)),source.sha256,'Input changed while browser fixture live: '+source.file);}
 function persist(){if(!started)return;stable();const value={schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Actual packaged index/app/modules and real createApiHandler, ApiClient, SessionStore, operation registry, byte decoders, multipart serializer and BhumiMapClient with injected synthetic-only transports. No provider/real account/GPS/camera. This is synthetic integration evidence, not production acceptance.',origin,port,suffix,baseline:pin(baselineFile),runtime:runtime.map(pin),runtimeCount:runtime.length,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'append-visible-fixture-controls'},{file:'webapp/assets/maps/official-map.js',kind:'replace-only-OSM_TEMPLATE-with-local-tile-URL'}],fixtureCsp:CSP,recipes:RECIPES,calls,browserRequests,controls,observations,logs,tiles,held:status().held,nextModes:Object.fromEntries(nextModes),unexpected,stopped,listenerClosed,postRequests:status().postRequests,acceptedPosts:status().acceptedPosts,providerRequests:0,productionRequests:0,productionMutations:0,hardwarePermissionRequests:0};fs.writeFileSync(path.join(ROOT,output),JSON.stringify(value,null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 const response=(value,status=200)=>Response.json(value,{status});
 function fail(message){unexpected++;persist();throw new Error(message);}
 function takeMode(kind){const mode=nextModes.get(kind)||'normal';nextModes.delete(kind);return mode;}
 async function hold(call){const reason=await new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('timeout');},60000);timer.unref();held.set(call.sequence,{call,release:reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);}});persist();});call.releaseReason=reason;return reason;}
 function release(reason='control'){const ids=[...held.keys()];for(const pending of held.values())pending.release(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 async function transport(url,init){
  if(url.origin!=='https://sentuh.atrbpn.go.id')return fail('Non-synthetic main origin rejected');
  const kind=url.pathname==='/account/account_summary'?'profile':url.pathname==='/legacy/Kantah'?'offices':url.pathname==='/announcement/yuridis_byKantor'?'feed':url.pathname==='/review/last_user_review'?'review':url.pathname==='/LokasiBidang/GetByPersilId'?'location':url.pathname==='/legacy/GetParcelBoundaryById'?'boundary':url.pathname==='/review/post'?'post':url.pathname==='/Bhumi/haiiizzzzzzz'?'wms-token':url.pathname==='/Pengumuman/GetPengumuman'?'news':null;
  if(!kind)return fail('Unknown synthetic main path');
  const mode=takeMode(kind),call={sequence:++sequence,kind,method:init.method,path:url.pathname,query:[...url.searchParams],mode,completed:false,hasExpectedAccept:init.headers.Accept==='application/json',hasExpectedUserAgent:init.headers['User-Agent']==='Sentuh-Browser-Reconstruction/0.1',hasSyntheticSessionAuthorization:init.headers.Authorization==='Bearer fixture-yuridis-access-only'};calls.push(call);
  assert.ok(call.hasExpectedAccept&&call.hasExpectedUserAgent);assert.equal(init.method,['profile','review','post'].includes(kind)?'POST':'GET');
  if(kind!=='post')assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');
  let index=null,body;
  if(kind==='profile'){assert.equal(url.search,'');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual([...init.body],[['appVersion','6.1.5']]);call.body=[...init.body];body={error:false,data:{...SYNTHETIC_USER,kantorId:FAVORITE,isIkd:false,statusVerifikasi:1,nomorHp:'000',email:'synthetic@example.invalid'}};}
  else if(kind==='offices'){assert.deepEqual([...url.searchParams],[['nama',''],['tipeKantor','']]);assert.equal(init.body,undefined);body=mode==='empty'?[]:structuredClone(offices);if(mode==='malformed')body[0].TipeKantorId='invalid';}
  else if(kind==='feed'){assert.deepEqual([...url.searchParams.keys()],['kantorId']);const id=url.searchParams.get('kantorId');assert.ok(offices.some(row=>row.KantorId===id)||id===FAVORITE);call.selectedOfficeId=id;const empty=mode==='empty'||id==='SINTETIS-EMPTY-OFFICE';body={error:true,message:'SYNTHETIC envelope flag intentionally ignored',data:empty?[]:records('RESP'+call.sequence)};call.responseRows=body.data.length;call.responseError=true;if(mode==='malformed')body.data[0].kegiatan=42;if(mode==='null-data')body.data=null;if(id==='SINTETIS-FAIL-OFFICE'&&mode==='normal')call.forced503=true;}
  else if(kind==='review'){assert.equal(url.search,'');assert.equal(typeof init.body,'string');const fields=[...new URLSearchParams(init.body)];assert.deepEqual(fields.map(([key])=>key),['reviewType','contentId']);assert.equal(fields[0][1],'sertipikatSaya');index=Array.from({length:35},(_,at)=>at).find(at=>originalId(at)===fields[1][1]);assert.notEqual(index,undefined);call.body=fields;call.exactBody=init.body;const existing=accepted.get(fields[1][1]);body={error:true,message:'SYNTHETIC last-user singleton',totalRecords:1,resultsCount:1,pageSize:1,pageNumber:1,data:existing??{reviewId:'SINTETIS-REVIEW-'+index,rating:4,comment:'Ulasan tunggal SINTETIS '+index+' · RESP'+call.sequence,createdAt:'1999-01-01',reviewPhotos:[]}};if(index===7||mode==='empty'||mode==='null-data')body={data:null,error:'ignored malformed metadata on native null early return',totalRecords:{synthetic:true},pageSize:'invalid unused metadata'};if(mode==='malformed')body={error:true,data:[]};call.responseDataNull=body.data===null;call.responseError=body.error;}
  else if(kind==='location'){assert.deepEqual([...url.searchParams.keys()],['persilId']);const id=url.searchParams.get('persilId');index=Array.from({length:35},(_,at)=>at).find(at=>originalId(at)===id);assert.notEqual(index,undefined);body={error:false,data:{persilId:returnedId(index),kantorId:FAVORITE,namaKantor:'Kantor SINTETIS',wilayahId:'SINTETIS-WILAYAH',namaWilayah:'Wilayah SINTETIS',jenisHak:'SINTETIS',nomorSertipikat:'SINTETIS'}};if(mode==='empty'||mode==='null-data')body.data=null;call.originalPersilId=id;call.returnedPersilId=body.data?.persilId??null;}
  else if(kind==='boundary'){assert.deepEqual([...url.searchParams.keys()],['persilid']);const id=url.searchParams.get('persilid');index=Array.from({length:35},(_,at)=>at).find(at=>returnedId(at)===id);assert.notEqual(index,undefined,'Boundary must use returned metadata persilId, never original announcement ID');call.returnedPersilId=id;body=mode==='empty'?{type:'FeatureCollection',features:[]}:structuredClone(GEOMETRY);}
  else if(kind==='post'){
   assert.equal(url.search,'');assert.ok(Buffer.isBuffer(init.body)||init.body instanceof Uint8Array);const raw=Buffer.from(init.body);assert.match(init.headers['Content-Type'],/^multipart\/form-data; boundary=sentuh-review-/);
   const form=await new Request(origin+'/synthetic-provider/review/post',{method:'POST',headers:{'Content-Type':init.headers['Content-Type']},body:raw}).formData(),parts=[];
   for(const[key,value]of form){if(typeof value==='string')parts.push({key,value});else{const file=Buffer.from(await value.arrayBuffer());parts.push({key,name:value.name,type:value.type,bytes:file.length,sha256:sha(file)});}}
   assert.deepEqual(parts.slice(0,4).map(part=>part.key),['contentId','reviewType','comment','rating']);assert.equal(parts[1].value,'sertipikatSaya');index=Array.from({length:35},(_,at)=>at).find(at=>originalId(at)===parts[0].value);assert.notEqual(index,undefined);assert.ok(parts[2].value===''||parts[2].value.startsWith('SINTETIS'),'Use only conspicuously synthetic review comments');assert.match(parts[3].value,/^[1-5]$/);call.parts=parts;call.bodyBytes=raw.length;call.bodySha256=sha(raw);call.fileCount=parts.length-4;body={error:true,message:'SYNTHETIC HTTP200 status-only outcome'};
  }
  else if(kind==='wms-token'){assert.equal(url.search,'');body={error:false,message:'synthetic-dedicated-wms-token'};}
  else{assert.deepEqual([...url.searchParams],[['limit','5']]);body={error:true,message:[]};}
  persist();let status=mode==='error503'||call.forced503?503:mode==='auth401'||mode==='hold401'?401:mode==='post201'?201:200;
  if(mode==='hold'||mode==='hold401'){const reason=await hold(call);if(reason!=='control')status=503;}
  if(status===200&&kind==='post'){const parts=call.parts;accepted.set(parts[0].value,{reviewId:'SINTETIS-ACCEPTED-'+call.sequence,rating:Number(parts[3].value),comment:parts[2].value,createdAt:'1999-01-01',reviewPhotos:[]});call.accepted=true;}
  call.status=status;call.completed=true;call.completedSequence=++sequence;
  if(status>=400)body={error:true,message:status===401?'Sesi SINTETIS ditolak.':'Gangguan SINTETIS.'};
  const wire=Buffer.from(JSON.stringify(mode==='string'?JSON.stringify(body):body));call.responseSha256=sha(wire);call.responseBytes=wire.length;persist();return new Response(wire,{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
 }
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'YURIDIS SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn synthetic-application-only',bhumiAuthKey:()=> 'synthetic-bhumi-authkey-only'};
 // Standard localhost policy derives the HTTP origin from the exact Host and
 // listening port. publicOrigin is exclusively an operator HTTPS override.
 const api=createApiHandler({configuration,registry,sessions,transport:async(url,init)=>{try{return await transport(url,init);}catch(error){unexpected++;const current=calls.at(-1);if(current){current.fixtureRejected=true;current.fixtureError=String(error.message).slice(0,220);}persist();throw error;}},log:entry=>{logs.push(entry);persist();},queueTransport:async()=>fail('Queue provider prohibited'),guestbookTransport:async()=>fail('Guestbook provider prohibited'),bhumiTransport:async(url,init)=>{
  const parsed=new URL(url);assert.equal(parsed.origin,'https://bhumi.atrbpn.go.id');assert.equal(parsed.pathname,'/expapi/live-bhumi-wms');assert.equal(init.method,'GET');assert.equal(init.headers.Referer,'https://bhumi.atrbpn.go.id/');assert.equal(parsed.searchParams.get('token'),'synthetic-dedicated-wms-token');assert.equal(parsed.searchParams.get('authkey'),'synthetic-bhumi-authkey-only');assert.equal(parsed.searchParams.get('layers'),'petabpn:PersilBerdasarkanJenisHakStroke');tiles.push({kind:'bhumi',path:parsed.pathname,status:200,bytes:OVERLAY_PNG.length,sha256:sha(OVERLAY_PNG)});persist();return new Response(OVERLAY_PNG,{headers:{'Content-Type':'image/png'}});
 }});
 const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 function send(res,route,file,transform=null){const source=pin(file),raw=bytes(file);assert.equal(sha(raw),source.sha256);const data=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,servedSha256:sha(data),transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(data);persist();}
 async function controlBody(req){assert.equal(req.headers.origin,origin);assert.ok(req.headers['content-type']?.startsWith('application/json'));let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<120000);}const value=JSON.parse(text||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function stop(reason='signal'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});persist();server.close(()=>{listenerClosed=true;persist();console.log('Yuridis fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','geolocation=(),camera=(),microphone=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){json(res,status());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){const value=await controlBody(req);if(route==='/fixture/mode'){assert.deepEqual(Object.keys(value),['kind','mode']);assert.ok(['profile','offices','feed','review','location','boundary','post'].includes(value.kind));assert.ok(MODES.includes(value.mode));nextModes.set(value.kind,value.mode);controls.push({sequence:++sequence,action:'mode',...value});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/new-session'){assert.deepEqual(value,{});for(const id of [...sessions.sessions.keys()])sessions.delete(id);autoAuthenticateNext=true;controls.push({sequence:++sequence,action:'new-synthetic-session'});}
    else if(route==='/fixture/observe'){assert.ok(observations.length<250);observations.push(value);}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);assert.equal(value.hasDetail,false);json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,status());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/yuridis-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#yuridis-fixture{margin:14px 14px 110px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 28px);box-sizing:border-box}#yuridis-fixture h2{font-size:16px}#yuridis-fixture button,#yuridis-fixture a,#yuridis-fixture select{padding:7px;margin:4px;font:inherit;max-width:100%}#yuridis-fixture-status{white-space:pre-wrap;max-height:260px;overflow:auto}dialog>#yuridis-fixture{margin:10px}@media(min-width:761px){body>#yuridis-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   const osm=/^\/fixture\/osm\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(route);if(osm&&req.method==='GET'){const[z,x,y]=osm.slice(1).map(Number);assert.ok(z>=0&&z<=21&&x>=0&&x<2**z&&y>=0&&y<2**z);tiles.push({kind:'osm',z,x,y,status:200,bytes:BASE_PNG.length,sha256:sha(BASE_PNG)});res.writeHead(200,{'Content-Type':'image/png'});res.end(BASE_PNG);persist();return;}
   if(route==='/api/execute'&&req.method==='POST'){const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);let operationId=null,confirm=null,valuesKeys=[];try{if(req.headers['content-type']?.startsWith('application/json')){const data=JSON.parse(raw.toString('utf8'));operationId=data.operationId;confirm=data.confirm??null;valuesKeys=Object.keys(data.values||{});}else{const form=await new Request(origin+'/api/execute',{method:'POST',headers:{'Content-Type':req.headers['content-type']},body:raw}).formData();operationId=form.get('operationId');confirm=form.get('confirm');valuesKeys=Object.keys(JSON.parse(form.get('values')||'{}'));}}catch{}browserRequests.push({sequence:++sequence,operationId,confirm,valuesKeys,bodyBytes:raw.length,bodySha256:sha(raw)});persist();};}
   if(await api.handle(req,res,route))return;
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'){send(res,route,'webapp/index.html',html=>html.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace('</body>','<script type="module" src="/fixture/page.js"></script></body>'));return;}
   const source=statics.get(route);if(!source){res.writeHead(404);res.end();return;}
   if(source.file==='webapp/assets/maps/official-map.js'){send(res,route,source.file,text=>{const literal="const OSM_TEMPLATE='https://tile.openstreetmap.org/{z}/{x}/{y}.png';";assert.equal(text.split(literal).length,2);return text.replace(literal,"const OSM_TEMPLATE='/fixture/osm/{z}/{x}/{y}.png';");});return;}
   send(res,route,source.file);
  }catch(error){unexpected++;persist();console.error('Yuridis fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'YURIDIS_FIXTURE_REJECTED',message:'Synthetic Yuridis request rejected.'}},400);else res.end();}
 });
 server.on('close',()=>{if(!listenerClosed){listenerClosed=true;api.close();persist();}});
 return {origin,port,output,server,snapshot:status,start:async()=>{assert.equal(started,false);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return status();},stop};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4219),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createYuridisBrowserFixture({port,suffix});await fixture.start();console.log('Yuridis synthetic browser: '+fixture.origin+'/#/announcements');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
}
