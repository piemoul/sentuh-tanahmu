import test from 'node:test';
import assert from 'node:assert/strict';
import {createOfficeMap} from '../assets/maps/office-map.js';
import {loadMapLibrary} from '../assets/maps/official-map.js';
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
class Element{
 constructor(tag,document){Object.assign(this,{tagName:tag.toUpperCase(),ownerDocument:document,children:[],parentElement:null,attributes:{},dataset:{},className:'',_text:'',clientWidth:800,clientHeight:400,eventListeners:new Map()});}
 get isConnected(){return this.ownerDocument?.contains(this)??false;}
 get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}set textContent(value){this._text=String(value);this.replaceChildren();}
 set innerHTML(_value){throw Error('Untrusted HTML must never be parsed.');}
 append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;this.children.push(node);}}
 replaceChildren(...nodes){for(const node of this.children)node.parentElement=null;this.children=[];this.append(...nodes);}
 remove(){const parent=this.parentElement;if(parent){parent.children.splice(parent.children.indexOf(this),1);this.parentElement=null;}}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 matches(selector){if(selector==='[hidden]')return Object.hasOwn(this.attributes,'hidden');if(selector==='[data-office-map]')return Object.hasOwn(this.dataset,'officeMap');if(selector==='script[nonce]')return this.tagName==='SCRIPT'&&!!this.nonce;return selector.startsWith('.')?this.className.split(' ').includes(selector.slice(1)):this.tagName===selector.toUpperCase();}
 closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 addEventListener(type,callback){if(!this.eventListeners.has(type))this.eventListeners.set(type,new Set());this.eventListeners.get(type).add(callback);}
 removeEventListener(type,callback){this.eventListeners.get(type)?.delete(callback);}
 dispatchEvent(event){for(const callback of [...(this.eventListeners.get(event.type)??[])])callback(event);return !event.defaultPrevented;}
}
function fixture(){
 const document=new Element('document',null),resizes=[];document.createElement=tag=>new Element(tag,document);document.defaultView={ResizeObserver:class{constructor(callback){this.callback=callback;resizes.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}flush(){this.callback();}}};
 document.head=document.createElement('head');document.body=document.createElement('body');document.append(document.head,document.body);
 const section=document.createElement('section'),canvas=document.createElement('div'),status=document.createElement('p');section.dataset.officeMap='';status.className='office-map-status';section.append(canvas,status);document.body.append(section);
 return {document,section,canvas,status,resizes};
}
function fakeLeaflet({failLayer=false,failMarker=false,uninitializedCenter=false,delayedIcons=true}={}){
 const maps=[],layers=[],markers=[],icons=[],popupCalls=[];
 class Events{
  constructor(){this.events=new Map();}
  on(name,callback){if(!this.events.has(name))this.events.set(name,new Set());this.events.get(name).add(callback);return this;}
  off(name,callback){if(name===undefined)this.events.clear();else this.events.get(name)?.delete(callback);return this;}
  emit(name,value){for(const callback of [...(this.events.get(name)??[])])callback(value);}
 }
 const leaflet={CRS:{EPSG3857:{fixture:true}},
  map(container,options){
   const map=new Events();Object.assign(map,{container,options,layers:new Set(),pendingMarkers:new Set(),loaded:!delayedIcons,center:[0,0],zoom:0,views:[],pans:[],removeCalls:0,invalidateCalls:0});
   map.getCenter=()=>{if(uninitializedCenter&&!map.views.length)throw Error('Set map center and zoom first.');return {lat:map.center[0],lng:map.center[1]};};map.getZoom=()=>map.zoom;map.getSize=()=>({x:container.clientWidth,y:container.clientHeight});
   map.setView=(center,zoom,options)=>{map.center=[...center];map.zoom=zoom;map.views.push({center:[...center],zoom,options});if(!map.loaded){map.loaded=true;for(const marker of [...map.pendingMarkers])marker.installIcon();map.pendingMarkers.clear();}map.emit('moveend');map.emit('zoomend');return map;};
   map.setZoom=zoom=>{map.zoom=zoom;map.emit('zoomend');return map;};map.panBy=(point,options)=>{map.pans.push({point,options});map.center=[-5,105];map.emit('moveend');};
   map.invalidateSize=()=>map.invalidateCalls++;map.remove=()=>{map.removeCalls++;map.layers.clear();map.pendingMarkers.clear();};container.append(container.ownerDocument.createElement('div'));maps.push(map);return map;
  },
  tileLayer(url,options){if(failLayer)throw Error('private upstream diagnostics');const layer=new Events();Object.assign(layer,{url,options});layer.addTo=map=>{layer.map=map;map.layers.add(layer);return layer;};layers.push(layer);return layer;},
  icon(options){const icon={options};icons.push(icon);return icon;},
  marker(point,options){
   if(failMarker)throw Error('private marker diagnostics');const marker=new Events();Object.assign(marker,{point:[...point],options,removed:0});
   // Any Leaflet popup would duplicate the parent's sole native custom overlay.
   for(const method of ['bindPopup','unbindPopup','openPopup','closePopup'])marker[method]=()=>{popupCalls.push(method);throw Error('Office markers must not render or manage a second info panel.');};
   marker.installIcon=()=>{marker.element?.removeEventListener('keypress',marker.legacyKeypress);marker.element?.remove();const map=marker.map;marker.element=map.container.ownerDocument.createElement('img');marker.element.attributes.role='button';marker.element.attributes.tabindex='0';map.container.append(marker.element);marker.legacyKeypress=event=>{if(event.keyCode===13)marker.emit('click');};marker.element.addEventListener('keypress',marker.legacyKeypress);marker.emit('add');};
   // Match Leaflet: addTo on an unloaded map queues onAdd, and getElement()
   // remains undefined until the first camera initializes the map.
   marker.addTo=map=>{marker.map=map;map.layers.add(marker);if(map.loaded)marker.installIcon();else{marker.iconWasDeferred=marker.getElement()===undefined;map.pendingMarkers.add(marker);}return marker;};
   marker.getElement=()=>marker.element;
   marker.remove=()=>{marker.removed++;marker.element?.removeEventListener('keypress',marker.legacyKeypress);marker.element?.remove();marker.map?.pendingMarkers.delete(marker);marker.map?.layers.delete(marker);marker.map=null;return marker;};markers.push(marker);return marker;
  },
 };
 return {leaflet,maps,layers,markers,icons,popupCalls};
}
const row=(index,patch={})=>({index,item:{kantorId:`office-${index}`,namaKantor:`Kantor ${index}`,alamat:'Alamat asli',latitude:-6-index/100,longitude:106+index/100,jarak:0,statusPeralihanEl:1,statusAntrian:0,statusKiosk:1,...patch}});
const input=(entries=[],patch={})=>({entries,selected:null,open:false,...patch});
function pressKey(element,key,{repeat=false,legacyKeyCode=13}={}){
 const event=new Event('keydown',{cancelable:true,bubbles:true});Object.defineProperties(event,{key:{value:key},repeat:{value:repeat},keyCode:{value:0}});let stopped=0;const stop=event.stopPropagation.bind(event);event.stopPropagation=()=>{stopped++;stop();};element.dispatchEvent(event);
 if(!event.defaultPrevented){const keypress=new Event('keypress',{cancelable:true,bubbles:true});Object.defineProperty(keypress,'keyCode',{value:legacyKeyCode});element.dispatchEvent(keypress);}
 return {event,stopped};
}
async function mounted(value=input(),options={}){const owner=fixture(),fake=fakeLeaflet(),controller=createOfficeMap(owner.canvas,value,{leaflet:fake.leaflet,...options});assert.equal(await controller.ready,true);return {...owner,...fake,controller};}

