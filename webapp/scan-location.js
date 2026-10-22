// Read-only location destinations from the native Scan viewer.
// PBT pushes its special destination, then the generic map without awaiting it.
// The browser keeps both panes and initially presents the generic foreground.
const routes=Object.freeze({
  pbt:{id:'post-apis-getpbteldetail-d3d134',endpoint:'apis/GetPBTElDetail',method:'POST',title:'PBT Elektronik'},
  kkpr:{id:'post-apis-getkkprdetail-d311e8',endpoint:'apis/GetKKPRDetail',method:'POST',title:'Lokasi Kegiatan'},
  generic:{id:'get-apis-getgeojsoninfo-d39f1c',endpoint:'/apis/getGeoJsonInfo',method:'GET',title:'Lokasi Bidang'},
});
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const failure='Lokasi dokumen belum dapat dimuat. Silakan coba lagi.';
export function scanLocationPlan(type){return type==='PetaBidangElektronik'?['pbt','generic']:type==='KKPR'?['kkpr']:['generic'];}

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapFailure=()=>{throw Object.assign(new Error('Data peta dokumen belum sesuai format layanan.'),{code:'SCAN_MAP_UNRECOGNIZED'});};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const wrap=value=>value>=-180&&value<180?value:((value+180)%360+360)%360-180;
function nativePoint(vertex){
  // The native LatLng constructor clamps latitude and wraps longitude.
  // Finite/array/size checks additionally bound JSON work in the browser.
  if(!Array.isArray(vertex)||vertex.length<2||![vertex[0],vertex[1]].every(value=>typeof value==='number'&&Number.isFinite(value)))mapFailure();
  return{lat:Math.max(-90,Math.min(90,vertex[1])),lng:wrap(vertex[0])};
}
function nativeRing(ring,budget){
  if(!Array.isArray(ring))mapFailure();
  let lat=0,lng=0;
  for(const vertex of ring){if(++budget.points>20000)mapFailure();nativePoint(vertex);lat+=vertex[1];lng+=vertex[0];}
  // 77783c/840 sum raw ordinates. Normalize the mean, not each summand.
  return ring.length?nativePoint([lng/ring.length,lat/ring.length]):null;
}
export function scanSpecialMapData(response){
  if(response?.status!==200||!object(response.data)||response.data.error!==false||!object(response.data.data))throw Object.assign(new Error('Layanan belum mengembalikan detail peta dokumen.'),{code:'SCAN_MAP_UNAVAILABLE'});
  return response.data.data;
}
export function scanPbtDetails(response){const data=scanSpecialMapData(response),rows=data.daftarBidangTanah??[];if(!Array.isArray(rows)||rows.length>2000||!rows.every(object))mapFailure();return{data,rows};}
// PBT model parser is private. This projection preserves original row slots,
// last nonempty ring means and index0-only initial camera from rGb/7771e8.
export function scanPbtMapModel(response){
  const {data,rows}=scanPbtDetails(response);
  const budget={points:0},centers=[],initial={center:{lat:-6.2,lng:106.816666},zoom:19};
  for(const [index,row]of rows.entries()){
    if(!object(row))mapFailure();
    const geometry=row.batas?.geometri;let center=null;
    if(geometry?.type==='MultiPolygon'&&geometry.coordinates!=null){
      if(!Array.isArray(geometry.coordinates))mapFailure();
      for(const polygon of geometry.coordinates){
        if(!Array.isArray(polygon))mapFailure();
        for(const ring of polygon){const next=nativeRing(ring,budget);if(next){center=next;if(index===0)initial.center={...next};}}
      }
    }
    centers.push(center);
  }
  return{data,rows,centers,initial,pointCount:budget.points};
}
export function scanPbtRows(model,query){
  // Native String trim 447974 includes U+0085, unlike JS String.trim.
  const text=typeof query==='string'?query.replace(/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g,'').toLowerCase():'';
  return model.rows.filter(row=>!text||(row.nib??'').toLowerCase().includes(text)).map(row=>({row,index:model.rows.findIndex(candidate=>(candidate.batas?.id??null)===(row.batas?.id??null))}));
}
const doubleText=value=>Object.is(value,-0)?'-0.0':/[.e]/.test(String(value))?String(value):String(value)+'.0';
export function scanPbtDirectionsUrl(model,index){const point=Number.isInteger(index)&&index>=0?model.centers[index]:null;return point?`https://www.google.com/maps/search/?api=1&query=${doubleText(point.lat)},${doubleText(point.lng)}`:null;}
export function scanPbtPanelView(model,{query='',selected=0}={}){
  const entries=scanPbtRows(model,query);
  return `<section class="scan-pbt-panel"><h3>PBT Elektronik No. ${esc(model.data.nomor??'-')}</h3><p class="scan-pbt-office">${esc(model.data.kantor??'-')}</p><p class="scan-pbt-count">${model.rows.length} Bidang</p><label class="parameter-field"><span>Cari NIB</span><input type="search" data-scan-pbt-search value="${esc(query)}" autocomplete="off"></label><div class="scan-pbt-rows">${entries.length?entries.map(({row,index})=>`<button type="button" class="scan-pbt-row${index===selected?' selected':''}" data-action="scan-pbt-select" data-source-index="${index}" aria-pressed="${index===selected}"><span class="scan-pbt-index">${index+1}</span><span><strong>${esc(row.nib??'-')}</strong>${row.lokasi!=null?`<span>${esc(row.lokasi)}</span>`:''}<span>Luas ${esc(row.luas??'-')} m² | No. Berkas ${esc(row.noBerkas??'-')}</span></span></button>`).join(''):`<p class="parcel-map-empty">${typeof query==='string'&&query.length?'NIB tidak ditemukan.':'Tidak ada data bidang.'}</p>`}</div></section>`;
}
export function scanSpecialMapView(camera,{title='Lokasi Bidang'}={}){
  const controls=[['in','Perbesar','+'],['out','Perkecil','−'],['left','Geser ke kiri','←'],['up','Geser ke atas','↑'],['down','Geser ke bawah','↓'],['right','Geser ke kanan','→'],['fit','Kembali ke tampilan awal','Atur ulang']];
  return `<section class="parcel-map" data-official-map aria-label="${esc(title)}"><p class="parcel-map-note">OpenStreetMap dengan layer bidang resmi Bhumi. Pin adalah titik acuan dari data dokumen.</p><div class="parcel-map-controls" role="group" aria-label="Kendali peta">${controls.map(([action,label,text])=>`<button type="button" class="button secondary small" data-action="parcel-map" data-map-action="${action}" aria-label="${label}" disabled>${text}</button>`).join('')}<button type="button" class="button secondary small" data-action="parcel-map" data-map-action="toggle-boundary" aria-pressed="true" disabled>Sembunyikan batas</button></div><p class="official-map-status" role="status">Memuat konfigurasi peta…</p><div class="official-map-canvas" role="region" aria-label="${esc(title)}" hidden></div><template data-official-camera>${esc(JSON.stringify(camera))}</template><div class="parcel-map-caption"><span>↑ Utara</span><span class="parcel-map-zoom" aria-live="polite">Zoom ${esc(camera.zoom)}</span></div></section>`;
}

