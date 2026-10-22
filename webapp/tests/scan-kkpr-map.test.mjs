import test from 'node:test';
import assert from 'node:assert/strict';
import {scanKkprDetails,scanKkprPanelView,scanKkprMapModel,scanKkprSelection,scanKkprDirectionsUrl} from '../scan-location.js';
const response=data=>({status:200,data:{error:false,data}});
const feature=(kind,type,coordinates)=>({type:'Feature',properties:{geom_type:kind},geometry:{type,coordinates}});

test('KKPR detail accepts exacttyped200 errorfalse without using nullable payload status as a publication gate',()=>{
 for(const status of [false,true,null]){
  const data={status,geometryData:null,textualData:{kkpr:{nomor:'unused'}}},actual=scanKkprDetails(response(data));
  assert.equal(actual.data,data);assert.deepEqual(actual.features,[]);assert.deepEqual(actual.sources,[]);
 }
 const actual=scanKkprDetails(response({geometryData:{type:'FeatureCollection',features:[]}}));assert.deepEqual(actual.features,[]);
});

test('KKPR detail rejects errortrue, non200, secondencoded or missing typed envelopes',()=>{
 for(const input of [null,{status:201,data:{error:false,data:{}}},{status:200,data:{error:true,data:{}}},{status:200,data:{data:{}}},{status:200,data:{error:false,data:null}},{status:200,data:{error:false,data:'{}'}},{status:200,data:JSON.stringify({error:false,data:{}})}])assert.throws(()=>scanKkprDetails(input),{code:'SCAN_MAP_UNAVAILABLE'});
});

test('KKPR details retain original features/source indices and preserve raw unused coordinate children',()=>{
 const features=[feature('other','Other',[{raw:'unchanged'},null]),feature('batas','MultiPolygon',[[['not yet numeric']]]),{}],data={geometryData:{features}},before=structuredClone(data),details=scanKkprDetails(response(data));
 assert.equal(details.features,features);assert.deepEqual(details.sources.map(source=>source.sourceIndex),[0,1,2]);
 assert.equal(details.sources[1].feature,features[1]);assert.equal(details.features[0].geometry.coordinates[0],features[0].geometry.coordinates[0]);assert.deepEqual(data,before);
});

test('KKPR detail only normalizes null/missing feature lists, without defaulting wrong container types',()=>{
 for(const data of [{},{geometryData:null},{geometryData:{}},{geometryData:{features:null}}])assert.deepEqual(scanKkprDetails(response(data)).features,[]);
 for(const data of [{status:1},{geometryData:[]},{geometryData:{type:1}},{geometryData:{features:{}}},{geometryData:{features:[null]}},{geometryData:{features:[{type:1}]}},{geometryData:{features:[{properties:[]}]}},{geometryData:{features:[{properties:{geom_type:1}}]}},{geometryData:{features:[{geometry:[]}]}},{geometryData:{features:[{geometry:{type:1}}]}},{geometryData:{features:[{geometry:{coordinates:{}}}]}}])assert.throws(()=>scanKkprDetails(response(data)),{code:'SCAN_MAP_UNRECOGNIZED'});
});

test('KKPR detail bounds JSON source work and refuses known accessors without executing them',()=>{
 assert.throws(()=>scanKkprDetails(response({geometryData:{features:Array.from({length:2001},()=>({}))}})),{code:'SCAN_MAP_UNRECOGNIZED'});
 let called=false;const input=response({get geometryData(){called=true;return null;}});
 assert.throws(()=>scanKkprDetails(input),{code:'SCAN_MAP_UNRECOGNIZED'});assert.equal(called,false);
});

test('KKPR panel displays only the audited dense DaftarBidang count/labels and selected index',()=>{
 const model={entries:[{index:0,sourceIndex:4},{index:1,sourceIndex:9}],data:{pesan:'<svg onload=x>',textualData:{kkpr:{nomor:'<script>x</script>'}}}},html=scanKkprPanelView(model,{selected:1});
 assert.match(html,/>Daftar Bidang</);assert.match(html,/>2 Bidang</);assert.match(html,/>Bidang 1</);assert.match(html,/>Bidang 2</);
 assert.match(html,/data-kkpr-index="1" aria-pressed="true"/);assert.match(html,/data-kkpr-index="0" aria-pressed="false"/);
 assert.doesNotMatch(html,/<svg|<script|sourceIndex|nomor|pesan|data-kkpr-index="[49]"/);
});

