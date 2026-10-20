// Compatibility name: official refers to the Bhumi overlay, not the OSM base.
const SELECTOR='.parcel-map[data-official-map]';
const WMS_TEMPLATE='/api/maps/bhumi/{z}/{x}/{y}.png';
const OSM_TEMPLATE='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const managers=new WeakMap(),owners=new WeakMap(),claims=new WeakMap(),canvases=new WeakMap(),libraries=new WeakMap();
const failure=code=>Object.assign(new Error('Peta belum dapat dimuat.'),{code});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=(value,bound)=>typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=bound;
function cameraData(value){
  if(!object(value)||!object(value.center)||!finite(value.center.lat,90)||!finite(value.center.lng,180)||!Number.isInteger(value.zoom)||value.zoom<0||value.zoom>21)throw failure('OFFICIAL_MAP_CAMERA_INVALID');
  if(Math.abs(value.center.lat)>85.0511287798066)throw failure('OFFICIAL_MAP_MERCATOR_LATITUDE');
  const camera={center:{lat:value.center.lat,lng:value.center.lng},zoom:value.zoom};
  if(Object.hasOwn(value,'bounds')&&value.bounds!==undefined){
    const bounds=value.bounds;
    if(!Array.isArray(bounds)||bounds.length!==2||![bounds[0],bounds[1]].every(point=>Array.isArray(point)&&point.length===2&&finite(point[0],90)&&finite(point[1],180))
      ||bounds[0][0]>bounds[1][0]||bounds[0][1]>bounds[1][1])throw failure('OFFICIAL_MAP_CAMERA_INVALID');
    if(bounds.some(point=>Math.abs(point[0])>85.0511287798066))throw failure('OFFICIAL_MAP_MERCATOR_LATITUDE');
    camera.bounds=bounds.map(point=>[...point]);
  }
  return camera;
}
export function validateOfficialMapConfig(value){
  if(!object(value)||value.provider!=='openstreetmap'||value.mapType!=='standard'||value.wmsTileTemplate!==WMS_TEMPLATE)throw failure('OFFICIAL_MAP_CONFIG_INVALID');
  return {provider:'openstreetmap',mapType:'standard',wmsTileTemplate:WMS_TEMPLATE};
}
function active(owner){if(!owner||owner.isConnected===false||owner.closest?.('[hidden]'))return false;const dialog=owner.closest?.('dialog');return !dialog||dialog.open;}
function status(owner,text){const node=owner?.querySelector?.('.official-map-status');if(node)node.textContent=text;}
function controls(owner,enabled,visible=true){
  for(const button of owner?.querySelectorAll?.('[data-map-action]')??[]){
    button.disabled=!enabled;
    if(button.dataset.mapAction==='toggle-boundary'){button.setAttribute('aria-pressed',String(visible));button.textContent=visible?'Sembunyikan batas':'Tampilkan batas';}
  }
}
function hasLibrary(leaflet){return leaflet&&['map','tileLayer','marker','icon'].every(name=>typeof leaflet[name]==='function')&&leaflet.CRS?.EPSG3857;}

