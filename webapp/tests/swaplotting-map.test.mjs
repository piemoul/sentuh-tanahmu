import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplottingMap,swaplottingBhumiTileUrl,swaplottingPointMapView} from '../assets/swaplotting/map.js';
import {SWAPLOTTING_INITIAL_CAMERA} from '../assets/swaplotting/model.js';
const config={provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'};
class Events{constructor(){this.events=new Map();}on(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);return this;}off(name,fn){if(name===undefined)this.events.clear();else this.events.get(name)?.delete(fn);return this;}emit(name,value){for(const fn of this.events.get(name)??[])fn(value);}}
function fixture({failLayer=0,failMarker=false,transformCenter=center=>center,onInvalidate=()=>{}}={}){
 const buttons=Array.from({length:8},()=>({disabled:true})),resizes=[],images=[],container={isConnected:true,clears:0,replaceChildren(){this.clears++;},closest:()=>({querySelectorAll:()=>buttons})};
 container.ownerDocument={createElement:tag=>{const image={tagName:tag};images.push(image);return image;},defaultView:{ResizeObserver:class{constructor(callback){this.callback=callback;resizes.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}flush(){this.callback();}}}};
 const maps=[],layers=[],markers=[],icons=[],leaflet={CRS:{EPSG3857:{}},
  map(canvas,options){const map=new Events();Object.assign(map,{canvas,options,center:{lat:0,lng:0},zoom:0,layers:new Set(),views:[],pans:[],removed:0,invalidates:0});map.getCenter=()=>({...map.center});map.getZoom=()=>map.zoom;map.getSize=()=>({x:800,y:400});map.setView=(center,zoom,opts)=>{map.center={...transformCenter({lat:center[0],lng:center[1]})};map.zoom=zoom;map.views.push({center:[...center],zoom,opts});map.emit('moveend');map.emit('zoomend');return map;};map.setZoom=zoom=>{map.zoom=zoom;map.emit('zoomend');return map;};map.panBy=(offset,opts)=>map.pans.push({offset,opts});map.removeLayer=layer=>map.layers.delete(layer);map.remove=()=>{map.removed++;map.layers.clear();};map.invalidateSize=(...args)=>{map.invalidates++;onInvalidate(map,...args);return map;};maps.push(map);return map;},
  tileLayer(url,options){if(failLayer===layers.length+1)throw Error('fixture-layer-failure');const layer=new Events();Object.assign(layer,{url,options});layer.addTo=map=>{layer.map=map;map.layers.add(layer);return layer;};layer.createTile=(point,done)=>{const image=container.ownerDocument.createElement('img');image.src=layer.getTileUrl(point);queueMicrotask(()=>done?.(null,image));return image;};layers.push(layer);return layer;},
  icon(options){icons.push(options);return{options};},
  marker(position,options){if(failMarker)throw Error('fixture-marker-failure');const marker=new Events();Object.assign(marker,{position:[...position],options,tooltip:null,moves:[]});marker.bindTooltip=text=>{marker.tooltip=text;return marker;};marker.unbindTooltip=()=>{marker.tooltip=null;return marker;};marker.setLatLng=value=>{marker.position=[...value];marker.moves.push([...value]);return marker;};marker.addTo=map=>{marker.map=map;map.layers.add(marker);return marker;};markers.push(marker);return marker;}
 };
 return {container,buttons,resizes,images,leaflet,maps,layers,markers,icons,mount:(options={})=>createSwaplottingMap(container,SWAPLOTTING_INITIAL_CAMERA,{leaflet,config,...options})};
}