test('KKPR empty panel adds no unproved textual model or empty-list copy',()=>{
 const html=scanKkprPanelView({entries:[]});assert.match(html,/>0 Bidang</);assert.doesNotMatch(html,/<button|Tidak ada|NIB|KKPR No|Pemohon/);
});

test('KKPR panel never coerces arbitrary selected values or dense indices into action markup',()=>{
 const model={entries:[{index:0},{index:1}]};
 for(const selected of ['0','<img src=x>',null,-1,2,0.5])assert.doesNotMatch(scanKkprPanelView(model,{selected}),/aria-pressed="true"|<img/);
 for(const entries of [null,{},[{index:'0'}],[{index:1}],Array.from({length:2001},(_,index)=>({index}))])assert.throws(()=>scanKkprPanelView({entries}),{code:'SCAN_MAP_UNRECOGNIZED'});
});

const ring=[[100,-10],[104,-10],[104,-6],[100,-10]];
const map=(features,extra={})=>scanKkprMapModel(response({status:false,...extra,geometryData:{type:'FeatureCollection',features}}));
function partial(features){let failure;try{map(features);}catch(error){failure=error;}assert.equal(failure?.code,'SCAN_MAP_UNRECOGNIZED');assert.equal(failure.partial.model.partial,true);return failure.partial.model;}

test('Polygon outlines do not become selectable rows; only successful izin exteriors create dense source metadata',()=>{
 const features=[feature('other','Polygon',[[[1,2]]]),feature('batas','Polygon',[ring,null]),feature('batasizin','Polygon',[[[110,-4],[112,-2]],'ignored hole']),feature('batasizin','Other',[null]),feature('batas','Other',[null])],model=map(features);
 assert.equal(model.mode,'Polygon');assert.deepEqual(model.outlineIds,['batas_outline_0_0']);assert.deepEqual(model.centers,[{lat:-3,lng:111}]);
 assert.deepEqual(model.entries,[{index:0,sourceIndex:2,filteredIndex:0,componentIndex:0,kind:'batasizin',center:{lat:-3,lng:111},polygonId:'batasizin_0',polygonIds:['batasizin_0'],markerId:'marker_batasizin_0'}]);
 assert.deepEqual([...model.polygonToIndex],[['batasizin_0',0]]);assert.deepEqual([...model.markerByIndex],[[0,'marker_batasizin_0']]);assert.equal(model.polygonToIndex.has('batas_outline_0_0'),false);
 assert.deepEqual(model.initial,{center:{lat:-3,lng:111},zoom:19});assert.equal(model.pointCount,6);assert.equal(model.partial,false);
});

test('MultiPolygon retains component nesting, dense successful order, raw source indices and native filtered-index IDs',()=>{
 const features=[{},feature('batas','MultiPolygon',[[[]],[ring,'ignored hole'],[[[120,0],[122,2]]]]),{properties:{geom_type:'batas'},geometry:null},feature('batasizin','Polygon',[null]),feature('batas','Other',[[[[130,4]]]])],model=map(features);
 assert.equal(model.mode,'MultiPolygon');assert.deepEqual(model.centers,[{lat:-9,lng:102},{lat:1,lng:121},{lat:4,lng:130}]);assert.deepEqual(model.outlineIds,[]);
 assert.deepEqual(model.entries.map(({index,sourceIndex,filteredIndex,componentIndex,polygonId,markerId})=>({index,sourceIndex,filteredIndex,componentIndex,polygonId,markerId})),[
  {index:0,sourceIndex:1,filteredIndex:0,componentIndex:1,polygonId:'batas_0_1',markerId:'marker_batas_0_1'},
  {index:1,sourceIndex:1,filteredIndex:0,componentIndex:2,polygonId:'batas_0_2',markerId:'marker_batas_0_2'},
  {index:2,sourceIndex:4,filteredIndex:2,componentIndex:0,polygonId:'batas_2_0',markerId:'marker_batas_2_0'},
 ]);
 assert.deepEqual(model.initial,{center:{lat:-9,lng:102},zoom:19});assert.equal(model.entries.length,3);assert.equal(model.features.length,5);assert.equal(model.pointCount,7);
});

