// Main Scan contract: analysis/recovered/scan-flow.json (bfa3cdc5…c823ab4).
// This module has no camera, profile/name input, activation or geotag writer.
const specifications = Object.freeze({
  classify: {id:'post-apis-scandocument-d42440',endpoint:'apis/scanDocument',method:'POST',effect:'write'},
  parcel: {id:'get-legacy-getparcelboundarybyid-dbaeb8',endpoint:'legacy/GetParcelBoundaryById?persilid={value}',method:'GET',effect:'read'},
  document: {id:'post-apis-getdocument-d41ee8',endpoint:'apis/GetDocument',method:'POST',effect:'read'},
  metadata: {id:'post-apis-getdocumenttype-d417d4',endpoint:'apis/GetDocumentType',method:'POST',effect:'read'},
});
const authCodes = new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const failure = 'Gagal memuat dokumen, silakan coba lagi.';
const fallbackMetadata = () => ({error:true,showRoute:false,type:''});

// GetDocumentType does not short-circuit error:true. Main Scan forwards type;
// Activity's deliberately empty viewer type must not be substituted here.
function metadataRecognized(response) {
  const body=response?.data,data=body?.data;
  return response?.status===200&&object(body)&&(body.error==null||typeof body.error==='boolean')&&object(data)&&Number.isInteger(data.showRoute)&&(data.type==null||typeof data.type==='string');
}
export function scanDocumentMetadata(response) {
  if(!metadataRecognized(response))return fallbackMetadata();
  const body=response.data,data=body.data;
  return {error:body.error??true,showRoute:data.showRoute===1,type:data.type??''};
}

// The private adapter validates HTTP200, >200 bytes, %PDF and the size limit.
// Only its paired session-local preview/download URLs may reach this viewer.
export function scanPdfDocument(response) {
  const match=typeof response?.downloadUrl==='string'&&/^\/api\/download\/([a-zA-Z0-9_-]+)$/.exec(response.downloadUrl);
  if(response?.status!==200||response.contentType!=='application/pdf'||!match||response.previewUrl!==`/api/preview/${match[1]}`)return null;
  return {status:200,contentType:'application/pdf',previewUrl:response.previewUrl,downloadUrl:response.downloadUrl};
}

function classification(response) {
  if(response?.status!==200||response.nativeFallback===true)return {message:'error',data:'1009'};
  let body=response.data;
  if(typeof body==='string'){try{body=JSON.parse(body);}catch{return {message:'error',data:'1009'};}}
  if(!object(body)||(body.error!=null&&typeof body.error!=='boolean')||(body.message!=null&&typeof body.message!=='string')||typeof body.data!=='string')return {message:'error',data:'1009'};
  return {message:body.message??'Unknown Error',data:body.data};
}
function parcelData(response) {
  let data=response?.data;
  for(let index=0;index<3&&object(data)&&Object.hasOwn(data,'data');index++)data=data.data;
  return response?.status===200&&object(data)&&data.type==='FeatureCollection'&&Array.isArray(data.features)?data:null;
}
function defaultDocument(viewer) {
  return `<section class="scan-document" data-scan-document-type="${esc(viewer.type)}"><h2>Dokumen Elektronik</h2><div class="sps-document-links"><a class="button" href="${esc(viewer.pdf.previewUrl)}" target="_blank" rel="noopener noreferrer">Lihat PDF</a><a class="button secondary" href="${esc(viewer.pdf.downloadUrl)}" download>Unduh PDF</a></div></section>`;
}

