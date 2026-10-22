// Dedicated interactive point map. Dependencies/mounting are explicit; no fetch,
// document observer, geolocation, identity, polygon or submission is performed.
import {validateOfficialMapConfig} from '../maps/official-map.js';
import {SWAPLOTTING_INITIAL_CAMERA,swaplottingCamera,swaplottingPointText} from './model.js';
const OSM='https://tile.openstreetmap.org/{z}/{x}/{y}.png',BHUMI='/api/maps/bhumi/{z}/{x}/{y}.png',LIMIT=85.0511287798066;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const claimed=new WeakMap();
export function swaplottingBhumiTileUrl({z,x,y}={}){if(!Number.isInteger(z)||z<0||z>21||!Number.isSafeInteger(x)||!Number.isSafeInteger(y))return null;const width=2**z;if(y<0||y>=width)return null;return `/api/maps/bhumi/${z}/${((x%width)+width)%width}/${y}.png`;}
export function swaplottingPointMapView(model){
 const controls=[['in','Perbesar','+'],['out','Perkecil','−'],['left','Geser ke kiri','←'],['up','Geser ke atas','↑'],['down','Geser ke bawah','↓'],['right','Geser ke kanan','→'],['reset','Atur ulang tampilan','Atur ulang'],['toggle-overlay','Tampilkan/sembunyikan Bhumi','Bhumi']];
 return `<section class="swaplotting-point-map" data-swaplotting-map><h2>Tentukan titik pada peta</h2><p>Geser peta untuk memilih titik tengah. OpenStreetMap dengan layer resmi Bhumi adalah adaptasi tampilan browser.</p><p data-swaplotting-point>${esc(swaplottingPointText(model))}</p><div class="swaplotting-map-controls" role="group" aria-label="Kendali titik peta">${controls.map(([control,label,text])=>`<button type="button" class="button secondary small" data-action="swaplotting-map-control" data-control="${control}" aria-label="${label}" disabled>${text}</button>`).join('')}</div><p data-swaplotting-map-status role="status">Peta belum dibuka.</p><div class="swaplotting-map-canvas" data-swaplotting-map-canvas role="region" aria-label="Titik peta OpenStreetMap dan layer Bhumi"></div><p class="form-hint">Titik peta dan batas raster bukan bukti kunjungan, pemilikan, atau hasil pengukuran.</p></section>`;
}
export function createSwaplottingMap(container,camera,{leaflet,config,isCurrent=()=>true,onCameraChanged=()=>{},onStatus=()=>{}}={}){
 if(!container||container.isConnected===false||claimed.has(container))throw new Error('SWAPLOTTING_MAP_CONTAINER');
 validateOfficialMapConfig(config);const initial=swaplottingCamera(camera,{zoomRequired:true});if(Math.abs(initial.lat)>LIMIT)throw new Error('SWAPLOTTING_MAP_MERCATOR');
 if(!leaflet?.CRS?.EPSG3857||!['map','tileLayer','marker','icon'].every(key=>typeof leaflet[key]==='function'))throw new Error('SWAPLOTTING_MAP_LIBRARY');
 let map,base,overlay,marker,resize,closed=false,visible=true,baseFailed=false,overlayFailed=false,currentCamera={...initial},engineAnchor=null,commanding=false;const listeners=[];
 const current=()=>!closed&&container.isConnected!==false&&isCurrent();
 const listen=(target,event,fn)=>{target.on(event,fn);listeners.push({target,event,fn});};
 const report=()=>{if(!current())return;onStatus(`${baseFailed?'Peta dasar OpenStreetMap belum dapat dimuat.':'Peta dasar OpenStreetMap.'} ${!visible?'Layer Bhumi disembunyikan.':overlayFailed?'Layer Bhumi belum dapat dimuat.':'Layer Bhumi diminta untuk area peta.'}`);};
 const controls=enabled=>{for(const button of container.closest?.('[data-swaplotting-map]')?.querySelectorAll?.('[data-action="swaplotting-map-control"]')??[])button.disabled=!enabled;};
 const sameCenter=(a,b)=>!!a&&!!b&&Object.is(a.lat,b.lat)&&Object.is(a.lng,b.lng);
 const sameView=(a,b)=>sameCenter(a,b)&&Object.is(a.zoom,b.zoom);
 const engineView=()=>{
  const center=map.getCenter(),zoom=map.getZoom();
  if(typeof center?.lng!=='number'||!Number.isFinite(center.lng))throw new Error('SWAPLOTTING_MAP_ENGINE');
  const lng=center.lng>=-180&&center.lng<=180?center.lng:((center.lng+180)%360+360)%360-180;
  const camera=swaplottingCamera({lat:center.lat,lng,zoom},{zoomRequired:true});if(Math.abs(camera.lat)>LIMIT)throw new Error('SWAPLOTTING_MAP_MERCATOR');
  return {camera,raw:{lat:center.lat,lng:center.lng}};
 };
 const changed=()=>{
  if(!current()||commanding)return;
  try{
   const next=engineView().camera;if(sameView(next,engineAnchor))return;
   // Exact command values (including -0) stay separate from projected/rounded
   // engine anchors. Duplicate echoes never become a new measured/map target.
   const zoomOnly=sameCenter(next,engineAnchor),camera=zoomOnly?{...currentCamera,zoom:next.zoom}:next;
   marker.setLatLng([camera.lat,camera.lng]);if(!current())return;
   currentCamera=camera;engineAnchor=next;onCameraChanged({...camera},{eventKind:zoomOnly?'zoom':'pan'});
  }catch{if(current())onStatus('Titik tengah peta belum dapat digunakan.');}
 };
 const failure=code=>({ok:false,code:`SWAPLOTTING_MAP_${code}`});
 const command=(run,select,before)=>{
  if(!current())return failure('INACTIVE');if(commanding)return failure('BUSY');
  const previous={...currentCamera},anchor=engineAnchor&&{...engineAnchor};
  try{before??=engineView();}catch{return failure('ENGINE');}
  commanding=true;
  try{
   run();if(!current())throw new Error('retired');
   const next=engineView().camera,camera=select(next);
   marker.setLatLng([camera.lat,camera.lng]);if(!current())throw new Error('retired');
   currentCamera={...camera};engineAnchor={...next};return {ok:true,camera:{...camera}};
  }catch{
   // A failed engine call can already have moved its viewport. Restore both
   // visual resources while callbacks are muted; close an un-restorable map.
   if(!current()){controller.destroy();return failure('INACTIVE');}
   try{
    map.setView([before.raw.lat,before.raw.lng],before.camera.zoom,{animate:false});
    if(!current()||!sameView(engineView().camera,before.camera))throw new Error('rollback');
    marker.setLatLng([previous.lat,previous.lng]);if(!current())throw new Error('retired');
    currentCamera=previous;engineAnchor=anchor;return failure('APPLY_FAILED');
   }catch{controller.destroy();return failure('UNUSABLE');}
  }finally{commanding=false;}
 };
 const controller={
  snapshot:()=>({camera:{...currentCamera},overlayVisible:visible,closed}),
  applyCenter(value){
   if(!current())return failure('INACTIVE');if(commanding)return failure('BUSY');
   let target,before;
   try{target=swaplottingCamera(value);}catch{return failure('INVALID');}
   if(Math.abs(target.lat)>LIMIT)return failure('MERCATOR');
   try{before=engineView();target=swaplottingCamera({...target,zoom:target.zoom??before.camera.zoom},{zoomRequired:true});}catch{return failure('ENGINE');}
   // No callback is emitted here. The host commits its source/provenance only
   // after this synchronous success and its own session/route checks.
   return command(()=>map.setView([target.lat,target.lng],target.zoom,{animate:false}),()=>target,before);
  },
  control(action){
   if(!current()||commanding)return false;
   if(action==='toggle-overlay'){if(visible)map.removeLayer(overlay);else overlay.addTo(map);visible=!visible;report();return true;}
   let result,kind;
   if(action==='in'||action==='out'){
    const previous={...currentCamera};kind='zoom';
    result=command(()=>map.setZoom(Math.max(0,Math.min(21,map.getZoom()+(action==='in'?1:-1))),{animate:false}),next=>({...previous,zoom:next.zoom}));
   }else if(action==='reset'||action==='fit'){
    kind='reset';result=command(()=>map.setView([SWAPLOTTING_INITIAL_CAMERA.lat,SWAPLOTTING_INITIAL_CAMERA.lng],SWAPLOTTING_INITIAL_CAMERA.zoom,{animate:false}),next=>next);
   }else if(['left','right','up','down'].includes(action)){
    kind='pan';result=command(()=>{const size=map.getSize(),dx=Math.max(60,Math.round(size.x*.25)),dy=Math.max(60,Math.round(size.y*.25));map.panBy(action==='left'?[-dx,0]:action==='right'?[dx,0]:action==='up'?[0,-dy]:[0,dy],{animate:false});},next=>next);
   }else return false;
   if(result.ok&&current())onCameraChanged({...result.camera},{eventKind:kind});return result.ok;
  },
  destroy(){if(closed)return;closed=true;resize?.disconnect();for(const {target,event,fn}of listeners)target.off(event,fn);listeners.length=0;marker?.unbindTooltip?.();marker?.off?.();try{map?.remove();}catch{}container.replaceChildren?.();if(claimed.get(container)===controller)claimed.delete(container);controls(false);},
 };
 try{
  map=leaflet.map(container,{crs:leaflet.CRS.EPSG3857,zoomControl:false,attributionControl:true,minZoom:0,maxZoom:21,zoomSnap:0,zoomDelta:1,trackResize:true,zoomAnimation:false,fadeAnimation:false,worldCopyJump:true});
  const common={tileSize:256,minZoom:0,maxZoom:21,detectRetina:false,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:0,referrerPolicy:'origin',crossOrigin:false};
  base=leaflet.tileLayer(OSM,{...common,maxNativeZoom:19,zIndex:1,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'});
  overlay=leaflet.tileLayer(BHUMI,{...common,zIndex:2,opacity:1,attribution:'<a href="https://bhumi.atrbpn.go.id/" target="_blank" rel="noopener noreferrer">Bhumi ATR/BPN</a>'});
  overlay.getTileUrl=coordinate=>current()?swaplottingBhumiTileUrl(coordinate):null;
  const original=overlay.createTile.bind(overlay);overlay.createTile=(coordinate,done)=>{if(overlay.getTileUrl(coordinate)!==null)return original(coordinate,done);const image=container.ownerDocument.createElement('img');image.alt='';queueMicrotask(()=>done?.(null,image));return image;};
  listen(base,'tileerror',()=>{baseFailed=true;report();});listen(overlay,'tileerror',()=>{overlayFailed=true;report();});
  base.addTo(map);overlay.addTo(map);
  marker=leaflet.marker([initial.lat,initial.lng],{icon:leaflet.icon({iconUrl:'/assets/vendor/leaflet/images/marker-icon.png',iconRetinaUrl:'/assets/vendor/leaflet/images/marker-icon-2x.png',shadowUrl:'/assets/vendor/leaflet/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],tooltipAnchor:[16,-28],shadowSize:[41,41]}),keyboard:true,alt:'Titik tengah peta',title:'Titik tengah peta'}).bindTooltip('Titik tengah peta');marker.addTo(map);
  // Initial viewport is not itself a received device fix or measured position.
  map.setView([initial.lat,initial.lng],initial.zoom,{animate:false});engineAnchor=engineView().camera;listen(map,'moveend',changed);listen(map,'zoomend',changed);
  // Leaflet clears _lastCenter during invalidateSize and can reproject its
  // center by a few bits even without a pan. Wrap the instance so both our
  // ResizeObserver and Leaflet's window/RAF/debounced path retain the selected
  // target. Keep every native argument and Leaflet's chainable return value.
  const invalidateSize=map.invalidateSize;
  map.invalidateSize=function(...args){
   if(!current()||commanding)return map;
   const previous={...currentCamera},result=command(()=>invalidateSize.apply(map,args),next=>({...previous,zoom:next.zoom}));
   if(!result.ok&&container.isConnected!==false&&isCurrent())onStatus(result.code==='SWAPLOTTING_MAP_UNUSABLE'?'Peta perlu dimuat ulang setelah perubahan ukuran.':'Ukuran peta belum dapat diperbarui; titik sebelumnya dipertahankan.');
   return map;
  };
  const Resize=container.ownerDocument?.defaultView?.ResizeObserver;if(Resize){resize=new Resize(()=>{if(current())map.invalidateSize({animate:false});});resize.observe(container);}
  claimed.set(container,controller);controls(true);report();return controller;
 }catch(error){controller.destroy();throw error;}
}
