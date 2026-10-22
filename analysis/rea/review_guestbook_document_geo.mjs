// Actual application functions, synthetic in-process API and minimal DOM only.
// This verifies document geometry reads; it does not submit location or visit evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import {createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry} from '../../webapp/collection-save-persil.js';
// Bind the real new host helpers/module to legacy VM fixtures; assertions and
// existing source-function renderers remain unchanged.
function createPersilFixtureContext(...args){
  const context=vm.createContext(...args);
  Object.assign(context,{createCollectionSavePersil,collectionSavePersilEligible,collectionSavePersilEntry});
  const dependencies=new Set(['nativeResponseObject','nativeAccountSummary','collectionTab','collectionGroupCreated']);
  const declarations=String(source).split(/\r?\n/).filter(line=>/^(?:async )?function (?:persilMap\w+|resetPersilMaps|resetScanHost|scanDisposeLocation)\(/.test(line)||dependencies.has(line.match(/^(?:async )?function (\w+)\(/)?.[1])).join('\n');
  vm.runInContext(declarations,context);
  return context;
}

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parcelMapView,prepareParcelCamera} from '../../webapp/parcel-map.js';
import {OPERATIONS} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);return line;
};
const names = ['resetSearchFileNavigation','resetPartnerNavigation','activityDocumentGeoControls','activityDocumentGeoData','activityDocumentGeoView','loadActivityDocumentGeo','nativeResponseObject','nativeDocumentProfileName','activityDocumentType','activityDetailTarget','activityItem','loadActivityDocument','spsDocumentLinks','clearPrivate','redact'];
const declarations = names.map(get).join('\n');
const endpoints = {geo: '/apis/getGeoJsonInfo', profile: 'account/account_summary', pdf: 'apis/GetDocument', metadata: 'apis/GetDocumentType'};
const operations = Object.fromEntries(Object.entries(endpoints).map(([key, endpoint]) => [key, OPERATIONS.find(op => op.endpoint === endpoint && op.enabled && op.effect === 'read')]));
for (const [key, op] of Object.entries(operations)) assert.ok(op, `Missing enabled read adapter ${key}`);
const q = ' selected : full +% & é/文😀 ', item = {activityType: 'SCANDOKUMEN', contentId: q, subTitle: 'Dokumen elektronik'};
const profile = {status: 200, data: {error: false, data: {nama: 'Synthetic profile'}}};
const pdf = {status: 200, contentType: 'application/pdf', downloadUrl: '/api/download/geo-fixture', previewUrl: '/api/preview/geo-fixture'};
const metadata = showRoute => ({status: 200, data: {error: false, data: {showRoute, type: 'DO-NOT-ROUTE-USING-TYPE'}}});
const ring = (x, y, size) => [[x,y,3],[x+size,y,4],[x+size,y+size,5],[x,y+size,6],[x,y,3]];
const coordinates = [[ring(110,-7,0.01),ring(110.002,-6.998,0.002)],[ring(110.02,-7,0.01)]];
const body = {geometri: {type: 'MultiPolygon', coordinates}, tipeHak: 'Hak Milik'};
const geo = {status: 200, data: body};
const copy = value => JSON.parse(JSON.stringify(value));
const deferred = () => {let resolve, reject;const promise = new Promise((a,b) => {resolve=a;reject=b});return {promise,resolve,reject}};
const flush = async () => {for (let i=0;i<8;i++) await Promise.resolve()};
const decode = text => text.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

