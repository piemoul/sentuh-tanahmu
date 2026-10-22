import test from 'node:test';
import assert from 'node:assert/strict';
import {scanPbtMapModel,scanPbtRows,scanPbtPanelView,scanSpecialMapView,scanPbtDirectionsUrl} from '../scan-location.js';
const response=data=>({status:200,data:{error:false,data}});
const row=(id,nib,coordinates,type='MultiPolygon')=>({nib,luas:'12.50',noBerkas:'1/2026',lokasi:'SYNTHETIC location',batas:{id,tipeHak:'SYNTHETIC',geometri:{type,coordinates}}});
const ring=[[100,-10],[104,-10],[104,-6],[100,-10]];
const almost=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
test('PBT projection retains source slots and index0 last-ring initial camera at zoom19',()=>{
  const rows=[row('A','A',[[ring,[[110,-2],[112,-2],[112,0]]]]),row('B','B',[[[[120,0],[122,2]]]])],source=response({nomor:'PBT',kantor:'Kantor',daftarBidangTanah:rows}),before=structuredClone(source),model=scanPbtMapModel(source);
  assert.equal(model.centers.length,2);almost(model.centers[0].lat,-4/3);almost(model.centers[0].lng,334/3);assert.deepEqual(model.initial,{center:model.centers[0],zoom:19});assert.deepEqual(model.centers[1],{lat:1,lng:121});assert.equal(model.pointCount,9);assert.deepEqual(source,before);
});
test('mean includes closing vertices and every nonempty ring; it is not a geometric centroid or bounds midpoint',()=>{
  const model=scanPbtMapModel(response({daftarBidangTanah:[row('A','A',[[ring]])]}));assert.deepEqual(model.centers[0],{lat:-9,lng:102});assert.notEqual(model.centers[0].lat,-8);assert.equal(Object.hasOwn(model.initial,'bounds'),false);
});
test('last nonempty ring wins across multiple polygons, while trailing empty rings do not erase a center',()=>{
  const model=scanPbtMapModel(response({daftarBidangTanah:[row('A','A',[[ring],[[],[[108,-4]],[]],[]])]}));assert.deepEqual(model.initial.center,{lat:-4,lng:108});assert.deepEqual(model.centers[0],{lat:-4,lng:108});
});
test('missing first geometry preserves native fallback camera even when a later feature has valid points',()=>{
  const model=scanPbtMapModel(response({daftarBidangTanah:[{nib:'missing'},row('B','B',[[ring]])]}));assert.deepEqual(model.centers,[null,{lat:-9,lng:102}]);assert.deepEqual(model.initial,{center:{lat:-6.2,lng:106.816666},zoom:19});
});
test('null list publishes an empty list and fallback camera rather than inventing parcel geometry',()=>{
  for(const data of [{},{daftarBidangTanah:null},{daftarBidangTanah:[]}]){const model=scanPbtMapModel(response(data));assert.deepEqual(model.rows,[]);assert.deepEqual(model.centers,[]);assert.equal(model.pointCount,0);assert.equal(model.initial.zoom,19);}
});
test('only exact MultiPolygon is projected; unsupported/missing geometry retains a null source slot',()=>{
  const rows=[{}, {batas:null},{batas:{geometri:null}},row('A','A',[ring],'Polygon'),row('B','B',[[ring]],'multipolygon'),row('C','C',null),row('D','D',[])];
  assert.deepEqual(scanPbtMapModel(response({daftarBidangTanah:rows})).centers,rows.map(()=>null));
});
test('LatLng numeric transformation clamps latitude, wraps longitude, and ignores later ordinates',()=>{
  const cases=[[[180,91,'ignored'],{lat:90,lng:-180}],[[-180,-91],{lat:-90,lng:-180}],[[540,5],{lat:5,lng:-180}],[[-540,5],{lat:5,lng:-180}],[[181,5],{lat:5,lng:-179}],[[-181,5],{lat:5,lng:179}]];
  for(const [vertex,center]of cases){const model=scanPbtMapModel(response({daftarBidangTanah:[row('A','A',[[[vertex]]])]}));assert.deepEqual(model.initial.center,center);}
});
test('native center averages raw ordinates before wrapping/clamping rather than averaging normalized vertices',()=>{
  const model=scanPbtMapModel(response({daftarBidangTanah:[row('A','A',[[[[170,100],[190,80]]]])]}));assert.deepEqual(model.centers[0],{lat:90,lng:-180});assert.notEqual(model.centers[0].lng,0);assert.notEqual(model.centers[0].lat,85);
});
test('every vertex must provide two actual numbers; strings and null are not coerced',()=>{
  for(const vertex of [null,[],[1],[null,1],[1,null],['106',-6],[106,'-6'],[true,1],{},[NaN,1],[1,Infinity]])assert.throws(()=>scanPbtMapModel(response({daftarBidangTanah:[row('A','A',[[[vertex]]])]})),{code:'SCAN_MAP_UNRECOGNIZED'});
});
test('malformed nesting is rejected rather than flattened into an invented polygon',()=>{
  for(const coordinates of [{},[{}],[[{}]],[[[[1]]]],[[[1,2]]]])assert.throws(()=>scanPbtMapModel(response({daftarBidangTanah:[row('A','A',coordinates)]})),{code:'SCAN_MAP_UNRECOGNIZED'});
});
test('browser projection work is bounded and does not expose rejected data in its error',()=>{
  const model={daftarBidangTanah:[row('SYNTHETIC private ID','A',[[Array.from({length:20001},()=>[106,-6])]])]};assert.throws(()=>scanPbtMapModel(response(model)),error=>error.code==='SCAN_MAP_UNRECOGNIZED'&&!JSON.stringify(error).includes('SYNTHETIC private ID'));
  assert.throws(()=>scanPbtMapModel(response({daftarBidangTanah:Array.from({length:2001},()=>({}))})),{code:'SCAN_MAP_UNRECOGNIZED'});
});
test('typed error:true/non200/missing data cannot publish a successful map model',()=>{
  for(const input of [null,{...response({}),status:201},{...response({}),status:500},{status:200,data:{error:true,data:{}}},{status:200,data:{data:{}}},{status:200,data:{error:false,data:null}},{status:200,data:{error:false,data:'{}'}}])assert.throws(()=>scanPbtMapModel(input),{code:'SCAN_MAP_UNAVAILABLE'});
});
test('search always filters original rows using trimmed lowercase NIB only and source order',()=>{
  const rows=[row('A',' AbC ',null),row('B','DEF',null),{nib:null,luas:'ABC'},row('C','abc',null)],model=scanPbtMapModel(response({daftarBidangTanah:rows}));
  assert.deepEqual(scanPbtRows(model,' ABC ').map(entry=>entry.row),[rows[0],rows[3]]);assert.deepEqual(scanPbtRows(model,'def').map(entry=>entry.row),[rows[1]]);assert.deepEqual(scanPbtRows(model,'  ').map(entry=>entry.row),rows);assert.deepEqual(scanPbtRows(model,null).map(entry=>entry.row),rows);assert.deepEqual(model.rows,rows);
});
test('duplicate boundary IDs resolve to the first original match rather than filtered or NIB index',()=>{
  const rows=[row('same','First',null),row('other','Middle',null),row('same','Target',null)],model=scanPbtMapModel(response({daftarBidangTanah:rows}));assert.deepEqual(scanPbtRows(model,'target').map(({index})=>index),[0]);assert.deepEqual(scanPbtRows(model,'middle').map(({index})=>index),[1]);
});
test('native trim includes U+0085 for restoring the source list and bounded NIB search',()=>{
  const rows=[row('A','First',null),row('B','Target',null)],model=scanPbtMapModel(response({daftarBidangTanah:rows}));assert.deepEqual(scanPbtRows(model,'\u0085').map(entry=>entry.row),rows);assert.deepEqual(scanPbtRows(model,'\u0085 TARGET \u0085').map(entry=>entry.row),[rows[1]]);
});
test('missing/null boundary IDs also select the first null-ID original row',()=>{
  const rows=[{nib:'First'},row('X','Middle',null),{nib:'Target',batas:{id:null}}],model=scanPbtMapModel(response({daftarBidangTanah:rows}));assert.equal(scanPbtRows(model,'target')[0].index,0);
});
test('panel count stays original and selected badges follow first-match index after search',()=>{
  const model=scanPbtMapModel(response({nomor:'PBT 001',kantor:'Kantor',daftarBidangTanah:[row('A','One',null),row('B','Two',null),row('A','Target',null)]})),html=scanPbtPanelView(model,{query:'target',selected:0});
  assert.match(html,/scan-pbt-count">3 Bidang<\/p>/);assert.match(html,/data-source-index="0" aria-pressed="true"/);assert.match(html,/<span class="scan-pbt-index">1<\/span>/);assert.match(html,/Target/);assert.doesNotMatch(html,/>One<|>Two</);
});
test('panel preserves empty Strings, textual area and escapes server markup and search text',()=>{
  const model=scanPbtMapModel(response({nomor:'',kantor:'<img src=x>',daftarBidangTanah:[{nib:'<svg onload=x>',luas:'',noBerkas:'<script>x</script>'}]})),html=scanPbtPanelView(model,{query:'" onfocus="x'});
  assert.match(html,/PBT Elektronik No. <\/h3>/);assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img|<script|<svg|value="" onfocus=/);
  const all=scanPbtPanelView(model);assert.match(all,/&lt;svg onload=x&gt;/);assert.match(all,/&lt;script&gt;/);assert.match(all,/<span>Luas  m² \| No\. Berkas /);
});
test('panel includes nonnull lokasi and uses native no-data versus searched-empty copy',()=>{
  const model=scanPbtMapModel(response({daftarBidangTanah:[row('A','A',null)]}));assert.match(scanPbtPanelView(model),/SYNTHETIC location/);assert.match(scanPbtPanelView(model,{query:'missing'}),/NIB tidak ditemukan\./);
  const empty=scanPbtMapModel(response({}));assert.match(scanPbtPanelView(empty),/Tidak ada data bidang\./);assert.match(scanPbtPanelView(empty,{query:' '}),/NIB tidak ditemukan\./);
});
test('special map keeps approved OSM/Bhumi raster manager and exact camera without inventing vector or bounds',()=>{
  const html=scanSpecialMapView({center:{lat:-6,lng:106},zoom:19},{title:'<PBT>'});assert.match(html,/data-official-map/);assert.match(html,/data-official-camera/);assert.match(html,/&quot;zoom&quot;:19/);assert.match(html,/OpenStreetMap.*Bhumi/);assert.doesNotMatch(html,/polygon|coordinates|geojson|bounds|<PBT>/);assert.match(html,/aria-label="&lt;PBT&gt;"/);
});
test('directions uses selected source center and fixed external Google search URL with native double text',()=>{
  const model={centers:[{lat:-6,lng:106},{lat:-0,lng:106.5}]};assert.equal(scanPbtDirectionsUrl(model,0),'https://www.google.com/maps/search/?api=1&query=-6.0,106.0');assert.equal(scanPbtDirectionsUrl(model,1),'https://www.google.com/maps/search/?api=1&query=-0.0,106.5');
});
test('directions is unavailable for absent/null source centers and invalid selection; no device fallback is invented',()=>{
  const model={centers:[null]};for(const index of [-1,0,1,1.5,'0','__proto__',null])assert.equal(scanPbtDirectionsUrl(model,index),null);
});
