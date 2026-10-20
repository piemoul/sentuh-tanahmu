import test from 'node:test';
import assert from 'node:assert/strict';
import {createOfficialMap,startOfficialMaps,controlOfficialMap,validateOfficialMapConfig} from '../assets/maps/official-map.js';
const camera={center:{lat:-6.004,lng:106.004},zoom:18};
const config={provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
class Element{
  constructor(tag,document){Object.assign(this,{tagName:tag.toUpperCase(),ownerDocument:document,children:[],parentElement:null,dataset:{},className:'',attributes:{},open:false,disabled:false,_text:'',clientWidth:800,clientHeight:400});}
  get isConnected(){return this.ownerDocument?.contains(this)??false;}
  get hidden(){return Object.hasOwn(this.attributes,'hidden');}set hidden(value){if(value)this.setAttribute('hidden','');else this.removeAttribute('hidden');}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}set textContent(value){this._text=String(value);this.replaceChildren();}
  append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node);}}
  replaceChildren(...nodes){for(const child of this.children)child.parentElement=null;this.children=[];this.append(...nodes);}
  remove(){if(this.parentElement){const parent=this.parentElement;parent.children.splice(parent.children.indexOf(this),1);this.parentElement=null;}}
  contains(node){return this===node||this.children.some(child=>child.contains(node));}
  setAttribute(key,value){this.attributes[key]=String(value);}removeAttribute(key){delete this.attributes[key];}getAttribute(key){return this.attributes[key]??null;}
  matches(selector){
    if(selector==='[hidden]')return this.hidden;
    if(selector==='dialog')return this.tagName==='DIALOG';
    if(selector==='script[nonce]')return this.tagName==='SCRIPT'&&!!this.nonce;
    if(selector==='[data-map-action]')return Object.hasOwn(this.dataset,'mapAction');
    if(selector==='.parcel-map[data-official-map]')return this.className.split(' ').includes('parcel-map')&&Object.hasOwn(this.dataset,'officialMap');
    if(selector==='template[data-official-camera]')return this.tagName==='TEMPLATE'&&Object.hasOwn(this.dataset,'officialCamera');
    return selector.startsWith('.')&&this.className.split(' ').includes(selector.slice(1));
  }
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
}
function documentFixture(){
  const mutations=[],resizes=[],document=new Element('document',null);document.createElement=tag=>new Element(tag,document);document.baseURI='http://localhost:4173/';
  document.defaultView={
    MutationObserver:class{constructor(callback){this.callback=callback;mutations.push(this);}observe(root,options){this.root=root;this.options=options;}disconnect(){this.disconnected=true;}flush(){if(!this.disconnected)this.callback([]);}},
    ResizeObserver:class{constructor(callback){this.callback=callback;resizes.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}flush(){if(!this.disconnected)this.callback([]);}},
  };
  document.head=document.createElement('head');document.body=document.createElement('body');document.append(document.head,document.body);return{document,mutations,resizes};
}
function ownerFixture(document,{dialog=false,open=true,value=camera}={}){
  const owner=document.createElement('section');owner.className='parcel-map';owner.dataset.officialMap='';
  const canvas=document.createElement('div');canvas.className='official-map-canvas';canvas.hidden=true;
  const template=document.createElement('template');template.dataset.officialCamera='';template.content={textContent:JSON.stringify(value)};
  const status=document.createElement('p');status.className='official-map-status';
  const caption=document.createElement('span');caption.className='parcel-map-zoom';
  const buttons=Object.fromEntries(['in','out','left','right','up','down','fit','toggle-boundary'].map(action=>{const button=document.createElement('button');button.dataset.mapAction=action;button.disabled=true;return[action,button];}));
  owner.append(canvas,template,status,caption,...Object.values(buttons));let dialogNode;
  if(dialog){dialogNode=document.createElement('dialog');dialogNode.open=open;dialogNode.append(owner);document.body.append(dialogNode);}else document.body.append(owner);
  return{owner,canvas,template,status,caption,buttons,dialog:dialogNode};
}
function fakeLeaflet({failSecondLayer=false}={}){
  const maps=[],layers=[],markers=[],icons=[],crs={projection:'fixture-EPSG3857'};
  class Events{
    constructor(){this.events=new Map();}on(name,fn){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(fn);return this;}
    off(name,fn){if(name===undefined)this.events.clear();else this.events.get(name)?.delete(fn);return this;}emit(name,value){for(const fn of this.events.get(name)??[])fn(value);}
  }
  const leaflet={CRS:{EPSG3857:crs},
    map(container,options){
      const map=new Events();Object.assign(map,{container,options,layers:new Set(),zoom:0,center:null,panCalls:[],viewCalls:[],fitCalls:[],removeCalls:0,invalidateCalls:0});
      map.getZoom=()=>map.zoom;map.getSize=()=>({x:container.clientWidth,y:container.clientHeight});
      map.setZoom=value=>{map.zoom=value;map.emit('zoomend');return map;};
      map.setView=(center,zoom,options)=>{map.center=[...center];map.zoom=zoom;map.viewCalls.push({center:[...center],zoom,options});map.emit('zoomend');return map;};
      // Record delegation only; the real Leaflet browser fixture verifies projected fitting.
      map.fitBounds=(bounds,options)=>{map.fitCalls.push(structuredClone({bounds,options}));return map;};
      map.panBy=(offset,options)=>map.panCalls.push({offset,options});map.removeLayer=layer=>map.layers.delete(layer);
      map.remove=()=>{map.removeCalls++;map.layers.clear();};map.invalidateSize=()=>map.invalidateCalls++;
      container.append(container.ownerDocument.createElement('div'));maps.push(map);return map;
    },
    tileLayer(url,options){
      if(failSecondLayer&&layers.length===1)throw Error('private upstream details');
      const layer=new Events();Object.assign(layer,{url,options,map:null});
      layer.addTo=map=>{layer.map=map;map.layers.add(layer);return layer;};
      layer.getTileUrl=point=>url.replace('{z}',point.z).replace('{x}',point.x).replace('{y}',point.y);
      layer.createTile=(point,done)=>{const image=layer.map.container.ownerDocument.createElement('img');image.src=layer.getTileUrl(point);queueMicrotask(()=>done?.(null,image));return image;};
      layers.push(layer);return layer;
    },
    icon(options){const icon={options:structuredClone(options)};icons.push(icon);return icon;},
    marker(position,options){
      const marker=new Events();Object.assign(marker,{position:[...position],options,map:null,tooltip:null,unbindCalls:0});
      marker.bindTooltip=text=>{marker.tooltip=text;return marker;};
      marker.unbindTooltip=()=>{marker.tooltip=null;marker.unbindCalls++;return marker;};
      marker.addTo=map=>{marker.map=map;map.layers.add(marker);return marker;};markers.push(marker);return marker;
    },
  };
  // No polygon, SVG, canvas renderer or geolocation API exists.
  return{leaflet,maps,layers,markers,icons,crs};
}
const loaders=(fake,overrides={})=>({configLoader:async()=>config,libraryLoader:async()=>fake.leaflet,...overrides});
test('configuration fixes OSM standard and same-origin Bhumi without any browser key',()=>{
  assert.deepEqual(validateOfficialMapConfig({...config,apiKey:'ignored',token:'ignored',tileUrl:'https://untrusted.invalid'}),config);
  assert.deepEqual(Object.keys(validateOfficialMapConfig(config)),['provider','mapType','wmsTileTemplate']);
  for(const patch of [{provider:'google'},{provider:'other'},{mapType:'hybrid'},{wmsTileTemplate:'https://elsewhere.invalid/{z}/{x}/{y}'},{wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png?token=x'}])assert.throws(()=>validateOfficialMapConfig({...config,...patch}),{code:'OFFICIAL_MAP_CONFIG_INVALID'});
});
test('map uses exactly two raster layers in EPSG3857 with fixed camera, no geometry renderer',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();
  const instance=createOfficialMap(owner.canvas,{...camera,properties:{token:'not forwarded'}},{leaflet:fake.leaflet,config});
  assert.equal(fake.maps[0].options.crs,fake.crs);assert.equal(fake.maps[0].options.attributionControl,true);assert.deepEqual(fake.maps[0].center,[-6.004,106.004]);assert.equal(fake.maps[0].zoom,18);
  assert.equal(fake.layers.length,2);assert.equal(fake.layers[0].url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(fake.layers[1].url,'/api/maps/bhumi/{z}/{x}/{y}.png');
  assert.equal(fake.maps[0].layers.size,3);assert.equal(fake.markers.length,1);assert.equal(fake.layers[0].options.zIndex,1);assert.equal(fake.layers[1].options.zIndex,2);assert.equal(owner.caption.textContent,'Zoom 18');
  assert.doesNotMatch(JSON.stringify(fake.maps[0].options),/token|properties/);instance.destroy();
});
test('OSM attribution/referrer/cache-friendly settings remain visible and overzoom uses native19',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),instance=createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config});
  const base=fake.layers[0].options;assert.equal(base.referrerPolicy,'origin');assert.equal(base.maxNativeZoom,19);assert.equal(base.maxZoom,21);assert.equal(base.tileSize,256);assert.equal(base.detectRetina,false);assert.equal(base.updateWhenIdle,true);assert.equal(base.updateWhenZooming,false);assert.equal(base.keepBuffer,0);
  assert.match(base.attribution,/https:\/\/www.openstreetmap.org\/copyright/);assert.match(base.attribution,/OpenStreetMap/);assert.equal(Object.hasOwn(base,'headers'),false);assert.equal(Object.hasOwn(base,'cache'),false);
  assert.equal(fake.layers[1].options.tileSize,256);assert.equal(fake.layers[1].options.maxZoom,21);assert.equal(fake.layers[1].options.maxNativeZoom,undefined);instance.destroy();
});
test('Bhumi URL wraps X and rejects invalid coordinates without requesting a fallback image',async()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),instance=createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config}),overlay=fake.layers[1],url=overlay.getTileUrl;
  assert.equal(url({x:0,y:0,z:0}),'/api/maps/bhumi/0/0/0.png');assert.equal(url({x:-1,y:2,z:3}),'/api/maps/bhumi/3/7/2.png');assert.equal(url({x:9,y:2,z:3}),'/api/maps/bhumi/3/1/2.png');assert.equal(url({x:2097151,y:2097151,z:21}),'/api/maps/bhumi/21/2097151/2097151.png');
  for(const point of [{x:0,y:-1,z:1},{x:0,y:2,z:1},{x:0,y:0,z:22},{x:0,y:0,z:-1},{x:0,y:0,z:1.5},{x:'1',y:0,z:1},{x:NaN,y:0,z:1},{x:2**53,y:0,z:1},null])assert.equal(url(point),null);
  let completed=false;const invalid=overlay.createTile({x:0,y:2,z:1},(error,image)=>{assert.equal(error,null);assert.equal(image,invalid);completed=true;});assert.equal(invalid.src,undefined);await settle();assert.equal(completed,true);
  assert.equal(overlay.createTile({x:1,y:1,z:1}).src,'/api/maps/bhumi/1/1/1.png');instance.destroy();assert.equal(url({x:0,y:0,z:0}),null);
});
test('strict camera rejects invalid/polar values rather than silently moving the requested center',()=>{
  for(const value of [null,{...camera,zoom:NaN},{...camera,zoom:22},{...camera,center:{lat:'-6',lng:106}},{...camera,center:{lat:91,lng:106}},{...camera,center:{lat:-6,lng:Infinity}}]){
    const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();assert.throws(()=>createOfficialMap(owner.canvas,value,{leaflet:fake.leaflet,config}),{code:'OFFICIAL_MAP_CAMERA_INVALID'});assert.equal(fake.maps.length,0);
  }
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();assert.throws(()=>createOfficialMap(owner.canvas,{center:{lat:86,lng:106},zoom:18},{leaflet:fake.leaflet,config}),{code:'OFFICIAL_MAP_MERCATOR_LATITUDE'});assert.equal(fake.maps.length,0);
});