function harness() {
  const calls=[], records=[], toasts=[], events={};
  let markup='INITIAL-DIALOG', documentSlot=null, documentButton=null, geoSection=null, geoSlot=null, geoButton=null;
  const detachGeo = () => {if(geoSlot)geoSlot.isConnected=false;if(geoButton)geoButton.isConnected=false;geoSection=null;geoSlot=null;geoButton=null};
  const installGeo = html => {
    detachGeo();
    const id=html.match(/data-action="activity-document-geo" data-document-id="([^"]*)"/);
    if(!id)return;
    geoSlot={innerHTML:'',isConnected:true};
    geoSection={querySelector:selector=>selector==='.activity-document-geo-result'?geoSlot:null};
    const wrapper=geoSection;
    geoButton={dataset:{documentId:decode(id[1])},isConnected:true,disabled:false,textContent:'Lihat lokasi',closest:selector=>selector==='dialog'?modal:selector==='.activity-document-geo'?wrapper:null};
  };
  const modal={open:true,showModal(){this.open=true},close(){this.open=false},
    get innerHTML(){return markup},
    set innerHTML(value){
      if(documentSlot)documentSlot.isConnected=false;if(documentButton)documentButton.isConnected=false;detachGeo();markup=value;documentSlot=null;documentButton=null;
      if(value.includes('activity-document-result')) {
        let text='loading';
        documentSlot={isConnected:true,get innerHTML(){return text},set innerHTML(value){text=value;installGeo(value)}};
        documentButton={disabled:true,isConnected:true};
      }
    },
    querySelector:selector=>selector==='.activity-document-result'?documentSlot:selector==='[data-action="activity-document"]'?documentButton:null,
  };
  const state={authenticated:true,user:{username:'fixture'},operations:OPERATIONS.map(op=>({...op})),results:new Map([[operations.profile.id,profile]]),points:[],activity:[]};
  const c=createPersilFixtureContext({state,route:'activity',sessionEpoch:0, searchFileState: null, partnerFrame: null,detailSequence:0,flowDetail:item,htDetailData:null,flowResults:new Map(),flowQuery:'',comparison:null,comparisonSelection:{},pending:null,selected:null,
    ready:op=>op.enabled===true,write:op=>op.effect==='write',$:()=>modal,render:()=>{},icon:()=>'',notice:text=>text,parcelMapView,
    toast:text=>toasts.push(text),record:(...args)=>records.push(args),document:{addEventListener:(name,handler)=>{(events[name]??=[]).push(handler)}},
    api:async(path,options)=>{
      const stage=Object.keys(operations).find(key=>operations[key].id===options.body.operationId);
      assert.ok(stage,`Unexpected operation ${options.body.operationId}`);calls.push({stage,path,method:options.method,...copy(options.body)});
      return {result:{geo,profile,pdf,metadata:metadata(1)}[stage]};
    },
  });
  vm.runInContext(declarations,c);
  const esc=lines.find(line=>line.startsWith('const $='));vm.runInContext(`globalThis.esc=${esc.slice(esc.indexOf('esc=')+4)}`,c);
  vm.runInContext(lines.find(line=>line.startsWith('const json=')),c);
  for(const action of ['loadActivityDocumentGeo(button)','loadActivityDocument(flowDetail)'])vm.runInContext(lines.find(line=>line.startsWith("document.addEventListener('click'")&&line.includes(action)),c);
  installGeo(c.activityDocumentGeoControls(q));
  return {c,state,modal,calls,records,toasts,events,installGeo,get slot(){return geoSlot},get button(){return geoButton},get documentSlot(){return documentSlot},get documentButton(){return documentButton}};
}
function pauseGeo(h) {
  const d=deferred(),base=h.c.api;
  h.c.api=async(path,options)=>{if(options.body.operationId!==operations.geo.id)return base(path,options);h.calls.push({stage:'geo',path,method:options.method,...copy(options.body)});return d.promise};
  return d;
}
const checks=[];
async function check(name,fn){await fn(harness());checks.push(name)}

