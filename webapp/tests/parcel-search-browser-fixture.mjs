// Actual UI/API with injected synthetic-only parcel reads and local map tiles.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
const root=new URL('../../',import.meta.url),receipt=new URL('analysis/webapp/parcel-search-browser-transport.json',root);
assert.ok(!fs.existsSync(receipt),'Preserve existing receipt');
let mode='found',stopped=false,executeRequests=0;const calls=[],controls=[],tiles=[],unexpected=[],pending=[];
const target=' SYNTHETIC /:?#% Parcel ID ';
const offices=[{KantorId:'main-A',Nama:'Kantor SINTETIS A'},{KantorId:'main-B',Nama:'Kantor SINTETIS B'}];
const regions=[{Kode:'WRONG-KODE',Nama:'Desa SINTETIS',TipeWilayah:'Desa',WilayahId:'REFERENCE-WILAYAH-ID'}];
const boundary={type:'FeatureCollection',features:[{type:'Feature',id:'NOT-LOOKUP-ID',properties:{NIB:'NIB SINTETIS',LUAS:123,TIPEHAK:'Hak Milik SINTETIS'},geometry:{type:'Polygon',coordinates:[[[106,-6],[106.0002,-6],[106.0002,-5.9998],[106,-5.9998],[106,-6]]]}}]};
const parcel=id=>({Alamat:null,BatasPersil:1,BatasPersilLegal:2,Luas:123,NamaWilayah:null,NomorIndukBidang:null,PersilId:id,TipeWilayah:null});
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),mode,stopped,calls,controls,tiles,unexpected,pending:pending.length,executeRequests,productionRequests:0,providerRequests:0,identitySubmissions:0,bookingSubmissions:0,geotagSubmissions:0,mapAdaptation:'Only served fixed OSM URL redirected to local synthetic tiles; both map layers use a valid local single-pixel PNG. Runtime source unchanged.',scope:'Synthetic account_summary and five fixed parcel GETs only; no production/provider/camera/geolocation.'},null,2)+'\n');
const sessions=new SessionStore(),create=sessions.create.bind(sessions);let first=true;
sessions.create=()=>{const s=create();if(first){first=false;s.user={username:'parcel-SYNTHETIC',userLevel:2,roleUser:'PERORANGAN'};s.tokens={tokenType:'Bearer',accessToken:'fixture-never-real',expiredAt:4e9};}return s;};
const reject=async()=>{unexpected.push('unexpected provider');persist();throw Error('No production transport');};
const server=createServer({sessions,configuration:{configured:true,reason:'SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-only'},log:()=>{},queueTransport:reject,bhumiTransport:reject,transport:async(input,init)=>{
 const url=new URL(input),captured=mode,call={path:url.pathname,method:init.method,query:[...url.searchParams],mode:captured,completed:false};calls.push(call);persist();
 try{
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  if(url.pathname==='/account/account_summary'){assert.equal(init.method,'POST');return Response.json({error:false,message:null,data:{nama:'Pemohon SINTETIS',roleUser:'PERORANGAN',userLevel:2,statusVerifikasi:1,isIkd:false}});}
  assert.equal(init.method,'GET');assert.equal(init.body,undefined);
  if(url.pathname==='/legacy/Kantah'){assert.deepEqual([...url.searchParams],[['nama',''],['tipeKantor','3,2,1']]);return Response.json(offices);}
  if(url.pathname==='/legacy/Wilayah'){assert.ok(['main-A','main-B'].includes(url.searchParams.get('kantorid')));assert.equal(url.searchParams.get('nama'),'');return Response.json(regions);}
  if(url.pathname==='/legacy/GetPersilId'||url.pathname==='/legacy/GetPersilIdByNibel'){
   if(url.pathname.endsWith('ByNibel')){assert.equal(url.searchParams.get('kodehat'),'');assert.ok(!url.searchParams.get('nibel').includes('.'));}
   else{assert.ok(['1','2','3','4','5','8'].includes(url.searchParams.get('jenishak')));assert.ok(['REFERENCE-WILAYAH-ID',''].includes(url.searchParams.get('wilayahid')));}
   if(captured==='slow-found')await new Promise(resolve=>{pending.push(resolve);persist();});
   if(captured==='error')return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
   if(captured==='auth')return new Response('{}',{status:401,headers:{'Content-Type':'application/json'}});
   if(captured==='malformed')return Response.json({...parcel(target),Alamat:'not-null'});
   return Response.json(parcel(captured==='no-match'?' \u0085 ':target));
  }
  if(url.pathname==='/legacy/GetParcelBoundaryById'){assert.deepEqual([...url.searchParams],[['persilid',target]]);return Response.json(captured==='empty-boundary'?{type:'FeatureCollection',features:[]}:boundary);}
  throw Error('Unexpected upstream path');
 }catch(error){unexpected.push({path:url.pathname,error:error.name});throw error;}finally{call.completed=true;persist();}
}});
function crc32(bytes){let v=0xffffffff;for(const b of bytes){v^=b;for(let i=0;i<8;i++)v=(v>>>1)^((v&1)?0xedb88320:0);}return(v^0xffffffff)>>>0;}
function chunk(name,bytes){const type=Buffer.from(name),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(crc32(Buffer.concat([type,bytes])));return Buffer.concat([size,type,bytes,crc]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(1,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(Buffer.from([0,214,225,212,255]))),chunk('IEND',Buffer.alloc(0))]);
const modes=['found','no-match','empty-boundary','malformed','error','slow-found','auth'];
const panel='<aside id="parcel-fixture"><strong>CARI BIDANG · SINTETIS LOKAL</strong><p>Tanpa server BPN, provider peta, GPS atau kamera. Kedua layer peta memakai tile sintetis.</p><label>Mode respons<select id="parcel-fixture-mode">'+modes.map(value=>'<option>'+value+'</option>').join('')+'</select></label><button id="parcel-fixture-apply">Terapkan mode</button><button id="parcel-fixture-release">Lepaskan respons tertunda</button><output id="parcel-fixture-status"></output></aside>';
const script=`const box=document.createElement('div');box.innerHTML=${JSON.stringify(panel)};document.body.append(box.firstElementChild);const status=async()=>{document.getElementById('parcel-fixture-status').textContent=JSON.stringify(await(await fetch('/fixture/status')).json());};document.getElementById('parcel-fixture-apply').onclick=async()=>{await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:document.getElementById('parcel-fixture-mode').value})});await status();};document.getElementById('parcel-fixture-release').onclick=async()=>{await fetch('/fixture/release',{method:'POST'});await status();};await status();`;
const css='#parcel-fixture{margin:18px;padding:18px;border:2px solid #876100;background:#fff6d8;font:13px/1.6 system-ui;color:#3a321e}#parcel-fixture select,#parcel-fixture button{padding:8px;margin:6px;font:inherit}#parcel-fixture-status{display:block;overflow-wrap:anywhere}@media(min-width:761px){#parcel-fixture{margin-left:270px}}';
const listener=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',async(req,res)=>{const url=new URL(req.url,'http://127.0.0.1');const json=value=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};try{
 if(url.pathname==='/fixture/status'){json({mode,calls:calls.length,pending:pending.length,unexpected:unexpected.length});return;}
 if(url.pathname==='/fixture/control'){let raw='';for await(const chunk of req)raw+=chunk;const value=JSON.parse(raw);assert.ok(modes.includes(value.mode));mode=value.mode;controls.push({mode});persist();json({mode});return;}
 if(url.pathname==='/fixture/release'){pending.shift()?.();persist();json({pending:pending.length});return;}
 if(url.pathname==='/fixture/controls.js'||url.pathname==='/fixture/controls.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?script:css);return;}
 if(url.pathname==='/'){const html=fs.readFileSync(new URL('webapp/index.html',root),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 if(url.pathname==='/assets/maps/official-map.js'){const source=fs.readFileSync(new URL('webapp/assets/maps/official-map.js',root),'utf8'),needle='https://tile.openstreetmap.org/{z}/{x}/{y}.png';assert.equal(source.split(needle).length,2);res.writeHead(200,{'Content-Type':'text/javascript'});res.end(source.replace(needle,'/fixture/osm/{z}/{x}/{y}.png'));return;}
 if(/^\/(?:fixture\/osm|api\/maps\/bhumi)\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){tiles.push({path:url.pathname});persist();res.writeHead(200,{'Content-Type':'image/png'});res.end(png);return;}
 if(url.pathname==='/api/execute'){executeRequests++;persist();}
 return listener(req,res);
 }catch(error){unexpected.push({localPath:url.pathname,error:error.name});persist();res.writeHead(500,{'Content-Type':'application/json'});res.end('{"fixtureError":true}');}});
await new Promise(resolve=>server.listen(4200,'127.0.0.1',resolve));persist();console.log('Synthetic parcel fixture http://127.0.0.1:4200');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stopped=true;while(pending.length)pending.shift()();persist();server.closeAllConnections();server.close();});
