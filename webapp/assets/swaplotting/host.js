import {createSwaplotting} from './controller.js';
import {swaplottingView,swaplottingFeedback,swaplottingValidation,swaplottingCoordinateView} from './view.js';
import {swaplottingPointText,swaplottingPhotoPath,swaplottingOwnProfile} from './model.js';
import {createSwaplottingMap} from './map.js';
import {validateOfficialMapConfig} from '../maps/official-map.js';
import {createSwaplottingPhotoCapture} from './capture-dialog.js';
import {createSwaplottingPhotoStore} from './photo-store.js';
import {createSwaplottingPhotoRemoval} from './photo-removal.js';
import {parseSwaplottingCoordinateEntry,swaplottingCoordinateCandidates,swaplottingSessionCoordinate,swaplottingCoordinateSignature} from './coordinate-entry.js';
import {buildSwaplottingReview} from './review.js';
import {swaplottingReviewView} from './review-view.js';
import {createSwaplottingSubmit} from './submit-controller.js';

const libraries=new WeakMap();
const fail=()=>new Error('Peta belum dapat dimuat. Periksa koneksi lalu coba lagi.');
const hasLibrary=value=>value&&['map','tileLayer','marker','icon'].every(key=>typeof value[key]==='function')&&value.CRS?.EPSG3857;
function library(document){
 if(hasLibrary(document.defaultView?.L))return Promise.resolve(document.defaultView.L);
 if(libraries.has(document))return libraries.get(document);
 const result=new Promise((resolve,reject)=>{
  const script=document.createElement('script');let finished=false,timer;
  const finish=ok=>{if(finished)return;finished=true;clearTimeout(timer);script.onload=script.onerror=null;if(ok&&hasLibrary(document.defaultView?.L))resolve(document.defaultView.L);else{script.remove();reject(fail());}};
  script.async=true;script.src='/assets/vendor/leaflet/leaflet.js';script.referrerPolicy='origin';script.nonce=document.querySelector('script[nonce]')?.nonce??'';
  script.onload=()=>finish(true);script.onerror=()=>finish(false);timer=setTimeout(()=>finish(false),20000);timer.unref?.();document.head.append(script);
 });
 libraries.set(document,result);void result.catch(()=>{if(libraries.get(document)===result)libraries.delete(document);});return result;
}
async function resources(document,signal){
 const request=document.defaultView?.fetch?.bind(document.defaultView);
 if(typeof request!=='function')throw fail();
 const response=await request('/api/maps/config',{method:'GET',credentials:'same-origin',cache:'no-store',redirect:'error',signal});
 if(response.status!==200||response.redirected)throw fail();
 const config=validateOfficialMapConfig(await response.json()),leaflet=await library(document);return {config,leaflet};
}