export function createScanLocationController({api,getOperations,isCurrent,onChange=()=>{},onAuthError=()=>{},validate=()=>{},record=()=>{}}){
  for(const fn of [api,getOperations,isCurrent,validate])if(typeof fn!=='function')throw new TypeError('Host lokasi Scan belum lengkap.');
  let owner=null;
  const current=item=>owner===item&&isCurrent(item.context);
  function snapshot(){return owner?{active:owner.active,branches:owner.branches.map(branch=>({...branch})),loading:owner.branches.some(branch=>branch.stage==='loading')}:null;}
  const changed=item=>{if(current(item))onChange(snapshot());};
  function operation(kind){const spec=routes[kind];return getOperations().find(op=>op.id===spec.id&&op.endpoint===spec.endpoint&&op.method===spec.method&&op.effect==='read'&&op.auth==='session'&&op.serviceId==='main'&&op.enabled===true);}
  async function load(item,branch){
    const op=operation(branch.kind);
    if(!op){branch.stage='error';branch.error='Pembacaan lokasi ini belum tersedia.';changed(item);return false;}
    try{
      // Calling api starts each branch before open awaits either result.
      const reply=await api('/api/execute',{method:'POST',body:{operationId:op.id,values:{q:item.q},scanContextId:item.scanContextId}});
      if(!current(item))return false;
      validate(branch.kind,reply?.result);
      branch.response=reply.result;branch.stage='ready';
      record(routes[branch.kind].title,'success',`HTTP ${reply.result.status} · Respons diterima`);
      changed(item);return true;
    }catch(error){
      if(!current(item))return false;
      if(authCodes.has(error?.code)){owner=null;onAuthError(error,item.context);return false;}
      branch.stage='error';branch.error=typeof error?.code==='string'&&typeof error.message==='string'?error.message:failure;
      record(routes[branch.kind].title,'error',`${typeof error?.code==='string'?error.code:'ERROR'} · Pembacaan belum berhasil`);
      changed(item);return false;
    }
  }
  async function open({type,q,scanContextId},context){
    if(typeof q!=='string'||typeof scanContextId!=='string'||!scanContextId.length||scanContextId.length>256||!isCurrent(context))return false;
    const plan=scanLocationPlan(type),item={context,q,scanContextId,active:plan.at(-1),branches:plan.map(kind=>({kind,title:routes[kind].title,stage:'loading',error:null,response:null}))};
    owner=item;changed(item);
    const results=await Promise.all(item.branches.map(branch=>load(item,branch)));
    return current(item)&&results.some(Boolean);
  }
  function select(kind){if(!owner||!current(owner)||!owner.branches.some(branch=>branch.kind===kind))return false;owner.active=kind;changed(owner);return true;}
  return{open,select,snapshot,reset(){owner=null;}};
}

