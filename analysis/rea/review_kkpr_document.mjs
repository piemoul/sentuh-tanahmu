// Actual frontend functions; generated data and deferred in-process responses only.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS} from '../../webapp/private/operations.mjs';
const source=fs.readFileSync(new URL('../../webapp/app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/);
const names=['resetSearchFileNavigation','resetPartnerNavigation','kkprDocumentTarget','nativeDocumentProfileName','kkprDocumentControls','loadKkprDocument','nativeResponseObject','spsDocumentLinks','clearPrivate'];
const functions=names.map(name=>{const line=lines.find(line=>new RegExp(`^(async )?function ${name}\\(`).test(line));assert.ok(line,name);return line}).join('\n');
const profileOp=OPERATIONS.find(o=>o.endpoint==='account/account_summary'),documentOp=OPERATIONS.find(o=>o.endpoint==='apis/GetDocument');
const pdf={status:200,contentType:'application/pdf',downloadUrl:'/api/download/fixture-pdf',previewUrl:'/api/preview/fixture-pdf'};
const profile=name=>({status:200,data:{error:false,data:{nama:name,username:'NOT-NAME',namaPemilik:'NOT-PROFILE'}}});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {resolve,reject,promise}};
const copy=value=>JSON.parse(JSON.stringify(value));
function harness(){
  const calls=[],records=[],events={},modal={open:true,innerHTML:'detail',close(){this.open=false}};
  const slot={innerHTML:'initial',isConnected:true};
  const button={dataset:{kkprId:' selected-id : & + '},isConnected:true,disabled:false,textContent:'Lihat Dokumen',closest:selector=>selector==='dialog'?modal:{querySelector:()=>slot}};
  const state={authenticated:true,user:{username:'NOT-NAME'},operations:OPERATIONS.map(o=>({...o})),results:new Map(),points:[],activity:[]};
  const c=vm.createContext({state,sessionEpoch:0, searchFileState: null, partnerFrame: null,detailSequence:0,flowResults:new Map(),flowDetail:null,htDetailData:null,flowQuery:'',comparison:null,comparisonSelection:{},pending:null,selected:null,
    ready:o=>o.enabled===true,write:o=>o.effect==='write',$:()=>modal,render:()=>{},toast:()=>{},record:(...args)=>records.push(args),icon:()=>'',notice:text=>text,
    document:{addEventListener:(event,handler)=>events[event]=handler},
    api:async(path,options)=>{calls.push({path,...options.body});return {result:options.body.operationId===profileOp.id?profile(' Profile & + '):pdf}}});
  vm.runInContext(functions,c);
  const esc=lines.find(line=>line.startsWith('const $='));vm.runInContext(`globalThis.esc=${esc.slice(esc.indexOf('esc=')+4)}`,c);
  vm.runInContext(lines.find(line=>line.startsWith("document.addEventListener('click'")&&line.includes('loadKkprDocument(button)')),c);
  return {c,state,slot,button,modal,calls,records,events};
}
const checks=[];
async function check(name,fn){await fn(harness());checks.push(name)}
await check('selected ID is preserved verbatim before the native KKPRKU suffix',({c})=>{
  assert.deepEqual(copy(c.kkprDocumentTarget({kkprId:' id : & + '})),{q:' id : & + :KKPRKU'});
  for(const kkprId of [null,undefined,'',' ',7])assert.equal(c.kkprDocumentTarget({kkprId}),null);
});
await check('profile name comes only from the account summary nama field with native null fallback',({c})=>{
  assert.deepEqual(copy(c.nativeDocumentProfileName(profile(' Exact & + '))),{name:' Exact & + '});
  for(const name of [undefined,null,''])assert.deepEqual(copy(c.nativeDocumentProfileName(profile(name))),{name:''});
  for(const error of [undefined,null,'false',0,1]){const response=profile('name');response.data.error=error;assert.equal(c.nativeDocumentProfileName(response),null);}
  for(const response of [null,{status:200,data:{nama:'wrong-envelope'}},{status:200,data:{error:true,data:{nama:'rejected'}}},profile(42),{...profile('name'),status:201}])assert.equal(c.nativeDocumentProfileName(response),null);
});
await check('document control escapes the selected ID and remains absent without a usable ID',({c})=>{
  assert.match(c.kkprDocumentControls({kkprId:'id"<img>'}),/data-kkpr-id="id&quot;&lt;img&gt;"/);
  assert.doesNotMatch(c.kkprDocumentControls({kkprId:null}),/data-action=/);
});
await check('cached summary avoids an extra read and never substitutes login username',async({c,state,button,slot,calls})=>{
  state.results.set(profileOp.id,profile(' Exact & + '));await c.loadKkprDocument(button);
  assert.equal(calls.length,1);assert.equal(calls[0].operationId,documentOp.id);
  assert.deepEqual(copy(calls[0].values),{q:' selected-id : & + :KKPRKU',name:' Exact & + '});
  assert.match(slot.innerHTML,/Lihat PDF/);assert.match(slot.innerHTML,/Unduh PDF/);assert.equal(button.disabled,false);
});
await check('missing cache reads account summary before requesting the selected document',async({c,button,calls,state})=>{
  await c.loadKkprDocument(button);assert.deepEqual(calls.map(call=>call.operationId),[profileOp.id,documentOp.id]);
  assert.deepEqual(copy(calls[0].values),{});assert.equal(calls[1].values.name,' Profile & + ');
  assert.equal(state.results.size,0,'Secondary profile lookup must not overwrite a newer profile request');
});
await check('valid nullable or empty profile name reaches the form without a fabricated substitute',async({c,state,button,calls})=>{
  state.results.set(profileOp.id,profile(null));await c.loadKkprDocument(button);assert.equal(calls[0].values.name,'');
});
await check('unrecognized profile stops the document request and exposes retry',async({c,button,slot,calls})=>{
  c.api=async()=>{calls.push('profile');return {result:profile(42)}};await c.loadKkprDocument(button);
  assert.equal(calls.length,1);assert.match(slot.innerHTML,/Nama profil belum/);assert.equal(button.disabled,false);assert.doesNotMatch(slot.innerHTML,/href=/);
});
await check('unavailable document adapter performs no request',async({c,state,button,calls,slot})=>{
  state.operations=state.operations.filter(op=>op.id!==documentOp.id);await c.loadKkprDocument(button);
  assert.equal(calls.length,0);assert.match(slot.innerHTML,/belum tersedia/);
});
await check('double click while loading issues one profile lookup and one document request',async({c,button,calls})=>{
  const d=deferred();c.api=async(path,options)=>{calls.push(options.body.operationId);return calls.length===1?d.promise:{result:pdf}};
  const task=c.loadKkprDocument(button);await c.loadKkprDocument(button);assert.equal(calls.length,1);
  d.resolve({result:profile('name')});await task;assert.deepEqual(calls,[profileOp.id,documentOp.id]);assert.equal(button.disabled,false);
});
for(const change of ['close','navigate','detach','logout'])await check(`${change} during profile lookup prevents a subsequent document request`,async({c,button,modal,slot,state,calls})=>{
  const d=deferred();c.api=()=>{calls.push('profile');return d.promise};const task=c.loadKkprDocument(button);
  if(change==='close')modal.close();if(change==='navigate')c.detailSequence++;if(change==='detach')slot.isConnected=false;if(change==='logout'){c.sessionEpoch++;state.authenticated=false;}
  slot.innerHTML='new-state';d.resolve({result:profile('name')});await task;assert.equal(calls.length,1);assert.equal(slot.innerHTML,'new-state');
});
for(const change of ['close','navigate','detach','logout'])await check(`${change} during PDF retrieval suppresses stale links`,async({c,state,button,modal,slot})=>{
  state.results.set(profileOp.id,profile('name'));const d=deferred();c.api=()=>d.promise;const task=c.loadKkprDocument(button);
  if(change==='close')modal.close();if(change==='navigate')c.detailSequence++;if(change==='detach')slot.isConnected=false;if(change==='logout'){c.sessionEpoch++;state.authenticated=false;}
  slot.innerHTML='new-state';d.resolve({result:pdf});await task;assert.equal(slot.innerHTML,'new-state');
});
await check('invalid PDF link result stays local and can be retried',async({c,state,button,slot})=>{
  state.results.set(profileOp.id,profile('name'));c.api=async()=>({result:{...pdf,previewUrl:'https://example.invalid/secret'}});
  await c.loadKkprDocument(button);assert.doesNotMatch(slot.innerHTML,/href=/);assert.equal(button.disabled,false);
  c.api=async()=>({result:pdf});await c.loadKkprDocument(button);assert.match(slot.innerHTML,/\/api\/preview\/fixture-pdf/);
});
for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED'])await check(`${code} clears private state and closes the dialog`,async({c,state,button,modal})=>{
  state.results.set(profileOp.id,profile('name'));c.api=async()=>{throw Object.assign(new Error('fixture expiry'),{code})};await c.loadKkprDocument(button);
  assert.equal(state.authenticated,false);assert.equal(state.user,null);assert.equal(state.results.size,0);assert.equal(modal.open,false);assert.equal(modal.innerHTML,'');
});
await check('click handler dispatches the document action to the actual loader',async({c,events,button,calls})=>{
  let selected=null;c.loadKkprDocument=value=>{selected=value};events.click({target:{closest:selector=>selector==='[data-action="kkpr-document"]'?button:null}});
  assert.equal(selected,button);assert.equal(calls.length,0);
});
const report={source:'webapp/app.js',sha256:createHash('sha256').update(source).digest('hex'),passed:checks.length,failed:0,checks,network_calls:0,scope:'Actual KKPR document selection/profile binding/lifecycle with synthetic API. Backend PDF acceptance and browser rendering tested separately.'};
if(process.argv.includes('--write-report'))fs.writeFileSync(new URL('../webapp/kkpr-document-frontend-review-latest.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