test('empty office map uses native camera only, with no invented office marker or location request',async()=>{
 const f=await mounted();assert.deepEqual(f.maps[0].center,[-0.792918,116.482347]);assert.equal(f.maps[0].zoom,4.4746);assert.equal(f.markers.length,0);assert.equal(f.layers.length,1);assert.equal(f.layers[0].url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(f.document.defaultView.fetch,undefined);assert.equal(f.document.defaultView.navigator,undefined);assert.match(f.status.textContent,/OpenStreetMap/);f.controller.destroy();
});
test('single raster layer retains OSM attribution and bundled icons with fractional camera support',async()=>{
 const f=await mounted(input([row(0)])),map=f.maps[0],options=f.layers[0].options;assert.equal(map.options.crs,f.leaflet.CRS.EPSG3857);assert.equal(map.options.zoomSnap,0);assert.equal(map.options.attributionControl,true);assert.equal(options.maxNativeZoom,19);assert.equal(options.maxZoom,21);assert.equal(options.referrerPolicy,'origin');assert.equal(options.updateWhenIdle,true);assert.equal(options.keepBuffer,0);assert.match(options.attribution,/https:\/\/www.openstreetmap.org\/copyright/);assert.equal(f.icons[0].options.iconUrl,'/assets/vendor/leaflet/images/marker-icon.png');assert.doesNotMatch(f.layers[0].url,/bhumi|api|token/);f.controller.destroy();
});
test('source indices preserve duplicate original IDs and zero coordinates',async()=>{
 const entries=[row(7,{kantorId:'same-original-ID',latitude:0,longitude:0}),row(2,{kantorId:'same-original-ID'})],selected=[];const f=await mounted(input(entries),{onSelect:index=>selected.push(index)});
 assert.equal(f.markers.length,2);assert.deepEqual(f.markers.map(marker=>marker.options.officeIndex),[7,2]);assert.deepEqual(f.markers.map(marker=>marker.options.officeId),['same-original-ID','same-original-ID']);assert.deepEqual(f.markers[0].point,[0,0]);f.markers[1].emit('click');f.markers[0].emit('click');assert.deepEqual(selected,[2,7]);f.controller.destroy();
});
test('selected original row centers its own coordinates at native zoom15 without duplicating the parent overlay',async()=>{
 const entries=[row(4),row(12)],f=await mounted(input(entries,{selected:12,open:true}));assert.deepEqual(f.maps[0].center,[entries[1].item.latitude,entries[1].item.longitude]);assert.equal(f.maps[0].zoom,15);assert.deepEqual(f.popupCalls,[]);assert.deepEqual(f.canvas.children.map(node=>node.tagName),['DIV','IMG','IMG']);f.controller.destroy();
});
test('retained camera wins on remount while selected information remains open and camera copies cannot mutate it',async()=>{
 const retained={center:{lat:-3.25,lng:108.75},zoom:9.5},f=await mounted(input([row(0)],{selected:0,open:true,camera:retained}));assert.deepEqual(f.maps[0].center,[-3.25,108.75]);assert.equal(f.maps[0].zoom,9.5);assert.deepEqual(f.popupCalls,[]);const copy=f.controller.getCamera();copy.center.lat=1;assert.deepEqual(f.controller.getCamera(),retained);f.controller.destroy();assert.deepEqual(f.controller.getCamera(),retained);
});
test('selection update centers at15, reuses original markers, and a closed panel does not recenter',async()=>{
 const entries=[row(0),row(8)],f=await mounted(input(entries));f.controller.update(input(entries,{selected:8,open:true}));assert.equal(f.maps[0].zoom,15);assert.deepEqual(f.maps[0].center,[entries[1].item.latitude,entries[1].item.longitude]);const views=f.maps[0].views.length;f.controller.update(input(entries,{selected:8,open:false}));assert.equal(f.maps[0].views.length,views);assert.equal(f.markers.length,2);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('query/facility list filtering does not alter all-source marker membership or hidden-row selection',async()=>{
 const entries=[row(1),row(5,{statusKiosk:0})],f=await mounted(input(entries,{selected:5,open:true}));f.controller.update(input(entries,{selected:5,open:true,query:'Kantor 1',filters:[3],camera:f.controller.getCamera()}));assert.equal(f.markers.length,2);assert.deepEqual(f.maps[0].center,[entries[1].item.latitude,entries[1].item.longitude]);assert.deepEqual(f.markers.map(marker=>marker.options.officeIndex),[1,5]);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('source replacement removes retired markers; stale handlers cannot select new rows or manufacture overlay-close events',async()=>{
 const old=row(3),token={},selected=[],closed=[],f=await mounted(input([old],{selected:3,open:true,sourceToken:token}),{onSelect:index=>selected.push(index),onClose:()=>closed.push(true)});const retired=f.markers[0],click=[...retired.events.get('click')][0],next=row(3,{kantorId:'different'});
 f.controller.update(input([next],{selected:3,open:true,sourceToken:{}}));click();retired.emit('popupclose');assert.deepEqual(selected,[]);assert.deepEqual(closed,[]);assert.equal(retired.removed,1);assert.equal(retired.events.size,0);assert.equal(f.markers[1].options.officeId,'different');f.markers[1].emit('click');assert.deepEqual(selected,[3]);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('map tap and explicit close control hide the parent overlay once; programmatic update does not invoke close',async()=>{
 let closes=0;const entries=[row(0)],f=await mounted(input(entries,{selected:0,open:true}),{onClose:()=>closes++});f.maps[0].emit('click');f.maps[0].emit('click');assert.equal(closes,1);f.controller.update(input(entries,{selected:0,open:true}));assert.equal(f.controller.control('close'),true);f.controller.control('close');assert.equal(closes,2);f.controller.update(input(entries,{selected:0,open:true}));f.controller.update(input(entries,{selected:0,open:false}));assert.equal(closes,2);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('marker selection has one click listener and cannot auto-open a second panel or close the existing parent',async()=>{
 let closes=0,controller;const selections=[],entries=[row(0),row(1)],f=await mounted(input(entries,{selected:0,open:true}),{onClose:()=>{closes++;controller.destroy();},onSelect:index=>selections.push(index)});controller=f.controller;
 f.markers[1].emit('click');assert.equal(closes,0);assert.deepEqual(selections,[1]);assert.equal(f.maps[0].removeCalls,0);assert.equal(f.markers[0].events.get('click').size,1);assert.equal(f.markers[1].events.get('click').size,1);assert.equal(f.markers[0].events.has('popupclose'),false);controller.update(input(entries,{selected:1,open:true}));assert.deepEqual(f.maps[0].center,[entries[1].item.latitude,entries[1].item.longitude]);assert.equal(f.maps[0].layers.size,3);assert.deepEqual(f.popupCalls,[]);controller.destroy();
});
test('removing a selected row releases its marker and leaves only the raster layer without retiring the parent',async()=>{
 let closes=0;const f=await mounted(input([row(0)],{selected:0,open:true}),{onClose:()=>closes++});assert.equal(f.maps[0].layers.size,2);f.controller.update(input());assert.equal(f.maps[0].layers.size,1);assert.equal(closes,0);assert.equal(f.markers[0].removed,1);assert.equal(f.markers[0].events.size,0);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('keyboard marker labels preserve literal office names while facility rendering remains owned by the parent overlay',async()=>{
 const name='<img src=x onerror=alert(1)>',entries=[row(0,{namaKantor:name,statusAntrian:true,statusKiosk:'1'})],before=structuredClone(entries),f=await mounted(input(entries));const marker=f.markers[0];assert.equal(marker.options.keyboard,true);assert.equal(marker.options.bubblingMouseEvents,false);assert.equal(marker.options.title,name);assert.equal(marker.options.alt,name);assert.deepEqual(entries,before);assert.equal(Object.hasOwn(marker.options,'statusAntrian'),false);assert.equal(Object.hasOwn(marker.options,'statusKiosk'),false);assert.equal(f.section.querySelectorAll('li').length,0);assert.equal(f.section.textContent.includes('Peralihan Elektronik'),false);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();
});
test('invalid/out-of-Mercator positions never become markers or a fake selected point',async()=>{
 const entries=[row(0,{latitude:90}),row(1,{longitude:181}),row(2,{latitude:NaN}),row(3,{latitude:'-6'}),row(4,{kantorId:null})],f=await mounted(input(entries,{selected:0,open:true}));assert.equal(f.markers.length,0);assert.equal(f.icons.length,0);assert.deepEqual(f.maps[0].center,[-0.792918,116.482347]);assert.match(f.status.textContent,/5 kantor/);f.controller.destroy();
});
test('malformed identities, duplicate indices, camera and input types are rejected before Leaflet',()=>{
 for(const value of [input([row(0),row(0)]),input([row(-1)]),input([],{selected:'0'}),input([],{open:1}),input([],{camera:{center:{lat:90,lng:1},zoom:5}}),input([],{camera:{center:{lat:0,lng:0},zoom:Infinity}})]){
  const f=fixture(),fake=fakeLeaflet();assert.throws(()=>createOfficeMap(f.canvas,value,{leaflet:fake.leaflet}),error=>/^OFFICE_MAP_(INPUT|CAMERA)_INVALID$/.test(error.code));assert.equal(fake.maps.length,0);
 }
});
test('duplicate mount is rejected during loading without damaging the original claim; pending updates are used',async()=>{
 const f=fixture(),fake=fakeLeaflet(),load=deferred();let calls=0;const controller=createOfficeMap(f.canvas,input(),{libraryLoader:()=>{calls++;return load.promise;}});assert.equal(controller.getCamera(),null);assert.throws(()=>createOfficeMap(f.canvas,input(),{leaflet:fake.leaflet}),{code:'OFFICE_MAP_CONTAINER_UNAVAILABLE'});await settle();controller.update(input([row(8)],{selected:8,open:true}));load.resolve(fake.leaflet);assert.equal(await controller.ready,true);assert.equal(calls,1);assert.equal(fake.maps.length,1);assert.equal(fake.markers[0].options.officeIndex,8);assert.equal(fake.maps[0].zoom,15);controller.destroy();
});
test('shared bundled loader serves two office canvases with one script and no global race',async()=>{
 const f=fixture(),other=f.document.createElement('div');f.section.append(other);const fake=fakeLeaflet(),loader=()=>loadMapLibrary(f.document),a=createOfficeMap(f.canvas,input([row(0)]),{libraryLoader:loader}),b=createOfficeMap(other,input([row(1)]),{libraryLoader:loader});await settle();assert.equal(f.document.head.children.length,1);const script=f.document.head.children[0];assert.equal(script.src,'/assets/vendor/leaflet/leaflet.js');f.document.defaultView.L=fake.leaflet;script.onload();assert.equal(await a.ready,true);assert.equal(await b.ready,true);assert.equal(fake.maps.length,2);a.destroy();b.destroy();
});
test('destroy before scheduled loading avoids the loader and remains idempotent',async()=>{
 const f=fixture();let calls=0;const controller=createOfficeMap(f.canvas,input(),{libraryLoader:()=>{calls++;throw Error('must not run');}});controller.destroy();controller.destroy();assert.equal(await controller.ready,false);assert.equal(calls,0);assert.equal(controller.update(input()),false);assert.equal(controller.resize(),false);assert.equal(controller.control('in'),false);
});
test('owner/session/source invalidation after await prevents all map construction',async()=>{
 const f=fixture(),fake=fakeLeaflet(),load=deferred();let current=true;const controller=createOfficeMap(f.canvas,input([row(0)]),{libraryLoader:()=>load.promise,isCurrent:()=>current});await settle();current=false;load.resolve(fake.leaflet);assert.equal(await controller.ready,false);assert.equal(fake.maps.length,0);assert.equal(fake.markers.length,0);controller.destroy();
});
test('detached canvas after pending load does not mount or modify the replacement canvas',async()=>{
 const f=fixture(),fake=fakeLeaflet(),load=deferred(),a=createOfficeMap(f.canvas,input([row(0)]),{libraryLoader:()=>load.promise});await settle();const replacement=f.document.createElement('div');f.section.replaceChildren(replacement,f.status);const b=createOfficeMap(replacement,input([row(1)]),{leaflet:fake.leaflet});assert.equal(await b.ready,true);load.resolve(fake.leaflet);assert.equal(await a.ready,false);a.destroy();assert.equal(fake.maps.length,1);assert.deepEqual(replacement.children.map(node=>node.tagName),['DIV','IMG']);assert.equal(fake.maps[0].removeCalls,0);b.destroy();
});
test('failed loader reports sanitized status, releases ownership, and retries only through an explicit new mount',async()=>{
 const f=fixture(),fake=fakeLeaflet();let loads=0;const bad=createOfficeMap(f.canvas,input(),{libraryLoader:()=>{loads++;throw Error('private token=secret');}});assert.equal(await bad.ready,false);assert.equal(loads,1);assert.match(f.status.textContent,/belum dapat dimuat/);assert.doesNotMatch(f.status.textContent,/private|secret|token/);const next=createOfficeMap(f.canvas,input([row(0)]),{leaflet:fake.leaflet});assert.equal(await next.ready,true);assert.equal(loads,1);next.destroy();
});
test('partial Leaflet construction failures clean map DOM and release the claim',async()=>{
 for(const problem of [{failLayer:true,uninitializedCenter:true},{failMarker:true}]){
  const f=fixture(),fake=fakeLeaflet(problem),bad=createOfficeMap(f.canvas,input([row(0)]),{leaflet:fake.leaflet});assert.equal(await bad.ready,false);assert.equal(fake.maps[0].removeCalls,1);assert.equal(f.canvas.children.length,0);assert.doesNotMatch(f.status.textContent,/private/);const good=fakeLeaflet(),next=createOfficeMap(f.canvas,input(),{leaflet:good.leaflet});assert.equal(await next.ready,true);next.destroy();
 }
});
test('resize and complete disposal release listeners, markers and canvas ownership without constructing a popup',async()=>{
 const f=await mounted(input([row(0)],{selected:0,open:true}));assert.equal(f.resizes.length,1);f.resizes[0].flush();assert.equal(f.maps[0].invalidateCalls,1);f.controller.destroy();f.controller.destroy();f.resizes[0].flush();assert.equal(f.resizes[0].disconnected,true);assert.equal(f.maps[0].invalidateCalls,1);assert.equal(f.maps[0].removeCalls,1);assert.equal(f.maps[0].events.get('click').size,0);assert.equal(f.markers[0].events.size,0);assert.equal(f.markers[0].removed,1);assert.equal(f.canvas.children.length,0);const again=createOfficeMap(f.canvas,input(),{leaflet:f.leaflet});assert.equal(await again.ready,true);again.destroy();
});
test('tile failure remains explicit through successful load events and later local updates',async()=>{
 const entries=[row(0)],f=await mounted(input(entries));f.layers[0].emit('tileerror');assert.match(f.status.textContent,/belum dapat dimuat/);f.layers[0].emit('load');f.controller.update(input(entries));assert.match(f.status.textContent,/belum dapat dimuat/);assert.equal(f.layers.length,1);f.controller.destroy();
});
test('pan/zoom/reset controls retain camera, keep zoom bounded and do not perform API requests',async()=>{
 const cameras=[],entries=[row(2)],f=await mounted(input(entries,{selected:2,open:true}),{onCamera:value=>cameras.push(value)});f.controller.control('right');assert.deepEqual(f.maps[0].pans[0].point,[200,0]);assert.deepEqual(f.controller.getCamera().center,{lat:-5,lng:105});assert.equal(f.controller.control('reset'),true);assert.equal(f.maps[0].zoom,15);assert.deepEqual(f.maps[0].center,[entries[0].item.latitude,entries[0].item.longitude]);for(let i=0;i<30;i++)f.controller.control('in');assert.equal(f.maps[0].zoom,21);for(let i=0;i<30;i++)f.controller.control('out');assert.equal(f.maps[0].zoom,0);assert.equal(f.controller.control('unknown'),false);assert.ok(cameras.length>2);f.controller.destroy();
});
test('stale current guard prevents marker, close, resize, status and camera callbacks',async()=>{
 let current=true,selected=0,closes=0,cameras=0;const f=await mounted(input([row(0)],{selected:0,open:true}),{isCurrent:()=>current,onSelect:()=>selected++,onClose:()=>closes++,onCamera:()=>cameras++}),before=cameras,status=f.status.textContent;current=false;f.markers[0].emit('click');f.markers[0].emit('popupclose');f.maps[0].emit('click');f.maps[0].emit('moveend');f.layers[0].emit('tileerror');f.resizes[0].flush();assert.equal(selected,0);assert.equal(closes,0);assert.equal(cameras,before);assert.equal(f.status.textContent,status);assert.equal(f.maps[0].invalidateCalls,0);f.controller.destroy();
});
test('synchronous retirement from a camera callback cleans the just-created map before resize setup',async()=>{
 const f=fixture(),fake=fakeLeaflet();let controller;controller=createOfficeMap(f.canvas,input([row(0)]),{leaflet:fake.leaflet,onCamera:()=>controller.destroy()});assert.equal(await controller.ready,false);assert.equal(fake.maps[0].removeCalls,1);assert.equal(f.resizes.length,0);assert.equal(f.canvas.children.length,0);
});
test('DOM marker keydown Enter and Space select the original index once and cancel legacy keypress duplication',async()=>{
 const selections=[],f=await mounted(input([row(9)]),{onSelect:index=>selections.push(index)}),element=f.markers[0].getElement();assert.equal(element.tagName,'IMG');assert.equal(element.attributes.role,'button');assert.equal(element.attributes.tabindex,'0');assert.equal(element.eventListeners.get('keydown').size,1);
 for(const key of ['Enter',' ']){const {event,stopped}=pressKey(element,key);assert.equal(event.keyCode,0);assert.equal(event.defaultPrevented,true);assert.equal(stopped,1);}
 assert.deepEqual(selections,[9,9]);assert.deepEqual(f.popupCalls,[]);f.controller.destroy();assert.equal(element.eventListeners.get('keydown').size,0);
});
test('DOM marker keydown ignores other keys and cancels repeated activation keys without selecting again',async()=>{
 const selections=[],f=await mounted(input([row(1)]),{onSelect:index=>selections.push(index)}),element=f.markers[0].getElement();
 for(const key of ['Tab','ArrowUp','Escape','a']){const {event,stopped}=pressKey(element,key,{legacyKeyCode:0});assert.equal(event.defaultPrevented,false);assert.equal(stopped,0);}
 for(const key of ['Enter',' ']){const {event,stopped}=pressKey(element,key,{repeat:true});assert.equal(event.defaultPrevented,true);assert.equal(stopped,1);}
 assert.deepEqual(selections,[]);f.controller.destroy();
});
test('retired DOM markers lose keydown handlers and captured stale handlers cannot activate changed or unauthenticated sources',async()=>{
 const selections=[],entries=[row(2)],f=await mounted(input(entries,{sourceToken:{}}),{onSelect:index=>selections.push(index)}),old=f.markers[0].getElement(),captured=[...old.eventListeners.get('keydown')][0];
 f.controller.update(input([row(2,{kantorId:'replacement'})],{sourceToken:{}}));assert.equal(old.isConnected,false);assert.equal(old.eventListeners.get('keydown').size,0);pressKey(old,'Enter');const stale=new Event('keydown',{cancelable:true});Object.defineProperty(stale,'key',{value:' '});captured(stale);assert.equal(stale.defaultPrevented,false);assert.deepEqual(selections,[]);
 const next=f.markers[1].getElement();pressKey(next,' ');assert.deepEqual(selections,[2]);f.controller.destroy();assert.equal(next.eventListeners.get('keydown').size,0);pressKey(next,'Enter');assert.deepEqual(selections,[2]);
});
test('DOM marker keyboard activation rechecks current session and cleans listeners during synchronous parent retirement',async()=>{
 const selections=[];let current=true,controller;const f=await mounted(input([row(4)]),{isCurrent:()=>current,onSelect:index=>{selections.push(index);controller.destroy();}});controller=f.controller;const element=f.markers[0].getElement();current=false;const stale=pressKey(element,'Enter',{legacyKeyCode:0});assert.equal(stale.event.defaultPrevented,false);assert.deepEqual(selections,[]);current=true;const live=pressKey(element,'Enter');assert.equal(live.event.defaultPrevented,true);assert.deepEqual(selections,[4]);assert.equal(element.eventListeners.get('keydown').size,0);assert.equal(f.maps[0].removeCalls,1);pressKey(element,' ');assert.deepEqual(selections,[4]);
});
test('fresh unloaded maps defer marker IMG until first setView and bind Enter/Space once on its add event',async()=>{
 const selections=[],f=await mounted(input([row(7)]),{onSelect:index=>selections.push(index)}),marker=f.markers[0],element=marker.getElement();assert.equal(marker.iconWasDeferred,true);assert.equal(f.maps[0].loaded,true);assert.equal(f.maps[0].pendingMarkers.size,0);assert.equal(marker.events.get('add').size,1);assert.equal(element.eventListeners.get('keydown').size,1);
 pressKey(element,'Enter');pressKey(element,' ');assert.deepEqual(selections,[7,7]);marker.emit('add');marker.emit('add');assert.equal(element.eventListeners.get('keydown').size,1);pressKey(element,'Enter');assert.deepEqual(selections,[7,7,7]);f.controller.destroy();assert.equal(element.eventListeners.get('keydown').size,0);assert.equal(marker.events.size,0);
});
test('marker add on already-loaded maps binds once and replacing its icon retires the old DOM keyboard handler',async()=>{
 const owner=fixture(),fake=fakeLeaflet({delayedIcons:false}),selections=[],controller=createOfficeMap(owner.canvas,input([row(3)]),{leaflet:fake.leaflet,onSelect:index=>selections.push(index)});assert.equal(await controller.ready,true);const marker=fake.markers[0],old=marker.getElement(),captured=[...old.eventListeners.get('keydown')][0];assert.equal(marker.iconWasDeferred,undefined);assert.equal(old.eventListeners.get('keydown').size,1);pressKey(old,'Enter');
 marker.installIcon();const next=marker.getElement();assert.notEqual(old,next);assert.equal(old.isConnected,false);assert.equal(old.eventListeners.get('keydown').size,0);assert.equal(next.eventListeners.get('keydown').size,1);pressKey(old,' ');const stale=new Event('keydown',{cancelable:true});Object.defineProperty(stale,'key',{value:'Enter'});captured(stale);assert.equal(stale.defaultPrevented,false);pressKey(next,' ');assert.deepEqual(selections,[3,3]);controller.destroy();assert.equal(next.eventListeners.get('keydown').size,0);assert.equal(marker.events.size,0);
});
