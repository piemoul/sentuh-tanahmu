// Server geometry supplies a camera and labels only. Visible boundaries come
// from the official Bhumi raster overlay; this module draws no parcel vectors.
let integration;
if(typeof document!=='undefined'){
  import('./assets/maps/official-map.js').then(module=>{integration=module;module.startOfficialMaps(document);}).catch(()=>{
    for(const node of document.querySelectorAll('.official-map-status'))node.textContent='Peta belum dapat dimuat.';
  });
}
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const invalid=()=>new Error('Koordinat bidang dari layanan belum dapat digunakan untuk membuka peta resmi.');
const boundedArray=(value,min,max)=>{if(!Array.isArray(value)||value.length<min||value.length>max)throw invalid();return value;};

export function prepareParcelCamera(data,{preview=false}={}){
  if(typeof preview!=='boolean'||data?.type!=='FeatureCollection')throw invalid();
  const features=boundedArray(data.features,0,200),crs=data.crs?.properties?.name;
  if(data.crs!=null&&!['EPSG:4326','urn:ogc:def:crs:EPSG::4326','urn:ogc:def:crs:OGC:1.3:CRS84'].includes(crs))throw invalid();
  if(!features.length)return {empty:true,pointCount:0};
  let longitude=0,latitude=0,pointCount=0,south=Infinity,west=Infinity,north=-Infinity,east=-Infinity;
  for(const feature of features){
    if(feature?.type!=='Feature')throw invalid();
    const geometry=feature.geometry;
    if(!['Polygon','MultiPolygon'].includes(geometry?.type))throw invalid();
    const polygons=geometry.type==='Polygon'?[geometry.coordinates]:boundedArray(geometry.coordinates,1,5000);
    for(const polygon of polygons)for(const ring of boundedArray(polygon,1,5000)){
      boundedArray(ring,4,20000);
      for(const point of ring){
        if(++pointCount>20000)throw invalid();
        boundedArray(point,2,20000);
        if(!point.every(value=>typeof value==='number'&&Number.isFinite(value))||Math.abs(point[0])>180||Math.abs(point[1])>90)throw invalid();
        longitude+=point[0];latitude+=point[1];
        south=Math.min(south,point[1]);west=Math.min(west,point[0]);north=Math.max(north,point[1]);east=Math.max(east,point[0]);
      }
      const first=ring[0],last=ring.at(-1);if(first[0]!==last[0]||first[1]!==last[1])throw invalid();
    }
  }
  // Native 771418 averages every vertex, including closing vertices and holes.
  // Preserve that metadata. Bounds separately frame the browser preview and pin.
  return {empty:false,pointCount,center:{lat:latitude/pointCount,lng:longitude/pointCount},zoom:preview?17:18,bounds:[[south,west],[north,east]],crsProvided:data.crs!=null};
}
export function parcelMapView(data,options={}){
  let camera;try{camera=prepareParcelCamera(data,options);}catch{return '<div class="notice notice-warning" role="note">Koordinat bidang dari layanan belum dapat digunakan untuk membuka peta resmi.</div>';}
  if(camera.empty)return '<p class="parcel-map-empty">Tidak ada batas bidang yang dikembalikan layanan.</p>';
  const property=(properties,keys)=>keys.map(key=>properties?.[key]).find(value=>typeof value==='string'||typeof value==='number'&&Number.isFinite(value));
  const controls=[['in','Perbesar','+'],['out','Perkecil','−'],['left','Geser ke kiri','←'],['up','Geser ke atas','↑'],['down','Geser ke bawah','↓'],['right','Geser ke kanan','→'],['fit','Kembali ke lokasi bidang','Atur ulang']];
  const cameraJson=escapeHtml(JSON.stringify({center:camera.center,zoom:camera.zoom,bounds:camera.bounds}));
  return `<section class="parcel-map" data-official-map aria-label="Batas bidang dari layanan"><h3>Batas Bidang Tanah</h3><p class="parcel-map-note">OpenStreetMap dengan layer bidang resmi Bhumi. Pin menandai titik acuan tampilan dari data bidang.${camera.crsProvided?'':' Server tidak mencantumkan datum koordinat.'}</p><div class="parcel-map-controls" role="group" aria-label="Kendali peta resmi">${controls.map(([action,label,text])=>`<button type="button" class="button secondary small" data-action="parcel-map" data-map-action="${action}" aria-label="${label}" disabled>${text}</button>`).join('')}<button type="button" class="button secondary small" data-action="parcel-map" data-map-action="toggle-boundary" aria-pressed="true" disabled>Sembunyikan batas</button></div><p class="official-map-status" role="status">Memuat konfigurasi peta…</p><div class="official-map-canvas" role="region" aria-label="Peta OpenStreetMap dan bidang Bhumi" hidden></div><template data-official-camera>${cameraJson}</template><div class="parcel-map-caption"><span>↑ Utara</span><span class="parcel-map-zoom" aria-live="polite">Zoom ${camera.zoom}</span></div><div class="parcel-map-properties">${data.features.map((feature,index)=>`<article><h4>Bidang ${index+1}</h4><dl class="service-facts">${[['NIB',property(feature.properties,['NIB'])],['Jenis hak',property(feature.properties,['tipehak','TIPEHAK','TipeHak'])],['Luas',property(feature.properties,['LUAS'])]].filter(([,value])=>value!==undefined).map(([label,value])=>`<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></article>`).join('')}</div></section>`;
}
export function updateParcelMap(button){return integration?.controlOfficialMap(button)??false;}
