// Office points only. OSM raster tiles are the browser adaptation of the
// native hybrid map; no parcel geometry, Bhumi request or device location.
// Native: initial camera 8f2bac; selected camera zoom 15 at da5ba4.
const OSM='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const INITIAL={center:{lat:-0.792918,lng:116.482347},zoom:4.4746};
const MERCATOR=85.0511287798066,claims=new WeakMap();
const failure=code=>Object.assign(new Error('Peta kantor belum dapat dimuat.'),{code});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=(value,bound)=>typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=bound;
const active=node=>node?.isConnected!==false&&!node?.closest?.('[hidden]');
const library=value=>value&&['map','tileLayer','marker','icon'].every(key=>typeof value[key]==='function')&&value.CRS?.EPSG3857;
const copyCamera=value=>({center:{lat:value.center.lat,lng:value.center.lng},zoom:value.zoom});
function camera(value){
 if(value==null)return null;
 if(!object(value)||!object(value.center)||!finite(value.center.lat,MERCATOR)||!finite(value.center.lng,180)||typeof value.zoom!=='number'||!Number.isFinite(value.zoom)||value.zoom<0||value.zoom>21)throw failure('OFFICE_MAP_CAMERA_INVALID');
 return copyCamera(value);
}
function data(input){
 if(!object(input)||!Array.isArray(input.entries)||typeof input.open!=='boolean'||input.selected!==null&&(!Number.isSafeInteger(input.selected)||input.selected<0))throw failure('OFFICE_MAP_INPUT_INVALID');
 const seen=new Set(),entries=input.entries.map(entry=>{
  if(!object(entry)||!Number.isSafeInteger(entry.index)||entry.index<0||seen.has(entry.index)||!object(entry.item))throw failure('OFFICE_MAP_INPUT_INVALID');
  seen.add(entry.index);return {item:entry.item,index:entry.index};
 });
 return {entries,selected:input.selected,open:input.open,camera:camera(input.camera),sourceToken:input.sourceToken};
}
const position=item=>typeof item.kantorId==='string'&&typeof item.namaKantor==='string'&&finite(item.latitude,MERCATOR)&&finite(item.longitude,180)?[item.latitude,item.longitude]:null;

/**
 * entries are ALL original nearby rows, not the filtered list. Markers keep
 * original source indices even when kantorId values repeat. isCurrent must
 * bind the parent's route/session and sourceToken while a load is pending.
 * ready resolves false on retirement/failure; destroy is idempotent.
 */
