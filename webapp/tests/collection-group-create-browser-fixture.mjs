// Full application + real local API boundary; every upstream response is synthetic.
// This fixture never forwards requests to a network transport or map provider.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer,publicRoot} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const CREATE='post-collection-addpersilcollectiongroup-da8f20';
const allowedEndpoints=new Set(['Collection/AddPersilCollectionGroup','collection/GetUserCollection','collection/GetPersilCollectionGroup','account/account_summary']);
const modes=['ready','error-true','http-503','http-201','malformed','auth-401','slow-success','slow-error','refresh-fail','refresh-malformed','refresh-empty'];
const defaultReceipt=new URL('../../analysis/webapp/collection-group-create-browser-transport.json',import.meta.url);
const fixtureUser={username:'penguji-grup-sintetis',nama:'Penguji Grup Sintetis',roleUser:'PERORANGAN',userLevel:2,isIkd:false,statusVerifikasi:1};

export function createCollectionGroupCreateBrowserFixture({port=4181,receiptFile=defaultReceipt}={}) {
  assert.ok(Number.isInteger(port)&&port>0&&port<=65535);
  const catalog=operations.getPublicCatalog().filter(op=>allowedEndpoints.has(op.endpoint));
  assert.equal(catalog.length,4);assert.ok(catalog.every(op=>op.enabled));
  assert.equal(catalog.find(op=>op.id===CREATE)?.endpoint,'Collection/AddPersilCollectionGroup');
  const calls=[],browserRequests=[],controls=[],creations=[],unexpected=[];
  let mode='ready',sequence=0,rowLoads=0,groupLoads=0,autoAuthenticateNext=true,pending=null,awaitingRefresh=null,nextRefresh=null;
  const groups=[{collectionGroupId:'fixture-existing-group',collectionGroupName:'SINTETIS Grup Awal',createdAt:'2026-10-19T08:09:00'}];
  const rows=[{id:'fixture-collection-row',type:'PERSIL',contentId:'fixture-parcel-no-map',createdAt:'2026-10-19T08:09:00',email:null,title:'Bidang Sintetis',subTitle:'Tidak membuka peta dalam fixture ini',groupId:'fixture-existing-group'}];
  const sessions=new SessionStore();
  const createSession=sessions.create.bind(sessions);
  sessions.create=()=>{const session=createSession();if(autoAuthenticateNext){autoAuthenticateNext=false;session.user={...fixtureUser};session.tokens={tokenType:'Bearer',accessToken:'fixture-only-never-real',refreshToken:null,expiredAt:4e9};}return session;};
  const snapshot=()=>({checkedAt:new Date().toISOString(),fixture:'collection-group-create-local-only',port,mode,calls,browserRequests,controls,creations,unexpected,rowLoads,groupLoads,pendingResponse:pending?{creationId:pending.creation.id,mode:pending.mode}:null,groups:groups.map(row=>({...row})),catalogEndpoints:catalog.map(op=>op.endpoint),productionRequests:0,providerRequests:0,networkTransportUsed:false});
  const persist=()=>{fs.mkdirSync(path.dirname(fileURLToPath(receiptFile instanceof URL?receiptFile:new URL('file:///'+path.resolve(receiptFile).replaceAll('\\','/')))),{recursive:true});fs.writeFileSync(receiptFile,JSON.stringify(snapshot(),null,2)+'\n');};
  const status=()=>({mode,pending:Boolean(pending),rowLoads,groupLoads,createCalls:creations.length,groupNames:groups.map(row=>row.collectionGroupName),unexpectedRequests:unexpected.length});
  const failUnexpected=(kind,value)=>{unexpected.push({sequence:++sequence,kind,path:value});persist();throw new Error('Unexpected synthetic create fixture request');};
  const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!catalog.some(op=>op.id===id))throw Object.assign(new Error('Operation outside synthetic create fixture'),{status:403,code:'FIXTURE_OPERATION_REJECTED'});return operations.prepareOperation(id,values,context);}};
  const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'BUAT GRUP: SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-only'};
  function finishCreate(creation,capturedMode) {
    const accepted=['ready','error-true','slow-success','refresh-fail','refresh-malformed','refresh-empty'].includes(capturedMode);
    creation.responseStatus=capturedMode==='http-503'||capturedMode==='slow-error'?503:capturedMode==='http-201'?201:capturedMode==='auth-401'?401:200;
    creation.acceptedSynthetic=accepted;
    creation.completed=true;creation.completedSequence=++sequence;
    if(accepted){groups.push({collectionGroupId:'fixture-created-'+creation.id,collectionGroupName:creation.GroupName,createdAt:'2026-10-19T08:10:00'});awaitingRefresh=creation;if(capturedMode.startsWith('refresh-'))nextRefresh=capturedMode;}
    persist();
    if(capturedMode==='http-503'||capturedMode==='slow-error')return Response.json({error:true,message:'Gangguan layanan sintetis'},{status:503});
    if(capturedMode==='http-201')return Response.json({error:false,message:'Status 201 sintetis',data:'fixture-unaccepted-201'},{status:201});
    if(capturedMode==='auth-401')return Response.json({error:true,message:'Sesi sintetis berakhir'},{status:401});
    if(capturedMode==='malformed')return Response.json({error:false,message:'Bentuk model sintetis rusak',data:{unexpected:'MODEL-RUSAK-TIDAK-BOLEH-BOCOR'}});
    return Response.json({error:capturedMode==='error-true',message:capturedMode==='error-true'?'Envelope error:true tetap sukses transport native':null,data:'fixture-created-'+creation.id,unknown:'extra field discarded'});
  }
  const server=createServer(publicRoot,{configuration,publicOrigin:'',registry,sessions,log:()=>{},bhumiTransport:async(url)=>failUnexpected('map-provider',new URL(url).pathname),transport:async(url,init)=>{
    assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
    const call={sequence:++sequence,method:init.method,path:url.pathname,mode};calls.push(call);persist();
    if(url.pathname==='/account/account_summary'){assert.equal(init.method,'GET');return Response.json({error:false,data:{...fixtureUser}});}
    if(['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)) {
      assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);
      if(awaitingRefresh){awaitingRefresh.postCreateReads.push({sequence:call.sequence,path:url.pathname});if(url.pathname.endsWith('GetPersilCollectionGroup')){call.refreshForCreation=awaitingRefresh.id;awaitingRefresh.groupRefreshSequence=call.sequence;awaitingRefresh.onlyGroupsRefreshed=awaitingRefresh.postCreateReads.length===1;awaitingRefresh=null;}}
      if(url.pathname.endsWith('GetUserCollection')){rowLoads++;persist();return Response.json({error:false,message:null,data:rows});}
      groupLoads++;const refresh=nextRefresh;nextRefresh=null;persist();
      if(refresh==='refresh-fail')return Response.json({error:true,message:'Muat ulang grup sintetis gagal'},{status:503});
      if(refresh==='refresh-malformed')return Response.json({error:false,data:[{collectionGroupId:42,collectionGroupName:'MODEL-RUSAK-TIDAK-BOLEH-BOCOR'}]});
      return Response.json({error:false,message:null,data:refresh==='refresh-empty'?[]:groups});
    }
    if(url.pathname==='/Collection/AddPersilCollectionGroup') {
      assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof FormData);
      const parts=[...init.body];assert.equal(parts.length,1);assert.equal(parts[0][0],'GroupName');assert.equal(typeof parts[0][1],'string');
      const name=parts[0][1];
      // Test input names must be conspicuously synthetic; never retain accidental real data.
      if(!name.startsWith('SINTETIS')){call.blockedNonSyntheticName=true;persist();return Response.json({error:true,message:'Fixture hanya menerima nama dengan awalan SINTETIS'},{status:400});}
      const creation={id:creations.length+1,sequence:call.sequence,mode,GroupName:name,parts:parts.map(([key,value])=>({key,type:typeof value})),rowLoadsBefore:rowLoads,groupLoadsBefore:groupLoads,postCreateReads:[],completed:false};creations.push(creation);call.creationId=creation.id;persist();
      if(mode==='slow-success'||mode==='slow-error') {
        assert.equal(pending,null,'Only one synthetic pending create request');
        const capturedMode=mode;
        return new Promise((resolve,reject)=>{
          const abort=()=>{if(pending?.creation===creation)pending=null;creation.aborted=true;creation.completedSequence=++sequence;persist();reject(new DOMException('Synthetic request aborted','AbortError'));};
          const release=()=>{init.signal?.removeEventListener('abort',abort);resolve(finishCreate(creation,capturedMode));};
          pending={creation,mode:capturedMode,release};init.signal?.addEventListener('abort',abort,{once:true});persist();
        });
      }
      return finishCreate(creation,mode);
    }
    return failUnexpected('upstream',url.pathname);
  }});
  const panel='<aside id="fixture-controls" aria-label="Kontrol fixture sintetis"><strong>BUAT GRUP · SINTETIS LOKAL</strong><span>Gunakan nama dengan awalan SINTETIS. Tidak ada akses server asli.</span><label for="fixture-mode">Mode respons sintetis</label><select id="fixture-mode">'+modes.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><button type="button" id="fixture-set-mode">Terapkan mode sintetis</button><button type="button" id="fixture-release">Lepaskan respons tertunda</button><button type="button" id="fixture-new-session">Sesi sintetis baru</button><button type="button" id="fixture-check">Periksa status sintetis</button><output id="fixture-status" aria-live="polite">Menyiapkan kontrol lokal…</output></aside>';
  const script=`const panel=document.createElement('div');panel.innerHTML=${JSON.stringify(panel)};const controls=panel.firstElementChild,dialog=document.getElementById('modal');document.body.append(controls);function place(){const target=dialog.open?dialog:document.body;if(controls.parentElement!==target)target.append(controls);}new MutationObserver(place).observe(dialog,{childList:true,attributes:true,attributeFilter:['open']});async function update(){const value=await(await fetch('/fixture/status')).json();document.getElementById('fixture-status').textContent=JSON.stringify(value);document.getElementById('fixture-release').disabled=!value.pending;}async function command(action){const mode=document.getElementById('fixture-mode').value;await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,mode})});if(action==='new-session'){location.hash='/collections';location.reload();return;}await update();}document.getElementById('fixture-set-mode').onclick=()=>command('mode');document.getElementById('fixture-release').onclick=()=>command('release');document.getElementById('fixture-new-session').onclick=()=>command('new-session');document.getElementById('fixture-check').onclick=update;setInterval(update,600);await update();`;
  const css='#fixture-controls{position:relative;z-index:20;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;margin:10px;border:2px solid #183d62;background:#edf6ff;color:#123;font:12px system-ui;max-width:calc(100% - 20px);box-sizing:border-box}#fixture-controls strong,#fixture-controls span,#fixture-status{flex-basis:100%;overflow-wrap:anywhere}#fixture-controls select,#fixture-controls button{font:12px system-ui;padding:5px;max-width:100%;background:white;color:#123;border:1px solid #52718e;border-radius:3px}#fixture-controls button:disabled{opacity:.5}';
  const original=server.listeners('request')[0];server.removeAllListeners('request');
  function json(res,code,value){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
  server.on('request',async(req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(req.headers.host!=='127.0.0.1:'+port){res.writeHead(403);res.end('Fixture host rejected');return;}
    const setHeader=res.setHeader.bind(res);res.setHeader=(name,value)=>setHeader(name,name.toLowerCase()==='content-security-policy'?String(value).replace(/img-src[^;]+/,"img-src 'self' data: blob:"):value);
    if(url.pathname==='/fixture/controls.js'){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end(script);return;}
    if(url.pathname==='/fixture/controls.css'){res.writeHead(200,{'Content-Type':'text/css','Cache-Control':'no-store'});res.end(css);return;}
    if(url.pathname==='/fixture/status'&&req.method==='GET'){json(res,200,status());return;}
    if(url.pathname==='/fixture/control'&&req.method==='POST'){
      if(req.headers.origin!=='http://127.0.0.1:'+port){json(res,403,{error:'Fixture origin rejected'});return;}
      let bytes='';for await(const chunk of req){bytes+=chunk;if(bytes.length>2048){json(res,413,{error:'Fixture control too large'});return;}}
      let value;try{value=JSON.parse(bytes);}catch{json(res,400,{error:'Invalid fixture control'});return;}
      if(!['mode','release','new-session'].includes(value.action)||!modes.includes(value.mode)){json(res,400,{error:'Unknown fixture control'});return;}
      controls.push({sequence:++sequence,action:value.action,mode:value.mode});
      if(value.action==='mode')mode=value.mode;
      if(value.action==='release'){const release=pending?.release;pending=null;release?.();}
      if(value.action==='new-session'){for(const id of [...sessions.sessions.keys()])sessions.delete(id);autoAuthenticateNext=true;}
      persist();json(res,200,status());return;
    }
    if(url.pathname==='/'&&req.method==='GET'){
      const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
    }
    if(url.pathname==='/api/execute'&&req.method==='POST'){
      const originalIterator=req[Symbol.asyncIterator].bind(req);
      req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of originalIterator()){chunks.push(chunk);yield chunk;}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));const name=value.values?.GroupName;browserRequests.push({sequence:++sequence,operationId:value.operationId,confirm:value.confirm??null,confirmType:typeof value.confirm,valuesKeys:Object.keys(value.values||{}),valuesTypes:Object.fromEntries(Object.entries(value.values||{}).map(([key,item])=>[key,typeof item])),...(typeof name==='string'?{GroupName:name.trim().startsWith('SINTETIS')?name:'[non-synthetic input omitted]'}:{})});persist();}catch{browserRequests.push({sequence:++sequence,unrecognizedBody:true});persist();}};
    }
    if(url.pathname.startsWith('/api/maps/bhumi/')||url.pathname.startsWith('/fixture/osm/')){unexpected.push({sequence:++sequence,kind:'map-browser',path:url.pathname});persist();json(res,409,{error:'Maps are outside this synthetic create fixture'});return;}
    await original(req,res);
  });
  const stop=()=>{if(pending){const release=pending.release;pending=null;release();}persist();server.closeAllConnections();server.close();};
  return {server,port,start:()=>new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{persist();resolve(status());})),stop,snapshot};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const fixture=createCollectionGroupCreateBrowserFixture();
  await fixture.start();console.log('Synthetic create UI: http://127.0.0.1:4181/#/collections');
  process.once('SIGINT',fixture.stop);process.once('SIGTERM',fixture.stop);
}