test('optional bounds are strictly typed, ordered, geographic and within Mercator coverage',()=>{
  const invalid=[null,{},[],Array(2),[[-6,106]],[[-6,106],[-5,107],[0,0]],[[-6,106,0],[-5,107]],[['-6',106],[-5,107]],[[-6,106],[NaN,107]],[[-91,106],[-5,107]],[[-6,-181],[-5,107]],[[-5,106],[-6,107]],[[-6,107],[-5,106]]];
  for(const bounds of invalid){
    const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();
    assert.throws(()=>createOfficialMap(owner.canvas,{...camera,bounds},{leaflet:fake.leaflet,config}),{code:'OFFICIAL_MAP_CAMERA_INVALID'});assert.equal(fake.maps.length,0);assert.equal(fake.markers.length,0);
  }
  for(const bounds of [[[-86,106],[-5,107]],[[-6,106],[86,107]]]){
    const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();
    assert.throws(()=>createOfficialMap(owner.canvas,{...camera,bounds},{leaflet:fake.leaflet,config}),{code:'OFFICIAL_MAP_MERCATOR_LATITUDE'});assert.equal(fake.maps.length,0);
  }
});

test('display pin uses extent midpoint and self-hosted accessible icon without source metadata',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();
  const input={...camera,bounds:[[-6.01,106],[-5.99,106.02]],properties:{token:'private'},label:'<img src=x>'},before=structuredClone(input);
  const instance=createOfficialMap(owner.canvas,input,{leaflet:fake.leaflet,config}),marker=fake.markers[0];
  assert.deepEqual(marker.position,[-6,106.00999999999999]);assert.notDeepEqual(marker.position,[camera.center.lat,camera.center.lng]);
  assert.equal(marker.tooltip,'Titik acuan bidang');assert.equal(marker.options.title,'Titik acuan bidang');assert.equal(marker.options.alt,'Titik acuan bidang');assert.equal(marker.options.keyboard,true);
  assert.deepEqual(fake.icons[0].options,{iconUrl:'/assets/vendor/leaflet/images/marker-icon.png',iconRetinaUrl:'/assets/vendor/leaflet/images/marker-icon-2x.png',shadowUrl:'/assets/vendor/leaflet/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],tooltipAnchor:[16,-28],shadowSize:[41,41]});
  assert.doesNotMatch(JSON.stringify(marker.options),/private|token|label|<img/);assert.deepEqual(input,before);instance.destroy();
});

test('initial view and reset fit a cloned extent with padding and capped zoom',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),input={...structuredClone(camera),bounds:[[-6.01,106],[-5.99,106.02]]};
  const expected={bounds:structuredClone(input.bounds),options:{padding:[36,36],maxZoom:20,animate:false}},instance=createOfficialMap(owner.canvas,input,{leaflet:fake.leaflet,config}),map=fake.maps[0];
  assert.deepEqual(map.fitCalls,[expected]);assert.equal(map.viewCalls.length,0);
  input.bounds[0][0]=-80;input.center.lat=1;map.setView([0,0],3);instance.control('fit');
  assert.deepEqual(map.fitCalls,[expected,expected]);assert.deepEqual(fake.markers[0].position,[-6,106.00999999999999]);assert.equal(map.viewCalls.length,1);
  instance.control('toggle-boundary');assert.equal(map.layers.has(fake.markers[0]),true);assert.equal(map.layers.has(fake.layers[1]),false);instance.destroy();
});