test('map starts with exact fractional native viewport, two explicit raster layers and a point only',()=>{
 const f=fixture(),changes=[],status=[],c=f.mount({onCameraChanged:p=>changes.push(p),onStatus:t=>status.push(t)});
 assert.equal(f.maps.length,1);assert.deepEqual(f.maps[0].views[0],{center:[-0.792918,116.482347],zoom:4.4746,opts:{animate:false}});assert.equal(f.maps[0].options.zoomSnap,0);assert.deepEqual(changes,[]);
 assert.equal(f.layers.length,2);assert.equal(f.layers[0].url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(f.layers[1].url,'/api/maps/bhumi/{z}/{x}/{y}.png');assert.equal(f.markers.length,1);assert.deepEqual(f.markers[0].position,[-0.792918,116.482347]);assert.equal(f.markers[0].tooltip,'Titik tengah peta');assert.equal(f.markers[0].options.draggable,undefined);
 assert.ok(f.buttons.every(button=>!button.disabled));assert.match(status.at(-1),/diminta/);assert.doesNotMatch(status.at(-1),/berhasil|terverifikasi/);assert.equal(c.snapshot().camera.zoom,4.4746);c.destroy();
});

test('real engine center/zoom events move the center marker and emit unrounded camera coordinates',()=>{
 const f=fixture(),changes=[],c=f.mount({onCameraChanged:value=>changes.push(value)});f.maps[0].setView([-6.123456789,190.123456789],17.25);
 // The same moveend/zoomend viewport is now one owned update, not two echoes.
 assert.equal(changes.length,1);assert.equal(changes.at(-1).lat,-6.123456789);assert.ok(Math.abs(changes.at(-1).lng-(-169.876543211))<1e-12);assert.equal(changes.at(-1).zoom,17.25);assert.deepEqual(f.markers[0].position,[changes.at(-1).lat,changes.at(-1).lng]);assert.deepEqual(c.snapshot().camera,changes.at(-1));
 f.maps[0].setView([-6.23456789,106.23456789],18.125);assert.equal(changes.at(-1).lng,106.23456789);assert.equal(changes.at(-1).lat,-6.23456789);assert.equal(changes.at(-1).zoom,18.125);
 f.maps[0].center.lat=NaN;const count=changes.length;f.maps[0].emit('moveend');assert.equal(changes.length,count);c.destroy();
});

test('explicit controls delegate pan/zoom and reset only to native viewport, without GPS APIs',()=>{
 const f=fixture(),c=f.mount();for(const action of ['in','out','left','right','up','down'])assert.equal(c.control(action),true);assert.deepEqual(f.maps[0].pans.map(row=>row.offset),[[-200,0],[200,0],[0,-100],[0,100]]);
 assert.equal(c.control('locate'),false);assert.equal(c.control('geolocation'),false);f.maps[0].setView([10,20],18);c.control('reset');assert.deepEqual(c.snapshot().camera,SWAPLOTTING_INITIAL_CAMERA);
 assert.equal(c.control('toggle-overlay'),true);assert.equal(f.maps[0].layers.has(f.layers[1]),false);assert.equal(c.snapshot().overlayVisible,false);c.control('toggle-overlay');assert.equal(f.maps[0].layers.has(f.layers[1]),true);c.destroy();
});

test('Bhumi URLs stay on the fixed same-origin tile route with wrapped x and constrained XYZ',()=>{
 assert.equal(swaplottingBhumiTileUrl({z:2,x:-1,y:1}),'/api/maps/bhumi/2/3/1.png');assert.equal(swaplottingBhumiTileUrl({z:2,x:5,y:1}),'/api/maps/bhumi/2/1/1.png');
 for(const coordinate of [{z:22,x:0,y:0},{z:-1,x:0,y:0},{z:1.5,x:0,y:0},{z:2,x:0,y:-1},{z:2,x:0,y:4},{z:2,x:'1',y:0},{z:2,x:Number.MAX_SAFE_INTEGER+1,y:0},{z:2,x:0,y:Infinity},{}])assert.equal(swaplottingBhumiTileUrl(coordinate),null);
 const f=fixture(),c=f.mount();assert.equal(f.layers[1].getTileUrl({z:2,x:-1,y:1}),'/api/maps/bhumi/2/3/1.png');c.destroy();assert.equal(f.layers[1].getTileUrl({z:2,x:0,y:1}),null);
});

test('invalid or retired tiles produce an empty image rather than a requestable null URL',async()=>{
 const f=fixture(),c=f.mount();let completions=0;const invalid=f.layers[1].createTile({z:2,x:0,y:4},(error,image)=>{assert.equal(error,null);assert.equal(image,invalid);completions++;});assert.equal(invalid.src,undefined);await new Promise(resolve=>queueMicrotask(resolve));assert.equal(completions,1);
 c.destroy();const retired=f.layers[1].createTile({z:2,x:0,y:1},()=>completions++);assert.equal(retired.src,undefined);await new Promise(resolve=>queueMicrotask(resolve));assert.equal(completions,2);
});

test('tile failures are reported honestly and never become successful layer assurance on later events',()=>{
 const f=fixture(),status=[],c=f.mount({onStatus:value=>status.push(value)});f.layers[1].emit('tileerror');assert.match(status.at(-1),/Bhumi belum dapat dimuat/);f.layers[1].emit('load');c.control('toggle-overlay');assert.match(status.at(-1),/disembunyikan/);c.control('toggle-overlay');assert.match(status.at(-1),/Bhumi belum dapat dimuat/);f.layers[0].emit('tileerror');assert.match(status.at(-1),/dasar OpenStreetMap belum dapat dimuat/);c.destroy();
});

test('route retirement, resize and destroy cannot update a stale owner or retain active listeners',()=>{
 const f=fixture(),changes=[],status=[];let active=true;const c=f.mount({isCurrent:()=>active,onCameraChanged:value=>changes.push(value),onStatus:value=>status.push(value)});f.resizes[0].flush();assert.equal(f.maps[0].invalidates,1);active=false;const count=status.length;f.maps[0].setView([1,2],8);f.layers[0].emit('tileerror');f.resizes[0].flush();assert.deepEqual(changes,[]);assert.equal(status.length,count);assert.equal(f.maps[0].invalidates,1);assert.equal(c.control('in'),false);assert.equal(f.layers[1].getTileUrl({z:2,x:0,y:1}),null);
 c.destroy();c.destroy();assert.equal(f.maps[0].removed,1);assert.equal(f.resizes[0].disconnected,true);assert.ok(f.buttons.every(button=>button.disabled));assert.equal(f.maps[0].events.get('moveend').size,0);assert.equal(f.layers[0].events.get('tileerror').size,0);assert.equal(f.markers[0].tooltip,null);assert.equal(c.snapshot().closed,true);
});

test('double mount fails closed and partial map failures release their canvas and all constructed resources',()=>{
 const f=fixture(),c=f.mount();assert.throws(()=>f.mount(),/CONTAINER/);c.destroy();const replacement=f.mount();replacement.destroy();
 for(const options of [{failLayer:2},{failMarker:true}]){const failed=fixture(options);assert.throws(()=>failed.mount(),/fixture-/);assert.equal(failed.maps[0].removed,1);assert.ok(failed.buttons.every(button=>button.disabled));assert.equal(failed.container.clears,1);}
});

test('map config rejects arbitrary upstreams and non-Mercator initial view before creating an engine',()=>{
 const f=fixture();assert.throws(()=>f.mount({config:{...config,wmsTileTemplate:'https://evil.test/{z}/{x}/{y}.png'}}));assert.equal(f.maps.length,0);
 assert.throws(()=>createSwaplottingMap(f.container,{lat:89,lng:0,zoom:4},{leaflet:f.leaflet,config}),/MERCATOR/);assert.equal(f.maps.length,0);
 const html=swaplottingPointMapView({screen:'map',initialCamera:SWAPLOTTING_INITIAL_CAMERA});assert.match(html,/data-swaplotting-map-canvas/);assert.doesNotMatch(html,/data-official-camera|data-official-map|FeatureCollection|onclick=/);assert.match(html,/bukan bukti kunjungan/);
});

test('explicit apply is synchronous, preserves fractional zoom and suppresses sync and late duplicate echoes',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});
 const result=c.applyCenter({lat:-6.123456789,lng:106.123456789});
 assert.equal(result.ok,true);assert.equal(typeof result.then,'undefined');assert.deepEqual(result.camera,{lat:-6.123456789,lng:106.123456789,zoom:4.4746});assert.deepEqual(events,[]);
 for(const name of ['moveend','zoomend','moveend'])f.maps[0].emit(name);
 assert.deepEqual(events,[]);assert.deepEqual(c.snapshot().camera,result.camera);assert.deepEqual(f.markers[0].position,[-6.123456789,106.123456789]);c.destroy();
});

