import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=source.indexOf('// Office markers use the entire original nearby snapshot.');
assert.ok(start>0);
const helper=source.slice(start),definitions=helper.slice(0,helper.indexOf("document.addEventListener('click'"));
const old=['getOfficeState','officeEntries','officeFiltersView','officeFeaturesView','officeListView','officeSelectedView','officeLocationControls','officePage','openOfficeItem','filterOffices','toggleOfficeFilter','renderOffice'];
const functions=old.map(name=>{const line=source.split(/\r?\n/).find(line=>line.startsWith('function '+name+'('));assert.ok(line,name);return line;}).join('\n');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const row=(name,id=name)=>({kantorId:id,namaKantor:name,alamat:'Alamat '+name,latitude:-6.1,longitude:106.8,jarak:1,statusAntrian:1,statusPeralihanEl:0,statusKiosk:1});
function setup(){
 const queued=[],captures=[],controls=[{disabled:true}],listeners=[],status={textContent:''};let renders=0,requests=0;
 const region={querySelector:()=>status,querySelectorAll:()=>controls};
 let canvas={isConnected:true,closest:()=>region};
 const c={Map,Set,Object,Array,Number,String,JSON,Date,Promise,route:'office',sessionEpoch:2,detailSequence:3,officeMapMount:null,flowResults:new Map(),state:{connection:{configured:true}},document:{addEventListener:(event,handler)=>listeners.push(handler)},queueMicrotask:fn=>queued.push(fn),$:selector=>selector==='#main [data-office-map-canvas]'?canvas:null,esc,icon:()=>'',head:()=>'<h1>Kantor</h1>',empty:(...args)=>args.join(' '),notice:esc,officeOperation:()=>({enabled:true}),render:()=>renders++,api:()=>{requests++;throw Error('No API allowed');},loadMapLibrary:()=>{throw Error('Loader only passed; not called by integration stub');},createOfficeMap:(target,input,options)=>{
  let resolve;const capture={target,input,options,destroyed:0,controls:[],camera:{center:{lat:-6.2,lng:106.9},zoom:12.5}};
  capture.ready=new Promise(yes=>resolve=yes);capture.resolve=resolve;
  capture.controller={ready:capture.ready,getCamera:()=>capture.camera,destroy:()=>capture.destroyed++,control:action=>{capture.controls.push(action);return true;}};
  captures.push(capture);return capture.controller;
 }};
 vm.createContext(c);vm.runInContext(functions+'\n'+helper,c);
 const owner=c.getOfficeState();owner.rows=[row('ALFA',' duplicate '),row('BETA',' duplicate '),row('<img src=x onerror=bad>')];
 return {c,owner,queued,captures,controls,status,region,listeners,get canvas(){return canvas;},set canvas(value){canvas=value;},get renders(){return renders;},get requests(){return requests;},async flush(){for(const fn of queued.splice(0))fn();await Promise.resolve();},replaceCanvas(){canvas={isConnected:true,closest:()=>region};return canvas;}};
}
test('office page renders a map without acquiring a device position or making a read',async()=>{
 const h=setup();h.owner.rows=null;const html=h.c.officePage();assert.match(html,/data-office-map-canvas/);assert.doesNotMatch(html,/belum tersedia di browser ini/);await h.flush();assert.equal(h.captures.length,1);assert.equal(h.captures[0].input.entries.length,0);assert.equal(h.captures[0].input.selected,null);assert.equal(h.requests,0);
});
test('local list filters never remove original map rows or replace duplicate raw office IDs',async()=>{
 const h=setup();h.owner.query='ALFA';h.owner.filters=[2];const html=h.c.officePage();assert.match(html,/data-action="office-select" data-index="0"/);assert.doesNotMatch(html,/data-action="office-select" data-index="1"/);await h.flush();const input=h.captures[0].input;assert.equal(input.entries.length,3);for(let index=0;index<3;index++){assert.equal(input.entries[index].index,index);assert.equal(input.entries[index].item,h.owner.rows[index]);}assert.equal(input.entries[0].item.kantorId,input.entries[1].item.kantorId);assert.equal(input.sourceToken,h.owner.rows);assert.equal(h.requests,0);
});
test('marker callback selects an original row hidden by the list filter',async()=>{
 const h=setup();h.owner.query='ALFA';h.c.officePage();await h.flush();const capture=h.captures[0];capture.options.onSelect(1);assert.equal(h.owner.selected,h.owner.rows[1]);assert.equal(h.owner.detailOpen,true);assert.equal(h.owner.mapCamera,null);assert.equal(capture.destroyed,1);assert.equal(h.renders,1);assert.equal(h.requests,0);
});
test('visible list selection preserves its filter guard and clears old camera before remount',async()=>{
 const h=setup();h.owner.query='ALFA';h.c.officePage();await h.flush();h.c.openOfficeItem(1);assert.equal(h.owner.selected,null);assert.equal(h.renders,0);h.c.openOfficeItem(0);assert.equal(h.owner.selected,h.owner.rows[0]);assert.equal(h.owner.mapCamera,null);assert.equal(h.captures[0].destroyed,1);assert.equal(h.renders,1);for(const index of [-1,0.5,99])assert.equal(h.c.selectOfficeMapItem(index),false);assert.equal(h.renders,1);
});
test('camera changes and full list rerenders preserve the current map camera',async()=>{
 const h=setup();h.c.officePage();await h.flush();const capture=h.captures[0],camera={center:{lat:0,lng:110},zoom:8.25};capture.options.onCamera(camera);assert.equal(h.owner.mapCamera,camera);capture.camera=camera;h.c.officePage();h.replaceCanvas();await h.flush();assert.equal(capture.destroyed,1);assert.equal(h.captures.length,2);assert.equal(h.captures[1].input.camera,camera);assert.equal(h.requests,0);
});
test('two queued renders mount only the newest canvas generation',async()=>{
 const h=setup();h.c.officePage();h.c.officePage();await h.flush();assert.equal(h.captures.length,1);h.c.disposeOfficeMap();assert.equal(h.captures[0].destroyed,1);h.c.disposeOfficeMap();assert.equal(h.captures[0].destroyed,1);
});
test('route/session/navigation/source/owner/detached-canvas retire all map callbacks',async()=>{
 const mutations=[h=>h.c.route='services',h=>h.c.sessionEpoch++,h=>h.c.detailSequence++,h=>h.owner.rows=[...h.owner.rows],h=>h.c.flowResults.set('office:nearby',{}),h=>h.canvas.isConnected=false,h=>h.replaceCanvas()];
 for(const mutate of mutations){const h=setup();h.owner.detailOpen=true;h.c.officePage();await h.flush();const capture=h.captures[0];mutate(h);assert.equal(capture.options.isCurrent(),false);const before=h.owner.mapCamera;capture.options.onSelect(1);capture.options.onClose();capture.options.onCamera({center:{lat:1,lng:1},zoom:2});capture.resolve(true);await Promise.resolve();assert.equal(h.owner.selected,null);assert.equal(h.owner.detailOpen,true);assert.equal(h.owner.mapCamera,before);assert.equal(h.renders,0);assert.equal(h.controls[0].disabled,true);}
});
test('retired queued renders cannot load a library or create a manager',async()=>{
 for(const mutate of [h=>h.c.route='account',h=>h.c.sessionEpoch++,h=>h.owner.rows=[]]){const h=setup();h.c.officePage();mutate(h);await h.flush();assert.equal(h.captures.length,0);assert.equal(h.requests,0);}
});
test('map close hides the selected overlay without changing the selected office',async()=>{
 const h=setup();h.owner.selected=h.owner.rows[1];h.owner.detailOpen=true;h.c.officePage();await h.flush();const capture=h.captures[0];assert.equal(capture.input.selected,1);capture.options.onClose();assert.equal(h.owner.detailOpen,false);assert.equal(h.owner.selected,h.owner.rows[1]);assert.equal(h.renders,1);capture.options.onClose();assert.equal(h.renders,1);
});
test('ready enables only current controls; failure leaves them unavailable',async()=>{
 for(const ok of [true,false]){const h=setup();h.c.officePage();await h.flush();h.captures[0].resolve(ok);await Promise.resolve();assert.equal(h.controls[0].disabled,!ok);}
});
test('unavailable selected snapshots produce no invented index or office',async()=>{
 const h=setup();h.owner.selected=row('OLD');h.c.officePage();await h.flush();assert.equal(h.captures[0].input.selected,null);assert.equal(h.captures[0].input.entries.length,3);
});
test('control events are scoped to the active office map and enabled buttons',async()=>{
 const h=setup();h.c.officePage();await h.flush();const button={disabled:false,isConnected:true,dataset:{officeMapAction:'in'},closest:selector=>selector==='[data-office-map]'?h.region:button},event={target:{closest:()=>button}},listener=h.listeners[0];listener(event);assert.deepEqual(h.captures[0].controls,['in']);button.disabled=true;listener(event);button.disabled=false;button.isConnected=false;listener(event);button.isConnected=true;h.c.route='account';listener(event);assert.deepEqual(h.captures[0].controls,['in']);
});
