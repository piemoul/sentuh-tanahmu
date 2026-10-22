// Additive local fixture: actual current app/assets; five synthetic Mitra GETs.
// No provider, production, browser-automation, auth, GPS or mutation operation.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {getPublicCatalog} from '../private/operations.mjs';
import {prepareMitraQuery,decodeMitraBytes} from '../private/mitra-response.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url)),web=path.join(repo,'webapp'),port=4215,origin='http://localhost:'+port;
const suffix=process.argv.find(value=>value.startsWith('--suffix='))?.slice(9)??'initial';assert.match(suffix,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const output=`analysis/webapp/mitra-menu-browser-transport-${suffix}.json`;assert.ok(!fs.existsSync(path.join(repo,output)),'Preserve prior receipt; choose a new suffix');
const bytes=file=>fs.readFileSync(path.join(repo,file)),sha=value=>createHash('sha256').update(value).digest('hex'),inputs=new Map(),served=new Map();
function pin(file){if(!inputs.has(file))inputs.set(file,{file,sha256:sha(bytes(file))});return inputs.get(file);}
const baselineFile='analysis/webapp/lost-review-baseline.json',baseline=JSON.parse(bytes(baselineFile));assert.equal(baseline.runtime.length,91);
const additions=['webapp/private/lost-review-response.mjs','webapp/assets/lost-review/model.js','webapp/assets/lost-review/controller.js','webapp/assets/lost-review/view.js','webapp/assets/lost-review/empty.png','webapp/private/lost-review-post.mjs','webapp/assets/lost-review/compose-controller.js','webapp/assets/lost-review/compose-view.js','webapp/assets/lost-review/compose-host.js','webapp/private/mitra-response.mjs'];
const runtime=[...new Set([...baseline.runtime.map(row=>row.file),...additions])];assert.equal(runtime.length,101);
for(const file of [...runtime,baselineFile,'webapp/tests/mitra-menu-browser-fixture.mjs','webapp/tests/mitra-menu-browser-page.mjs','analysis/MITRA-FLOW.md','analysis/recovered/mitra-flow.json','analysis/recovered/mitra-ppat/ppat-flow.json','analysis/recovered/mitra-surveyor/surveyor-parent-flow.json','analysis/recovered/mitra-surveyor/surveyor-display-contracts.json'])pin(file);
const staticInputs=new Map();function inventory(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())inventory(full);else if(entry.isFile()){const file=path.relative(repo,full).split(path.sep).join('/');staticInputs.set('/'+file.slice(7),pin(file));}}}inventory(path.join(web,'assets'));
for(const entry of fs.readdirSync(web,{withFileTypes:true}))if(entry.isFile()&&/\.(?:js|css|html|json)$/.test(entry.name)){const file='webapp/'+entry.name;staticInputs.set('/'+entry.name,pin(file));}
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'";
const recipes={offices:{id:'get-mitra-getkantorppat-d3af08',endpoint:'Mitra/GetKantorPPAT',field:null},ppat:{id:'get-mitra-getppatlist-d3b428',endpoint:'Mitra/GetPPATList?kantorId={value}',field:'kantorId'},provinces:{id:'get-mitra-getwilayahsurveyor-d3b910',endpoint:'Mitra/GetWilayahSurveyor',field:null},surveyor:{id:'get-mitra-getsurveyorlist-d3be30',endpoint:'Mitra/GetSurveyorList?wilayahId={value}',field:'wilayahId'},valuers:{id:'get-mitra-getpenilailist-d3aa20',endpoint:'Mitra/GetPenilaiList',field:null}};
const catalog=getPublicCatalog();for(const recipe of Object.values(recipes)){const op=catalog.find(row=>row.id===recipe.id);assert.ok(op?.enabled&&op.effect==='read'&&op.method==='GET'&&op.auth==='optionalSession'&&op.encoding==='none'&&op.endpoint===recipe.endpoint);}
const offices=[
 {kantorId:' synthetic-office-raw ',nama:'Kantor Pertanahan Alpha SINTETIS',kode:'RAW'},
 {kantorId:'',nama:'Kantor Pertanahan ID Kosong SINTETIS',kode:null},
 {kantorId:'   ',nama:'Kantor Pertanahan ID Spasi SINTETIS',kode:null},
 {kantorId:null,nama:'Kantor Pertanahan ID Null SINTETIS',kode:null},
 {kantorId:'synthetic-office-null-name',nama:null,kode:null},
 {kantorId:'synthetic-office-markup',nama:'Kantor Pertanahan <img src=x onerror="fixtureOnly()">',kode:null},
 {kantorId:' synthetic-office-raw ',nama:'Kantor Pertanahan Referensi Duplikat SINTETIS',kode:null},
 ...Array.from({length:19},(_,index)=>({kantorId:'synthetic-office-'+index,nama:'Kantor Pertanahan Nomor '+index+' SINTETIS',kode:'K'+index})),
];
const provinces=[{wilayahId:' synthetic-province-raw ',nama:'Provinsi Alpha SINTETIS'},{wilayahId:'',nama:'Provinsi ID Kosong SINTETIS'},{wilayahId:'   ',nama:'Provinsi ID Spasi SINTETIS'},{wilayahId:null,nama:'Provinsi ID Null SINTETIS'},{wilayahId:'synthetic-province-null-name',nama:null},{wilayahId:'synthetic-province-markup',nama:'<script>fixtureOnly()</script>'}];
const ppatRows=[
 ...['0','1','10','11','30','31','50','51','100','101','-1','invalid',' 10 ','0xA','9223372036854775808'].map((count,index)=>({nama:'PPAT '+index+' SINTETIS',alamatKantor:index===0?'Alamat Cari SINTETIS':'Alamat '+index+' SINTETIS',tmtPensiun:index===0?'RAW tanggal tanpa parser':'31-12-2030',totalAkta:count,isPPAT:'1',nomorSK:'SK SINTETIS '+index,tempatKedudukan:null,status:'1'})),
 {nama:'PPATS SINTETIS',alamatKantor:'Alamat Asisten SINTETIS',tmtPensiun:null,totalAkta:'10',isPPAT:'0',nomorSK:null,tempatKedudukan:null,status:null},
 {nama:null,alamatKantor:null,tmtPensiun:null,totalAkta:null,isPPAT:'0',nomorSK:null,tempatKedudukan:null,status:null},
 {nama:'<img onerror=fixtureOnly()>',alamatKantor:'<script>fixtureOnly()</script>',tmtPensiun:'<raw>',totalAkta:'11',isPPAT:'1',nomorSK:'<SK>',tempatKedudukan:null,status:null},
 {nama:'Tidak Cocok Jenis SINTETIS',alamatKantor:null,tmtPensiun:null,totalAkta:null,isPPAT:null,nomorSK:null,tempatKedudukan:null,status:null},
];
const surveyorRows=[{nama:'Surveyor Alpha SINTETIS',jenisSurveyor:'Surveyor Kadaster',nomorLisensi:'LIS RAW 01'},{nama:'Surveyor Beta SINTETIS',jenisSurveyor:'Surveyor Kadaster',nomorLisensi:null},{nama:'Asisten Alpha SINTETIS',jenisSurveyor:'Asisten Surveyor Kadaster',nomorLisensi:'LIS ASISTEN'},{nama:null,jenisSurveyor:'Asisten Surveyor Kadaster',nomorLisensi:null},{nama:'<script>fixtureOnly()</script>',jenisSurveyor:'Surveyor Kadaster',nomorLisensi:'<LISENSI>'},{nama:'Jenis Lain SINTETIS',jenisSurveyor:'surveyor kadaster',nomorLisensi:'hidden'}];
const valuers=[{nama:'Penilai Alpha SINTETIS'},{nama:'Penilai Beta SINTETIS'},{nama:null},{nama:'<img src=x onerror=fixtureOnly()>'},{nama:'  Nama Ber-spasi SINTETIS  '}];
const dataFor=kind=>structuredClone({offices,ppat:ppatRows,provinces,surveyor:surveyorRows,valuers}[kind]);
const calls=[],controls=[],observations=[],nextModes=new Map(),held=new Map();let unexpected=0,stopped=false,listenerClosed=false;
function stable(){for(const row of inputs.values())assert.equal(sha(bytes(row.file)),row.sha256,'Input changed while live: '+row.file);}
function snapshot(){return{calls:[...calls],controls:[...controls],held:[...held.keys()],nextModes:Object.fromEntries(nextModes),observations:observations.length,unexpected,stopped,listenerClosed,authenticated:false};}
function persist(){stable();fs.writeFileSync(path.join(repo,output),JSON.stringify({schemaVersion:1,checkedAt:new Date().toISOString(),origin,port,suffix,scope:'Current packaged frontend and actual pure Mitra query/byte decoders with synthetic local five-GET responses. Full HTTP/provider/auth handling has separate Node evidence; this is not production acceptance. Only index appends visible fixture controls. No network/provider/auth/GPS/write operation is executed.',baseline:pin(baselineFile),baselineRuntimeCount:91,runtime:runtime.map(file=>pin(file)),runtimeFileCount:runtime.length,inputs:[...inputs.values()],servedInputs:[...served.values()],servedTransforms:[{file:'webapp/index.html',kind:'append-visible-fixture-controls'}],fixtureCsp:csp,recipes,calls,controls,observations,held:[...held.keys()],nextModes:Object.fromEntries(nextModes),unexpected,stopped,listenerClosed,productionRequests:0,providerRequests:0,writeRequests:0,hardwarePermissionRequests:0},null,2)+'\n',{flag:fs.existsSync(path.join(repo,output))?'w':'wx'});}
function json(res,value,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
async function body(req){assert.equal(req.headers.origin,origin);assert.ok(String(req.headers['content-type']).startsWith('application/json'));let text='';for await(const chunk of req){text+=chunk;assert.ok(text.length<50000);}const data=JSON.parse(text||'{}');assert.ok(data&&typeof data==='object'&&!Array.isArray(data));return data;}
function releaseHeld(reason){const released=[...held.keys()];for(const row of held.values())row.release(reason);controls.push({action:'release',reason,released});return released;}
async function hold(call){const reason=await new Promise(resolve=>{const timer=setTimeout(()=>{held.delete(call.sequence);resolve('timeout');},45000);held.set(call.sequence,{release:reason=>{clearTimeout(timer);held.delete(call.sequence);resolve(reason);}});persist();});call.releaseReason=reason;return reason;}
function stop(reason){if(stopped)return;stopped=true;releaseHeld('stop');controls.push({action:'stop',reason});persist();server.close(()=>{listenerClosed=true;persist();console.log('Mitra fixture closed gracefully');});server.closeIdleConnections();}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.ttf':'font/ttf','.otf':'font/otf','.ico':'image/x-icon'};
function sendFile(res,route,file,transformed=null){const source=pin(file);assert.equal(sha(bytes(file)),source.sha256);const value=transformed===null?bytes(file):Buffer.from(transformed);served.set(route,{route,...source,servedSha256:sha(value),transformed:transformed!==null});res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream'});res.end(value);persist();}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), autoplay=()');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 try{
  assert.equal(req.headers.host,'localhost:'+port);const route=new URL(req.url,origin).pathname;
  if(req.method==='GET'&&route==='/fixture/status'){json(res,snapshot());return;}
  if(req.method==='POST'&&route.startsWith('/fixture/')){
   const data=await body(req);
   if(route==='/fixture/observe'){assert.ok(observations.length<180);observations.push(data);persist();json(res,snapshot());return;}
   if(route==='/fixture/mode'){assert.deepEqual(Object.keys(data),['kind','mode']);assert.ok(Object.hasOwn(recipes,data.kind));assert.ok(['normal','string','empty','error','malformed','hold','hold401'].includes(data.mode));nextModes.set(data.kind,data.mode);controls.push({action:'mode',...data});persist();json(res,snapshot());return;}
   if(route==='/fixture/release'){assert.deepEqual(data,{});releaseHeld('control');persist();json(res,snapshot());return;}
   if(route==='/fixture/stop'){assert.deepEqual(data,{route:'#/partners',openDialogs:0,hasChild:false});json(res,{stopping:true});setImmediate(()=>stop('visible-stop-after-parent-return'));return;}
   throw Error('Unexpected fixture control');
  }
  if(req.method==='GET'&&route==='/api/state'){json(res,{csrfToken:'fixture-mitra-csrf',authenticated:false,user:null,connection:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL'},version:'6.1.5',capabilities:{}});return;}
  if(req.method==='GET'&&route==='/api/catalog'){json(res,{operations:catalog});return;}
  if(req.method==='POST'&&route==='/api/execute'){
   assert.equal(req.headers['x-csrf-token'],'fixture-mitra-csrf');const data=await body(req);assert.deepEqual(Object.keys(data).sort(),['operationId','values']);const kind=Object.keys(recipes).find(key=>recipes[key].id===data.operationId);assert.ok(kind,'Unexpected operation');assert.ok(calls.length<150);const recipe=recipes[kind];
   if(recipe.field){assert.deepEqual(Object.keys(data.values),[recipe.field]);assert.equal(typeof data.values[recipe.field],'string');const source=kind==='ppat'?offices:provinces;assert.ok(source.some(row=>(row[recipe.field]??'')===data.values[recipe.field]),'ID must come from an original fixture parent row');}else assert.deepEqual(data.values,{});const nativePath=recipe.endpoint.split('?')[0],preparedQuery=prepareMitraQuery(nativePath,data.values);assert.deepEqual(Object.entries(preparedQuery),Object.entries(data.values));
   const mode=nextModes.get(kind)??'normal';nextModes.delete(kind);const sequence=calls.length+1,responseTag=`RESP${sequence}`,rows=mode==='empty'?[]:dataFor(kind);if(recipe.field)for(const row of rows)if(typeof row.nama==='string')row.nama+=' · '+responseTag;if(mode==='malformed'&&rows.length){const key={offices:'kode',ppat:'status',provinces:'wilayahId',surveyor:'nomorLisensi',valuers:'nama'}[kind];rows[0][key]=42;}
   const call={sequence,kind,operationId:data.operationId,providerMethod:'GET',endpoint:recipe.endpoint,values:data.values,mode,status:mode==='error'?503:mode==='hold401'?401:200,responseError:true,responseRows:rows.length,responseTag:recipe.field?responseTag:null,completed:false};calls.push(call);persist();
   if(mode==='hold'||mode==='hold401'){const reason=await hold(call);if(reason!=='control')call.status=503;}
   if(call.status!==200)json(res,{error:{code:call.status===401?'SESSION_EXPIRED':'UPSTREAM_TIMEOUT',message:'Pembacaan Mitra SINTETIS gagal.'}},call.status);
   else{const envelope={error:true,message:'SYNTHETIC error flag intentionally ignored',data:rows},wire=Buffer.from(JSON.stringify(mode==='string'?JSON.stringify(envelope):envelope));call.syntheticWireSha256=sha(wire);call.syntheticWireBytes=wire.length;call.serviceStringDecode=mode==='string';try{const projected=decodeMitraBytes(wire,'application/json; charset=utf-8',nativePath);call.decodedRows=projected.data.length;call.apiStatus=200;json(res,{result:{status:200,data:projected}});}catch(error){call.apiStatus=502;call.decodeError=error.code;json(res,{error:{code:error.code,message:error.message,details:{upstreamStatus:200}}},502);}}
   call.completed=true;persist();return;
  }
  if(route.startsWith('/api/'))throw Error('Unexpected API route');if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(route==='/fixture/page.js'){sendFile(res,route,'webapp/tests/mitra-menu-browser-page.mjs');return;}
  if(route==='/fixture/style.css'){res.writeHead(200,{'Content-Type':types['.css']});res.end('#mitra-fixture{padding:12px;margin:10px;border:2px solid #927200;background:#fff8dc;font:12px/1.5 system-ui;color:#312b20}#mitra-fixture h2{font-size:15px}#mitra-fixture button,#mitra-fixture a,#mitra-fixture select{padding:6px;margin:4px;font:inherit}#mitra-fixture-status{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto}@media(min-width:761px){body>#mitra-fixture{margin-left:270px}}');return;}
  if(route==='/'){const html=bytes('webapp/index.html').toString().replace('</head>','<link rel="stylesheet" href="/fixture/style.css"></head>').replace('</body>','<script type="module" src="/fixture/page.js"></script></body>');sendFile(res,route,'webapp/index.html',html);return;}
  const file=staticInputs.get(route);if(!file){res.writeHead(404);res.end();return;}assert.ok(fs.realpathSync(path.join(repo,file.file)).startsWith(fs.realpathSync(web)+path.sep));sendFile(res,route,file.file);
 }catch(error){unexpected++;persist();console.error('Mitra fixture rejected:',error.message);if(!res.headersSent)json(res,{error:{code:'FIXTURE_REJECTED',message:'Permintaan tidak diizinkan pada fixture Mitra.'}},400);else res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});persist();console.log('Mitra fixture '+origin+'/#/partners');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>stop(signal));