test('constructor engine rounding and late initial events cannot replace a retained exact target',()=>{
 const f=fixture({transformCenter:p=>({lat:Math.round(p.lat*1e6)/1e6,lng:Math.round(p.lng*1e6)/1e6})}),events=[];
 const value={lat:-0,lng:106.123456789,zoom:17.125};
 const c=createSwaplottingMap(f.container,value,{leaflet:f.leaflet,config,onCameraChanged:(...args)=>events.push(args)});
 assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,value.lng);assert.equal(f.maps[0].center.lng,106.123457);
 f.maps[0].emit('moveend');f.maps[0].emit('zoomend');assert.deepEqual(events,[]);assert.ok(Object.is(c.snapshot().camera.lat,-0));c.destroy();
});

test('engine normalization of negative zero and rounded longitude does not alter a command result or its snapshot',()=>{
 const f=fixture({transformCenter:p=>({lat:p.lat===0?0:Math.round(p.lat*1e7)/1e7,lng:Math.round(p.lng*1e7)/1e7})}),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)});
 const input={lat:-0,lng:106.12345678901235,zoom:16.625},result=c.applyCenter(input);
 assert.equal(result.ok,true);assert.ok(Object.is(result.camera.lat,-0));assert.equal(result.camera.lng,input.lng);assert.ok(Object.is(f.maps[0].center.lat,0));assert.notEqual(f.maps[0].center.lng,input.lng);
 input.lat=1;result.camera.lng=1;const snapshot=c.snapshot();snapshot.camera.lat=1;
 for(const name of ['zoomend','moveend'])f.maps[0].emit(name);
 assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,106.12345678901235);assert.deepEqual(events,[]);c.destroy();
});