await check('direct body retains both polygons, outer and hole rings, extra ordinates, and exact rights text',({c})=>{
  const result=copy(c.activityDocumentGeoData(geo));
  assert.equal(result.type,'FeatureCollection');assert.equal(result.features.length,1);
  assert.deepEqual(result.features[0],{type:'Feature',geometry:{type:'MultiPolygon',coordinates},properties:{tipehak:'Hak Milik'}});
  assert.deepEqual(copy(c.activityDocumentGeoData({...geo,data:JSON.stringify(body)})),result);
});
await check('nullable geometry produces empty features before considering invalid unrelated fields',({c})=>{
  for(const data of [undefined,null,{}, {geometri:null,tipeHak:42},{Geometri:body.geometri},{data:body},{error:true,message:'ignored'}])assert.deepEqual(copy(c.activityDocumentGeoData({status:200,data})),{type:'FeatureCollection',features:[]});
});
await check('valid top-level geometry ignores unrelated envelope-like error, status and data keys',({c})=>{
  const response={status:200,data:{...body,error:true,status:500,message:'Not a model field',data:{geometri:null,tipeHak:'WRONG-NESTED-RIGHTS'}}};
  assert.deepEqual(copy(c.activityDocumentGeoData(response)),copy(c.activityDocumentGeoData(geo)));
});
await check('parser accepts only HTTP 200 and a direct nullable object or once-decoded JSON body',({c})=>{
  for(const status of [undefined,null,'200',201,400])assert.throws(()=>c.activityDocumentGeoData({...geo,status}));
  for(const data of [false,42,[],[body],'not-json','[]',JSON.stringify(JSON.stringify(body))])assert.throws(()=>c.activityDocumentGeoData({status:200,data}));
  assert.equal(c.activityDocumentGeoData({status:200,data:'null'}).features.length,0);
});
await check('native geometry.type is required as string but does not select a different parser shape',({c})=>{
  for(const type of ['MultiPolygon','Polygon','Point','', '<img src=x>'])assert.equal(c.activityDocumentGeoData({status:200,data:{geometri:{...body.geometri,type}}}).features[0].geometry.type,'MultiPolygon');
  for(const type of [undefined,null,42,false,[],{}])assert.throws(()=>c.activityDocumentGeoData({status:200,data:{geometri:{...body.geometri,type}}}));
});
await check('geometry shape stays four lists deep without flattening or accepting numeric coercion',({c})=>{
  for(const invalid of [undefined,null,{},coordinates[0],[[[110,-7]]],[[[[110,'-7']]]],[[[[110,true]]]],[[[[110,null]]]],[[[[110,{}]]]]])assert.throws(()=>c.activityDocumentGeoData({status:200,data:{geometri:{type:'Polygon',coordinates:invalid}}}));
  for(const geometri of [[],false,'x',42])assert.throws(()=>c.activityDocumentGeoData({status:200,data:{geometri}}));
  assert.equal(c.activityDocumentGeoData({status:200,data:{geometri:{type:'MultiPolygon',coordinates:[]}}}).features.length,1);
});
await check('rights defaults are case-sensitive and non-string values fail only when geometry exists',({c})=>{
  for(const tipeHak of [undefined,null])assert.equal(c.activityDocumentGeoData({status:200,data:{...body,tipeHak}}).features[0].properties.tipehak,'Belum Terdaftar');
  assert.equal(c.activityDocumentGeoData({status:200,data:{...body,tipeHak:''}}).features[0].properties.tipehak,'');
  for(const tipeHak of [42,false,{},[]])assert.throws(()=>c.activityDocumentGeoData({status:200,data:{...body,tipeHak}}));
});
await check('non-finite ordinates are rejected including unused altitude without changing source coordinates',({c})=>{
  for(const value of [NaN,Infinity,-Infinity])for(const index of [0,1,2]){const response=copy(geo);response.data.geometri.coordinates[0][0][0][index]=value;assert.throws(()=>c.activityDocumentGeoData(response));assert.equal(response.data.geometri.coordinates[0][0][0][index],value)}
});
await check('view uses every polygon and hole for the official camera without drawing client vectors',({c})=>{
  const html=c.activityDocumentGeoView(geo);assert.match(html,/<h3>Lokasi Bidang<\/h3>/);assert.match(html,/official-map-canvas/);assert.doesNotMatch(html,/<svg|<path |maps\.googleapis\.com|Google Hybrid/i);
  const encoded=html.match(/<template data-official-camera>(.*?)<\/template>/)?.[1];assert.ok(encoded);
  const camera=JSON.parse(decode(encoded)),expected=prepareParcelCamera(c.activityDocumentGeoData(geo));assert.deepEqual(camera,{center:expected.center,zoom:18,bounds:expected.bounds});
  const all=coordinates.flat(2);assert.equal(camera.center.lng,all.reduce((sum,p)=>sum+p[0],0)/all.length);assert.equal(camera.center.lat,all.reduce((sum,p)=>sum+p[1],0)/all.length);
  assert.deepEqual(Object.keys(camera),['center','zoom','bounds']);assert.deepEqual(camera.bounds,[[Math.min(...all.map(p=>p[1])),Math.min(...all.map(p=>p[0]))],[Math.max(...all.map(p=>p[1])),Math.max(...all.map(p=>p[0]))]]);assert.match(html,/Hak Milik/);assert.match(html,/Data lokasi dari layanan/);assert.doesNotMatch(html,/NIB<\/dt>|Luas<\/dt>|latitude|longitude/);
});
await check('out-of-range, incomplete and unclosed rings are not clamped, wrapped or partially drawn',({c})=>{
  const variants=[];
  for(const [index,value] of [[0,181],[1,91]]){const response=copy(geo),closed=response.data.geometri.coordinates[0][0];closed[0][index]=value;closed.at(-1)[index]=value;assert.equal(c.activityDocumentGeoData(response).features[0].geometry.coordinates[0][0][0][index],value);assert.match(c.activityDocumentGeoView(response),/Koordinat bidang/);variants.push(response)}
  for(const ring of [[[110,-7]],[[110,-7],[111,-7],[111,-6],[110,-6]]]){const response=copy(geo);response.data.geometri.coordinates[0][0]=ring;variants.push(response)}
  for(const response of variants){const html=c.activityDocumentGeoView(response);assert.doesNotMatch(html,/<svg|<path |official-map-canvas/);assert.match(html,/Koordinat bidang/);assert.match(html,/Data lokasi dari layanan/)}
});
await check('invalid or empty responses show explicit local status while preserving escaped raw details',({c})=>{
  for(const response of [{status:200,data:null},{status:200,data:{geometri:null}},{status:200,data:{geometri:'<img src=x onerror="bad()">'}},{status:500,data:body}]){const html=c.activityDocumentGeoView(response);assert.match(html,/Lokasi Bidang/);assert.match(html,/Data lokasi dari layanan/);assert.doesNotMatch(html,/<svg|<img src=x/)}
  const html=c.activityDocumentGeoView({status:200,data:{...body,tipeHak:'<img src=x>'}});assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img src=x/);
});
await check('metadata one alone exposes location controls and does not eagerly request geometry',async h=>{
  const base=h.c.api;
  for(const value of [0,2,null,undefined]){h.calls.length=0;h.c.api=async(path,options)=>options.body.operationId===operations.metadata.id?{result:metadata(value)}:base(path,options);await h.c.loadActivityDocument(item);assert.equal(h.button,null);assert.ok(h.calls.every(call=>call.stage!=='geo'))}
  h.c.api=base;h.calls.length=0;await h.c.loadActivityDocument(item);assert.ok(h.button);assert.equal(h.button.dataset.documentId,q);assert.deepEqual(h.calls.map(call=>call.stage),['pdf','metadata']);
});
await check('control markup escapes complete selected q and geometry request passes it unencoded with no additional values',async h=>{
  const unsafe=' full : "<img> +%é ';h.installGeo(h.c.activityDocumentGeoControls(unsafe));assert.equal(h.button.dataset.documentId,unsafe);assert.match(h.c.activityDocumentGeoControls(unsafe),/&quot;&lt;img&gt;/);
  await h.c.loadActivityDocumentGeo(h.button);assert.deepEqual(h.calls,[{stage:'geo',path:'/api/execute',method:'POST',operationId:operations.geo.id,values:{q:unsafe}}]);assert.match(h.slot.innerHTML,/official-map-canvas/);assert.equal(h.button.disabled,false);assert.equal(h.button.dataset.loading,'false');
});
await check('missing, disabled and non-read geometry adapters issue no request and retain the selected PDF',async h=>{
  await h.c.loadActivityDocument(item);const pdfHtml=h.documentSlot.innerHTML;h.calls.length=0;
  for(const override of [null,{enabled:false},{effect:'write'}]){h.state.operations=OPERATIONS.filter(op=>op.id!==operations.geo.id).map(op=>({...op}));if(override)h.state.operations.push({...operations.geo,...override});await h.c.loadActivityDocumentGeo(h.button);assert.equal(h.calls.length,0);assert.match(h.slot.innerHTML,/belum tersedia/);assert.equal(h.documentSlot.innerHTML,pdfHtml)}
});
await check('no authentication, blank q, absent slot, detached slot and closed dialog never request geometry',async h=>{
  h.state.authenticated=false;await h.c.loadActivityDocumentGeo(h.button);h.state.authenticated=true;
  for(const value of [undefined,null,42,'',' ']){h.button.dataset.documentId=value;await h.c.loadActivityDocumentGeo(h.button)}h.button.dataset.documentId=q;
  h.slot.isConnected=false;await h.c.loadActivityDocumentGeo(h.button);h.slot.isConnected=true;h.modal.close();await h.c.loadActivityDocumentGeo(h.button);h.modal.open=true;
  const button={...h.button,closest:selector=>selector==='dialog'?h.modal:null};await h.c.loadActivityDocumentGeo(button);assert.equal(h.calls.length,0);
});
await check('repeated activation during a pending request makes one read and keeps PDF links available',async h=>{
  await h.c.loadActivityDocument(item);const pdfHtml=h.documentSlot.innerHTML;h.calls.length=0;const d=pauseGeo(h),button=h.button,task=h.c.loadActivityDocumentGeo(button);await flush();await h.c.loadActivityDocumentGeo(button);
  assert.equal(h.calls.length,1);assert.equal(button.disabled,true);assert.equal(h.documentSlot.innerHTML,pdfHtml);assert.match(pdfHtml,/Lihat PDF/);d.resolve({result:geo});await task;assert.equal(button.disabled,false);
});
await check('ordinary request failure is escaped and retry successfully obtains geometry for the same q',async h=>{
  const base=h.c.api;h.c.api=async()=>{throw new Error('<img src=x>')};await h.c.loadActivityDocumentGeo(h.button);assert.match(h.slot.innerHTML,/&lt;img/);assert.doesNotMatch(h.slot.innerHTML,/<img src=x|<svg/);assert.equal(h.button.disabled,false);
  h.c.api=base;await h.c.loadActivityDocumentGeo(h.button);assert.match(h.slot.innerHTML,/official-map-canvas/);assert.deepEqual(h.calls[0].values,{q});
});
await check('malformed service geometry remains retryable without a misleading partial map',async h=>{
  const base=h.c.api;h.c.api=async()=>({result:{status:200,data:{geometri:{type:'Point',coordinates:[110,-7]}}}});await h.c.loadActivityDocumentGeo(h.button);assert.doesNotMatch(h.slot.innerHTML,/official-map-canvas/);assert.match(h.slot.innerHTML,/Struktur geometri/);assert.equal(h.button.disabled,false);
  h.c.api=base;await h.c.loadActivityDocumentGeo(h.button);assert.match(h.slot.innerHTML,/official-map-canvas/);
});

