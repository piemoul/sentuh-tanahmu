// Exercise real app entry functions with the real packaged parcel renderer.
// Geometry, identifiers and transports are synthetic; no browser/provider traffic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parcelMapView} from '../parcel-map.js';
import {OPERATIONS} from '../private/operations.mjs';

const lines=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').split(/\r?\n/);
const names=['flowData','flowResultView','collectionDetailView','kkprMapView','activityDocumentGeoData','activityDocumentGeoView','loadCertificateMap'];
const outer=[[106,-6],[106.001,-6],[106.001,-5.999],[106,-5.999],[106,-6]];
const hole=[[106.0002,-5.9998],[106.0004,-5.9998],[106.0004,-5.9996],[106.0002,-5.9996],[106.0002,-5.9998]];
const geometry={type:'Polygon',coordinates:[outer,hole]};
const data={type:'FeatureCollection',features:[{type:'Feature',geometry,properties:{NIB:'SINTETIS <b>tetap teks</b>',LUAS:100,unknown:'UNRENDERED-MAP-PROPERTY'}}]};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function harness(){
  const slot={isConnected:true,innerHTML:''},modal={open:true},calls=[];
  const c=vm.createContext({parcelMapView,JSON,Object,Array,Number,Math,String,Error,
    state:{authenticated:true,operations:structuredClone(OPERATIONS)},sessionEpoch:1,detailSequence:1,flowPageIndex:0,
    flowDetail:null,flowResults:new Map(),persilMapForCertificate:()=>null,persilMapActionView:()=>'',
    nativeListResultView:()=>null,dataItems:()=>null,notice:text=>`<p role="note">${esc(text)}</p>`,esc,
    json:value=>esc(JSON.stringify(value)),ready:op=>op.enabled===true,$:()=>modal,
    record(){},render(){},toast(){},clearPrivate(){},api:async(path,options)=>{calls.push({path,options});return {result:{status:200,data:structuredClone(data)}};},
  });
  for(const name of names){const line=lines.find(line=>new RegExp(`^(?:async )?function ${name}\\(`).test(line));assert.ok(line,name);vm.runInContext(line,c);}
  const button={isConnected:true,disabled:false,textContent:'',dataset:{persilId:' SINTETIS-id /+? ',loading:'false'},closest:()=>({querySelector:()=>slot})};
  return {c,slot,modal,calls,button};
}
function camera(html){const raw=html.match(/<template data-official-camera>(.*?)<\/template>/s)?.[1];assert.ok(raw,'Real official map camera template');return JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'"));}
function raster(html){assert.match(html,/data-official-map/);assert.match(html,/Peta OpenStreetMap dan bidang Bhumi/);assert.match(html,/official-map-canvas/);assert.match(html,/Pin menandai titik acuan/);assert.doesNotMatch(html,/<svg\b|<path\b|<polygon\b/);}

test('manual parcel result uses the actual OSM/Bhumi renderer, camera and escaped map labels',()=>{
  const {c}=harness(),html=c.flowResultView({op:{endpoint:'legacy/GetParcelBoundaryById?persilid={value}'}},{status:200,data});
  raster(html);assert.deepEqual(camera(html).bounds,[[-6,106],[-5.999,106.001]]);
  assert.match(html,/SINTETIS &lt;b&gt;tetap teks&lt;\/b&gt;/);assert.doesNotMatch(html,/<b>tetap teks<\/b>/);
  assert.doesNotMatch(html.split('<details')[0],/UNRENDERED-MAP-PROPERTY/);
});
test('collection parcel detail retains real raster controls and all geometry bounds',()=>{
  const {c}=harness(),before=JSON.stringify(data),html=c.collectionDetailView({status:200,data},'PERSIL');
  raster(html);assert.deepEqual(camera(html).bounds,[[-6,106],[-5.999,106.001]]);
  assert.match(html,/Data batas dari layanan/);assert.equal(JSON.stringify(data),before);
});
test('KKPR polygon and multipolygon previews pass native exterior selections to the real raster renderer',()=>{
  const {c}=harness(),before=JSON.stringify(geometry),html=c.kkprMapView({geometry});
  raster(html);assert.match(html,/<h3>Sketsa KKPR<\/h3>/);assert.match(html,/aria-label="Geometri KKPR dari layanan"/);
  // Excluding the hole changes the vertex mean; these values prove the entry selected the exterior.
  assert.ok(Math.abs(camera(html).center.lng-106.0004)<1e-10);
  assert.ok(Math.abs(camera(html).center.lat-(-5.9996))<1e-10);
  const second=outer.map(([x,y])=>[x+0.01,y]);
  const multi=c.kkprMapView({geometry:{type:'MultiPolygon',coordinates:[[outer,hole],[second]]}});
  raster(multi);assert.deepEqual(camera(multi).bounds[0],[-6,106]);
  assert.equal(camera(multi).bounds[1][0],-5.999);assert.ok(Math.abs(camera(multi).bounds[1][1]-106.011)<1e-10);
  assert.equal(JSON.stringify(geometry),before);
});
test('Activity document geometry reaches real raster preview without inventing identity facts',()=>{
  const {c}=harness(),coordinates=[[outer.map(p=>[...p,12]),hole.map(p=>[...p,13])]],response={status:200,data:{geometri:{type:'native-type',coordinates},tipeHak:'SINTETIS Hak <script>',NIB:'DO-NOT-PROMOTE'}};
  const html=c.activityDocumentGeoView(response);raster(html);
  assert.match(html,/aria-label="Lokasi bidang dari dokumen"/);assert.match(html,/SINTETIS Hak &lt;script&gt;/);
  assert.doesNotMatch(html.split('<details')[0],/DO-NOT-PROMOTE|<dt>NIB<\/dt>/);
  assert.deepEqual(camera(html).bounds,[[-6,106],[-5.999,106.001]]);
  assert.doesNotMatch(c.activityDocumentGeoView({status:200,data:{geometri:null}}),/data-official-map/);
});
test('certificate map loader preserves selected full ID and inserts the real raster after its guarded read',async()=>{
  const {c,slot,calls,button}=harness();await c.loadCertificateMap(button);
  assert.equal(calls.length,1);assert.equal(calls[0].path,'/api/execute');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].options.body.values)),{persilid:' SINTETIS-id /+? '});
  raster(slot.innerHTML);assert.equal(button.disabled,false);assert.equal(button.dataset.loading,'false');
});
test('removed certificate slot cannot receive a late raster map',async()=>{
  const {c,slot,button}=harness();let release;c.api=()=>new Promise(resolve=>release=resolve);
  const work=c.loadCertificateMap(button);slot.isConnected=false;button.isConnected=false;release({result:{status:200,data}});await work;
  assert.doesNotMatch(slot.innerHTML,/data-official-map/);
});