// KKPR uses its own typed detail model. Native schema8aec89db…01d24 and
// parentf99ec732…ff5c9; none of the KKPR-list/gyb model is reused here.
function kkprField(value,key){
  const descriptor=Object.getOwnPropertyDescriptor(value,key);
  if(!descriptor)return null;
  if(!Object.hasOwn(descriptor,'value'))mapFailure();
  return descriptor.value;
}
function kkprNullableObject(value){if(value!==null&&!object(value))mapFailure();return value;}
function kkprNullableString(value){if(value!==null&&typeof value!=='string')mapFailure();return value;}
export function scanKkprDetails(response){
  const data=scanSpecialMapData(response),status=kkprField(data,'status');
  if(status!==null&&typeof status!=='boolean')mapFailure();
  const geometryData=kkprNullableObject(kkprField(data,'geometryData'));
  if(geometryData)kkprNullableString(kkprField(geometryData,'type'));
  const source=geometryData?kkprField(geometryData,'features'):null,features=source??[];
  // JSON arrays and bounded browser work are adaptations, not native casts.
  if(!Array.isArray(features)||features.length>2000)mapFailure();
  for(const feature of features){
    if(!object(feature))mapFailure();
    kkprNullableString(kkprField(feature,'type'));
    const properties=kkprNullableObject(kkprField(feature,'properties'));
    if(properties)kkprNullableString(kkprField(properties,'geom_type'));
    const geometry=kkprNullableObject(kkprField(feature,'geometry'));
    if(geometry){
      kkprNullableString(kkprField(geometry,'type'));
      const coordinates=kkprField(geometry,'coordinates');
      if(coordinates!==null&&!Array.isArray(coordinates))mapFailure();
    }
  }
  return{data,features,sources:features.map((feature,sourceIndex)=>({feature,sourceIndex}))};
}
export function scanKkprMapModel(response){
  const details=scanKkprDetails(response),kind=source=>source.feature.properties?.geom_type??null;
  const batas=details.sources.filter(source=>kind(source)==='batas'),izin=details.sources.filter(source=>kind(source)==='batasizin');
  // First filtered batas selects the entire native branch, not each feature.
  const mode=batas[0]?.feature.geometry?.type==='MultiPolygon'?'MultiPolygon':'Polygon';
  const model={...details,mode,entries:[],centers:[],initial:{center:{lat:-6.2,lng:106.816666},zoom:19},outlineIds:[],polygonToIndex:new Map(),markerByIndex:new Map(),pointCount:0,partial:false};
  const budget={points:0};
  const exterior=component=>{if(!Array.isArray(component)||!component.length)mapFailure();return nativeRing(component[0],budget);};
  const append=(source,filteredIndex,componentIndex,kind,center,polygonId,markerId)=>{
    // Source and output bounds are browser work guards, not native limits.
    if(model.entries.length>=2000)mapFailure();
    const index=model.entries.length;
    if(index===0)model.initial.center={...center};
    model.entries.push({index,sourceIndex:source.sourceIndex,filteredIndex,componentIndex,kind,center,polygonId,polygonIds:[polygonId],markerId});
    model.centers.push(center);model.polygonToIndex.set(polygonId,index);model.markerByIndex.set(index,markerId);
  };
  try{
    if(mode==='MultiPolygon'){
      // This helper does not recheck later feature geometry.type. Each raw
      // component retains its nesting; only component[0] exterior is consumed.
      for(const [filteredIndex,source]of batas.entries()){
        const coordinates=source.feature.geometry?.coordinates;if(coordinates==null)continue;
        for(const [componentIndex,component]of coordinates.entries()){
          const center=exterior(component);if(!center)continue;
          append(source,filteredIndex,componentIndex,'batas',center,`batas_${filteredIndex}_${componentIndex}`,`marker_batas_${filteredIndex}_${componentIndex}`);
        }
      }
    }else{
      // Native outlines are validated first but never add selectable centers,
      // and their IDs are not inserted into polygonId→dense-index mapping.
      for(const [filteredIndex,source]of batas.entries()){
        const geometry=source.feature.geometry;
        if(geometry?.type!=='Polygon'||geometry.coordinates==null)continue;
        if(exterior(geometry.coordinates))model.outlineIds.push(`batas_outline_${filteredIndex}_0`);
      }
      for(const [filteredIndex,source]of izin.entries()){
        const geometry=source.feature.geometry;
        if(geometry?.type!=='Polygon'||geometry.coordinates==null)continue;
        const center=exterior(geometry.coordinates);if(!center)continue;
        append(source,filteredIndex,0,'batasizin',center,`batasizin_${filteredIndex}`,`marker_batasizin_${filteredIndex}`);
      }
    }
    model.pointCount=budget.points;return model;
  }catch(error){
    model.pointCount=budget.points;model.partial=true;
    // Native publishes its typed model before projection and progressively
    // mutates centers/IDs/camera, but emits the complete map-record stream only
    // at the end. Partial entries here are an explicit browser diagnostic.
    const failure=Object.assign(new Error('Koordinat KKPR belum seluruhnya dapat ditampilkan.'),{code:'SCAN_MAP_UNRECOGNIZED',partial:{model}});
    throw failure;
  }
}
export function scanKkprSelection(model,index){
  if(!Number.isInteger(index)||index<0||index>=model.entries.length)return null;
  const entry=model.entries[index];
  return{...entry,center:{...entry.center},camera:{center:{...entry.center},zoom:19}};
}
export function scanKkprDirectionsUrl(model,index){
  const selection=scanKkprSelection(model,index),point=selection?.center;
  return point?`https://www.google.com/maps/search/?api=1&query=${doubleText(point.lat)},${doubleText(point.lng)}`:null;
}
export function scanKkprPanelView(model,{selected=0}={}){
  const entries=model?.entries;
  if(!Array.isArray(entries)||entries.length>2000||entries.some((entry,index)=>!object(entry)||entry.index!==index))mapFailure();
  // CGb binds the dense successful-ring count/index, not source feature IDs or
  // the94-field textual model. Empty native panels add no invented empty copy.
  return `<section class="scan-kkpr-panel"><h3>Daftar Bidang</h3><p class="scan-kkpr-count">${entries.length} Bidang</p><div class="scan-kkpr-rows">${entries.map(({index})=>`<button type="button" class="scan-kkpr-row${index===selected?' selected':''}" data-action="scan-kkpr-select" data-kkpr-index="${index}" aria-pressed="${index===selected}"><span>Bidang ${index+1}</span></button>`).join('')}</div></section>`;
}