export function createOfficeMap(container,input,{leaflet,libraryLoader,isCurrent=()=>true,onSelect=()=>{},onClose=()=>{},onCamera=()=>{}}={}){
 if(!container||!active(container)||claims.has(container))throw failure('OFFICE_MAP_CONTAINER_UNAVAILABLE');
 let state=data(input),closed=false,map,base,resize,view=null,baseFailed=false;
 const records=new Map(),listeners=[];
 const owner=container.closest?.('[data-office-map]')??container.parentElement;
 const status=owner?.querySelector?.('.office-map-status');
 const current=()=>!closed&&claims.get(container)===controller&&active(container)&&isCurrent()===true;
 const report=text=>{if(current()&&status)status.textContent=text;};
 const listen=(target,event,handler)=>{target.on(event,handler);listeners.push({target,event,handler});};
 function capture(){
  if(!map)return view&&copyCamera(view);
  // Leaflet throws getCenter() before the first setView on a partial mount.
  try{const center=map.getCenter(),zoom=map.getZoom();
   if(finite(center?.lat,MERCATOR)&&finite(center?.lng,180)&&typeof zoom==='number'&&Number.isFinite(zoom)&&zoom>=0&&zoom<=21)view={center:{lat:center.lat,lng:center.lng},zoom};
  }catch{/* Preserve the last camera while releasing a partial map. */}
  return view&&copyCamera(view);
 }
 function changedCamera(){if(!current())return;const value=capture();if(value)onCamera(value);}
 function owns(record){return current()&&records.get(record.index)===record&&state.entries.some(entry=>entry.index===record.index&&entry.item===record.item);}
 function close(){
  if(!current()||!state.open)return;
  state={...state,open:false};onClose();
 }
 function remove(record){record.keyElement?.removeEventListener('keydown',record.keydown);record.marker.off();record.marker.remove();records.delete(record.index);}
 function render({initial=false,previous=null}={}){
  if(!current()||!map)return;
  const next=new Map(state.entries.map(entry=>[entry.index,entry]));
   for(const record of [...records.values()])if(next.get(record.index)?.item!==record.item)remove(record);
   for(const entry of state.entries){
    if(records.has(entry.index))continue;
    const point=position(entry.item);if(!point)continue;
    const record={...entry,officeId:entry.item.kantorId,marker:null};
    const marker=leaflet.marker(point,{
     icon:leaflet.icon({iconUrl:'/assets/vendor/leaflet/images/marker-icon.png',iconRetinaUrl:'/assets/vendor/leaflet/images/marker-icon-2x.png',shadowUrl:'/assets/vendor/leaflet/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]}),
     keyboard:true,bubblingMouseEvents:false,title:entry.item.namaKantor,alt:entry.item.namaKantor,officeId:entry.item.kantorId,officeIndex:entry.index,
    });record.marker=marker;records.set(entry.index,record);
    // Native marker InfoWindow has no title/snippet. The parent renders the
    // single custom office overlay; binding a Leaflet popup would duplicate it.
    marker.on('click',()=>{if(owns(record))onSelect(record.index);});
    // Modern browser adaptation: Leaflet's legacy keypress/keyCode path does
    // not reliably activate Enter and does not support Space. Cancel keydown
    // so its later keypress cannot produce a second selection.
    const bindKeyboard=()=>{
     if(!owns(record))return;
     const element=marker.getElement();if(record.keyElement===element)return;
     record.keyElement?.removeEventListener('keydown',record.keydown);record.keyElement=element;
     if(!element||element.isConnected===false)return;
     record.keydown=event=>{
      if(event.key!=='Enter'&&event.key!==' '||!owns(record)||record.keyElement!==element||element.isConnected===false||element!==marker.getElement())return;
      event.preventDefault();event.stopPropagation();if(!event.repeat)onSelect(record.index);
     };
     element.addEventListener('keydown',record.keydown);
    };
    // On a fresh map Leaflet delays marker icons until the first setView.
    // Register before addTo so both delayed and already-loaded maps are bound.
    marker.on('add',bindKeyboard);marker.addTo(map);bindKeyboard();
   }
   const selected=records.get(state.selected),selecting=state.open&&selected&&(initial||previous?.selected!==state.selected||previous?.open!==true||previous?.sourceToken!==state.sourceToken);
   if(initial)map.setView(state.camera?[state.camera.center.lat,state.camera.center.lng]:selecting?position(selected.item):[INITIAL.center.lat,INITIAL.center.lng],state.camera?.zoom??(selecting?15:INITIAL.zoom),{animate:false});
   else if(state.camera&&(!previous?.camera||JSON.stringify(state.camera)!==JSON.stringify(previous.camera)))map.setView([state.camera.center.lat,state.camera.center.lng],state.camera.zoom,{animate:false});
   else if(selecting)map.setView(position(selected.item),15,{animate:false});
  const omitted=state.entries.length-records.size;
  report(`${baseFailed?'Peta dasar OpenStreetMap belum dapat dimuat.':'Peta dasar OpenStreetMap.'}${omitted?` ${omitted} kantor memiliki koordinat di luar cakupan peta atau tidak valid.`:''}`);
  changedCamera();
 }
 const controller={
  ready:null,
  update(next){if(!current())return false;const previous=state;state=data(next);render({previous});return true;},
  getCamera(){const value=capture();return value&&copyCamera(value);},
  resize(){if(!current()||!map)return false;map.invalidateSize({animate:false});return true;},
  control(action){
   if(!current()||!map)return false;
   if(action==='close'){close();return true;}
   if(action==='reset'){
    const selected=records.get(state.selected);map.setView(selected?position(selected.item):[INITIAL.center.lat,INITIAL.center.lng],selected?15:INITIAL.zoom,{animate:false});
   }else if(action==='in'||action==='out')map.setZoom(Math.min(21,Math.max(0,map.getZoom()+(action==='in'?1:-1))),{animate:false});
   else if(['left','right','up','down'].includes(action)){
    const size=map.getSize(),dx=Math.max(60,Math.round(size.x*.25)),dy=Math.max(60,Math.round(size.y*.25));map.panBy(action==='left'?[-dx,0]:action==='right'?[dx,0]:action==='up'?[0,-dy]:[0,dy],{animate:false});
   }else return false;
   changedCamera();return true;
  },
  destroy(){
   if(closed)return;capture();closed=true;resize?.disconnect();
   for(const {target,event,handler}of listeners)target.off(event,handler);listeners.length=0;
   for(const record of [...records.values()]){try{remove(record);}catch{/* Partial maps still release their claim. */}}
   try{map?.remove();}catch{/* Detached/partial maps still release ownership. */}
   if(claims.get(container)===controller){claims.delete(container);container.replaceChildren();}
  },
 };
 claims.set(container,controller);report('Memuat peta kantor OpenStreetMap…');
 controller.ready=Promise.resolve().then(async()=>{
  if(!current()){controller.destroy();return false;}
  if(!library(leaflet))leaflet=await libraryLoader?.(container.ownerDocument);
  if(!current()){controller.destroy();return false;}if(!library(leaflet))throw failure('OFFICE_MAP_LIBRARY_UNAVAILABLE');
  map=leaflet.map(container,{crs:leaflet.CRS.EPSG3857,zoomControl:false,attributionControl:true,minZoom:0,maxZoom:21,zoomSnap:0,trackResize:true,zoomAnimation:false,fadeAnimation:false});
  base=leaflet.tileLayer(OSM,{tileSize:256,minZoom:0,maxZoom:21,maxNativeZoom:19,detectRetina:false,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:0,referrerPolicy:'origin',crossOrigin:false,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'});
  listen(base,'tileerror',()=>{if(!current())return;baseFailed=true;report('Peta dasar OpenStreetMap belum dapat dimuat.');});
  listen(map,'click',close);listen(map,'moveend',changedCamera);listen(map,'zoomend',changedCamera);base.addTo(map);
  render({initial:true});if(!current()){controller.destroy();return false;}
  const Resize=container.ownerDocument?.defaultView?.ResizeObserver;
  if(Resize){resize=new Resize(()=>controller.resize());resize.observe(container);}
  return true;
 }).catch(()=>{if(current())report('Peta kantor belum dapat dimuat. Coba buka kembali halaman ini.');controller.destroy();return false;});
 return controller;
}