test('zoom-only engine events keep exact commanded axes including both negative zeros and identify zoom',()=>{
 const f=fixture({transformCenter:p=>({lat:p.lat===0?0:p.lat,lng:p.lng===0?0:p.lng})}),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});
 c.applyCenter({lat:-0,lng:-0});f.maps[0].zoom=8.375;f.maps[0].emit('zoomend');f.maps[0].emit('moveend');
 assert.equal(events.length,1);assert.equal(events[0].context.eventKind,'zoom');assert.ok(Object.is(events[0].camera.lat,-0));assert.ok(Object.is(events[0].camera.lng,-0));assert.equal(events[0].camera.zoom,8.375);c.destroy();
});

test('explicit zoom controls retain selected values despite engine center roundoff, with one notification',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});c.applyCenter({lat:-0,lng:106.123456789,zoom:16.125});
 f.maps[0].setZoom=zoom=>{f.maps[0].center={lat:0,lng:106.12345678900001};f.maps[0].zoom=zoom;f.maps[0].emit('moveend');f.maps[0].emit('zoomend');};
 assert.equal(c.control('in'),true);f.maps[0].emit('zoomend');assert.equal(events.length,1);assert.equal(events[0].context.eventKind,'zoom');assert.ok(Object.is(events[0].camera.lat,-0));assert.equal(events[0].camera.lng,106.123456789);assert.equal(events[0].camera.zoom,17.125);c.destroy();
});

test('a genuinely changed engine anchor is a pan even for the smallest finite difference, without epsilon guessing',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});c.applyCenter({lat:0,lng:0});
 f.maps[0].center.lat=Number.MIN_VALUE;f.maps[0].emit('moveend');f.maps[0].emit('zoomend');
 assert.equal(events.length,1);assert.equal(events[0].context.eventKind,'pan');assert.equal(events[0].camera.lat,Number.MIN_VALUE);assert.equal(c.snapshot().camera.lat,Number.MIN_VALUE);c.destroy();
});

test('explicit pan retires association even when an engine produces no move event or is already at an edge',()=>{
 const f=fixture({transformCenter:p=>({lat:p.lat===0?0:p.lat,lng:p.lng})}),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});c.applyCenter({lat:-0,lng:120});
 assert.equal(c.control('left'),true);assert.equal(events.length,1);assert.equal(events[0].context.eventKind,'pan');assert.ok(Object.is(events[0].camera.lat,0));
 f.maps[0].emit('moveend');assert.equal(events.length,1);c.destroy();
});

test('explicit reset and fit notify reset exactly once even when already at the initial anchor',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});
 c.applyCenter(SWAPLOTTING_INITIAL_CAMERA);assert.equal(c.control('reset'),true);f.maps[0].emit('moveend');f.maps[0].emit('zoomend');
 assert.deepEqual(events,[{camera:SWAPLOTTING_INITIAL_CAMERA,context:{eventKind:'reset'}}]);assert.equal(c.control('fit'),true);assert.equal(events.length,2);assert.equal(events[1].context.eventKind,'reset');c.destroy();
});