test('large, tiny and zero-span extents delegate to Leaflet fit without forcing native zoom',()=>{
  for(const bounds of [[[-20,95],[10,141]],[[-6,106],[-5.999999,106.000001]],[[-6,106],[-6,106]]]){
    const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),instance=createOfficialMap(owner.canvas,{...camera,zoom:17,bounds},{leaflet:fake.leaflet,config});
    assert.deepEqual(fake.maps[0].fitCalls,[{bounds,options:{padding:[36,36],maxZoom:20,animate:false}}]);assert.equal(fake.maps[0].viewCalls.length,0);assert.equal(fake.maps[0].options.maxZoom,21);instance.destroy();
  }
});

test('legacy camera keeps native center and zoom while bounds refit after responsive resize',()=>{
  const {document,resizes}=documentFixture(),old=ownerFixture(document),fitted=ownerFixture(document),fake=fakeLeaflet();
  const legacy=createOfficialMap(old.canvas,camera,{leaflet:fake.leaflet,config}),bounded=createOfficialMap(fitted.canvas,{...camera,bounds:[[-6.01,106],[-5.99,106.02]]},{leaflet:fake.leaflet,config});
  assert.deepEqual(fake.markers[0].position,[-6.004,106.004]);assert.deepEqual(fake.maps[0].viewCalls,[{center:[-6.004,106.004],zoom:18,options:{animate:false}}]);
  fake.maps[0].setZoom(21);resizes[0].flush();assert.equal(fake.maps[0].zoom,21);assert.equal(fake.maps[0].fitCalls.length,0);assert.equal(fake.maps[0].invalidateCalls,1);
  fitted.canvas.clientWidth=390;resizes[1].flush();assert.equal(fake.maps[1].invalidateCalls,1);assert.equal(fake.maps[1].fitCalls.length,2);
  assert.deepEqual(fake.maps[1].fitCalls[1],fake.maps[1].fitCalls[0]);bounded.destroy();resizes[1].flush();assert.equal(fake.maps[1].fitCalls.length,2);assert.equal(fake.markers[1].unbindCalls,1);legacy.destroy();
});
test('controls scope zoom/pan/reset and toggle only Bhumi while keeping the base and attribution',()=>{
  const {document}=documentFixture(),a=ownerFixture(document),b=ownerFixture(document),fake=fakeLeaflet();
  const first=createOfficialMap(a.canvas,camera,{leaflet:fake.leaflet,config}),second=createOfficialMap(b.canvas,camera,{leaflet:fake.leaflet,config});
  controlOfficialMap(a.buttons.in);assert.equal(fake.maps[0].zoom,19);assert.equal(fake.maps[1].zoom,18);controlOfficialMap(a.buttons.out);assert.equal(fake.maps[0].zoom,18);
  for(const action of ['left','right','up','down'])assert.equal(controlOfficialMap(a.buttons[action]),true);assert.deepEqual(fake.maps[0].panCalls.map(call=>call.offset),[[-200,0],[200,0],[0,-100],[0,100]]);
  controlOfficialMap(a.buttons['toggle-boundary']);assert.equal(fake.maps[0].layers.has(fake.layers[1]),false);assert.equal(fake.maps[0].layers.has(fake.layers[0]),true);assert.equal(fake.maps[0].layers.has(fake.markers[0]),true);assert.equal(fake.maps[1].layers.size,3);assert.equal(a.buttons['toggle-boundary'].getAttribute('aria-pressed'),'false');assert.equal(a.buttons['toggle-boundary'].textContent,'Tampilkan batas');
  controlOfficialMap(a.buttons['toggle-boundary']);assert.equal(fake.maps[0].layers.has(fake.layers[1]),true);assert.equal(a.buttons['toggle-boundary'].getAttribute('aria-pressed'),'true');
  fake.maps[0].setView([0,0],4);controlOfficialMap(a.buttons.fit);assert.deepEqual(fake.maps[0].center,[-6.004,106.004]);assert.equal(fake.maps[0].zoom,18);
  assert.equal(first.control('__proto__'),false);a.buttons.in.disabled=true;assert.equal(controlOfficialMap(a.buttons.in),false);first.destroy();second.destroy();
});
test('OSM and Bhumi errors are separate, sanitized and never trigger another provider',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),instance=createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config});
  assert.match(owner.status.textContent,/Layer bidang Bhumi diminta/);assert.doesNotMatch(owner.status.textContent,/berhasil|HTTP|200/);
  fake.layers[0].emit('tileerror',{url:'https://private.invalid/token',error:Error('private')});assert.match(owner.status.textContent,/OpenStreetMap belum dapat dimuat/);assert.doesNotMatch(owner.status.textContent,/Bhumi belum dapat dimuat|private/);
  fake.layers[1].emit('tileerror',{status:403,token:'private'});assert.match(owner.status.textContent,/Layer bidang Bhumi belum dapat dimuat/);assert.doesNotMatch(owner.status.textContent,/403|private/);
  fake.layers[0].emit('load');fake.layers[1].emit('load');assert.match(owner.status.textContent,/OpenStreetMap belum dapat dimuat/);assert.equal(fake.layers.length,2);assert.equal(fake.maps[0].layers.size,3);instance.destroy();
});
test('destroy removes listeners, map DOM, resize observation and ownership exactly once',()=>{
  const {document,resizes}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),instance=createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config});
  resizes[0].flush();assert.equal(fake.maps[0].invalidateCalls,1);assert.throws(()=>createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config}),{code:'OFFICIAL_MAP_CONTAINER_UNAVAILABLE'});
  instance.destroy();instance.destroy();assert.equal(fake.maps[0].removeCalls,1);assert.equal(fake.maps[0].events.get('zoomend').size,0);assert.ok(fake.layers.every(layer=>layer.events.get('tileerror').size===0));assert.equal(resizes[0].disconnected,true);assert.equal(owner.canvas.children.length,0);assert.equal(controlOfficialMap(owner.buttons.in),false);
  assert.equal(fake.markers[0].unbindCalls,1);assert.equal(fake.markers[0].tooltip,null);assert.equal(fake.markers[0].events.size,0);assert.equal(fake.maps[0].layers.size,0);
  const next=createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config});next.destroy();assert.equal(fake.maps.length,2);
});
test('constructor failure cleans partial DOM and leaves the owner reusable',()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet({failSecondLayer:true});
  assert.throws(()=>createOfficialMap(owner.canvas,camera,{leaflet:fake.leaflet,config}),error=>error.code==='OFFICIAL_MAP_LIBRARY_UNAVAILABLE'&&!error.message.includes('private'));
  assert.equal(owner.canvas.children.length,0);assert.equal(fake.maps[0].removeCalls,1);const good=fakeLeaflet(),again=createOfficialMap(owner.canvas,camera,{leaflet:good.leaflet,config});again.destroy();
});
test('valid config requires no key, shares one loader and mounts both maps only after readiness',async()=>{
  const {document,mutations}=documentFixture(),a=ownerFixture(document),b=ownerFixture(document),fake=fakeLeaflet(),load=deferred();let configs=0,libraries=0;
  const manager=startOfficialMaps(document,loaders(fake,{configLoader:()=>{configs++;return config;},libraryLoader:value=>{assert.deepEqual(value,config);libraries++;return load.promise;}}));
  assert.equal(startOfficialMaps(document),manager);await settle();assert.equal(configs,1);assert.equal(libraries,1);assert.equal(fake.maps.length,0);
  load.resolve(fake.leaflet);await settle();assert.equal(fake.maps.length,2);assert.equal(a.canvas.hidden,false);assert.equal(b.buttons.fit.disabled,false);assert.deepEqual(mutations[0].options.attributeFilter,['open','hidden']);assert.doesNotMatch(a.status.textContent,/key|Google/);manager.destroy();assert.equal(mutations[0].disconnected,true);
});
test('disconnected owners after pending config do not start loading a library',async()=>{
  const {document,mutations}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),load=deferred();let libraries=0;
  const manager=startOfficialMaps(document,loaders(fake,{configLoader:()=>load.promise,libraryLoader:()=>{libraries++;return fake.leaflet;}}));await settle();owner.owner.remove();mutations[0].flush();load.resolve(config);await settle();assert.equal(libraries,0);assert.equal(fake.maps.length,0);manager.destroy();
});
test('disconnect or destroy while library is pending cannot create a late map',async()=>{
  for(const action of ['remove','destroy']){
    const {document,mutations}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),load=deferred();let signal;
    const manager=startOfficialMaps(document,loaders(fake,{configLoader:args=>{signal=args.signal;return config;},libraryLoader:()=>load.promise}));await settle();
    if(action==='remove'){owner.owner.remove();mutations[0].flush();}else{manager.destroy();assert.equal(signal.aborted,true);}
    load.resolve(fake.leaflet);await settle();assert.equal(fake.maps.length,0);assert.equal(owner.canvas.hidden,true);manager.destroy();
  }
});
test('closed dialogs make no initial request, close cleans up and reopen remounts connected DOM',async()=>{
  const {document,mutations}=documentFixture(),owner=ownerFixture(document,{dialog:true,open:false}),fake=fakeLeaflet();let reads=0;
  const manager=startOfficialMaps(document,loaders(fake,{configLoader:()=>{reads++;return config;}}));await settle();assert.equal(reads,0);
  owner.dialog.open=true;mutations[0].flush();await settle();assert.equal(fake.maps.length,1);owner.dialog.open=false;assert.equal(controlOfficialMap(owner.buttons.in),false);mutations[0].flush();assert.equal(fake.maps[0].removeCalls,1);assert.equal(owner.owner.isConnected,true);assert.equal(owner.canvas.hidden,true);
  owner.dialog.open=true;mutations[0].flush();await settle();assert.equal(fake.maps.length,2);assert.equal(reads,1);manager.destroy();
});
test('hidden ancestors and changed camera release the old map and mount only current data',async()=>{
  const {document,mutations}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),manager=startOfficialMaps(document,loaders(fake));await settle();
  document.body.hidden=true;mutations[0].flush();assert.equal(fake.maps[0].removeCalls,1);document.body.hidden=false;mutations[0].flush();await settle();assert.equal(fake.maps.length,2);
  owner.template.content.textContent=JSON.stringify({center:{lat:-7,lng:110},zoom:17});manager.refresh();await settle();assert.equal(fake.maps[1].removeCalls,1);assert.deepEqual(fake.maps[2].center,[-7,110]);assert.equal(fake.maps[2].zoom,17);manager.destroy();
});
test('overlapping managers cannot claim the same pending owner',async()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),load=deferred();let otherReads=0;
  const first=startOfficialMaps(document,loaders(fake,{configLoader:()=>load.promise})),second=startOfficialMaps(owner.owner,loaders(fake,{configLoader:()=>{otherReads++;return config;}}));
  await settle();load.resolve(config);await settle();assert.equal(otherReads,0);assert.equal(fake.maps.length,1);second.destroy();assert.equal(fake.maps[0].removeCalls,0);first.destroy();
});
test('malformed camera and config failures remain sanitized without loading tiles',async()=>{
  for(const variant of ['camera','config','error','polar']){
    const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet();let loads=0;if(variant==='camera')owner.template.content.textContent='private malformed';if(variant==='polar')owner.template.content.textContent=JSON.stringify({center:{lat:86,lng:106},zoom:18});
    const manager=startOfficialMaps(document,loaders(fake,{configLoader:()=>{if(variant==='error')throw Error('secret key in URL');return{...config,provider:'untrusted'};},libraryLoader:()=>{loads++;return fake.leaflet;}}));await settle();
    assert.equal(loads,0);assert.equal(fake.maps.length,0);assert.equal(owner.canvas.hidden,true);assert.doesNotMatch(owner.status.textContent,/private|secret|untrusted/);assert.match(owner.status.textContent,variant==='polar'?/Mercator/:/belum dapat dimuat/);manager.destroy();
  }
});
test('configuration read fixes same-origin credentials, no-store and abort signal',async()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),calls=[];document.defaultView.fetch=async(url,options)=>{calls.push({url,options});return{status:200,redirected:false,json:async()=>config};};
  const manager=startOfficialMaps(document,{libraryLoader:()=>fake.leaflet});await settle();assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/maps/config');
  assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[0].options.signal.aborted,false);assert.equal(owner.canvas.hidden,false);manager.destroy();assert.equal(calls[0].options.signal.aborted,true);
});
test('redirected or failed configuration prevents library and tile creation',async()=>{
  for(const response of [{status:302,redirected:false},{status:200,redirected:true},{status:503,redirected:false}]){
    const {document}=documentFixture(),owner=ownerFixture(document);document.defaultView.fetch=async()=>({...response,json:async()=>config});const manager=startOfficialMaps(document);await settle();assert.equal(document.head.children.length,0);assert.equal(owner.canvas.hidden,true);manager.destroy();
  }
});
test('default loader uses only packaged Leaflet classic script, nonce, and ready global L',async()=>{
  const {document}=documentFixture(),owner=ownerFixture(document),fake=fakeLeaflet(),nonce=document.createElement('script');nonce.nonce='fixture-nonce';document.head.append(nonce);
  const manager=startOfficialMaps(document,{configLoader:()=>config});await settle();const script=document.head.children.find(node=>node.src);
  assert.equal(script.src,'/assets/vendor/leaflet/leaflet.js');assert.equal(script.nonce,'fixture-nonce');assert.equal(script.referrerPolicy,'origin');assert.equal(script.async,true);assert.equal(script.type,undefined);assert.equal(fake.maps.length,0);
  document.defaultView.L=fake.leaflet;script.onload();await settle();assert.equal(fake.maps.length,1);assert.equal(owner.canvas.hidden,false);manager.destroy();
  const next=startOfficialMaps(document,{configLoader:()=>config});await settle();assert.equal(document.head.children.filter(node=>node.src).length,1);assert.equal(fake.maps.length,2);next.destroy();
});
test('local library failure is sanitized and permits retry after reopening',async()=>{
  const {document,mutations}=documentFixture(),owner=ownerFixture(document,{dialog:true}),fake=fakeLeaflet();
  const manager=startOfficialMaps(document,{configLoader:()=>config});await settle();const script=document.head.children[0];script.onerror(new Error('private URL'));await settle();
  assert.equal(document.head.children.length,0);assert.equal(owner.canvas.hidden,true);assert.doesNotMatch(owner.status.textContent,/private|synthetic/);
  owner.dialog.open=false;mutations[0].flush();owner.dialog.open=true;mutations[0].flush();await settle();document.defaultView.L=fake.leaflet;document.head.children[0].onload();await settle();assert.equal(fake.maps.length,1);manager.destroy();
});