export function createOfficialMap(container,input,{leaflet,config:rawConfig}={}){
  const owner=container?.closest?.(SELECTOR);
  if(!container||container.isConnected===false||canvases.has(container)||owner&&(!active(owner)||owners.has(owner)))throw failure('OFFICIAL_MAP_CONTAINER_UNAVAILABLE');
  const camera=cameraData(input);validateOfficialMapConfig(rawConfig);
  if(!hasLibrary(leaflet))throw failure('OFFICIAL_MAP_LIBRARY_UNAVAILABLE');
  let map,base,overlay,marker,resize,closed=false,visible=true,baseFailed=false,overlayFailed=false;
  const referencePoint=camera.bounds?[(camera.bounds[0][0]+camera.bounds[1][0])/2,(camera.bounds[0][1]+camera.bounds[1][1])/2]:[camera.center.lat,camera.center.lng];
  const resetView=()=>{
    if(camera.bounds)map.fitBounds(camera.bounds,{padding:[36,36],maxZoom:20,animate:false});
    else map.setView([camera.center.lat,camera.center.lng],camera.zoom,{animate:false});
  };
  const listeners=[];
  const listen=(target,event,handler)=>{target.on(event,handler);listeners.push({target,event,handler});};
  const report=()=>{
    if(closed)return;
    const baseMessage=baseFailed?'Peta dasar OpenStreetMap belum dapat dimuat.':'Peta dasar OpenStreetMap.';
    const overlayMessage=!visible?'Layer bidang Bhumi disembunyikan.':overlayFailed?'Layer bidang Bhumi belum dapat dimuat.':'Layer bidang Bhumi diminta untuk area peta.';
    status(owner,`${baseMessage} ${overlayMessage}`);
  };
  const zoom=()=>{const node=owner?.querySelector?.('.parcel-map-zoom');if(node&&!closed)node.textContent=`Zoom ${map.getZoom()}`;};
  const controller={
    control(action){
      if(closed||!active(owner??container))return false;
      if(action==='in')map.setZoom(Math.min(21,map.getZoom()+1),{animate:false});
      else if(action==='out')map.setZoom(Math.max(0,map.getZoom()-1),{animate:false});
      else if(action==='fit')resetView();
      else if(action==='toggle-boundary'){
        if(visible)map.removeLayer(overlay);else overlay.addTo(map);
        visible=!visible;controls(owner,true,visible);report();
      }else if(['left','right','up','down'].includes(action)){
        const size=map.getSize(),dx=Math.max(60,Math.round(size.x*.25)),dy=Math.max(60,Math.round(size.y*.25));
        map.panBy(action==='left'?[-dx,0]:action==='right'?[dx,0]:action==='up'?[0,-dy]:[0,dy],{animate:false});
      }else return false;
      zoom();return true;
    },
    destroy(){
      if(closed)return;closed=true;resize?.disconnect();
      for(const {target,event,handler}of listeners)target.off(event,handler);listeners.length=0;
      marker?.unbindTooltip();marker?.off();
      try{map?.remove();}catch{/* Detached/partial maps still release ownership. */}
      container.replaceChildren();canvases.delete(container);if(owners.get(owner)===controller)owners.delete(owner);controls(owner,false);
    },
  };
  try{
    map=leaflet.map(container,{crs:leaflet.CRS.EPSG3857,zoomControl:false,attributionControl:true,minZoom:0,maxZoom:21,trackResize:true,zoomAnimation:false,fadeAnimation:false});
    const common={tileSize:256,minZoom:0,maxZoom:21,detectRetina:false,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:0,referrerPolicy:'origin',crossOrigin:false};
    base=leaflet.tileLayer(OSM_TEMPLATE,{...common,maxNativeZoom:19,zIndex:1,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'});
    overlay=leaflet.tileLayer(WMS_TEMPLATE,{...common,zIndex:2,opacity:1,attribution:'<a href="https://bhumi.atrbpn.go.id/" target="_blank" rel="noopener noreferrer">Bhumi ATR/BPN</a>'});
    // The browser never supplies an upstream URL, token, authkey or parcel ID.
    // Leaflet wraps world X; this second guard also bounds direct tile calls.
    overlay.getTileUrl=coordinate=>{
      const {x,y,z}=coordinate??{};
      if(closed||!Number.isInteger(z)||z<0||z>21||!Number.isSafeInteger(x)||!Number.isSafeInteger(y))return null;
      const size=2**z;if(y<0||y>=size)return null;
      return `/api/maps/bhumi/${z}/${((x%size)+size)%size}/${y}.png`;
    };
    const originalCreateTile=overlay.createTile.bind(overlay);
    overlay.createTile=(coordinate,done)=>{
      if(overlay.getTileUrl(coordinate)!==null)return originalCreateTile(coordinate,done);
      const image=container.ownerDocument.createElement('img');image.alt='';
      queueMicrotask(()=>done?.(null,image));return image;
    };
    listen(base,'tileerror',()=>{baseFailed=true;report();});
    listen(overlay,'tileerror',()=>{overlayFailed=true;report();});
    // Keep warnings until remount: load/tilesloaded alone is not an HTTP result.
    listen(map,'zoomend',zoom);base.addTo(map);overlay.addTo(map);
    marker=leaflet.marker(referencePoint,{
      icon:leaflet.icon({iconUrl:'/assets/vendor/leaflet/images/marker-icon.png',iconRetinaUrl:'/assets/vendor/leaflet/images/marker-icon-2x.png',shadowUrl:'/assets/vendor/leaflet/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41],tooltipAnchor:[16,-28],shadowSize:[41,41]}),
      keyboard:true,alt:'Titik acuan bidang',title:'Titik acuan bidang',
    }).bindTooltip('Titik acuan bidang');
    marker.addTo(map);resetView();
    const Resize=container.ownerDocument?.defaultView?.ResizeObserver;
    if(Resize){resize=new Resize(()=>{if(!closed&&active(owner??container)){map.invalidateSize({animate:false});if(camera.bounds)resetView();}});resize.observe(container);}
    canvases.set(container,controller);if(owner)owners.set(owner,controller);controls(owner,true);zoom();report();return controller;
  }catch{controller.destroy();throw failure('OFFICIAL_MAP_LIBRARY_UNAVAILABLE');}
}

async function fetchConfig(document,signal){
  const request=document.defaultView?.fetch?.bind(document.defaultView)??globalThis.fetch;
  if(typeof request!=='function')throw failure('OFFICIAL_MAP_CONFIG_UNAVAILABLE');
  const response=await request('/api/maps/config',{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal});
  if(response.status!==200||response.redirected)throw failure('OFFICIAL_MAP_CONFIG_UNAVAILABLE');
  return response.json();
}
function loadLeaflet(document){
  const prior=libraries.get(document);if(prior)return prior;
  if(hasLibrary(document.defaultView?.L)){const ready=Promise.resolve(document.defaultView.L);libraries.set(document,ready);return ready;}
  const promise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');let done=false,timer;
    const finish=ok=>{
      if(done)return;done=true;clearTimeout(timer);script.onload=script.onerror=null;
      if(ok&&hasLibrary(document.defaultView?.L))resolve(document.defaultView.L);
      else{script.remove();reject(failure('OFFICIAL_MAP_LIBRARY_UNAVAILABLE'));}
    };
    script.onload=()=>finish(true);script.onerror=()=>finish(false);script.async=true;script.referrerPolicy='origin';
    script.nonce=document.querySelector('script[nonce]')?.nonce??'';script.src='/assets/vendor/leaflet/leaflet.js';
    timer=setTimeout(()=>finish(false),20000);timer.unref?.();document.head.append(script);
  });
  libraries.set(document,promise);void promise.catch(()=>{if(libraries.get(document)===promise)libraries.delete(document);});return promise;
}

export function startOfficialMaps(root=globalThis.document,{configLoader,libraryLoader}={}){
  if(!root?.querySelectorAll)throw failure('OFFICIAL_MAP_CONTAINER_UNAVAILABLE');
  if(managers.has(root))return managers.get(root);
  const document=root.ownerDocument??root,records=new Map(),abort=new AbortController();let stopped=false,configuration,library;
  const within=owner=>active(owner)&&(owner===root||root.contains?.(owner));
  const same=record=>within(record.owner)&&record.owner.querySelector('.official-map-canvas')===record.canvas
    &&record.owner.querySelector('template[data-official-camera]')===record.template&&record.template.content.textContent===record.text;
  const remove=record=>{record.instance?.destroy();record.canvas.hidden=true;controls(record.owner,false);if(claims.get(record.owner)===record)claims.delete(record.owner);records.delete(record.owner);};
  const current=record=>!stopped&&records.get(record.owner)===record&&same(record);
  const mount=async record=>{
    status(record.owner,'Memuat peta OpenStreetMap dan Bhumi…');
    try{
      const camera=cameraData(JSON.parse(record.text));
      configuration??=Promise.resolve().then(()=>configLoader?configLoader({signal:abort.signal}):fetchConfig(document,abort.signal)).then(validateOfficialMapConfig).catch(error=>{configuration=undefined;throw error;});
      const config=await configuration;if(!current(record))return;
      library??=Promise.resolve().then(()=>libraryLoader?libraryLoader(config):loadLeaflet(document)).catch(error=>{library=undefined;throw error;});
      const leaflet=await library;if(!current(record))return;
      record.canvas.hidden=false;record.instance=createOfficialMap(record.canvas,camera,{leaflet,config});
    }catch(error){
      if(!current(record))return;record.instance?.destroy();record.canvas.hidden=true;controls(record.owner,false);
      status(record.owner,error?.code==='OFFICIAL_MAP_MERCATOR_LATITUDE'?'Koordinat di luar cakupan peta Mercator.':'Peta belum dapat dimuat. Periksa konfigurasi dan koneksi peta.');
    }
  };
  const refresh=()=>{
    if(stopped)return;
    for(const record of records.values())if(!same(record))remove(record);
    for(const owner of [...(root.matches?.(SELECTOR)?[root]:[]),...root.querySelectorAll(SELECTOR)]){
      if(!within(owner)||records.has(owner)||claims.has(owner)||owners.has(owner))continue;
      const canvas=owner.querySelector('.official-map-canvas'),template=owner.querySelector('template[data-official-camera]');
      if(!canvas||!template?.content)continue;
      const record={owner,canvas,template,text:template.content.textContent,instance:null};records.set(owner,record);claims.set(owner,record);controls(owner,false);void mount(record);
    }
  };
  const Observer=document.defaultView?.MutationObserver??globalThis.MutationObserver,observer=Observer?new Observer(refresh):null;
  const manager={refresh,destroy(){if(stopped)return;stopped=true;abort.abort();observer?.disconnect();for(const record of [...records.values()])remove(record);managers.delete(root);}};
  managers.set(root,manager);observer?.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['open','hidden']});refresh();return manager;
}
export function controlOfficialMap(button){if(!button||button.disabled)return false;return owners.get(button.closest?.(SELECTOR))?.control(button.dataset?.mapAction)??false;}