test('invalid coordinates, unsupported Mercator latitude and invalid zoom fail before any engine or marker mutation',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)}),before=c.snapshot(),views=f.maps[0].views.length,moves=f.markers[0].moves.length;
 const invalid=[null,{},[],{lat:'1',lng:2},{lat:1,lng:NaN},{lat:Infinity,lng:2},{lat:1,lng:180.00001},{lat:1,lng:-180.00001},{lat:90,lng:0},{lat:85.05112877980662,lng:0},{lat:0,lng:0,zoom:null},{lat:0,lng:0,zoom:21.01},{lat:0,lng:0,zoom:-.01}];
 for(const point of invalid)assert.equal(c.applyCenter(point).ok,false);
 assert.deepEqual(c.snapshot(),before);assert.equal(f.maps[0].views.length,views);assert.equal(f.markers[0].moves.length,moves);assert.deepEqual(events,[]);c.destroy();
});

test('both antimeridian signs, the exact Mercator limits and explicit fractional zoom remain unchanged',()=>{
 const f=fixture(),c=f.mount();
 for(const p of [{lat:85.0511287798066,lng:180,zoom:21},{lat:-85.0511287798066,lng:-180,zoom:0},{lat:-0,lng:-0,zoom:9.875}]){
  const result=c.applyCenter(p);assert.deepEqual(result,{ok:true,camera:p});assert.deepEqual(c.snapshot().camera,p);assert.deepEqual(f.maps[0].views.at(-1).center,[p.lat,p.lng]);
 }
 c.destroy();
});

test('an engine read failure before apply changes no logical target and schedules no command',()=>{
 const f=fixture(),c=f.mount(),before=c.snapshot(),get=f.maps[0].getZoom,views=f.maps[0].views.length;f.maps[0].getZoom=()=>{throw Error('fixture-read');};
 assert.deepEqual(c.applyCenter({lat:1,lng:2}),{ok:false,code:'SWAPLOTTING_MAP_ENGINE'});assert.deepEqual(c.snapshot(),before);assert.equal(f.maps[0].views.length,views);f.maps[0].getZoom=get;assert.equal(c.applyCenter({lat:1,lng:2}).ok,true);c.destroy();
});

test('setView failure before mutation rolls back quietly and leaves the previous map usable',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)}),before=c.snapshot(),original=f.maps[0].setView;let calls=0;
 f.maps[0].setView=(...args)=>{if(calls++===0)throw Error('fixture-before');return original(...args);};
 assert.deepEqual(c.applyCenter({lat:1,lng:2}),{ok:false,code:'SWAPLOTTING_MAP_APPLY_FAILED'});assert.deepEqual(c.snapshot(),before);assert.deepEqual(f.maps[0].center,{lat:before.camera.lat,lng:before.camera.lng});assert.deepEqual(events,[]);assert.equal(c.applyCenter({lat:3,lng:4}).ok,true);c.destroy();
});

test('partial engine failure restores viewport, marker and exact prior command, suppressing rollback echoes',()=>{
 const f=fixture({transformCenter:p=>({lat:p.lat===0?0:p.lat,lng:p.lng})}),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)});c.applyCenter({lat:-0,lng:120,zoom:11.75});
 const original=f.maps[0].setView;let failed=false;f.maps[0].setView=(...args)=>{original(...args);if(!failed){failed=true;throw Error('fixture-after');}return f.maps[0];};
 assert.equal(c.applyCenter({lat:10,lng:20,zoom:19}).code,'SWAPLOTTING_MAP_APPLY_FAILED');
 assert.deepEqual(f.maps[0].center,{lat:0,lng:120});assert.equal(f.maps[0].zoom,11.75);assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,120);assert.ok(Object.is(f.markers[0].position[0],-0));f.maps[0].emit('moveend');f.maps[0].emit('zoomend');assert.deepEqual(events,[]);c.destroy();
});

