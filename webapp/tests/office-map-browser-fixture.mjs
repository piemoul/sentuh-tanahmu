// Whole current app + real HTTP handler/registry/decoder. Synthetic transport only.
// Importing prepares nothing and starts no server. Run only after source freeze.
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
const bytes=file=>fs.readFileSync(path.join(ROOT,file));
const sha=value=>createHash('sha256').update(value).digest('hex');
const BASELINE='analysis/webapp/office-map-runtime-baseline.json';
const BASELINE_SHA='12a30cae2ad8ed74457f3bfe3724a78dcef16bb6a1da5dca3c4ea8f4655f1416';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const officeIds=['SINTETIS-OFFICE-0','SINTETIS-DUPLICATE','SINTETIS-DUPLICATE','SINTETIS-OFFICE-3','SINTETIS-POLAR','SINTETIS-LONGITUDE','SINTETIS-SOUTH-POLE','SINTETIS-OFFICE-LAST'];
const offices=officeIds.map((kantorId,index)=>({kantorId,namaKantor:`Kantor SINTETIS ${index}`,alamat:`Alamat SINTETIS ${index}`,latitude:-6.1-index*.002,longitude:106.8+index*.002,jarak:index*.25,statusPeralihanEl:index&1,statusAntrian:(index>>1)&1,statusKiosk:(index>>2)&1}));
Object.assign(offices[0],{statusPeralihanEl:1,statusAntrian:1,statusKiosk:1});
offices[1].namaKantor='Kantor DUPLIKAT A SINTETIS';offices[2].namaKantor='Kantor DUPLIKAT B SINTETIS';
offices[3].namaKantor='<img src=x onerror="fixtureOnly()"> KANTOR SINTETIS';offices[3].alamat='<script>fixtureOnly()</script> ALAMAT SINTETIS';
offices[4].latitude=89;offices[5].longitude=181;offices[6].latitude=-90;
offices[7].namaKantor='Kantor TERAKHIR SINTETIS '+('NamaPanjangTanpaSpasi'.repeat(9));
function crc32(value){let crc=0xffffffff;for(const byte of value){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function chunk(name,value){const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(value.length);crc.writeUInt32BE(crc32(Buffer.concat([type,value])));return Buffer.concat([length,type,value,crc]);}
function png(){const header=Buffer.alloc(13);header.writeUInt32BE(256,0);header.writeUInt32BE(256,4);header[8]=8;header[9]=6;const pixels=Buffer.alloc(256*(1+256*4));for(let y=0;y<256;y++)for(let x=0;x<256;x++){const offset=y*(1+256*4)+1+x*4,line=x%64<2||y%64<2;pixels[offset]=line?230:214;pixels[offset+1]=line?235:225;pixels[offset+2]=line?235:212;pixels[offset+3]=255;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);}
const TILE=png();

export function createOfficeMapBrowserFixture({port=4220,suffix='initial'}={}){
 assert.ok(Number.isInteger(port)&&port>=1024&&port<=65535);assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 const origin='http://localhost:'+port,output=`analysis/webapp/office-map-browser-transport-${suffix}.json`;
 assert.equal(fs.existsSync(path.join(ROOT,output)),false,'Preserve prior receipt; choose a new suffix');
 const inputs=new Map(),served=new Map(),statics=new Map(),calls=[],logs=[],tiles=[],controls=[],observations=[],browserRequests=[],held=new Map();
 let started=false,stopped=false,listenerClosed=false,sequence=0,unexpected=0,nextMode='normal',tileMode='normal';
 const pin=file=>{const sha256=sha(bytes(file));if(inputs.has(file))assert.equal(inputs.get(file).sha256,sha256,'Source changed '+file);else inputs.set(file,{file,sha256});return inputs.get(file);};
 assert.equal(sha(bytes(BASELINE)),BASELINE_SHA);const baseline=JSON.parse(bytes(BASELINE));assert.equal(baseline.runtime.length,120);
 const runtime=[...baseline.runtime.map(row=>row.file),'webapp/assets/maps/office-map.js'];assert.equal(new Set(runtime).size,121);
 for(const file of [...runtime,BASELINE,'webapp/tests/office-map-browser-fixture.mjs','webapp/tests/office-map-browser-page.mjs'])pin(file);
 const changedRuntime=baseline.runtime.filter(row=>sha(bytes(row.file))!==row.sha256).map(row=>row.file).sort();
 assert.deepEqual(changedRuntime,['webapp/app.js','webapp/assets/maps/official-map.js','webapp/styles.css']);
 assert.equal(operations.OPERATIONS.length,176);for(const [i,op]of operations.OPERATIONS.entries()){assert.equal(op.id,baseline.catalog.operations[i].id);assert.equal(sha(JSON.stringify(op)),baseline.catalog.operations[i].sha256,'Catalog changed '+op.id);}
 function inventory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){assert.equal(entry.isSymbolicLink(),false);const full=path.join(directory,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(ROOT,full).split(path.sep).join('/');statics.set('/'+file.slice(7),pin(file));}}}
 inventory(path.join(ROOT,'webapp/assets'));
 for(const entry of fs.readdirSync(path.join(ROOT,'webapp'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;statics.set('/'+entry.name,pin(file));}
 const catalog=operations.getPublicCatalog();assert.equal(catalog.filter(op=>op.enabled).length,88);
 const find=endpoint=>{const op=catalog.find(row=>row.endpoint===endpoint);assert.ok(op?.enabled&&op.effect==='read'&&op.serviceId==='main');return op;};
 const nearby=find('kantornearby/getkantornearby'),calendar=find('KantorNearby/GetCalendar'),news=find('Pengumuman/GetPengumuman?limit=5');
 const allowedIds=new Set([nearby.id,calendar.id,news.id]);
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{assert.ok(allowedIds.has(id),'Fixture operation outside office read scope');return operations.prepareOperation(id,values,context);}};
 const sessions=new SessionStore();
 const snapshot=()=>({origin,port,started,stopped,listenerClosed,calls:[...calls],tiles:[...tiles],controls:[...controls],observationCount:observations.length,held:[...held.keys()],nextMode,tileMode,unexpected,anonymous:[...sessions.sessions.values()].every(session=>!session.tokens&&!session.user),officeRows:8,expectedMarkers:5,invalidMapRows:[4,5,6],duplicateOfficeIdIndices:[1,2]});
 function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input drift '+row.file);}
 function persist(){if(!started)return;stable();const value={schemaVersion:1,checkedAt:new Date().toISOString(),scope:'Current whole app and actual API/session/registry/office decoders with injected synthetic-only main transport; explicit synthetic navigator override, no provider/hardware/account.',origin,port,suffix,baseline:pin(BASELINE),runtime:runtime.map(pin),runtimeCount:121,changedRuntime,catalogUnchanged:true,catalogCount:176,enabled:88,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'fixture-only helper tag before existing app module and fixture stylesheet; product app.js unchanged'},{file:'webapp/assets/maps/office-map.js',kind:'exact single OSM constant replaced by local synthetic tile route'}],fixtureCsp:CSP,offices:structuredClone(offices),...snapshot(),browserRequests,observations,logs,providerRequests:0,productionRequests:0,productionWrites:0,hardwarePermissionRequests:0};fs.writeFileSync(path.join(ROOT,output),JSON.stringify(value,null,2)+'\n',{flag:fs.existsSync(path.join(ROOT,output))?'w':'wx'});}
 function fail(message){unexpected++;throw new Error(message);}
 function release(reason='control'){const ids=[...held.keys()];for(const pending of held.values())pending(reason);controls.push({sequence:++sequence,action:'release',reason,released:ids});persist();return ids;}
 function wait(call){return new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('timeout');},60000);timer.unref();held.set(call.sequence,reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);});persist();});}
 async function transport(url,init){
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');const kind=url.pathname==='/kantornearby/getkantornearby'?'nearby':url.pathname==='/KantorNearby/GetCalendar'?'calendar':url.pathname==='/Pengumuman/GetPengumuman'?'news':null;if(!kind)return fail('Unknown synthetic main path');
  const mode=kind==='nearby'?nextMode:'normal';if(kind==='nearby')nextMode='normal';const call={sequence:++sequence,kind,path:url.pathname,method:init.method,mode,completed:false};calls.push(call);
  assert.equal(new Headers(init.headers).has('authorization'),false,'Anonymous optionalSession office reads must not carry account or application Authorization');
  let data;
  if(kind==='nearby'){
   assert.equal(init.method,'POST');assert.equal(url.search,'');assert.equal(new Headers(init.headers).get('content-type'),'application/json');const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body).sort(),['isKalender','latitude','limit','longitude','radius']);assert.deepEqual(body,{latitude:-6.1,longitude:106.8,radius:0.1,isKalender:1,limit:null});call.body=body;
   data={error:false,message:null,totalRecords:mode==='empty'?0:8,resultsCount:mode==='empty'?0:8,pageSize:8,pageNumber:1,data:mode==='empty'?[]:structuredClone(offices)};
  }else if(kind==='calendar'){
   assert.equal(init.method,'POST');assert.equal(url.search,'');assert.equal(new Headers(init.headers).get('content-type'),'application/x-www-form-urlencoded');const body=new URLSearchParams(init.body);assert.deepEqual([...body.keys()].sort(),['kantorId','tahun']);assert.ok(officeIds.map(id=>'DECODED-'+id).includes(body.get('kantorId')));assert.equal(body.get('tahun'),String(new Date().getFullYear()));call.body=[...body];data={error:false,data:[]};
  }else{assert.equal(init.method,'GET');assert.deepEqual([...url.searchParams],[['limit','5']]);data={error:false,message:[]};}
  persist();let status=mode==='error503'?503:200;if(mode==='hold'){call.releaseReason=await wait(call);if(call.releaseReason!=='control')status=503;}
  if(status>=400)data={error:true,message:'Gangguan kantor SINTETIS sementara.'};const wire=Buffer.from(JSON.stringify(data));Object.assign(call,{completed:true,completedSequence:++sequence,status,responseBytes:wire.length,responseSha256:sha(wire)});persist();return new Response(wire,{status,headers:{'Content-Type':'application/json; charset=utf-8'}});
 }
 const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'OFFICE MAP SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn synthetic-office-map-only',calendarOfficeId:id=>{assert.ok(officeIds.includes(id));return 'DECODED-'+id;}};
 const prohibited=async()=>fail('Non-office provider transport prohibited');
 const api=createApiHandler({configuration,registry,sessions,transport:async(url,init)=>{try{return await transport(url,init);}catch(error){unexpected++;const call=calls.at(-1);if(call){call.fixtureRejected=true;call.fixtureError=String(error.message).slice(0,220);}persist();throw error;}},log:entry=>{logs.push(entry);persist();},queueTransport:prohibited,guestbookTransport:prohibited,bhumiTransport:prohibited});
 const json=(res,value,status=200)=>{res.writeHead(status,{'Content-Type':TYPES['.json']});res.end(JSON.stringify(value));};
 function send(res,route,file,transform=null){const source=pin(file),raw=bytes(file),value=transform?Buffer.from(transform(raw.toString('utf8'))):raw;served.set(route,{route,...source,sourceBytes:raw.length,servedBytes:value.length,servedSha256:sha(value),transformed:!!transform});res.writeHead(200,{'Content-Type':TYPES[path.extname(file)]??'application/octet-stream'});res.end(value);persist();}
 async function body(req){assert.equal(req.headers.origin,origin);assert.ok(req.headers['content-type']?.startsWith('application/json'));let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<120000);}const value=JSON.parse(text||'{}');assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value;}
 function stop(reason='signal'){if(stopped)return;stopped=true;release('stop');controls.push({sequence:++sequence,action:'stop',reason});persist();server.close(()=>{listenerClosed=true;persist();console.log('Office map fixture closed gracefully');});server.closeIdleConnections();}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);res.setHeader('Permissions-Policy','geolocation=(),camera=(),microphone=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  try{
   assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
   if(route==='/fixture/status'&&req.method==='GET'){json(res,snapshot());return;}
   if(route.startsWith('/fixture/')&&req.method==='POST'){
    const value=await body(req);if(route==='/fixture/mode'){assert.deepEqual(Object.keys(value),['mode']);assert.ok(['normal','empty','error503','hold'].includes(value.mode));nextMode=value.mode;controls.push({sequence:++sequence,action:'mode',...value});}
    else if(route==='/fixture/tiles'){assert.deepEqual(Object.keys(value),['mode']);assert.ok(['normal','error503'].includes(value.mode));tileMode=value.mode;controls.push({sequence:++sequence,action:'tiles',...value});}
    else if(route==='/fixture/release'){assert.deepEqual(value,{});release();}
    else if(route==='/fixture/observe'){assert.ok(observations.length<250);observations.push(value);}
    else if(route==='/fixture/stop'){assert.equal(value.openDialogs,0);json(res,{stopping:true});setImmediate(()=>stop('visible-fixture-control'));return;}
    else throw Error('Unknown fixture control');persist();json(res,snapshot());return;
   }
   if(route==='/fixture/page.js'&&req.method==='GET'){send(res,route,'webapp/tests/office-map-browser-page.mjs');return;}
   if(route==='/fixture/style.css'&&req.method==='GET'){res.writeHead(200,{'Content-Type':TYPES['.css']});res.end('#office-map-fixture{margin:14px 14px 110px;padding:12px;border:2px solid #927200;background:#fff8dc;color:#312b20;font:12px/1.5 system-ui;overflow-wrap:anywhere;max-width:calc(100% - 28px);box-sizing:border-box}#office-map-fixture h2{font-size:16px}#office-map-fixture button,#office-map-fixture a,#office-map-fixture select{padding:7px;margin:4px;font:inherit;max-width:100%}#office-map-fixture-status{white-space:pre-wrap;max-height:260px;overflow:auto}@media(min-width:761px){body>#office-map-fixture{margin-left:270px;max-width:calc(100% - 284px)}}');return;}
   const tile=/^\/fixture\/osm\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(route);if(tile&&req.method==='GET'){const[z,x,y]=tile.slice(1).map(Number);assert.ok(z>=0&&z<=21&&x>=0&&x<2**z&&y>=0&&y<2**z);const status=tileMode==='normal'?200:503;tiles.push({kind:'osm',z,x,y,status,bytes:status===200?TILE.length:0,...(status===200?{sha256:sha(TILE)}:{})});res.writeHead(status,{'Content-Type':status===200?'image/png':'text/plain'});res.end(status===200?TILE:'Synthetic tile unavailable');persist();return;}
   if(route==='/api/execute'&&req.method==='POST'){const iterator=req[Symbol.asyncIterator].bind(req);req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}const raw=Buffer.concat(chunks);let data;try{data=JSON.parse(raw);}catch{}browserRequests.push({sequence:++sequence,operationId:data?.operationId??null,valuesKeys:Object.keys(data?.values??{}),confirm:data?.confirm??null,bodyBytes:raw.length,bodySha256:sha(raw)});persist();};}
   if(await api.handle(req,res,route))return;
   if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
   if(route==='/'||route==='/index.html'){send(res,route,'webapp/index.html',text=>{const tag='<script type="module" src="app.js"></script>';assert.equal(text.split(tag).length,2);return text.replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace(tag,'<script src="/fixture/page.js"></script>'+tag);});return;}
   const source=statics.get(route);if(!source){res.writeHead(404);res.end();return;}
   if(source.file==='webapp/assets/maps/office-map.js'){send(res,route,source.file,text=>{const literal="const OSM='https://tile.openstreetmap.org/{z}/{x}/{y}.png';";assert.equal(text.split(literal).length,2);return text.replace(literal,"const OSM='/fixture/osm/{z}/{x}/{y}.png';");});return;}
   send(res,route,source.file);
  }catch(error){unexpected++;persist();console.error('Office map fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'OFFICE_MAP_FIXTURE_REJECTED',message:'Synthetic office request rejected.'}},400);else res.end();}
 });
 server.on('close',()=>{listenerClosed=true;api.close();persist();});
 return {origin,port,output,server,snapshot,start:async()=>{assert.equal(started,false);stable();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});started=true;persist();return snapshot();},stop};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.argv.find(value=>value.startsWith('--port='))?.slice(7)??4220),suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';
 const fixture=createOfficeMapBrowserFixture({port,suffix});await fixture.start();console.log('Office map synthetic browser: '+fixture.origin+'/#/office');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>fixture.stop(signal));
 process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')fixture.stop('stdin');});
 fixture.server.once('close',()=>process.stdin.pause());
}