test('first filtered batas selects the global branch and later types are not individually rerouted',()=>{
 const multi=partial([feature('batas','MultiPolygon',[[ring]]),feature('batas','Polygon',[ring])]);
 assert.equal(multi.mode,'MultiPolygon');assert.equal(multi.entries.length,1);assert.deepEqual(multi.entries[0].polygonIds,['batas_0_0']);
 const polygon=map([{properties:{geom_type:'batas'},geometry:null},feature('batas','MultiPolygon',[[ring]]),feature('batasizin','Polygon',[ring])]);
 assert.equal(polygon.mode,'Polygon');assert.equal(polygon.entries.length,1);assert.equal(polygon.entries[0].kind,'batasizin');assert.equal(polygon.entries[0].sourceIndex,2);
});

test('valid izin works without any batas; unsupported categories and geometry types remain inactive',()=>{
 const model=map([feature('Batas','Polygon',[null]),feature('unknown','MultiPolygon',[null]),feature('batasizin','MultiPolygon',[null]),feature('batasizin','Polygon',[ring])]);
 assert.equal(model.mode,'Polygon');assert.deepEqual(model.outlineIds,[]);assert.equal(model.entries.length,1);assert.equal(model.entries[0].filteredIndex,1);assert.equal(model.entries[0].sourceIndex,3);
});

test('first successful dense center sets the camera regardless of original feature/component position',()=>{
 const model=map([{},feature('batas','MultiPolygon',[[[]],[[]],[ring]]),feature('batas','MultiPolygon',[[[[150,30]]]])]);
 assert.equal(model.entries[0].sourceIndex,1);assert.equal(model.entries[0].componentIndex,2);assert.deepEqual(model.initial,{center:{lat:-9,lng:102},zoom:19});assert.notDeepEqual(model.initial.center,model.centers[1]);
});

test('native center includes the closing duplicate and averages raw ordinates before clamp/wrap',()=>{
 const model=map([feature('batas','MultiPolygon',[[ring],[[[170,100],[190,80]]]])]);
 assert.deepEqual(model.centers,[{lat:-9,lng:102},{lat:90,lng:-180}]);assert.notEqual(model.centers[0].lat,-8);assert.notEqual(model.centers[1].lng,0);assert.notEqual(model.centers[1].lat,85);
});

test('only exterior rings count; holes are ignored even when malformed and extra vertex ordinates are unused',()=>{
 for(const type of ['Polygon','MultiPolygon']){
  const outer=[[106,-6,'ignored'],[108,-4,{unused:true}]],coordinates=type==='Polygon'?[outer,null,'bad hole']:[[outer,null,'bad hole']];
  const model=map([feature(type==='Polygon'?'batasizin':'batas',type,coordinates)]);assert.deepEqual(model.centers,[{lat:-5,lng:107}]);assert.equal(model.pointCount,2);assert.equal(model.entries.length,1);
 }
});

test('empty/null geometry and successful empty rings produce no invented rows or coordinate pin',()=>{
 for(const features of [[],[{}],[feature('batas','MultiPolygon',null)],[feature('batas','MultiPolygon',[])],[feature('batas','MultiPolygon',[[[]]])],[feature('batasizin','Polygon',null)],[feature('batasizin','Polygon',[[]])],[feature('batas','Polygon',[ring])]]){
  const model=map(features);assert.deepEqual(model.entries,[]);assert.deepEqual(model.centers,[]);assert.deepEqual(model.initial,{center:{lat:-6.2,lng:106.816666},zoom:19});assert.equal(scanKkprDirectionsUrl(model,0),null);
 }
});

test('empty components differ from empty exterior rings and null traversed rings are malformed',()=>{
 for(const item of [feature('batas','MultiPolygon',[[]]),feature('batas','MultiPolygon',[[null]]),feature('batasizin','Polygon',[]),feature('batasizin','Polygon',[null])]){
  const model=partial([item]);assert.deepEqual(model.entries,[]);assert.deepEqual(model.centers,[]);assert.deepEqual(model.initial,{center:{lat:-6.2,lng:106.816666},zoom:19});
 }
});

