// Full app and real local API boundary. All service responses and IDs are synthetic.
// No transport in this fixture forwards a request to a production server or map provider.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createServer,publicRoot} from '../server.mjs';
import {SessionStore} from '../private/session.mjs';
import * as operations from '../private/operations.mjs';

const ASSIGN='post-collection-addpersilcollectiontogroup-da897c';
const DELETE_GROUP='delete-collection-deletepersilcollectiongroup-path-argument-1-da9450';
const REMOVE='delete-collection-deletepersilcollectionfromgroup-path-argument-1-da7d60';
const endpoints=new Set(['account/account_summary','collection/GetUserCollection','collection/GetPersilCollectionGroup','Collection/AddPersilCollectionToGroup','Collection/DeletePersilCollectionGroup/{path_argument_1}','Collection/DeletePersilCollectionFromGroup/{path_argument_1}']);
const modes=['ready','error-true','http-503','http-201','malformed','auth-401','slow-success','slow-error','refresh-row-fail','refresh-group-fail','all-invalid-groups','no-groups'];
const defaultReceipt=new URL('../../analysis/webapp/collection-group-actions-browser-transport.json',import.meta.url);
const fixtureUser={username:'penguji-aksi-grup-sintetis',nama:'Penguji Aksi Grup Sintetis',roleUser:'PERORANGAN',userLevel:2,isIkd:false,statusVerifikasi:1};
const groupA='fixture-group-a',groupB='fixture-group-b /+%?&# é';
const initialGroups=[
  {collectionGroupId:groupA,collectionGroupName:'SINTETIS Grup A'},
  {collectionGroupId:groupB,collectionGroupName:'SINTETIS Grup B Khusus'},
  {collectionGroupId:null,collectionGroupName:'SINTETIS Grup ID null'},
  {collectionGroupId:'',collectionGroupName:'SINTETIS Grup ID kosong'},
  {collectionGroupId:'   ',collectionGroupName:'SINTETIS Grup Spasi'},
  {collectionGroupId:groupA,collectionGroupName:'SINTETIS Grup A Duplikat'},
  {collectionGroupId:'fixture-group-null-name',collectionGroupName:null},
  {collectionGroupId:'fixture-group-empty-name',collectionGroupName:''},
].map(row=>({...row,createdAt:'2026-10-19T08:09:00'}));
const row=(id,type,title,groupId,contentId)=>({id,type,contentId,createdAt:'2026-10-19T08:09:00',email:null,title,subTitle:'Subjudul sintetis; ID konten berbeda dari ID koleksi',groupId});
const initialRows=[
  row('fixture-row-a /+%?&# é','PERSIL','SINTETIS Bidang A',groupA,'fixture-content-a-different'),
  row('fixture-row-b','PERSIL',null,groupB,'fixture-content-b-different'),
  row(null,'PERSIL','SINTETIS Bidang ID null',null,'fixture-content-null-row-id'),
  row('','PERSIL','SINTETIS Bidang ID kosong','', 'fixture-content-empty-row-id'),
  row('fixture-row-unassigned','PERSIL','',null,'fixture-content-unassigned'),
  row('fixture-row-space','PERSIL','SINTETIS Bidang Spasi','   ','fixture-content-space'),
  row('fixture-row-berkas','BERKAS','SINTETIS Berkas dalam A',groupA,'fixture-file:fixture-office'),
  row('fixture-row-other','OTHER','SINTETIS Tipe lain dalam A',groupA,'fixture-content-other'),
];