// The host retains its route/session context, map renderer and focus/caret.
// Explicit submit is the review action for the classifier's write capability.
export function renderScanController(state,{renderParcel,renderDocument=defaultDocument}={}) {
  if(!state)return '';
  const labels={classifying:'Memeriksa kode…',parcel:'Memuat batas bidang…',document:'Mengambil dokumen…',metadata:'Memuat informasi dokumen…'};
  let result='';
  if(state.outcome?.kind==='parcel')result=typeof renderParcel==='function'?renderParcel(state.outcome):'<p>Batas bidang telah diterima.</p>';
  if(state.outcome?.kind==='document')result=`${renderDocument(state.outcome)}${state.outcome.metadataUnavailable?`<p class="notice" role="status">${esc(state.outcome.metadataError)}</p>`:''}${state.outcome.showRoute?`<button type="button" class="button secondary scan-location" data-action="scan-location" ${!state.locationAvailable||state.locationBusy?'disabled':''}>${state.locationBusy?'Memuat lokasi…':'Lihat lokasi'}</button>`:''}`;
  if(state.outcome?.kind==='activation-unavailable')result='<p class="notice">Aktivasi berkas geotag belum tersedia di browser. Gunakan alur aplikasi resmi.</p>';
  return `<section class="scan-controls"><form id="scan-form" aria-busy="${state.busy}" novalidate><label class="parameter-field" for="scan-raw-q"><span>Kode QR atau barcode</span><textarea id="scan-raw-q" name="q" rows="4" autocomplete="off" spellcheck="false" ${state.busy?'disabled':''}>${esc(state.rawQ??'')}</textarea></label><div class="modal-actions"><button type="submit" class="button" ${state.busy||!state.available?'disabled':''}>${state.busy?'Memproses…':'Pindai kode'}</button>${state.busy?'<button type="button" class="button secondary" id="scan-cancel" data-action="scan-cancel">Batal</button>':''}</div></form></section><section class="scan-result" aria-live="polite">${state.busy?`<p role="status">${labels[state.stage]??'Memuat…'}</p>`:''}${state.error?`<p class="notice error" role="alert">${esc(state.error)}</p>`:''}${result}</section>`;
}

