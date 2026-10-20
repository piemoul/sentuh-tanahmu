// Full browser app + real local API boundary; every profile, record and write is synthetic.
// Both upstream adapters are injected. Nothing forwards to BPN, a map provider, or another host.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer,publicRoot} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const EDIT='put-collection-editcollectionpersil-da839c';
const DELETE_PERSIL='delete-collection-deletecollectionpersil-path-argument-1-da7530';
const DELETE_BERKAS='delete-collection-deletecollectionberkas-path-argument-1-d92888';
const endpoints=new Set([
  'account/account_summary','collection/GetUserCollection','collection/GetPersilCollectionGroup',
  'Collection/EditCollectionPersil','Collection/DeleteCollectionPersil/{path_argument_1}',
  'Collection/DeleteCollectionBerkas/{path_argument_1}',
]);
const modes=['ready','error-true','http-503','http-201','malformed','auth-401','slow-success','slow-error'];
const datasets=['default','no-empty-id','reverse-duplicates'];
const defaultReceipt=new URL('../../analysis/webapp/collection-item-actions-browser-transport.json',import.meta.url);
const fixtureUser={username:'penguji-item-sintetis',nama:'Penguji Item Sintetis',roleUser:'PERORANGAN',userLevel:2,isIkd:false,statusVerifikasi:1};
const groupA='fixture-item-group-a',groupB='fixture-item-group-b /+%?&# é';
const initialGroups=[
  {collectionGroupId:groupA,collectionGroupName:'SINTETIS Grup A'},
  {collectionGroupId:groupB,collectionGroupName:'SINTETIS Grup B Khusus'},
  {collectionGroupId:null,collectionGroupName:'SINTETIS Grup ID null'},
  {collectionGroupId:'',collectionGroupName:'SINTETIS Grup ID kosong'},
  {collectionGroupId:'   ',collectionGroupName:'SINTETIS Grup Spasi'},
  {collectionGroupId:'fixture-item-group-null-name',collectionGroupName:null},
  {collectionGroupId:'fixture-item-group-empty-name',collectionGroupName:''},
].map(item=>({...item,createdAt:'2026-10-20T08:09:00'}));
const row=(id,type,title,groupId,contentId,subTitle='Subjudul SINTETIS; ID konten berbeda dari ID koleksi')=>({id,type,contentId,createdAt:'2026-10-20T08:09:00',email:null,title,subTitle,groupId});
const initialRows=[
  row('fixture-item-a /+%?&# é','PERSIL','SINTETIS Bidang A',groupA,'fixture-content-a-different'),
  row('fixture-item-berkas','BERKAS','SINTETIS Berkas A',groupA,'fixture-file-a:fixture-office-a'),
  row('fixture-item-title-null','PERSIL',null,groupA,'fixture-content-null-title'),
  row('fixture-item-title-empty','PERSIL','',groupB,'fixture-content-empty-title'),
  row(null,'PERSIL','SINTETIS Bidang ID null',groupA,'fixture-content-null-id'),
  row('','PERSIL','SINTETIS Bidang ID kosong',groupA,'fixture-content-empty-id'),
  row('   ','PERSIL','SINTETIS Bidang ID spasi','   ','fixture-content-space-id'),
  row('fixture-item-duplicate','PERSIL','SINTETIS Duplikat pertama Bidang',groupA,'fixture-duplicate-content-persil'),
  row('fixture-item-duplicate','BERKAS','SINTETIS Duplikat kedua Berkas',groupA,'fixture-duplicate-file:fixture-office'),
  row('fixture-item-duplicate-reverse','BERKAS','SINTETIS Duplikat pertama Berkas',groupA,'fixture-reverse-file:fixture-office'),
  row('fixture-item-duplicate-reverse','PERSIL','SINTETIS Duplikat kedua Bidang',groupA,'fixture-reverse-content-persil'),
  row('fixture-item-other','OTHER','SINTETIS Tipe lain dalam A',groupA,'fixture-content-other'),
  row('fixture-item-null-type',null,'SINTETIS Tipe null dalam A',groupA,'fixture-content-null-type'),
  row('fixture-item-file-title-null','BERKAS',null,groupB,'fixture-file-null-title:fixture-office'),
  row('fixture-item-file-title-empty','BERKAS','',groupB,'fixture-file-empty-title:fixture-office'),
  row('fixture-item-unassigned','PERSIL','SINTETIS Tanpa Grup',null,'fixture-content-unassigned'),
  row('fixture-item-empty-group','PERSIL','SINTETIS Bidang Grup kosong','','fixture-content-empty-group'),
  row('fixture-item-null-name-group','PERSIL','SINTETIS Grup nama null','fixture-item-group-null-name','fixture-content-null-group-name'),
  row('fixture-item-empty-name-group','PERSIL','SINTETIS Grup nama kosong','fixture-item-group-empty-name','fixture-content-empty-group-name'),
];

