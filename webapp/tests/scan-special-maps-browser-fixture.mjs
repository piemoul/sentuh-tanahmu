// Actual webapp/API with injected, synthetic-only upstream transport.
// This fixture never forwards requests to BPN, map providers or a camera.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const root=new URL('../../',import.meta.url),defaultReceipt=new URL('analysis/webapp/scan-special-maps-browser-transport.json',root);
export const scanSpecialFixtureIds=Object.freeze({profile:'post-account-account-summary-d2939c',classify:'post-apis-scandocument-d42440',parcel:'get-legacy-getparcelboundarybyid-dbaeb8',document:'post-apis-getdocument-d41ee8',metadata:'post-apis-getdocumenttype-d417d4',geo:'get-apis-getgeojsoninfo-d39f1c',pbt:'post-apis-getpbteldetail-d3d134',kkpr:'post-apis-getkkprdetail-d311e8'});
const modes=['document-map','classifier-json','classifier-error-true','parcel','activation','classifier-503','classifier-malformed','metadata-error-true','metadata-503','metadata-malformed','metadata-string','metadata-no-route','pdf-invalid','pdf-short','pdf-503','type-pbt','type-kkpr','geo-503','profile-503','classifier-401','metadata-401','slow-classifier-success','slow-classifier-error','slow-pdf','slow-metadata','slow-geo'];
modes.push('pbt-map','pbt-error-true','pbt-malformed','pbt-503','pbt-201','pbt-empty','slow-pbt','slow-geo-pbt');
const profileNames=['profile-a','profile-b','profile-empty','profile-email','profile-none','profile-invalid'];
const user={username:'scan-user-synthetic',nomorIndukKependudukan:'scan-signin-nik-synthetic',userLevel:2,roleUser:'PERORANGAN'};
const token={tokenType:'Bearer',accessToken:'scan-fixture-token-never-real',expiredAt:4e9};
const profiles={
 'profile-a':{nama:'Pemindai A SINTETIS',email:'scan-a@example.invalid',statusVerifikasi:1},
 'profile-b':{nama:'Pemindai B SINTETIS',email:'scan-b@example.invalid',statusVerifikasi:1},
 'profile-empty':{nama:'',email:'scan-empty@example.invalid',statusVerifikasi:1},
 'profile-email':{nama:null,email:'scan-email@example.invalid',statusVerifikasi:1},
 'profile-none':{nama:null,email:null,statusVerifikasi:1},
 'profile-invalid':{nama:42,email:'scan-invalid@example.invalid',statusVerifikasi:1},
};
const parcelTarget='scan-target-not-feature-synthetic';
const coordinates=[[[106,-6],[106.0002,-6],[106.0002,-5.9998],[106,-5.9998],[106,-6]]];
const boundary={type:'FeatureCollection',features:[{type:'Feature',id:'scan-feature-not-target-synthetic',properties:{NIB:'SCAN-NIB-SINTETIS',LUAS:120,TIPEHAK:'Hak Milik SINTETIS'},geometry:{type:'Polygon',coordinates}}]};
const documentGeo={tipeHak:'Hak Milik SINTETIS',geometri:{type:'MultiPolygon',coordinates:[coordinates]}};
const pbtModel={nomor:'PBT SINTETIS 001',kantor:'Kantor SINTETIS',daftarBidangTanah:[
 {nib:'NIB SINTETIS 001',lokasi:'Lokasi A SINTETIS',luas:'120.50',noBerkas:'1/2026',batas:{id:'SYNTHETIC-A',tipeHak:'SINTETIS',geometri:{type:'MultiPolygon',coordinates:[coordinates]}}},
 {nib:'NIB DUPLIKAT SINTETIS',lokasi:'Lokasi duplikat SINTETIS',luas:'44',noBerkas:'2/2026',batas:{id:'SYNTHETIC-A',geometri:{type:'MultiPolygon',coordinates:[[[[108,-4],[108.001,-4],[108,-3.999],[108,-4]]]]}}},
 {nib:'NIB TANPA GEOMETRI',lokasi:null,luas:'0',noBerkas:'',batas:null},
 {nib:'NIB SINTETIS 002',lokasi:'Lokasi B SINTETIS',luas:'200',noBerkas:'3/2026',batas:{id:'SYNTHETIC-B',geometri:{type:'MultiPolygon',coordinates:[[[[107,-5],[107.002,-5],[107,-4.998],[107,-5]]]]}}},
]};
const pbtModes=new Set(['pbt-map','pbt-error-true','pbt-malformed','pbt-503','pbt-201','pbt-empty','slow-pbt','slow-geo-pbt']);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function crc32(bytes){let value=0xffffffff;for(const byte of bytes){value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;}
function chunk(name,bytes){const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([type,bytes])));return Buffer.concat([length,type,bytes,crc]);}
function localPng(){const h=Buffer.alloc(13);h.writeUInt32BE(1,0);h.writeUInt32BE(1,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(Buffer.from([0,214,225,212,255]))),chunk('IEND',Buffer.alloc(0))]);}
function localPdf(){const content='BT /F1 16 Tf 40 100 Td (DOKUMEN SCAN SINTETIS LOKAL) Tj ET';const bodies=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];let pdf='%PDF-1.4\n',offsets=[0];bodies.forEach((body,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${body}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 ${bodies.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${bodies.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(pdf);}
const png=localPng(),pdf=localPdf();

export function createScanSpecialMapsFixture({port=4190,receiptFile=defaultReceipt}={}){
 assert.ok(Number.isInteger(port)&&port>=0&&port<=65535);
 if(receiptFile!==null)assert.ok(path.basename(receiptFile instanceof URL?fileURLToPath(receiptFile):receiptFile).startsWith('scan-special-maps-'));
 const calls=[],controls=[],unexpected=[],pending=[],browserRequests=[],tileRequests=[],attempts=[];
 let mode='document-map',profile='profile-a',sequence=0,autoAuth=true,stopped=false,clockOffset=0;
 const captures=new Map(),sessions=new SessionStore(),create=sessions.create.bind(sessions);
 sessions.create=()=>{const value=create();if(autoAuth){autoAuth=false;value.user={...user};value.tokens={...token};}return value;};
 const activePort=()=>server.address()?.port??port;
 const state=()=>({mode,profile,calls:calls.length,classifierWrites:calls.filter(item=>item.path==='/apis/scanDocument').length,pending:pending.length,unexpected:unexpected.length,productionRequests:0,providerRequests:0});
 const snapshot=()=>({checkedAt:new Date().toISOString(),fixture:'scan-special-maps-synthetic-loopback',port:activePort(),inputs:['webapp/app.js','webapp/styles.css','webapp/scan-controller.js','webapp/scan-location.js','webapp/assets/maps/official-map.js','webapp/private/scan-map-response.mjs','webapp/private/api-client.mjs','webapp/private/http-api.mjs','webapp/private/operations.mjs'].filter(file=>fs.existsSync(new URL(file,root))).map(file=>({file,sha256:digest(fs.readFileSync(new URL(file,root)))})),calls,controls,attempts,browserRequests,tileRequests,pendingResponses:pending.map(item=>({id:item.call.id,path:item.call.path,capturedMode:item.captured})),unexpected,serverState:state(),productionRequests:0,providerRequests:0,networkTransportUsed:false,cameraAccessed:false,modeScope:'Response scenarios are synthetic. Slow responses capture their original mode and release explicitly. Classifier is the only exposed write capability; activation/geotag and collection writes are absent.',mapAdaptation:'Only fixed OSM tile URL is rewritten in the served test response; OSM/Bhumi use CRC-valid local one-pixel PNGs. Production map source and providers are unchanged.',redaction:'Raw q, scan-context references, cookies, CSRF and tokens are excluded. Request code length and SHA256 permit synthetic fidelity checks. Names are from a fixed synthetic profile allowlist.'});
 const persist=()=>{if(receiptFile!==null){const file=receiptFile instanceof URL?fileURLToPath(receiptFile):path.resolve(receiptFile);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(snapshot(),null,2)+'\n');}};
 const reject=(kind,value)=>{unexpected.push({sequence:++sequence,kind,value});persist();throw new Error('Outside Scan synthetic fixture scope');};
 const catalog=operations.getPublicCatalog().filter(item=>item.enabled&&Object.values(scanSpecialFixtureIds).includes(item.id));assert.equal(catalog.length,8);assert.equal(catalog.filter(item=>item.effect==='write').length,1);assert.equal(catalog.find(item=>item.effect==='write').id,scanSpecialFixtureIds.classify);
 const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!catalog.some(item=>item.id===id))throw Object.assign(new Error('Outside Scan synthetic fixture scope'),{status:403,code:'FIXTURE_REJECTED'});return operations.prepareOperation(id,values,context);}};
 function response(call,captured,values,capturedProfile){
  let result;
  if(call.path==='/account/account_summary')result=captured==='profile-503'?Response.json({message:'Profil SINTETIS gagal'},{status:503}):Response.json({error:false,data:structuredClone(profiles[capturedProfile])});
  else if(call.path==='/apis/scanDocument'){
   const message=captured==='parcel'?'GetParcelBoundaryById':captured==='activation'?'AktivasiBerkasGeotag':'DocumentSynthetic';
   const model={error:captured==='classifier-error-true',message,data:captured==='parcel'?parcelTarget:'scan-classified-not-original-synthetic'};
   if(['classifier-503','slow-classifier-error'].includes(captured))result=Response.json({error:true,message:'SINTETIS tidak tersedia'},{status:503});
   else if(captured==='classifier-401')result=Response.json({error:true},{status:401});
   else if(captured==='classifier-malformed')result=Response.json({error:[],message:17,data:null});
   else result=Response.json(captured==='classifier-json'?JSON.stringify(model):model);
   attempts.push({sequence:++sequence,qSha256:digest(values.q),name:values.name,classificationMode:captured,status:result.status});
  }else if(call.path==='/legacy/GetParcelBoundaryById')result=Response.json(boundary);
  else if(call.path==='/apis/GetDocument')result=captured==='pdf-503'?Response.json({error:true},{status:503}):new Response(captured==='pdf-invalid'?Buffer.alloc(250,65):captured==='pdf-short'?Buffer.from('%PDF-1.4\n'):pdf,{headers:{'Content-Type':'application/pdf'}});
  else if(call.path==='/apis/GetDocumentType'){
   const data={error:captured==='metadata-error-true',data:{showRoute:captured==='metadata-no-route'?0:1,type:captured==='type-pbt'||pbtModes.has(captured)?'PetaBidangElektronik':captured==='type-kkpr'?'KKPR':'DokumenSINTETIS'}};
   result=captured==='metadata-503'?Response.json({error:true},{status:503}):captured==='metadata-401'?Response.json({error:true},{status:401}):captured==='metadata-malformed'?Response.json({error:false,data:{showRoute:'1',type:'DokumenSINTETIS'}}):Response.json(captured==='metadata-string'?JSON.stringify(data):data);
  }else if(call.path==='/apis/GetPBTElDetail'){
   const data=structuredClone(pbtModel);
   if(captured==='pbt-malformed')data.daftarBidangTanah[0].batas.geometri.coordinates[0][0][0][0]='invalid coordinate SINTETIS';
   if(captured==='pbt-empty')data.daftarBidangTanah=null;
   result=Response.json({error:captured==='pbt-error-true',data},{status:captured==='pbt-503'?503:captured==='pbt-201'?201:200});
  }else if(call.path==='/apis/GetKKPRDetail')result=Response.json({error:false,data:{status:true,textualData:null,geometryData:null}});
  else if(call.path==='/apis/getGeoJsonInfo')result=captured==='geo-503'?Response.json({error:true},{status:503}):Response.json(documentGeo);
  else return reject('transport',call.path);
  Object.assign(call,{status:result.status,completed:true,completedSequence:++sequence});persist();return result;
 }
 const server=createServer({configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL, tanpa BPN',applicationAuthorization:()=> 'AtrBpn fixture-only'},publicOrigin:'',sessions,registry,now:()=>Date.now()+clockOffset,log:()=>{},bhumiTransport:async()=>reject('provider','Bhumi transport must not run'),transport:async(url,init)=>{try{
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');assert.equal(init.headers.Authorization,`Bearer ${token.accessToken}`);
  const values=init.body instanceof URLSearchParams?Object.fromEntries(init.body):typeof init.body==='string'?Object.fromEntries(new URLSearchParams(init.body)):{};
  const q=Object.hasOwn(values,'q')?values.q:url.searchParams.get('q');
  const call={id:'scan-call-'+calls.length,sequence:++sequence,method:init.method,path:url.pathname,queryKeys:[...url.searchParams.keys()],fields:Object.keys(values),mode,...(q!==null&&q!==undefined?{qCharacters:q.length,qSha256:digest(q)}:{}),...(Object.hasOwn(values,'name')?{name:values.name}:{})};calls.push(call);persist();
  if(url.pathname==='/account/account_summary'){assert.equal(init.method,'POST');assert.deepEqual(values,{appVersion:'6.1.5'});assert.equal(url.search,'');}
  else if(['/apis/scanDocument','/apis/GetDocument','/apis/GetDocumentType'].includes(url.pathname)){
   assert.equal(init.method,'POST');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual(Object.keys(values),url.pathname==='/apis/GetDocumentType'?['q']:['q','name']);assert.equal(url.search,'');assert.equal(typeof values.q,'string');
   if(url.pathname==='/apis/scanDocument'){const expected=profiles[profile].nama??profiles[profile].email??'-';assert.equal(values.name,expected);assert.equal(typeof expected,'string');let names=captures.get(values.q);if(!names){names=new Set();captures.set(values.q,names);}names.add(values.name);}
   if(url.pathname==='/apis/GetDocument')assert.ok(captures.get(values.q)?.has(values.name),'Document name must be captured by a prior real classifier context');
  }else if(['/apis/GetPBTElDetail','/apis/GetKKPRDetail'].includes(url.pathname)){
   assert.equal(init.method,'POST');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual(Object.keys(values),['q']);assert.equal(url.search,'');assert.equal(typeof values.q,'string');assert.ok(captures.has(values.q),'Special map must retain captured raw document code');
  }else if(url.pathname==='/legacy/GetParcelBoundaryById'){assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.deepEqual([...url.searchParams],[['persilid',parcelTarget]]);}
  else if(url.pathname==='/apis/getGeoJsonInfo'){assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.deepEqual([...url.searchParams.keys()],['q']);assert.ok(captures.has(decodeURIComponent(url.searchParams.get('q'))),'Generic document q retains native double encoding');}
  else return reject('transport',url.pathname);
  const captured=mode,capturedProfile=profile,slow=(captured.startsWith('slow-classifier')&&url.pathname==='/apis/scanDocument')||(captured==='slow-pdf'&&url.pathname==='/apis/GetDocument')||(captured==='slow-metadata'&&url.pathname==='/apis/GetDocumentType')||(captured==='slow-geo'&&url.pathname==='/apis/getGeoJsonInfo')||(captured==='slow-pbt'&&url.pathname==='/apis/GetPBTElDetail')||(captured==='slow-geo-pbt'&&url.pathname==='/apis/getGeoJsonInfo');
  if(!slow)return response(call,captured,values,capturedProfile);
  return new Promise((resolve,rejectPromise)=>{const item={call,captured,release(){pending.splice(pending.indexOf(item),1);resolve(response(call,captured,values,capturedProfile));persist();},cancel(){pending.splice(pending.indexOf(item),1);call.aborted=true;persist();rejectPromise(new DOMException('Synthetic request cancelled','AbortError'));}};pending.push(item);persist();});
 }catch(error){if(error?.code==='ERR_ASSERTION'){unexpected.push({sequence:++sequence,kind:'transport-contract',path:url.pathname,message:'Synthetic transport contract assertion failed; raw diagnostics withheld'});persist();}throw error;}
 }});
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 const panel='<aside id="fixture-controls"><strong>PBT · SINTETIS LOKAL</strong><p>Tanpa server BPN, provider peta atau akses kamera. Tempel kode sintetis, lalu Buka hasil. PBT membuka detail khusus dan lokasi dokumen independen. Semua data dan tile di sini sintetis; bukan hasil server atau kunjungan.</p><label>Mode<select id="fixture-mode">'+modes.map(value=>'<option>'+value+'</option>').join('')+'</select></label><button id="fixture-set-mode">Terapkan mode</button><label>Profil sintetis<select id="fixture-profile">'+profileNames.map(value=>'<option>'+value+'</option>').join('')+'</select></label><button id="fixture-set-profile">Terapkan profil</button><button id="fixture-release">Lepaskan respons tertunda</button><button id="fixture-reset">Atur ulang sesi sintetis</button><details><summary>Status sintetis</summary><output id="fixture-status"></output></details></aside>';
 const script=`const host=document.createElement('div');host.innerHTML=${JSON.stringify(panel)};const panel=host.firstElementChild,modal=document.getElementById('modal');document.body.append(panel);function place(){if(!modal)return;const parent=modal.open?modal:document.body;if(panel.parentElement!==parent)parent.append(panel);}if(modal)new MutationObserver(place).observe(modal,{childList:true,attributes:true,attributeFilter:['open']});async function update(){const data=await(await fetch('/fixture/status')).json();document.getElementById('fixture-status').textContent=JSON.stringify(data);document.getElementById('fixture-release').disabled=!data.pending;}async function command(action){await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,mode:document.getElementById('fixture-mode').value,profile:document.getElementById('fixture-profile').value})});if(action==='reset'){location.hash='/scan';location.reload();}else await update();}document.getElementById('fixture-set-mode').onclick=()=>command('mode');document.getElementById('fixture-set-profile').onclick=()=>command('profile');document.getElementById('fixture-release').onclick=()=>command('release');document.getElementById('fixture-reset').onclick=()=>command('reset');setInterval(update,700);await update();`;
 const css='#fixture-controls{margin:12px;padding:12px;border:2px solid #205073;background:#edf6ff;font:12px system-ui;overflow-wrap:anywhere}#fixture-controls select,#fixture-controls button{max-width:100%;padding:7px;margin:4px;font:inherit}#fixture-status{display:block;white-space:pre-wrap;max-height:140px;overflow:auto}@media(min-width:761px){body>#fixture-controls{margin-left:calc(var(--sidebar,252px) + 12px)}}';
 const listener=server.listeners('request')[0];server.removeAllListeners('request');
 server.on('request',async(req,res)=>{try{
  const origin='http://127.0.0.1:'+activePort();if(req.headers.host!=='127.0.0.1:'+activePort()){res.writeHead(403);res.end();return;}const url=new URL(req.url,origin);browserRequests.push({sequence:++sequence,method:req.method,path:url.pathname.startsWith('/api/preview/')?'/api/preview/[opaque]':url.pathname.startsWith('/api/download/')?'/api/download/[opaque]':url.pathname});
  if(req.headers['sec-fetch-site']==='cross-site'||req.headers.origin&&req.headers.origin!==origin){json(res,403,{});return;}
  if(url.pathname==='/fixture/status'&&req.method==='GET'){json(res,200,state());return;}
  if(url.pathname==='/fixture/control'&&req.method==='POST'){
   if(req.headers.origin!==origin){json(res,403,{});return;}let bytes='';for await(const part of req){bytes+=part;if(bytes.length>2048){json(res,413,{});return;}}let value;try{value=JSON.parse(bytes);}catch{json(res,400,{});return;}
   if(!value||!['mode','release','reset','profile','replace-user','replace-tokens','expire-context'].includes(value.action)||value.mode!==undefined&&!modes.includes(value.mode)||value.profile!==undefined&&!profileNames.includes(value.profile)||Object.keys(value).some(key=>!['mode','action','profile'].includes(key))||value.action==='mode'&&!modes.includes(value.mode)||value.action==='profile'&&!profileNames.includes(value.profile)){json(res,400,{});return;}
   controls.push({sequence:++sequence,...value});if(value.action==='mode')mode=value.mode;if(value.action==='profile')profile=value.profile;if(value.action==='release')pending[0]?.release();if(value.action==='replace-user')for(const session of sessions.sessions.values())if(session.user)session.user={...session.user};if(value.action==='replace-tokens')for(const session of sessions.sessions.values())if(session.tokens)session.tokens={...session.tokens};if(value.action==='expire-context')clockOffset+=121_000;
   if(value.action==='reset'){for(const item of [...pending])item.cancel();for(const id of [...sessions.sessions.keys()])sessions.delete(id);autoAuth=true;mode='document-map';profile='profile-a';clockOffset=0;captures.clear();}persist();json(res,200,state());return;
  }
  if(url.pathname==='/fixture/controls.js'||url.pathname==='/fixture/controls.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?script:css);return;}
  if(url.pathname==='/'&&req.method==='GET'){const html=fs.readFileSync(new URL('webapp/index.html',root),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
  if(url.pathname==='/assets/maps/official-map.js'){const module=fs.readFileSync(new URL('webapp/assets/maps/official-map.js',root),'utf8'),needle='https://tile.openstreetmap.org/{z}/{x}/{y}.png';assert.equal(module.split(needle).length,2);res.writeHead(200,{'Content-Type':'text/javascript'});res.end(module.replace(needle,'/fixture/osm/{z}/{x}/{y}.png'));return;}
  if(/^\/fixture\/osm\/\d+\/\d+\/\d+\.png$/.test(url.pathname)||/^\/api\/maps\/bhumi\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){tileRequests.push({path:url.pathname});persist();res.writeHead(200,{'Content-Type':'image/png'});res.end(png);return;}
  return listener(req,res);
 }catch{unexpected.push({sequence:++sequence,kind:'fixture-handler',path:(req.url||'').split('?')[0]});persist();if(!res.headersSent)json(res,500,{fixtureError:'Synthetic Scan fixture rejected request'});else res.end();}});
 const stop=async()=>{if(stopped)return;stopped=true;for(const item of [...pending])item.cancel();persist();if(server.listening)await new Promise(resolve=>{server.closeAllConnections();server.close(resolve);});};
 return{server,snapshot,start:()=>new Promise((resolve,rejectPromise)=>{server.once('error',rejectPromise);server.listen(port,'127.0.0.1',()=>{server.removeListener('error',rejectPromise);persist();resolve({base:'http://127.0.0.1:'+activePort(),...state()});});}),stop};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const fixture=createScanSpecialMapsFixture();await fixture.start();console.log('Synthetic Scan pipeline fixture on 127.0.0.1:4190; no providers or camera.');process.once('SIGINT',()=>void fixture.stop());process.once('SIGTERM',()=>void fixture.stop());}