test('malformed outlines fail before izin and preserve only previously processed outline IDs',()=>{
 const model=partial([feature('batas','Polygon',[ring]),feature('batas','Polygon',[[['106',-6]]]),feature('batasizin','Polygon',[ring])]);
 assert.deepEqual(model.outlineIds,['batas_outline_0_0']);assert.deepEqual(model.entries,[]);assert.equal(model.polygonToIndex.size,0);assert.equal(model.markerByIndex.size,0);
});

test('later malformed filled geometry preserves processed dense caches/model as explicit partial diagnostics',()=>{
 const features=[feature('batasizin','Polygon',[ring]),feature('batasizin','Polygon',[[[null,2]]])],model=partial(features);
 assert.equal(model.features,features);assert.equal(model.entries.length,1);assert.deepEqual(model.centers,[{lat:-9,lng:102}]);assert.deepEqual(model.initial,{center:{lat:-9,lng:102},zoom:19});assert.deepEqual([...model.polygonToIndex],[['batasizin_0',0]]);assert.deepEqual([...model.markerByIndex],[[0,'marker_batasizin_0']]);
 assert.match(scanKkprPanelView(model),/>1 Bidang</);assert.equal(scanKkprDirectionsUrl(model,0),'https://www.google.com/maps/search/?api=1&query=-9.0,102.0');
});

test('traversed vertices require two finite actual numbers without coercion; inactive nested data remains untouched',()=>{
 for(const vertex of [null,[],[1],[null,1],[1,null],['106',-6],[106,'-6'],[true,1],{},[NaN,1],[1,Infinity]])assert.equal(partial([feature('batasizin','Polygon',[[vertex]])]).entries.length,0);
 const model=map([feature('other','Polygon',[[['bad',null]]]),feature('batasizin','Other',[null])]);assert.equal(model.entries.length,0);
});

test('browser point and output limits fail with bounded progressive diagnostics instead of invented geometry',()=>{
 const pointLimited=partial([feature('batasizin','Polygon',[Array.from({length:20001},()=>[106,-6])])]);assert.equal(pointLimited.entries.length,0);assert.equal(pointLimited.pointCount,20001);
 const entryLimited=partial([feature('batas','MultiPolygon',Array.from({length:2001},()=>[[[106,-6]]]))]);assert.equal(entryLimited.entries.length,2000);assert.equal(entryLimited.centers.length,2000);assert.equal(entryLimited.polygonToIndex.size,2000);assert.equal(entryLimited.pointCount,2001);
});

test('returned property IDs never deduplicate or replace dense geometry IDs and source input is unchanged',()=>{
 const features=[feature('batasizin','Polygon',[ring]),feature('batasizin','Polygon',[ring])];for(const item of features)item.properties.id=77;
 const before=structuredClone(features),model=map(features);assert.equal(model.entries.length,2);assert.deepEqual(model.entries.map(entry=>entry.polygonId),['batasizin_0','batasizin_1']);assert.deepEqual(features,before);
});

test('selection uses only a valid dense index, exposes original metadata and returns an independent camera',()=>{
 const model=map([feature('other','Polygon',[ring]),feature('batasizin','Polygon',[ring])]),selection=scanKkprSelection(model,0);
 assert.equal(selection.sourceIndex,1);assert.equal(selection.polygonId,'batasizin_0');assert.deepEqual(selection.camera,{center:{lat:-9,lng:102},zoom:19});selection.camera.center.lat=0;assert.equal(model.centers[0].lat,-9);
 for(const index of [-1,1,0.5,'0',null,undefined,'<img>'])assert.equal(scanKkprSelection(model,index),null);
});

test('directions formats the audited selected-center public search URL without GPS, source IDs or implicit navigation',()=>{
 const model=map([feature('batasizin','Polygon',[[[106,-6]]]),feature('batasizin','Polygon',[[[106.5,-6.25]]])]);
 assert.equal(scanKkprDirectionsUrl(model,0),'https://www.google.com/maps/search/?api=1&query=-6.0,106.0');assert.equal(scanKkprDirectionsUrl(model,1),'https://www.google.com/maps/search/?api=1&query=-6.25,106.5');
 for(const index of [-1,2,'0',0.5,null])assert.equal(scanKkprDirectionsUrl(model,index),null);
 const html=scanKkprPanelView(model);assert.doesNotMatch(html,/href=|iframe|script|http|geometry|coordinates|kkprId/);
});