export function createCollectionItemActionsBrowserFixture({port=4185,receiptFile=defaultReceipt}={}) {
  assert.ok(Number.isInteger(port)&&port>0&&port<=65535);
  const catalog=operations.getPublicCatalog().filter(op=>endpoints.has(op.endpoint));
  assert.equal(catalog.length,6,'Audited item-action registry must be installed before starting fixture');
  assert.ok(catalog.every(op=>op.enabled));
  for(const id of [EDIT,DELETE_PERSIL,DELETE_BERKAS])assert.ok(catalog.some(op=>op.id===id));
  const calls=[],browserRequests=[],controls=[],actions=[],unexpected=[],pending=[];
  let mode='ready',dataset='default',sequence=0,rowLoads=0,groupLoads=0,autoAuthenticateNext=true,observedAction=null;
  let groups=structuredClone(initialGroups),rows=structuredClone(initialRows);
  const safeRowIds=new Set(initialRows.map(item=>item.id??''));
  const sessions=new SessionStore(),createSession=sessions.create.bind(sessions);
  sessions.create=()=>{const session=createSession();if(autoAuthenticateNext){autoAuthenticateNext=false;session.user={...fixtureUser};session.tokens={tokenType:'Bearer',accessToken:'fixture-only-never-real',refreshToken:null,expiredAt:4e9};}return session;};
  const state=()=>({groups:structuredClone(groups),rows:structuredClone(rows)});
  const snapshot=()=>({checkedAt:new Date().toISOString(),fixture:'collection-item-actions-local-only',port,mode,dataset,calls,browserRequests,controls,actions,unexpected,rowLoads,groupLoads,pendingResponses:pending.map(item=>({actionId:item.action.id,mode:item.mode})),serverState:state(),catalog:catalog.map(op=>({id:op.id,endpoint:op.endpoint,method:op.method,enabled:op.enabled})),serverModelNotes:['Synthetic edit updates matching exact-ID titles but retains groupId. Native local cache clone may clear groupId; an explicit server refresh can restore membership.','Synthetic whole-item deletion removes exact matching IDs. This is fixture behavior, not evidence of BPN cascade/authorization semantics.'],productionRequests:0,providerRequests:0,networkTransportUsed:false});
  const persist=()=>{const filename=receiptFile instanceof URL?fileURLToPath(receiptFile):path.resolve(receiptFile);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,JSON.stringify(snapshot(),null,2)+'\n');};
  const status=()=>({mode,dataset,availableModes:[...modes],pending:pending.length,rowLoads,groupLoads,writeCalls:actions.length,callCount:calls.length,calls:calls.map(({sequence,method,path,search,mode,actionId})=>({sequence,method,path,search,mode,...(actionId?{actionId}:{})})),groupCount:groups.length,rows:rows.map(({id,type,title,subTitle,groupId})=>({id,type,title,subTitle,groupId})),unexpectedRequests:unexpected.length,lastAction:actions.length?{id:actions.at(-1).id,kind:actions.at(-1).kind,operationId:actions.at(-1).operationId,completed:actions.at(-1).completed,responseStatus:actions.at(-1).responseStatus??null,acceptedSynthetic:actions.at(-1).acceptedSynthetic??null,postActionReads:actions.at(-1).postActionReads}:null});
  const closeWindow=reason=>{if(observedAction){observedAction.observationClosedSequence=++sequence;observedAction.observationClosedBy=reason;observedAction.noReadsObserved=observedAction.postActionReads.length===0;observedAction=null;}};
  const unexpectedRequest=(kind,requestPath)=>{unexpected.push({sequence:++sequence,kind,path:requestPath});persist();throw new Error('Unexpected synthetic item-action request');};
  const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!catalog.some(op=>op.id===id))throw Object.assign(new Error('Operation outside synthetic item fixture'),{status:403,code:'FIXTURE_OPERATION_REJECTED'});return operations.prepareOperation(id,values,context);}};
  const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'ITEM: SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-only'};
  function complete(action,capturedMode) {
    const accepted=['ready','error-true','slow-success'].includes(capturedMode);
    action.responseStatus=['http-503','slow-error'].includes(capturedMode)?503:capturedMode==='http-201'?201:capturedMode==='auth-401'?401:200;
    action.acceptedSynthetic=accepted;action.completed=true;action.completedSequence=++sequence;action.serverBefore=state();
    if(accepted){
      if(action.kind==='edit'){
        for(const item of rows)if(item.id===action.values.id)item.title=action.values.caption;
      }else rows=rows.filter(item=>item.id!==action.dynamicId);
    }
    action.serverAfter=state();observedAction=action;persist();
    if(['http-503','slow-error'].includes(capturedMode))return Response.json({error:true,message:'Gangguan item SINTETIS'},{status:503});
    if(capturedMode==='http-201')return Response.json({error:false,message:'Status 201 SINTETIS',data:'fixture-not-accepted-201'},{status:201});
    if(capturedMode==='auth-401')return Response.json({error:true,message:'Sesi SINTETIS berakhir'},{status:401});
    if(capturedMode==='malformed')return Response.json({error:false,message:'Model respons SINTETIS rusak',data:{unexpected:'MODEL-RUSAK-TIDAK-BOLEH-BOCOR'}});
    return Response.json({error:capturedMode==='error-true',message:capturedMode==='error-true'?'Envelope native error:true tetap diterima':null,data:'fixture-item-action-'+action.id,unknown:'discarded'});
  }
  function responseFor(action,init) {
    if(!['slow-success','slow-error'].includes(mode))return complete(action,mode);
    const capturedMode=mode;
    return new Promise((resolve,reject)=>{
      const remove=()=>{const index=pending.findIndex(item=>item.action===action);if(index!==-1)pending.splice(index,1);};
      const abort=()=>{remove();action.aborted=true;action.completedSequence=++sequence;persist();reject(new DOMException('Synthetic request aborted','AbortError'));};
      const release=()=>{remove();init.signal?.removeEventListener('abort',abort);resolve(complete(action,capturedMode));};
      pending.push({action,mode:capturedMode,release});init.signal?.addEventListener('abort',abort,{once:true});persist();
    });
  }
  const server=createServer(publicRoot,{configuration,publicOrigin:'',registry,sessions,log:()=>{},bhumiTransport:async(url)=>unexpectedRequest('map-provider',new URL(url).pathname),transport:async(url,init)=>{
    assert.equal(url.origin,'https://sentuh.atrbpn.go.id');
    const call={sequence:++sequence,method:init.method,path:url.pathname,search:url.search,mode};calls.push(call);persist();
    if(url.pathname==='/account/account_summary'){
      assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual([...init.body],[['appVersion','6.1.5']]);
      call.bodyKind='urlencoded';call.parts=[...init.body].map(([key,value])=>({key,value}));persist();return Response.json({error:false,data:{...fixtureUser}});
    }
    if(['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)){
      assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);
      const kind=url.pathname.endsWith('GetUserCollection')?'rows':'groups';
      if(observedAction){observedAction.postActionReads.push({sequence:call.sequence,kind,path:url.pathname});call.readAfterAction=observedAction.id;observedAction.noReadsObserved=false;}
      if(kind==='rows'){rowLoads++;persist();return Response.json({error:false,message:null,data:rows});}
      groupLoads++;persist();return Response.json({error:false,message:null,data:groups});
    }
    closeWindow('next-write');
    let action;
    if(url.pathname==='/Collection/EditCollectionPersil'){
      assert.equal(init.method,'PUT');assert.equal(url.search,'');assert.ok(init.body instanceof FormData);
      const parts=[...init.body];assert.deepEqual(parts.map(([key])=>key),['id','caption']);assert.ok(parts.every(([,value])=>typeof value==='string'));
      const values=Object.fromEntries(parts);assert.ok(safeRowIds.has(values.id),'Only known synthetic IDs are accepted');
      assert.ok(values.caption.length<=4096&&/sintetis/i.test(values.caption),'Use a clearly labelled SINTETIS caption in this local fixture');
      action={id:actions.length+1,kind:'edit',operationId:EDIT,sequence:call.sequence,mode,values,parts:parts.map(([key,value])=>({key,value,type:typeof value})),bodyKind:'multipart',membershipPreservedBySyntheticServer:true};
    }else{
      const match=/^\/Collection\/(DeleteCollectionPersil|DeleteCollectionBerkas)\/(.*)$/.exec(url.pathname);
      if(!match)return unexpectedRequest('upstream',url.pathname);
      assert.equal(init.method,'DELETE');assert.equal(url.search,'');assert.equal(init.body,undefined);
      const dynamicId=decodeURIComponent(match[2]);assert.ok(safeRowIds.has(dynamicId),'Only known synthetic path IDs are accepted');
      const first=rows.find(item=>item.id===dynamicId);
      action={id:actions.length+1,kind:'delete-item',operationId:match[1]==='DeleteCollectionPersil'?DELETE_PERSIL:DELETE_BERKAS,sequence:call.sequence,mode,dynamicId,encodedComponent:match[2],bodyKind:'none',firstSyntheticServerMatchType:first?.type??null,expectedEndpointFromServerSnapshot:first?.type==='PERSIL'?'Collection/DeleteCollectionPersil':'Collection/DeleteCollectionBerkas'};
    }
    Object.assign(action,{rowLoadsBefore:rowLoads,groupLoadsBefore:groupLoads,postActionReads:[],noReadsObserved:true,completed:false});actions.push(action);call.actionId=action.id;persist();return responseFor(action,init);
  }});
  const panel='<aside id="fixture-controls" aria-label="Kontrol fixture sintetis"><strong>EDIT / HAPUS ITEM · SINTETIS LOKAL</strong><span>Profil, baris, grup dan perubahan hanya data uji lokal. Caption pengujian harus memuat SINTETIS. Tidak ada server asli/peta.</span><label for="fixture-mode">Mode respons sintetis</label><select id="fixture-mode">'+modes.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><button type="button" id="fixture-set-mode">Terapkan mode sintetis</button><button type="button" id="fixture-release">Lepaskan respons tertunda</button><label for="fixture-dataset">Dataset sintetis</label><select id="fixture-dataset">'+datasets.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><button type="button" id="fixture-set-dataset">Terapkan dataset sintetis</button><button type="button" id="fixture-new-session">Sesi sintetis baru</button><button type="button" id="fixture-reset-data">Atur ulang data sintetis</button><button type="button" id="fixture-check">Periksa status sintetis</button><details><summary>Data / status sintetis</summary><output id="fixture-status" aria-live="polite">Menyiapkan kontrol lokal…</output></details></aside>';
  // Polling never assigns select.value: a user's pending mode/dataset choice must not be overwritten.
  const script=`const holder=document.createElement('div');holder.innerHTML=${JSON.stringify(panel)};const controls=holder.firstElementChild,dialog=document.getElementById('modal');document.body.append(controls);function place(){const target=dialog.open?dialog:document.body;if(controls.parentElement!==target)target.append(controls);}new MutationObserver(place).observe(dialog,{childList:true,attributes:true,attributeFilter:['open']});async function update(){const value=await(await fetch('/fixture/status')).json();const output=document.getElementById('fixture-status'),release=document.getElementById('fixture-release');if(output)output.textContent=JSON.stringify(value);if(release)release.disabled=!value.pending;}async function command(action){const mode=document.getElementById('fixture-mode').value,dataset=document.getElementById('fixture-dataset').value;await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,mode,dataset})});if(['new-session','reset-data'].includes(action)){location.hash='/collections';location.reload();return;}await update();}document.getElementById('fixture-set-mode').onclick=()=>command('mode');document.getElementById('fixture-release').onclick=()=>command('release');document.getElementById('fixture-set-dataset').onclick=()=>command('dataset');document.getElementById('fixture-new-session').onclick=()=>command('new-session');document.getElementById('fixture-reset-data').onclick=()=>command('reset-data');document.getElementById('fixture-check').onclick=update;setInterval(update,600);await update();`;
  const css='#fixture-controls{position:relative;z-index:20;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;margin:10px;border:2px solid #183d62;background:#edf6ff;color:#123;font:12px system-ui;max-width:calc(100% - 20px);box-sizing:border-box}#fixture-controls strong,#fixture-controls span,#fixture-controls details{flex-basis:100%;overflow-wrap:anywhere}#fixture-status{display:block;white-space:pre-wrap;overflow-wrap:anywhere;max-height:170px;overflow:auto}#fixture-controls select,#fixture-controls button{font:12px system-ui;padding:5px;max-width:100%;background:white;color:#123;border:1px solid #52718e;border-radius:3px}#fixture-controls button:disabled{opacity:.5}';
  const original=server.listeners('request')[0];server.removeAllListeners('request');
  const json=(res,code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
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
      if(!['mode','release','dataset','new-session','reset-data'].includes(value.action)||!modes.includes(value.mode)||!datasets.includes(value.dataset??dataset)){json(res,400,{error:'Unknown fixture control'});return;}
      controls.push({sequence:++sequence,action:value.action,mode:value.mode,dataset:value.dataset??dataset});
      if(value.action==='mode'){closeWindow('mode-control');mode=value.mode;}
      if(value.action==='release')pending[0]?.release();
      if(value.action==='dataset'){
        closeWindow('dataset-control');dataset=value.dataset??dataset;groups=structuredClone(initialGroups);rows=structuredClone(initialRows);
        if(dataset==='no-empty-id')rows=rows.filter(item=>item.id!=='');
        if(dataset==='reverse-duplicates'){
          const first=rows.findIndex(item=>item.id==='fixture-item-duplicate'),second=rows.findIndex((item,index)=>index>first&&item.id==='fixture-item-duplicate');
          [rows[first],rows[second]]=[rows[second],rows[first]];
        }
      }
      if(['new-session','reset-data'].includes(value.action)){closeWindow(value.action);for(const id of [...sessions.sessions.keys()])sessions.delete(id);autoAuthenticateNext=true;}
      if(value.action==='reset-data'){dataset='default';mode='ready';groups=structuredClone(initialGroups);rows=structuredClone(initialRows);}
      persist();json(res,200,status());return;
    }
    if(url.pathname==='/'&&req.method==='GET'){
      const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
    }
    if(url.pathname==='/api/execute'&&req.method==='POST'){
      const iterator=req[Symbol.asyncIterator].bind(req);
      req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8')),input=value.values||{};browserRequests.push({sequence:++sequence,operationId:value.operationId,confirm:value.confirm??null,confirmType:typeof value.confirm,valuesKeys:Object.keys(input),valuesTypes:Object.fromEntries(Object.entries(input).map(([key,item])=>[key,typeof item])),values:Object.fromEntries(Object.entries(input).map(([key,item])=>[key,safeRowIds.has(item)||(key==='caption'&&typeof item==='string'&&item.length<=4096&&/sintetis/i.test(item))?item:'[non-synthetic input omitted]']))});persist();}catch{browserRequests.push({sequence:++sequence,unrecognizedBody:true});persist();}};
    }
    if(url.pathname.startsWith('/api/maps/bhumi/')||url.pathname.startsWith('/fixture/osm/')){unexpected.push({sequence:++sequence,kind:'map-browser',path:url.pathname});persist();json(res,409,{error:'Maps outside synthetic item fixture'});return;}
    await original(req,res);
  });
  const stop=()=>{closeWindow('fixture-stop');for(const item of [...pending])item.release();persist();server.closeAllConnections();server.close();};
  return {server,port,start:()=>new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{persist();resolve(status());})),stop,snapshot};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const fixture=createCollectionItemActionsBrowserFixture();await fixture.start();
  console.log('Synthetic item actions UI: http://127.0.0.1:4185/#/collections');
  process.once('SIGINT',fixture.stop);process.once('SIGTERM',fixture.stop);
}