export function createCollectionGroupActionsBrowserFixture({port=4182,receiptFile=defaultReceipt}={}) {
  assert.ok(Number.isInteger(port)&&port>0&&port<=65535);
  const catalog=operations.getPublicCatalog().filter(op=>endpoints.has(op.endpoint));
  assert.equal(catalog.length,6,'Wait for audited action registry to be frozen before starting fixture');
  assert.ok(catalog.every(op=>op.enabled));
  for(const id of [ASSIGN,DELETE_GROUP,REMOVE])assert.ok(catalog.some(op=>op.id===id));
  const calls=[],browserRequests=[],controls=[],actions=[],unexpected=[],pending=[];
  let mode='ready',sequence=0,rowLoads=0,groupLoads=0,autoAuthenticateNext=true,observedAction=null,nextRowFailure=false,nextGroupFailure=false;
  let groups=structuredClone(initialGroups),rows=structuredClone(initialRows);
  const safeGroupIds=new Set(initialGroups.map(item=>item.collectionGroupId??''));
  const safeRowIds=new Set(initialRows.map(item=>item.id??''));
  const safeValues=new Set([...safeGroupIds,...safeRowIds]);
  const sessions=new SessionStore(),createSession=sessions.create.bind(sessions);
  sessions.create=()=>{const session=createSession();if(autoAuthenticateNext){autoAuthenticateNext=false;session.user={...fixtureUser};session.tokens={tokenType:'Bearer',accessToken:'fixture-only-never-real',refreshToken:null,expiredAt:4e9};}return session;};
  const state=()=>({groups:structuredClone(groups),rows:structuredClone(rows)});
  const snapshot=()=>({checkedAt:new Date().toISOString(),fixture:'collection-group-actions-local-only',port,mode,calls,browserRequests,controls,actions,unexpected,rowLoads,groupLoads,pendingResponses:pending.map(item=>({actionId:item.action.id,mode:item.mode})),serverState:state(),catalog:catalog.map(op=>({id:op.id,endpoint:op.endpoint,method:op.method,enabled:op.enabled})),productionRequests:0,providerRequests:0,networkTransportUsed:false});
  const persist=()=>{const filename=receiptFile instanceof URL?fileURLToPath(receiptFile):path.resolve(receiptFile);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,JSON.stringify(snapshot(),null,2)+'\n');};
  const status=()=>({mode,pending:pending.length,rowLoads,groupLoads,writeCalls:actions.length,groupCount:groups.length,rows:rows.map(item=>({title:item.title,type:item.type,groupId:item.groupId})),unexpectedRequests:unexpected.length});
  const closeWindow=reason=>{if(observedAction){observedAction.observationClosedSequence=++sequence;observedAction.observationClosedBy=reason;observedAction.noReadsObserved=observedAction.postActionReads.length===0;observedAction=null;}};
  const unexpectedRequest=(kind,requestPath)=>{unexpected.push({sequence:++sequence,kind,path:requestPath});persist();throw new Error('Unexpected synthetic group action request');};
  const registry={...operations,getPublicCatalog:()=>structuredClone(catalog),prepareOperation:(id,values,context)=>{if(!catalog.some(op=>op.id===id))throw Object.assign(new Error('Operation outside synthetic actions fixture'),{status:403,code:'FIXTURE_OPERATION_REJECTED'});return operations.prepareOperation(id,values,context);}};
  const configuration={configured:true,origin:'https://sentuh.atrbpn.go.id/',reason:'AKSI GRUP: SINTETIS LOKAL',applicationAuthorization:()=> 'AtrBpn fixture-only'};
  function complete(action,capturedMode) {
    const accepted=['ready','error-true','slow-success','refresh-row-fail','refresh-group-fail','all-invalid-groups','no-groups'].includes(capturedMode);
    action.responseStatus=['http-503','slow-error'].includes(capturedMode)?503:capturedMode==='http-201'?201:capturedMode==='auth-401'?401:200;
    action.acceptedSynthetic=accepted;action.completed=true;action.completedSequence=++sequence;action.serverBefore=state();
    if(accepted){
      if(action.kind==='assign'){
        // Empty ID deliberately covers both nullable/empty source IDs in this synthetic server.
        for(const item of rows)if((item.id??'')===action.values.collectionId)item.groupId=action.values.collectionGroupId;
      }else if(action.kind==='delete-group')groups=groups.filter(item=>item.collectionGroupId!==action.dynamicId);
      else for(const item of rows)if((item.id??'')===action.dynamicId)item.groupId=null;
      observedAction=action;
      if(capturedMode==='refresh-row-fail')nextRowFailure=true;
      if(capturedMode==='refresh-group-fail')nextGroupFailure=true;
    }
    action.serverAfter=state();persist();
    if(['http-503','slow-error'].includes(capturedMode))return Response.json({error:true,message:'Gangguan aksi grup sintetis'},{status:503});
    if(capturedMode==='http-201')return Response.json({error:false,message:'Status 201 sintetis',data:'fixture-not-accepted-201'},{status:201});
    if(capturedMode==='auth-401')return Response.json({error:true,message:'Sesi sintetis berakhir'},{status:401});
    if(capturedMode==='malformed')return Response.json({error:false,message:'Model respons sintetis rusak',data:{unexpected:'MODEL-RUSAK-TIDAK-BOLEH-BOCOR'}});
    return Response.json({error:capturedMode==='error-true',message:capturedMode==='error-true'?'Envelope native error:true tetap diterima':null,data:'fixture-action-'+action.id,unknown:'discarded'});
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
    if(url.pathname==='/account/account_summary'){assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof URLSearchParams);assert.deepEqual([...init.body],[['appVersion','6.1.5']]);return Response.json({error:false,data:{...fixtureUser}});}
    if(['/collection/GetUserCollection','/collection/GetPersilCollectionGroup'].includes(url.pathname)){
      assert.equal(init.method,'GET');assert.equal(url.search,'');assert.equal(init.body,undefined);
      const kind=url.pathname.endsWith('GetUserCollection')?'rows':'groups';
      if(observedAction){observedAction.postActionReads.push({sequence:call.sequence,kind,path:url.pathname});call.refreshForAction=observedAction.id;const kinds=observedAction.postActionReads.map(item=>item.kind);observedAction.fullRefreshObserved=kinds.includes('rows')&&kinds.includes('groups');observedAction.noReadsObserved=false;}
      if(kind==='rows'){rowLoads++;const fail=nextRowFailure;nextRowFailure=false;persist();if(fail)return Response.json({error:true,message:'Refresh bidang sintetis gagal'},{status:503});return Response.json({error:false,message:null,data:rows});}
      groupLoads++;const fail=nextGroupFailure;nextGroupFailure=false;persist();if(fail)return Response.json({error:true,message:'Refresh grup sintetis gagal'},{status:503});
      const data=mode==='no-groups'?[]:mode==='all-invalid-groups'?groups.filter(item=>item.collectionGroupId===null||item.collectionGroupId===''):groups;
      return Response.json({error:false,message:null,data});
    }
    closeWindow('next-write');
    let action;
    if(url.pathname==='/Collection/AddPersilCollectionToGroup'){
      assert.equal(init.method,'POST');assert.equal(url.search,'');assert.ok(init.body instanceof FormData);
      const parts=[...init.body];assert.deepEqual(parts.map(([key])=>key),['collectionGroupId','collectionId']);assert.ok(parts.every(([,value])=>typeof value==='string'));
      const values=Object.fromEntries(parts);assert.ok(safeGroupIds.has(values.collectionGroupId)&&safeRowIds.has(values.collectionId),'Only known synthetic IDs are accepted');
      action={id:actions.length+1,kind:'assign',operationId:ASSIGN,sequence:call.sequence,mode,values,parts:parts.map(([key,value])=>({key,type:typeof value})),ambiguousEmptyCollectionId:values.collectionId===''};
    }else{
      const match=/^\/Collection\/(DeletePersilCollectionGroup|DeletePersilCollectionFromGroup)\/(.*)$/.exec(url.pathname);
      if(!match)return unexpectedRequest('upstream',url.pathname);
      assert.equal(init.method,'DELETE');assert.equal(url.search,'');assert.equal(init.body,undefined);
      const dynamicId=decodeURIComponent(match[2]);assert.ok((match[1]==='DeletePersilCollectionGroup'?safeGroupIds:safeRowIds).has(dynamicId),'Only known synthetic path IDs are accepted');
      action={id:actions.length+1,kind:match[1]==='DeletePersilCollectionGroup'?'delete-group':'remove',operationId:match[1]==='DeletePersilCollectionGroup'?DELETE_GROUP:REMOVE,sequence:call.sequence,mode,dynamicId,encodedComponent:match[2],bodyKind:typeof init.body};
    }
    Object.assign(action,{rowLoadsBefore:rowLoads,groupLoadsBefore:groupLoads,postActionReads:[],completed:false});actions.push(action);call.actionId=action.id;persist();return responseFor(action,init);
  }});
  const panel='<aside id="fixture-controls" aria-label="Kontrol fixture sintetis"><strong>AKSI GRUP · SINTETIS LOKAL</strong><span>Semua grup, bidang, ID, dan perubahan hanya data uji lokal. Tidak ada akses server asli.</span><label for="fixture-mode">Mode respons sintetis</label><select id="fixture-mode">'+modes.map(item=>'<option value="'+item+'">'+item+'</option>').join('')+'</select><button type="button" id="fixture-set-mode">Terapkan mode sintetis</button><button type="button" id="fixture-release">Lepaskan respons tertunda</button><button type="button" id="fixture-new-session">Sesi sintetis baru</button><button type="button" id="fixture-reset-data">Atur ulang data sintetis</button><button type="button" id="fixture-check">Periksa status sintetis</button><output id="fixture-status" aria-live="polite">Menyiapkan kontrol lokal…</output></aside>';
  // Deliberately do not assign #fixture-mode.value in update: polling must preserve pending user selection.
  const script=`const holder=document.createElement('div');holder.innerHTML=${JSON.stringify(panel)};const controls=holder.firstElementChild,dialog=document.getElementById('modal');document.body.append(controls);function place(){const target=dialog.open?dialog:document.body;if(controls.parentElement!==target)target.append(controls);}new MutationObserver(place).observe(dialog,{childList:true,attributes:true,attributeFilter:['open']});async function update(){const value=await(await fetch('/fixture/status')).json();const output=document.getElementById('fixture-status'),release=document.getElementById('fixture-release');if(output)output.textContent=JSON.stringify(value);if(release)release.disabled=!value.pending;}async function command(action){const mode=document.getElementById('fixture-mode').value;await fetch('/fixture/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,mode})});if(['new-session','reset-data'].includes(action)){location.hash='/collections';location.reload();return;}await update();}document.getElementById('fixture-set-mode').onclick=()=>command('mode');document.getElementById('fixture-release').onclick=()=>command('release');document.getElementById('fixture-new-session').onclick=()=>command('new-session');document.getElementById('fixture-reset-data').onclick=()=>command('reset-data');document.getElementById('fixture-check').onclick=update;setInterval(update,600);await update();`;
  const css='#fixture-controls{position:relative;z-index:20;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px;margin:10px;border:2px solid #183d62;background:#edf6ff;color:#123;font:12px system-ui;max-width:calc(100% - 20px);box-sizing:border-box}#fixture-controls strong,#fixture-controls span,#fixture-status{flex-basis:100%;overflow-wrap:anywhere}#fixture-controls select,#fixture-controls button{font:12px system-ui;padding:5px;max-width:100%;background:white;color:#123;border:1px solid #52718e;border-radius:3px}#fixture-controls button:disabled{opacity:.5}';
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
      if(!['mode','release','new-session','reset-data'].includes(value.action)||!modes.includes(value.mode)){json(res,400,{error:'Unknown fixture control'});return;}
      controls.push({sequence:++sequence,action:value.action,mode:value.mode});
      if(value.action==='mode'){closeWindow('mode-control');mode=value.mode;}
      if(value.action==='release')pending[0]?.release();
      if(['new-session','reset-data'].includes(value.action)){closeWindow(value.action);for(const id of [...sessions.sessions.keys()])sessions.delete(id);autoAuthenticateNext=true;}
      if(value.action==='reset-data'){groups=structuredClone(initialGroups);rows=structuredClone(initialRows);nextRowFailure=false;nextGroupFailure=false;}
      persist();json(res,200,status());return;
    }
    if(url.pathname==='/'&&req.method==='GET'){
      const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace('</head>','<link rel="stylesheet" href="/fixture/controls.css"></head>').replace('</body>','<script type="module" src="/fixture/controls.js"></script></body>');
      res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
    }
    if(url.pathname==='/api/execute'&&req.method==='POST'){
      const iterator=req[Symbol.asyncIterator].bind(req);
      req[Symbol.asyncIterator]=async function*(){const chunks=[];for await(const chunk of iterator()){chunks.push(chunk);yield chunk;}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8')),input=value.values||{};browserRequests.push({sequence:++sequence,operationId:value.operationId,confirm:value.confirm??null,confirmType:typeof value.confirm,valuesKeys:Object.keys(input),valuesTypes:Object.fromEntries(Object.entries(input).map(([key,item])=>[key,typeof item])),values:Object.fromEntries(Object.entries(input).map(([key,item])=>[key,safeValues.has(item)?item:'[non-synthetic input omitted]']))});persist();}catch{browserRequests.push({sequence:++sequence,unrecognizedBody:true});persist();}};
    }
    if(url.pathname.startsWith('/api/maps/bhumi/')||url.pathname.startsWith('/fixture/osm/')){unexpected.push({sequence:++sequence,kind:'map-browser',path:url.pathname});persist();json(res,409,{error:'Maps outside synthetic action fixture'});return;}
    await original(req,res);
  });
  const stop=()=>{closeWindow('fixture-stop');for(const item of [...pending])item.release();persist();server.closeAllConnections();server.close();};
  return {server,port,start:()=>new Promise(resolve=>server.listen(port,'127.0.0.1',()=>{persist();resolve(status());})),stop,snapshot};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const fixture=createCollectionGroupActionsBrowserFixture();await fixture.start();
  console.log('Synthetic group actions UI: http://127.0.0.1:4182/#/collections');
  process.once('SIGINT',fixture.stop);process.once('SIGTERM',fixture.stop);
}
