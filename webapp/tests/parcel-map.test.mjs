import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareParcelCamera,parcelMapView,updateParcelMap} from '../parcel-map.js';
const ring=[[106,-6],[106.01,-6],[106.01,-5.99],[106,-5.99],[106,-6]];
const fixture=(coordinates=[ring],type='Polygon')=>({type:'FeatureCollection',features:[{type:'Feature',geometry:{type,coordinates},properties:{NIB:'synthetic',LUAS:100}}]});
const decode=value=>value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
test('camera uses arithmetic mean including closure rather than center of bounds',()=>{
  const data=fixture(),before=structuredClone(data),camera=prepareParcelCamera(data);
  assert.equal(camera.center.lng,ring.reduce((sum,point)=>sum+point[0],0)/5);
  assert.equal(camera.center.lat,ring.reduce((sum,point)=>sum+point[1],0)/5);
  assert.notEqual(camera.center.lng,(106+106.01)/2);assert.equal(camera.pointCount,5);assert.equal(camera.zoom,18);assert.deepEqual(data,before);
  assert.deepEqual(camera.bounds,[[-6,106],[-5.99,106.01]]);
});
test('holes, multipolygon parts and all features contribute to camera in source order',()=>{
  const hole=[[106.001,-5.999],[106.002,-5.999],[106.002,-5.998],[106.001,-5.999]],island=ring.map(([x,y])=>[x+.1,y]);
  const data=fixture([[ring,hole],[island]],'MultiPolygon');data.features.push(fixture().features[0]);
  const points=[...ring,...hole,...island,...ring],camera=prepareParcelCamera(data);
  assert.deepEqual(camera.center,{lng:points.reduce((sum,p)=>sum+p[0],0)/points.length,lat:points.reduce((sum,p)=>sum+p[1],0)/points.length});assert.equal(camera.pointCount,19);
  assert.deepEqual(camera.bounds,[[-6,106],[-5.99,106.11]]);
});
test('native camera does not unwrap antimeridian coordinates',()=>{
  const points=[[179,1],[-179,1],[-179,2],[179,2],[179,1]],camera=prepareParcelCamera(fixture([points]));
  assert.equal(camera.center.lng,35.8);assert.equal(camera.center.lat,1.4);
  assert.deepEqual(camera.bounds,[[1,-179],[2,179]]);
});
test('preview camera uses zoom17; document camera uses zoom18',()=>{
  assert.equal(prepareParcelCamera(fixture(),{preview:true}).zoom,17);assert.equal(prepareParcelCamera(fixture()).zoom,18);
  assert.throws(()=>prepareParcelCamera(fixture(),{preview:'true'}));
});
test('geographic CRS is accepted and projected or malformed geometry is rejected',()=>{
  for(const name of ['EPSG:4326','urn:ogc:def:crs:EPSG::4326','urn:ogc:def:crs:OGC:1.3:CRS84']){const data=fixture();data.crs={properties:{name}};assert.equal(prepareParcelCamera(data).crsProvided,true);}
  for(const patch of [{crs:{properties:{name:'EPSG:3857'}}},{features:[{type:'Feature',geometry:{type:'Point',coordinates:[106,-6]}}]}])assert.throws(()=>prepareParcelCamera({...fixture(),...patch}));
  for(const point of [[181,-6],[106,91],['106',-6],[106,NaN],[Infinity,-6],[106,-6,Infinity],null]){const data=structuredClone(fixture());data.features[0].geometry.coordinates[0][1]=point;assert.throws(()=>prepareParcelCamera(data));}
  assert.throws(()=>prepareParcelCamera(fixture([ring.slice(0,-1)])));
});
test('feature and cumulative vertex bounds reject large responses without partial rendering',()=>{
  const data=fixture();data.features=Array(201).fill(data.features[0]);assert.throws(()=>prepareParcelCamera(data));
  const large=Array.from({length:20000},(_,index)=>ring[index===19999?0:index%4]);assert.equal(prepareParcelCamera(fixture([large])).pointCount,20000);
  assert.throws(()=>prepareParcelCamera(fixture([large,ring])));
});
test('card contains only camera JSON and escaped labels, with no custom map geometry',()=>{
  const data=fixture();data.features[0].properties.NIB='<img src=x onerror=alert(1)>';data.features[0].properties.token='private-not-for-template';
  const html=parcelMapView(data),raw=html.match(/<template data-official-camera>([^]*?)<\/template>/)[1],camera=JSON.parse(decode(raw));
  assert.deepEqual(Object.keys(camera),['center','zoom','bounds']);assert.deepEqual(camera.center,prepareParcelCamera(data).center);assert.deepEqual(camera.bounds,[[-6,106],[-5.99,106.01]]);
  assert.match(html,/<h3>Batas Bidang Tanah<\/h3>/);assert.match(html,/aria-label="Batas bidang dari layanan"/);assert.match(html,/official-map-canvas/);assert.match(html,/data-map-action="toggle-boundary"/);
  assert.match(html,/&lt;img/);assert.match(html,/OpenStreetMap dengan layer bidang resmi Bhumi/);assert.doesNotMatch(html,/<img|<svg|<path|FeatureCollection|private-not-for-template|Google|data-parcel-geometry/i);
  assert.equal((html.match(/data-map-action=/g)??[]).length,8);assert.equal((html.match(/ disabled/g)??[]).length,8);
  assert.match(html,/Pin menandai titik acuan tampilan dari data bidang/);assert.doesNotMatch(raw,/synthetic|NIB|properties|token|coordinates/);
});

test('tiny and zero-span source extents retain exact bounds without inventing an area',()=>{
  const tiny=[[106,-6],[106.000001,-6],[106.000001,-5.999999],[106,-6]],small=prepareParcelCamera(fixture([tiny]));
  assert.deepEqual(small.bounds,[[-6,106],[-5.999999,106.000001]]);
  const point=prepareParcelCamera(fixture([Array.from({length:4},()=>[106,-6])]));
  assert.deepEqual(point.bounds,[[-6,106],[-6,106]]);assert.deepEqual(point.center,{lat:-6,lng:106});assert.equal(point.pointCount,4);
});
test('empty and invalid data produce safe notices and cannot start a map',()=>{
  assert.deepEqual(prepareParcelCamera({type:'FeatureCollection',features:[]}),{empty:true,pointCount:0});
  for(const data of [null,{type:'FeatureCollection',features:[]},fixture([], 'Point')])assert.doesNotMatch(parcelMapView(data),/data-official-map|data-official-camera|official-map-canvas/);
  assert.equal(updateParcelMap({}),false);
});