for(const change of ['close','navigation','detach','pdf-reload','logout'])for(const outcome of ['success','failure'])await check(`${change} suppresses a stale geometry ${outcome} and preserves replacement state`,async h=>{
  await h.c.loadActivityDocument(item);const d=pauseGeo(h),slot=h.slot,button=h.button,task=h.c.loadActivityDocumentGeo(button);await flush();
  if(change==='close')h.modal.close();if(change==='navigation')h.c.detailSequence++;if(change==='detach')slot.isConnected=false;if(change==='logout'){h.c.sessionEpoch++;h.state.authenticated=false}if(change==='pdf-reload')await h.c.loadActivityDocument({...item,contentId:'NEW-DOCUMENT'});
  slot.innerHTML='NEW-STATE';const replacement=h.documentSlot?.innerHTML;
  if(outcome==='success')d.resolve({result:geo});else d.reject(Object.assign(new Error('OLD-FAILURE'),{code:'UPSTREAM_TIMEOUT'}));await task;
  assert.equal(slot.innerHTML,'NEW-STATE');assert.equal(button.disabled,true);assert.equal(h.documentSlot?.innerHTML,replacement);
  if(change==='pdf-reload'){assert.equal(h.button.dataset.documentId,'NEW-DOCUMENT');assert.equal(slot.isConnected,false)}
});
for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED'])await check(`${code} clears private data, closes the dialog and removes document links`,async h=>{
  await h.c.loadActivityDocument(item);h.state.results.set('private',{fixture:'secret'});h.c.flowResults.set('private',{});const d=pauseGeo(h),task=h.c.loadActivityDocumentGeo(h.button);d.reject(Object.assign(new Error('Synthetic expiry'),{code}));await task;
  assert.equal(h.state.authenticated,false);assert.equal(h.state.user,null);assert.equal(h.state.results.size,0);assert.equal(h.c.flowResults.size,0);assert.equal(h.modal.open,false);assert.equal(h.modal.innerHTML,'');assert.equal(h.button,null);
});
for(const outcome of ['success','auth-expiry'])await check(`old-session geometry ${outcome} cannot change a replacement account`,async h=>{
  const d=pauseGeo(h),task=h.c.loadActivityDocumentGeo(h.button);h.c.sessionEpoch++;h.state.user={username:'replacement'};h.modal.innerHTML='REPLACEMENT';
  if(outcome==='success')d.resolve({result:geo});else d.reject(Object.assign(new Error('Old expiry'),{code:'SESSION_EXPIRED'}));await task;
  assert.equal(h.state.authenticated,true);assert.equal(h.state.user.username,'replacement');assert.equal(h.modal.innerHTML,'REPLACEMENT');assert.equal(h.toasts.length,0);
});
await check('actual delegated click routes the selected control and ignores disabled controls',({c,events,button})=>{
  let selected=null;c.loadActivityDocumentGeo=value=>{selected=value};const event={target:{closest:selector=>selector==='[data-action="activity-document-geo"]'?button:null}};
  for(const handler of events.click)handler(event);assert.equal(selected,button);selected=null;button.disabled=true;for(const handler of events.click)handler(event);assert.equal(selected,null);
});

const report={source:'webapp/app.js',sha256:createHash('sha256').update(source).digest('hex'),passed:checks.length,failed:0,checks,network_calls:0,
  scope:'Actual document geometry parser, renderer, metadata control gate, exact raw q and read adapter, local retry, modal/request/session ownership. Synthetic in-process responses only; no production acceptance, native runtime, visit validation, route navigation or mutation.'};
if(process.argv.includes('--write-report'))fs.writeFileSync(new URL('../webapp/document-geo-frontend-review-latest.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