test('a partial marker error rolls back the viewport and marker rather than committing a measured target',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)}),before=c.snapshot(),original=f.markers[0].setLatLng;let once=true;
 f.markers[0].setLatLng=point=>{original(point);if(once){once=false;throw Error('fixture-marker');}return f.markers[0];};
 assert.equal(c.applyCenter({lat:10,lng:20}).code,'SWAPLOTTING_MAP_APPLY_FAILED');assert.deepEqual(c.snapshot(),before);assert.deepEqual(f.markers[0].position,[before.camera.lat,before.camera.lng]);assert.deepEqual(events,[]);c.destroy();
});

test('un-restorable engine failure closes resources, disables controls and preserves the old logical target',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)}),before=c.snapshot().camera;f.maps[0].setView=()=>{f.maps[0].center={lat:1,lng:2};throw Error('fixture-permanent');};
 assert.deepEqual(c.applyCenter({lat:10,lng:20}),{ok:false,code:'SWAPLOTTING_MAP_UNUSABLE'});assert.equal(c.snapshot().closed,true);assert.deepEqual(c.snapshot().camera,before);assert.equal(f.maps[0].removed,1);assert.ok(f.buttons.every(b=>b.disabled));assert.equal(c.control('reset'),false);assert.equal(c.applyCenter({lat:1,lng:2}).code,'SWAPLOTTING_MAP_INACTIVE');assert.deepEqual(events,[]);
});

test('a rollback that silently restores a different anchor also closes rather than claiming atomic visual success',()=>{
 const f=fixture(),c=f.mount(),original=f.maps[0].setView;let calls=0;
 f.maps[0].setView=(...args)=>{original(...args);if(calls++===0)throw Error('fixture-partial');f.maps[0].center.lng+=Number.EPSILON*1024;return f.maps[0];};
 assert.equal(c.applyCenter({lat:1,lng:2}).code,'SWAPLOTTING_MAP_UNUSABLE');assert.equal(c.snapshot().closed,true);assert.equal(f.maps[0].removed,1);
});

test('owner retirement during a synchronous engine command cannot commit a target or retain its obsolete canvas',()=>{
 const f=fixture(),events=[];let active=true;const c=f.mount({isCurrent:()=>active,onCameraChanged:(...args)=>events.push(args)}),before=c.snapshot().camera,original=f.maps[0].setView;
 f.maps[0].setView=(...args)=>{original(...args);active=false;return f.maps[0];};
 assert.equal(c.applyCenter({lat:1,lng:2}).code,'SWAPLOTTING_MAP_INACTIVE');assert.deepEqual(c.snapshot().camera,before);assert.equal(c.snapshot().closed,true);assert.equal(f.maps[0].removed,1);assert.deepEqual(events,[]);
});

test('disconnected, replaced and destroyed owners reject commands while a new map owns its own slot',()=>{
 const f=fixture(),c=f.mount(),count=f.maps[0].views.length;f.container.isConnected=false;assert.equal(c.applyCenter({lat:1,lng:2}).ok,false);assert.equal(f.maps[0].views.length,count);f.container.isConnected=true;c.destroy();
 const replacement=f.mount();assert.equal(c.applyCenter({lat:1,lng:2}).ok,false);assert.equal(replacement.applyCenter({lat:3,lng:4}).ok,true);assert.deepEqual(replacement.snapshot().camera,{lat:3,lng:4,zoom:4.4746});replacement.destroy();
});

test('reentrant engine listeners cannot nest an apply or a control inside an active command',()=>{
 const f=fixture(),events=[],nested=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)});
 f.maps[0].on('moveend',()=>{nested.push(c.applyCenter({lat:30,lng:40}));nested.push(c.control('reset'));});
 assert.equal(c.applyCenter({lat:1,lng:2}).ok,true);assert.deepEqual(nested,[{ok:false,code:'SWAPLOTTING_MAP_BUSY'},false]);assert.deepEqual(c.snapshot().camera,{lat:1,lng:2,zoom:4.4746});assert.deepEqual(events,[]);c.destroy();
});

test('overlay visibility is independent of coordinate source and does not produce a camera event',()=>{
 const f=fixture(),events=[],c=f.mount({onCameraChanged:(...args)=>events.push(args)});c.applyCenter({lat:-0,lng:180,zoom:21});c.control('toggle-overlay');c.control('toggle-overlay');
 assert.deepEqual(events,[]);assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,180);assert.equal(c.snapshot().overlayVisible,true);assert.equal(c.control('in'),true);assert.equal(c.snapshot().camera.zoom,21);assert.equal(events.at(-1)[1].eventKind,'zoom');c.destroy();
});