export function createScanController({api,getOperations,getAccount,isCurrent,onChange=()=>{},onAuthError=()=>{},notify=()=>{},record=()=>{},onParcel,onDocument,onLocation}) {
  for(const fn of [api,getOperations,getAccount,isCurrent])if(typeof fn!=='function')throw new TypeError('Host Scan belum lengkap.');
  let owner=null;
  const operation=kind=>{const spec=specifications[kind];return getOperations().find(op=>op.id===spec.id&&op.endpoint===spec.endpoint&&op.method===spec.method&&op.effect===spec.effect&&op.auth==='session'&&op.serviceId==='main'&&op.enabled===true);};
  const connected=()=>getAccount()?.authenticated===true&&getAccount()?.configured===true&&getAccount()?.loading!==true;
  const owns=item=>owner===item&&getAccount()?.authenticated===true&&isCurrent(item.context);
  const current=(item,run)=>owns(item)&&item.run===run;
  function snapshot(){if(!owner)return null;return {rawQ:owner.rawQ,busy:owner.busy,stage:owner.stage,error:owner.error,outcome:owner.outcome?{...owner.outcome,...(owner.outcome.pdf?{pdf:{...owner.outcome.pdf}}:{})}:null,locationBusy:owner.locationBusy,locationAvailable:typeof onLocation==='function',available:connected()&&!!operation('classify')};}
  const changed=item=>{if(owns(item))onChange(snapshot());};
  const send=(op,values,scanContextId)=>api('/api/execute',{method:'POST',body:{operationId:op.id,values,...(op.effect==='write'?{confirm:true}:{}),...(scanContextId?{scanContextId}:{})}});
  function errorText(error,fallback){return typeof error?.code==='string'&&typeof error.message==='string'?error.message:fallback;}
  function authentication(error,item,run){if(!authCodes.has(error?.code)||!current(item,run))return false;owner=null;onAuthError(error);return true;}
  function rejected(item,error,message){item.error=errorText(error,message);item.stage='error';record('Scan','error',`${typeof error?.code==='string'?error.code:'ERROR'} · Permintaan belum berhasil`);changed(item);}
  function callback(fn,value){const pending=fn?.(value);if(pending&&typeof pending.catch==='function')void pending.catch(()=>{});}
  function open(context){if(!connected()||!isCurrent(context))return false;owner={context,rawQ:'',busy:false,stage:'idle',error:null,outcome:null,run:null,locationBusy:false};changed(owner);return true;}
  function setRawQ(value){if(!owner||!owns(owner)||owner.busy||value!==null&&typeof value!=='string')return false;owner.rawQ=value;return true;}
  function cancel(){if(!owner||!owns(owner))return false;owner.run=null;owner.busy=false;owner.locationBusy=false;owner.stage='idle';owner.error=null;owner.outcome=null;changed(owner);return true;}
  async function submit(){
    const item=owner,op=operation('classify');
    if(!item||!owns(item)||item.busy||!connected()||!op)return false;
    const run={originalQ:item.rawQ,requestQ:item.rawQ??'',scanContextId:null};item.run=run;item.busy=true;item.locationBusy=false;item.stage='classifying';item.error=null;item.outcome=null;changed(item);
    try{
      const reply=await send(op,{q:run.requestQ});
      if(!current(item,run))return false;
      const response=reply?.result;
      if(typeof response?.scanContextId!=='string'||!response.scanContextId.length||response.scanContextId.length>256){rejected(item,null,'Konteks Scan belum tersedia. Silakan pindai kembali.');return false;}
      run.scanContextId=response.scanContextId;
      const classified=classification(response);
      if(classified.message==='AktivasiBerkasGeotag'){
        item.outcome={kind:'activation-unavailable',classification:classified};item.stage='ready';changed(item);return true;
      }
      if(classified.message==='GetParcelBoundaryById'){
        const parcel=operation('parcel');
        if(!parcel){rejected(item,null,'Pembacaan batas bidang belum tersedia.');return false;}
        item.stage='parcel';changed(item);
        const reply=await send(parcel,{persilid:classified.data});
        if(!current(item,run))return false;
        if(!parcelData(reply?.result)){rejected(item,null,'Batas bidang belum dapat dimuat.');return false;}
        item.outcome={kind:'parcel',persilId:classified.data,response:reply.result,classification:classified,originalQ:run.originalQ,requestQ:run.requestQ};item.stage='ready';record('Scan bidang','success','HTTP 200 · Respons diterima');changed(item);callback(onParcel,item.outcome);return true;
      }
      const document=operation('document');
      if(!document){rejected(item,null,'Pembacaan dokumen belum tersedia.');return false;}
      item.stage='document';changed(item);
      const replyDocument=await send(document,{q:run.requestQ},run.scanContextId);
      if(!current(item,run))return false;
      const pdf=scanPdfDocument(replyDocument?.result);
      if(!pdf){rejected(item,null,failure);return false;}
      let metadata=fallbackMetadata(),metadataUnavailable=true;
      const metadataOp=operation('metadata');
      if(metadataOp){
        item.stage='metadata';changed(item);
        try{
          const reply=await send(metadataOp,{q:run.requestQ},run.scanContextId);
          if(!current(item,run))return false;
          metadata=scanDocumentMetadata(reply?.result);
          metadataUnavailable=!metadataRecognized(reply?.result);
        }catch(error){
          if(!current(item,run)||authentication(error,item,run))return false;
          // Same-account token changes are not expiry. Retain the valid PDF,
          // use metadata fallback, and never automatically repeat any request.
        }
      }
      if(!current(item,run))return false;
      item.outcome={kind:'document',q:run.originalQ,requestQ:run.requestQ,pdf,...metadata,metadataUnavailable,metadataError:metadataUnavailable?'Informasi lokasi dokumen belum dapat dimuat. PDF tetap tersedia.':null};item.stage='ready';record('Scan dokumen','success','HTTP 200 · PDF diterima');changed(item);callback(onDocument,item.outcome);return true;
    }catch(error){
      // Backend normalizes ordinary classifier failure with its captured name
      // context and native ('error','1009') tuple. A thrown local/profile/auth
      // failure has no context; it must not invent a document request.
      if(!current(item,run)||authentication(error,item,run))return false;
      rejected(item,error,'Pemindaian belum berhasil. Silakan coba lagi.');return false;
    }finally{if(current(item,run)){item.busy=false;changed(item);}}
  }
  async function openLocation(){
    const item=owner,run=item?.run,viewer=item?.outcome;
    if(!item||!current(item,run)||item.busy||item.locationBusy||viewer?.kind!=='document'||viewer.showRoute!==true)return false;
    if(typeof onLocation!=='function'){notify('Lokasi dokumen belum tersedia di browser.');return false;}
    item.locationBusy=true;changed(item);
    // Keep the opaque session context out of snapshots, markup and records;
    // the host may use it only for the backend's scoped Scan viewer reads.
    try{await onLocation({...viewer,pdf:{...viewer.pdf}},item.context,{scanContextId:run.scanContextId});return current(item,run);}
    catch(error){if(!current(item,run)||authentication(error,item,run))return false;notify(errorText(error,'Lokasi dokumen belum dapat dimuat.'));return false;}
    finally{if(current(item,run)){item.locationBusy=false;changed(item);}}
  }
  return {open,setRawQ,submit,cancel,reset(){owner=null;},snapshot,render:options=>renderScanController(snapshot(),options),openLocation};
}
