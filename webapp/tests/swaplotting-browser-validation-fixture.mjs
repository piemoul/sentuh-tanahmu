// The real local app/API with synthetic account, disclaimer and reference reads.
// All BPN transports are intercepted. Only public OSM image tiles may load.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
const root=new URL('../../',import.meta.url),receipt=new URL('analysis/webapp/swaplotting-browser-validation-transport.json',root);
assert.ok(!fs.existsSync(receipt),'Preserve browser transport receipt');
const modes=['found','string','empty','malformed','network','slow','office-malformed','regions-slow','region-error'];
const calls=[],controls=[],unexpected=[],pending=[];
let mode='found',stopped=false,executeRequests=0,tileRequests=0;
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),mode,stopped,calls,controls,unexpected,pending:pending.length,executeRequests,tileRequests,bpnProductionRequests:0,cameraActions:0,geolocationActions:0,identitySubmissions:0,otpSubmissions:0,plotSubmissions:0,geotagSubmissions:0,browserExternalImages:'Public tile.openstreetmap.org images permitted by CSP; no BPN tiles or other upstreams.',scope:'Synthetic-only own profile, disclaimer, kantor and wilayah. Actual application and API, no upload/identity/OTP/GPS or production BPN request.'},null,2)+'\n');
const sessions=new SessionStore(),create=sessions.create.bind(sessions);
let first=true;
sessions.create=()=>{const session=create();if(first){first=false;session.user={username:'swaplotting-SYNTHETIC',email:'signin@example.invalid',nomorIndukKependudukan:'0000000000000000',userLevel:2,isParticipatoryMapper:true,roleUser:'PERORANGAN'};session.tokens={tokenType:'Bearer',accessToken:'fixture-never-real',expiredAt:4e9};}return session;};
const blocked=async()=>{unexpected.push('Unexpected nonfixture provider');persist();throw Error('No BPN provider network');};
const wait=kind=>new Promise(resolve=>{pending.push({kind,resolve});persist();});
const office=(id,name)=>({Alamat:null,Email:null,Fax:null,KantorId:id,Nama:name,Telp:null,Kota:null,TipeKantorId:3});
const profile={userId:'USER-SYNTHETIC',username:'swaplotting-SYNTHETIC',nama:'Pemohon SINTETIS',nomorHp:'0000000000',email:'profile@example.invalid',roleUser:'PERORANGAN',roleName:'PERORANGAN',nomorIdentitas:'0000000000000000',tanggalLahir:'2000-01-01',tempatLahir:'Kota SINTETIS',kantorId:'OFFICE-SYNTHETIC-A',namaKantor:'Kantor SINTETIS A',alamatKantor:null,userLevel:2,statusVerifikasi:1,isIkd:false,readyToReview:false,linkedEmailIkd:null};
const disclaimer={message:'SINTETIS: periksa titik dan dokumen sebelum melanjutkan.',message2:'Teks uji lokal, bukan persyaratan resmi.',message3:'Tidak ada data yang dikirim ke BPN dari fixture ini.',url:'https://example.invalid/synthetic-disclaimer'};
const server=createServer({sessions,configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-swaplotting-only'},log:()=>{},queueTransport:blocked,bhumiTransport:blocked,transport:async(input,init)=>{
 const url=new URL(input),captured=mode,call={path:url.pathname,method:init.method,query:[...url.searchParams],mode:captured,completed:false};calls.push(call);persist();
 try{
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  if(url.pathname==='/account/account_summary'){assert.equal(init.method,'POST');return Response.json({error:false,data:profile});}
  assert.equal(init.method,'GET');assert.equal(init.body,undefined);
  if(url.pathname==='/Map/GetDisclaimer'){
   assert.deepEqual([...url.searchParams],[]);
   if(captured==='slow')await wait('disclaimer');
   if(captured==='network')throw Error('Synthetic connection failure');
   if(captured==='malformed')return Response.json({message:12});
   if(captured==='empty')return Response.json({message:null,message2:null,message3:null,url:null});
   return Response.json(captured==='string'?JSON.stringify(disclaimer):disclaimer);
  }
  if(url.pathname==='/legacy/Kantah'){
   assert.deepEqual([...url.searchParams],[['nama',''],['tipeKantor','']]);
   if(captured==='office-malformed')return Response.json([{KantorId:12,Nama:'Malformed'}]);
   return Response.json([office('OFFICE-SYNTHETIC-A','Kantor SINTETIS A'),office('OFFICE-SYNTHETIC-B','Kantor SINTETIS B')]);
  }
  if(url.pathname==='/legacy/Wilayah'){
   const id=url.searchParams.get('kantorid');assert.ok(['OFFICE-SYNTHETIC-A','OFFICE-SYNTHETIC-B'].includes(id));assert.deepEqual([...url.searchParams],[['kantorid',id],['nama','']]);
   if(captured==='regions-slow')await wait('regions');
   if(captured==='region-error')return Response.json({error:true},{status:503});
   return Response.json([{WilayahId:id+'-WILAYAH',Nama:'Desa SINTETIS '+id.slice(-1),Kode:'CODE-IS-NOT-ID',TipeWilayah:'Desa'}]);
  }
  assert.fail('Unexpected BPN path');
 }catch(error){if(!['network','region-error'].includes(captured))unexpected.push({path:url.pathname,error:error.name});throw error;}finally{call.completed=true;persist();}
}});
const status=()=>({mode,calls:calls.length,pending:pending.length,unexpected:unexpected.length,stopped});
const panel='<aside id="swaplotting-fixture"><strong>SWAPLOTTING · SINTETIS LOKAL</strong><p>Akun, pemohon, disclaimer dan kantor adalah data uji. Tidak ada unggahan, OTP, GPS atau server BPN. Gambar dasar OSM publik dapat dimuat.</p><label>Mode respons<select id="swaplotting-fixture-mode">'+modes.map(value=>'<option>'+value+'</option>').join('')+'</select></label><button id="swaplotting-fixture-apply">Terapkan mode</button><button id="swaplotting-fixture-release">Lepaskan respons tertunda</button><button id="swaplotting-fixture-stop">Hentikan fixture</button><output id="swaplotting-fixture-status"></output></aside>';
const script=`const box=document.createElement('div');box.innerHTML=${JSON.stringify(panel)};document.body.append(box.firstElementChild);const status=async()=>{document.getElementById('swaplotting-fixture-status').textContent=JSON.stringify(await(await fetch('/fixture/status')).json());};document.getElementById('swaplotting-fixture-apply').onclick=async()=>{await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:document.getElementById('swaplotting-fixture-mode').value})});await status();};document.getElementById('swaplotting-fixture-release').onclick=async()=>{await fetch('/fixture/release',{method:'POST'});await status();};document.getElementById('swaplotting-fixture-stop').onclick=async()=>{await fetch('/fixture/stop',{method:'POST'});document.getElementById('swaplotting-fixture-status').textContent='Fixture dihentikan.';};await status();`;
const css='#swaplotting-fixture{margin:18px;padding:18px;border:2px solid #876100;background:#fff6d8;font:13px/1.6 system-ui;color:#3a321e}#swaplotting-fixture select,#swaplotting-fixture button{padding:8px;margin:6px;font:inherit}#swaplotting-fixture-status{display:block;overflow-wrap:anywhere}@media(min-width:761px){#swaplotting-fixture{margin-left:270px}}';
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=','base64');
function stop(){if(stopped)return;stopped=true;for(const entry of pending.splice(0))entry.resolve();persist();server.closeAllConnections();server.close(()=>console.log('Synthetic Swaplotting fixture stopped'));}
const listener=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',async(req,res)=>{const url=new URL(req.url,'http://127.0.0.1');const send=value=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};try{
 if(url.pathname==='/fixture/status'){send(status());return;}
 if(url.pathname==='/fixture/control'){let raw='';for await(const chunk of req)raw+=chunk;const value=JSON.parse(raw);assert.ok(modes.includes(value.mode));mode=value.mode;controls.push({mode});persist();send(status());return;}
 if(url.pathname==='/fixture/release'){pending.shift()?.resolve();persist();send(status());return;}
 if(url.pathname==='/fixture/stop'){send({stopping:true});setImmediate(stop);return;}
 if(url.pathname==='/fixture/mobile'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Swaplotting · uji lebar 390 px</title><style>body{margin:20px;background:#e9ecef;font:14px system-ui;color:#30343b}h1{font-size:18px}p{max-width:640px}iframe{width:390px;height:844px;border:1px solid #bac2cc;background:white;display:block;margin-top:18px}</style></head><body><h1>Uji responsif · 390 × 844 px</h1><p>Webapp asli di frame dengan lebar ponsel. Ini uji tata letak, bukan perangkat Android atau kamera/GNSS nyata.</p><iframe title="Webapp Swaplotting lebar ponsel" src="/#/swaplotting"></iframe></body></html>');return;}
 if(url.pathname==='/fixture/controls.js'||url.pathname==='/fixture/controls.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?script:css);return;}
 if(/^\/api\/maps\/bhumi\/\d+\/\d+\/\d+\.png$/.test(url.pathname)){tileRequests++;persist();res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(pixel);return;}
 if(url.pathname==='/'){const html=fs.readFileSync(new URL('webapp/index.html',root),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 if(url.pathname==='/api/execute'){executeRequests++;persist();}
 return listener(req,res);
 }catch(error){unexpected.push({localPath:url.pathname,error:error.name});persist();res.writeHead(500,{'Content-Type':'application/json'});res.end('{"fixtureError":true}');}});
await new Promise(resolve=>server.listen(4202,'127.0.0.1',resolve));persist();console.log('Synthetic Swaplotting fixture http://127.0.0.1:4202');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,stop);