test('ResizeObserver projection drift preserves exact target and negative zero, then a genuine pan still retires it',()=>{
 const f=fixture({onInvalidate:map=>{map.center={lat:0,lng:106.12345678900001};map.emit('moveend');}}),events=[],c=f.mount({onCameraChanged:(camera,context)=>events.push({camera,context})});
 c.applyCenter({lat:-0,lng:106.123456789,zoom:17.125});f.resizes[0].flush();f.maps[0].emit('moveend');f.maps[0].emit('zoomend');
 assert.equal(f.maps[0].invalidates,1);assert.deepEqual(events,[]);assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,106.123456789);assert.equal(c.snapshot().camera.zoom,17.125);
 f.maps[0].center.lng=106.12345678900004;f.maps[0].emit('moveend');assert.equal(events.length,1);assert.equal(events[0].context.eventKind,'pan');assert.equal(events[0].camera.lng,106.12345678900004);c.destroy();
});

test('Leaflet window-style deferred invalidation forwards arguments and chaining while suppressing late moveend echoes',async()=>{
 const args=[],f=fixture({onInvalidate:(map,...values)=>{args.push(values);map.center={lat:0,lng:120.00000000000001};queueMicrotask(()=>map.emit('moveend'));}}),events=[],c=f.mount({onCameraChanged:(...values)=>events.push(values)});
 c.applyCenter({lat:-0,lng:120,zoom:13.625});const options={debounceMoveend:true},frame=()=>f.maps[0].invalidateSize(options);
 assert.equal(frame(),f.maps[0]);assert.equal(args[0][0],options);assert.deepEqual(events,[]);await new Promise(resolve=>queueMicrotask(resolve));assert.deepEqual(events,[]);
 assert.ok(Object.is(c.snapshot().camera.lat,-0));assert.equal(c.snapshot().camera.lng,120);f.maps[0].zoom=14.625;f.maps[0].emit('zoomend');assert.equal(events.length,1);assert.equal(events[0][1].eventKind,'zoom');assert.ok(Object.is(events[0][0].lat,-0));assert.equal(events[0][0].lng,120);c.destroy();
});

test('retired, disposed or reentrant invalidations keep chaining but never invoke the obsolete engine method',()=>{
 const f=fixture(),c=f.mount();let active=true;const maps=f.maps;
 maps[0].on('moveend',()=>{assert.equal(maps[0].invalidateSize({animate:false}),maps[0]);});c.applyCenter({lat:1,lng:2});assert.equal(maps[0].invalidates,0);
 f.container.isConnected=false;assert.equal(maps[0].invalidateSize(),maps[0]);assert.equal(maps[0].invalidates,0);f.container.isConnected=true;c.destroy();assert.equal(maps[0].invalidateSize(true),maps[0]);assert.equal(maps[0].invalidates,0);
 const g=fixture(),d=g.mount({isCurrent:()=>active});active=false;g.maps[0].invalidateSize({debounceMoveend:true});assert.equal(g.maps[0].invalidates,0);d.destroy();
});

test('resize failure restores the old view or closes an unusable map and reports failure instead of emitting success',()=>{
 const events=[],status=[],f=fixture({onInvalidate:map=>{map.center={lat:10,lng:20};map.emit('moveend');throw Error('resize-failure');}}),c=f.mount({onCameraChanged:(...args)=>events.push(args),onStatus:text=>status.push(text)}),previous=c.snapshot().camera;
 assert.equal(f.maps[0].invalidateSize({animate:false}),f.maps[0]);assert.deepEqual(c.snapshot().camera,previous);assert.equal(c.snapshot().closed,false);assert.match(status.at(-1),/belum dapat diperbarui/);assert.deepEqual(events,[]);c.destroy();
 const messages=[],g=fixture({onInvalidate:map=>{map.getCenter=()=>{throw Error('unusable');};throw Error('resize-permanent');}}),d=g.mount({onStatus:text=>messages.push(text)});
 assert.equal(g.maps[0].invalidateSize(),g.maps[0]);assert.equal(d.snapshot().closed,true);assert.equal(g.maps[0].removed,1);assert.ok(g.buttons.every(button=>button.disabled));assert.match(messages.at(-1),/perlu dimuat ulang/);
});