// The optional parent adapter owns HTTP and native result feedback/navigation.
export function createSwaplottingHost({document,read,profile=null,getCoordinatePoints=()=>[],available=()=>true,isCurrent=()=>true,onSessionError=()=>{},onDecline=()=>{},photoCaptureFactory=createSwaplottingPhotoCapture,submit:send,writeAvailable=()=>false,onResult=()=>{}}){
 let alive=true,slot=null,listeners=null,map=null,mapCanvas=null,mapRequest=null,editing=null,paintedScreen=null;
 let photoAttempt=null,removalAttempt=null,photoCommitting=false,removalCommitting=false,photoReturn=null,removalReturn=null,photoMessage='',photoCapture=null;
 let coordinateCandidates=[],coordinateGeneration=0,coordinateSelection=null,coordinateInitialized=false,mapAttempted=false;
 let reviewState=null,writer=null,completedReturn=false;
 const abort=new AbortController();
 const current=()=>alive&&isCurrent();
 const controller=createSwaplotting({read,profile:typeof profile==='function'?null:profile,photoOrigin:document.defaultView?.location?.origin,isCurrent:current,canMutate:()=>completedReturn||!writer?.snapshot().locked,changed:()=>paint(),onSessionError,onDecline});
 const photoStore=createSwaplottingPhotoStore({revoke:url=>(document.defaultView?.URL??URL).revokeObjectURL(url)});
 writer=createSwaplottingSubmit({capture:captureSubmission,isSnapshotCurrent:submissionCurrent,submit:send,available:writeAvailable,isCurrent:current,changed:()=>paint(),onSessionError,onResult,onBack:()=>{if(!current())return false;completedReturn=true;try{return controller.backToMap();}finally{completedReturn=false;}}});
 const capture=()=>photoCapture??=photoCaptureFactory({document,isCurrent:()=>photoCurrent(photoAttempt),onUse:(record,context)=>{
  const attempt=photoAttempt;if(!photoCurrent(attempt)||context.kind!==attempt.kind||context.oldPath!==attempt.oldPath||!photoStore.canAdd(record))return false;
  photoCommitting=true;
  try{if(!controller.applyPhoto(record.url,attempt.oldPath))return false;photoStore.add(record);photoReturn={kind:attempt.kind,path:record.url,generation:controller.snapshot().photoGeneration};photoMessage='Foto ditambahkan ke draf di tab ini. Belum diunggah.';photoFeedback();return true;}
  finally{photoCommitting=false;}
 },onClose:()=>{const target=photoReturn??photoAttempt;photoAttempt=photoReturn=null;focusPhotoAction(target);}});
 const photoRemoval=createSwaplottingPhotoRemoval({document,isCurrent:context=>removalCurrent(context),onRemove:context=>{
  if(!removalCurrent(context))return false;const attempt=removalAttempt;removalCommitting=true;
  try{const result=controller.removePhoto(context.path);if(result){removalReturn={kind:attempt.kind,path:null,generation:controller.snapshot().photoGeneration};photoMessage='Foto dihapus dari draf.';photoFeedback();}return result;}
  finally{removalCommitting=false;}
 },onClose:()=>{const target=removalReturn??removalAttempt;removalAttempt=removalReturn=null;focusPhotoAction(target);}});
 const syncProfile=()=>{if(current())controller.setProfile(typeof profile==='function'?profile():profile);};
 const find=()=>document.querySelector('#main [data-swaplotting-host]');
 const coordinateOwner=()=>current()&&slot&&find()===slot&&slot.isConnected!==false&&controller.snapshot().screen==='map';
 const coordinateReady=()=>{try{return !!coordinateOwner()&&!!map&&!!mapCanvas&&mapCanvas.isConnected!==false&&slot.contains(mapCanvas)&&map.snapshot().closed===false&&typeof map.applyCenter==='function';}catch{return false;}};
 const coordinateOptions=()=>({ready:coordinateReady(),candidates:coordinateCandidates,selectedIndex:coordinateSelection?.entry.index??null,candidatePreview:coordinateSelection?.entry.preview??null,generation:coordinateGeneration,mapLoading:!map&&!!mapRequest,retryMap:mapAttempted&&!coordinateReady()&&!(!map&&mapRequest)});
 const viewOptions=()=>({available:available(),coordinate:coordinateOptions(),review:reviewState?.value??null,reviewError:reviewState?.error??'',submission:writer.snapshot()});
 const mutable=()=>!writer.snapshot().locked;
 function reviewPaint(){const node=slot?.querySelector('[data-swaplotting-review]');if(node)node.innerHTML=swaplottingReviewView(reviewState?.value??null,reviewState?.error??'');}
 function retireReview(model){if(reviewState&&reviewState.revision!==model.revision)reviewState=null;}
 function openReview(){
  if(!current()||!mutable()||!slot||find()!==slot||!['registered','unregistered'].includes(controller.snapshot().screen))return false;
  photoCapture?.close();photoRemoval.close();photoAttempt=removalAttempt=null;syncProfile();
  editing='field';let valid;try{valid=controller.validate();}finally{editing=null;}
  const model=controller.snapshot();if(!valid){reviewState=null;reviewPaint();return false;}
  try{reviewState={revision:model.revision,value:buildSwaplottingReview(model,{getPhoto:path=>photoStore.get(path)}),error:''};}
  catch(error){reviewState={revision:model.revision,value:null,error:error?.code==='SWAPLOTTING_REVIEW_NOT_READY'?error.message:'Ringkasan belum dapat dibuat. Periksa kembali draf ini.'};}
  reviewPaint();slot.querySelector('#swaplotting-review-title')?.focus?.();return !!reviewState.value;
 }
 function captureSubmission(){
  if(!current()||!slot||find()!==slot||slot.isConnected===false||!['registered','unregistered'].includes(controller.snapshot().screen))return null;
  photoCapture?.close();photoRemoval.close();photoAttempt=removalAttempt=null;syncProfile();
  editing='field';let valid;try{valid=controller.validate();}finally{editing=null;}
  if(!valid)return null;
  const model=controller.snapshot(),review=buildSwaplottingReview(model,{getPhoto:path=>photoStore.get(path)});
  const keys=model.screen==='registered'?['name','phone','email','number','review']:['name','phone','email','address','basisNumber','basisDescription','taxNumber','taxDescription','review'];
  const fields=Object.freeze(Object.fromEntries(keys.map(key=>[key,model.fields[key]])));
  const draft=Object.freeze({fields,officeIndex:model.officeIndex,regionIndex:model.regionIndex,right:model.right,basisIndex:model.basisIndex,taxIndex:model.taxIndex,latitude:review.dto.lat,longitude:review.dto.lon,disclaimerAcknowledged:model.disclaimerAcknowledged===true});
  const files=Object.freeze(review.dto.file.map(photo=>Object.freeze({name:'file',blob:photo.handle})));
  return {revision:model.revision,kind:model.screen,owner:JSON.stringify(model.owner.data),paths:model.photos.slice(),handles:files.map(file=>file.blob),payload:Object.freeze({kind:model.screen,draft,files})};
 }
 function submissionCurrent(source){
  if(!source||!current()||!slot||find()!==slot||slot.isConnected===false)return false;
  const model=controller.snapshot();
  let own;try{own=swaplottingOwnProfile(typeof profile==='function'?profile():profile);}catch{return false;}
  return model.revision===source.revision&&model.screen===source.kind&&own!==null&&JSON.stringify(own)===source.owner&&model.photos?.length===source.paths.length&&source.paths.every((path,index)=>model.photos[index]===path&&photoStore.get(path)===source.handles[index]);
 }
 function coordinatePaint({syncDraft=false}={}){
  if(!coordinateOwner())return;
  const wrapper=slot.querySelector('[data-swaplotting-coordinate]');if(!wrapper)return;
  const template=document.createElement('template');template.innerHTML=swaplottingCoordinateView(controller.snapshot(),coordinateOptions());
  for(const selector of ['[data-swaplotting-coordinate-error]','[data-swaplotting-coordinate-status]','[data-swaplotting-coordinate-source]','[data-swaplotting-coordinate-candidate-details]']){
   const before=wrapper.querySelector(selector),after=template.content.querySelector(selector);if(before&&after)before.replaceChildren(...after.childNodes);
  }
  for(const id of ['swaplotting-coordinate-longitude','swaplotting-coordinate-latitude']){
   const before=wrapper.querySelector('#'+id),after=template.content.querySelector('#'+id);if(before&&after&&(syncDraft||document.activeElement!==before)&&before.value!==after.value)before.value=after.value;
  }
  const select=wrapper.querySelector('#swaplotting-coordinate-candidate'),fresh=template.content.querySelector('#swaplotting-coordinate-candidate');
  if(select&&fresh){const value=coordinateSelection?String(coordinateSelection.entry.index):'';if(select.dataset.generation!==String(coordinateGeneration)){select.replaceChildren(...fresh.childNodes);select.setAttribute('data-generation',String(coordinateGeneration));}if(select.value!==value)select.value=value;}
  const checkbox=wrapper.querySelector('#swaplotting-coordinate-wgs84');if(checkbox)checkbox.checked=controller.snapshot().coordinateDraft.declaredWgs84;
  for(const before of wrapper.querySelectorAll('[data-action]')){const after=template.content.querySelector(`[data-action="${before.dataset.action}"]`);if(after){before.disabled=after.disabled;before.hidden=after.hidden;}}
 }
 function coordinateRefresh(){
  if(!coordinateOwner())return false;
  const selected=!!coordinateSelection;coordinateInitialized=true;coordinateGeneration++;coordinateSelection=null;
  try{coordinateCandidates=swaplottingCoordinateCandidates(getCoordinatePoints()).map(entry=>({...entry,preview:{kind:'session-point',raw:{...entry.raw},measurementSource:entry.record.source,sourceCrsLabel:entry.record.crs,metadata:structuredClone(entry.metadata)}}));}catch{coordinateCandidates=[];}
  if(selected)controller.setCoordinateDraft('declaredWgs84',false);
  coordinatePaint();return true;
 }
 function currentCoordinateCandidate(selection){
  if(!selection||selection!==coordinateSelection||selection.generation!==coordinateGeneration||!coordinateCandidates.includes(selection.entry))return false;
  try{const points=getCoordinatePoints(),entry=selection.entry;if(!Array.isArray(points)||points[entry.index]!==entry.record||swaplottingCoordinateSignature(entry.record)!==entry.signature)return false;return swaplottingCoordinateCandidates(points).some(row=>row.index===entry.index&&row.record===entry.record&&row.signature===entry.signature);}catch{return false;}
 }
 function coordinateFailure(message){if(coordinateOwner())controller.setCoordinateError(message);return false;}
 function applyCoordinate(){
  if(!coordinateReady())return coordinateFailure('Peta belum siap. Tunggu atau muat ulang peta sebelum menerapkan koordinat.');
  const ownerMap=map,ownerCanvas=mapCanvas,model=controller.snapshot(),selection=coordinateSelection,draft={...model.coordinateDraft};let value;
  try{
   if(selection&&!currentCoordinateCandidate(selection))return coordinateFailure('Titik sesi telah berubah. Perbarui pilihan lalu pilih kembali.');
   value=selection?swaplottingSessionCoordinate(selection.entry.record,{declaredWgs84:draft.declaredWgs84}):parseSwaplottingCoordinateEntry(draft);
  }catch(error){return coordinateFailure(typeof error?.message==='string'?error.message:'Koordinat belum sesuai format.');}
  const valid=()=>coordinateReady()&&map===ownerMap&&mapCanvas===ownerCanvas&&(!selection||currentCoordinateCandidate(selection))&&Object.entries(draft).every(([key,raw])=>controller.snapshot().coordinateDraft[key]===raw);
  if(!valid())return false;
  const previous=model.cameraTarget??model.initialCamera,result=ownerMap.applyCenter(value.camera);
  if(!result?.ok){coordinatePaint();return coordinateFailure(result?.code==='SWAPLOTTING_MAP_UNUSABLE'?'Peta perlu dimuat ulang. Koordinat sebelumnya tetap digunakan.':'Peta belum dapat dipusatkan. Koordinat sebelumnya tetap digunakan.');}
  const rollback=()=>{if(coordinateOwner()&&map===ownerMap&&!ownerMap.snapshot().closed){const restored=ownerMap.applyCenter(previous);if(!restored?.ok){destroyMap();coordinatePaint();}}};
  if(!valid()){rollback();return coordinateFailure('Pilihan koordinat berubah saat peta dipusatkan. Terapkan kembali pilihan yang berlaku.');}
  let committed=false;editing='coordinate';
  try{committed=controller.applyCoordinateTarget(result.camera,value.provenance)===true;}finally{editing=null;}
  if(!committed){rollback();return coordinateFailure('Koordinat belum dapat diterapkan pada formulir ini.');}
  coordinatePaint();point();return true;
 }
 function focusPhotoAction(target){
  if(!target||!current()||!slot||find()!==slot)return;
  const model=controller.snapshot();if(model.screen!==target.kind||model.photoGeneration!==target.generation)return;
  const path=target.path??target.oldPath,index=model.photos?.indexOf(path)??-1;
  let button=index<0?slot.querySelector('#swaplotting-photos'):slot.querySelector(`[data-action="swaplotting-photo-retake"][data-photo-index="${index}"]`);
  if(button?.disabled)button=slot.querySelector('[data-action="swaplotting-photo-retake"]');button?.focus?.();
 }
 function photoCurrent(attempt){
  if(!attempt||!current()||!slot||find()!==slot||slot.isConnected===false)return false;
  const model=controller.snapshot();return mutable()&&model.screen===attempt.kind&&model.photoGeneration===attempt.generation&&(attempt.oldPath===null?(model.photos?.length??0)<5:model.photos?.includes(attempt.oldPath)&&photoStore.has(attempt.oldPath));
 }
 function removalCurrent(context){return !!removalAttempt&&context.path===removalAttempt.path&&context.generation===removalAttempt.generation&&photoCurrent({...removalAttempt,oldPath:removalAttempt.path});}
 function photoFeedback(){
  const wrapper=slot?.querySelector('[data-swaplotting-photos]');if(!wrapper)return;
  let node=wrapper.querySelector('[data-swaplotting-photo-feedback]');if(!node){node=document.createElement('p');node.dataset.swaplottingPhotoFeedback='';node.className='form-hint';node.setAttribute('role','status');wrapper.append(node);}node.textContent=photoMessage;
 }
 function syncPhotos(model){
  photoStore.sync(model.photos);
  if(!photoCommitting&&photoAttempt&&!photoCurrent(photoAttempt)){photoCapture?.close();photoAttempt=null;photoMessage='Pengambilan foto dibatalkan karena pilihan formulir berubah.';}
  if(!removalCommitting&&removalAttempt&&!removalCurrent(removalAttempt)){photoRemoval.close();removalAttempt=null;}
  if(!['registered','unregistered'].includes(model.screen))photoMessage='';
 }
 function photoPathAt(button){const raw=button.dataset.photoIndex;if(typeof raw!=='string'||!/^(?:0|[1-9][0-9]*)$/.test(raw))return null;const index=Number(raw),model=controller.snapshot();if(!Number.isSafeInteger(index)||!['registered','unregistered'].includes(model.screen))return null;const path=swaplottingPhotoPath(model.photos?.[index],model.photoOrigin);return path&&photoStore.has(path)?path:null;}
 function openPhoto(oldPath=null){
  if(!mutable())return false;
  photoCapture?.close();photoRemoval.close();photoAttempt=null;removalAttempt=null;
  const model=controller.snapshot();if(!['registered','unregistered'].includes(model.screen)||oldPath===null&&(model.photos?.length??0)>=5||oldPath!==null&&(!model.photos?.includes(oldPath)||!photoStore.has(oldPath)))return false;
  photoAttempt={kind:model.screen,oldPath,generation:model.photoGeneration};photoMessage='';photoFeedback();
  try{if(capture().open({kind:model.screen,oldPath}))return true;}catch{}
  photoAttempt=null;photoMessage='Kamera belum dapat dibuka. Coba lagi melalui HTTPS atau localhost.';photoFeedback();return false;
 }
 function removePhoto(path){
  if(!mutable())return false;
  photoCapture?.close();photoRemoval.close();photoAttempt=null;removalAttempt=null;
  const model=controller.snapshot();if(!['registered','unregistered'].includes(model.screen)||!model.photos?.includes(path)||!photoStore.has(path))return false;
  removalAttempt={kind:model.screen,path,generation:model.photoGeneration};
  if(photoRemoval.open(removalAttempt))return true;removalAttempt=null;return false;
 }
 function destroyMap(){mapRequest=null;map?.destroy();map=null;mapCanvas=null;}
 function point(){const node=slot?.querySelector('[data-swaplotting-point]');if(node)node.textContent=swaplottingPointText(controller.snapshot());}
 function partial(){
  const model=controller.snapshot(),feedback=slot?.querySelector('[data-swaplotting-feedback]'),validation=slot?.querySelector('[data-swaplotting-validation]');
  retireReview(model);reviewPaint();
  submissionPaint();
  if(feedback)feedback.innerHTML=swaplottingFeedback(model);
  if(validation)validation.innerHTML=swaplottingValidation(model,writer.snapshot());
  for(const message of slot?.querySelectorAll('[id^="swaplotting-error-"]')??[]){const key=message.id.slice('swaplotting-error-'.length);message.textContent=model.validation?.errors?.[key]??'';}
  for(const input of slot?.querySelectorAll('[data-swaplotting-field],select[id^="swaplotting-"]')??[]){const key=input.dataset.swaplottingField??input.id.slice('swaplotting-'.length);input.setAttribute('aria-invalid',String(!!model.validation?.errors?.[key]));}
 }
 function submissionPaint(){
  if(!slot||!['registered','unregistered'].includes(controller.snapshot().screen))return;
  const template=document.createElement('template');template.innerHTML=swaplottingView(controller.snapshot(),viewOptions());
  for(const selector of ['[data-swaplotting-submit-status]','.swaplotting-form-actions','#swaplotting-write-boundary']){
   const before=slot.querySelector(selector),after=template.content.querySelector(selector);if(before&&after)before.replaceChildren(...after.childNodes);
  }
  const state=writer.snapshot();
  for(const before of slot.querySelectorAll('button,input,select,textarea')){
   if(before.matches?.('[data-swaplotting-field],select[id^="swaplotting-"],#swaplotting-photos,[data-action="swaplotting-back-map"],[data-action="swaplotting-review-close"],[data-action="swaplotting-photo-retake"],[data-action="swaplotting-photo-remove"],[data-action="swaplotting-offices"],[data-action="swaplotting-regions"]')){
    const selector=before.id?'#'+before.id:before.dataset.photoIndex!==undefined?`[data-action="${before.dataset.action}"][data-photo-index="${before.dataset.photoIndex}"]`:`[data-action="${before.dataset.action}"]`;
    const after=template.content.querySelector(selector);before.disabled=state.locked||!!after?.disabled;
   }
  }
 }
 async function mountMap(){
  const canvas=slot?.querySelector('[data-swaplotting-map-canvas]');
  if(!current()||!canvas||mapCanvas===canvas||mapRequest?.canvas===canvas)return;
  destroyMap();const request={canvas};mapRequest=request;
  mapAttempted=true;coordinatePaint();
  const valid=()=>current()&&mapRequest===request&&canvas.isConnected!==false&&find()===slot&&slot.contains(canvas);
  const status=text=>{if(!valid())return;const node=slot.querySelector('[data-swaplotting-map-status]');if(node)node.textContent=text;coordinatePaint();};
  status('Memuat peta OpenStreetMap dan Bhumi…');
  try{
   const loaded=await resources(document,abort.signal);if(!valid())return;
   const model=controller.snapshot();
   map=createSwaplottingMap(canvas,model.cameraTarget??model.initialCamera,{...loaded,isCurrent:valid,onStatus:status,onCameraChanged:(value,context)=>{if(!valid())return;editing='map';try{controller.setCameraTarget(value,context);}finally{editing=null;}}});mapCanvas=canvas;coordinatePaint();
  }catch(error){if(valid()){status(error?.message||fail().message);mapRequest=null;coordinatePaint();}}
 }
 function bind(){
  const next=find();if(!current()||!next)return false;
  if(slot!==next){photoCapture?.close();photoRemoval.close();photoAttempt=removalAttempt=null;listeners?.abort();destroyMap();slot=next;paintedScreen=controller.snapshot().screen;listeners=new AbortController();const options={signal:listeners.signal};slot.addEventListener('input',input,options);slot.addEventListener('change',change,options);slot.addEventListener('click',click,options);slot.addEventListener('submit',submit,options);}
  return true;
 }
 function patchSameScreen(model){
  if(paintedScreen!==model.screen)return false;
  const template=document.createElement('template');template.innerHTML=swaplottingView(model,viewOptions());
  const copy=selector=>{const before=slot.querySelector(selector),after=template.content.querySelector(selector);if(!before||!after)return false;before.replaceChildren(...after.childNodes);return true;};
  if(model.screen==='map'){
   if(!slot.querySelector('[data-swaplotting-disclaimer]')||!template.content.querySelector('[data-swaplotting-disclaimer]'))return false;
   copy('[data-swaplotting-feedback]');copy('[data-swaplotting-disclaimer]');copy('[data-swaplotting-availability]');copy('.swaplotting-form-choices');point();coordinatePaint();return true;
  }
  if(!['registered','unregistered'].includes(model.screen))return false;
  copy('[data-swaplotting-feedback]');copy('[data-swaplotting-validation]');copy('[data-swaplotting-owner]');copy('[data-swaplotting-photos]');copy('[data-swaplotting-point-provenance]');copy('[data-swaplotting-review]');
  for(const before of slot.querySelectorAll('select[id^="swaplotting-"]')){
   const after=template.content.querySelector('#'+before.id);if(!after)continue;
   // Keep the select itself while changing received reference options.
   const value=after.value;before.replaceChildren(...after.childNodes);before.disabled=after.disabled;before.value=value;before.setAttribute('aria-invalid',String(!!model.validation?.errors?.[before.id.slice('swaplotting-'.length)]));
  }
  for(const before of slot.querySelectorAll('[data-swaplotting-field]')){
   const after=template.content.querySelector('#'+before.id);if(!after)continue;
   if(before.value!==after.value)before.value=after.value;
   before.disabled=after.disabled;before.setAttribute('aria-invalid',String(!!model.validation?.errors?.[before.dataset.swaplottingField]));
  }
  for(const before of slot.querySelectorAll('[id^="swaplotting-error-"]')){const after=template.content.querySelector('#'+before.id);if(after)before.textContent=after.textContent;}
  point();photoFeedback();submissionPaint();return true;
 }
 function paint(){
  if(!current()||!bind())return;
  retireReview(controller.snapshot());
  if(editing==='map'||editing==='coordinate'){point();coordinatePaint();return;}
  if(editing==='field'){partial();return;}
  const model=controller.snapshot();syncPhotos(model);if(patchSameScreen(model))return;
  destroyMap();slot.innerHTML=swaplottingView(model,viewOptions());paintedScreen=model.screen;photoFeedback();submissionPaint();void mountMap();
 }
 const owned=target=>current()&&slot===find()&&target?.isConnected!==false&&slot?.contains(target);
 function input(event){const target=event.target;if(!owned(target)||target.disabled||!mutable())return;if(target.matches?.('[data-swaplotting-coordinate-field]')){if(!coordinateOwner())return;coordinateSelection=null;editing='coordinate';try{controller.setCoordinateDraft(target.dataset.swaplottingCoordinateField,target.value);}finally{editing=null;}coordinatePaint();return;}if(!target.matches?.('[data-swaplotting-field]'))return;editing='field';try{controller.setField(target.dataset.swaplottingField,target.value);}finally{editing=null;}}
 async function change(event){const target=event.target;if(!owned(target)||target.disabled||!mutable())return;
  if(target.id==='swaplotting-coordinate-wgs84'){if(!coordinateOwner())return;editing='coordinate';try{controller.setCoordinateDraft('declaredWgs84',target.checked===true);}finally{editing=null;}coordinatePaint();return;}
  if(target.id==='swaplotting-coordinate-candidate'){
   if(!coordinateOwner()||target.dataset.generation!==String(coordinateGeneration))return;
   const raw=target.value;if(raw!==''&&!/^(?:0|[1-9][0-9]*)$/.test(raw))return;
   const entry=raw===''?null:coordinateCandidates.find(row=>row.index===Number(raw));if(raw!==''&&!entry)return;
   coordinateSelection=entry?{entry,generation:coordinateGeneration}:null;editing='coordinate';
   try{controller.setCoordinateDraft('declaredWgs84',false);if(entry){controller.setCoordinateDraft('longitude',entry.raw.longitude);controller.setCoordinateDraft('latitude',entry.raw.latitude);}}finally{editing=null;}
   coordinatePaint({syncDraft:true});return;
  }
  const value=target.value,index=value===''?null:Number(value);if(target.id==='swaplotting-office')await controller.selectOffice(index);else if(target.id==='swaplotting-region')controller.selectRegion(index);else if(target.id==='swaplotting-right')controller.selectRight(value||null);else if(target.id==='swaplotting-basis')controller.selectBasis(index);else if(target.id==='swaplotting-tax')controller.selectTax(index);}
 async function click(event){
  const button=event.target.closest?.('[data-action]');if(!owned(button)||button.disabled||!mutable())return;
  const action=button.dataset.action;
  if(action==='swaplotting-coordinate-apply')applyCoordinate();
  else if(action==='swaplotting-coordinate-refresh')coordinateRefresh();
  else if(action==='swaplotting-coordinate-retry-map'){if(coordinateOwner()&&!coordinateReady()){destroyMap();void mountMap();}}
  else if(action==='swaplotting-open-form'){syncProfile();await controller.openForm(button.dataset.kind);}
  else if(action==='swaplotting-back-map')controller.backToMap();
  else if(action==='swaplotting-retry-disclaimer')await controller.loadDisclaimer();
  else if(action==='swaplotting-accept')controller.acceptDisclaimer();
  else if(action==='swaplotting-decline')controller.declineDisclaimer();
  else if(action==='swaplotting-offices')await controller.loadOffices();
  else if(action==='swaplotting-regions'){const model=controller.snapshot();await controller.selectOffice(model.officeIndex);}
  else if(action==='swaplotting-map-control')map?.control(button.dataset.control);
  else if(action==='swaplotting-photo-add')openPhoto();
  else if(action==='swaplotting-photo-retake'){const path=photoPathAt(button);if(path)openPhoto(path);}
  else if(action==='swaplotting-photo-remove'){const path=photoPathAt(button);if(path)removePhoto(path);}
  else if(action==='swaplotting-review')openReview();
  else if(action==='swaplotting-send')await writer.begin();
  else if(action==='swaplotting-review-close'){reviewState=null;reviewPaint();slot.querySelector('[data-action="swaplotting-review"]')?.focus?.();}
 }
 function submit(event){if(event.target.id!=='swaplotting-form'||!owned(event.target))return;event.preventDefault();if(!mutable())return;editing='field';try{controller.validate();}finally{editing=null;}}
 function attach(){if(!current()||!bind())return;if(!coordinateInitialized&&controller.snapshot().screen==='map')coordinateRefresh();void mountMap();if(available()){syncProfile();if(controller.snapshot().disclaimerStatus==='idle')void controller.loadDisclaimer();}}
 function html(){queueMicrotask(attach);return `<div data-swaplotting-host>${swaplottingView(controller.snapshot(),viewOptions())}</div>`;}
 function dispose(){if(!alive)return;alive=false;writer.dispose();reviewState=null;coordinateCandidates=[];coordinateSelection=null;coordinateGeneration++;photoCapture?.dispose();photoRemoval.dispose();photoAttempt=removalAttempt=null;photoStore.dispose();listeners?.abort();abort.abort();destroyMap();controller.dispose();slot?.replaceChildren();slot=null;}
 return {html,paint,attach,dispose,controller,submissionSnapshot:()=>writer.snapshot()};
}
