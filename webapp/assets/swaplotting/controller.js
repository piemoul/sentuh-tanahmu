import {SWAPLOTTING_INITIAL_CAMERA,SWAPLOTTING_RIGHTS,SWAPLOTTING_BASIS,SWAPLOTTING_TAX,SWAPLOTTING_COPY,swaplottingEmptyFields,swaplottingCamera,swaplottingDisclaimer,swaplottingHasMessage,swaplottingOffices,swaplottingRegions,swaplottingValidate,swaplottingOwnProfile,swaplottingPhotoPath} from './model.js';
import {swaplottingCoordinateProvenance} from './coordinate-entry.js';
const authCodes=new Set(['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED']);
export function createSwaplotting({read,profile=null,photoOrigin=globalThis.location?.origin??null,changed=()=>{},isCurrent=()=>true,canMutate=()=>true,onSessionError=()=>{},onDecline=()=>{}}){
 if(typeof read!=='function')throw new TypeError('SWAPLOTTING_READ_REQUIRED');
 let alive=true;const requests={disclaimer:null,offices:null,regions:null};
 let profileSource=profile;
 const own=typeof profileSource==='function'?null:swaplottingOwnProfile(profileSource);
 const state={screen:'map',cameraTarget:null,initialCamera:{...SWAPLOTTING_INITIAL_CAMERA},point:null,coordinateDraft:{longitude:'',latitude:'',declaredWgs84:false},coordinateError:'',targetProvenance:null,pointProvenance:null,owner:own?{status:'ready',source:'account-summary-own-profile',data:own}:{status:'unresolved',data:null},fields:swaplottingEmptyFields(),photos:null,photoOrigin,photoGeneration:0,office:null,officeIndex:null,region:null,regionIndex:null,right:null,basis:null,basisIndex:null,tax:null,taxIndex:null,offices:[],regions:[],pending:{disclaimer:false,offices:false,regions:false},errors:{disclaimer:'',offices:'',regions:''},disclaimer:null,disclaimerStatus:'idle',disclaimerVisible:false,disclaimerAcknowledged:false,canOpenForm:false,validation:null,revision:0};
 const current=()=>alive&&isCurrent();
 const mutable=()=>current()&&canMutate()===true;
 const refreshOwner=()=>{let value;try{value=typeof profileSource==='function'?profileSource():profileSource;}catch{value=null;}const data=swaplottingOwnProfile(value);state.owner=data?{status:'ready',source:'account-summary-own-profile',data}:{status:'unresolved',data:null};};
 const applyOwner=()=>{for(const key of ['name','phone','email'])state.fields[key]=state.owner.data?.[key]??null;};
 const snapshot=()=>structuredClone(state);
 const gate=()=>{state.canOpenForm=state.disclaimerStatus==='ready'&&(!swaplottingHasMessage(state.disclaimer)||state.disclaimerAcknowledged);};
 const emit=()=>{gate();state.revision++;if(current())changed(snapshot());};
 // Host async camera/confirmation owners capture this token. Context changes
 // retire pending actions, while retained native photo paths stay in the form.
 const retirePhotoContext=()=>{state.photoGeneration++;};
 const retire=kind=>{requests[kind]=null;state.pending[kind]=false;};
 const clearRegions=()=>{retire('regions');state.region=state.regionIndex=null;state.regions=[];state.errors.regions='';};
 const clearForm=()=>{retirePhotoContext();retire('offices');clearRegions();state.offices=[];state.office=state.officeIndex=null;state.right=state.basis=state.basisIndex=state.tax=state.taxIndex=null;state.fields=swaplottingEmptyFields();state.photos=null;state.point=state.pointProvenance=null;state.validation=null;state.errors.offices='';};
 const failure=(error,kind,valid)=>{if(!valid())return false;state.errors[kind]=typeof error?.message==='string'&&error.message?error.message:SWAPLOTTING_COPY.readError;if(authCodes.has(error?.code))onSessionError(error);return false;};
 async function loadDisclaimer(){
  if(!mutable()||state.screen!=='map'||state.pending.disclaimer)return false;
  const request={};requests.disclaimer=request;state.pending.disclaimer=true;state.errors.disclaimer='';state.disclaimer=null;state.disclaimerStatus='reading';state.disclaimerVisible=false;state.disclaimerAcknowledged=false;emit();
  const valid=()=>current()&&requests.disclaimer===request&&state.screen==='map';
  try{const raw=await read('disclaimer',{});if(!valid())return false;state.disclaimer=swaplottingDisclaimer(raw);state.disclaimerStatus='ready';state.disclaimerVisible=swaplottingHasMessage(state.disclaimer);return true;}
  catch(error){if(!valid())return false;state.disclaimerStatus='error';return failure(error,'disclaimer',valid);}
  finally{if(valid()){retire('disclaimer');emit();}}
 }
 function acceptDisclaimer(){if(!mutable()||state.screen!=='map'||state.disclaimerStatus!=='ready'||!state.disclaimerVisible||!swaplottingHasMessage(state.disclaimer))return false;state.disclaimerAcknowledged=true;state.disclaimerVisible=false;emit();return true;}
 function declineDisclaimer(){if(!mutable()||state.screen!=='map'||state.disclaimerStatus!=='ready'||!state.disclaimerVisible)return false;state.disclaimerStatus='declined';state.disclaimerAcknowledged=false;state.disclaimerVisible=false;clearForm();emit();if(current())onDecline();return true;}
 function setCameraTarget(value,{eventKind}={}){if(!mutable()||state.screen!=='map')return false;try{const camera=swaplottingCamera(value),same=state.cameraTarget&&Object.is(camera.lat,state.cameraTarget.lat)&&Object.is(camera.lng,state.cameraTarget.lng);state.cameraTarget={...camera,zoom:camera.zoom??state.cameraTarget?.zoom??state.initialCamera.zoom};if(eventKind!=='zoom'||!same)state.targetProvenance=null;}catch{return false;}retirePhotoContext();emit();return true;}
 function setCoordinateDraft(key,value){if(!mutable()||state.screen!=='map'||!['longitude','latitude','declaredWgs84'].includes(key)||(key==='declaredWgs84'?typeof value!=='boolean':typeof value!=='string'))return false;state.coordinateDraft[key]=value;state.coordinateError='';emit();return true;}
 function setCoordinateError(message){if(!mutable()||state.screen!=='map'||typeof message!=='string'||message.length>1000)return false;state.coordinateError=message;emit();return true;}
 function applyCoordinateTarget(value,provenance){
  if(!mutable()||state.screen!=='map')return false;
  let camera,source;try{camera=swaplottingCamera(value);source=swaplottingCoordinateProvenance(provenance,camera);}catch{return false;}
  state.cameraTarget={...camera,zoom:camera.zoom??state.cameraTarget?.zoom??state.initialCamera.zoom};state.targetProvenance=source;state.coordinateError='';retirePhotoContext();emit();return true;
 }
 async function loadOffices(){
  if(!mutable()||state.screen==='map'||state.pending.offices)return false;
  const screen=state.screen;retirePhotoContext();clearRegions();state.office=state.officeIndex=null;state.offices=[];state.errors.offices='';state.validation=null;const request={};requests.offices=request;state.pending.offices=true;emit();
  const valid=()=>current()&&requests.offices===request&&state.screen===screen;
  try{const raw=await read('offices',{nama:'',tipeKantor:''});if(!valid())return false;state.offices=swaplottingOffices(raw);return true;}
  catch(error){return failure(error,'offices',valid);}
  finally{if(valid()){retire('offices');emit();}}
 }
 async function openForm(kind){if(!mutable()||!['registered','unregistered'].includes(kind)||!state.canOpenForm)return false;clearForm();state.screen=kind;refreshOwner();applyOwner();const camera=state.cameraTarget??state.initialCamera;state.point={lat:camera.lat,lng:camera.lng,source:state.cameraTarget?'map-camera':'initial-viewport'};state.pointProvenance=state.targetProvenance?structuredClone(state.targetProvenance):{kind:state.point.source};emit();return loadOffices();}
 function backToMap(){if(!mutable()||state.screen==='map')return false;clearForm();state.screen='map';emit();return true;}
 async function selectOffice(index){
  if(!mutable()||state.screen==='map'||state.pending.offices||!Number.isInteger(index)||index<0||!state.offices[index])return false;
  const office=state.offices[index];if(typeof office.KantorId!=='string'||office.KantorId==='')return false;
  retirePhotoContext();clearRegions();state.office=office;state.officeIndex=index;state.validation=null;state.errors.regions='';const screen=state.screen,request={};requests.regions=request;state.pending.regions=true;emit();
  const valid=()=>current()&&requests.regions===request&&state.screen===screen&&state.office===office;
  try{const raw=await read('regions',{kantorid:office.KantorId});if(!valid())return false;state.regions=swaplottingRegions(raw);return true;}
  catch(error){return failure(error,'regions',valid);}
  finally{if(valid()){retire('regions');emit();}}
 }
 function selectRegion(index){if(!mutable()||state.screen==='map'||state.pending.regions||!Number.isInteger(index)||index<0||!state.regions[index])return false;const region=state.regions[index];if(typeof region.code!=='string'||region.code==='')return false;if(state.region!==region||state.regionIndex!==index)retirePhotoContext();state.region=region;state.regionIndex=index;state.validation=null;emit();return true;}
 function selectRight(code){if(!mutable()||state.screen!=='registered'||typeof code!=='string'||!SWAPLOTTING_RIGHTS.some(row=>row.code===code))return false;if(state.right!==code)retirePhotoContext();state.right=code;state.validation=null;emit();return true;}
 function selectProof(kind,index){const list=kind==='basis'?SWAPLOTTING_BASIS:SWAPLOTTING_TAX;if(!mutable()||state.screen!=='unregistered'||!Number.isInteger(index)||index<0||index>=list.length)return false;if(state[kind]!==list[index]||state[kind+'Index']!==index)retirePhotoContext();state[kind]=list[index];state[kind+'Index']=index;state.validation=null;emit();return true;}
 function setField(key,value){if(!mutable()||state.screen==='map'||typeof value!=='string')return false;const fields=state.screen==='registered'?['number','review']:['address','basisNumber','basisDescription','taxNumber','taxDescription','review'];if(!fields.includes(key))return false;state.fields[key]=value;if(state.validation)state.validation=swaplottingValidate(state.screen,state);emit();return true;}
 function validate(){if(!mutable()||state.screen==='map')return false;state.validation=swaplottingValidate(state.screen,state);emit();return state.validation.ok;}
 function applyPhoto(path,oldPath=null){
  if(!mutable()||!['registered','unregistered'].includes(state.screen)||!swaplottingPhotoPath(path,photoOrigin))return false;
  const photos=state.photos??[];
  if(oldPath===null){if(photos.length>=5)return false;state.photos=[...photos,path];}
  else{if(!swaplottingPhotoPath(oldPath,photoOrigin)||!photos.includes(oldPath))return false;state.photos=photos.map(value=>value===oldPath?path:value);}
  retirePhotoContext();if(state.validation)state.validation=swaplottingValidate(state.screen,state);emit();return true;
 }
 function removePhoto(path){if(!mutable()||!['registered','unregistered'].includes(state.screen)||!swaplottingPhotoPath(path,photoOrigin)||!state.photos?.includes(path))return false;state.photos=state.photos.filter(value=>value!==path);retirePhotoContext();if(state.validation)state.validation=swaplottingValidate(state.screen,state);emit();return true;}
 function setProfile(value){if(!current())return false;profileSource=value;const before=JSON.stringify(state.owner);refreshOwner();if(before===JSON.stringify(state.owner))return true;retirePhotoContext();if(state.screen!=='map'){applyOwner();if(state.validation)state.validation=swaplottingValidate(state.screen,state);}emit();return true;}
 function dispose(){if(!alive)return;alive=false;profileSource=null;for(const kind of Object.keys(requests))retire(kind);clearForm();state.cameraTarget=state.targetProvenance=null;state.coordinateDraft={longitude:'',latitude:'',declaredWgs84:false};state.coordinateError='';state.owner={status:'unresolved',data:null};state.disclaimer=null;state.disclaimerStatus='idle';state.disclaimerVisible=state.disclaimerAcknowledged=state.canOpenForm=false;state.errors={disclaimer:'',offices:'',regions:''};state.screen='disposed';state.revision++;}
 return {snapshot,loadDisclaimer,acceptDisclaimer,declineDisclaimer,setCameraTarget,setCoordinateDraft,setCoordinateError,applyCoordinateTarget,openForm,backToMap,loadOffices,selectOffice,selectRegion,selectRight,selectBasis:index=>selectProof('basis',index),selectTax:index=>selectProof('tax',index),setField,validate,applyPhoto,removePhoto,setProfile,dispose};
}
