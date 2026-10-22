// Actual webapp/API with synthetic visitor metadata; all upstreams intercepted.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
const root=new URL('../../',import.meta.url),receipt=new URL('analysis/webapp/guestbook-browser-transport.json',root);
assert.ok(!fs.existsSync(receipt),'Preserve browser transport receipt');
const calls=[],controls=[],unexpected=[],pending=[];let mode='found',stopped=false,executeRequests=0;
const persist=()=>fs.writeFileSync(receipt,JSON.stringify({checkedAt:new Date().toISOString(),mode,stopped,calls,controls,unexpected,pending:pending.length,executeRequests,productionRequests:0,providerRequests:0,cameraActions:0,geolocationActions:0,identitySubmissions:0,arrivalSubmissions:0,geotagSubmissions:0,scope:'Synthetic-only own-signin prefill and office QR metadata; actual webapp and API. No arrival POST, real account, real QR, camera/GPS or production network.'},null,2)+'\n');
const sessions=new SessionStore(),create=sessions.create.bind(sessions);let first=true;
sessions.create=()=>{const s=create();if(first){first=false;s.user={username:'guestbook-SYNTHETIC',email:'visitor@example.invalid',nomorIndukKependudukan:'0000000000000000',roleUser:'PERORANGAN'};s.tokens={tokenType:'Bearer',accessToken:'fixture-never-real',expiredAt:4e9};}return s;};
const blocked=async()=>{unexpected.push('Unexpected nonfixture provider');persist();throw Error('No provider network');};
const server=createServer({sessions,configuration:{configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-guestbook-only'},log:()=>{},queueTransport:blocked,bhumiTransport:blocked,transport:async(input,init)=>{
 const url=new URL(input),captured=mode,call={path:url.pathname,method:init.method,query:[...url.searchParams],mode:captured,completed:false};calls.push(call);persist();
 try{
  assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
  if(url.pathname==='/account/account_summary'){assert.equal(init.method,'POST');return Response.json({error:false,data:{nama:'Nama PROFIL bukan prefill',roleUser:'PERORANGAN',userLevel:2,statusVerifikasi:1,isIkd:false,nomorIdentitas:'NIK-PROFIL-BUKAN-PREFILL',email:'profile@example.invalid'}});}
  assert.equal(url.pathname,'/bukutamu');assert.equal(init.method,'GET');assert.equal(init.body,undefined);assert.equal(new Headers(init.headers).get('Authorization'),'AtrBpn fixture-guestbook-only');assert.equal(new Headers(init.headers).get('Content-Type'),null);assert.deepEqual([...url.searchParams],[['uid','fixture-kd'],['unid','fixture-id']]);
  if(captured==='slow')await new Promise(resolve=>{pending.push(resolve);persist();});
  if(captured==='network')throw Error('Synthetic connection failure');
  if(captured==='app-rejected')return Response.json({error:true},{status:401});
  if(captured==='malformed')return Response.json({error:false,data:{kantorId:12}});
  if(captured==='null')return Response.json({error:false,message:null,data:null});
  return Response.json({error:true,message:'Native flag ignored by read service',data:{userId:'QR-USER-NOT-ACCOUNT',kantorId:'OFFICE-SYNTHETIC',unitKerjaId:'UNIT-SYNTHETIC',namaUnitKerja:'Unit SINTETIS Buku Tamu',unknown:'discard'}});
 }catch(error){if(captured!=='network')unexpected.push({path:url.pathname,error:error.name});throw error;}finally{call.completed=true;persist();}
}});
const modes=['found','null','malformed','network','slow','app-rejected'];
const panel='<aside id="guestbook-fixture"><strong>BUKU TAMU · SINTETIS LOKAL</strong><p>Semua QR, akun dan unit adalah fixture. Tanpa server BPN, kamera, GPS atau pencatatan kedatangan.</p><label>Mode respons<select id="guestbook-fixture-mode">'+modes.map(value=>'<option>'+value+'</option>').join('')+'</select></label><button id="guestbook-fixture-apply">Terapkan mode</button><button id="guestbook-fixture-release">Lepaskan respons tertunda</button><output id="guestbook-fixture-status"></output></aside>';
const script=`const box=document.createElement('div');box.innerHTML=${JSON.stringify(panel)};document.body.append(box.firstElementChild);const status=async()=>{document.getElementById('guestbook-fixture-status').textContent=JSON.stringify(await(await fetch('/fixture/status')).json());};document.getElementById('guestbook-fixture-apply').onclick=async()=>{await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:document.getElementById('guestbook-fixture-mode').value})});await status();};document.getElementById('guestbook-fixture-release').onclick=async()=>{await fetch('/fixture/release',{method:'POST'});await status();};await status();`;
const css='#guestbook-fixture{margin:18px;padding:18px;border:2px solid #876100;background:#fff6d8;font:13px/1.6 system-ui;color:#3a321e}#guestbook-fixture select,#guestbook-fixture button{padding:8px;margin:6px;font:inherit}#guestbook-fixture-status{display:block;overflow-wrap:anywhere}@media(min-width:761px){#guestbook-fixture{margin-left:270px}}';
const listener=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',async(req,res)=>{const url=new URL(req.url,'http://127.0.0.1');const json=value=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};try{
 if(url.pathname==='/fixture/status'){json({mode,calls:calls.length,pending:pending.length,unexpected:unexpected.length});return;}
 if(url.pathname==='/fixture/control'){let raw='';for await(const chunk of req)raw+=chunk;const value=JSON.parse(raw);assert.ok(modes.includes(value.mode));mode=value.mode;controls.push({mode});persist();json({mode});return;}
 if(url.pathname==='/fixture/release'){pending.shift()?.();persist();json({pending:pending.length});return;}
 if(url.pathname==='/fixture/controls.js'||url.pathname==='/fixture/controls.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'text/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?script:css);return;}
 if(url.pathname==='/'){const html=fs.readFileSync(new URL('webapp/index.html',root),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}
 if(url.pathname==='/api/execute'){executeRequests++;persist();}
 return listener(req,res);
 }catch(error){unexpected.push({localPath:url.pathname,error:error.name});persist();res.writeHead(500,{'Content-Type':'application/json'});res.end('{"fixtureError":true}');}});
await new Promise(resolve=>server.listen(4200,'127.0.0.1',resolve));persist();console.log('Synthetic guestbook fixture http://127.0.0.1:4200');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stopped=true;while(pending.length)pending.shift()();persist();server.closeAllConnections();server.close();});
